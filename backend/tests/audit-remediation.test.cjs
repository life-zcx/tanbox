const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { EventEmitter } = require('node:events');
const { Prisma } = require('@prisma/client');
const initialCwd = process.cwd(), work = fs.mkdtempSync(path.join(os.tmpdir(), 'tanbox-remediation-'));
process.chdir(work);
const models = new Map();
const unexpected = name => () => { throw new Error('Unexpected dependency: ' + name); };
const prisma = new Proxy({}, { get(object, key) {
  if (key in object) return object[key];
  if (String(key).startsWith('$')) return unexpected(key);
  if (!models.has(key)) models.set(key, new Proxy({}, { get: (target, method) => target[method] || unexpected(`${String(key)}.${String(method)}`) }));
  return models.get(key);
} });
const original = Module._load;
Module._load = function (request, parent, isMain) {
  const file = Module._resolveFilename(request, parent).replaceAll('\\', '/');
  if (file.endsWith('/dist/config/db.js')) return { prisma };
  if (file.endsWith('/dist/utils/logger.js')) return { logger: { info() {}, warn() {}, error() {} } };
  if (file.endsWith('/dist/services/telegram.service.js')) return { telegram: new Proxy({}, { get: () => async () => {} }) };
  if (file.endsWith('/dist/services/clientTelegram.service.js')) return { clientTelegramBot: new Proxy({}, { get: () => async () => {} }) };
  return original.call(this, request, parent, isMain);
};
const orders = require('../dist/controllers/orders.controller');
const codeService = require('../dist/services/orderCodes.service');
const { updateOrderQuote, grantPaidTemplate } = require('../dist/services/orderFinancials.service');
const { isValidPassword } = require('../dist/utils/passwordPolicy');
const { numberToWordsTenge } = require('../dist/services/orderDocuments.service');
const { businessDateKey, BUSINESS_TIME_ZONE } = require('../dist/config/timezone');
const { mapNktStatus } = require('../dist/utils/nktStatus');
const { resetPasswordWithCode } = require('../dist/controllers/auth.controller');
const { getTariffs } = require('../dist/controllers/tariffs.controller');
const { limitHeavyRequests } = require('../dist/middleware/pdfAdmission.middleware');
const { allocateSscc } = require('../dist/services/sscc.service');
const { normalizeSscc18 } = require('../dist/services/markirovkaClient.service');
const { getAdminMetrics } = require('../dist/controllers/metrics.controller');
Module._load = original;
const oldFetch = global.fetch;
global.fetch = unexpected('network');
after(() => { global.fetch = oldFetch; process.chdir(initialCwd); assert.equal(path.dirname(work), os.tmpdir()); fs.rmSync(work, { recursive: true, force: true }); });
beforeEach(() => { models.clear(); delete prisma.$transaction; delete prisma.$queryRaw; });
const user = { id: 'owner', role: 'CLIENT', email: 'fixture@example.test', companyName: 'Fixture', binIin: '000000000001', phone: '00000000000' };
const response = () => ({ statusCode: 200, status(n) { this.statusCode = n; return this; }, json(body) { this.body = body; return this; }, setHeader() {} });
const request = body => ({ user, body, params: { id: 'fixture-order' }, headers: {}, query: {} });
const prices = () => { prisma.tariff.findUnique = async () => null; prisma.pricingSettings.findUnique = async () => null; };

test('GS survives CSV, quoted TXT and multi-column parsing byte for byte', () => {
  const code = '010000000000000021SERIAL\x1d91TEST\x1d92SIGNATURE';
  for (const text of [code, 'code\r\n"' + code + '"', 'code;gtin\n"' + code + '";00000000000000']) {
    assert.equal(codeService.parseCodesFile(text).rows[0].code, code);
  }
});

test('all password entry points share nonblank and bcrypt byte limits; reset rejects before consuming OTP', async () => {
  for (const value of ['        ', 'short', 'x'.repeat(73), 'я'.repeat(37), {}, null]) {
    assert.equal(isValidPassword(value), false);
    const res = response(); await resetPasswordWithCode({ body: { email: 'fixture@example.test', code: '123456', newPassword: value } }, res);
    assert.equal(res.statusCode, 400);
  }
  assert.equal(isValidPassword('  valid-password  '), true);
  assert.equal(isValidPassword('я'.repeat(36)), true);
});

