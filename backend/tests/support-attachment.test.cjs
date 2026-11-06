const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const Module = require('node:module');
const http = require('node:http');
const https = require('node:https');
const express = require('express');

const originalCwd = process.cwd();
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'tanbox-support-'));
process.chdir(work);
const user = (id = 'client-a') => ({ id, role: id === 'admin' ? 'ADMIN' : 'CLIENT', email: 'same@example.test', companyName: 'Fixture', phone: '00000000000', binIin: '000000000001' });
const prisma = {};
let attachments, savedLeads, sentNotifications;
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  const file = Module._resolveFilename(request, parent).replaceAll('\\', '/');
  if (file.endsWith('/dist/config/db.js')) return { prisma };
  if (file.endsWith('/dist/utils/logger.js')) return { logger: { info() {}, warn() {}, error() {} } };
  if (file.endsWith('/dist/services/telegram.service.js')) return { telegram: new Proxy({}, { get: () => async () => { sentNotifications++; } }) };
  if (file.endsWith('/dist/services/email.service.js')) return { sendEmail: async () => { sentNotifications++; } };
  if (file.endsWith('/dist/middleware/auth.middleware.js')) return { authenticateJWT: (req, res, next) => {
    const id = { 'Bearer fixture-a': 'client-a', 'Bearer fixture-b': 'client-b', 'Bearer fixture-admin': 'admin' }[req.headers.authorization];
    if (!id) return res.status(401).json({ message: 'Fixture authentication required' });
    req.user = user(id); next();
  } };
  return originalLoad.call(this, request, parent, isMain);
};
const support = require('../dist/controllers/support.controller');
const leads = require('../dist/controllers/leads.controller');
const supportRoutes = require('../dist/routes/support.routes').default;
Module._load = originalLoad;

const originalNetwork = { fetch: global.fetch, http: http.request, https: https.request };
const noNetwork = () => { throw new Error('External network disabled in support tests'); };
global.fetch = (url, options) => {
  assert.equal(new URL(url).hostname, '127.0.0.1');
  return originalNetwork.fetch(url, options);
};
http.request = noNetwork; https.request = noNetwork;
after(() => {
  global.fetch = originalNetwork.fetch; http.request = originalNetwork.http; https.request = originalNetwork.https;
  process.chdir(originalCwd);
  assert.equal(path.dirname(work), os.tmpdir());
  fs.rmSync(work, { recursive: true, force: true });
});
const response = () => ({ statusCode: 200, status(n) { this.statusCode = n; return this; }, json(body) { this.body = body; return this; }, sendFile(file) { this.file = file; return this; } });
const filename = 'bug_fixture.png';
const directory = path.join(work, 'uploads/bug-reports');
const download = async (actor, name = filename) => {
  const res = response(); await support.getBugReportAttachment({ user: actor, params: { filename: name } }, res); return res;
};
beforeEach(() => {
  attachments = new Map(); savedLeads = []; sentNotifications = 0;
  prisma.user = { findUnique: async ({ where }) => user(where.id) };
  prisma.supportAttachment = { findUnique: async ({ where }) => attachments.get(where.filename) || null };
  prisma.serviceLead = {
    findFirst: () => { throw new Error('Text/email ownership must never be queried'); },
    create: async ({ data }) => {
      savedLeads.push(data);
      if (data.attachments) attachments.set(data.attachments.create.filename, { ownerId: data.attachments.create.ownerId });
      return { id: `lead-${savedLeads.length}`, ...data };
    },
  };
  fs.writeFileSync(path.join(directory, filename), 'FIXTURE-PRIVATE-FILE');
});

test('a forged public lead, including spoofed ownership fields, grants no attachment access', async () => {
  attachments.set(filename, { ownerId: 'client-b' });
  const res = response();
  await leads.createLead({ body: {
    serviceTitle: '[BUG-REPORT]', companyName: 'Fixture', phone: '00000000000', email: user().email,
    notes: JSON.stringify({ type: 'BUG_REPORT', screenshotPath: `/api/support/bug-reports/attachment/${filename}` }),
    ownerId: 'client-a', attachments: { create: { filename, ownerId: 'client-a' } },
  } }, res);
  assert.equal(res.statusCode, 201);
  assert.equal(savedLeads[0].attachments, undefined);
  const denied = await download(user());
  assert.equal(denied.statusCode, 403); assert.equal(denied.file, undefined);
});

