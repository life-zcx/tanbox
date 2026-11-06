const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const { Readable, Writable } = require('node:stream');
const http = require('node:http');
const https = require('node:https');

const initialCwd = process.cwd();
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'tanbox-code-access-'));
process.chdir(work);
const fail = name => () => { throw new Error(`Unexpected dependency: ${name}`); };
const prisma = new Proxy({}, { get(target, key) {
  if (!(key in target)) target[key] = new Proxy({}, { get: (model, method) => model[method] || fail(`${String(key)}.${String(method)}`) });
  return target[key];
} });
const codeFiles = {};
const queue = {};
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  const file = Module._resolveFilename(request, parent).replaceAll('\\', '/');
  if (file.endsWith('/dist/config/db.js')) return { prisma };
  if (file.endsWith('/dist/utils/logger.js')) return { logger: { info() {}, warn() {}, error() {} } };
  if (file.endsWith('/dist/services/orderCodes.service.js')) return codeFiles;
  if (file.endsWith('/dist/services/pdfQueue.service.js')) return { pdfQueue: queue };
  if (file.endsWith('/dist/services/telegram.service.js')) return { telegram: new Proxy({}, { get: () => fail('Telegram') }) };
  if (file.endsWith('/dist/services/clientTelegram.service.js')) return { clientTelegramBot: new Proxy({}, { get: () => fail('Telegram') }) };
  if (file.endsWith('/dist/services/nktSettings.service.js')) return { getNktSettings: fail('NKT settings') };
  return originalLoad.call(this, request, parent, isMain);
};
const orders = require('../dist/controllers/orders.controller');
const marking = require('../dist/controllers/markirovka.controller');
const operations = require('../dist/controllers/markirovkaOperations.controller');
const policy = require('../dist/utils/orderCodeAccess');
Module._load = originalLoad;
const originalNetwork = { fetch: global.fetch, http: http.request, https: https.request };
let networkCalls;
const blockNetwork = () => { networkCalls++; throw new Error('External HTTP disabled'); };
after(() => {
  global.fetch = originalNetwork.fetch;
  http.request = originalNetwork.http;
  https.request = originalNetwork.https;
  process.chdir(initialCwd);
  assert.equal(path.dirname(work), os.tmpdir());
  fs.rmSync(work, { recursive: true, force: true });
});

const client = { id: 'client-a', role: 'CLIENT' };
const admin = { id: 'admin', role: 'ADMIN' };
const code = '010000000000000021FIXTURE\u001d91TEST\u001d92CRYPTO';
const order = (extra = {}) => ({
  id: 'order-a', orderNumber: 'TB-FIXTURE', userId: client.id, status: 'NEW', paymentStatus: 'UNPAID', printAllowed: false,
  itemsCount: 2, tariffType: 'PRINT', extraServices: [], stickerApprovalStatus: 'APPROVED', notes: null,
  createdAt: new Date('2026-01-01T00:00:00Z'), codesFileUrl: null, pdfUrl: null,
  stickerLayout: { widthMm: 58, heightMm: 40, elements: [{ type: 'text', content: 'Fixture' }] },
  markirovkaOrders: [{ id: 'emission-a', codes: [code], errorDetails: code, quantityReceived: 2 }],
  markirovkaReports: [{ reportData: { sampleCode: code }, errorDetails: code, codesCount: 2 }],
  ...extra,
});
const request = (user = client, extra = {}) => ({
  user, params: { id: 'order-a', itemIndex: '2' }, query: {}, body: {}, setTimeout() {}, once() {}, off() {}, ...extra,
});
const response = () => ({ statusCode: 200, status(n) { this.statusCode = n; return this; }, json(body) { this.body = body; return this; } });
const assertNoCodes = value => assert.ok(!JSON.stringify(value).includes('CRYPTO'), 'raw codes escaped through a response');
function stubOrder(value) {
  prisma.order.findFirst = async () => value;
  prisma.order.findUnique = async () => value;
}
beforeEach(() => {
  for (const key of Object.keys(prisma)) delete prisma[key];
  for (const key of Object.keys(queue)) delete queue[key];
  for (const key of Object.keys(codeFiles)) delete codeFiles[key];
  codeFiles.ensureOrderCodesPopulated = fail('populate');
  codeFiles.attachCodesToOrder = fail('attach');
  networkCalls = 0;
  global.fetch = blockNetwork; http.request = blockNetwork; https.request = blockNetwork;
});