test('unverified JWT payload alone never reveals tariff cost fields', async () => {
  prisma.tariff.findMany = async () => [{ code: 'PRINT', costEstimate: 5, marginEst: 'private' }];
  prisma.pricingSettings.findUnique = async () => ({});
  const res = response(); await getTariffs({ headers: { authorization: 'Bearer revoked-fixture' } }, res);
  assert.equal(res.body.tariffs[0].costEstimate, undefined); assert.equal(res.body.tariffs[0].marginEst, undefined);
  const admin = response(); await getTariffs({ headers: {}, user: { role: 'ADMIN' } }, admin);
  assert.equal(admin.body.tariffs[0].costEstimate, 5);
});

test('NKT rejection/pending beats presence of GTIN and conflicting approval fields', () => {
  assert.equal(mapNktStatus({ status: 'rejected', gtin: '00000000000000', value: 'approved' }, 'DRAFT'), 'REJECTED');
  assert.equal(mapNktStatus({ status: 'pending', gtin: '00000000000000' }, 'DRAFT'), 'PENDING_MODERATION');
  assert.equal(mapNktStatus({ status: 'unknown', gtin: '00000000000000' }, 'DRAFT'), 'DRAFT');
  assert.equal(mapNktStatus({ status: 'approved' }, 'DRAFT'), 'APPROVED');
});

test('currency words retain tiyn, round carry and represent billions', () => {
  assert.match(numberToWordsTenge(100.50), /50 тиын$/);
  assert.match(numberToWordsTenge(.01), /01 тиын$/);
  assert.equal(numberToWordsTenge(100.995), numberToWordsTenge(101));
  assert.match(numberToWordsTenge(1000000000.25), /миллиард.*25 тиын$/);
  assert.throws(() => numberToWordsTenge(NaN));
});

test('calendar days are explicit in Qyzylorda and cross UTC midnight correctly', () => {
  assert.equal(BUSINESS_TIME_ZONE, 'Asia/Qyzylorda');
  assert.equal(businessDateKey(new Date('2026-10-31T18:59:59Z')), '2026-10-31');
  assert.equal(businessDateKey(new Date('2026-10-31T19:00:00Z')), '2026-11-01');
});

test('creation stores order, positions and invoice in one nested write, stays unpaid and replays one key', async () => {
  prices(); let saved = null, writes = 0;
  prisma.order.findUnique = async () => saved;
  prisma.order.findFirst = async () => null; prisma.order.count = async () => 0;
  prisma.userStickerTemplate.findFirst = async () => ({ id: 'template', isPaid: false, widthMm: 58, heightMm: 40, elements: [] });
  prisma.order.create = async ({ data }) => {
    writes++; assert.equal(data.positions.create.length, 1); assert.equal(data.invoices.create.totalAmount, data.totalPrice);
    assert.equal(data.invoices.create.status, 'PENDING');
    saved = { ...data, id: 'fixture-order', paymentStatus: 'UNPAID', printAllowed: false }; return saved;
  };
  const body = { category: 'SHOES', tariffType: 'DIGITAL', itemsCount: 1, templateId: 'template', positions: [{ name: 'Product', quantity: 1 }], idempotencyKey: 'fixture-create-key-123' };
  const first = response(); await orders.createOrder(request(body), first);
  assert.equal(first.statusCode, 201); assert.equal(first.body.order.paymentStatus, 'UNPAID');
  const repeat = response(); await orders.createOrder(request(body), repeat);
  assert.equal(repeat.statusCode, 200); assert.equal(repeat.body.replayed, true); assert.equal(writes, 1);
  const conflict = response(); await orders.createOrder(request({ ...body, itemsCount: 2 }), conflict);
  assert.equal(conflict.statusCode, 409); assert.equal(writes, 1);
});

