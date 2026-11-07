import { schemaGraph, serializeJson, type PageSeo } from './pageSeo';

export function applyPageSeo(page: PageSeo): void {
  document.title = page.title;
  document.documentElement.lang = page.lang === 'kz' ? 'kk' : page.lang;
  const meta = (key: string, content: string, attr = 'name') => {
    let node = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
    if (!node) { node = document.createElement('meta'); node.setAttribute(attr, key); document.head.appendChild(node); }
    node.content = content;
  };
  meta('description', page.description);
  meta('title', page.title);
  meta('og:type', page.schemas.some(schema => (schema as { '@type'?: string })['@type'] === 'Article') ? 'article' : 'website', 'property');
  meta('robots', page.noindex ? 'noindex, follow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
  for (const [key, value] of [['og:title', page.title], ['og:description', page.description], ['og:url', page.canonical || ''], ['og:locale', page.lang === 'kz' ? 'kk_KZ' : page.lang === 'en' ? 'en_US' : 'ru_KZ']]) meta(key, value, 'property');
  meta('twitter:title', page.title); meta('twitter:description', page.description); meta('twitter:url', page.canonical || '');
  document.head.querySelectorAll('link[rel="canonical"],link[hreflang]').forEach(node => node.remove());
  if (page.canonical) {
    const link = document.createElement('link'); link.rel = 'canonical'; link.href = page.canonical; document.head.appendChild(link);
  }
  for (const [lang, href] of Object.entries(page.alternates)) {
    const link = document.createElement('link'); link.rel = 'alternate'; link.hreflang = lang; link.href = href; document.head.appendChild(link);
  }
  document.head.querySelectorAll('script[type="application/ld+json"]').forEach(node => node.remove());
  if (page.schemas.length) {
    const script = document.createElement('script'); script.id = 'tanbox-page-schema'; script.type = 'application/ld+json';
    script.textContent = serializeJson(schemaGraph(page)); document.head.appendChild(script);
  }
}
