const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const http = require('node:http');
const https = require('node:https');

const prisma = new Proxy({}, { get(target, model) {
  if (!(model in target)) target[model] = new Proxy({}, { get(object, method) {
    return object[method] || (() => { throw new Error(`Unexpected DB call: ${String(model)}.${String(method)}`); });
  } });
  return target[model];
} });
let submitted, savedOperations, savedReports, codeReads, accountLookups, networkAttempts;
class FixtureClient {
  constructor(account) { this.account = account; }
  async submitUtilisationReport(params) {
    submitted.push({ accountId: this.account.id, ...params });
    return { reportId: 'fixture-report', status: 'ACCEPTED', raw: { reportId: 'fixture-report' } };
  }
}
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  const file = Module._resolveFilename(request, parent).replaceAll('\\', '/');
  if (file.endsWith('/dist/config/db.js')) return { prisma };
  if (file.endsWith('/dist/services/markirovkaClient.service.js')) return { MarkirovkaClient: FixtureClient };
  if (file.endsWith('/dist/utils/logger.js')) return { logger: { info() {}, warn() {}, error() {} } };
  return originalLoad.call(this, request, parent, isMain);
};
const { createUtilisation } = require('../dist/controllers/markirovkaOperations.controller');
Module._load = originalLoad;
const originalNetwork = { fetch: global.fetch, http: http.request, https: https.request };
const noNetwork = () => { networkAttempts++; throw new Error('Real HTTP disabled in utilisation tests'); };
global.fetch = noNetwork; http.request = noNetwork; https.request = noNetwork;
after(() => { global.fetch = originalNetwork.fetch; http.request = originalNetwork.http; https.request = originalNetwork.https; });

const user = { id: 'client-a', role: 'CLIENT' };
const admin = { id: 'admin', role: 'ADMIN' };
const gs = '\u001d';
const identity = serial => `010000000000000021${serial}`;
const full = (serial, signature = 'FIXTURE') => `${identity(serial)}${gs}91TEST${gs}92${signature}`;
let currentOrder, accounts, emissions, items;
const response = () => ({ statusCode: 200, status(n) { this.statusCode = n; return this; }, json(body) { this.body = body; return this; } });
async function run(body = {}, actor = user) {
  const res = response();
  await createUtilisation({ user: actor, body: { orderId: 'order-a', codes: [identity('THIRD92')], ...body } }, res);
  return res;
}
function assertNoSideEffects() {
  assert.equal(networkAttempts, 0, 'an external HTTP call was attempted');
  assert.equal(submitted.length, 0, 'report was sent');
  assert.equal(savedOperations.length, 0, 'operation was persisted');
  assert.equal(savedReports.length, 0, 'report link was persisted');
}

beforeEach(() => {
  for (const key of Object.keys(prisma)) delete prisma[key];
  submitted = []; savedOperations = []; savedReports = []; codeReads = []; accountLookups = []; networkAttempts = 0;
  currentOrder = { id: 'order-a', userId: user.id, category: 'SHOES', status: 'NEW', paymentStatus: 'PAID', printAllowed: false };
  accounts = [
    { id: 'account-a', userId: user.id, status: 'ACTIVE', baseUrl: 'https://fixture.example.test' },
    { id: 'account-b', userId: user.id, status: 'ACTIVE' },
    { id: 'foreign', userId: 'client-b', status: 'ACTIVE' },
  ];
  emissions = [{ accountId: 'account-a' }];
  items = [full('FIRST'), full('SECOND'), full('THIRD92'), full('THIRD92-LONGER')];
  prisma.order.findUnique = async ({ where }) => where.id === 'order-a' ? currentOrder : null;
  prisma.markirovkaOrder.findMany = async ({ where }) => { assert.equal(where.orderId, 'order-a'); return emissions; };
  prisma.markirovkaAccount.findUnique = async ({ where }) => {
    accountLookups.push(where.id);
    return accounts.find(account => account.id === where.id) || null;
  };
  prisma.markirovkaAccount.findMany = async ({ where, take }) => {
    accountLookups.push('automatic');
    return accounts.filter(account => Object.entries(where).every(([key, value]) => account[key] === value)).slice(0, take);
  };
  prisma.orderCodeItem.findMany = async ({ where, select }) => {
    codeReads.push(where);
    assert.equal(where.orderId, 'order-a');
    assert.deepEqual(select, { code: true });
    return items.filter(code => where.OR.some(({ code: rule }) => rule.mode === 'insensitive'
      ? code.toLowerCase().startsWith(rule.startsWith.toLowerCase()) : code.startsWith(rule.startsWith))).map(code => ({ code }));
  };
  prisma.markirovkaOperation.create = async ({ data }) => { savedOperations.push(data); return { id: 'operation-a' }; };
  prisma.markirovkaUtilisationReport.create = async ({ data }) => { savedReports.push(data); return { id: 'report-a' }; };
});

