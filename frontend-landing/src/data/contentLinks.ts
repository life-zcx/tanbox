const categoryArticle: Record<string, string> = {
  shoes: 'markirovka-obuvi-kazakhstan-pod-klyuch',
  pharma: 'markirovka-lekarstv-i-bad-kazakhstan', bad: 'markirovka-lekarstv-i-bad-kazakhstan',
  oils: 'markirovka-motornyh-masel-kazakhstan-2026',
  water: 'markirovka-vody-i-napitkov-kazakhstan', textile: 'markirovka-odezhdy-tekstilya-kazakhstan',
  beer: 'markirovka-piva-kazakhstan-2026-2027',
  jewelry: 'markirovka-yuvelirnyh-izdeliy-kazakhstan-2026', timber: 'markirovka-drevesiny-kazakhstan-2026',
  lpg: 'markirovka-szhizhennogo-gaza-ballonov-kazakhstan-2027',
};

export const relatedArticleSlug = (category: string) => categoryArticle[category] || 'shtrafy-za-otsutstvie-markirovki-kazakhstan-2026';
export function articleCategoryId(slug: string, code?: string): string | undefined {
  if (slug.includes('tekstilya')) return 'textile';
  if (slug.includes('piva')) return 'beer';
  return Object.entries(categoryArticle).find(([, article]) => article === slug)?.[0]
    || (code === 'oil' ? 'oils' : code);
}
