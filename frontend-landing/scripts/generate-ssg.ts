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
  faqItems?: Array<{ q: string; a: string }>;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

const COMMON_FAQ = [
  {
    q: 'Что такое ИС Танба и почему маркировка обязательна в Казахстане?',
    a: 'ИС Танба (Единый оператор АО Казахтелеком) — это национальная информационная система маркировки и прослеживаемости товаров в Республике Казахстан. Продажа товаров, подлежащих обязательной маркировке, без кодов Data Matrix строго запрещена законодательством РК и влечет административную ответственность по статье 283-1 КоАП РК.',
  },
  {
    q: 'Что такое код Data Matrix и что в нем содержится?',
    a: 'Data Matrix — это двухмерный матричный штрихкод стандарта GS1, содержащий GTIN товара, индивидуальный серийный номер изделия и криптографический ключ проверки (криптохвост) для защиты от контрафакта.',
  },
  {
    q: 'Как работает агрегация кодов в короба и паллеты (SSCC)?',
    a: 'SSCC (Serial Shipping Container Code) — это международный штрихкод транспортной тары. Он объединяет в себе все коды Data Matrix товаров внутри короба или паллеты, позволяя проводить таможенную и складскую приемку одним сканированием без вскрытия индивидуальных упаковок.',
  },
  {
    q: 'Какие категории товаров подлежат обязательной маркировке в Казахстане?',
    a: 'В РК обязательной маркировке подлежат: табачные изделия, обувь, лекарственные средства, упакованная вода и сахаросодержащие напитки, а также поэтапно внедряются ювелирные изделия (с 1 декабря 2026 г.), текстиль, моторные масла, пиво и БАД.',
  },
  {
    q: 'Как быстро TANBOX выполняет заказ на печать и оклейку?',
    a: 'Печать партий этикеток осуществляется в течение 24 часов (мощность до 50 000 кодов в сутки). Выездные бригады оклейщиков приступают к работе на вашем складе или СВХ в день поставки тиража стикеров.',
  },
];

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

  const localizedPrefix = lang === 'ru' ? '' : `/${lang}`;

  // 1. Home Page
  if (cleanRoute === '/') {
    const categoriesHtml = CATEGORIES_DATA.map(
      (c) => `<li><a href="${localizedPrefix}/categories/${c.id}"><strong>${c.title}</strong></a> — ТН ВЭД: ${c.tnved} (${c.dateFull})</li>`
    ).join('');

    const faqHtml = COMMON_FAQ.map(
      (f) => `<div><h3>${f.q}</h3><p>${f.a}</p></div>`
    ).join('');

    if (lang === 'kz') {
      return {
        title: 'TANBOX — Қазақстанда тауарларды кілтке дейін таңбалау | «Таңба» АЖ Data Matrix',
        description: 'Қазақстан бойынша Data Matrix тауарларын кәсіби цифрлық таңбалау. «Таңба» АЖ кодтарын шығару, НКТ номенклатурасы, стикерлерді басу, қоймада оклейка және SSCC агрегациясы.',
        canonical,
        h1: 'Қазақстанда тауарларды кілтке дейін таңбалау',
        bodyContent: `
<header>
  <h1>Қазақстанда тауарларды кілтке дейін цифрлық таңбалау</h1>
  <p>«Таңба» АЖ-де Data Matrix кодтарын шығару, НКТ тіркеу, өндірістік басып шығару және қоймаларда оклейка жасау.</p>
</header>
<main>
  <section>
    <h2>Тауар санаттары</h2>
    <ul>${categoriesHtml}</ul>
  </section>
  <section>
    <h2>Тарифтер</h2>
    <p>Басып шығару — 25 ₸ бастап, Кешенді таңбалау — 50 ₸ бастап, Қоймалар мен СВХ — 90 ₸ бастап.</p>
  </section>
  <section>
    <h2>Жиі қойылатын сұрақтар</h2>
    ${faqHtml}
  </section>
</main>`,
        faqItems: COMMON_FAQ,
      };
    }
    if (lang === 'en') {
      return {
        title: 'TANBOX — Turnkey Product Serialization in Kazakhstan | IS Tanba',
        description: 'Professional mandatory Data Matrix product marking in Kazakhstan. Code issuance in IS Tanba, GS1 Kazakhstan nomenclature, roll thermal printing, warehouse stickering, and SSCC aggregation.',
        canonical,
        h1: 'Turnkey Product Serialization in Kazakhstan',
        bodyContent: `
<header>
  <h1>Turnkey Product Serialization & Marking in Kazakhstan</h1>
  <p>Data Matrix code generation in IS Tanba, GS1 cataloging, industrial thermal printing, warehouse stickering, and SSCC aggregation.</p>
</header>
<main>
  <section>
    <h2>Mandatory Categories</h2>
    <ul>${categoriesHtml}</ul>
  </section>
  <section>
    <h2>Pricing</h2>
    <p>Roll Printing from 25 ₸, Full Service from 50 ₸, Warehouse/Customs PRO from 90 ₸.</p>
  </section>
  <section>
    <h2>FAQ</h2>
    ${faqHtml}
  </section>
</main>`,
        faqItems: COMMON_FAQ,
      };
    }

    return {
      title: 'TANBOX — Маркировка товаров в Казахстане под ключ | ИС Танба',
      description: 'Профессиональная маркировка товаров Data Matrix под ключ в Республике Казахстан. Эмиссия кодов в ИС Танба, заведение номенклатуры в НКТ (ГС1 Казахстан), термопечать стикеров, выездная оклейка на складе и агрегация SSCC по РК.',
      canonical,
      h1: 'Маркировка товаров в Казахстане под ключ',
      bodyContent: `
<header>
  <h1>Маркировка товаров в Казахстане под ключ</h1>
  <p>Центр маркировки TANBOX: заказ и эмиссия кодов Data Matrix в ИС «Танба», регистрация карточек в Национальном каталоге товаров (НКТ / GS1), промышленная рулонная печать этикеток и выездная оклейка на складах заказчика по всему Казахстану.</p>
</header>
<main>
  <section>
    <h2>12 товарных групп обязательной маркировки в Казахстане</h2>
    <ul>${categoriesHtml}</ul>
  </section>
  <section>
    <h2>Тарифы на услуги маркировки</h2>
    <ul>
      <li><strong>Печать стикеров Data Matrix</strong> — от 25 ₸ / шт (термотрансферная печать на рулонах, устойчивая к стиранию).</li>
      <li><strong>Маркировка под ключ (Стандарт)</strong> — от 50 ₸ / шт (эмиссия в ИС Танба, заведение в НКТ, печать и выездная оклейка).</li>
      <li><strong>PRO / Склады и СВХ</strong> — от 90 ₸ / шт (агрегация в короба и паллеты SSCC, работа на таможенных складах).</li>
    </ul>
  </section>
  <section>
    <h2>Этапы работы с TANBOX</h2>
    <ol>
      <li>Регистрация номенклатуры и получение GTIN в Национальном каталоге товаров.</li>
      <li>Заказ и эмиссия кодов Data Matrix в ИС «Танба» оператора Казахтелеком.</li>
      <li>Промышленная рулонная термопечать стикеров на материалах повышенной стойкости.</li>
      <li>Складская оклейка партий товара выездными бригадами и агрегация в транспортную тару SSCC.</li>
    </ol>
  </section>
  <section>
    <h2>Часто задаваемые вопросы (FAQ)</h2>
    ${faqHtml}
  </section>
</main>`,
      faqItems: COMMON_FAQ,
    };
  }

  // 2. Calculator Page
  if (cleanRoute === '/calculator') {
    const calcBreadcrumbs = [
      { name: 'Главная', url: 'https://tanbox.kz/' },
      { name: 'Калькулятор маркировки', url: canonical },
    ];

    if (lang === 'kz') {
      return {
        title: 'Қазақстанда тауар таңбалау онлайн калькуляторы | Data Matrix құнын есептеу — TANBOX.KZ',
        description: 'Қазақстанда міндетті Data Matrix таңбалау құнын есептеңіз. Кодтарды шығару, жапсырмаларды басып шығару және қоймада желімдеу тарифтері.',
        canonical,
        h1: 'Тауарларды таңбалау онлайн калькуляторы',
        breadcrumbs: calcBreadcrumbs,
        bodyContent: `
<header>
  <h1>Тауарларды цифрлық таңбалау құнын есептеу калькуляторы</h1>
  <p>Қазақстанда «Таңба» АЖ арқылы тауарларды таңбалау және қоймада оклейка жасаудың нақты құнын онлайн есептеңіз.</p>
</header>
<main>
  <section>
    <h2>Тарифтер мен көлемдер</h2>
    <p>500-ден 5 000 данаға дейін: 25 ₸ бастап. 20 000 данадан жоғары: арнайы тарифтер қарастырылған.</p>
  </section>
</main>`,
      };
    }
    if (lang === 'en') {
      return {
        title: 'Marking Pricing Calculator Kazakhstan | Data Matrix Cost Estimate — TANBOX.KZ',
        description: 'Calculate product serialization and mandatory Data Matrix marking costs in Kazakhstan. Tariffs for code issuance, sticker printing, and warehouse stickering.',
        canonical,
        h1: 'Serialization Pricing Calculator',
        breadcrumbs: calcBreadcrumbs,
        bodyContent: `
<header>
  <h1>Online Product Marking & Serialization Calculator Kazakhstan</h1>
  <p>Instant pricing calculation for Data Matrix code generation, roll sticker printing, warehouse application, and SSCC aggregation in Kazakhstan.</p>
</header>
<main>
  <section>
    <h2>Volume Pricing Tiers</h2>
    <p>From 500 to 5,000 units: from 25 ₸/code. Over 20,000 units: custom high-volume pricing.</p>
  </section>
</main>`,
      };
    }
    return {
      title: 'Калькулятор стоимости маркировки товаров в Казахстане | Расчет Data Matrix — TANBOX.KZ',
      description: 'Онлайн-калькулятор стоимости обязательной маркировки товаров Data Matrix в Казахстане. Тарифы на эмиссию кодов, термопечать этикеток и выездную оклейку на складе.',
      canonical,
      h1: 'Онлайн-калькулятор стоимости маркировки товаров',
      breadcrumbs: calcBreadcrumbs,
      bodyContent: `
<header>
  <h1>Онлайн-калькулятор стоимости маркировки товаров в Казахстане</h1>
  <p>Точный расчет бюджета обязательной маркировки Data Matrix под ключ: генерация кодов в ИС Танба, регистрация в НКТ, термопечать рулонов и выездная оклейка на вашем складе.</p>
</header>
<main>
  <section>
    <h2>Базовые параметры расчета</h2>
    <ul>
      <li><strong>Объем партии:</strong> от 500 шт до крупных оптовых партий свыше 100 000 единиц.</li>
      <li><strong>Форматы этикеток:</strong> 30×20 мм, 40×20 мм, 58×40 мм, микро-коды для ювелирных изделий.</li>
      <li><strong>Дополнительные опции:</strong> выезд бригады оклейщиков, формирование транспортных агрегаций SSCC, регистрация в Национальном каталоге товаров.</li>
    </ul>
  </section>
  <section>
    <h2>Тарифная сетка по тиражам</h2>
    <table>
      <thead><tr><th>Объем партии</th><th>Стоимость печати</th><th>С оклейкой под ключ</th></tr></thead>
      <tbody>
        <tr><td>500 – 5 000 шт</td><td>от 25 ₸ / шт</td><td>от 50 ₸ / шт</td></tr>
        <tr><td>5 000 – 20 000 шт</td><td>от 22 ₸ / шт</td><td>от 45 ₸ / шт</td></tr>
        <tr><td>от 20 000 шт</td><td>от 18 ₸ / шт</td><td>индивидуальный спецтариф</td></tr>
      </tbody>
    </table>
  </section>
  <section>
    <p>Для моментального согласования графика и выезда бригады свяжитесь с центром маркировки TANBOX по телефону <strong>+7 (700) 304-85-32</strong> или в WhatsApp.</p>
  </section>
</main>`,
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
      const stages = catBase.stages || [];

      const pageTitle =
        lang === 'kz'
          ? `${title} таңбалау Қазақстанда | Data Matrix кілтке дейін — TANBOX.KZ`
          : lang === 'en'
          ? `${title} Serialization in Kazakhstan | Turnkey Data Matrix — TANBOX.KZ`
          : `Маркировка: ${title} в Казахстане под ключ | Коды Data Matrix в ИС Танба — TANBOX.KZ`;

      const pageDesc = `${shortDesc}. ${fullDesc}`.slice(0, 190) + '...';

      const catBreadcrumbs = [
        { name: 'Главная', url: 'https://tanbox.kz/' },
        { name: 'Категории товаров', url: `https://tanbox.kz${localizedPrefix}/categories` },
        { name: title, url: canonical },
      ];

      const bodyContent = `
<header class="category-header">
  <h1>${title}</h1>
  <p class="lead">${shortDesc}</p>
  <p class="status">${catBase.statusText} • ${catBase.dateFull} • ТН ВЭД: ${catBase.tnved}</p>
</header>
<main>
  <section class="description"><p>${fullDesc}</p></section>
  ${
    stages.length > 0
      ? `<section class="stages">
    <h2>График и этапы вступления в силу</h2>
    <ul>${stages.map((stg) => `<li><strong>${stg.date}</strong>: ${stg.title}</li>`).join('')}</ul>
  </section>`
      : ''
  }
  <section class="features">
    <h2>Особенности маркировки категории</h2>
    <ul>${features.map((f) => `<li>${f}</li>`).join('')}</ul>
  </section>
  <section class="steps">
    <h2>Этапы работы с TANBOX</h2>
    <ol>${steps.map((s) => `<li><strong>${s.title}</strong>: ${s.desc}</li>`).join('')}</ol>
  </section>
  ${
    faq.length > 0
      ? `<section class="faq">
    <h2>Часто задаваемые вопросы</h2>
    ${faq.map((q) => `<div><h3>${q.q}</h3><p>${q.a}</p></div>`).join('')}
  </section>`
      : ''
  }
</main>`;

      return {
        title: pageTitle,
        description: pageDesc,
        canonical,
        h1: title,
        bodyContent,
        faqItems: faq,
        breadcrumbs: catBreadcrumbs,
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

      const artBreadcrumbs = [
        { name: 'Главная', url: 'https://tanbox.kz/' },
        { name: 'База знаний', url: `https://tanbox.kz${localizedPrefix}/articles` },
        { name: title, url: canonical },
      ];

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
        faqItems: faq,
        breadcrumbs: artBreadcrumbs,
      };
    }
  }

  // 5. Category Index Page: /categories
  if (cleanRoute === '/categories') {
    const catBreadcrumbs = [
      { name: 'Главная', url: 'https://tanbox.kz/' },
      { name: 'Каталог категорий', url: canonical },
    ];
    const listHtml = CATEGORIES_DATA.map(
      (c) => `<li><a href="${localizedPrefix}/categories/${c.id}"><strong>${c.title}</strong></a> — ${c.statusText}, ТН ВЭД: ${c.tnved}. ${c.shortDesc}</li>`
    ).join('');

    return {
      title: lang === 'kz' ? 'Тауар санаттары бойынша таңбалау | TANBOX.KZ' : lang === 'en' ? 'Product Categories for Serialization | TANBOX.KZ' : 'Каталог товарных категорий обязательной маркировки в Казахстане — TANBOX.KZ',
      description: 'Все 12 товарных групп обязательной маркировки в Республике Казахстан: обувь, лекарства, вода, табак, ювелирные изделия, текстиль, масла, пиво, БАДы.',
      canonical,
      h1: 'Каталог товарных категорий маркировки в Казахстане',
      breadcrumbs: catBreadcrumbs,
      bodyContent: `
<header>
  <h1>Каталог товарных категорий обязательной цифровой маркировки в Казахстане</h1>
  <p>Реестр товаров, подлежащих обязательной маркировке кодами Data Matrix согласно законодательству Республики Казахстан и нормативным актам МТИ РК.</p>
</header>
<main>
  <ul>${listHtml}</ul>
</main>`,
    };
  }

  // 6. Articles Index Page: /articles or /blog
  if (cleanRoute === '/articles' || cleanRoute === '/blog') {
    const artBreadcrumbs = [
      { name: 'Главная', url: 'https://tanbox.kz/' },
      { name: 'База знаний', url: canonical },
    ];
    const articlesHtml = ARTICLES_DATA.map(
      (a) => `<li><a href="${localizedPrefix}/articles/${a.slug}"><strong>${a.title}</strong></a> (${a.date}, ${a.readTime})<p>${a.summary}</p></li>`
    ).join('');

    return {
      title: lang === 'kz' ? 'Таңбалау бойынша білім базасы мен мақалалар | TANBOX.KZ' : lang === 'en' ? 'Serialization Knowledge Base & Insights | TANBOX.KZ' : 'База знаний и статьи по обязательной маркировке товаров в Казахстане — TANBOX.KZ',
      description: 'Практические руководства, разборы законодательства РК, штрафы по КоАП, маркировка для Kaspi, Wildberries, Ozon и инструкции по работе с ИС Танба.',
      canonical,
      h1: 'База знаний и руководства по маркировке товаров',
      breadcrumbs: artBreadcrumbs,
      bodyContent: `
<header>
  <h1>База знаний по маркировке товаров в Казахстане</h1>
  <p>Экспертные статьи, практические гайды по работе с ИС «Танба», инструкции по интеграции с Kaspi и Wildberries, анализ штрафов и нормативных требований законодательства РК.</p>
</header>
<main>
  <ul>${articlesHtml}</ul>
</main>`,
    };
  }

  // 7. Services Page: /services or /tariffs
  if (cleanRoute === '/services' || cleanRoute === '/tariffs') {
    const srvBreadcrumbs = [
      { name: 'Главная', url: 'https://tanbox.kz/' },
      { name: 'Услуги и тарифы', url: canonical },
    ];

    return {
      title: 'Услуги обязательной цифровой маркировки Data Matrix в Казахстане — TANBOX.KZ',
      description: 'Комплексные услуги: эмиссия кодов в ИС Танба, термопечать рулонов стикеров, выездная оклейка на складе, агрегация в короба и паллеты (SSCC).',
      canonical,
      h1: 'Услуги и тарифы маркировки товаров под ключ',
      breadcrumbs: srvBreadcrumbs,
      bodyContent: `
<header>
  <h1>Услуги и тарифы цифровой маркировки Data Matrix в Казахстане</h1>
  <p>Центр маркировки TANBOX предоставляет полный цикл услуг по цифровой идентификации и прослеживаемости товаров для импортеров, производителей и оптовых дистрибьюторов в Республике Казахстан.</p>
</header>
<main>
  <section>
    <h2>5 ключевых услуг TANBOX</h2>
    <ol>
      <li><strong>Эмиссия кодов Data Matrix в ИС «Танба»:</strong> регистрация номенклатуры в Национальном каталоге товаров (НКТ / GS1), генерация кодов и ввод в оборот.</li>
      <li><strong>Промышленная рулонная печать стикеров:</strong> высокоточная термотрансферная печать смоляными красками Resin на износостойких полипропиленовых и полуглянцевых этикетках.</li>
      <li><strong>Складская оклейка товаров выездными бригадами:</strong> оперативная оклейка товарных партий на складах Заказчика, фулфилментах или зонах таможенного контроля (СВХ).</li>
      <li><strong>Агрегация транспортной тары (SSCC):</strong> формирование кодов агрегации для групповых коробов и паллет для быстрого сканирования без вскрытия упаковок.</li>
      <li><strong>Интеграция с учетными системами и сопровождение:</strong> настройка обмена с 1С:Предприятие, МойСклад, передача кодов при отгрузках в ЭСФ и СНТ.</li>
    </ol>
  </section>
  <section>
    <h2>Тарифные планы</h2>
    <ul>
      <li><strong>Тариф «Печать»:</strong> от 25 ₸ за код. Быстрое изготовление тиражей рулонных этикеток со 100% считываемостью.</li>
      <li><strong>Тариф «Стандарт под ключ»:</strong> от 50 ₸ за код. Эмиссия, регистрация в НКТ, печать и выездная оклейка.</li>
      <li><strong>Тариф «PRO / Склады и СВХ»:</strong> от 90 ₸ за код. Комплексная агрегация SSCC, паллетирование и ускоренная таможенная очистка.</li>
    </ul>
  </section>
</main>`,
    };
  }

  // 8. Contacts Page: /contacts
  if (cleanRoute === '/contacts') {
    const contactsBreadcrumbs = [
      { name: 'Главная', url: 'https://tanbox.kz/' },
      { name: 'Контакты', url: canonical },
    ];

    return {
      title: 'Контакты компании TANBOX.KZ | Центр маркировки товаров в Казахстане',
      description: 'Центр маркировки TANBOX — печать кодов, оклейка товаров и интеграция с системой «Танба» под ключ в Казахстане. Телефон +7 (700) 304-85-32, WhatsApp, адрес в Алматы.',
      canonical,
      h1: 'Контакты центра маркировки TANBOX в Казахстане',
      breadcrumbs: contactsBreadcrumbs,
      bodyContent: `
<header>
  <h1>Контакты центра маркировки TANBOX в Казахстане</h1>
  <p><strong>Центр маркировки TANBOX — печать кодов, оклейка товаров и интеграция с системой «Танба» под ключ в Казахстане.</strong></p>
</header>
<main>
  <section>
    <h2>Контактные данные</h2>
    <ul>
      <li><strong>Телефон отдела заботы о клиентах:</strong> <a href="tel:+77003048532">+7 (700) 304-85-32</a></li>
      <li><strong>WhatsApp-чат для оперативного расчета:</strong> <a href="https://wa.me/77003048532">+7 (700) 304-85-32</a></li>
      <li><strong>Электронная почта:</strong> <a href="mailto:info@tanbox.kz">info@tanbox.kz</a></li>
      <li><strong>Головной офис:</strong> Республика Казахстан, г. Алматы</li>
      <li><strong>География обслуживания:</strong> выездные бригады оклейщиков работают по всей Республике Казахстан (Алматы, Астана, Шымкент, Караганда, Актобе и все 17 областей).</li>
      <li><strong>График работы:</strong> Понедельник — Воскресенье, с 09:00 до 20:00 (прием онлайн-заявок круглосуточно).</li>
    </ul>
  </section>
</main>`,
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

  // Determine language and clean route for hreflang alternates
  let routeLang: 'ru' | 'kz' | 'en' = 'ru';
  let cleanPath = route;
  if (route.startsWith('/kz')) {
    routeLang = 'kz';
    cleanPath = route.replace(/^\/kz/, '') || '/';
  } else if (route.startsWith('/en')) {
    routeLang = 'en';
    cleanPath = route.replace(/^\/en/, '') || '/';
  }
  if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
  const pathPart = cleanPath === '/' ? '' : cleanPath;

  // Replace <html lang="..."> attribute to match language
  const htmlLangAttr = routeLang === 'kz' ? 'kk' : routeLang;
  let html = baseHtml.replace(/<html(\s+[^>]*)?lang=".*?"/i, `<html$1lang="${htmlLangAttr}"`);

  // Replace Title
  html = html.replace(/<title>.*?<\/title>/s, `<title>${meta.title}</title>`);

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

  // Inject Precise Multilingual Hreflang Alternates (CRITICAL FOR GOOGLE INDEXING)
  const baseDomain = 'https://tanbox.kz';
  const ruUrl = `${baseDomain}${pathPart || '/'}`;
  const kzUrl = `${baseDomain}/kz${pathPart}`;
  const enUrl = `${baseDomain}/en${pathPart}`;

  const hreflangBlock = `  <link rel="alternate" hreflang="ru" href="${ruUrl}" />\n  <link rel="alternate" hreflang="kk" href="${kzUrl}" />\n  <link rel="alternate" hreflang="en" href="${enUrl}" />\n  <link rel="alternate" hreflang="x-default" href="${ruUrl}" />`;

  // Remove any base hreflang tags to prevent duplicates and inject the current route's tags
  html = html.replace(/<link\s+rel="alternate"\s+hreflang=".*?"\s+href=".*?"\s*\/?>\n?/g, '');
  if (html.includes('<!-- Multilingual Hreflang Alternates (CRITICAL FOR GOOGLE INDEXING) -->')) {
    html = html.replace(
      '<!-- Multilingual Hreflang Alternates (CRITICAL FOR GOOGLE INDEXING) -->',
      `<!-- Multilingual Hreflang Alternates (CRITICAL FOR GOOGLE INDEXING) -->\n${hreflangBlock}`
    );
  } else {
    html = html.replace('</head>', `${hreflangBlock}\n</head>`);
  }

  // Inject Dynamic Schema.org for pages with FAQ and/or Breadcrumbs
  const additionalSchemas: object[] = [];

  if (meta.breadcrumbs && meta.breadcrumbs.length > 0) {
    additionalSchemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: meta.breadcrumbs.map((b, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: b.name,
        item: b.url,
      })),
    });
  }

  if (meta.faqItems && meta.faqItems.length > 0) {
    additionalSchemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: meta.faqItems.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    });
  }

  if (additionalSchemas.length > 0) {
    const schemaScript = `\n  <script type="application/ld+json">\n${JSON.stringify(
      additionalSchemas.length === 1 ? additionalSchemas[0] : { '@context': 'https://schema.org', '@graph': additionalSchemas },
      null,
      2
    )}\n  </script>`;
    html = html.replace('</head>', `${schemaScript}\n</head>`);
  }

  // Inject semantic SEO content inside <noscript> so users never experience FOUC / text flashes
  // Crawlers and non-JS engines still index the semantic markup, and Googlebot executes full JS.
  if (meta.bodyContent) {
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root"></div>\n  <noscript>\n    <div class="ssg-seo-content" style="max-width:1200px;margin:0 auto;padding:24px;font-family:sans-serif;color:#111;">\n${meta.bodyContent}\n    </div>\n  </noscript>`
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

// Generate Standalone 404.html (True HTTP 404 page: NO canonical tag, noindex, clean #root for React router)
const notFoundHtml = baseHtml
  .replace(/<title>.*?<\/title>/s, `<title>Страница не найдена (404) | TANBOX.KZ</title>`)
  .replace(/<meta\s+name="robots".*?>/i, `<meta name="robots" content="noindex, follow" />`)
  .replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/i, '');

fs.writeFileSync(path.join(DIST_DIR, '404.html'), notFoundHtml, 'utf-8');

console.log(`✅ SSG generation complete! Pre-rendered ${generatedCount} pages + 404.html with unique titles, descriptions, canonicals, dynamic Schema.org, and crawler-ready HTML!`);
