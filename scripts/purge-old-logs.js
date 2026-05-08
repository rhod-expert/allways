#!/usr/bin/env node
/**
 * Purge old audit log rows past the configured retention window.
 *
 * Retention default is 12 months. Override with RETENTION_MONTHS=N env var
 * or --months=N flag. Use --dry-run to count without deleting.
 *
 * Tables affected:
 *   - ALLWAYS_ADMIN_LOG       (admin actions)
 *   - ALLWAYS_CLIENTE_LOG     (cliente login / recovery / password changes)
 *   - ALLWAYS_WA_LOG_NOTIF    (WhatsApp notification attempts)
 *
 * Recommended cron (run on the app server):
 *   0 4 * * 0  cd /var/www/html/allways/backend && \
 *              node ../scripts/purge-old-logs.js >> /var/log/allways-purge.log 2>&1
 *
 * Tables NOT affected (kept indefinitely):
 *   - ALLWAYS_ADMIN_LOG entries flagged as audit-relevant for sorteo events
 *     (we don't currently flag them — flag column TBD if needed for legal)
 */

'use strict';

const path = require('path');
const BACKEND = path.resolve(__dirname, '../backend');

// Resolve deps from backend's node_modules so we don't duplicate them.
require(path.join(BACKEND, 'node_modules/dotenv')).config({
  path: path.join(BACKEND, '.env')
});

const db = require(path.join(BACKEND, 'src/config/database'));

function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const monthsArg = args.find((a) => a.startsWith('--months='));
  const months = monthsArg
    ? parseInt(monthsArg.split('=')[1], 10)
    : parseInt(process.env.RETENTION_MONTHS, 10) || 12;
  if (isNaN(months) || months < 1) {
    console.error('Invalid retention months:', months);
    process.exit(2);
  }
  return { dryRun, months };
}

const TABLES = [
  { name: 'ALLWAYS_ADMIN_LOG', dateColumn: 'FECHA' },
  { name: 'ALLWAYS_CLIENTE_LOG', dateColumn: 'FECHA' },
  { name: 'ALLWAYS_WA_LOG_NOTIF', dateColumn: 'FECHA' }
];

async function main() {
  const { dryRun, months } = parseArgs();
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);

  console.log('[PURGE]', new Date().toISOString());
  console.log('[PURGE] Retention:', months, 'months');
  console.log('[PURGE] Cutoff (rows older than this are deleted):', cutoff.toISOString());
  console.log('[PURGE] Dry run:', dryRun);
  console.log('---');

  await db.initialize();
  let totalDeleted = 0;

  try {
    for (const t of TABLES) {
      // First check the column exists (defensive: handle missing tables in dev)
      const colCheck = await db.execute(
        'SELECT COUNT(*) AS C FROM USER_TAB_COLUMNS WHERE TABLE_NAME = :t AND COLUMN_NAME = :c',
        { t: t.name, c: t.dateColumn }
      );
      if (!colCheck.rows[0] || colCheck.rows[0].C === 0) {
        console.log('[SKIP]', t.name, '— column', t.dateColumn, 'not found');
        continue;
      }

      const countResult = await db.execute(
        `SELECT COUNT(*) AS C FROM ${t.name} WHERE ${t.dateColumn} < :cutoff`,
        { cutoff }
      );
      const eligible = countResult.rows[0].C;

      if (eligible === 0) {
        console.log('[OK]', t.name, '— 0 rows to purge');
        continue;
      }

      if (dryRun) {
        console.log('[DRY]', t.name, '— would delete', eligible, 'rows');
        continue;
      }

      const delResult = await db.execute(
        `DELETE FROM ${t.name} WHERE ${t.dateColumn} < :cutoff`,
        { cutoff },
        { autoCommit: true }
      );
      console.log('[OK]', t.name, '— deleted', delResult.rowsAffected, 'rows');
      totalDeleted += delResult.rowsAffected || 0;
    }
  } finally {
    await db.close();
  }

  console.log('---');
  console.log('[PURGE] Total rows deleted:', totalDeleted);
}

main().catch((err) => {
  console.error('[PURGE] FATAL:', err.message);
  process.exit(1);
});
