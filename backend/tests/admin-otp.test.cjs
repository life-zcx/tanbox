const { test } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
process.env.NODE_ENV = 'production';
process.env.JWT_SECRET = 'test-only-secret-longer-than-thirty-two-characters';
process.env.SMTP_HOST = 'smtp.example.test';
process.env.SMTP_USER = 'smtp@example.test';
process.env.SMTP_PASS = 'fixture-password';

let messages = [], deliveryError = null, records = [], logs = [], telegramCalls = 0;
require('nodemailer').createTransport = () => ({ sendMail: async options => {
  if (deliveryError) throw deliveryError;
  messages.push(options); return { messageId: 'fixture-message' };
} });
const { logger } = require('../dist/utils/logger');
for (const level of ['info', 'warn', 'error']) logger[level] = (...args) => logs.push(JSON.stringify(args));
const { prisma } = require('../dist/config/db');
const { telegram } = require('../dist/services/telegram.service');
telegram.sendRaw = async () => { telegramCalls++; };
const mail = require('../dist/services/email.service');
const { login, hashOtpCode } = require('../dist/controllers/auth.controller');
const response = () => ({ statusCode: 200, status(n) { this.statusCode = n; return this; }, json(body) { this.body = body; return this; } });
const password = 'test-admin-password';

async function setup(email) {
  messages = []; deliveryError = null; records = []; logs = []; telegramCalls = 0;
  prisma.user.findUnique = async () => ({ id: email, email, role: 'ADMIN', password: await bcrypt.hash(password, 4), isBlocked: false, tokenVersion: 0, balance: 0 });
  prisma.verificationCode.create = async ({ data }) => { const row = { id: 'fixture-code', ...data }; records.push(row); return row; };
  prisma.verificationCode.findFirst = async ({ where }) => records.find(row => row.email === where.email) || null;
  prisma.verificationCode.deleteMany = async ({ where }) => {
    const before = records.length;
    records = records.filter(row => !(row.email === where.email && (!where.id || row.id === where.id)));
    return { count: before - records.length };
  };
}
const request = (email, code) => ({ body: { email, password, code, isAdminPanel: true }, headers: {}, ip: '127.0.0.1', socket: {} });

test('admin code goes only to email; logs and Telegram never receive it', async () => {
  const email = 'admin-delivery@example.test'; await setup(email);
  const res = response(); await login(request(email), res);
  assert.equal(res.statusCode, 200); assert.equal(res.body.requireOtp, true);
  assert.equal(messages.length, 1); assert.equal(telegramCalls, 0);
  assert.equal(typeof telegram.sendAdminLoginOtp, 'undefined');
  const code = messages[0].html.match(/>\s*(\d{6})\s*<\/span>/)[1];
  assert.equal(records[0].email, 'admin-login:' + email);
  assert.equal(records[0].code, hashOtpCode(code));
  assert.equal(messages[0].subject.includes(code), false);
  assert.equal(logs.join('\n').includes(code), false);
  assert.equal(JSON.stringify(res.body).includes(code), false);
  assert.equal(res.body.message.includes('Telegram'), false);
});

test('SMTP failure revokes the challenge and permits an immediate retry', async () => {
  const email = 'admin-failure@example.test'; await setup(email);
  deliveryError = Object.assign(new Error('SMTP echoed private body 123456'), { code: 'EAUTH' });
  const res = response(); await login(request(email), res);
  assert.equal(res.statusCode, 503); assert.equal(records.length, 0);
  assert.equal(res.body.requireOtp, undefined); assert.equal(telegramCalls, 0);
  assert.equal(logs.join('\n').includes('123456'), false);
  deliveryError = null;
  const retry = response(); await login(request(email), retry);
  assert.equal(retry.statusCode, 200); assert.equal(messages.length, 1);
});

test('a reset-password code cannot authenticate an admin, and a login code is single use', async () => {
  const email = 'admin-isolation@example.test'; await setup(email);
  records = [{ id: 'reset', email, code: hashOtpCode('123456'), expiresAt: new Date(Date.now() + 600000) }];
  const reset = response(); await login(request(email, '123456'), reset);
  assert.equal(reset.statusCode, 400); assert.equal(reset.body.token, undefined);
  const sent = response(); await login(request(email), sent);
  const code = messages[0].html.match(/>\s*(\d{6})\s*<\/span>/)[1];
  const success = response(); await login(request(email, code), success);
  assert.equal(success.statusCode, 200); assert.equal(typeof success.body.token, 'string');
  const replay = response(); await login(request(email, code), replay);
  assert.equal(replay.statusCode, 400); assert.equal(replay.body.token, undefined);
});

test('all OTP email helpers omit plaintext codes from subjects and development logs', async () => {
  await setup('dev@example.test'); process.env.NODE_ENV = 'development';
  try {
    for (const send of [mail.sendAdminLoginOtpEmail, mail.sendVerificationOtpEmail, mail.sendPasswordResetOtpEmail]) await send('dev@example.test', '123456');
    assert.equal(messages.length, 3);
    assert.equal(messages.some(message => message.subject.includes('123456')), false);
    assert.equal(logs.join('\n').includes('123456'), false);
  } finally { process.env.NODE_ENV = 'production'; }
});
