const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');

test('a fresh PostgreSQL database accepts the baseline and every historical migration', async () => {
  const db = new PGlite();
  try {
    const migrations = path.join(__dirname, '../prisma/migrations');
    for (const name of fs.readdirSync(migrations).sort()) {
      const file = path.join(migrations, name, 'migration.sql');
      if (fs.existsSync(file)) await db.exec(fs.readFileSync(file, 'utf8'));
    }
    const { rows } = await db.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'User'`);
    assert.ok(rows.some(row => row.column_name === 'tokenVersion'));
    assert.ok(rows.some(row => row.column_name === 'balance'));
    const result = await db.query(`SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema = 'public'`);
    assert.ok(result.rows[0].count >= 10);
  } finally { await db.close(); }
});
