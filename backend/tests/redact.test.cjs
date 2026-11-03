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
test('OTP fields and legacy plaintext OTP log messages are masked', () => {
  const output = serializeLogMeta({ otp: '123456', otpCode: '234567', verificationCode: '345678', code: '456789', error: { code: 'EAUTH' } });
  for (const value of ['123456', '234567', '345678', '456789']) assert.equal(output.includes(value), false);
  assert.equal(JSON.parse(output).error.code, 'EAUTH');
  assert.equal(redactLogText('[ADMIN OTP] generated: >>> 123456 <<<'), '[ADMIN OTP] generated: >>> [REDACTED] <<<');
  assert.equal(redactLogText('otpCode=123456'), 'otpCode=[REDACTED]');
  assert.equal(redactLogText('/auth?code=123456'), '/auth?code=[REDACTED]');
});
