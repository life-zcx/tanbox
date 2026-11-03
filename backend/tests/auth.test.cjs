const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'audit-test-secret-with-more-than-32-characters';
const jwt = require('jsonwebtoken');
const { prisma } = require('../dist/config/db');
const { authenticateJWT, requireAdmin, invalidateUserBlockCache } = require('../dist/middleware/auth.middleware');
const response = () => ({ statusCode: 200, status(n) { this.statusCode = n; return this; }, json(body) { this.body = body; return this; } });
const token = (id, extra = {}) => jwt.sign({ id, role: 'ADMIN', tokenVersion: 0, ...extra }, process.env.JWT_SECRET, { expiresIn: '1h' });
const profile = id => ({ id, email: 'user@example.test', role: 'CLIENT', companyName: 'Test', binIin: '123456789012', phone: '77777777777', isBlocked: false, tokenVersion: 0, blockedReason: null });

test('a demoted admin cannot keep permissions from an old JWT', async () => {
  prisma.user.findUnique = async () => profile('demoted');
  const req = { headers: { authorization: 'Bearer ' + token('demoted') } };
  const res = response(); let passed = false;
  await authenticateJWT(req, res, () => { passed = true; });
  assert.equal(passed, true);
  requireAdmin(req, res, () => assert.fail('demoted user reached admin handler'));
  assert.equal(res.statusCode, 403);
});

test('revoked and query-string tokens are rejected', async () => {
  prisma.user.findUnique = async () => ({ ...profile('revoked'), tokenVersion: 1 });
  const res = response();
  await authenticateJWT({ headers: { authorization: 'Bearer ' + token('revoked') } }, res, () => assert.fail('revoked JWT accepted'));
  assert.equal(res.statusCode, 401);
  const query = response();
  await authenticateJWT({ headers: {}, query: { token: token('query') } }, query, () => assert.fail('query token accepted'));
  assert.equal(query.statusCode, 401);
});

test('database outages return 503 rather than invalidating the session', async () => {
  prisma.user.findUnique = async () => { throw new Error('database unavailable'); };
  const res = response();
  await authenticateJWT({ headers: { authorization: 'Bearer ' + token('outage') } }, res, () => assert.fail('outage passed'));
  assert.equal(res.statusCode, 503);
});

test('cache invalidation immediately applies a revoked session', async () => {
  prisma.user.findUnique = async () => profile('cache');
  const req = () => ({ headers: { authorization: 'Bearer ' + token('cache') } });
  await authenticateJWT(req(), response(), () => {});
  prisma.user.findUnique = async () => ({ ...profile('cache'), tokenVersion: 1 });
  invalidateUserBlockCache('cache');
  const res = response();
  await authenticateJWT(req(), res, () => assert.fail('stale cache accepted'));
  assert.equal(res.statusCode, 401);
});

test('admin role and password changes increment the session version', async () => {
  const { updateUser } = require('../dist/controllers/users.controller');
  prisma.user.findUnique = async () => ({ ...profile('edited'), role: 'ADMIN' });
  prisma.user.count = async () => 2;
  let data;
  prisma.user.update = async args => { data = args.data; return { ...profile('edited'), ...args.data }; };
  for (const body of [{ role: 'CLIENT' }, { password: 'new-test-password' }]) {
    const res = response();
    await updateUser({ user: { id: 'admin', role: 'ADMIN', email: 'admin@example.test' }, params: { id: 'edited' }, body }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(data.tokenVersion, { increment: 1 });
  }
});