test('payment, explicit grant, owner, cancellation and refund form one access matrix', () => {
  const cases = [
    [{}, false], [{ paymentStatus: 'PAID' }, true], [{ printAllowed: true }, true],
    [{ paymentStatus: 'PAID', userId: 'client-b' }, false],
    [{ paymentStatus: 'PAID', status: 'CANCELLED', printAllowed: true }, false],
    [{ paymentStatus: 'REFUNDED', printAllowed: true }, false],
  ];
  for (const [fields, expected] of cases) {
    assert.equal(policy.canAccessOrderCodes(order(fields), client), expected);
    assert.equal(policy.canAccessOrderCodes(order(fields), admin), true);
  }
  assert.equal(policy.canAccessOrderCodes(order({ paymentStatus: 'PAID' }), undefined), false);
  assert.equal(policy.canAccessOrderCodes(null, client), false);
});

test('details retain metadata but hide raw emission/report payloads until entitlement exists', async () => {
  prisma.userStickerTemplate.findFirst = async () => null;
  prisma.orderCodeItem.findFirst = async () => ({ index: 1 });
  for (const fields of [{}, { paymentStatus: 'REFUNDED', printAllowed: true }, { paymentStatus: 'PAID', status: 'CANCELLED' }]) {
    const raw = order({ ...fields, codesFileUrl: '/uploads/orders/order-a/codes.csv', pdfUrl: '/uploads/orders/order-a/labels.pdf' });
    stubOrder(raw);
    const res = response(); await orders.getOrderById(request(), res);
    assert.equal(res.statusCode, 200);
    assertNoCodes(res.body);
    assert.equal(res.body.markirovkaOrders[0].quantityReceived, 2);
    assert.equal(res.body.codesFileUrl, '/api/orders/order-a/codes-file');
    assert.equal(res.body.pdfUrl, '/api/orders/order-a/pdf');
    assert.equal(raw.markirovkaOrders[0].codes[0], code, 'redaction must not mutate the database result');
  }
  for (const [fields, user] of [[{ paymentStatus: 'PAID' }, client], [{ printAllowed: true }, client], [{}, admin]]) {
    stubOrder(order(fields));
    const res = response(); await orders.getOrderById(request(user), res);
    assert.equal(res.body.markirovkaOrders[0].codes[0], code);
  }
  stubOrder(order({ userId: 'client-b', paymentStatus: 'PAID' }));
  const res = response(); await orders.getOrderById(request(), res);
  assert.equal(res.statusCode, 403);
});

test('all file, content, item and production-PDF endpoints deny before any code or network access', async () => {
  const endpoints = [orders.downloadOrderCodesFile, orders.getOrderCodesContent, orders.getOrderCodeItems,
    orders.downloadOrderPdf, orders.downloadSingleItemPdf, orders.downloadRangeItemsPdf, orders.triggerAsyncOrderPdfGeneration];
  for (const fields of [{}, { paymentStatus: 'PAID', userId: 'client-b' }, { paymentStatus: 'PAID', status: 'CANCELLED' }, { paymentStatus: 'REFUNDED', printAllowed: true }]) {
    stubOrder(order(fields));
    for (const endpoint of endpoints) {
      const res = response(); await endpoint(request(), res);
      assert.equal(res.statusCode, 403, endpoint.name);
      assertNoCodes(res.body);
    }
  }
  assert.equal(networkCalls, 0);
});

