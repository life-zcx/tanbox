import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CATEGORIES_DATA, getLocalizedCategory } from '../data/categoriesData';
import { setPageSeo } from '../utils/seo';
import { useLanguage } from '../context/LanguageContext';
import { 
  Cigarette, 
  Footprints, 
  Pill, 
  Droplets, 
  Award, 
  Car, 
  Beer, 
  HeartPulse, 
  Shirt, 
  Gem, 
  ArrowLeft, 
  CheckCircle2, 
  Calculator, 
  PackageCheck, 
  Layers, 
  HelpCircle, 
  ArrowRight,
  PhoneCall,
  Calendar,
  FileCheck2,
  Tag,
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import { ARTICLES_DATA } from '../data/articlesData';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Cigarette,
  Footprints,
  Pill,
  Droplets,
  Award,
  Car,
  Beer,
  HeartPulse,
  Shirt,
  Gem
};

interface CategoryDetailPageProps {
  onOrderQuick?: (tariff: any, count: number, price: number) => void;
}

export const CategoryDetailPage: React.FC<CategoryDetailPageProps> = () => {
  const { lang, getLocalizedPath } = useLanguage();
  const { categoryId } = useParams<{ categoryId: string }>();
  const rawCategory = CATEGORIES_DATA.find((c) => c.id === categoryId);
  const category = rawCategory ? getLocalizedCategory(rawCategory, lang) : undefined;

  useEffect(() => {
    window.scrollTo(0, 0);
    if (category) {
      if (lang === 'kz') {
        setPageSeo(
          `Қазақстанда ${category.shortTitle} таңбалау | Data Matrix ТМБ АЖ — TANBOX.KZ`,
          `Қазақстан Республикасында ${category.shortTitle} тауарларын міндетті цифрлық таңбалау: ТМБ АЖ-де Data Matrix кодтарын эмиссиялау, ҰТК (GS1), жапсырмаларды басып шығару және қоймада жапсыру. ТН ВЭД: ${category.tnved}`,
          { lang: 'kz', keywords: `${category.shortTitle} таңбалау, Data Matrix Қазақстан, ТМБ АЖ ${category.shortTitle}` }
        );
      } else if (lang === 'en') {
        setPageSeo(
          `${category.shortTitle} Serialization & Marking in Kazakhstan | TANBOX.KZ`,
          `Mandatory Data Matrix serialization for ${category.shortTitle} in Kazakhstan. IS Tanba code generation, NKT registry, industrial label printing, and stickering. HS Code: ${category.tnved}`,
          { lang: 'en', keywords: `${category.shortTitle} marking Kazakhstan, serialization ${category.shortTitle}` }
        );
      } else {
        setPageSeo(
          `Маркировка: ${category.title} в Казахстане | TANBOX.KZ`,
          `${category.shortDesc}. Заказ кодов Data Matrix в ИС Танба, заведение в НКТ, термопечать этикеток и складская оклейка по Республике Казахстан. ТН ВЭД: ${category.tnved}`,
          { lang: 'ru', keywords: `маркировка ${category.shortTitle} Казахстан, Data Matrix ${category.shortTitle}, ТН ВЭД ${category.tnved}` }
        );
      }
    }
  }, [categoryId, category, lang]);

  if (!category) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 px-6 text-center">
        <h2 className="text-3xl font-extrabold text-[#111827]">
          {lang === 'kz' ? 'Санат табылмады' : lang === 'en' ? 'Category Not Found' : 'Категория не найдена'}
        </h2>
        <p className="text-[#64748B]">
          {lang === 'kz' ? 'Сұралған тауар санаты жоқ немесе жылжытылған.' : lang === 'en' ? 'The requested category does not exist.' : 'Запрошенная категория товаров не существует или была перемещена.'}
        </p>
        <Link
          to={getLocalizedPath('/categories')}
          className="inline-flex items-center gap-2 bg-[#0082FB] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#0070DA] transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> {lang === 'kz' ? 'Санаттар каталогына оралу' : lang === 'en' ? 'Back to categories' : 'Вернуться в каталог категорий'}
        </Link>
      </div>
    );
  }

  const isActive = category.status === 'ACTIVE';
  const IconComponent = category.iconName ? ICON_MAP[category.iconName] : Tag;

  // Build clean message for WhatsApp consultation
  const waMessage = lang === 'kz'
    ? `Сәлеметсіз бе! «${category.title}» бойынша таңбалау құны мен шарттарын білгім келеді.`
    : lang === 'en'
    ? `Hello! I would like to consult on "${category.title}" serialization rules and pricing.`
    : category.id === 'jewelry'
    ? 'Здравствуйте! Интересует маркировка ювелирных изделий к 1 декабря 2026 года (микро-коды Data Matrix, бирки, пломбы, приказ МТИ № 199-НҚ). Подскажите условия.'
    : `Здравствуйте! Интересует маркировка по категории «${category.title}» (коды Data Matrix, оклейка, сроки). Подскажите условия.`;

  const waUrl = `https://wa.me/77003048532?text=${encodeURIComponent(waMessage)}`;

  // Find related article in Knowledge Base
  const relatedArticle = ARTICLES_DATA.find((a) => {
    if (a.targetCategoryCode === category.id) return true;
    if (category.id === 'oils' && a.targetCategoryCode === 'oil') return true;
    if (category.id === 'medicine' && a.targetCategoryCode === 'pharma') return true;
    return false;
  }) || ARTICLES_DATA.find((a) => a.slug === 'shtrafy-za-otsutstvie-markirovki-kazakhstan-2026');

  // Parse TNVED codes into readable array
  const tnvedList = category.tnved
    ? category.tnved.split(',').map((code) => code.trim()).filter(Boolean)
    : [];

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20">
      
      {/* 1. Breadcrumbs */}
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#64748B] flex-wrap font-medium">
          <Link to={getLocalizedPath('/')} className="hover:text-[#0082FB] transition-colors">
            {lang === 'kz' ? 'Басты бет' : lang === 'en' ? 'Home' : 'Главная'}
          </Link>
          <span className="text-gray-300">/</span>
          <Link to={getLocalizedPath('/categories')} className="hover:text-[#0082FB] transition-colors">
            {lang === 'kz' ? 'Тауар санаттары' : lang === 'en' ? 'Categories' : 'Категории'}
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-[#111827] font-semibold">{category.shortTitle}</span>
        </nav>
      </div>

      {/* 2. Top Banner / Hero (Identical to other category pages) */}
      <section className="pt-2 sm:pt-3 pb-4 relative overflow-hidden">
        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-4">

          {category.bannerUrl ? (
            <div className="space-y-4">
              <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-gray-200/80 bg-white">
                <img
                  src={category.bannerUrl}
                  alt={category.title}
                  className="w-full h-auto object-cover block"
                  loading="eager"
                />
                <h1 className="sr-only">{category.title}</h1>
              </div>

              {/* Action & Metadata bar under the banner (100% mobile-friendly) */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold text-[#64748B] flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#0082FB] font-bold text-xs shrink-0">
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-[#0082FB]'}`} />
                    {isActive
                      ? (lang === 'kz' ? 'Міндетті таңбалау' : lang === 'en' ? 'Mandatory Serialization' : 'Обязательная маркировка')
                      : (lang === 'kz' ? 'Енгізілуде' : lang === 'en' ? 'Upcoming' : 'Внедрение')}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-[#1E293B] font-bold shrink-0">{category.dateFull}</span>
                  <span className="text-gray-300">•</span>
                  <span className="shrink-0">{lang === 'kz' ? 'ТН ВЭД' : lang === 'en' ? 'HS Code' : 'ТН ВЭД'}: <strong className="text-[#111827] font-mono font-bold">{category.tnved}</strong></span>
                </div>

                {/* Buttons: full width on mobile, inline on desktop */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto shrink-0">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all active:scale-95 shadow-sm text-center"
                  >
                    <span>{lang === 'kz' ? 'WhatsApp-та есептеу алу' : lang === 'en' ? 'WhatsApp Quote' : 'Получить расчёт в WhatsApp'}</span>
                  </a>

                  <Link
                    to={getLocalizedPath(`/calculator?category=${category.calcCategoryCode || 'OTHER'}`)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all active:scale-95 shadow-sm text-center"
                  >
                    <Calculator className="w-4 h-4 shrink-0" />
                    <span>{lang === 'kz' ? 'Құнын есептеу' : lang === 'en' ? 'Calculate Cost' : 'Рассчитать стоимость'}</span>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-1">
              <div className="space-y-4 max-w-4xl">
                <div className="flex items-center gap-3 text-xs font-semibold text-[#64748B] flex-wrap">
                  <span className="inline-flex items-center gap-2 text-[#111827] font-bold">
                    <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-[#0082FB]'}`} />
                    {isActive
                      ? lang === 'kz' ? 'Міндетті таңбалау' : lang === 'en' ? 'Mandatory Serialization' : 'Обязательная маркировка'
                      : lang === 'kz' ? 'Енгізілуде' : lang === 'en' ? 'Upcoming' : 'Внедрение'}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span>{lang === 'kz' ? 'ТН ВЭД' : lang === 'en' ? 'HS Code' : 'ТН ВЭД'}: <strong className="text-[#111827] font-mono font-bold">{category.tnved}</strong></span>
                  <span className="text-gray-300">•</span>
                  <span>{category.dateFull}</span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111827] tracking-tight leading-tight">
                  {category.title}
                </h1>

                <p className="text-sm sm:text-base text-[#64748B] leading-relaxed font-normal pt-1">
                  {category.fullDesc}
                </p>
              </div>

              <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-sm px-7 py-4 rounded-2xl transition-all active:scale-95 shadow-md"
                >
                  <span>{lang === 'kz' ? 'WhatsApp-та есептеу алу' : lang === 'en' ? 'WhatsApp Quote' : 'Получить расчёт в WhatsApp'}</span>
                </a>
                <Link
                  to={getLocalizedPath(`/calculator?category=${category.calcCategoryCode || 'OTHER'}`)}
                  className="inline-flex items-center justify-center gap-2 bg-[#0082FB] text-white font-extrabold text-sm px-7 py-4 rounded-2xl hover:bg-[#0070DA] transition-all active:scale-95 shadow-md"
                >
                  <Calculator className="w-4 h-4" />
                  {lang === 'kz' ? 'Құнын есептеу' : lang === 'en' ? 'Calculate Cost' : 'Рассчитать стоимость'}
                </Link>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* 3. Main Content Layout */}
      <section className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Details Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* Implementation Schedule & Stages */}
            {category.stages && category.stages.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/70 shadow-xs space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#EBF5FF] text-[#0082FB] rounded-xl flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#111827]">
                      {lang === 'kz' ? 'Күшіне ену кестесі мен кезеңдері' : lang === 'en' ? 'Implementation Schedule & Stages' : 'График и этапы вступления в силу'}
                    </h2>
                    <p className="text-xs text-[#64748B]">
                      {lang === 'kz' ? 'ҚР СИМ нормативтік актілеріне сәйкес кезеңдік күнтізбе' : lang === 'en' ? 'Phased calendar according to regulatory acts of MTI RK' : 'Поэтапный календарь согласно нормативным актам МТИ РК'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  {category.stages.map((stg, idx) => (
                    <div
                      key={idx}
                      className="bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 hover:border-[#0082FB]/40 transition-all"
                    >
                      <span className="w-full sm:w-44 text-center bg-[#0082FB] text-white font-bold text-xs py-2 px-3 rounded-xl shrink-0">
                        {stg.date}
                      </span>
                      <span className="text-sm font-semibold text-[#111827] leading-snug">
                        {stg.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Process Steps (4 steps grid) */}
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">
                {lang === 'kz' ? 'TANBOX таңбалау операциялары қалай жүргізіледі' : lang === 'en' ? 'How Serialization Operations Work' : 'Как происходят операции маркировки TANBOX'}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {category.processSteps.map((stepItem, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/70 space-y-2.5 hover:shadow-sm transition-all shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-8 bg-[#0082FB] text-white font-extrabold text-xs rounded-lg flex items-center justify-center">
                        {stepItem.step}
                      </span>
                      <PackageCheck className="w-5 h-5 text-[#0082FB]" />
                    </div>
                    <h3 className="text-base font-bold text-[#111827]">{stepItem.title}</h3>
                    <p className="text-xs text-[#64748B] leading-relaxed">{stepItem.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Features List */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/70 shadow-xs space-y-4">
              <h2 className="text-xl font-bold text-[#111827]">
                {lang === 'kz' ? 'TANBOX мүмкіндіктері мен артықшылықтары' : lang === 'en' ? 'Key Capabilities & Advantages' : 'Возможности и особенности маркировки категории'}
              </h2>
              <ul className="space-y-3">
                {category.keyFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-[#1E293B] font-medium leading-relaxed">
                    <CheckCircle2 className="w-5 h-5 text-[#0082FB] shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* FAQ Section */}
            {category.faq && category.faq.length > 0 && (
              <div className="space-y-4 pt-1">
                <h2 className="text-xl sm:text-2xl font-bold text-[#111827] flex items-center gap-2">
                  <HelpCircle className="w-6 h-6 text-[#0082FB]" />
                  {lang === 'kz' ? 'Жиі қойылатын сұрақтар' : lang === 'en' ? 'Frequently Asked Questions' : 'Часто задаваемые вопросы'}
                </h2>
                <div className="space-y-3">
                  {category.faq.map((f, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200/70 space-y-2 shadow-2xs">
                      <h3 className="text-sm font-bold text-[#111827]">{f.q}</h3>
                      <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">{f.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Knowledge Base Section / Статьи базы знаний по категории */}
            {relatedArticle && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0082FB] uppercase tracking-wider">
                    <BookOpen className="w-4 h-4 text-[#0082FB]" />
                    <span>{lang === 'kz' ? 'Білім базасы мен ресми нұсқаулықтар' : lang === 'en' ? 'Knowledge Base & Official Regulations' : 'База знаний и официальный регламент'}</span>
                  </div>
                  <Link
                    to={getLocalizedPath('/articles')}
                    className="text-xs font-bold text-[#64748B] hover:text-[#0082FB] transition-colors flex items-center gap-1"
                  >
                    <span>{lang === 'kz' ? 'Барлық мақалалар' : lang === 'en' ? 'All articles' : 'Все статьи базы знаний'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-2 text-xs text-[#64748B]">
                    <span className="bg-blue-50 text-[#0082FB] px-2.5 py-0.5 rounded-md font-bold text-[11px]">
                      {relatedArticle.category}
                    </span>
                    <span>•</span>
                    <span>{relatedArticle.readTime}</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-[#111827] leading-snug">
                    <Link
                      to={getLocalizedPath(`/articles/${relatedArticle.slug}`)}
                      className="hover:text-[#0082FB] transition-colors"
                    >
                      {relatedArticle.title}
                    </Link>
                  </h3>

                  <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed line-clamp-3">
                    {relatedArticle.summary}
                  </p>

                  <div className="pt-2">
                    <Link
                      to={getLocalizedPath(`/articles/${relatedArticle.slug}`)}
                      className="inline-flex items-center gap-2 bg-[#0082FB] hover:bg-[#0070DA] text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs"
                    >
                      <span>{lang === 'kz' ? 'Ресми талдауды оқу' : lang === 'en' ? 'Read Official Analysis' : 'Читать подробный разбор в Базе знаний'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Sidebar (4 cols / Sticky) */}
          <div className="lg:col-span-4 space-y-5 sticky top-28">
            
            {/* Quick Consultation Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#EBF5FF] text-[#0082FB] rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#111827]">
                    {lang === 'kz' ? 'Кеңес қажет пе?' : lang === 'en' ? 'Need Expert Help?' : 'Нужна консультация?'}
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    {lang === 'kz' ? 'Сарапшылар тегін жауап береді' : lang === 'en' ? 'Free expert advice 24/7' : 'Ответим на любые вопросы'}
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#475569] leading-relaxed">
                {lang === 'kz'
                  ? `«${category.shortTitle}» бойынша жеке коммерциялық ұсыныс пен нормативтік кеңес алыңыз.`
                  : lang === 'en'
                  ? `Get custom commercial proposal and regulatory consultation for ${category.shortTitle}.`
                  : `Получите индивидуальный расчёт стоимости и бесплатную консультацию по категории «${category.shortTitle}».`}
              </p>

              <div className="space-y-2 pt-1">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-xs sm:text-sm py-3 px-4 rounded-xl flex items-center justify-center transition-all shadow-xs"
                >
                  {lang === 'kz' ? 'WhatsApp арқылы жазу' : lang === 'en' ? 'Chat in WhatsApp' : 'Написать в WhatsApp'}
                </a>

                <a
                  href="tel:+77003048532"
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 border border-slate-200 transition-all"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#0082FB]" />
                  <span>+7 (700) 304-85-32</span>
                </a>
              </div>
            </div>

            {/* Other Categories List */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3.5">
              <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                {lang === 'kz' ? 'Басқа тауар санаттары' : lang === 'en' ? 'Other Product Categories' : 'Другие категории товаров'}
              </h3>
              <div className="space-y-1">
                {CATEGORIES_DATA.filter((c) => c.id !== category.id).map((other) => {
                  const locOther = getLocalizedCategory(other, lang);
                  return (
                    <Link
                      key={other.id}
                      to={getLocalizedPath(`/categories/${other.id}`)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F8FAFC] transition-all text-xs text-[#334155] font-semibold group"
                    >
                      <span className="group-hover:text-[#0082FB] transition-colors">{locOther.title}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#0082FB] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
};
