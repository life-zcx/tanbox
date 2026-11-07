import type { CalculationResult } from '../types';
import type { SiteLanguage } from './seoPaths';

export function formatEstimate(result: CalculationResult, lang: SiteLanguage): string {
  const text = result.estimatedTimeText || `~${result.estimatedDays} день`;
  if (lang === 'ru') return text;
  const amount = text.match(/\d+(?:[–-]\d+)?/)?.[0] || String(result.estimatedDays);
  const hours = /час|\d+\s*ч(?:\s|\)|$)/.test(text);
  const unit = lang === 'kz' ? (hours ? 'сағат' : 'күн') : (hours ? (amount === '1' ? 'hour' : 'hours') : (amount === '1' ? 'day' : 'days'));
  const urgent = text.includes('экспресс') ? (lang === 'kz' ? 'Жедел: ' : 'Express: ') : '';
  const sameDay = text.includes('в день заказа') ? (lang === 'kz' ? ' (тапсырыс күні)' : ' (same day)') : '';
  return `${urgent}~${amount} ${unit}${sameDay}`;
}
