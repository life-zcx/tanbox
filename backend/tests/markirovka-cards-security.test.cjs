const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');

// No real database, settings file, notifications or external HTTP in these tests.
const unexpected = name => async () => { throw new Error(`Unexpected dependency: ${name}`); };
const prisma = {};
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  const file = Module._resolveFilename(request, parent).replaceAll('\\', '/');
  if (file.endsWith('/dist/config/db.js')) return { prisma };
  if (file.endsWith('/dist/utils/logger.js')) return { logger: { info() {}, warn() {}, error() {} } };
  if (file.endsWith('/dist/services/nktSettings.service.js')) return {
    getNktSettings: () => ({ apiKey: 'fixture-system-key', baseUrl: 'https://nationalcatalog.kz/gwp' }),
  };
  if (file.endsWith('/dist/services/integrationHttp.service.js')) {
    const actual = originalLoad.call(this, request, parent, isMain);
    return { ...actual, integrationFetch: (url, options) => global.fetch(url, options) };
  }
  return originalLoad.call(this, request, parent, isMain);
};
const { markirovkaCardsService: service } = require('../dist/services/markirovkaCards.service');
const handlers = require('../dist/controllers/markirovkaCards.controller');
const { getNktSettingsHandler } = require('../dist/controllers/markirovka.controller');
Module._load = originalLoad;

const originalFetch = global.fetch;
const originalHttp = require('node:http').request;
const originalHttps = require('node:https').request;
let networkCalls;
const blockNetwork = () => { networkCalls++; throw new Error('External HTTP disabled'); };
require('node:http').request = blockNetwork;
require('node:https').request = blockNetwork;
after(() => {
  global.fetch = originalFetch;
  require('node:http').request = originalHttp;
  require('node:https').request = originalHttps;
});

const account = (userId = 'client-a') => ({
  id: `account-${userId}`, userId, name: 'Fixture account', login: '000000000001', categories: ['SHOES'],
  nktApiKey: 'fixture-personal-key', token: 'fixture-token', trueApiToken: 'fixture-true-api-token',
  encryptedPassword: 'fixture-ciphertext', nktBaseUrl: 'https://nationalcatalog.kz/gwp',
  futureSecret: 'must-not-be-returned',
});
const card = (overrides = {}) => ({
  id: 'card-a', userId: 'client-a', accountId: 'account-client-a', category: 'SHOES', name: 'Fixture card',
  status: 'DRAFT', nktRequestId: null, attributes: {}, ...overrides,
});
const response = () => ({ statusCode: 200, status(n) { this.statusCode = n; return this; }, json(body) { this.body = body; return this; } });
const request = (role = 'CLIENT', body = {}) => ({
  user: { id: role === 'ADMIN' ? 'admin' : 'client-a', role }, params: { id: 'card-a' }, body, query: {},
});
function assertSafeAccount(value) {
  assert.deepEqual(value, { id: 'account-client-a', name: 'Fixture account', login: '000000000001', categories: ['SHOES'] });
}

beforeEach(() => {
  networkCalls = 0;
  global.fetch = blockNetwork;
  for (const model of ['markirovkaAccount', 'markirovkaProductCard']) {
    prisma[model] = new Proxy({}, { get: (target, key) => target[key] || unexpected(`${model}.${String(key)}`) });
  }
});

test('foreign and missing accounts are rejected before updating a client or admin-managed card', async () => {
  prisma.markirovkaProductCard.findUnique = async () => card();
  prisma.markirovkaAccount.findFirst = async ({ where }) => {
    assert.equal(where.userId, 'client-a'); // Owner of the card, including for ADMIN.
    return null;
  };
  for (const role of ['CLIENT', 'ADMIN']) {
    for (const accountId of ['account-client-b', 'missing']) {
      const res = response();
      await handlers.updateCardHandler(request(role, { accountId }), res);
      assert.equal(res.statusCode, 403);
    }
  }
  assert.equal(networkCalls, 0);
});

test('owner account assignment, clearing and unrelated edits still work', async () => {
  for (const isAdmin of [false, true]) {
    prisma.markirovkaProductCard.findUnique = async () => card();
    prisma.markirovkaAccount.findFirst = async ({ where }) => {
      assert.deepEqual(where, { id: 'account-client-a', userId: 'client-a' });
      return { id: where.id };
    };
    prisma.markirovkaProductCard.update = async ({ data }) => ({ ...card(), ...data });
    const actor = isAdmin ? 'admin' : 'client-a';
    assert.equal((await service.updateCard('card-a', actor, isAdmin, { accountId: 'account-client-a' })).accountId, 'account-client-a');
    assert.equal((await service.updateCard('card-a', actor, isAdmin, { accountId: null })).accountId, null);
    assert.equal((await service.updateCard('card-a', actor, isAdmin, { name: 'Changed' })).name, 'Changed');
  }
});

