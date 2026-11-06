const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const { Prisma } = require('@prisma/client');
const prisma = {};
const original = Module._load;
Module._load = function (request, parent, isMain) {
  const file = Module._resolveFilename(request, parent).replaceAll('\\', '/');
  if (file.endsWith('/dist/config/db.js')) return { prisma };
  if (file.endsWith('/dist/services/freedomPay.service.js')) return { freedomPayService: { verifyPgSig: () => true, buildXmlResponse: (_script, status) => status } };
  if (file.endsWith('/dist/utils/logger.js')) return { logger: { info() {}, warn() {}, error() {} } };
  if (file.endsWith('/dist/utils/orderLifecycle.js')) return { advanceOrderStatus: async () => {} };
  if (file.endsWith('/dist/services/telegram.service.js')) return { telegram: new Proxy({}, { get: () => async () => {} }) };
  return original.call(this, request, parent, isMain);
};
const { freedomResultWebhook } = require('../dist/controllers/payments.controller');
Module._load = original;
const oldFetch = global.fetch;
global.fetch = () => { throw new Error('External HTTP disabled'); };
after(() => { global.fetch = oldFetch; });
const decimal = value => new Prisma.Decimal(value);

function database(type, amount, total, paymentStatus = 'UNPAID') {
  let state = {
    order: { id: 'order', userId: 'owner', totalPrice: decimal(total), status: 'NEW', paymentStatus, printAllowed: false,
      templateId: 'template', extraServices: ['STICKER_LAYOUT_APPROVAL'], tariffType: 'DIGITAL', itemsCount: 1, ssccNeeded: false, includeOfficialCodeFee: false },
    payment: { id: 'payment', userId: 'owner', orderId: 'order', invoiceId: 'invoice', type, amount: decimal(amount), status: 'PENDING', paymentNumber: 'FIXTURE', user: { companyName: 'Fixture' } },
    invoice: { id: 'invoice', userId: 'owner', orderId: 'order', totalAmount: decimal(total), status: 'PENDING' }, paidTemplate: false,
  };
  prisma.onlinePayment = { findUnique: async () => state.payment };
  prisma.tariff = { findUnique: async () => null }; prisma.pricingSettings = { findUnique: async () => null };
  prisma.$transaction = async fn => {
    const next = { order: { ...state.order }, payment: { ...state.payment }, invoice: { ...state.invoice }, paidTemplate: state.paidTemplate };
    const tx = {
      $queryRaw: async () => [],
      order: { findUniqueOrThrow: async () => next.order, update: async ({ data }) => Object.assign(next.order, data) },
      onlinePayment: { findUniqueOrThrow: async () => next.payment, updateMany: async ({ data }) => { if (next.payment.status === 'PAID') return { count: 0 }; Object.assign(next.payment, data); return { count: 1 }; } },
      invoice: { findUniqueOrThrow: async () => next.invoice, update: async ({ data }) => Object.assign(next.invoice, data), updateMany: async ({ data }) => Object.assign(next.invoice, data) },
      userStickerTemplate: { updateMany: async () => { next.paidTemplate = true; } },
    };
    const result = await fn(tx); state = next; return result;
  };
  return () => state;
}
async function webhook(amount) {
  const res = { type() { return this; }, send(body) { this.body = body; return this; } };
  await freedomResultWebhook({ path: '/result', query: {}, body: { pg_order_id: 'FIXTURE', pg_amount: String(amount), pg_result: '1', pg_sig: 'FIXTURE-SIGNATURE' } }, res);
  return res;
}

test('webhook cannot settle a more expensive order or an already settled obligation', async () => {
  for (const [amount, total, status] of [[8, 8000, 'UNPAID'], [100, 100, 'PAID']]) {
    const state = database('ORDER', amount, total, status);
    assert.equal((await webhook(amount)).body, 'error');
    assert.equal(state().payment.status, 'PENDING'); assert.equal(state().order.paymentStatus, status); assert.equal(state().paidTemplate, false);
  }
});

test('a layout-only payment grants the template without marking the order paid or enabling printing', async () => {
  const state = database('STICKER_LAYOUT', 1000, 1008);
  assert.equal((await webhook(1000)).body, 'ok');
  assert.equal(state().payment.status, 'PAID'); assert.equal(state().paidTemplate, true);
  assert.equal(state().order.paymentStatus, 'UNPAID'); assert.equal(state().order.printAllowed, false); assert.equal(state().invoice.status, 'PENDING');
});

test('matching full invoice payment settles atomically and repeated callbacks do not reapply it', async () => {
  const state = database('INVOICE', 100, 100);
  assert.equal((await webhook(100)).body, 'ok');
  assert.equal(state().order.paymentStatus, 'PAID'); assert.equal(state().order.printAllowed, true); assert.equal(state().paidTemplate, true);
  assert.equal((await webhook(100)).body, 'ok'); assert.equal(state().invoice.status, 'PAID');
});
