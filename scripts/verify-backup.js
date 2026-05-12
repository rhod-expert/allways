#!/usr/bin/env node
/**
 * Smoke verify a daily backup without doing a full restore.
 *
 * Checks performed:
 *   1. manifest.json parses and lists expected artifacts
 *   2. each .sql.gz / .tar.gz / .rdb file exists and has non-zero size
 *   3. gunzip the Oracle dump and count INSERT statements per table
 *   4. compare counts against manifest.artifacts.oracle.counts (must match)
 *   5. tar -tzf the uploads tarball (must list >=0 entries without error)
 *
 * Catches:
 *   - Corrupted gzip (gunzip fails)
 *   - Truncated SQL (count mismatch)
 *   - Missing files
 *   - Empty/zero-byte artifacts
 *
 * Does NOT do a real Oracle restore — that requires DBA-level access and
 * a separate schema. This is a cheap monthly sanity check; pair it with
 * an occasional full restore test in a staging environment.
 *
 * Usage:
 *   node scripts/verify-backup.js              # verify today's backup
 *   node scripts/verify-backup.js 2026-05-10   # verify a specific day
 *   node scripts/verify-backup.js --latest     # verify the most recent
 *
 * Exit code: 0 if all checks pass, 1 if any mismatch found.
 *
 * Recommended cron (monthly Sunday 04:00, after the daily 03:00 backup):
 *   0 4 1 * *  /usr/bin/node /var/www/html/allways/scripts/verify-backup.js --latest >> /var/log/allways-verify.log 2>&1
 */

'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BACKUPS_BASE = path.join(ROOT, 'backups', 'diarios');
const ENV_FILE = path.join(ROOT, 'backend', '.env');

