import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Filter, 
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
  Cpu, 
  PackageCheck,
  Calendar,
  Layers
} from 'lucide-react';

export interface CategoryDetailItem {
  id: string;
  title: string;
  status: 'ACTIVE' | 'UPCOMING';
  statusText: string;
  date: string;
  tnved: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  stages?: { date: string; title: string }[];
  details: string[];
  equipmentNote?: string;
  link: string;
}

export const CategoriesPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'UPCOMING'>('ALL');
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const elementId = location.hash.replace('#', '');
      const el = document.getElementById(elementId);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [location]);

  const categories: CategoryDetailItem[] = [
    // --- 1. TABACCO ---
    {
      id: 'tobacco',
      title: 'Табачная продукция и никотиносодержащие изделия',
      status: 'ACTIVE',
      statusText: 'Обязательная маркировка',
      date: 'С 1 октября 2020 года',
      tnved: '2402, 2403, 2404',
      icon: Cigarette,
      description: 'Сигареты с фильтром, папиросы, сигариллы, кальянный табак, стики для систем нагревания табака (IQOS, glo) и электронные сигареты (вейпы, жидкости).',
      details: [
        'Поштучное нанесение кодов DataMatrix GS1 на каждую пачку и флакон',
        'Агрегация блоков в транспортные короба и паллеты (SSCC)',
        'Сквозная прослеживаемость от импорта/производителя до розничного чека',
      ],
      link: '/calculator?category=TOBACCO',
    },

    // --- 2. SHOES ---
    {
      id: 'shoes',
      title: 'Обувные товары',
      status: 'ACTIVE',
      statusText: 'Обязательная маркировка',
      date: 'С 1 ноября 2021 года',
      tnved: '6401 - 6405',
      icon: Footprints,
      description: 'Абсолютно все виды обуви (мужская, женская, детская, кожаная, резиновая, текстильная, спортивная, домашняя и специальная обувь). Продажа немаркированных остатков запрещена.',
      details: [
        'Маркировка потребительской упаковки или вшивного ярлыка',
        'Формирование агрегационных кодов коробов и паллет',
        'Быстрый ввод и выгрузка GTIN в национальную систему ИС Танба',
      ],
      link: '/calculator?category=SHOES',
    },

    // --- 3. PHARMA ---
    {
      id: 'pharma',
      title: 'Лекарственные средства и фармпрепараты',
      status: 'ACTIVE',
      statusText: 'Обязательная маркировка',
      date: 'С 1 июля 2024 года',
      tnved: '3004',
      icon: Pill,
      description: 'Все лекарственные препараты в дозированных формах и розничных упаковках, зарегистрированные в РК (кроме ветеринарных препаратов).',
      details: [
        'Строгий учет серийных номеров, сроков годности и партий',
        'Высокоточная печать стикеров с проверкой верификатором класс A/B',
        'Синхронизация с Единой фармацевтической системой Минздрава РК',
      ],
      link: '/calculator?category=MEDICINE',
    },

    // --- 4. WATER ---
    {
      id: 'water',
      title: 'Упакованная вода и сокосодержащие напитки',
      status: 'ACTIVE',
      statusText: 'Обязательная маркировка',
      date: 'С 1 июля 2024 года',
      tnved: '2201, 2202',
      icon: Droplets,
      description: 'Природная и минеральная упакованная вода, газированная питьевая вода, сахаросодержащие напитки, соки и сокосодержащая продукция.',
      details: [
        'Потоковое нанесение кодов на ПЭТ, стекло, колпачки и этикетки',
        'Высокоскоростное автоматизированное этикетирование на розливе и складах',
        'Формирование групповых упаковок и паллетных ярлыков',
      ],
      link: '/calculator?category=WATER',
    },

    // --- 5. SAIGA ---
    {
      id: 'saiga',
      title: 'Дериваты сайгака (рога)',
      status: 'ACTIVE',
      statusText: 'Обязательная маркировка',
      date: 'С 1 декабря 2025 года',
      tnved: '0507 90 000 0',
      icon: Award,
      description: 'Дериваты сайгака (рога в любом виде). Маркировка введена для контроля учета и пресечения незаконного оборота биологических ресурсов.',
      details: [
        'Поштучная микро-маркировка и биркирование дериватов',
        'Полная защита реестров оборота через DataMatrix GS1',
      ],
      link: '/calculator?category=OTHER',
    },

    // --- 6. MOTOR OILS ---
    {
      id: 'oils',
      title: 'Моторные масла и автохимия',
      status: 'UPCOMING',
      statusText: 'Внедряется в 2026 году',
      date: '2026 год (Поэтапный старт)',
      tnved: '2710, 3402, 3819, 3820',
      icon: Car,
      description: 'Смазочные материалы, моторные, компрессорные, турбинные и трансмиссионные масла, тормозные жидкости, антифризы и автохимия.',
      stages: [
        { date: 'С 1 февраля 2026 г.', title: 'Моторные, компрессорные, турбинные масла и смазки с нефтепродуктами' },
        { date: 'С 1 сентября 2026 г.', title: 'Трансмиссионные масла, гидравлические и тормозные жидкости, антифризы, автохимия' },
      ],
      details: [
        'Поштучное и агрегированное сканирование бочек, канистр и транспортных коробов',
        'Защита крупнейших авто-брендов от подделок на рынке РК',
      ],
      link: '/calculator?category=OTHER',
    },

    // --- 7. BEER ---
    {
      id: 'beer',
      title: 'Пиво и пивные напитки (включая безалкогольные)',
      status: 'UPCOMING',
      statusText: 'Внедряется в 2026–2027 гг.',
      date: '2026–2027 годы',
      tnved: '2203 00, 2202 91 000 0',
      icon: Beer,
      description: 'Пивоваренная продукция, пивные напитки и безалкогольное пиво во всех типах потребительской и транспортной тары.',
      stages: [
        { date: 'С 1 февраля 2026 г.', title: 'Продукция, разлитая в кеги' },
        { date: 'С 1 сентября 2026 г.', title: 'Продукция, разлитая в бутылки (стекло / ПЭТ)' },
        { date: 'С 1 января 2027 г.', title: 'Продукция, разлитая в алюминиевые банки' },
      ],
      details: [
        'Прямое нанесение кодов на крышки кегов, пробки и банки',
        'Интеграция с учетными системами пивоварен и дистрибьюторов',
      ],
      link: '/calculator?category=OTHER',
    },

    // --- 8. BAD ---
    {
      id: 'bad',
      title: 'Биологически активные добавки (БАД)',
      status: 'UPCOMING',
      statusText: 'Внедряется в 2026 году',
      date: 'С 1 сентября 2026 года',
      tnved: '2106 90',
      icon: HeartPulse,
      description: 'Все биологически активные добавки к пище, имеющие действующее свидетельство о государственной регистрации (СГР).',
      details: [
        'Нанесение кодов на флаконы, блистеры и коробочки БАД',
        'Контроль подлинности СГР и партий импорта',
      ],
      link: '/calculator?category=OTHER',
    },

    // --- 9. TEXTILE ---
    {
      id: 'textile',
      title: 'Товары легкой промышленности и текстиль',
      status: 'UPCOMING',
      statusText: 'Внедряется в 2026–2027 гг.',
      date: '2026–2027 гг. (Остатки до 2028)',
      tnved: '4203, 4304, 6101-6115, 6201-6217, 6302',
      icon: Shirt,
      description: 'Поэтапный охват всей легкой промышленности: одежда из кожи и меха, белье, верхняя одежда, костюмы, брюки, блузки. Базовые правила вступают в силу с 14 ноября 2026 г.',
      stages: [
        { date: 'С 1 декабря 2026 г.', title: 'Одежда из натуральной/композиционной кожи, искусственный мех, лыжные костюмы, постельное, столовое и кухонное белье (правила с 14.11.2026)' },
        { date: 'С 1 марта 2027 г.', title: 'Верхняя одежда (пальто, куртки, плащи, ветровки), блузки, пуловеры, кардиганы, шарфы и галстуки' },
        { date: 'С 1 октября 2027 г.', title: 'Мужские и женские костюмы, пиджаки, платья, юбки, брюки, комбинезоны, трикотажные рубашки и спортивные костюмы' },
        { date: 'До 1 января 2028 г.', title: 'Крайний срок маркировки нераспроданных остатков товаров, ввезенных до старта обязательной маркировки' },
      ],
      details: [
        'Печать и стикерование ярлыков, вшивных этикеток и упаковки',
        'Маркировка нераспроданных складских остатков до 1 января 2028 г.',
        'Мобильные выездные бригады TANBOX для оклейки на складах импортеров',
      ],
      link: '/calculator?category=TEXTILE',
    },

    // --- 10. JEWELRY ---
    {
      id: 'jewelry',
      title: 'Ювелирные изделия и драгметаллы',
      status: 'UPCOMING',
      statusText: 'Внедряется в 2026 году',
      date: 'С 1 декабря 2026 года',
      tnved: '7113, 7114',
      icon: Gem,
      description: 'Ювелирные изделия и их части из драгоценных металлов (золото, серебро, платина) и драгоценных камней.',
      details: [
        'Микро-маркировка ювелирных бирков и пломб кодами DataMatrix',
        'Поштучный учет каждого изделия от производства до витрины',
      ],
      link: '/calculator?category=OTHER',
    },
  ];

  const filteredCategories = categories.filter((c) => {
    if (activeFilter === 'ACTIVE') return c.status === 'ACTIVE';
    if (activeFilter === 'UPCOMING') return c.status === 'UPCOMING';
    return true;
  });

  return (
    <div className="bg-[#F4F6F9] min-h-screen pb-16 space-y-8">
      
      {/* Header Banner */}
      <section className="py-10 sm:py-16 bg-white border-b border-gray-200/80">
        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#111827] tracking-tight leading-tight max-w-4xl">
            Реестр подлежащих маркировке товаров в Казахстане
          </h1>
          <p className="text-base sm:text-lg text-[#64748B] max-w-3xl font-normal leading-relaxed">
            Полный перечень действующей обязательной маркировки и календарный график введения новых групп товаров согласно законодательству РК (DataMatrix GS1).
          </p>
        </div>
      </section>

      {/* Main Filter & Content Section */}
      <section className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-200/80 pb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#0082FB]" />
            <span className="text-xs font-extrabold text-[#111827] uppercase tracking-wider">Фильтр категорий:</span>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all ${
                activeFilter === 'ALL'
                  ? 'bg-[#0082FB] text-white shadow-md'
                  : 'bg-white text-[#475569] hover:bg-gray-100 shadow-sm'
              }`}
            >
              Все категории ({categories.length})
            </button>

            <button
              onClick={() => setActiveFilter('ACTIVE')}
              className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all ${
                activeFilter === 'ACTIVE'
                  ? 'bg-[#0082FB] text-white shadow-md'
                  : 'bg-white text-[#475569] hover:bg-gray-100 shadow-sm'
              }`}
            >
              Действующая маркировка (5)
            </button>

            <button
              onClick={() => setActiveFilter('UPCOMING')}
              className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all ${
                activeFilter === 'UPCOMING'
                  ? 'bg-[#0082FB] text-white shadow-md'
                  : 'bg-white text-[#475569] hover:bg-gray-100 shadow-sm'
              }`}
            >
              Внедряется в 2026–2027 (5)
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCategories.map((item) => {
            const isActive = item.status === 'ACTIVE';
            const IconComponent = item.icon;

            return (
              <div
                key={item.id}
                id={item.id}
                className="bg-white rounded-3xl p-7 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6 relative overflow-hidden"
              >
                <div className="space-y-5">
                  {/* Top Badge & TNVED */}
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <span
                      className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-[#EBF5FF] text-[#0082FB]'
                      }`}
                    >
                      {isActive ? (
                        <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-emerald-600" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 inline mr-1 text-[#0082FB]" />
                      )}
                      {item.statusText}
                    </span>

                    <span className="text-xs font-mono font-bold text-[#64748B] bg-[#F8FAFC] px-3 py-1 rounded-lg">
                      ТН ВЭД: {item.tnved}
                    </span>
                  </div>

                  {/* Title & Icon */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#EBF5FF] text-[#0082FB] flex items-center justify-center shrink-0 shadow-sm">
                      <IconComponent className="w-6 h-6 stroke-[2]" />
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-[#111827] tracking-tight">{item.title}</h3>
                      <p className="text-xs font-bold text-[#64748B] mt-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#0082FB]" />
                        {item.date}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-[#64748B] leading-relaxed font-normal">
                    {item.description}
                  </p>

                  {/* Stages Breakdown (if available) */}
                  {item.stages && item.stages.length > 0 && (
                    <div className="bg-[#F8FAFC] border border-gray-100 rounded-2xl p-4 space-y-2">
                      <p className="text-xs font-bold text-[#0082FB] uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-[#0082FB]" />
                        Этапы вступления в силу:
                      </p>
                      <ul className="space-y-2">
                        {item.stages.map((stg, sIdx) => (
                          <li key={sIdx} className="text-xs text-[#111827] font-medium leading-relaxed flex items-start gap-2">
                            <span className="font-extrabold bg-[#0082FB] text-white px-2 py-0.5 rounded text-[11px] shrink-0 whitespace-nowrap">
                              {stg.date}
                            </span>
                            <span>{stg.title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Key Features Details */}
                  <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-gray-100 space-y-2">
                    <p className="text-xs font-bold text-[#111827] uppercase tracking-wider">Ключевые особенности:</p>
                    <ul className="space-y-1.5">
                      {item.details.map((detail, idx) => (
                        <li key={idx} className="text-xs text-[#64748B] flex items-start gap-2 font-medium">
                          <PackageCheck className="w-4 h-4 text-[#0082FB] shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                  <Link
                    to={`/categories/${item.id}`}
                    className="inline-flex items-center gap-2 bg-[#0082FB] text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl hover:bg-[#0070DA] transition-all active:scale-95 shrink-0 shadow-sm"
                  >
                    Подробнее о категории <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    to={item.link}
                    className="inline-flex items-center gap-2 bg-[#F0F4F8] hover:bg-[#E2E8F0] text-[#111827] font-bold text-xs px-4 py-2.5 rounded-2xl transition-all active:scale-95 shrink-0"
                  >
                    Рассчитать стоимость
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0F172A] text-white rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-2 max-w-2xl text-center md:text-left">
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Готовитесь к маркировке в 2026–2027 годах?
            </h3>
            <p className="text-sm text-slate-300">
              Наши специалисты по ИС Танба проведут бесплатный аудит ТН ВЭД, проверят номенклатуру и настроят интеграцию для поштучного сканирования DataMatrix.
            </p>
          </div>

          <Link
            to="/contacts"
            className="bg-[#0082FB] text-white font-extrabold text-sm px-8 py-3.5 rounded-2xl hover:bg-[#0070DA] transition-all shrink-0 active:scale-95 shadow-md"
          >
            Получить консультацию
          </Link>
        </div>
      </section>

    </div>
  );
};