test('foreign emission account is refused before the order write', async () => {
  prices(); prisma.order.findUnique = async () => null; prisma.order.findFirst = async () => null; prisma.order.count = async () => 0;
  prisma.markirovkaAccount.findUnique = async () => ({ id: 'foreign', userId: 'other', status: 'ACTIVE' });
  const res = response(); await orders.createOrder(request({ category: 'SHOES', tariffType: 'DIGITAL', itemsCount: 1,
    markirovkaMode: 'EMISSION', markirovkaAccountId: 'foreign', markirovkaGtin: '00000000000000', idempotencyKey: 'fixture-foreign-key' }), res);
  assert.equal(res.statusCode, 403);
});

test('full PDF rejects 2500 DB codes before reading or generating a truncated result', async () => {
  prisma.order.findFirst = async () => ({ id: 'fixture-order', userId: user.id, paymentStatus: 'PAID', status: 'NEW', itemsCount: 2500,
    extraServices: [], stickerLayout: { elements: [{ type: 'text' }], widthMm: 58, heightMm: 40 } });
  prisma.orderCodeItem.count = async () => 2500;
  const res = response(); await orders.downloadOrderPdf(request({}), res);
  assert.equal(res.statusCode, 400); assert.equal(res.body.totalItems, 2500);
});

test('quote adjustment retains box and official-code-fee inputs and atomically syncs pending invoice', async () => {
  prices(); let updated, invoice;
  const current = { id: 'order', tariffType: 'PRINT', itemsCount: 500, totalPrice: 10600, userId: 'owner', paymentStatus: 'UNPAID', status: 'NEW',
    boxesCount: 2, includeOfficialCodeFee: true, ssccNeeded: true, extraServices: [] };
  const tx = { $queryRaw: async () => [], order: { findUniqueOrThrow: async () => current, update: async ({ data }) => updated = { ...current, ...data } },
    orderCodeItem: { count: async () => 0 }, invoice: { findMany: async () => [{ id: 'invoice' }], update: async ({ data }) => { invoice = data; } } };
  prisma.$transaction = async fn => fn(tx);
  await updateOrderQuote('order', { itemsCount: 500 });
  assert.equal(Number(updated.totalPrice), 10600); assert.equal(invoice.totalAmount, updated.totalPrice);
  assert.equal(invoice.items.create.quantity, 500);
  current.pricingInputsKnown = false;
  await assert.rejects(updateOrderQuote('order', { itemsCount: 500 }), /подтверждение/);
});

test('paid template grant only updates the template of the settled order owner', async () => {
  let grant;
  await grantPaidTemplate({ userStickerTemplate: { updateMany: async data => { grant = data; } } }, { userId: 'owner', templateId: 'template', extraServices: ['STICKER_LAYOUT_APPROVAL'] });
  assert.deepEqual(grant.where, { id: 'template', userId: 'owner', isPaid: false }); assert.equal(grant.data.isPaid, true);
});

test('code replacement failure in a later batch rolls back rows and removes only its new file', async () => {
  const previous = { id: 'code-order', orderNumber: 'TB-FIXTURE', userId: 'owner', createdAt: new Date(), itemsCount: 1, status: 'NEW', paymentStatus: 'UNPAID' };
  prisma.order.findUniqueOrThrow = async () => previous;
  let state = ['OLD-CODE'];
  prisma.$transaction = async fn => {
    let next = [...state], calls = 0;
    const tx = { $queryRaw: async () => [], order: { findUniqueOrThrow: async () => previous }, orderCodeItem: {
      findMany: async () => next.map(code => ({ code })), findFirst: async () => null,
      deleteMany: async () => { next = []; }, createMany: async ({ data }) => { if (++calls === 2) throw new Error('late batch failed'); next.push(...data.map(row => row.code)); },
    } };
    const result = await fn(tx); state = next; return result;
  };
  await assert.rejects(codeService.attachCodesToOrder(previous.id, Array.from({ length: 1001 }, (_, index) => 'NEW-' + index)), /late batch failed/);
  assert.deepEqual(state, ['OLD-CODE']); assert.deepEqual(fs.readdirSync(path.join(work, 'uploads/orders', previous.id)), []);
});