test('draft details and check-status return only allowlisted account fields for client and admin', async () => {
  prisma.markirovkaProductCard.findUnique = async ({ select }) => select
    ? { id: 'card-a', userId: 'client-a' }
    : card({ account: account() });
  for (const role of ['CLIENT', 'ADMIN']) {
    for (const handler of [handlers.getCardByIdHandler, handlers.checkCardStatusHandler]) {
      const res = response();
      await handler(request(role), res);
      assert.equal(res.statusCode, 200);
      assertSafeAccount(res.body.card.account);
      assert.equal(res.body.card.name, 'Fixture card');
      assert.ok(!JSON.stringify(res.body).includes('fixture-personal-key'));
    }
  }
  assert.equal(networkCalls, 0);
});

test('empty NKT status response also uses the safe account DTO', async () => {
  prisma.markirovkaProductCard.findUnique = async () => card({ account: account(), nktRequestId: 'request-a' });
  global.fetch = async (_url, options) => {
    networkCalls++;
    assert.equal(options.headers['X-API-KEY'], 'fixture-personal-key');
    return { ok: true, json: async () => null };
  };
  assertSafeAccount((await service.checkNktStatus('card-a')).account);
  assert.equal(networkCalls, 1);
});

test('existing foreign or broken links cannot trigger status, submit, publish or delete calls', async () => {
  for (const linkedAccount of [account('client-b'), null]) {
    prisma.markirovkaProductCard.findUnique = async ({ select }) => select
      ? { id: 'card-a', userId: 'client-a' }
      : card({ accountId: 'account-client-b', account: linkedAccount, nktRequestId: 'request-b' });
    for (const role of ['CLIENT', 'ADMIN']) {
      for (const handler of [handlers.getCardByIdHandler, handlers.checkCardStatusHandler, handlers.submitCardToNktHandler, handlers.publishCardToNktHandler, handlers.deleteCardHandler]) {
        const res = response();
        await handler(request(role), res);
        assert.equal(res.statusCode, 403, handler.name);
        assert.ok(!JSON.stringify(res.body).includes('fixture-personal-key'));
      }
    }
  }
  assert.equal(networkCalls, 0);
});

test('another client still cannot modify the card itself', async () => {
  prisma.markirovkaProductCard.findUnique = async () => card({ userId: 'client-b' });
  await assert.rejects(service.updateCard('card-a', 'client-a', false, { accountId: 'account-client-a' }), /Нет доступа/);
});

test('list exposes safe summaries and hides legacy foreign account metadata', async () => {
  prisma.markirovkaProductCard.count = async () => 2;
  prisma.markirovkaProductCard.groupBy = async () => [{ status: 'DRAFT', _count: { status: 2 } }];
  prisma.markirovkaProductCard.findMany = async ({ include }) => {
    assert.equal(include.account.select.userId, true);
    assert.equal(include.account.select.nktApiKey, undefined);
    return [card({ account: account() }), card({ id: 'legacy', accountId: 'account-client-b', account: account('client-b') })];
  };
  for (const isAdmin of [false, true]) {
    const result = await service.getCards(isAdmin ? 'admin' : 'client-a', isAdmin, {});
    assertSafeAccount(result.cards[0].account);
    assert.equal(result.cards[1].account, null);
    assert.equal(result.pagination.total, 2);
  }
});

test('draft without an account remains readable without any external call', async () => {
  prisma.markirovkaProductCard.findUnique = async () => card({ accountId: null, account: null });
  const result = await service.checkNktStatus('card-a');
  assert.equal(result.account, null);
  assert.equal(networkCalls, 0);
});

test('global API key is bound to the system endpoint even if the account supplies another URL', async () => {
  prisma.markirovkaProductCard.findUnique = async () => card({ account: { ...account(), nktApiKey: null, nktBaseUrl: 'https://attacker.example.test' }, nktRequestId: 'request-a' });
  global.fetch = async (url, options) => {
    assert.equal(new URL(url).hostname, 'nationalcatalog.kz');
    assert.equal(options.headers['X-API-KEY'], 'fixture-system-key');
    return { ok: true, json: async () => null };
  };
  await service.checkNktStatus('card-a');
});

test('checking a rejected card with GTIN never sends a publish request', async () => {
  prisma.markirovkaProductCard.findUnique = async () => card({ account: account(), nktRequestId: 'request-a' });
  prisma.markirovkaProductCard.update = async ({ data }) => ({ ...card(), ...data });
  let calls = 0;
  global.fetch = async (_url, options) => {
    calls++; assert.ok(!options.method || options.method === 'GET');
    return { ok: true, json: async () => ({ status: 'rejected', gtin: '00000000000000' }) };
  };
  assert.equal((await service.checkNktStatus('card-a')).status, 'REJECTED');
  assert.equal(calls, 1);
});

test('global NKT settings expose only configuration presence, never the stored API key', async () => {
  const res = response(); await getNktSettingsHandler(request(), res);
  assert.equal(res.body.settings.hasApiKey, true);
  assert.equal(res.body.settings.apiKey, '');
  assert.ok(!JSON.stringify(res.body).includes('fixture-system-key'));
});