test('restores the requested identities in request order, including serial digits 92', async () => {
  const res = await run({ codes: [identity('THIRD92'), identity('FIRST')] });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(submitted[0].codes, [full('THIRD92'), full('FIRST')]);
  assert.equal(submitted[0].category, 'SHOES');
  assert.equal(submitted[0].accountId, 'account-a');
  assert.deepEqual(savedOperations[0].requestPayload.codes, submitted[0].codes);
  assert.equal(savedReports[0].orderId, 'order-a');
  assert.equal(savedReports[0].accountId, 'account-a');
  assert.equal(savedReports[0].category, 'SHOES');
});

test('full and reduced inputs can be mixed without replacing the requested subset', async () => {
  const res = await run({ codes: [full('SECOND'), `\r\n${identity('THIRD92')}\n`] });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(submitted[0].codes, [full('SECOND'), full('THIRD92')]);
});

test('textual GS input and stored GS variants normalize without guessing the serial', async () => {
  items = [full('SECOND').replaceAll(gs, '<gS>')];
  const res = await run({ codes: [full('SECOND').replaceAll(gs, '<GS>')] });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(submitted[0].codes, [full('SECOND')]);
});

test('unknown identity and a partial serial reject the entire batch before sending', async () => {
  for (const value of [identity('UNKNOWN'), identity('THIRD')]) {
    const res = await run({ codes: [identity('FIRST'), value] });
    assert.equal(res.statusCode, 400);
    assertNoSideEffects();
  }
});

test('same identity with an altered cryptographic tail is not silently repaired', async () => {
  const res = await run({ codes: [full('FIRST', 'ALTERED')] });
  assert.equal(res.statusCode, 403);
  assertNoSideEffects();
});

test('ambiguous reduced identity is rejected but an exact known full code is unambiguous', async () => {
  items.push(full('THIRD92', 'OTHER-TAIL'));
  const denied = await run();
  assert.equal(denied.statusCode, 409); assertNoSideEffects();
  const allowed = await run({ codes: [full('THIRD92', 'OTHER-TAIL')] });
  assert.equal(allowed.statusCode, 200);
  assert.deepEqual(submitted[0].codes, [full('THIRD92', 'OTHER-TAIL')]);
});

test('repeated input, full/reduced duplicates, empty and non-string values never send partial reports', async () => {
  for (const codes of [[identity('FIRST'), identity('FIRST')], [full('FIRST'), identity('FIRST')], [' '], [null], [123], [identity('FIRST'), {}], []]) {
    const res = await run({ codes });
    assert.equal(res.statusCode, 400);
    assertNoSideEffects();
  }
});

test('missing full data or database failure does not fall back to truncated codes', async () => {
  items = [identity('THIRD92')];
  assert.equal((await run()).statusCode, 400);
  assertNoSideEffects();
  prisma.orderCodeItem.findMany = async () => { throw new Error('Fixture database failure'); };
  assert.equal((await run()).statusCode, 400);
  assertNoSideEffects();
});

test('foreign, unpaid, cancelled, refunded and nonexistent orders fail before accounts and codes', async () => {
  for (const update of [{ userId: 'client-b' }, { paymentStatus: 'UNPAID' }, { status: 'CANCELLED' }, { paymentStatus: 'REFUNDED', printAllowed: true }]) {
    const original = currentOrder; currentOrder = { ...currentOrder, ...update };
    assert.equal((await run()).statusCode, 403);
    currentOrder = original;
  }
  assert.equal((await run({ orderId: 'missing' })).statusCode, 403);
  assert.equal(accountLookups.length, 0); assert.equal(codeReads.length, 0); assertNoSideEffects();
});

test('an explicit account must match the emission; another owned account is not interchangeable', async () => {
  for (const actor of [user, admin]) {
    assert.equal((await run({ accountId: 'account-b' }, actor)).statusCode, 409);
    assertNoSideEffects();
  }
  assert.equal(accountLookups.length, 0); assert.equal(codeReads.length, 0);
});

