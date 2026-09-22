import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CATEGORIES_DATA } from '../data/categoriesData';
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
  Cpu, 
  PackageCheck, 
  Layers, 
  HelpCircle, 
  ArrowRight,
  PhoneCall
} from 'lucide-react';

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
  const { categoryId } = useParams<{ categoryId: string }>();

  const category = CATEGORIES_DATA.find((c) => c.id === categoryId);

  if (!category) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 px-6 text-center">
        <h2 className="text-3xl font-extrabold text-black">Категория не найдена</h2>
        <p className="text-gray-600">Запрошенная категория товаров не существует или была перемещена.</p>
        <Link
          to="/categories"
          className="inline-flex items-center gap-2 bg-[#0088B6] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#00739B] transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Вернуться в каталог категорий
        </Link>
      </div>
    );
  }

  const IconComponent = ICON_MAP[category.iconName] || PackageCheck;
  const isActive = category.status === 'ACTIVE';

  return (
    <div className="bg-white pb-20">
      
      {/* Top Banner / Hero */}
      <section className="bg-gray-50/80 border-b border-gray-200 py-8 sm:py-12 relative overflow-hidden">
        <div className="max-w-[1700px] w-full mx-auto px-6 sm:px-10 lg:px-16 space-y-6">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
            <Link to="/" className="hover:text-black transition-colors">Главная</Link>
            <span>/</span>
            <Link to="/categories" className="hover:text-black transition-colors">Категории товаров</Link>
            <span>/</span>
            <span className="text-[#0088B6] font-bold">{category.shortTitle}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-1">
            
            <div className="space-y-4 max-w-4xl">
              
              <div className="flex items-center gap-3 text-xs font-semibold text-gray-600 flex-wrap">
                <span className="inline-flex items-center gap-2 text-black font-bold">
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-[#0088B6]'}`} />
                  {isActive ? 'Обязательная маркировка' : 'Внедрение 2026–2027'}
                </span>
                <span className="text-gray-300">•</span>
                <span>ТН ВЭД: <strong className="text-black font-mono font-bold">{category.tnved}</strong></span>
                <span className="text-gray-300">•</span>
                <span>{category.dateFull}</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#0088B6] text-white flex items-center justify-center shrink-0 shadow-md">
                  <IconComponent className="w-7 h-7" />
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-black tracking-tight leading-tight">
                  {category.title}
                </h1>
              </div>

              <p className="text-base sm:text-lg text-gray-600 leading-relaxed font-normal pt-1">
                {category.fullDesc}
              </p>

            </div>

            {/* Quick action button */}
            <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3">
              <Link
                to={`/calculator?category=${category.calcCategoryCode || 'OTHER'}`}
                className="inline-flex items-center justify-center gap-2 bg-[#0088B6] text-white font-extrabold text-sm px-7 py-4 rounded-xl hover:bg-[#00739B] transition-all active:scale-95 shadow-md"
              >
                <Calculator className="w-4 h-4" />
                Рассчитать стоимость
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* Main Content Layout */}
      <section className="max-w-[1700px] w-full mx-auto px-6 sm:px-10 lg:px-16 pt-10 sm:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Main Details (8 cols) */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* Stages Section (If present) */}
            {category.stages && category.stages.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#0088B6] text-white rounded-xl flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-black">График и этапы вступления в силу</h3>
                    <p className="text-xs text-gray-500">Поэтапный календарь согласно нормативным актам МТИ РК</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {category.stages.map((stg, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-[#0088B6] transition-all"
                    >
                      <span className="inline-block bg-[#0088B6] text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg shrink-0">
                        {stg.date}
                      </span>
                      <span className="text-sm font-bold text-gray-800 leading-snug">
                        {stg.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* Process Steps */}
            <div className="space-y-6">
              <h3 className="text-2xl font-extrabold text-black tracking-tight">
                Как происходят операции маркировки TANBOX
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {category.processSteps.map((stepItem, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3 hover:border-[#0088B6] transition-all shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-9 h-9 bg-[#0088B6] text-white font-black text-xs rounded-xl flex items-center justify-center">
                        {stepItem.step}
                      </span>
                      <PackageCheck className="w-5 h-5 text-gray-400" />
                    </div>
                    <h4 className="text-base font-bold text-black">{stepItem.title}</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">{stepItem.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Features List */}
            <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-5">
              <h3 className="text-xl font-extrabold text-black">Ключевые возможности платформы TANBOX</h3>
              <ul className="space-y-3">
                {category.keyFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-gray-800 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-[#0088B6] shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* FAQ Section */}
            {category.faq && category.faq.length > 0 && (
              <div className="space-y-5 pt-4">
                <h3 className="text-2xl font-extrabold text-black flex items-center gap-2">
                  <HelpCircle className="w-6 h-6 text-[#0088B6]" />
                  Часто задаваемые вопросы
                </h3>
                <div className="space-y-3">
                  {category.faq.map((f, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-2">
                      <h4 className="text-sm font-bold text-black">{f.q}</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">{f.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Sidebar (4 cols / Sticky) */}
          <div className="lg:col-span-4 space-y-6 sticky top-28">
            
            {/* Calculation Card */}
            <div className="bg-black text-white rounded-3xl p-7 space-y-6 shadow-2xl border border-gray-800">
              <div className="border-b border-gray-800 pb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-[#0088B6]">Быстрый расчет</span>
                <h3 className="text-xl font-extrabold text-white mt-1">
                  Маркировка {category.shortTitle}
                </h3>
              </div>

              <div className="space-y-3 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0088B6] shrink-0" />
                  <span>Выезд мобильных бригад на склады в РК</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0088B6] shrink-0" />
                  <span>Полная выгрузка актов в ИС Танба</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0088B6] shrink-0" />
                  <span>Гарантированная точность и считываемость</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Link
                  to={`/calculator?category=${category.calcCategoryCode || 'OTHER'}`}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#0088B6] text-white font-extrabold text-sm py-4 rounded-xl hover:bg-[#00739B] transition-all active:scale-95 shadow-lg"
                >
                  <Calculator className="w-4 h-4" />
                  Перейти в калькулятор
                </Link>

                <Link
                  to="/contacts"
                  className="w-full inline-flex items-center justify-center gap-2 bg-gray-900 border border-gray-700 text-white font-extrabold text-xs py-3.5 rounded-xl hover:bg-gray-800 transition-all"
                >
                  <PhoneCall className="w-4 h-4 text-[#0088B6]" />
                  Запросить выездную бригаду
                </Link>
              </div>
            </div>

            {/* Other Categories List */}
            <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 space-y-4">
              <h4 className="text-xs font-extrabold text-black uppercase tracking-wider">
                Другие категории товаров
              </h4>
              <div className="space-y-1.5">
                {CATEGORIES_DATA.filter((c) => c.id !== category.id).map((other) => (
                  <Link
                    key={other.id}
                    to={`/categories/${other.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all text-xs text-gray-800 font-bold group"
                  >
                    <span className="group-hover:text-[#0088B6] transition-colors">{other.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#0088B6] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                ))}
              </div>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
};
