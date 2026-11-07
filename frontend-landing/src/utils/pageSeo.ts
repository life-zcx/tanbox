import { STATIC_PAGE_METADATA } from '../data/pageMetadata';
import { DEFAULT_PUBLIC_PRICING, tariffRate, type PublicPricing } from '../data/publicPricing';
import { CATEGORIES_DATA, getLocalizedCategory } from '../data/categoriesData';
import { SITE_URL, getRouteLanguage, languageAlternates, localizedPath, normalizePath, unlocalizedPath, type SiteLanguage } from './seoPaths';

export interface PageSeo {
  title: string;
  description: string;
  lang: SiteLanguage;
  canonical?: string;
  alternates: Record<string, string>;
  noindex: boolean;
  schemas: object[];
}

const homeLabels = { ru: 'Главная', kz: 'Басты бет', en: 'Home' };
const sectionLabels = {
  categories: { ru: 'Категории', kz: 'Санаттар', en: 'Categories' },
  articles: { ru: 'База знаний', kz: 'Білім базасы', en: 'Knowledge Base' },
};

export async function getPageSeo(pathname: string, pricing: PublicPricing = DEFAULT_PUBLIC_PRICING): Promise<PageSeo> {
  const path = normalizePath(pathname);
  const lang = getRouteLanguage(path);
  const clean = unlocalizedPath(path);
  const canonical = SITE_URL + path;
  const locale = lang === 'kz' ? 'kk' : lang;
  const page = (STATIC_PAGE_METADATA as Record<string, Record<SiteLanguage, { title: string; description: string }>>)[clean]?.[lang];
  const result: PageSeo = { title: page?.title || '', description: page?.description || '', lang,
    canonical, alternates: languageAlternates(path), noindex: false, schemas: [] };
  let breadcrumbs: Array<{ name: string; url: string }> = [];
  let faq: Array<{ q: string; a: string }> = [];

  if (clean.startsWith('/categories/')) {
    const category = CATEGORIES_DATA.find(c => c.id === clean.slice('/categories/'.length));
    if (category) {
      const data = getLocalizedCategory(category, lang);
      result.title = lang === 'kz' ? `${data.shortTitle}: Қазақстанда таңбалау — TANBOX.KZ`
        : lang === 'en' ? `${data.shortTitle} Marking in Kazakhstan — TANBOX.KZ`
        : `Маркировка: ${data.title} в Казахстане | TANBOX.KZ`;
      result.description = `${data.shortDesc}. ${data.fullDesc}`.slice(0, 200);
      breadcrumbs = [{ name: homeLabels[lang], url: SITE_URL + localizedPath('/', lang) },
        { name: sectionLabels.categories[lang], url: SITE_URL + localizedPath('/categories', lang) },
        { name: data.shortTitle, url: canonical }];
      faq = data.faq;
    }
  } else if (clean.startsWith('/articles/')) {
    const { getArticleBySlug } = await import('../data/articlesData');
    const article = getArticleBySlug(clean.slice('/articles/'.length), lang);
    if (article) {
      result.title = `${article.title} | TANBOX.KZ`;
      result.description = article.metaDescription;
      breadcrumbs = [{ name: homeLabels[lang], url: SITE_URL + localizedPath('/', lang) },
        { name: sectionLabels.articles[lang], url: SITE_URL + localizedPath('/articles', lang) },
        { name: article.shortTitle, url: canonical }];
      faq = article.faq;
      result.schemas.push({ '@type': 'Article', '@id': `${canonical}#article`, headline: article.title,
        description: article.metaDescription, inLanguage: locale,
        author: { '@type': 'Organization', name: article.author, url: SITE_URL + '/' },
        publisher: { '@id': `${SITE_URL}/#organization` }, mainEntityOfPage: { '@id': canonical },
        ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
        ...(article.updatedAt ? { dateModified: article.updatedAt } : {}),
      });
    }
  } else if (clean === '/') {
    const { getHomeFaq } = await import('../data/homeFaq');
    faq = getHomeFaq(lang);
  }

  if (!result.title) {
    return { title: lang === 'kz' ? 'Бет табылмады (404) | TANBOX.KZ' : lang === 'en' ? 'Page Not Found (404) | TANBOX.KZ' : 'Страница не найдена (404) | TANBOX.KZ',
      description: lang === 'kz' ? 'Сұралған бет табылмады немесе жылжытылған.' : lang === 'en' ? 'The requested page does not exist or has moved.' : 'Запрошенная страница не существует или была перемещена.',
      lang, alternates: {}, noindex: true, schemas: [] };
  }

  result.schemas.unshift(
    { '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: 'TANBOX.KZ', url: SITE_URL + '/', logo: `${SITE_URL}/tanbox-dark.svg` },
    { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: 'TANBOX.KZ', url: SITE_URL + '/', inLanguage: ['ru', 'kk', 'en'], publisher: { '@id': `${SITE_URL}/#organization` } },
    { '@type': 'WebPage', '@id': canonical, url: canonical, name: result.title, description: result.description,
      inLanguage: locale, isPartOf: { '@id': `${SITE_URL}/#website` } },
  );
  if (breadcrumbs.length) result.schemas.push({ '@type': 'BreadcrumbList', itemListElement: breadcrumbs.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.name, item: b.url })) });
  if (faq.length) result.schemas.push({ '@type': 'FAQPage', mainEntity: faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
  if (clean === '/services') {
    const labels = lang === 'kz' ? ['Data Matrix кодтарын шығару', 'Жапсырмаларды басу', 'Стандарт таңбалау', 'PRO қоймасы', 'ҰТК карточкалары', 'SSCC агрегациясы', 'Қызметкерлерді оқыту', 'Бір реттік аутсорсинг']
      : lang === 'en' ? ['Data Matrix issuance', 'Label printing', 'Standard marking', 'PRO warehouse', 'NKT product cards', 'SSCC aggregation', 'Staff training', 'One-time outsourcing']
      : ['Эмиссия Data Matrix', 'Печать этикеток', 'Маркировка Стандарт', 'PRO Склад', 'Карточки НКТ', 'Агрегация SSCC', 'Обучение сотрудников', 'Разовый аутсорсинг'];
    const settings = pricing.pricingSettings;
    const prices = [tariffRate(pricing, 'DIGITAL'), tariffRate(pricing, 'PRINT'), tariffRate(pricing, 'STANDARD'), tariffRate(pricing, 'PRO'), settings.cardNktPrice, settings.ssccPrice, settings.trainingCoursePrice, settings.outsourcingOneTimePrice];
    result.schemas.push({ '@type': 'Service', '@id': `${canonical}#service`, name: result.title, description: result.description,
      provider: { '@id': `${SITE_URL}/#organization` }, areaServed: { '@type': 'Country', name: 'Kazakhstan' },
      hasOfferCatalog: { '@type': 'OfferCatalog', name: result.title, itemListElement: prices.map((price, i) => ({
        '@type': 'Offer', name: labels[i], priceCurrency: 'KZT', price,
        ...(i < 4 ? { eligibleQuantity: { '@type': 'QuantitativeValue', minValue: 1, maxValue: settings.volumeTier1, unitCode: 'C62' } } : {}),
      })) } });
  }
  return result;
}

export function serializeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

export const schemaGraph = (page: PageSeo) => ({ '@context': 'https://schema.org', '@graph': page.schemas });
