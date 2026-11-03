const sensitiveKey = /^(?:authorization|cookie|password|currentPassword|newPassword|token|access_token|refresh_token|apiKey|nktApiKey|secret|secretKey|pg_sig|incomingSig)$/i;

export function redactLogText(value: string): string {
  return value
    .replace(/([?&](?:token|access_token|refresh_token|api_key|secret)=)[^\s&#"']*/gi, '$1[REDACTED]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+\/-]+/gi, 'Bearer [REDACTED]');
}

export function serializeLogMeta(value: unknown): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(value, (key, item) => {
    if (sensitiveKey.test(key)) return '[REDACTED]';
    if (typeof item === 'string') return redactLogText(item);
    if (item && typeof item === 'object') {
      if (seen.has(item)) return '[Circular]';
      seen.add(item);
    }
    return item;
  }) || '';
}