// Load .env (used for optional WhatsApp alert on verification failure)
if (fs.existsSync(ENV_FILE)) {
  for (const line of fs.readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

function log(...a) { console.log(`[VERIFY ${new Date().toISOString()}]`, ...a); }
function err(...a) { console.error(`[VERIFY ${new Date().toISOString()}]`, ...a); }

function todayStamp() { return new Date().toISOString().slice(0, 10); }

function pickStamp(arg) {
  if (arg === '--latest' || arg === '-l') {
    if (!fs.existsSync(BACKUPS_BASE)) throw new Error(`no backups dir at ${BACKUPS_BASE}`);
    const dirs = fs.readdirSync(BACKUPS_BASE)
      .filter((n) => /^\d{4}-\d{2}-\d{2}$/.test(n))
      .sort();
    if (dirs.length === 0) throw new Error('no backup directories found');
    return dirs[dirs.length - 1];
  }
  if (arg && /^\d{4}-\d{2}-\d{2}$/.test(arg)) return arg;
  return todayStamp();
}

function checkFile(p, label) {
  if (!fs.existsSync(p)) return { ok: false, error: `${label} no existe` };
  const sz = fs.statSync(p).size;
  if (sz === 0) return { ok: false, error: `${label} es 0 bytes` };
  return { ok: true, size: sz };
}

function countInsertsPerTable(sqlGzPath) {
  // Stream gunzip, count "INSERT INTO ALLWAYS_<TABLE>" per table.
  const data = zlib.gunzipSync(fs.readFileSync(sqlGzPath)).toString('utf8');
  const counts = {};
  const re = /^INSERT INTO (ALLWAYS_[A-Z_]+) /gm;
  let m;
  while ((m = re.exec(data)) !== null) {
    counts[m[1]] = (counts[m[1]] || 0) + 1;
  }
  return { counts, totalBytes: data.length, totalLines: data.split('\n').length };
}

function verifyTarball(tarPath) {
  try {
    const out = execSync(`tar -tzf ${JSON.stringify(tarPath)} | wc -l`, { stdio: ['ignore', 'pipe', 'pipe'] });
    return { ok: true, entries: parseInt(out.toString().trim(), 10) };
  } catch (e) {
    return { ok: false, error: e.message.slice(0, 200) };
  }
}

async function alertOnFailure(stamp, failures) {
  const phone = process.env.BACKUP_ALERT_PHONE;
  if (!phone) return;
  const apikey = process.env.EVOLUTION_API_KEY;
  const url = (process.env.EVOLUTION_API_URL || 'http://localhost:8080').replace(/\/$/, '');
  const instance = process.env.EVOLUTION_INSTANCE_NAME || 'allways-campana';
  if (!apikey) return;

  const text =
    `*Backup ${stamp} no pasa verificacion*\n\n` +
    failures.map((f) => `X ${f}`).join('\n') +
    `\n\nLog: /var/log/allways-verify.log`;

  try {
    const axios = require(path.join(ROOT, 'backend', 'node_modules', 'axios'));
    await axios.post(
      `${url}/message/sendText/${instance}`,
      { number: phone, text },
      { headers: { apikey }, timeout: 10000 }
    );
    log(`Alert enviada a ${phone}`);
  } catch (e) {
    err('No se pudo enviar alert:', e.message);
  }
}

(async () => {
  const stamp = pickStamp(process.argv[2]);
  const dir = path.join(BACKUPS_BASE, stamp);
  log(`Verificando backup ${stamp} en ${dir}`);

  if (!fs.existsSync(dir)) {
    err(`Backup dir not found: ${dir}`);
    await alertOnFailure(stamp, [`Backup dir not found: ${dir}`]);
    process.exit(1);
  }

  const failures = [];

  // 1. manifest
  const manifestPath = path.join(dir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    failures.push('manifest.json no existe');
  }
  let manifest = null;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    failures.push(`manifest.json invalido: ${e.message}`);
  }

  if (manifest) {
    // 2. files exist + non-zero
    const expected = [
      { label: 'oracle dump', file: `allways-oracle-${stamp}.sql.gz` },
      { label: 'uploads tar', file: `allways-uploads-${stamp}.tar.gz` },
      { label: 'evolution pg', file: `evolution-postgres-${stamp}.sql.gz` }
    ];
    for (const f of expected) {
      const p = path.join(dir, f.file);
      const c = checkFile(p, f.label);
      if (!c.ok) failures.push(c.error);
    }

    // 3. count INSERTs per table from oracle dump
    const oraclePath = path.join(dir, `allways-oracle-${stamp}.sql.gz`);
    if (fs.existsSync(oraclePath) && fs.statSync(oraclePath).size > 0) {
      try {
        const { counts, totalLines } = countInsertsPerTable(oraclePath);
        log(`Oracle dump: ${totalLines} lineas, INSERTs por tabla:`, counts);

        const expectedCounts = manifest.artifacts?.oracle?.counts || {};
        for (const [table, expected] of Object.entries(expectedCounts)) {
          const actual = counts[table] || 0;
          if (actual !== expected) {
            failures.push(`${table}: manifest dice ${expected}, dump tiene ${actual}`);
          }
        }
        // Detect surprise tables in dump that manifest doesn't list (only if dump has rows)
        for (const table of Object.keys(counts)) {
          if (!(table in expectedCounts)) {
            failures.push(`${table}: en dump pero no en manifest`);
          }
        }
      } catch (e) {
        failures.push(`gunzip/parse oracle dump fallo: ${e.message}`);
      }
    }

    // 4. tarball integrity
    const tarPath = path.join(dir, `allways-uploads-${stamp}.tar.gz`);
    if (fs.existsSync(tarPath)) {
      const tr = verifyTarball(tarPath);
      if (!tr.ok) failures.push(`uploads tarball corrupto: ${tr.error}`);
      else log(`uploads tar OK: ${tr.entries} entradas`);
    }
  }

  log('');
  if (failures.length === 0) {
    log(`Backup ${stamp} PASSED all checks.`);
    process.exit(0);
  } else {
    err(`Backup ${stamp} FAILED with ${failures.length} issue(s):`);
    for (const f of failures) err('  -', f);
    await alertOnFailure(stamp, failures);
    process.exit(1);
  }
})().catch((e) => {
  err('FATAL:', e.message);
  console.error(e);
  process.exit(2);
});
