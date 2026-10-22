/**
 * Dynamic SEO and Internationalization (i18n) Helper for TANBOX.KZ
 * Manages titles, meta descriptions, OpenGraph, Canonical, and Hreflang alternates
 */

export interface SeoOptions {
  lang?: 'ru' | 'kz' | 'en';
  path?: string;
  keywords?: string;
  image?: string;
}

export function setPageSeo(title: string, description?: string, options?: SeoOptions) {
  if (typeof window === 'undefined') return;

  // 1. Detect language
  let currentLang: 'ru' | 'kz' | 'en' = options?.lang || 'ru';
  if (!options?.lang) {
    const p = window.location.pathname;
    if (p === '/kz' || p.startsWith('/kz/')) currentLang = 'kz';
    else if (p === '/en' || p.startsWith('/en/')) currentLang = 'en';
  }

  // 2. Set Document Title & HTML lang
  document.title = title;
  document.documentElement.lang = currentLang === 'kz' ? 'kk' : currentLang;

  // 3. Helper to update or create meta tags
  const setMetaTag = (selector: string, attr: 'name' | 'property', key: string, content: string) => {
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  // Helper to update or create link tags
  const setLinkTag = (rel: string, extraAttr: { name: string; value: string } | null, href: string) => {
    let selector = `link[rel="${rel}"]`;
    if (extraAttr) {
      selector += `[${extraAttr.name}="${extraAttr.value}"]`;
    }
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      if (extraAttr) {
        el.setAttribute(extraAttr.name, extraAttr.value);
      }
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  };

  // 4. Meta Description & Social Snippets
  if (description) {
    setMetaTag('meta[name="description"]', 'name', 'description', description);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
  }

  // 5. OpenGraph & Twitter Titles
  setMetaTag('meta[property="og:title"]', 'property', 'og:title', title);
  setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', title);

  // 6. Locale
  const locale = currentLang === 'kz' ? 'kk_KZ' : currentLang === 'en' ? 'en_US' : 'ru_KZ';
  setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', locale);

  // 7. Keywords
  if (options?.keywords) {
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', options.keywords);
  }

  // 8. Canonical & Hreflang Alternates (CRITICAL FOR MULTILINGUAL GOOGLE & YANDEX INDEXING)
  let path = options?.path || window.location.pathname;
  if (path === '/kz' || path === '/en') path = '/';
  else if (path.startsWith('/kz/')) path = path.slice(3);
  else if (path.startsWith('/en/')) path = path.slice(3);
  if (!path.startsWith('/')) path = '/' + path;

  const baseDomain = 'https://tanbox.kz';
  const ruUrl = `${baseDomain}${path === '/' ? '' : path}`;
  const kzUrl = `${baseDomain}/kz${path === '/' ? '' : path}`;
  const enUrl = `${baseDomain}/en${path === '/' ? '' : path}`;

  const currentCanonical = currentLang === 'kz' ? kzUrl : currentLang === 'en' ? enUrl : ruUrl;

  setLinkTag('canonical', null, currentCanonical);
  setMetaTag('meta[property="og:url"]', 'property', 'og:url', currentCanonical);

  // Hreflang tags: Google requires referencing all alternates + x-default
  setLinkTag('alternate', { name: 'hreflang', value: 'ru' }, ruUrl);
  setLinkTag('alternate', { name: 'hreflang', value: 'kk' }, kzUrl);
  setLinkTag('alternate', { name: 'hreflang', value: 'en' }, enUrl);
  setLinkTag('alternate', { name: 'hreflang', value: 'x-default' }, ruUrl);

  // 9. Structured Data (Schema.org JSON-LD)
  let schemaScript = document.querySelector('#tanbox-schema-org') as HTMLScriptElement | null;
  if (!schemaScript) {
    schemaScript = document.createElement('script');
    schemaScript.id = 'tanbox-schema-org';
    schemaScript.type = 'application/ld+json';
    document.head.appendChild(schemaScript);
  }

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: currentLang === 'kz' ? 'Тауарларды цифрлық таңбалау' : currentLang === 'en' ? 'Digital Product Serialization' : 'Цифровая маркировка товаров',
    provider: {
      '@type': 'Organization',
      name: 'TANBOX.KZ',
      url: currentCanonical,
      logo: 'https://tanbox.kz/tanbox-white.svg',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Алматы',
        addressCountry: 'KZ',
      },
    },
    areaServed: {
      '@type': 'Country',
      name: currentLang === 'kz' ? 'Қазақстан' : 'Казахстан',
    },
    name: title,
    description: description || '',
  };

  schemaScript.textContent = JSON.stringify(schemaData);
}
