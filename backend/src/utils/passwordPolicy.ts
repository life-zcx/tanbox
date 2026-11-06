export function isValidPassword(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length >= 8 && Buffer.byteLength(value, 'utf8') <= 72;
}