test('paid or manually permitted clients and admins can still read order items', async () => {
  codeFiles.ensureOrderCodesPopulated = async () => {};
  prisma.orderCodeItem.count = async () => 1;
  prisma.orderCodeItem.findMany = async () => [{ orderId: 'order-a', index: 1, code }];
  for (const [fields, user] of [[{ paymentStatus: 'PAID' }, client], [{ printAllowed: true }, client], [{}, admin]]) {
    stubOrder(order(fields));
    const res = response(); await orders.getOrderCodeItems(request(user), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.items[0].code, code);
  }
});

// A small generic evaluator lets the mocked database obey the actual Prisma filters.
function matches(value, where) {
  return Object.entries(where || {}).every(([key, condition]) => {
    if (key === 'OR') return condition.some(item => matches(value, item));
    if (key === 'AND') return (Array.isArray(condition) ? condition : [condition]).every(item => matches(value, item));
    if (condition && typeof condition === 'object') {
      if ('not' in condition) return value[key] !== condition.not;
      if ('in' in condition) return condition.in.includes(value[key]);
      if ('contains' in condition) return String(value[key] || '').includes(condition.contains);
      return matches(value[key], condition);
    }
    return value[key] === condition;
  });
}

test('registry rows, search, totals and dropdowns exclude unpaid, foreign, cancelled and refunded orders', async () => {
  const data = [order({ id: 'unpaid' }), order({ id: 'paid', paymentStatus: 'PAID' }), order({ id: 'grant', printAllowed: true }),
    order({ id: 'foreign', paymentStatus: 'PAID', userId: 'client-b' }),
    order({ id: 'cancelled', paymentStatus: 'PAID', status: 'CANCELLED' }), order({ id: 'refund', paymentStatus: 'REFUNDED', printAllowed: true })];
  const items = data.map(o => ({ orderId: o.id, order: o, index: 1, code, status: 'NEW' }));
  prisma.order.findMany = async ({ where }) => {
    if (where.codeItems) {
      const { codeItems, codesFileUrl, ...scope } = where;
      assert.deepEqual(data.filter(o => matches(o, scope)).map(o => o.id), ['paid', 'grant']);
      return []; // All fixture orders already have code items.
    }
    return data.filter(o => matches(o, where));
  };
  prisma.orderCodeItem.count = async ({ where }) => items.filter(item => matches(item, where)).length;
  prisma.orderCodeItem.findMany = async ({ where }) => items.filter(item => matches(item, where));
  for (const query of [{}, { search: 'CRYPTO' }, { userId: 'client-b' }]) {
    const res = response(); await orders.getCodesRegistry(request(client, { query }), res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.items.map(item => item.orderId), ['paid', 'grant']);
    assert.equal(res.body.total, 2); assert.equal(res.body.stats.totalCodes, 2);
    assert.deepEqual(res.body.availableOrders.map(o => o.id), ['paid', 'grant']);
  }
  for (const orderId of ['unpaid', 'foreign', 'cancelled', 'refund']) {
    const res = response(); await orders.getCodesRegistry(request(client, { query: { orderId, search: 'CRYPTO' } }), res);
    assert.equal(res.statusCode, 200); assert.deepEqual(res.body.items, []); assert.equal(res.body.total, 0);
  }
});

test('sync response cannot reveal unpaid codes while synchronizing them internally', async () => {
  stubOrder(order());
  prisma.markirovkaOrder.findFirst = async () => ({ id: 'emission-a', codes: [code], quantityRequested: 1, account: {} });
  let attached = false;
  codeFiles.attachCodesToOrder = async (_id, codes) => { assert.deepEqual(codes, [code]); attached = true; };
  const res = response(); await orders.syncMarkirovkaOrderCodes(request(), res);
  assert.equal(res.statusCode, 200); assert.equal(res.body.success, true);
  assert.equal(attached, true); assertNoCodes(res.body);
  assert.equal(res.body.codesCount, 1);
});

