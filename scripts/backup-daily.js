#!/usr/bin/env node
'use strict';

/**
 * Daily backup: Oracle data (logical SQL dump) + uploads + Evolution PG.
 *
 * Output:  /var/www/html/allways/backups/diarios/YYYY-MM-DD/
 *   - allways-oracle-YYYY-MM-DD.sql.gz
 *   - allways-uploads-YYYY-MM-DD.tar.gz
 *   - evolution-postgres-YYYY-MM-DD.sql.gz
 *   - evolution-redis-YYYY-MM-DD.rdb     (best-effort copy)
 *   - manifest.json
 *
 * Retention: 30 days. Older directories are deleted.
 *
 * Off-site rsync: configure RSYNC_TARGET in /var/www/html/allways/backend/.env
 *   e.g. RSYNC_TARGET=user@host:/path/to/remote/backups
 *   Leave empty to skip remote sync.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { spawn, execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ENV_FILE = path.join(ROOT, 'backend', '.env');
const BACKUPS_BASE = path.join(ROOT, 'backups', 'diarios');

// Load backend .env BEFORE reading any env-driven constant.
if (fs.existsSync(ENV_FILE)) {
  for (const line of fs.readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

// Local retention. Override with BACKUP_RETENTION_DAYS env var. Remote
// retention is governed by the rsync target's --delete-after policy
// (so removing rows here propagates to off-site mirror).
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS, 10) || 30;

const oracledb = require(path.join(ROOT, 'backend', 'node_modules', 'oracledb'));
oracledb.initOracleClient({ configDir: '/usr/lib/oracle/19.25/client64/lib/network/admin' });
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

function log(...a) { console.log(`[BACKUP ${new Date().toISOString()}]`, ...a); }
function err(...a) { console.error(`[BACKUP ${new Date().toISOString()}]`, ...a); }

function todayStamp() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function quoteSqlValue(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  if (v instanceof Date) {
    const iso = v.toISOString().replace('T', ' ').replace('Z', '').split('.')[0];
    return `TO_TIMESTAMP('${iso}', 'YYYY-MM-DD HH24:MI:SS')`;
  }
  if (Buffer.isBuffer(v)) return `HEXTORAW('${v.toString('hex')}')`;
  const s = String(v).replace(/'/g, "''");
  return `'${s}'`;
}

async function dumpAllwaysSchema(outPath) {
  const conn = await oracledb.getConnection({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECTION_STRING,
  });
  log('Oracle conectado.');

  // Discover ALLWAYS_* tables dynamically (covers future tables)
  const tablesResult = await conn.execute(`
    SELECT TABLE_NAME FROM USER_TABLES
    WHERE TABLE_NAME LIKE 'ALLWAYS\\_%' ESCAPE '\\'
    ORDER BY TABLE_NAME
  `);
  const tables = tablesResult.rows.map((r) => r.TABLE_NAME);
  log(`Tablas a respaldar: ${tables.length}`);

  const gz = zlib.createGzip({ level: 6 });
  const file = fs.createWriteStream(outPath);
  gz.pipe(file);

  // Register error handler ONCE — previously `gz.once('error', reject)` inside
  // writeLine added a listener per call and tripped MaxListenersExceededWarning
  // after ~10 writes. Now any future write fails fast if gz already errored.
  let gzError = null;
  gz.on('error', (e) => { gzError = e; });
  file.on('error', (e) => { gzError = gzError || e; });

  const writeLine = (s) => new Promise((resolve, reject) => {
    if (gzError) return reject(gzError);
    if (gz.write(s + '\n')) resolve();
    else gz.once('drain', resolve);
  });

  await writeLine(`-- Allways Oracle daily backup`);
  await writeLine(`-- Generated: ${new Date().toISOString()}`);
  await writeLine(`-- Tables: ${tables.length}`);
  await writeLine(`SET DEFINE OFF;`);
  await writeLine('');

  const counts = {};
  for (const table of tables) {
    log(`Dump ${table}...`);
    const r = await conn.execute(`SELECT * FROM ${table}`);
    const rows = r.rows || [];
    counts[table] = rows.length;
    if (rows.length === 0) {
      await writeLine(`-- ${table}: 0 rows`);
      continue;
    }
    const cols = Object.keys(rows[0]);
    await writeLine(`-- ${table}: ${rows.length} rows`);
    for (const row of rows) {
      const vals = [];
      for (const c of cols) {
        let v = row[c];
        if (v && typeof v.getData === 'function') v = await v.getData();
        vals.push(quoteSqlValue(v));
      }
      await writeLine(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${vals.join(', ')});`);
    }
    await writeLine('');
  }
  await writeLine('COMMIT;');
  await new Promise((resolve) => gz.end(resolve));
  await new Promise((resolve) => file.on('finish', resolve));
  await conn.close();
  return counts;
}

function tarUploads(outPath) {
  return new Promise((resolve, reject) => {
    const uploadsDir = path.join(ROOT, 'backend', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.writeFileSync(outPath + '.empty', '');
      return resolve({ skipped: true });
    }
    log('Empaquetando uploads...');
    const proc = spawn('tar', ['-czf', outPath, '-C', path.dirname(uploadsDir), 'uploads']);
    proc.on('exit', (code) => {
      if (code === 0) resolve({ ok: true });
      else reject(new Error(`tar exit code ${code}`));
    });
    proc.on('error', reject);
  });
}

function dumpEvolutionPg(outPath) {
  return new Promise((resolve) => {
    const pwd = (() => {
      try { return fs.readFileSync('/root/.evolution_db_pass', 'utf8').trim(); }
      catch { return null; }
    })();
    if (!pwd) { log('Saltando dump Postgres Evolution (sin credenciales).'); return resolve({ skipped: true }); }
    log('Dump Evolution Postgres...');
    const env = { ...process.env, PGPASSWORD: pwd };
    const proc = spawn('pg_dump', ['-h', '127.0.0.1', '-U', 'evolution_user', '-d', 'evolution_db', '-F', 'p', '--no-owner'], { env });
    const gz = zlib.createGzip({ level: 6 });
    const out = fs.createWriteStream(outPath);
    proc.stdout.pipe(gz).pipe(out);
    let errBuf = '';
    proc.stderr.on('data', (d) => { errBuf += d.toString(); });
    let exitCode = null;
    proc.on('exit', (code) => { exitCode = code; });
    proc.on('error', (e) => { err('pg_dump error:', e.message); resolve({ skipped: true, error: e.message }); });
    out.on('finish', () => {
      if (exitCode === 0) resolve({ ok: true });
      else { err('pg_dump fallo:', errBuf.slice(0, 400)); resolve({ skipped: true, error: errBuf.slice(0, 400) }); }
    });
  });
}

function copyRedisRdb(outPath) {
  // best-effort: trigger BGSAVE then copy /var/lib/redis/dump.rdb
  try {
    execSync('redis-cli BGSAVE', { stdio: 'pipe' });
    // wait for BGSAVE to complete (poll lastsave)
    const start = Date.now();
    let last = parseInt(execSync('redis-cli LASTSAVE').toString().trim(), 10);
    while (Date.now() - start < 30000) {
      const next = parseInt(execSync('redis-cli LASTSAVE').toString().trim(), 10);
      if (next > last) break;
      execSync('sleep 0.5');
    }
    if (fs.existsSync('/var/lib/redis/dump.rdb')) {
      fs.copyFileSync('/var/lib/redis/dump.rdb', outPath);
      return { ok: true };
    }
    return { skipped: true, reason: 'rdb not found' };
  } catch (e) {
    return { skipped: true, error: e.message };
  }
}

function pruneOld() {
  if (!fs.existsSync(BACKUPS_BASE)) return;
  const cutoff = Date.now() - RETENTION_DAYS * 86400 * 1000;
  for (const name of fs.readdirSync(BACKUPS_BASE)) {
    const full = path.join(BACKUPS_BASE, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory() && stat.mtimeMs < cutoff) {
      log(`Eliminando viejo: ${name}`);
      fs.rmSync(full, { recursive: true, force: true });
    }
  }
}

function offsiteRsync(srcDir) {
  const target = process.env.RSYNC_TARGET;
  if (!target) { log('RSYNC_TARGET no configurado, saltando off-site.'); return { skipped: true }; }
  const opts = (process.env.RSYNC_OPTS || '-az --delete-after').split(/\s+/);
  const sshOpts = process.env.RSYNC_SSH_OPTS;
  const args = [...opts];
  if (sshOpts) { args.push('-e'); args.push(`ssh ${sshOpts}`); }
  args.push(srcDir + '/');
  args.push(target);
  try {
    log(`rsync -> ${target}`);
    execSync(`rsync ${args.map((a) => JSON.stringify(a)).join(' ')}`, { stdio: 'pipe' });
    return { ok: true };
  } catch (e) {
    err('rsync fallo:', e.message);
    return { error: e.message };
  }
}

(async () => {
  const stamp = todayStamp();
  const dir = path.join(BACKUPS_BASE, stamp);
  fs.mkdirSync(dir, { recursive: true });

  const manifest = {
    stamp,
    started: new Date().toISOString(),
    artifacts: {}
  };

  try {
    const oraclePath = path.join(dir, `allways-oracle-${stamp}.sql.gz`);
    const counts = await dumpAllwaysSchema(oraclePath);
    manifest.artifacts.oracle = { file: path.basename(oraclePath), counts, size: fs.statSync(oraclePath).size };
  } catch (e) {
    err('Oracle dump fallo:', e.message);
    manifest.artifacts.oracle = { error: e.message };
  }

  try {
    const uploadsPath = path.join(dir, `allways-uploads-${stamp}.tar.gz`);
    const r = await tarUploads(uploadsPath);
    if (r.ok) manifest.artifacts.uploads = { file: path.basename(uploadsPath), size: fs.statSync(uploadsPath).size };
    else manifest.artifacts.uploads = r;
  } catch (e) {
    err('Uploads tar fallo:', e.message);
    manifest.artifacts.uploads = { error: e.message };
  }

  const pgPath = path.join(dir, `evolution-postgres-${stamp}.sql.gz`);
  const pgr = await dumpEvolutionPg(pgPath);
  if (pgr.ok) manifest.artifacts.evolutionPostgres = { file: path.basename(pgPath), size: fs.statSync(pgPath).size };
  else manifest.artifacts.evolutionPostgres = pgr;

  const rdbPath = path.join(dir, `evolution-redis-${stamp}.rdb`);
  const rdbr = copyRedisRdb(rdbPath);
  if (rdbr.ok) manifest.artifacts.evolutionRedis = { file: path.basename(rdbPath), size: fs.statSync(rdbPath).size };
  else manifest.artifacts.evolutionRedis = rdbr;

  manifest.finished = new Date().toISOString();
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  log('Backup completo:', dir);

  pruneOld();
  manifest.offsite = offsiteRsync(BACKUPS_BASE);
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  await alertOnFailure(manifest);
})().catch(async (e) => {
  err('FATAL:', e.message);
  console.error(e);
  // Best-effort alert on catastrophic failure
  try {
    await alertOnFailure({
      stamp: todayStamp(),
      artifacts: { fatal: { error: e.message } }
    });
  } catch {}
  process.exit(1);
});

/**
 * Scan manifest for errors. If any exist and BACKUP_ALERT_PHONE is set,
 * send a WhatsApp via the same Evolution API used by the app. Best-effort:
 * a failure to alert is logged but does not affect backup exit status.
 *
 * Configure via .env:
 *   BACKUP_ALERT_PHONE=595XXXXXXXXX
 *   EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE_NAME (already set)
 */
