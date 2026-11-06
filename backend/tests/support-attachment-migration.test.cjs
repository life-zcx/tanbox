const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');

test('attachment migration preserves legacy leads without trusting notes and enforces ownership constraints', async () => {
  const db = new PGlite();
  try {
    const dir = path.join(__dirname, '../prisma/migrations');
    const target = '20261105120000_support_attachment_ownership';
    for (const name of fs.readdirSync(dir).sort()) {
      const file = path.join(dir, name, 'migration.sql');
      if (name < target && fs.existsSync(file)) await db.exec(fs.readFileSync(file, 'utf8'));
    }
    await db.query(`INSERT INTO "User" (id,email,password,"companyName","binIin",phone,"updatedAt")
      VALUES ('owner','fixture@example.test','fixture','Fixture','000000000001','00000000000',NOW())`);
    const notes = JSON.stringify({ type: 'BUG_REPORT', screenshotPath: '/api/support/bug-reports/attachment/legacy.png' });
    await db.query(`INSERT INTO "ServiceLead" (id,"serviceTitle","companyName",phone,email,notes,"updatedAt")
      VALUES ('legacy','Fixture','Fixture','00000000000','fixture@example.test',$1,NOW())`, [notes]);
    await db.exec(fs.readFileSync(path.join(dir, target, 'migration.sql'), 'utf8'));
    assert.equal((await db.query('SELECT count(*)::int AS n FROM "SupportAttachment"')).rows[0].n, 0);
    assert.equal((await db.query('SELECT notes FROM "ServiceLead" WHERE id=$1', ['legacy'])).rows[0].notes, notes);

    const insert = (id, filename, ownerId = 'owner', leadId = 'legacy') => db.query(
      'INSERT INTO "SupportAttachment" (id,filename,"originalName","ownerId","leadId") VALUES ($1,$2,$3,$4,$5)',
      [id, filename, 'fixture.png', ownerId, leadId]);
    await insert('attachment-a', 'fixture.png');
    await assert.rejects(insert('duplicate-name', 'fixture.png'), /SupportAttachment_filename_key/);
    await assert.rejects(insert('bad-owner', 'owner.png', 'missing'), /SupportAttachment_ownerId_fkey/);
    await assert.rejects(insert('bad-lead', 'lead.png', 'owner', 'missing'), /SupportAttachment_leadId_fkey/);
    await db.query('DELETE FROM "ServiceLead" WHERE id=$1', ['legacy']);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM "SupportAttachment"')).rows[0].n, 0);

    await db.query(`INSERT INTO "ServiceLead" (id,"serviceTitle","companyName",phone,"updatedAt") VALUES ('new','Fixture','Fixture','00000000000',NOW())`);
    await insert('attachment-b', 'second.png', 'owner', 'new');
    await db.query('DELETE FROM "User" WHERE id=$1', ['owner']);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM "SupportAttachment"')).rows[0].n, 0);
  } finally {
    await db.close();
  }
});
