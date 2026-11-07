import React from 'react';
import { renderToPipeableStream, renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LandingApplication } from '../src/App';
import { AppErrorBoundary } from '../src/components/common/AppErrorBoundary';
import { CATEGORIES_DATA } from '../src/data/categoriesData';
import { ARTICLES_DATA } from '../src/data/articlesData';
import { STATIC_PAGE_METADATA } from '../src/data/pageMetadata';
import { DEFAULT_PUBLIC_PRICING, normalizePublicPricing, type PublicPricing } from '../src/data/publicPricing';
import { getPageSeo, schemaGraph, serializeJson, type PageSeo } from '../src/utils/pageSeo';
import { SITE_URL, languageAlternates, localizedPath } from '../src/utils/seoPaths';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

async function loadPricing(): Promise<PublicPricing> {
  const endpoint = process.env.TANBOX_PUBLIC_PRICING_URL || `${SITE_URL}/api/tariffs`;
  try {
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return normalizePublicPricing(await response.json());
  } catch (error) {
    if (process.env.TANBOX_PUBLIC_PRICING_URL) throw error;
    console.warn('Public tariff snapshot unavailable; using verified shared fallback:', String(error));
    return DEFAULT_PUBLIC_PRICING;
  }
}

function renderPage(route: string, pricing: PublicPricing): Promise<string> {
  return new Promise((resolve, reject) => {
    const element = React.createElement(React.StrictMode, null,
      React.createElement(AppErrorBoundary, null,
        React.createElement(StaticRouter, { location: route },
          React.createElement(LandingApplication, { initialPricing: pricing }))));
    renderToPipeableStream(element, {
      // Wait for React.lazy boundaries, then serialize as a string. React 18's
      // Node stream can emit unused zero padding at UTF-8 buffer boundaries.
      onAllReady() {
        try { resolve(renderToString(element)); } catch (error) { reject(error); }
      },
      onShellError: reject,
      onError(error) { reject(error); },
    });
  });
}

const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function documentHtml(page: PageSeo, body: string, pricing: PublicPricing): string {
  let html = template.replace(/<html\s+lang="[^"]*"/, `<html lang="${page.lang === 'kz' ? 'kk' : page.lang}"`);
  html = html.replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<link\b[^>]*\brel="canonical"[^>]*>/g, '')
    .replace(/<link\b[^>]*\bhreflang="[^"]*"[^>]*>/g, '')
    .replace(/<meta\b[^>]*(?:name="(?:title|description|robots|keywords|twitter:title|twitter:description|twitter:url)"|property="(?:og:title|og:description|og:url|og:locale|og:type)")[^>]*>/g, '')
    .replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g, '');
  const head = [
    `<title>${escape(page.title)}</title>`,
    `<meta name="title" content="${escape(page.title)}">`,
    `<meta name="description" content="${escape(page.description)}">`,
    `<meta name="robots" content="${page.noindex ? 'noindex, follow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'}">`,
    `<meta property="og:type" content="${page.schemas.some((s: any) => s['@type'] === 'Article') ? 'article' : 'website'}">`,
    `<meta property="og:locale" content="${page.lang === 'kz' ? 'kk_KZ' : page.lang === 'en' ? 'en_US' : 'ru_KZ'}">`,
  ];
  for (const [key, value] of [['og:title', page.title], ['og:description', page.description], ['og:url', page.canonical || '']]) head.push(`<meta property="${key}" content="${escape(value)}">`);
  for (const [key, value] of [['twitter:title', page.title], ['twitter:description', page.description], ['twitter:url', page.canonical || '']]) head.push(`<meta name="${key}" content="${escape(value)}">`);
  if (page.canonical) head.push(`<link rel="canonical" href="${page.canonical}">`);
  for (const [lang, href] of Object.entries(page.alternates)) head.push(`<link rel="alternate" hreflang="${lang}" href="${href}">`);
  if (page.schemas.length) head.push(`<script id="tanbox-page-schema" type="application/ld+json">${serializeJson(schemaGraph(page))}</script>`);
  head.push(`<script id="tanbox-public-pricing" type="application/json">${serializeJson(pricing)}</script>`);
  // Cloudflare must leave hydrated public contact text/links unchanged.
  // These documented exclusion comments sit outside React's root.
  return html.replace('</head>', head.join('\n') + '\n</head>').replace('<div id="root"></div>', () => `<!--email_off--><div id="root">${body}</div><!--/email_off-->`);
}

const pricing = await loadPricing();
const primaryRoutes = [...Object.keys(STATIC_PAGE_METADATA), ...CATEGORIES_DATA.map(c => `/categories/${c.id}`), ...ARTICLES_DATA.map(a => `/articles/${a.slug}`)];
const routes = [...new Set(primaryRoutes.flatMap(route => (['ru', 'kz', 'en'] as const).map(lang => localizedPath(route, lang))))];
for (const route of routes) {
  const [page, body] = await Promise.all([getPageSeo(route, pricing), renderPage(route, pricing)]);
  if (page.noindex) throw new Error(`Canonical route has no SEO metadata: ${route}`);
  const target = path.join(dist, route.slice(1), 'index.html');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, documentHtml(page, body, pricing));
}

for (const prefix of ['', '/kz', '/en']) {
  const notFoundPath = `${prefix}/__tanbox_missing_page__`;
  fs.writeFileSync(path.join(dist, prefix.slice(1), '404.html'), documentHtml(await getPageSeo(notFoundPath, pricing), await renderPage(notFoundPath, pricing), pricing));
}
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${routes.map(route => `  <url>\n    <loc>${SITE_URL}${route}</loc>\n${Object.entries(languageAlternates(route)).map(([lang, href]) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${href}"/>`).join('\n')}\n  </url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);
console.log(`Prerendered ${routes.length} real React pages and three localized HTTP 404 documents with shared metadata/pricing.`);