test('heavy request admission bounds simultaneous memory work and releases each request once', () => {
  const held = []; let accepted = 0;
  const handler = limitHeavyRequests(() => { accepted++; });
  const makeResponse = () => Object.assign(new EventEmitter(), response());
  for (const id of ['a', 'b']) { const res = makeResponse(); handler({ user: { id } }, res, assert.fail); held.push(res); }
  const blocked = makeResponse(); handler({ user: { id: 'c' } }, blocked, assert.fail);
  assert.equal(blocked.statusCode, 429); assert.equal(accepted, 2);
  held[0].emit('finish'); held[0].emit('close');
  const allowed = makeResponse(); handler({ user: { id: 'c' } }, allowed, assert.fail);
  assert.equal(accepted, 3);
  held.slice(1).forEach(res => res.emit('finish')); allowed.emit('finish');
});

test('SSCC sequence persists across connections and allocates unique valid values at one timestamp', async () => {
  const { PGlite } = require('@electric-sql/pglite'); const db = new PGlite();
  try {
    await db.exec('CREATE SEQUENCE sscc_serial_seq MAXVALUE 999999999 NO CYCLE; CREATE TABLE allocations(code TEXT PRIMARY KEY)');
    prisma.$queryRaw = async () => (await db.query("SELECT nextval('sscc_serial_seq')::text AS serial")).rows;
    prisma.ssccAllocation.create = async ({ data }) => db.query('INSERT INTO allocations VALUES ($1)', [data.code]);
    const allocated = [];
    for (let index = 0; index < 50; index++) allocated.push(await allocateSscc('owner'));
    assert.equal(new Set(allocated).size, 50);
    allocated.forEach((code, index) => { assert.equal(normalizeSscc18(code), code); assert.equal(Number(code.slice(10, 19)), index + 1); });
    assert.throws(() => normalizeSscc18('123')); assert.throws(() => normalizeSscc18(allocated[0].slice(0, -1) + ((Number(allocated[0].at(-1)) + 1) % 10)));
  } finally { await db.close(); }
});

test('metrics SQL uses business-day boundaries and excludes adjacent UTC events', async () => {
  const { PGlite } = require('@electric-sql/pglite'); const db = new PGlite();
  try {
    await db.exec(`CREATE TABLE "Order" ("createdAt" TIMESTAMP NOT NULL, "totalPrice" NUMERIC, "itemsCount" INTEGER);
      INSERT INTO "Order" VALUES ('2026-10-31 18:59:59',100,1),('2026-10-31 19:00:00',10,1),('2026-11-01 18:59:59',20,1),('2026-11-01 19:00:00',1000,1);`);
    prisma.$queryRaw = async (strings, ...values) => (await db.query(strings.reduce((sql, part, index) => sql + (index ? '$' + index : '') + part, ''), values)).rows;
    prisma.order.aggregate = async () => ({ _count: { _all: 2 }, _sum: { totalPrice: 30, itemsCount: 2 } });
    prisma.order.groupBy = async ({ by }) => [{ [by[0]]: { tariffType: 'DIGITAL', category: 'SHOES', status: 'NEW', paymentStatus: 'PAID', userId: 'owner' }[by[0]], _count: { _all: 2 }, _sum: { totalPrice: 30, itemsCount: 2 } }];
    prisma.user.count = async () => 0; prisma.user.findMany = async () => [{ id: 'owner' }];
    prisma.serviceLead.groupBy = async () => []; prisma.serviceLead.count = async () => 0;
    const res = response();
    await getAdminMetrics({ query: { period: 'custom', from: '2026-11-01', to: '2026-11-01' } }, res);
    assert.equal(res.statusCode, 200); assert.equal(res.body.startDate, '2026-10-31T19:00:00.000Z');
    assert.deepEqual(res.body.dailyTimeline, [{ date: '2026-11-01', label: '2026-11-01', revenue: 30, orders: 2, codes: 2 }]);
  } finally { await db.close(); }
});