test('owner identity, rather than email, controls access and survives email changes', async () => {
  attachments.set(filename, { ownerId: 'client-a' });
  const owner = await download({ ...user(), email: 'changed@example.test' });
  assert.equal(owner.statusCode, 200);
  assert.equal(owner.file, path.join(directory, filename));
  const other = await download(user('client-b'));
  assert.equal(other.statusCode, 403); assert.equal(other.file, undefined);
});

test('legacy files without trusted metadata remain admin-only', async () => {
  assert.equal((await download(user())).statusCode, 403);
  assert.equal((await download(user('admin'))).statusCode, 200);
  assert.equal((await download(undefined)).statusCode, 401);
});

test('authorization precedes filesystem existence checks', async () => {
  assert.equal((await download(user(), 'missing.png')).statusCode, 403);
  attachments.set('missing.png', { ownerId: 'client-a' });
  assert.equal((await download(user(), 'missing.png')).statusCode, 404);
  assert.equal((await download(user('admin'), 'missing.png')).statusCode, 404);
});

test('invalid filenames cannot escape the attachment directory', async () => {
  for (const value of ['../private.png', '..\\private.png', '/etc/passwd', 'C:private.png', 'file\0.png', '', '.']) {
    assert.equal((await download(user('admin'), value)).statusCode, 400);
  }
});

test('database failure fails closed even when the file exists', async () => {
  prisma.supportAttachment.findUnique = async () => { throw new Error('Fixture database unavailable'); };
  const res = await download(user());
  assert.equal(res.statusCode, 500); assert.equal(res.file, undefined);
});

test('real multipart uploads create trusted ownership atomically with the lead and unique filenames', async () => {
  const app = express(); app.use(express.json()); app.use('/api/support', supportRoutes);
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const upload = async (description, bytes = 'FIXTURE-UPLOAD') => {
    const form = new FormData();
    form.set('description', description); form.set('ownerId', 'client-b');
    form.set('attachments', JSON.stringify({ create: { filename, ownerId: 'client-b' } }));
    form.set('screenshot', new Blob([bytes], { type: 'image/png' }), 'same-name.png');
    const res = await fetch(base + '/api/support/bug-report', { method: 'POST', headers: { Authorization: 'Bearer fixture-a' }, body: form });
    return { status: res.status, body: await res.json() };
  };
  try {
    const results = await Promise.all([upload('First fixture', 'FIRST'), upload('Second fixture', 'SECOND')]);
    assert.deepEqual(results.map(result => result.status), [201, 201]);
    assert.equal(savedLeads.length, 2);
    const filenames = savedLeads.map(lead => lead.attachments.create.filename);
    assert.equal(new Set(filenames).size, 2);
    for (const lead of savedLeads) {
      const record = lead.attachments.create;
      assert.equal(record.ownerId, 'client-a'); assert.equal(record.originalName, 'same-name.png');
      assert.match(record.filename, /^bug_[0-9a-f]{8}-[0-9a-f-]{27}\.png$/);
      const notes = JSON.parse(lead.notes);
      assert.equal(notes.screenshotPath, `/api/support/bug-reports/attachment/${record.filename}`);
      assert.equal(notes.screenshotFileName, 'same-name.png');
      const own = await fetch(base + notes.screenshotPath, { headers: { Authorization: 'Bearer fixture-a' } });
      assert.equal(own.status, 200); assert.ok(['FIRST', 'SECOND'].includes(await own.text()));
      const foreign = await fetch(base + notes.screenshotPath, { headers: { Authorization: 'Bearer fixture-b' } });
      assert.equal(foreign.status, 403); await foreign.text();
    }
    assert.equal(sentNotifications, 4); // Stubs only: Telegram + email for each successful report.
    const filesBefore = fs.readdirSync(directory).sort();
    assert.equal((await upload('   ')).status, 400);
    assert.deepEqual(fs.readdirSync(directory).sort(), filesBefore);
    prisma.serviceLead.create = async () => { throw new Error('Fixture nested write failure'); };
    assert.equal((await upload('Rejected fixture')).status, 500);
    assert.deepEqual(fs.readdirSync(directory).sort(), filesBefore);
    assert.equal(sentNotifications, 4, 'failed writes must not send notifications');
  } finally {
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
  }
});

test('reports without screenshots create no attachment metadata', async () => {
  const res = response();
  await support.submitBugReport({ user: user(), headers: {}, body: { description: 'Fixture report' } }, res);
  assert.equal(res.statusCode, 201); assert.equal(savedLeads[0].attachments, undefined);
});
