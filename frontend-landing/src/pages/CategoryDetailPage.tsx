import React, { useEffect } from 'react';
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [categoryId]);

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
    <div className="bg-[#F4F6F9] min-h-screen pb-20">
      
      {/* Top Banner / Hero */}
      <section className="py-8 sm:py-12 relative overflow-hidden">
        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-[#64748B] flex-wrap font-medium">
            <Link to="/" className="hover:text-[#0082FB] transition-colors">Главная</Link>
            <span>/</span>
            <Link to="/categories" className="hover:text-[#0082FB] transition-colors">Категории товаров</Link>
            <span>/</span>
            <span className="text-[#0082FB] font-bold">{category.shortTitle}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-1">
            
            <div className="space-y-4 max-w-4xl">
              
              <div className="flex items-center gap-3 text-xs font-semibold text-[#64748B] flex-wrap">
                <span className="inline-flex items-center gap-2 text-[#111827] font-bold">
                  <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-[#0082FB]'}`} />
                  {isActive ? 'Обязательная маркировка' : 'Внедрение 2026–2027'}
                </span>
                <span className="text-gray-300">•</span>
                <span>ТН ВЭД: <strong className="text-[#111827] font-mono font-bold">{category.tnved}</strong></span>
                <span className="text-gray-300">•</span>
                <span>{category.dateFull}</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#EBF5FF] text-[#0082FB] flex items-center justify-center shrink-0 shadow-sm">
                  <IconComponent className="w-7 h-7 stroke-[2]" />
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111827] tracking-tight leading-tight">
                  {category.title}
                </h1>
              </div>

              <p className="text-sm sm:text-base text-[#64748B] leading-relaxed font-normal pt-1">
                {category.fullDesc}
              </p>

            </div>

            {/* Quick action button */}
            <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3">
              <Link
                to={`/calculator?category=${category.calcCategoryCode || 'OTHER'}`}
                className="inline-flex items-center justify-center gap-2 bg-[#0082FB] text-white font-extrabold text-sm px-7 py-4 rounded-2xl hover:bg-[#0070DA] transition-all active:scale-95 shadow-md"
              >
                <Calculator className="w-4 h-4" />
                Рассчитать стоимость
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* Main Content Layout */}
      <section className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Main Details (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Stages Section (If present) */}
            {category.stages && category.stages.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#EBF5FF] text-[#0082FB] rounded-full flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#111827]">График и этапы вступления в силу</h3>
                    <p className="text-xs text-[#64748B]">Поэтапный календарь согласно нормативным актам МТИ РК</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {category.stages.map((stg, idx) => (
                    <div
                      key={idx}
                      className="bg-[#F8FAFC] border border-gray-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-[#0082FB] transition-all"
                    >
                      <span className="inline-block bg-[#0082FB] text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg shrink-0">
                        {stg.date}
                      </span>
                      <span className="text-sm font-bold text-[#111827] leading-snug">
                        {stg.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* Process Steps */}
            <div className="space-y-5">
              <h3 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">
                Как происходят операции маркировки TANBOX
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {category.processSteps.map((stepItem, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-3xl p-6 space-y-3 hover:shadow-md transition-all shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-9 h-9 bg-[#0082FB] text-white font-extrabold text-xs rounded-full flex items-center justify-center">
                        {stepItem.step}
                      </span>
                      <PackageCheck className="w-5 h-5 text-[#0082FB]" />
                    </div>
                    <h4 className="text-base font-bold text-[#111827]">{stepItem.title}</h4>
                    <p className="text-xs text-[#64748B] leading-relaxed">{stepItem.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Features List */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
              <h3 className="text-xl font-bold text-[#111827]">Ключевые возможности платформы TANBOX</h3>
              <ul className="space-y-3">
                {category.keyFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-[#111827] font-medium">
                    <CheckCircle2 className="w-5 h-5 text-[#0082FB] shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* FAQ Section */}
            {category.faq && category.faq.length > 0 && (
              <div className="space-y-4 pt-2">
                <h3 className="text-xl sm:text-2xl font-bold text-[#111827] flex items-center gap-2">
                  <HelpCircle className="w-6 h-6 text-[#0082FB]" />
                  Часто задаваемые вопросы
                </h3>
                <div className="space-y-3">
                  {category.faq.map((f, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-5 space-y-2 shadow-sm">
                      <h4 className="text-sm font-bold text-[#111827]">{f.q}</h4>
                      <p className="text-xs text-[#64748B] leading-relaxed">{f.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Sidebar (4 cols / Sticky) */}
          <div className="lg:col-span-4 space-y-6 sticky top-28">
            
            {/* Other Categories List */}
            <div className="bg-white rounded-3xl p-6 space-y-4 shadow-sm">
              <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                Другие категории товаров
              </h4>
              <div className="space-y-1.5">
                {CATEGORIES_DATA.filter((c) => c.id !== category.id).map((other) => (
                  <Link
                    key={other.id}
                    to={`/categories/${other.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F8FAFC] transition-all text-xs text-[#111827] font-bold group"
                  >
                    <span className="group-hover:text-[#0082FB] transition-colors">{other.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0082FB] group-hover:translate-x-0.5 transition-all shrink-0" />
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
