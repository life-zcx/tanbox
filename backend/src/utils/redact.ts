const sensitiveKey = /^(?:authorization|cookie|password|currentPassword|newPassword|token|access_token|refresh_token|apiKey|nktApiKey|secret|secretKey|pg_sig|incomingSig|otp|otpCode|verificationCode|oneTimeCode)$/i;

export function redactLogText(value: string): string {
  return value
    .replace(/([?&](?:token|access_token|refresh_token|api_key|secret|code|otp|otpCode)=)[^\s&#"']*/gi, '$1[REDACTED]')
    .replace(/(>>>\s*)\d{6}(\s*<<<)/g, '$1[REDACTED]$2')
    .replace(/((?:\botp(?:Code)?|verificationCode|oneTimeCode|код\s+(?:подтверждения|сброса\s+пароля|входа))\s*[=:]\s*)\d{6}\b/gi, '$1[REDACTED]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+\/-]+/gi, 'Bearer [REDACTED]');
}

export function serializeLogMeta(value: unknown): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(value, (key, item) => {
    if (sensitiveKey.test(key) || (key === 'code' && /^\d{6}$/.test(String(item)))) return '[REDACTED]';
    if (typeof item === 'string') return redactLogText(item);
    if (item && typeof item === 'object') {
      if (seen.has(item)) return '[Circular]';
      seen.add(item);
    }
    return item;
  }) || '';
}
