export const BUSINESS_TIME_ZONE = process.env.BUSINESS_TIME_ZONE || 'Asia/Qyzylorda';
// Initialize before computing calendar boundaries or formatting financial documents.
new Intl.DateTimeFormat('en', { timeZone: BUSINESS_TIME_ZONE }).format(new Date());
process.env.TZ = BUSINESS_TIME_ZONE;

export function businessDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const part = (name: string) => parts.find(value => value.type === name)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
