const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const https = require('node:https');
const { EventEmitter } = require('node:events');
const { Readable } = require('node:stream');
let addresses, requested, fixture;
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'dns/promises') return { lookup: async hostname => ({ ...addresses })[hostname] || [{ address: '8.8.8.8', family: 4 }] };
  return originalLoad.call(this, request, parent, isMain);
};
const { integrationFetch, fetchPublicImage, isPublicAddress, validateTrustedIntegrationUrl } = require('../dist/services/integrationHttp.service');
Module._load = originalLoad;
const originalRequest = https.request, originalGet = https.get;
const fakeRequest = (url, options, callback) => {
  const event = new EventEmitter();
  event.end = bytes => {
    requested.push({ url: String(url), options, bytes });
    options.lookup(url.hostname, { all: true }, (err, pinned) => {
      assert.equal(err, null); assert.deepEqual(pinned, [{ address: '8.8.8.8', family: 4 }]);
    });
    const response = Readable.from([Buffer.from(fixture.body)]); response.statusCode = fixture.status; response.headers = fixture.headers;
    process.nextTick(() => callback(response));
  };
  return event;
};
https.request = fakeRequest;
https.get = (url, options, callback) => { const request = fakeRequest(url, options, callback); request.end(); return request; };
after(() => { https.request = originalRequest; https.get = originalGet; });
beforeEach(() => { addresses = {}; requested = []; fixture = { status: 200, headers: { 'content-type': 'application/json' }, body: '{"ok":true}' }; });

test('URL trust rejects attacker hosts, loopback variants, credentials, ports and HTTP', () => {
  for (const url of ['https://attacker.example.test', 'http://nationalcatalog.kz/gwp', 'https://localhost.', 'https://[::ffff:7f00:1]', 'https://[fd00::2]', 'https://nationalcatalog.kz:8443', 'https://user:password@nationalcatalog.kz']) {
    assert.throws(() => validateTrustedIntegrationUrl(url));
  }
  assert.equal(validateTrustedIntegrationUrl('https://nationalcatalog.kz/gwp').hostname, 'nationalcatalog.kz');
});

test('private/reserved IPv4 and IPv6 cannot be used by images or trusted integration DNS', async () => {
  for (const address of ['127.0.0.1', '10.0.0.1', '169.254.169.254', '100.64.0.1', '192.168.1.1', '198.18.0.1', '::1', '::ffff:127.0.0.1', 'fd00::2', 'fe80::1', '2001:db8::1']) assert.equal(isPublicAddress(address), false, address);
  addresses['nationalcatalog.kz'] = [{ address: '8.8.8.8', family: 4 }, { address: '10.0.0.1', family: 4 }];
  await assert.rejects(integrationFetch('https://nationalcatalog.kz/gwp'), /Private/);
  await assert.rejects(fetchPublicImage('https://nationalcatalog.kz/image.png'), /Private/);
  assert.equal(requested.length, 0);
});

test('integration credentials use the pinned address and never follow redirects', async () => {
  const response = await integrationFetch('https://nationalcatalog.kz/gwp', { headers: { 'X-API-KEY': 'fixture-only' } });
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(requested[0].options.headers['x-api-key'], 'fixture-only');
  fixture = { status: 302, headers: { location: 'https://attacker.example.test' }, body: '' };
  await assert.rejects(integrationFetch('https://nationalcatalog.kz/gwp'), /redirects/);
  assert.equal(requested.length, 2); assert.ok(requested.every(row => row.url.startsWith('https://nationalcatalog.kz')));
});

test('image redirects are revalidated and private second-hop DNS never opens a socket', async () => {
  fixture = { status: 302, headers: { location: 'https://internal.example.test/image.png' }, body: '' };
  addresses['internal.example.test'] = [{ address: '127.0.0.1', family: 4 }];
  await assert.rejects(fetchPublicImage('https://public.example.test/image.png'), /Private/);
  assert.equal(requested.length, 1);
});

test('images are size bounded and accept only supported image content types', async () => {
  fixture = { status: 200, headers: { 'content-type': 'image/png' }, body: Buffer.from('FIXTURE') };
  assert.equal((await fetchPublicImage('https://public.example.test/image.png')).size, 7);
  fixture.headers['content-type'] = 'text/html';
  await assert.rejects(fetchPublicImage('https://public.example.test/image.png'), /Unsupported/);
  fixture = { status: 200, headers: { 'content-type': 'image/png' }, body: Buffer.alloc(10 * 1024 * 1024 + 1) };
  await assert.rejects(fetchPublicImage('https://public.example.test/image.png'), /10MB/);
});
