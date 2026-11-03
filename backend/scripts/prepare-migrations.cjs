// Adopt the baseline only when an existing database exactly matches it.
// All Prisma commands inherit DATABASE_URL; credentials are never command-line arguments.
const { PrismaClient } = require('@prisma/client');
const { spawnSync } = require('child_process');
const path = require('path');
const baseline = '20261001000000_baseline';
const prisma = new PrismaClient();
function command(args) {
  const result = spawnSync(process.execPath, [path.join(__dirname, '../node_modules/prisma/build/index.js'), ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
  if (result.status !== 0) throw new Error('Migration preflight failed. Inspect schema drift before deploying; no automatic db push is permitted.');
}
(async () => {
  try {
    const [{ exists }] = await prisma.$queryRaw`SELECT to_regclass('public."User"') IS NOT NULL AS "exists"`;
    if (!exists) return; // Empty database: migrate deploy creates the complete baseline.
    const [{ history }] = await prisma.$queryRaw`SELECT to_regclass('public._prisma_migrations') IS NOT NULL AS history`;
    if (history) {
      const records = await prisma.$queryRaw`SELECT finished_at FROM _prisma_migrations WHERE migration_name = ${baseline} AND rolled_back_at IS NULL`;
      if (records.some(row => row.finished_at)) return;
      if (records.length) throw new Error('Baseline migration failed previously; resolve it explicitly before deploying.');
    }
    command(['migrate', 'diff', '--from-schema-datasource', 'prisma/schema.prisma', '--to-schema-datamodel', 'prisma/schema.prisma', '--exit-code']);
    command(['migrate', 'resolve', '--applied', baseline]);
    console.log('Existing database verified and migration baseline adopted.');
  } finally { await prisma.$disconnect(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