test('multiple emission accounts are rejected instead of guessing', async () => {
  emissions.push({ accountId: 'account-b' });
  assert.equal((await run()).statusCode, 409);
  assert.equal((await run({ accountId: 'account-a' })).statusCode, 409);
  assert.equal(accountLookups.length, 0); assert.equal(codeReads.length, 0); assertNoSideEffects();
});

test('a broken or inactive emission account cannot fall back to another active account', async () => {
  accounts = accounts.filter(account => account.id !== 'account-a');
  assert.equal((await run()).statusCode, 403); assertNoSideEffects();
  accounts.push({ id: 'account-a', userId: user.id, status: 'ERROR' });
  assert.equal((await run()).statusCode, 400); assertNoSideEffects();
  assert.deepEqual(accountLookups, ['account-a', 'account-a']);
  assert.equal(codeReads.length, 0);
});

test('an order with uploaded codes requires an account belonging to its owner, also for admin', async () => {
  emissions = [];
  for (const actor of [user, admin]) {
    assert.equal((await run({ accountId: 'foreign' }, actor)).statusCode, 403);
    assert.equal((await run({ accountId: 'missing' }, actor)).statusCode, 403);
    assertNoSideEffects();
  }
  assert.ok(!accountLookups.includes('automatic'));
  const res = await run({ accountId: 'account-b' }, admin);
  assert.equal(res.statusCode, 200); assert.equal(submitted[0].accountId, 'account-b');
});

test('an omitted account is selected only when the owner has one active account', async () => {
  emissions = [];
  assert.equal((await run()).statusCode, 409); assertNoSideEffects();
  accounts = accounts.filter(account => account.id !== 'account-b');
  assert.equal((await run()).statusCode, 200); assert.equal(submitted[0].accountId, 'account-a');
});

test('client cannot use a foreign emission account; admin can use the explicit persisted binding', async () => {
  emissions = [{ accountId: 'foreign' }];
  assert.equal((await run()).statusCode, 403); assertNoSideEffects();
  assert.equal((await run({}, admin)).statusCode, 200); assert.equal(submitted[0].accountId, 'foreign');
});

test('standalone reports require full codes and an explicitly valid or unambiguous account', async () => {
  const denied = await run({ orderId: undefined, accountId: 'account-a', codes: [identity('FIRST')] });
  assert.equal(denied.statusCode, 400); assertNoSideEffects();
  assert.equal((await run({ orderId: undefined, accountId: 'missing', codes: [full('FIRST')] })).statusCode, 403);
  assertNoSideEffects();
  const allowed = await run({ orderId: undefined, accountId: 'account-a', codes: [full('FIRST')] });
  assert.equal(allowed.statusCode, 200); assert.deepEqual(submitted[0].codes, [full('FIRST')]);
  assert.equal(savedReports.length, 0); assert.equal(codeReads.length, 0);
});

test('wrong product category and malformed identifiers fail without sending', async () => {
  for (const body of [{ category: 'OILS' }, { category: 'INVALID' }, { orderId: {} }, { accountId: {} }, { accountId: 'ALL' }]) {
    assert.equal((await run(body)).statusCode, 400); assertNoSideEffects();
  }
  assert.equal(codeReads.length, 0);
});

test('SQL pattern characters in serials are literal and preserve exact restoration', async () => {
  const { PGlite } = require('@electric-sql/pglite');
  const db = new PGlite();
  try {
    const serials = ['SERIAL_5', 'SERIAL%5', 'SERIAL\\5'];
    await db.exec('CREATE TABLE codes (code TEXT NOT NULL)');
    for (const serial of [...serials, 'SERIALX5', 'SERIALXX5']) {
      await db.query('INSERT INTO codes (code) VALUES ($1)', [full(serial)]);
    }
    prisma.orderCodeItem.findMany = async ({ where }) => {
      assert.equal(where.orderId, 'order-a');
      const conditions = where.OR.map(({ code }, index) => `code ${code.mode === 'insensitive' ? 'ILIKE' : 'LIKE'} $${index + 1}`);
      const values = where.OR.map(({ code }) => code.startsWith + '%');
      const result = await db.query(`SELECT code FROM codes WHERE ${conditions.join(' OR ')}`, values);
      assert.equal(result.rows.length, 3, 'SQL must not treat serial characters as wildcards');
      return result.rows;
    };
    const res = await run({ codes: serials.map(identity) });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(submitted[0].codes, serials.map(serial => full(serial)));
  } finally {
    await db.close();
  }
});
