'use strict';

/**
 * Pre-launch cleanup: wipes test data from PARTICIPANTES, REGISTROS, CUPONES,
 * and resets sorteo state on PREMIOS. Single transaction with autoCommit OFF —
 * commits only after final verification.
 *
 * Preserves: ALLWAYS_ADMIN, ALLWAYS_ADMIN_LOG, ALLWAYS_PREMIOS rows, ALLWAYS_GEO_*
 *
 * Usage: node scripts/cleanup-pre-launch.js
 */

const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', 'backend', '.env');
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const oracledb = require(path.resolve(__dirname, '..', 'backend', 'node_modules', 'oracledb'));
oracledb.initOracleClient({ configDir: '/usr/lib/oracle/19.25/client64/lib/network/admin' });
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const BACKUP_DIR = path.resolve(__dirname, '..', 'backups', 'pre-launch-2026-04-30');
const COUNTS_AFTER_FILE = path.join(BACKUP_DIR, 'counts-after.txt');

(async () => {
  const conn = await oracledb.getConnection({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECTION_STRING
  });

  try {
    console.log('[CLEANUP] Conectado. autoCommit=OFF (transacción manual)');

    // Step 1: BEFORE counts (sanity check vs backup)
    const before = (await conn.execute(`
      SELECT
        (SELECT COUNT(*) FROM ALLWAYS_PARTICIPANTES) AS PARTICIPANTES,
        (SELECT COUNT(*) FROM ALLWAYS_REGISTROS) AS REGISTROS,
        (SELECT COUNT(*) FROM ALLWAYS_CUPONES) AS CUPONES,
        (SELECT COUNT(*) FROM ALLWAYS_PREMIOS WHERE CUPON_GANADOR_ID IS NOT NULL) AS PREMIOS_SORTEADOS,
        (SELECT COUNT(*) FROM ALLWAYS_ADMIN) AS ADMINS
      FROM DUAL
    `)).rows[0];
    console.log('[CLEANUP] Antes:', before);

    // Step 2: Reset PREMIOS sorteo state (releases FK to CUPONES)
    const r1 = await conn.execute(
      `UPDATE ALLWAYS_PREMIOS SET CUPON_GANADOR_ID = NULL, FECHA_SORTEO = NULL WHERE CUPON_GANADOR_ID IS NOT NULL OR FECHA_SORTEO IS NOT NULL`
    );
    console.log(`[CLEANUP] PREMIOS reset: ${r1.rowsAffected} fila(s) actualizada(s)`);

    // Step 3: DELETE in FK order (children first)
    const r2 = await conn.execute(`DELETE FROM ALLWAYS_CUPONES`);
    console.log(`[CLEANUP] CUPONES borrados: ${r2.rowsAffected}`);

    const r3 = await conn.execute(`DELETE FROM ALLWAYS_REGISTROS`);
    console.log(`[CLEANUP] REGISTROS borrados: ${r3.rowsAffected}`);

    const r4 = await conn.execute(`DELETE FROM ALLWAYS_PARTICIPANTES`);
    console.log(`[CLEANUP] PARTICIPANTES borrados: ${r4.rowsAffected}`);

    // Step 4: AFTER counts (pre-commit verification)
    const after = (await conn.execute(`
      SELECT
        (SELECT COUNT(*) FROM ALLWAYS_PARTICIPANTES) AS PARTICIPANTES,
        (SELECT COUNT(*) FROM ALLWAYS_REGISTROS) AS REGISTROS,
        (SELECT COUNT(*) FROM ALLWAYS_CUPONES) AS CUPONES,
        (SELECT COUNT(*) FROM ALLWAYS_PREMIOS) AS PREMIOS_TOTAL,
        (SELECT COUNT(*) FROM ALLWAYS_PREMIOS WHERE CUPON_GANADOR_ID IS NOT NULL) AS PREMIOS_SORTEADOS,
        (SELECT COUNT(*) FROM ALLWAYS_ADMIN) AS ADMINS,
        (SELECT COUNT(*) FROM ALLWAYS_ADMIN_LOG) AS ADMIN_LOG,
        (SELECT COUNT(*) FROM ALLWAYS_GEO_DEPARTAMENTOS) AS GEO_DEPTOS
      FROM DUAL
    `)).rows[0];
    console.log('[CLEANUP] Después (pre-commit):', after);

    // Sanity check before commit
    const bad =
      after.PARTICIPANTES !== 0 ||
      after.REGISTROS !== 0 ||
      after.CUPONES !== 0 ||
      after.PREMIOS_TOTAL !== 30 ||
      after.PREMIOS_SORTEADOS !== 0 ||
      after.ADMINS !== before.ADMINS;

    if (bad) {
      console.error('[CLEANUP] FALLA EN VERIFICACIÓN — ROLLBACK');
      await conn.rollback();
      process.exit(2);
    }

    await conn.commit();
    console.log('[CLEANUP] COMMIT OK');

    fs.writeFileSync(COUNTS_AFTER_FILE, JSON.stringify(after, null, 2) + '\n');
    console.log(`[CLEANUP] Contagens escritas: ${COUNTS_AFTER_FILE}`);
  } finally {
    await conn.close();
  }
})().catch((e) => {
  console.error('[CLEANUP] ERROR:', e.message);
  console.error(e);
  process.exit(1);
});