function collectErrors(manifest) {
  const out = [];
  for (const [name, art] of Object.entries(manifest.artifacts || {})) {
    if (art && art.error) out.push(`X ${name}: ${String(art.error).slice(0, 200)}`);
    else if (art && art.skipped && !art.ok) out.push(`! ${name}: skipped`);
  }
  if (manifest.offsite && manifest.offsite.error) {
    out.push(`X offsite: ${String(manifest.offsite.error).slice(0, 200)}`);
  }
  return out;
}

async function alertOnFailure(manifest) {
  const phone = process.env.BACKUP_ALERT_PHONE;
  if (!phone) { log('BACKUP_ALERT_PHONE no configurado, alerting deshabilitado.'); return; }

  const errors = collectErrors(manifest);
  if (errors.length === 0) { log('Backup sin errores, no alert.'); return; }

  const url = (process.env.EVOLUTION_API_URL || 'http://localhost:8080').replace(/\/$/, '');
  const apikey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE_NAME || 'allways-campana';
  if (!apikey) { err('EVOLUTION_API_KEY no configurada, no se puede alertar.'); return; }

  const text =
    `*Backup ${manifest.stamp || todayStamp()} con errores*\n\n` +
    errors.join('\n') +
    `\n\nLog: /var/log/allways-backup.log`;

  try {
    const axios = require(path.join(ROOT, 'backend', 'node_modules', 'axios'));
    await axios.post(
      `${url}/message/sendText/${instance}`,
      { number: phone, text },
      { headers: { apikey }, timeout: 10000 }
    );
    log(`Alert WhatsApp enviada a ${phone} (${errors.length} error${errors.length === 1 ? '' : 'es'}).`);
  } catch (e) {
    err('No se pudo enviar alert WhatsApp:', e.message);
  }
}
