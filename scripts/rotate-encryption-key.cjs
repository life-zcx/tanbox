// Prepared operational tool. Default is validation only; never prints keys or plaintext.
const crypto = require('node:crypto');
const path = require('node:path');
const { PrismaClient } = require(path.join(__dirname, '../backend/node_modules/@prisma/client'));
const before = process.env.OLD_ENCRYPTION_SECRET, after = process.env.NEW_ENCRYPTION_SECRET;
if (!process.env.DATABASE_URL || !before || !after || after.length < 32 || before === after) throw new Error('Set explicit DATABASE_URL, OLD_ENCRYPTION_SECRET and a different NEW_ENCRYPTION_SECRET (32+ characters)');
const apply = process.argv.includes('--apply');
const key = value => crypto.createHash('sha256').update(value).digest();
function reencrypt(value) {
  if (!value) return value;
  const [iv, tag, content] = value.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(before), Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  const plain = Buffer.concat([decipher.update(Buffer.from(content, 'hex')), decipher.final()]);
  try {
    const nonce = crypto.randomBytes(12), cipher = crypto.createCipheriv('aes-256-gcm', key(after), nonce);
    const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
    return `${nonce.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted.toString('hex')}`;
  } finally { plain.fill(0); }
}
const db = new PrismaClient();
(async () => {
  let count = 0;
  await db.$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(781224951)`;
    let cursor;
    for (;;) {
      const rows = await tx.markirovkaAccount.findMany({ take: 200, orderBy: { id: 'asc' }, ...(cursor ? { where: { id: { gt: cursor } } } : {}) });
      if (!rows.length) break;
      for (const row of rows) {
        const encryptedPassword = reencrypt(row.encryptedPassword);
        if (apply) await tx.markirovkaAccount.update({ where: { id: row.id }, data: { encryptedPassword, token: null, tokenExpiresAt: null, trueApiToken: null, trueApiExpiresAt: null } });
        count++;
      }
      cursor = rows.at(-1).id;
    }
    if (apply) {
      await tx.user.updateMany({ data: { tokenVersion: { increment: 1 } } });
      await tx.verificationCode.deleteMany({});
    }
  }, { timeout: 600000 });
  console.log(JSON.stringify({ mode: apply ? 'applied' : 'validated-only', accounts: count }));
})().catch(() => { console.error('Key rotation failed; transaction rolled back. Values withheld.'); process.exitCode = 1; }).finally(() => db.$disconnect());
