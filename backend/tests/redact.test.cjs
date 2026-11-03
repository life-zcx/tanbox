const { test } = require('node:test');
const assert = require('node:assert/strict');
const { redactLogText, serializeLogMeta } = require('../dist/utils/redact');
test('request URLs, nested metadata and authorization cannot leak credentials', () => {
  assert.equal(redactLogText('/file?token=private&size=2'), '/file?token=[REDACTED]&size=2');
  assert.equal(redactLogText('Authorization: Bearer secret.jwt.signature'), 'Authorization: Bearer [REDACTED]');
  const value = { request: { password: 'private', token: 'private', url: '/?access_token=private' }, ok: 2 };
  value.circular = value;
  const output = serializeLogMeta(value);
  assert.equal(output.includes('private'), false);
  assert.equal(JSON.parse(output).ok, 2);
});