function captureGenerator() {
  const payloads = [];
  http.request = (_options, callback) => {
    networkCalls++;
    const req = new EventEmitter(); req.setTimeout = () => {}; req.destroy = () => {};
    req.write = value => payloads.push(JSON.parse(value));
    req.end = () => { const res = Readable.from(['%PDF-TEST']); res.statusCode = 200; callback(res); };
    return req;
  };
  return payloads;
}
function streamResponse() {
  const res = new Writable({ write(_chunk, _encoding, done) { done(); } });
  res.statusCode = 200; res.status = n => { res.statusCode = n; return res; };
  res.json = body => { res.body = body; res.end(); return res; };
  res.setHeader = () => {}; res.setTimeout = () => {}; res.writeHead = n => { res.statusCode = n; };
  return res;
}

test('alternative PDF refuses unpaid orders, linked emissions, raw client codes and unapproved layouts', async () => {
  for (const fields of [{}, { paymentStatus: 'PAID', userId: 'client-b' }, { paymentStatus: 'REFUNDED', printAllowed: true },
    { paymentStatus: 'PAID', extraServices: ['STICKER_LAYOUT_DESIGN'], stickerApprovalStatus: 'PENDING' }]) {
    stubOrder(order(fields));
    for (const body of [{ orderId: 'order-a' }, { orderId: 'order-a', codes: [code] }]) {
      const res = response(); await marking.generateLabelsPdf(request(client, { body }), res);
      assert.equal(res.statusCode, 403);
    }
    prisma.order.findFirst = async () => null;
    prisma.markirovkaOrder.findUnique = async () => ({ codes: [code], order: order(fields) });
    const res = response(); await marking.generateLabelsPdf(request(client, { body: { orderId: 'emission-a' } }), res);
    assert.equal(res.statusCode, 403);
  }
  prisma.markirovkaOrder.findUnique = async () => ({ codes: [code], order: null });
  const detached = response(); await marking.generateLabelsPdf(request(client, { body: { orderId: 'detached' } }), detached);
  assert.equal(detached.statusCode, 403);
  const raw = response(); await marking.generateLabelsPdf(request(client, { body: { codes: [code] } }), raw);
  assert.equal(raw.statusCode, 403);
  assert.equal(networkCalls, 0);
});

test('alternative PDF uses only authorized server codes and retains admin raw-code printing', async () => {
  const payloads = captureGenerator();
  for (const fields of [{ paymentStatus: 'PAID' }, { printAllowed: true }]) {
    stubOrder(order(fields));
    prisma.orderCodeItem.findMany = async () => [{ code }];
    const res = streamResponse(); const finished = new Promise(resolve => res.on('finish', resolve));
    await marking.generateLabelsPdf(request(client, { body: { orderId: 'order-a', codes: ['UNTRUSTED-INPUT'] } }), res);
    await finished; assert.equal(res.statusCode, 200);
    assert.equal(payloads.at(-1).csvData[0].code, code);
  }
  const res = streamResponse(); const finished = new Promise(resolve => res.on('finish', resolve));
  await marking.generateLabelsPdf(request(admin, { body: { codes: ['ADMIN-FIXTURE'] } }), res);
  await finished; assert.equal(payloads.at(-1).csvData[0].code, 'ADMIN-FIXTURE');
});

test('every production-PDF path requires current custom-layout approval', async () => {
  stubOrder(order({ paymentStatus: 'PAID', extraServices: ['STICKER_LAYOUT_DESIGN'], stickerApprovalStatus: 'CHANGES_REQUESTED', stickerApprovedAt: new Date() }));
  for (const endpoint of [orders.downloadOrderPdf, orders.downloadSingleItemPdf, orders.downloadRangeItemsPdf, orders.triggerAsyncOrderPdfGeneration]) {
    const res = response(); await endpoint(request(), res); assert.equal(res.statusCode, 403, endpoint.name);
  }
  assert.equal(networkCalls, 0);
});

