import type { SiteLanguage } from '../utils/seoPaths';

export const REQUIREMENTS_CHECKED_AT = '2026-11-06';
export const OFFICIAL_PRODUCT_LIST = 'https://adilet.zan.kz/rus/docs/G26TI000199';
const TANBA_PRODUCTS: Record<string, string> = {
  tobacco: 'tobacco', shoes: 'shoes', pharma: 'medicine', saiga: 'derivaty',
  oils: 'motornye-masla', beer: 'pivovarennaya-produkciya', bad: 'supplements',
  textile: 'industry', jewelry: 'yuvelirnyye-izdeliya', timber: 'drevesina', lpg: 'gazovye-ballony',
};

export function getCategoryTimelineSource(id: string): string | undefined {
  const slug = TANBA_PRODUCTS[id];
  return slug ? `https://tanba.telecom.kz/ru/business/product/${slug}` : undefined;
}
export const REGULATORY_SOURCES = {
  list: { title: '№ 199-НҚ — Әділет', url: OFFICIAL_PRODUCT_LIST },
  bad: { title: 'Минздрав РК / ҚР ДСМ / Ministry of Health', url: 'https://www.gov.kz/org/dsm/press/news/details/1278863?lang=ru' },
  oils: { title: 'Минэнерго РК / ҚР ЭМ / Ministry of Energy', url: 'https://www.gov.kz/org/energo/press/news/details/1156358?lang=ru' },
  textile: { title: 'МПС РК / ҚР ӨҚМ / Ministry of Industry', url: 'https://www.gov.kz/org/mps/press/news/details/1297922?lang=ru' },
  pharma: { title: 'Минздрав РК / ҚР ДСМ / Ministry of Health', url: 'https://www.gov.kz/org/dsm/press/news/details/992798?lang=ru' },
  timber: { title: 'Минэкологии РК / ҚР ЭТРМ / Ministry of Ecology', url: 'https://www.gov.kz/org/ecogeo/press/news/details/1180416?lang=ru' },
  lpg: { title: 'МПС РК / ҚР ӨҚМ / Ministry of Industry', url: 'https://www.gov.kz/org/mps/press/news/details/1174920?lang=ru' },
};

export function getRegulatorySources(categoryId?: string, lang: SiteLanguage = 'ru') {
  const source = REGULATORY_SOURCES[categoryId as keyof typeof REGULATORY_SOURCES];
  const sources = source && source !== REGULATORY_SOURCES.list ? [REGULATORY_SOURCES.list, source] : [REGULATORY_SOURCES.list];
  const timelineSource = categoryId ? getCategoryTimelineSource(categoryId) : undefined;
  return [
    ...(timelineSource ? [{ title: 'TAÑBA', url: timelineSource }] : []),
    ...sources.map(item => ({ ...item, title: item.title.split(' / ')[lang === 'ru' ? 0 : lang === 'kz' ? 1 : 2] || item.title })),
  ];
}
