import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CATEGORIES_DATA } from '../src/data/categoriesData';
import { CATEGORIES_LOCALIZATION } from '../src/data/categoriesLocalization';
import { ARTICLES_DATA } from '../src/data/articlesData';
import { ARTICLES_LOCALIZATION } from '../src/data/articlesLocalization';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');
const SITEMAP_PATH = path.resolve(ROOT_DIR, 'public', 'sitemap.xml');
const BASE_HTML_PATH = path.resolve(DIST_DIR, 'index.html');

if (!fs.existsSync(BASE_HTML_PATH)) {
  console.error('❌ dist/index.html not found. Run "vite build" first.');
  process.exit(1);
}

const baseHtml = fs.readFileSync(BASE_HTML_PATH, 'utf-8');

// Parse all loc URLs from sitemap.xml
const sitemapContent = fs.readFileSync(SITEMAP_PATH, 'utf-8');
const locMatches = sitemapContent.matchAll(/<loc>https:\/\/tanbox\.kz(.*?)<\/loc>/g);
const routes = new Set<string>();

for (const match of locMatches) {
  let route = match[1] || '/';
  if (!route.startsWith('/')) route = '/' + route;
  routes.add(route);
}

// Ensure key core routes are present
routes.add('/');
routes.add('/kz');
routes.add('/en');
routes.add('/calculator');
routes.add('/kz/calculator');
routes.add('/en/calculator');
routes.add('/categories');
routes.add('/kz/categories');
routes.add('/en/categories');
routes.add('/articles');
routes.add('/kz/articles');
routes.add('/en/articles');
routes.add('/services');
routes.add('/kz/services');
routes.add('/en/services');
routes.add('/tariffs');
routes.add('/kz/tariffs');
routes.add('/en/tariffs');
routes.add('/blog');
routes.add('/kz/blog');
routes.add('/en/blog');
routes.add('/contacts');
routes.add('/kz/contacts');
routes.add('/en/contacts');
routes.add('/terms');
routes.add('/kz/terms');
routes.add('/en/terms');
routes.add('/privacy');
routes.add('/kz/privacy');
routes.add('/en/privacy');
routes.add('/cookies');
routes.add('/kz/cookies');
routes.add('/en/cookies');
routes.add('/cookie-policy');
routes.add('/payment-procedure');
routes.add('/kz/payment-procedure');
routes.add('/en/payment-procedure');
routes.add('/payments');
routes.add('/payment');

console.log(`🚀 Starting SSG Pre-rendering for ${routes.size} routes...`);

interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  h1: string;
  bodyContent?: string;
}

