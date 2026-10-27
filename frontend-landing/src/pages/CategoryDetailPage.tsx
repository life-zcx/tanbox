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
  Trees,
  Flame,
  Cpu,
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
  BookOpen,
  MessageCircle
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
  Gem,
  Trees,
  Flame,
  Cpu
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
  const IconComponent = (category.iconName && ICON_MAP[category.iconName]) || Tag;

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

      {/* 2. Top Banner / Hero (Responsive: Native Card on Mobile, Full Infographic on Desktop) */}
      <section className="pt-2 sm:pt-3 pb-4 relative overflow-hidden">
        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-4">

          {/* Desktop View (md+): Widescreen infographic banner */}
          {category.bannerUrl && (
            <div className="hidden md:block relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-gray-200/80 bg-white">
              <img
                src={category.bannerUrl}
                alt={category.title}
                className="w-full h-auto object-cover block"
                loading="eager"
              />
              <h1 className="sr-only">{category.title}</h1>
            </div>
          )}

          {/* Mobile View (sm and below): Clean, Minimalist, Premium Typography */}
          <div className="md:hidden bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 space-y-3">
            {/* Minimal Status line */}
            <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B]">
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-[#0082FB]'}`} />
              <span className="text-[#0F172A] font-bold">
                {isActive
                  ? (lang === 'kz' ? 'Міндетті таңбалау' : lang === 'en' ? 'Mandatory' : 'Обязательная маркировка')
                  : (lang === 'kz' ? 'Енгізілуде' : lang === 'en' ? 'Upcoming' : 'Внедрение')}
              </span>
              <span className="text-slate-300">•</span>
              <span>{category.dateFull}</span>
            </div>

            {/* Clear, bold H1 title */}
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] leading-tight tracking-tight pt-0.5">
              {category.title}
            </h1>

            {/* Human description (fullDesc or clean summary) */}
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              {category.fullDesc || category.shortDesc}
            </p>

            {/* Clean, quiet metadata line */}
            <div className="pt-0.5 text-xs text-[#64748B]">
              <span>ТН ВЭД: <strong className="text-[#0F172A] font-mono font-bold">{category.tnved}</strong></span>
            </div>

            {/* Mobile Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-xs py-3 px-3 rounded-xl shadow-xs transition-all active:scale-95 text-center"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>{lang === 'kz' ? 'WhatsApp' : lang === 'en' ? 'WhatsApp' : 'WhatsApp'}</span>
              </a>

              <Link
                to={getLocalizedPath(`/calculator?category=${category.calcCategoryCode || 'OTHER'}`)}
                className="flex items-center justify-center gap-1.5 bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-xs py-3 px-3 rounded-xl shadow-xs transition-all active:scale-95 text-center"
              >
                <Calculator className="w-4 h-4 shrink-0" />
                <span>{lang === 'kz' ? 'Калькулятор' : lang === 'en' ? 'Calculator' : 'Калькулятор'}</span>
              </Link>
            </div>
          </div>

          {/* Desktop Metadata & Action Bar (md+) */}
          <div className="hidden md:flex bg-white p-5 rounded-2xl shadow-sm border border-gray-100 items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm font-semibold text-[#64748B] flex-wrap">
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

            {/* Desktop Action Buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-sm px-6 py-2.5 rounded-xl transition-all active:scale-95 shadow-sm text-center"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>{lang === 'kz' ? 'WhatsApp-та есептеу алу' : lang === 'en' ? 'WhatsApp Quote' : 'Получить расчёт в WhatsApp'}</span>
              </a>

              <Link
                to={getLocalizedPath(`/calculator?category=${category.calcCategoryCode || 'OTHER'}`)}
                className="inline-flex items-center justify-center gap-2 bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-sm px-6 py-2.5 rounded-xl transition-all active:scale-95 shadow-sm text-center"
              >
                <Calculator className="w-4 h-4 shrink-0" />
                <span>{lang === 'kz' ? 'Құнын есептеу' : lang === 'en' ? 'Calculate Cost' : 'Рассчитать стоимость'}</span>
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Main Content Layout */}
      <section className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Details Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* Implementation Schedule & Stages (Modern Vertical Timeline) */}
            {category.stages && category.stages.length > 0 && (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200/70 shadow-xs space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#EBF5FF] text-[#0082FB] rounded-xl flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#111827]">
                      {lang === 'kz' ? 'Күшіне ену кестесі мен кезеңдері' : lang === 'en' ? 'Implementation Schedule & Stages' : 'График и этапы вступления в силу'}
                    </h2>
                    <p className="text-xs text-[#64748B]">
                      {lang === 'kz' ? 'ҚР СИМ нормативтік актілеріне сәйкес кезеңдік күнтізбе' : lang === 'en' ? 'Phased calendar according to regulatory acts of MTI RK' : 'Поэтапный календарь согласно нормативным актам МТИ РК'}
                    </p>
                  </div>
                </div>

                {/* Elegant Timeline UI instead of giant blue buttons */}
                <div className="relative pl-6 sm:pl-8 space-y-4 pt-1 before:absolute before:left-2 sm:before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-blue-100">
                  {category.stages.map((stg, idx) => (
                    <div key={idx} className="relative group">
                      {/* Timeline Bullet Node */}
                      <div className="absolute -left-6 sm:-left-8 top-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white border-2 border-[#0082FB] flex items-center justify-center shadow-xs">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#0082FB]" />
                      </div>

                      <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 hover:border-[#0082FB]/40 hover:bg-white transition-all space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 text-[#0082FB] font-bold text-xs border border-blue-200/60">
                            <Calendar className="w-3 h-3 text-[#0082FB]" />
                            {stg.date}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-[#111827] leading-snug">
                          {stg.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Turnkey Services Block: Берём всю маркировку на себя */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-[#111827] tracking-tight">
                  {lang === 'kz' ? 'Барлық таңбалау жұмыстарын кілтке дейін өзіміз атқарамыз' : lang === 'en' ? 'Full Turnkey Serialization for Your Business' : 'Берём всю маркировку на себя под ключ'}
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B] pt-0.5">
                  {lang === 'kz'
                    ? 'Кодтар мен қоймадан бастап 1С бағдарламасы мен кассаға дейін толық кешенді шешім'
                    : lang === 'en'
                    ? 'From code issuance and warehouse stickering to 1C ERP and cash desk scanners'
                    : 'От получения кодов и оклейки на складе до настройки 1С и кассовых сканеров'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    num: '01',
                    title: lang === 'kz' ? 'Тіркеу және кодтарды алу' : lang === 'en' ? 'Registration & Codes' : 'Регистрация и получение кодов',
                    desc: lang === 'kz'
                      ? 'ҰТК-ға (GS1) номенклатураны заңды енгізу, «ТМБ» АЖ арқылы Data Matrix ресми кодтарын шығару және айналымға енгізу.'
                      : lang === 'en'
                      ? 'Product registry in NKT (GS1), official Data Matrix code issuance in IS Tanba, and commissioning into circulation.'
                      : 'Заводим номенклатуру в НКТ (GS1), официально выпускаем Data Matrix в ИС «Танба» и вводим коды в оборот.',
                    icon: FileCheck2
                  },
                  {
                    num: '02',
                    title: lang === 'kz' ? 'Басып шығару және қоймада жапсыру' : lang === 'en' ? 'Printing & Stickering' : 'Печать и оклейка на складе',
                    desc: lang === 'kz'
                      ? 'Төзімді жапсырмалар мен биркаларды өндірістік басу. Қажет болса, бригадамыз қоймаңызға барып, тауарды толық оклейка жасайды.'
                      : lang === 'en'
                      ? 'Industrial printing of durable labels and tags. On-site stickering team available for full batch processing at your warehouse.'
                      : 'Промышленная термопечать стикеров и бирок. При необходимости наша бригада выезжает на ваш склад и оклеивает всю партию.',
                    icon: PackageCheck
                  },
                  {
                    num: '03',
                    title: lang === 'kz' ? '1С, касса және жабдық интеграциясы' : lang === 'en' ? '1C, POS & Hardware Setup' : 'Интеграция с 1С, кассами и оборудованием',
                    desc: lang === 'kz'
                      ? '1С, Webkassa немесе басқа кассалық жүйелерді баптау, 2D-сканерлер мен ТСД қосу, кассада қатесіз автоматты есептен шығару.'
                      : lang === 'en'
                      ? 'Setting up 1C ERP, Webkassa, POS systems, 2D scanners, and handheld terminals (MDT) for error-free retail checkout.'
                      : 'Настраиваем 1С, Webkassa и кассовые программы, подключаем 2D-сканеры и терминалы (ТСД), чтобы товар без сбоев списывался на кассе.',
                    icon: Layers
                  },
                  {
                    num: '04',
                    title: lang === 'kz' ? 'Оқыту және заңдық сүйемелдеу' : lang === 'en' ? 'Staff Training & Compliance' : 'Обучение и сопровождение',
                    desc: lang === 'kz'
                      ? 'Сатушыларыңыз бен есепшілеріңізді кодтармен жұмыс істеуге үйрету, тексерулер мен регламенттер өзгергенде толық сүйемелдеу.'
                      : lang === 'en'
                      ? 'Training your sales and accounting staff to work with serialization codes, full regulatory compliance support.'
                      : 'Обучаем ваших продавцов и бухгалтеров работе с кодами, консультируем при проверках и обновлении регламентов.',
                    icon: ShieldCheck
                  }
                ].map((item, idx) => {
                  const PillarIcon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 space-y-2.5 hover:shadow-sm hover:border-[#0082FB]/30 transition-all shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="w-8 h-8 bg-[#0082FB] text-white font-extrabold text-xs rounded-xl flex items-center justify-center shadow-xs">
                          {item.num}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0082FB] flex items-center justify-center">
                          <PillarIcon className="w-4 h-4" />
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-[#111827]">{item.title}</h3>
                      <p className="text-xs text-[#64748B] leading-relaxed">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Key Features List */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200/70 shadow-xs space-y-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#111827]">
                  {lang === 'kz'
                    ? `«${category.shortTitle}» таңбалау ережелері мен талаптары`
                    : lang === 'en'
                    ? `Regulatory Requirements for ${category.shortTitle}`
                    : `Особенности и требования к маркировке: ${category.shortTitle}`}
                </h2>
                <p className="text-xs text-[#64748B] pt-0.5">
                  {lang === 'kz'
                    ? 'Осы тауар тобына қатысты ҚР заңнамалық ерекшеліктері'
                    : lang === 'en'
                    ? 'Industry-specific rules and compliance requirements in Kazakhstan'
                    : 'Отраслевая специфика и нормативные правила в Республике Казахстан'}
                </p>
              </div>
              <ul className="space-y-3 pt-1">
                {category.keyFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-[#1E293B] font-medium leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#0082FB] shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* FAQ Section */}
            {category.faq && category.faq.length > 0 && (
              <div className="space-y-4 pt-1">
                <h2 className="text-lg sm:text-2xl font-bold text-[#111827] flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#0082FB]" />
                  {lang === 'kz' ? 'Жиі қойылатын сұрақтар' : lang === 'en' ? 'Frequently Asked Questions' : 'Часто задаваемые вопросы'}
                </h2>
                <div className="space-y-3">
                  {category.faq.map((f, idx) => (
                    <div key={idx} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200/70 space-y-2 shadow-2xs">
                      <h3 className="text-sm font-bold text-[#111827]">{f.q}</h3>
                      <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">{f.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Knowledge Base Section / Статьи базы знаний по категории */}
            {relatedArticle && (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-blue-200/80 shadow-xs space-y-4">
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
