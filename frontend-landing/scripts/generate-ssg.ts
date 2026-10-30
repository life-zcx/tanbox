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

// Ensure all articles are in the pre-render routes
for (const art of ARTICLES_DATA) {
  routes.add(`/articles/${art.slug}`);
  routes.add(`/kz/articles/${art.slug}`);
  routes.add(`/en/articles/${art.slug}`);
}

console.log(`🚀 Starting SSG Pre-rendering for ${routes.size} routes...`);

interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  h1: string;
  bodyContent?: string;
  faqItems?: Array<{ q: string; a: string }>;
  breadcrumbs?: Array<{ name: string; url: string }>;
  customSchemas?: object[];
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
  <p>«Таңба» АЖ-де Data Matrix кодтарын шығару, ҰТК карточкаларын тіркеу, өндірістік басып шығару, қоймаларда оклейка және қызметкерлерді оқыту.</p>
</header>
<main>
  <section>
    <h2>Тауар санаттары</h2>
    <ul>${categoriesHtml}</ul>
  </section>
  <section>
    <h2>Тарифтер мен қызметтер</h2>
    <ul>
      <li><strong>Стикерлерді басып шығару:</strong> 18 ₸ бастап / дана</li>
      <li><strong>Кешенді «Стандарт» таңбалау:</strong> 48 ₸ бастап / дана</li>
      <li><strong>Қоймалар мен СВХ (ИМ-70, PRO):</strong> 75 ₸ бастап / дана</li>
      <li><strong>ҰТК / GS1 тауар карточкаларын енгізу:</strong> 150 ₸ бастап / SKU</li>
      <li><strong>Қызметкерлерді «Таңба» АЖ-ге оқыту:</strong> 85 000 ₸ бастап</li>
      <li><strong>Таңбалауды кілтке дейін аутсорсингке алу:</strong> 85 990 ₸ бастап</li>
    </ul>
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
        title: 'TANBOX — Turnkey Product Serialization & Marking Services in Kazakhstan | IS Tanba',
        description: 'Professional Data Matrix marking, NKT GS1 catalog registration from 150 ₸, staff training from 85,000 ₸, thermal roll printing from 18 ₸, warehouse stickering from 48 ₸, and full B2B outsourcing.',
        canonical,
        h1: 'Turnkey Product Serialization in Kazakhstan',
        bodyContent: `
<header>
  <h1>Turnkey Product Serialization & Marking in Kazakhstan</h1>
  <p>Data Matrix code generation in IS Tanba, NKT cataloging from 150 ₸/SKU, industrial thermal printing from 18 ₸, warehouse stickering from 48 ₸, staff training from 85,000 ₸, and B2B outsourcing.</p>
</header>
<main>
  <section>
    <h2>Mandatory Categories</h2>
    <ul>${categoriesHtml}</ul>
  </section>
  <section>
    <h2>Pricing & Services</h2>
    <ul>
      <li><strong>Sticker Printing:</strong> from 18 ₸ / unit</li>
      <li><strong>Full Standard Marking:</strong> from 48 ₸ / unit</li>
      <li><strong>Bonded Customs Warehouse (IM-70, PRO):</strong> from 75 ₸ / unit</li>
      <li><strong>NKT / GS1 SKU Cataloging:</strong> from 150 ₸ / SKU</li>
      <li><strong>Staff & Operator Training:</strong> from 85,000 ₸</li>
      <li><strong>Turnkey B2B Outsourcing:</strong> from 85,990 ₸</li>
    </ul>
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
      title: 'TANBOX — Маркировка товаров в Казахстане под ключ, карточки НКТ и Обучение | ИС Танба',
      description: 'Профессиональная маркировка Data Matrix под ключ в РК: эмиссия в ИС Танба от 4 ₸, печать от 18 ₸, оклейка от 48 ₸, заведение карточек в НКТ от 150 ₸/SKU, обучение работе с маркировкой 85 000 ₸, аутсорсинг под ключ от 85 990 ₸.',
      canonical,
      h1: 'Маркировка товаров в Казахстане под ключ',
      bodyContent: `
