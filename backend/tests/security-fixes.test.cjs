const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isBlockedSsrfHostname, validateAndSanitizeNktBaseUrl } = require('../dist/services/markirovkaClient.service');

test('SSRF filter blocks loopback, private RFC1918 IPs, and cloud metadata', () => {
  const blocked = [
    '127.0.0.1', 'localhost', '0.0.0.0', '169.254.169.254',
    '10.0.0.1', '172.16.0.1', '172.20.0.5', '192.168.1.1',
    'postgres', 'backend', 'caddy', 'label-generator',
    'tanbox_postgres', 'test.local', 'api.internal'
  ];
  for (const host of blocked) {
    assert.equal(isBlockedSsrfHostname(host), true, `Host "${host}" must be blocked`);
  }

  const allowed = ['nationalcatalog.kz', 'api.markirovka.kz', 'test.markirovka.kz', 'storage.googleapis.com'];
  for (const host of allowed) {
    assert.equal(isBlockedSsrfHostname(host), false, `Host "${host}" must be allowed`);
  }
});

test('validateAndSanitizeNktBaseUrl rejects malicious SSRF URLs', () => {
  assert.throws(() => validateAndSanitizeNktBaseUrl('http://127.0.0.1:5050/api'), /запрещен/);
  assert.throws(() => validateAndSanitizeNktBaseUrl('http://169.254.169.254/latest'), /запрещен/);
  assert.throws(() => validateAndSanitizeNktBaseUrl('http://postgres:5432'), /запрещен/);
  assert.equal(validateAndSanitizeNktBaseUrl('https://nationalcatalog.kz/gwp/'), 'https://nationalcatalog.kz/gwp');
});

