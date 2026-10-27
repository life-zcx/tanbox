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
  FileCheck2,
  Tag,
  ShieldCheck,
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
          <div className="hidden md:flex bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm flex-wrap">
              {/* Status Indicator */}
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isActive ? 'bg-emerald-500' : 'bg-[#0082FB]'}`} />
                <span className="font-bold text-[#0F172A]">
                  {isActive
                    ? (lang === 'kz' ? 'Міндетті таңбалау' : lang === 'en' ? 'Mandatory Serialization' : 'Обязательная маркировка')
                    : (lang === 'kz' ? 'Енгізілуде' : lang === 'en' ? 'Upcoming' : 'Внедрение')}
                </span>
              </div>

              <span className="text-slate-200">|</span>

              {/* Effective Date */}
              <div className="text-slate-600">
                <span className="text-slate-400 mr-1.5 text-xs uppercase tracking-wider font-medium">
                  {lang === 'kz' ? 'Мерзімі:' : lang === 'en' ? 'Date:' : 'Срок:'}
                </span>
                <span className="font-semibold text-[#0F172A]">{category.dateFull}</span>
              </div>

              <span className="text-slate-200">|</span>

              {/* TNVED HS Code */}
              <div className="text-slate-600">
                <span className="text-slate-400 mr-1.5 text-xs uppercase tracking-wider font-medium">
                  {lang === 'kz' ? 'ТН ВЭД:' : lang === 'en' ? 'HS Code:' : 'ТН ВЭД:'}
                </span>
                <span className="font-mono font-bold text-[#0F172A]">{category.tnved}</span>
              </div>
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

      {/* 3. Implementation Schedule & Stages (Full Width Process Stepper) */}
      {category.stages && category.stages.length > 0 && (
        <section className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-2">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172A] tracking-tight">
                  {lang === 'kz' ? 'Таңбалауды енгізу кезеңдері' : lang === 'en' ? 'Serialization Rollout Stages' : 'Этапы введения маркировки'}
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {lang === 'kz' ? 'ҚР СИМ және ҚР ҚМ ресми нормативтік кестесі' : lang === 'en' ? 'Official regulatory roadmap of Kazakhstan' : 'Официальный утверждённый график регулятора (МТИ и МФ РК)'}
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                {category.stages.length} {lang === 'kz' ? 'кезең' : lang === 'en' ? 'stages' : 'этапов'}
              </span>
            </div>

            {/* Horizontal Stepper (Full Width on Desktop, Swipeable on Mobile) */}
            <div className="overflow-x-auto pb-2 -mx-5 px-5 sm:mx-0 sm:px-0 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              <div className="min-w-[680px] lg:min-w-0 w-full">
                <div
                  className={`grid grid-flow-col lg:grid-flow-row ${
                    category.stages.length <= 3
                      ? 'lg:grid-cols-3'
                      : category.stages.length === 4
                      ? 'lg:grid-cols-4'
                      : category.stages.length === 5
                      ? 'lg:grid-cols-5'
                      : category.stages.length === 6
                      ? 'lg:grid-cols-6'
                      : 'lg:grid-cols-7'
                  } gap-3 sm:gap-4 relative`}
                >
                  {category.stages.map((stg, idx) => (
                    <div key={idx} className="flex flex-col relative group">
                      {/* Step Marker & Connecting Track Line */}
                      <div className="flex items-center gap-2 mb-3 relative">
                        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-slate-200" />
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-[#0082FB] bg-white relative z-10 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-125 group-hover:bg-[#0082FB] transition-all">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0082FB] group-hover:bg-white transition-colors" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider relative z-10 bg-white px-1">
                          {lang === 'kz' ? `${idx + 1}-кезең` : lang === 'en' ? `Stage ${idx + 1}` : `Этап ${idx + 1}`}
                        </span>
                      </div>

                      {/* Clean Stage Card */}
                      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex-1 flex flex-col justify-start hover:bg-white hover:border-[#0082FB]/50 hover:shadow-xs transition-all">
                        <div className="space-y-1.5">
                          <div className="text-sm sm:text-base font-extrabold text-[#0F172A] tracking-tight">
                            {stg.date}
                          </div>
                          <p className="text-xs text-[#475569] leading-relaxed">
                            {stg.title}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. Turnkey Services (Full Width 4-Step Process) */}
      <section className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-2 space-y-6">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 space-y-2.5 hover:shadow-sm hover:border-[#0082FB]/30 transition-all shadow-2xs flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
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
                </div>
              );
            })}
          </div>
        </div>

        {/* Full-Width Consultation Banner */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0082FB] flex items-center justify-center shrink-0 hidden sm:flex">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#0F172A] tracking-tight">
                {lang === 'kz' ? 'Кеңес немесе есептеу қажет пе?' : lang === 'en' ? 'Need Consultation or Cost Estimate?' : 'Нужна консультация или расчёт стоимости?'}
              </h3>
              <p className="text-xs sm:text-sm text-[#475569] mt-0.5 max-w-xl leading-relaxed">
                {lang === 'kz'
                  ? `«${category.shortTitle}» бойынша жеке коммерциялық ұсыныс пен нормативтік талаптар бойынша тегін кеңес алыңыз.`
                  : lang === 'en'
                  ? `Get custom proposal and free regulatory consultation for ${category.shortTitle}.`
                  : `Получите индивидуальный расчёт стоимости под ваш объём и бесплатную консультацию по категории «${category.shortTitle}».`}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0 w-full md:w-auto">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-xs sm:text-sm py-2.5 px-5 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>{lang === 'kz' ? 'WhatsApp арқылы жазу' : lang === 'en' ? 'Chat in WhatsApp' : 'Написать в WhatsApp'}</span>
            </a>

            <a
              href="tel:+77003048532"
              className="w-full sm:w-auto bg-slate-50 hover:bg-slate-100 text-[#0F172A] font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 border border-slate-200 transition-all"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#0082FB] shrink-0" />
              <span>+7 (700) 304-85-32</span>
            </a>
          </div>
        </div>
      </section>

      {/* 5. Expanded Full-Width Details: Requirements, FAQ & Regulatory Article */}
      <section className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* Key Features / Requirements (Full Width 2-column grid) */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200/70 shadow-xs space-y-5">
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
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5 pt-1">
            {category.keyFeatures.map((feat, idx) => (
              <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-[#1E293B] font-medium leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#0082FB] shrink-0 mt-0.5" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* FAQ Section (Full Width 2-column grid) */}
        {category.faq && category.faq.length > 0 && (
          <div className="space-y-4 pt-1">
            <h2 className="text-lg sm:text-2xl font-bold text-[#111827] flex items-center gap-2">
              <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#0082FB]" />
              {lang === 'kz' ? 'Жиі қойылатын сұрақтар' : lang === 'en' ? 'Frequently Asked Questions' : 'Часто задаваемые вопросы'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.faq.map((f, idx) => (
                <div key={idx} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200/70 space-y-2 shadow-2xs">
                  <h3 className="text-sm font-bold text-[#111827]">{f.q}</h3>
                  <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regulatory Article / Полезный материал по категории (Full Width Editorial Card) */}
        {relatedArticle && (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {lang === 'kz' ? 'Нормативтік материал' : lang === 'en' ? 'Regulatory Insights' : 'Материалы и регламент'}
              </span>
              <Link
                to={getLocalizedPath('/articles')}
                className="text-xs font-semibold text-slate-500 hover:text-[#0082FB] transition-colors flex items-center gap-1"
              >
                <span>{lang === 'kz' ? 'База білімі' : lang === 'en' ? 'Knowledge Base' : 'Все статьи'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2 pt-0.5">
              <h3 className="text-base sm:text-lg font-bold text-[#0F172A] leading-snug">
                <Link
                  to={getLocalizedPath(`/articles/${relatedArticle.slug}`)}
                  className="hover:text-[#0082FB] transition-colors"
                >
                  {relatedArticle.title}
                </Link>
              </h3>

              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed line-clamp-2">
                {relatedArticle.summary}
              </p>

              <div className="pt-2 flex items-center gap-3 text-xs font-semibold">
                <Link
                  to={getLocalizedPath(`/articles/${relatedArticle.slug}`)}
                  className="text-[#0082FB] hover:text-[#0070DA] inline-flex items-center gap-1 transition-colors group"
                >
                  <span>{lang === 'kz' ? 'Мақаланы оқу' : lang === 'en' ? 'Read article' : 'Читать разбор'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <span className="text-slate-300">•</span>
                <span className="text-slate-400 font-normal">{relatedArticle.readTime}</span>
              </div>
            </div>
          </div>
        )}

      </section>

    </div>
  );
};