<header>
  <h1>Маркировка товаров в Казахстане под ключ</h1>
  <p>Центр маркировки TANBOX: заказ и эмиссия кодов Data Matrix в ИС «Танба», регистрация карточек в Национальном каталоге товаров (НКТ / GS1), промышленная рулонная печать этикеток, выездная оклейка на складах заказчика, обучение сотрудников и полный аутсорсинг.</p>
</header>
<main>
  <section>
    <h2>12 товарных групп обязательной маркировки в Казахстане</h2>
    <ul>${categoriesHtml}</ul>
  </section>
  <section>
    <h2>Тарифы на услуги маркировки и сопутствующие сервисы</h2>
    <ul>
      <li><strong>Печать стикеров Data Matrix</strong> — от 18 ₸ / шт (термотрансферная печать на рулонах, устойчивая к стиранию).</li>
      <li><strong>Маркировка под ключ (Стандарт)</strong> — от 48 ₸ / шт (эмиссия в ИС Танба, заведение в НКТ, печать и выездная оклейка).</li>
      <li><strong>PRO / Склады и СВХ (ИМ-70)</strong> — от 75 ₸ / шт (агрегация в короба и паллеты SSCC, работа на таможенных складах).</li>
      <li><strong>Заведение карточек товаров в НКТ / GS1 / МПТ</strong> — от 150 ₸ / карточка (SKU) (регистрация номенклатуры, присвоение GTIN, модерация).</li>
      <li><strong>Обучение сотрудников работе с ИС «Танба»</strong> — от 85 000 ₸ (курс для кладовщиков, операторов 2D-сканеров и бухгалтеров).</li>
      <li><strong>Комплексный аутсорсинг маркировки под ключ</strong> — от 85 990 ₸ (полная передача рутины по маркировке на внешнее управление).</li>
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
        title: 'Қазақстанда тауар таңбалау, ҰТК карточкалары және оқыту калькуляторы — TANBOX.KZ',
        description: 'Data Matrix таңбалау, ҰТК карточкаларын енгізу (150 ₸ бастап), оқыту (85 000 ₸) және аутсорсинг құнын есептеңіз.',
        canonical,
        h1: 'Тауарларды таңбалау онлайн калькуляторы',
        breadcrumbs: calcBreadcrumbs,
        bodyContent: `
<header>
  <h1>Тауарларды цифрлық таңбалау құнын есептеу калькуляторы</h1>
  <p>Қазақстанда «Таңба» АЖ арқылы тауарларды таңбалау, ҰТК карточкаларын тіркеу және оқытудың нақты құнын онлайн есептеңіз.</p>
</header>
<main>
  <section>
    <h2>Тарифтер мен негізгі қызметтер</h2>
    <ul>
      <li>Стикерлерді басып шығару: 18 ₸ бастап</li>
      <li>Қоймада оклейка жасау: 48 ₸ бастап</li>
      <li>Кедендік СВХ қоймалары (ИМ-70): 75 ₸ бастап</li>
      <li>ҰТК карточкаларын енгізу: 150 ₸ бастап / SKU</li>
      <li>Қызметкерлерді оқыту: 85 000 ₸ бастап</li>
      <li>Кілтке дейін аутсорсинг: 85 990 ₸ бастап</li>
    </ul>
  </section>
</main>`,
      };
    }
    if (lang === 'en') {
      return {
        title: 'Marking, NKT SKU Cards & Training Cost Calculator Kazakhstan — TANBOX.KZ',
        description: 'Calculate product serialization in Kazakhstan: Data Matrix printing from 18 ₸, stickering from 48 ₸, NKT cataloging from 150 ₸, staff training from 85,000 ₸, outsourcing from 85,990 ₸.',
        canonical,
        h1: 'Serialization Pricing Calculator',
        breadcrumbs: calcBreadcrumbs,
        bodyContent: `
<header>
  <h1>Online Product Marking & Services Calculator Kazakhstan</h1>
  <p>Instant pricing calculation for Data Matrix serialization, NKT cataloging (from 150 ₸), warehouse stickering, staff training (from 85,000 ₸), and turnkey outsourcing.</p>
</header>
<main>
  <section>
    <h2>Service Rates</h2>
    <ul>
      <li>Label Printing: from 18 ₸ / unit</li>
      <li>Onsite Stickering: from 48 ₸ / unit</li>
      <li>Bonded Warehouse (IM-70): from 75 ₸ / unit</li>
      <li>NKT / GS1 SKU Cataloging: from 150 ₸ / SKU</li>
      <li>Staff & Operator Training: from 85,000 ₸</li>
      <li>Turnkey B2B Outsourcing: from 85,990 ₸</li>
    </ul>
  </section>
</main>`,
      };
    }
    return {
      title: 'Калькулятор стоимости маркировки товаров, карточек НКТ и обучения — TANBOX.KZ',
      description: 'Онлайн-калькулятор стоимости в Казахстане: эмиссия Data Matrix от 4 ₸, печать от 18 ₸, оклейка от 48 ₸, карточки в НКТ от 150 ₸, обучение от 85 000 ₸, аутсорсинг от 85 990 ₸.',
      canonical,
      h1: 'Онлайн-калькулятор стоимости маркировки товаров и сопутствующих услуг',
      breadcrumbs: calcBreadcrumbs,
      bodyContent: `
<header>
  <h1>Онлайн-калькулятор стоимости маркировки товаров в Казахстане</h1>
  <p>Точный расчет бюджета обязательной маркировки Data Matrix под ключ: генерация кодов в ИС Танба, регистрация карточек в НКТ, термопечать рулонов, выездная оклейка, обучение персонала и аутсорсинг.</p>
</header>
<main>
  <section>
    <h2>Базовые параметры расчета</h2>
    <ul>
      <li><strong>Печать и оклейка:</strong> печать от 18 ₸, оклейка Стандарт от 48 ₸, таможенные склады (ИМ-70, PRO) от 75 ₸.</li>
      <li><strong>Заведение карточек товаров (SKU):</strong> от 150 ₸ за карточку в НКТ, 200 ₸ в МПТ, 300 ₸ полный пакет.</li>
      <li><strong>Обучение персонала:</strong> 85 000 ₸ за полный практический курс работы с ИС «Танба», 2D-сканерами и 1С.</li>
      <li><strong>Аутсорсинг под ключ:</strong> разовый запуск от 85 990 ₸, ежемесячные пакеты сопровождения от 159 990 ₸ / мес.</li>
    </ul>
  </section>
  <section>
    <h2>Тарифная сетка по тиражам маркировки</h2>
    <table>
      <thead><tr><th>Объем партии</th><th>Стоимость печати</th><th>С оклейкой под ключ</th></tr></thead>
      <tbody>
        <tr><td>500 – 20 000 шт</td><td>от 20 ₸ / шт</td><td>от 55 ₸ / шт</td></tr>
        <tr><td>20 000 – 100 000 шт</td><td>от 19 ₸ / шт</td><td>от 50 ₸ / шт</td></tr>
        <tr><td>свыше 100 000 шт</td><td>от 18 ₸ / шт</td><td>от 48 ₸ / шт</td></tr>
      </tbody>
    </table>
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
    const sortedArticles = [...ARTICLES_DATA].sort((a, b) => {
      const dateA = a.publishedAt || a.date;
      const dateB = b.publishedAt || b.date;
      return dateB.localeCompare(dateA);
    });
    const articlesHtml = sortedArticles.map(
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

    const servicesOfferSchema = {
      '@context': 'https://schema.org',
      '@type': 'OfferCatalog',
      name: 'Услуги и тарифы цифровой маркировки TANBOX.KZ',
      itemListElement: [
        {
          '@type': 'Offer',
          name: 'Печать стикеров с кодами Data Matrix',
          priceCurrency: 'KZT',
          price: '18',
        },
        {
          '@type': 'Offer',
          name: 'Маркировка товаров под ключ «Стандарт»',
          priceCurrency: 'KZT',
          price: '48',
        },
        {
          '@type': 'Offer',
          name: 'Маркировка на СВХ и таможенных складах «PRO» (ИМ-70)',
          priceCurrency: 'KZT',
          price: '75',
        },
        {
          '@type': 'Offer',
          name: 'Заведение и модерация карточек товаров в НКТ / GS1 / МПТ',
          priceCurrency: 'KZT',
          price: '150',
        },
        {
          '@type': 'Offer',
          name: 'Обучение сотрудников работе с ИС «Танба» и маркировкой',
          priceCurrency: 'KZT',
          price: '85000',
        },
        {
          '@type': 'Offer',
          name: 'Комплексный аутсорсинг процессов маркировки под ключ',
          priceCurrency: 'KZT',
          price: '85990',
        },
        {
          '@type': 'Offer',
          name: 'Агрегация групповой тары в короба и паллеты (SSCC)',
          priceCurrency: 'KZT',
          price: '5',
        },
      ],
    };

    if (lang === 'kz') {
      return {
        title: 'Қазақстанда тауар таңбалау, ҰТК карточкалары, Оқыту және Аутсорсинг қызметтері — TANBOX.KZ',
        description: 'ҚР бойынша кешенді қызметтер: Data Matrix басу 18 ₸ бастап, қоймада оклейка 48 ₸ бастап, СВХ (ИМ-70) 75 ₸ бастап, ҰТК карточкаларын енгізу 150 ₸ бастап, қызметкерлерді оқыту 85 000 ₸, аутсорсинг 85 990 ₸ бастап.',
        canonical,
        h1: 'Тауарларды цифрлық таңбалау қызметтері мен тарифтері',
        breadcrumbs: srvBreadcrumbs,
        customSchemas: [servicesOfferSchema],
        bodyContent: `
<header>
  <h1>Қазақстанда тауарларды цифрлық таңбалау қызметтері мен тарифтері</h1>
  <p>TANBOX орталығы: «Таңба» АЖ кодтарын эмиссиялау, ҰТК карточкаларын модерациялау, рулонды стикерлерді басу, қоймаларда оклейка, қызметкерлерді оқыту және кілтке дейін аутсорсинг.</p>
</header>
<main>
  <section>
    <h2>7 негізгі B2B қызметтері</h2>
    <ol>
      <li><strong>Кедендік қоймаларда таңбалау (ИМ-70):</strong> 75 ₸ бастап / дана. СВХ және АЭА аймақтарында дайындық және оклейка.</li>
      <li><strong>ҰТК каталогына тауар карточкаларын енгізу:</strong> 150 ₸ бастап / SKU. GTIN / NTIN тағайындау, спецификациялар және сәтті модерация.</li>
      <li><strong>Data Matrix кодтарын эмиссиялау және басу:</strong> 18 ₸ бастап / дана. Өнеркәсіптік төзімді термо-стикерлер.</li>
      <li><strong>Таңбалауды кілтке дейін аутсорсингке алу:</strong> 85 990 ₸ бастап. Барлық процестерді сыртқы сенімді басқаруға беру.</li>
      <li><strong>Қораптар мен паллеттерге агрегациялау (SSCC):</strong> 5 ₸ / SSCC. GS1 стандарттары бойынша халықаралық кодтар.</li>
      <li><strong>Көшпелі мобильді стикерлеушілер тобы (24/7):</strong> 48 ₸ бастап / дана. ҚР кез келген қоймасына жеке жабдықпен шығу.</li>
      <li><strong>Қызметкерлерді оқыту және «Таңба» АЖ / 1С интеграциясы:</strong> 85 000 ₸ бастап. Операторлар мен қоймашыларды оқыту.</li>
    </ol>
  </section>
  <section>
    <h2>Тарифтік жоспарлар</h2>
    <ul>
      <li><strong>Басып шығару:</strong> 18 ₸ бастап.</li>
      <li><strong>Стандарт кешенді оклейка:</strong> 48 ₸ бастап.</li>
      <li><strong>PRO / Складтар мен СВХ:</strong> 75 ₸ бастап.</li>
      <li><strong>ҰТК карточкалары:</strong> 150 ₸ бастап / SKU.</li>
      <li><strong>Оқыту курсы:</strong> 85 000 ₸.</li>
      <li><strong>Аутсорсинг:</strong> 85 990 ₸ бастап.</li>
    </ul>
  </section>
</main>`,
      };
    }

    if (lang === 'en') {
      return {
        title: 'Turnkey Product Serialization & Marking Services in Kazakhstan — NKT Cards, Training, Outsourcing | TANBOX.KZ',
        description: 'End-to-end B2B serialization in Kazakhstan: Data Matrix printing from 18 ₸, warehouse stickering from 48 ₸, bonded warehouse (IM-70) from 75 ₸, NKT catalog registration from 150 ₸, IS Tanba staff training from 85,000 ₸, full turnkey outsourcing from 85,990 ₸.',
        canonical,
        h1: 'Turnkey Product Serialization Services & Pricing in Kazakhstan',
        breadcrumbs: srvBreadcrumbs,
        customSchemas: [servicesOfferSchema],
        bodyContent: `
<header>
  <h1>Product Serialization Services & Pricing in Kazakhstan</h1>
  <p>TANBOX center: official IS Tanba code generation, NKT catalog registration from 150 ₸, industrial thermal printing from 18 ₸, warehouse stickering from 48 ₸, staff training from 85,000 ₸, and B2B outsourcing.</p>
</header>
<main>
  <section>
    <h2>7 Core B2B Services</h2>
    <ol>
      <li><strong>Customs Bonded Warehouse Marking (IM-70):</strong> from 75 ₸ / unit. Full compliance before customs release.</li>
      <li><strong>NKT Product Cataloging (GS1 KZ):</strong> from 150 ₸ / SKU. Official GTIN/NTIN issuance and moderation guarantee.</li>
      <li><strong>Data Matrix Code Emission & Roll Printing:</strong> from 18 ₸ / unit. High-speed resin thermal transfer labels.</li>
      <li><strong>Turnkey Serialization B2B Outsourcing:</strong> from 85,990 ₸. Full external management of marking operations.</li>
      <li><strong>Carton & Pallet Aggregation (SSCC):</strong> 5 ₸ / SSCC. Transport labels for instant barcode scanning.</li>
      <li><strong>Onsite Mobile Stickering Crews (24/7):</strong> from 48 ₸ / unit. Nationwide warehouse deployment across Kazakhstan.</li>
      <li><strong>Staff Training & IS Tanba 1C ERP Integration:</strong> from 85,000 ₸. Practical training for warehouse teams and operators.</li>
    </ol>
  </section>
  <section>
    <h2>Pricing Plans</h2>
    <ul>
      <li><strong>Print Plan:</strong> from 18 ₸ / unit.</li>
      <li><strong>Standard Turnkey Plan:</strong> from 48 ₸ / unit.</li>
      <li><strong>PRO Customs & Warehouses:</strong> from 75 ₸ / unit.</li>
      <li><strong>NKT SKU Cataloging:</strong> from 150 ₸ / SKU.</li>
      <li><strong>Staff Training Course:</strong> from 85,000 ₸.</li>
      <li><strong>Outsourcing Package:</strong> from 85,990 ₸.</li>
    </ul>
  </section>
</main>`,
      };
    }

    return {
      title: 'Услуги маркировки товаров под ключ в Казахстане: НКТ, Data Matrix, Обучение, Аутсорсинг | TANBOX.KZ',
      description: 'Комплексные услуги: эмиссия Data Matrix от 4 ₸, печать от 18 ₸, оклейка от 48 ₸, СВХ (ИМ-70) от 75 ₸, заведение карточек в НКТ от 150 ₸/SKU, обучение работе в ИС Танба от 85 000 ₸, аутсорсинг под ключ от 85 990 ₸.',
      canonical,
      h1: 'Услуги и тарифы цифровой маркировки товаров под ключ',
      breadcrumbs: srvBreadcrumbs,
      customSchemas: [servicesOfferSchema],
      bodyContent: `
<header>
  <h1>Услуги и тарифы цифровой маркировки Data Matrix в Казахстане</h1>
  <p>Центр маркировки TANBOX предоставляет полный цикл услуг: эмиссия кодов в ИС «Танба», регистрация карточек в НКТ/GS1, промышленная рулонная печать, выездная оклейка на складе заказчика, агрегация SSCC, практическое обучение сотрудников и аутсорсинг маркировки под ключ.</p>
</header>
<main>
  <section>
    <h2>7 ключевых услуг TANBOX</h2>
    <ol>
      <li><strong>Маркировка на таможенных складах (ИМ-70, PRO):</strong> от 75 ₸ / шт. Нанесение кодов Data Matrix до выпуска товаров в свободное обращение, подготовка данных для графы 31 декларации.</li>
      <li><strong>Заведение карточек товаров в НКТ / GS1 / МПТ:</strong> от 150 ₸ / SKU. Регистрация номенклатуры, присвоение GTIN/NTIN, массовая загрузка спецификаций и гарантированное прохождение модерации.</li>
      <li><strong>Эмиссия и печать кодов Data Matrix:</strong> от 18 ₸ / шт. Высокоточная термотрансферная печать на рулонных стикерах со 100% считываемостью.</li>
      <li><strong>Комплексный аутсорсинг процессов маркировки под ключ:</strong> от 85 990 ₸. Полная передача рутины по маркировке на внешнее управление: эмиссия, НКТ, отчеты и поддержка 24/7.</li>
      <li><strong>Агрегация в короба и паллеты (SSCC):</strong> 5 ₸ / SSCC. Формирование транспортных кодов для мгновенного сканирования без вскрытия тары.</li>
      <li><strong>Выездные мобильные бригады оклейщиков (24/7):</strong> от 48 ₸ / шт. Выезд квалифицированных бригад со своими принтерами на склад заказчика по всему Казахстану.</li>
      <li><strong>Обучение сотрудников и интеграция ИС Танба с 1С:</strong> от 85 000 ₸. Практический курс для кладовщиков, операторов 2D-сканеров и бухгалтеров, настройка обмена с ERP.</li>
    </ol>
  </section>
  <section>
    <h2>Тарифная сетка на услуги</h2>
    <ul>
      <li><strong>Тариф «Печать»:</strong> от 18 ₸ за стикер.</li>
      <li><strong>Тариф «Стандарт под ключ»:</strong> от 48 ₸ за единицу.</li>
      <li><strong>Тариф «PRO / Склады и СВХ»:</strong> от 75 ₸ за единицу.</li>
      <li><strong>Заведение карточек в НКТ:</strong> от 150 ₸ за SKU (МПТ 200 ₸, полный пакет 300 ₸).</li>
      <li><strong>Обучение сотрудников:</strong> 85 000 ₸ за курс.</li>
      <li><strong>Аутсорсинг маркировки:</strong> от 85 990 ₸ (разовый запуск) или от 159 990 ₸ / мес.</li>
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
      title: 'Порядок расчетов, доставки и возврата | TANBOX.KZ',
      description: 'Официальный порядок безналичного расчета для юридических лиц и ИП, выставление счетов на оплату, условия доставки и возврата средств.',
      canonical,
      h1: 'Порядок расчетов, доставки и возврата',
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

  if (meta.customSchemas && meta.customSchemas.length > 0) {
    additionalSchemas.push(...meta.customSchemas);
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