function resolvePageMeta(route: string): PageMeta {
  const canonical = `https://tanbox.kz${route === '/' ? '/' : route}`;
  let lang: 'ru' | 'kz' | 'en' = 'ru';
  let cleanRoute = route;

  if (route.startsWith('/kz')) {
    lang = 'kz';
    cleanRoute = route.replace(/^\/kz/, '') || '/';
  } else if (route.startsWith('/en')) {
    lang = 'en';
    cleanRoute = route.replace(/^\/en/, '') || '/';
  }

  // 1. Home Page
  if (cleanRoute === '/') {
    if (lang === 'kz') {
      return {
        title: 'Қазақстанда тауарларды кілтке дейін таңбалау | «Таңба» АЖ Data Matrix — TANBOX.KZ',
        description: 'Қазақстан бойынша Data Matrix тауарларын кәсіби цифрлық таңбалау. «Таңба» АЖ кодтарын шығару, НКТ номенклатурасы, стикерлерді басу, қоймада оклейка және SSCC агрегациясы.',
        canonical,
        h1: 'Қазақстанда тауарларды кілтке дейін таңбалау',
        bodyContent: `<header><h1>Қазақстанда тауарларды кілтке дейін таңбалау</h1><p>«Таңба» АЖ-де кодтардың эмиссиясы, стикерлерді басу және қоймада оклейка жасау.</p></header>`,
      };
    }
    if (lang === 'en') {
      return {
        title: 'Turnkey Product Serialization in Kazakhstan | Data Matrix IS Tanba — TANBOX.KZ',
        description: 'Professional mandatory Data Matrix product marking in Kazakhstan. Code issuance in IS Tanba, GS1 Kazakhstan nomenclature, roll thermal printing, warehouse stickering, and SSCC aggregation.',
        canonical,
        h1: 'Turnkey Product Serialization in Kazakhstan',
        bodyContent: `<header><h1>Turnkey Product Serialization in Kazakhstan</h1><p>Data Matrix code issuance, label printing, and onsite stickering across the Republic of Kazakhstan.</p></header>`,
      };
    }
    return {
      title: 'Маркировка товаров в Казахстане под ключ | Эмиссия кодов Data Matrix в ИС Танба — TANBOX.KZ',
      description: 'Профессиональная маркировка товаров Data Matrix под ключ в Республике Казахстан. Эмиссия кодов в ИС Танба, заведение номенклатуры в НКТ (ГС1 Казахстан), термопечать стикеров, выездная оклейка на складе и агрегация SSCC по РК.',
      canonical,
      h1: 'Маркировка товаров в Казахстане под ключ',
      bodyContent: `<header><h1>Маркировка товаров в Казахстане под ключ</h1><p>Эмиссия кодов Data Matrix в ИС Танба, термопечать рулонов и выездная оклейка на складах по всему Казахстану.</p></header>`,
    };
  }

  // 2. Calculator Page
  if (cleanRoute === '/calculator') {
    if (lang === 'kz') {
      return {
        title: 'Қазақстанда тауар таңбалау онлайн калькуляторы | Data Matrix құнын есептеу — TANBOX.KZ',
        description: 'Қазақстанда міндетті Data Matrix таңбалау құнын есептеңіз. Кодтарды шығару, жапсырмаларды басып шығару және қоймада желімдеу тарифтері.',
        canonical,
        h1: 'Тауарларды таңбалау онлайн калькуляторы',
      };
    }
    if (lang === 'en') {
      return {
        title: 'Marking Pricing Calculator Kazakhstan | Data Matrix Cost Estimate — TANBOX.KZ',
        description: 'Calculate product serialization and mandatory Data Matrix marking costs in Kazakhstan. Tariffs for code issuance, sticker printing, and warehouse stickering.',
        canonical,
        h1: 'Serialization Pricing Calculator',
      };
    }
    return {
      title: 'Калькулятор стоимости маркировки товаров в Казахстане | Расчет Data Matrix — TANBOX.KZ',
      description: 'Онлайн-калькулятор стоимости обязательной маркировки товаров Data Matrix в Казахстане. Тарифы на эмиссию кодов, термопечать этикеток и выездную оклейку на складе.',
      canonical,
      h1: 'Онлайн-калькулятор стоимости маркировки товаров',
    };
  }

  // 3. Category Detail Page: /categories/:slug
  const catMatch = cleanRoute.match(/^\/categories\/([a-zA-Z0-9_-]+)$/);
  if (catMatch) {
    const slug = catMatch[1];
    const catBase = CATEGORIES_DATA.find((c) => c.id === slug);
    if (catBase) {
      const loc = (lang !== 'ru' && CATEGORIES_LOCALIZATION[lang]?.[slug]) || {};
      const title = loc.title || catBase.title;
      const shortDesc = loc.shortDesc || catBase.shortDesc;
      const fullDesc = loc.fullDesc || catBase.fullDesc;
      const features = loc.keyFeatures || catBase.keyFeatures || [];
      const steps = loc.processSteps || catBase.processSteps || [];
      const faq = loc.faq || catBase.faq || [];

      const pageTitle =
        lang === 'kz'
          ? `${title} таңбалау Қазақстанда | Data Matrix кілтке дейін — TANBOX.KZ`
          : lang === 'en'
          ? `${title} Serialization in Kazakhstan | Turnkey Data Matrix — TANBOX.KZ`
          : `Маркировка: ${title} в Казахстане под ключ | Коды Data Matrix в ИС Танба — TANBOX.KZ`;

      const pageDesc = `${shortDesc}. ${fullDesc}`.slice(0, 190) + '...';

      const bodyContent = `
<header class="category-header">
  <h1>${title}</h1>
  <p class="lead">${shortDesc}</p>
  <p class="status">${catBase.statusText} • ${catBase.dateFull} • ТН ВЭД: ${catBase.tnved}</p>
</header>
<main>
  <section class="description"><p>${fullDesc}</p></section>
  <section class="features">
    <h2>Особенности маркировки</h2>
    <ul>${features.map((f) => `<li>${f}</li>`).join('')}</ul>
  </section>
  <section class="steps">
    <h2>Этапы работы</h2>
    <ol>${steps.map((s) => `<li><strong>${s.title}</strong>: ${s.desc}</li>`).join('')}</ol>
  </section>
  <section class="faq">
    <h2>Часто задаваемые вопросы</h2>
    ${faq.map((q) => `<div><h3>${q.q}</h3><p>${q.a}</p></div>`).join('')}
  </section>
</main>`;

      return {
        title: pageTitle,
        description: pageDesc,
        canonical,
        h1: title,
        bodyContent,
      };
    }
  }

  // 4. Article Detail Page: /articles/:slug
  const artMatch = cleanRoute.match(/^\/articles\/([a-zA-Z0-9_-]+)$/);
  if (artMatch) {
    const slug = artMatch[1];
    const artBase = ARTICLES_DATA.find((a) => a.slug === slug);
    if (artBase) {
      const loc = (lang !== 'ru' && ARTICLES_LOCALIZATION[lang]?.[slug]) || {};
      const title = loc.title || artBase.title;
      const summary = loc.summary || artBase.summary;
      const metaDesc = loc.metaDescription || artBase.metaDescription || summary;
      const sections = loc.contentSections || artBase.contentSections || [];
      const faq = loc.faq || artBase.faq || [];

      const pageTitle =
        lang === 'kz'
          ? `${title} — TANBOX.KZ Білім базасы`
          : lang === 'en'
          ? `${title} — TANBOX.KZ Knowledge Base`
          : `${title} — База знаний TANBOX.KZ`;

      const bodyContent = `
<article class="article-container">
  <header>
    <h1>${title}</h1>
    <p class="meta">${artBase.date} • ${artBase.readTime} • ${artBase.author}</p>
    <p class="summary"><strong>${summary}</strong></p>
  </header>
  <main>
    ${sections.map((s) => `<section id="${s.id}"><h2>${s.title}</h2><div class="content">${s.content.replace(/\n/g, '<br/>')}</div></section>`).join('')}
    ${faq.length > 0 ? `<section class="faq"><h2>Вопросы и ответы</h2>${faq.map((q) => `<div><h3>${q.q}</h3><p>${q.a}</p></div>`).join('')}</section>` : ''}
  </main>
</article>`;

      return {
        title: pageTitle,
        description: metaDesc.slice(0, 200),
        canonical,
        h1: title,
        bodyContent,
      };
    }
  }

  // 5. Category Index Page: /categories
  if (cleanRoute === '/categories') {
    return {
      title: lang === 'kz' ? 'Тауар санаттары бойынша таңбалау | TANBOX.KZ' : lang === 'en' ? 'Product Categories for Serialization | TANBOX.KZ' : 'Каталог товарных категорий обязательной маркировки в Казахстане — TANBOX.KZ',
      description: 'Все товарные группы обязательной маркировки в Республике Казахстан: обувь, одежда, лекарства, табак, безалкогольные напитки, шины, текстиль.',
      canonical,
      h1: 'Каталог товарных категорий маркировки',
    };
  }

  // 6. Articles Index Page: /articles
  if (cleanRoute === '/articles') {
    return {
      title: lang === 'kz' ? 'Таңбалау бойынша білім базасы мен мақалалар | TANBOX.KZ' : lang === 'en' ? 'Serialization Knowledge Base & Insights | TANBOX.KZ' : 'База знаний и статьи по обязательной маркировке товаров в Казахстане — TANBOX.KZ',
      description: 'Практические руководства, разборы законодательства РК, штрафы по КоАП, маркировка для Kaspi, Wildberries, Ozon и инструкции по работе с ИС Танба.',
      canonical,
      h1: 'База знаний по маркировке товаров',
    };
  }

  // 7. Services Page: /services
  if (cleanRoute === '/services') {
    return {
      title: 'Услуги обязательной цифровой маркировки Data Matrix в Казахстане — TANBOX.KZ',
      description: 'Комплексные услуги: эмиссия кодов в ИС Танба, термопечать рулонов стикеров, выездная оклейка на складе, агрегация в короба и паллеты (SSCC).',
      canonical,
      h1: 'Услуги маркировки товаров под ключ',
    };
  }

  // 8. Contacts Page: /contacts
  if (cleanRoute === '/contacts') {
    return {
      title: 'Контакты компании TANBOX.KZ | Центр обслуживания клиентов по маркировке',
      description: 'Контакты центра обслуживания клиентов TANBOX: телефон +7 (700) 304-85-32, WhatsApp, email, график работы выездных бригад оклейки на складах.',
      canonical,
      h1: 'Контакты сервиса TANBOX.KZ',
    };
  }

  // 9. Legal Pages
  if (cleanRoute === '/terms') {
    return {
      title: 'Договор публичной оферты | TANBOX.KZ',
      description: 'Публичная оферта на оказание услуг по цифровой маркировке товаров Data Matrix и агрегации в Республике Казахстан. Исполнитель: ИП INTERSENSE.',
      canonical,
      h1: 'Публичная оферта',
    };
  }
  if (cleanRoute === '/privacy') {
    return {
      title: 'Политика конфиденциальности и защиты персональных данных | TANBOX.KZ',
      description: 'Политика обработки персональных данных в соответствии с Законом РК «О персональных данных и их защите».',
      canonical,
      h1: 'Политика конфиденциальности',
    };
  }
  if (cleanRoute === '/cookies' || cleanRoute === '/cookie-policy') {
    return {
      title: 'Политика использования файлов cookie | TANBOX.KZ',
      description: 'Правила и политика использования файлов cookie на сайте TANBOX.KZ в соответствии с Законом РК «Об информатизации».',
      canonical,
      h1: 'Политика файлов cookie',
    };
  }
  if (cleanRoute === '/payment-procedure') {
    return {
      title: 'Порядок оплаты, доставки и возврата | TANBOX.KZ',
      description: 'Официальный порядок проведения онлайн-оплаты через Freedom Pay, безналичного расчета для юридических лиц и условия возврата средств.',
      canonical,
      h1: 'Порядок оплаты и возврата',
    };
  }

  // Default fallback
  return {
    title: 'Маркировка товаров в Казахстане под ключ | TANBOX.KZ',
    description: 'Цифровая маркировка товаров Data Matrix под ключ в Республике Казахстан.',
    canonical,
    h1: 'Маркировка товаров в Казахстане',
  };
}

