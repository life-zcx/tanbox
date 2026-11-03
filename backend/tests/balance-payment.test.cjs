const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Prisma } = require('@prisma/client');
const { prisma } = require('../dist/config/db');
const { payWithBalance } = require('../dist/services/balancePayment.service');

// Transactional double: serializes row-lock users and rolls back all changes on failure.
function database({ failHistory = false, balance = 1000 } = {}) {
  let state = { balance, order: { id: 'order', userId: 'owner', orderNumber: '1', totalPrice: 100, status: 'NEW', paymentStatus: 'UNPAID' }, invoice: { id: 'invoice', orderId: 'order', userId: 'owner', invoiceNumber: '1', totalAmount: 100, status: 'PENDING' }, payments: [] };
  let tail = Promise.resolve();
  prisma.$transaction = async callback => {
    const previous = tail; let release;
    tail = new Promise(resolve => { release = resolve; });
    await previous;
    const next = structuredClone(state);
    const target = name => ({ ...next[name], totalPrice: new Prisma.Decimal(100), totalAmount: new Prisma.Decimal(100) });
    const tx = {
      $queryRaw: async () => [],
      user: {
        updateMany: async ({ data }) => { const amount = Number(data.balance.decrement); if (next.balance < amount) return { count: 0 }; next.balance -= amount; return { count: 1 }; },
        findUniqueOrThrow: async () => ({ balance: next.balance }),
      },
      order: { findUnique: async () => target('order'), update: async ({ data }) => Object.assign(next.order, data) },
      invoice: {
        findUnique: async () => target('invoice'), count: async () => next.invoice.status === 'PAID' ? 1 : 0,
        update: async ({ data }) => Object.assign(next.invoice, data),
        updateMany: async ({ data }) => { Object.assign(next.invoice, data); return { count: 1 }; },
      },
      onlinePayment: { create: async ({ data }) => { if (failHistory) throw new Error('history write failed'); next.payments.push(data); } },
    };
    try { const result = await callback(tx); state = next; return result; } finally { release(); }
  };
  return () => state;
}

test('concurrent invoice and order payments charge the shared obligation only once', async () => {
  const state = database();
  const result = await Promise.allSettled([
    payWithBalance('owner', false, 'invoice', 'invoice'), payWithBalance('owner', false, 'order', 'order'),
  ]);
  assert.equal(result.filter(value => value.status === 'fulfilled').length, 1);
  assert.equal(state().balance, 900);
  assert.equal(state().payments.length, 1);
  assert.equal(state().invoice.status, 'PAID');
  assert.equal(state().order.paymentStatus, 'PAID');
});

test('a failed history write rolls back the debit and both statuses', async () => {
  const state = database({ failHistory: true });
  await assert.rejects(payWithBalance('owner', false, 'invoice', 'invoice'), /history write failed/);
  assert.equal(state().balance, 1000);
  assert.equal(state().invoice.status, 'PENDING');
  assert.equal(state().order.paymentStatus, 'UNPAID');
  assert.equal(state().payments.length, 0);
});

test('insufficient balance and another client cannot debit the payer', async () => {
  const state = database({ balance: 50 });
  await assert.rejects(payWithBalance('owner', false, 'order', 'order'), { code: 'INSUFFICIENT_BALANCE' });
  await assert.rejects(payWithBalance('intruder', false, 'invoice', 'invoice'), { code: 'FORBIDDEN' });
  assert.equal(state().balance, 50);
  assert.equal(state().payments.length, 0);
});
