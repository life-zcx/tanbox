import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const origin = 'https://tanbox.kz';
const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
assert.equal(urls.length, 114, 'All current canonical routes must be generated');
assert.equal(new Set(urls).size, urls.length, 'Sitemap must not repeat a URL');

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(match => [match[1], match[2].replace(/&amp;/g, '&')]));
}
function tags(html, name) { return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'g'))].map(match => attributes(match[0])); }
function script(html, id) {
  const text = html.match(new RegExp(`<script\\b[^>]*id="${id}"[^>]*>([\\s\\S]*?)<\\/script>`))?.[1];
  assert.ok(text, `Missing ${id}`); return JSON.parse(text);
}

const pages = new Map();
const titles = new Set();
const descriptions = new Set();
const categoryStageCounts = { tobacco: 3, shoes: 6, pharma: 5, water: 3, saiga: 3, oils: 5, beer: 5, bad: 4, textile: 7, jewelry: 3, timber: 3, lpg: 3 };
for (const url of urls) {
  const pathname = new URL(url).pathname;
  const html = fs.readFileSync(path.join(dist, pathname.slice(1), 'index.html'), 'utf8');
  assert.ok(!html.includes('\0'), `HTML contains no stream padding: ${url}`);
  assert.ok(html.includes('<!--email_off--><div id="root">') && html.includes('<!--/email_off-->'), `Hydrated contacts are excluded from edge email rewriting: ${url}`);
  const links = tags(html, 'link');
  const meta = tags(html, 'meta');
  const canonical = links.filter(link => link.rel === 'canonical');
  assert.deepEqual(canonical.map(link => link.href), [url], `Canonical: ${url}`);
  assert.equal(meta.filter(tag => tag.name === 'description').length, 1, `One description: ${url}`);
  assert.ok(!meta.find(tag => tag.name === 'robots')?.content.includes('noindex'), `Indexable: ${url}`);
  const lang = /^\/kz(?:\/|$)/.test(pathname) ? 'kk' : /^\/en(?:\/|$)/.test(pathname) ? 'en' : 'ru';
  assert.ok(html.includes(`<html lang="${lang}"`), `Document language: ${url}`);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1, `One H1: ${url}`);
  assert.ok(!html.includes('ssg-seo-content'), `Render the real application: ${url}`);
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  const description = meta.find(tag => tag.name === 'description')?.content;
  assert.ok(title && description, `Metadata present: ${url}`);
  assert.ok(!titles.has(title), `Unique title: ${url}`); titles.add(title);
  assert.ok(!descriptions.has(description), `Unique description: ${url}`); descriptions.add(description);
  const anchors = tags(html, 'a');
  const prefix = lang === 'kk' ? '/kz' : lang === 'en' ? '/en' : '';
  const categoryId = pathname.match(/\/categories\/([^/]+)$/)?.[1];
  if (categoryId) {
    const count = categoryStageCounts[categoryId];
    assert.ok(count, `Known category timeline: ${url}`);
    assert.ok(html.includes(`/banners/${categoryId}.svg`), `Original category infographic is rendered: ${url}`);
    const stageLabel = n => lang === 'kk' ? `${n}-кезең` : lang === 'en' ? `Stage ${n}` : `Этап ${n}`;
    assert.ok(html.includes(stageLabel(count)) && !html.includes(stageLabel(count + 1)), `Complete original timeline: ${url}`);
    if (categoryId !== 'water') assert.ok(html.includes('https://tanba.telecom.kz/ru/business/product/'), `Direct TAÑBA timeline source: ${url}`);
  }
  for (const section of ['/services', '/calculator', '/contacts']) assert.ok(anchors.some(a => a.href === prefix + section), `Static navigation ${section}: ${url}`);
  const graph = script(html, 'tanbox-page-schema')['@graph'];
  assert.equal(tags(html, 'script').filter(tag => tag.type === 'application/ld+json').length, 1, `One schema graph: ${url}`);
  const article = /\/articles\//.test(pathname);
  assert.equal(graph.filter(node => node['@type'] === 'Article').length, article ? 1 : 0, `Current Article only: ${url}`);
  assert.ok(graph.filter(node => node['@type'] === 'FAQPage').length <= 1, `One FAQ: ${url}`);
  if (article) {
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] || '';
    for (const section of ['/services', '/calculator']) assert.ok(tags(main, 'a').some(a => a.href === prefix + section), `Editorial commercial link ${section}: ${url}`);
  }
  if (lang === 'en') {
    for (const match of html.matchAll(/<h[123]\b[^>]*>([\s\S]*?)<\/h[123]>/g)) {
      assert.ok(!/маркиров|товар|требован|обучен|ответствен|содержан|внедрен/i.test(match[1]), `English heading is translated: ${url}`);
    }
  }
  const pricing = script(html, 'tanbox-public-pricing');
  assert.equal(pricing.tariffs.length, 4, `Public tariff snapshot: ${url}`);
  const alternates = Object.fromEntries(links.filter(link => link.hreflang).map(link => [link.hreflang, link.href]));
  assert.deepEqual(Object.keys(alternates).sort(), ['en', 'kk', 'ru', 'x-default'], `Four language alternates: ${url}`);
  pages.set(url, { html, anchors, alternates });
}
for (const [url, page] of pages) {
  for (const alternate of Object.values(page.alternates)) {
    assert.ok(pages.has(alternate), `Hreflang target generated: ${url}`);
    assert.ok(Object.values(pages.get(alternate).alternates).includes(url), `Reciprocal hreflang: ${url}`);
  }
  for (const anchor of page.anchors) {
    if (!anchor.href || /^(?:mailto:|tel:|javascript:)/.test(anchor.href)) continue;
    const target = new URL(anchor.href, url);
    if (target.origin !== origin) continue;
    assert.ok(pages.has(target.origin + target.pathname), `Internal link target ${target.href} from ${url}`);
    if (target.hash) assert.ok(pages.get(target.origin + target.pathname).html.includes(`id="${decodeURIComponent(target.hash.slice(1))}"`), `Fragment ${target.href}`);
  }
}
const errorPage = fs.readFileSync(path.join(dist, '404.html'), 'utf8');
assert.ok(tags(errorPage, 'meta').some(meta => meta.name === 'robots' && meta.content.includes('noindex')), '404 noindex');
assert.equal(tags(errorPage, 'link').filter(link => link.rel === 'canonical').length, 0, '404 has no canonical');
const visited = new Set();
const queue = [origin + '/'];
for (let i = 0; i < queue.length; i++) {
  const url = queue[i];
  if (visited.has(url)) continue;
  visited.add(url);
  for (const link of pages.get(url).anchors) {
    if (!link.href) continue;
    const target = new URL(link.href, url);
    const canonical = target.origin + target.pathname;
    if (pages.has(canonical) && !visited.has(canonical)) queue.push(canonical);
  }
}
assert.equal(visited.size, urls.length, 'Every sitemap page is reachable from RU home via ordinary static links');
for (const prefix of ['kz', 'en']) {
  const localizedError = fs.readFileSync(path.join(dist, prefix, '404.html'), 'utf8');
  assert.ok(localizedError.includes(`<html lang="${prefix === 'kz' ? 'kk' : 'en'}"`), 'Localized 404 language');
  assert.ok(tags(localizedError, 'meta').some(meta => meta.name === 'robots' && meta.content.includes('noindex')), 'Localized 404 noindex');
  assert.equal(tags(localizedError, 'link').filter(link => link.rel === 'canonical').length, 0, 'Localized 404 without canonical');
}
console.log(`PASS: ${urls.length} pages, unique metadata, H1, static links, language pairs, current schemas, public pricing, internal links and 404.`);