let generatedCount = 0;

for (const route of routes) {
  const meta = resolvePageMeta(route);

  // Replace Title
  let html = baseHtml.replace(/<title>.*?<\/title>/s, `<title>${meta.title}</title>`);

  // Replace meta title
  html = html.replace(/<meta\s+name="title"\s+content=".*?"\s*\/?>/i, `<meta name="title" content="${meta.title}" />`);

  // Replace meta description
  html = html.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/i, `<meta name="description" content="${meta.description}" />`);

  // Replace Canonical Link (CRITICAL FOR SEO: Each page has its own canonical!)
  html = html.replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/i, `<link rel="canonical" href="${meta.canonical}" />`);

  // Replace OpenGraph Title & Description & URL
  html = html.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/i, `<meta property="og:title" content="${meta.title}" />`);
  html = html.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/i, `<meta property="og:description" content="${meta.description}" />`);
  html = html.replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/i, `<meta property="og:url" content="${meta.canonical}" />`);

  // Inject semantic SSR pre-rendered content inside root div for search engine crawlers
  if (meta.bodyContent) {
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root"><div class="ssg-pre-rendered-seo" style="display:contents;">${meta.bodyContent}</div></div>`
    );
  }

  // Determine output file path
  let targetFilePath = '';
  if (route === '/' || route === '') {
    targetFilePath = path.join(DIST_DIR, 'index.html');
  } else {
    const subDir = path.join(DIST_DIR, route.replace(/^\//, ''));
    if (!fs.existsSync(subDir)) {
      fs.mkdirSync(subDir, { recursive: true });
    }
    targetFilePath = path.join(subDir, 'index.html');
  }

  fs.writeFileSync(targetFilePath, html, 'utf-8');
  generatedCount++;
}

// Generate Standalone 404.html (True HTTP 404 page)
const notFoundHtml = baseHtml
  .replace(/<title>.*?<\/title>/s, `<title>Страница не найдена (404) | TANBOX.KZ</title>`)
  .replace(/<meta\s+name="robots".*?>/i, `<meta name="robots" content="noindex, follow" />`)
  .replace(
    '<div id="root"></div>',
    `<div id="root" style="min-height:100vh;display:flex;align-items:center;justify-center:center;background:#0F172A;color:white;font-family:sans-serif;text-align:center;padding:24px;">
      <div style="max-width:540px;margin:auto;">
        <div style="font-size:72px;font-weight:900;color:#0082FB;line-height:1;">404</div>
        <h1 style="font-size:24px;font-weight:800;margin:16px 0 8px;">Страница не найдена</h1>
        <p style="font-size:14px;color:#94A3B8;margin-bottom:24px;">Запрошенный адрес не существует или был перемещен.</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          <a href="/" style="background:#0082FB;color:white;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:700;font-size:14px;">На главную</a>
          <a href="/calculator" style="background:rgba(255,255,255,0.1);color:white;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:700;font-size:14px;">Калькулятор</a>
        </div>
      </div>
    </div>`
  );

fs.writeFileSync(path.join(DIST_DIR, '404.html'), notFoundHtml, 'utf-8');

console.log(`✅ SSG generation complete! Pre-rendered ${generatedCount} pages + 404.html with unique titles, descriptions, canonicals, and crawler-ready HTML!`);