test('sample requests cannot select later labels or turn into an unpaid batch', async () => {
  stubOrder(order());
  const denied = response();
  await orders.downloadSingleItemPdf(request(client, { query: { sample: 'true' } }), denied);
  assert.equal(denied.statusCode, 403); // itemIndex=2
  const payloads = captureGenerator();
  prisma.orderCodeItem.count = async () => 2;
  prisma.orderCodeItem.findMany = async ({ skip, take }) => {
    assert.equal(skip, 0); assert.equal(take, 1);
    return [{ index: 1, code, gtin: '00000000000000' }];
  };
  prisma.orderPosition.findMany = async () => [];
  queue.enqueue = async (_key, _description, fn) => fn();
  const res = streamResponse(); const finished = new Promise(resolve => res.on('finish', resolve));
  await orders.downloadOrderPdf(request(client, { query: { sample: 'true', offset: '1', limit: '2000', roll: '2' } }), res);
  await finished;
  assert.equal(res.statusCode, 200); assert.equal(payloads[0].csvData.length, 1); assert.equal(payloads[0].csvData[0].index, '1');
});

test('emission history and receipts do not provide another route to unpaid codes', async () => {
  prisma.markirovkaOrder.count = async () => 1;
  prisma.markirovkaOperation.findUnique = async () => null;
  for (const fields of [{}, { paymentStatus: 'PAID' }, { printAllowed: true }]) {
    const emission = { id: 'emission-a', status: 'COMPLETED', codes: [code], account: { userId: client.id }, order: order(fields) };
    prisma.markirovkaOrder.findMany = async () => [emission];
    prisma.markirovkaOrder.findUnique = async () => emission;
    const history = response(); await operations.getOperations(request(client, { query: { type: 'ORDER' } }), history);
    const receipt = response(); await operations.getOperationReceipt(request(), receipt);
    if (!fields.paymentStatus && !fields.printAllowed) {
      assertNoCodes(history.body); assert.equal(receipt.statusCode, 403);
    } else {
      assert.equal(history.body.operations[0].responsePayload.codes[0], code);
      assert.equal(receipt.body.receipt.codes[0].code, code);
    }
  }
  assert.equal(networkCalls, 0);
});

test('stored operation payloads and their receipt are hidden when linked order is no longer accessible', async () => {
  const op = { id: 'op-a', createdById: client.id, requestPayload: { orderId: 'order-a', codes: [code] }, responsePayload: { results: [{ code }] }, errorDetails: code };
  prisma.markirovkaOperation.count = async () => 1;
  prisma.markirovkaOperation.findMany = async () => [op];
  prisma.markirovkaOperation.findUnique = async () => op;
  stubOrder(order({ paymentStatus: 'REFUNDED', printAllowed: true }));
  prisma.order.findMany = async () => [order({ paymentStatus: 'REFUNDED', printAllowed: true })];
  const history = response(); await operations.getOperations(request(client, { query: { type: 'UTILISATION' } }), history);
  assert.equal(history.statusCode, 200); assertNoCodes(history.body);
  const receipt = response(); await operations.getOperationReceipt(request(), receipt);
  assert.equal(receipt.statusCode, 403); assertNoCodes(receipt.body);
  assert.equal(networkCalls, 0);
});

test('restoring codes for utilisation also requires order ownership and entitlement first', async () => {
  for (const fields of [{}, { userId: 'client-b', paymentStatus: 'PAID' }, { paymentStatus: 'REFUNDED', printAllowed: true }]) {
    stubOrder(order(fields));
    const res = response();
    await operations.createUtilisation(request(client, { body: { orderId: 'order-a', codes: ['TRUNCATED'] } }), res);
    assert.equal(res.statusCode, 403);
  }
  assert.equal(networkCalls, 0);
});
