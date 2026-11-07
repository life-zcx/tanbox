import { CATEGORIES_DATA, getLocalizedCategory } from '../data/categoriesData';
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  Cpu
} from 'lucide-react';
const ServiceOrderModal = React.lazy(() => import('../components/modals/ServiceOrderModal').then(module => ({ default: module.ServiceOrderModal })));
import { useLanguage } from '../context/LanguageContext';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = { Cigarette, Footprints, Pill, Droplets, Award, Car, Beer, HeartPulse, Shirt, Gem, Trees, Flame, Cpu };

export const CategoriesPage: React.FC = () => {
  const { lang, getLocalizedPath } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'UPCOMING'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServiceTitle, setSelectedServiceTitle] = useState(
    lang === 'kz' 
      ? 'ТН ВЭД аудиті және 2026–2027 жылдардағы таңбалауға дайындық' 
      : lang === 'en' 
      ? 'HS Code Audit and Preparation for 2026–2027 Serialization' 
      : 'Аудит ТН ВЭД и подготовка к маркировке 2026–2027'
  );
  const location = useLocation();
  const navigate = useNavigate();

  const categories = CATEGORIES_DATA.map(category => ({ ...getLocalizedCategory(category, lang), icon: CATEGORY_ICONS[category.iconName] || Cpu }));

  const filteredCategories = categories.filter((c) => {
    if (activeFilter === 'ACTIVE') return c.status === 'ACTIVE';
    if (activeFilter === 'UPCOMING') return c.status === 'UPCOMING';
    return true;
  });

  return (
    <div className="bg-[#F4F6F9] min-h-screen pb-16 space-y-4 sm:space-y-8">
      
      {/* Header Banner */}
      <section className="relative py-4 sm:py-8 lg:py-9 bg-white border-b border-gray-200/80 overflow-hidden">
        {/* Subtle grid pattern & ambient tint */}
        <div className="absolute inset-0 bg-[radial-gradient(#0082FB_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.07] pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0082FB]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-100/30 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 lg:gap-8">
          <div className="space-y-1.5 sm:space-y-4 max-w-3xl">
            <h1 className="text-xl sm:text-4xl lg:text-5xl font-extrabold text-[#111827] tracking-tight leading-tight">
              {lang === 'kz' 
                ? 'Қазақстандағы тауар санаттары және таңбалау талаптары'
                : lang === 'en' 
                ? 'Product Categories and Marking Requirements in Kazakhstan'
                : 'Категории товаров и требования к маркировке в Казахстане'}
            </h1>
            <p className="text-xs sm:text-base lg:text-lg text-[#64748B] font-normal leading-relaxed">
              {lang === 'kz'
                ? 'Тауар санатын таңдаңыз: қолданыстағы талаптар, экспорттық жапсырмалар, пилоттар және жаңа ережелерге дайындық.'
                : lang === 'en'
                ? 'Choose a product category: current requirements, export labels, pilots and preparation for upcoming rules.'
                : 'Выберите категорию: действующие требования, экспортные этикетки, пилоты и подготовка к новым правилам.'}
            </p>
          </div>

          <div className="hidden md:flex shrink-0 items-center justify-end">
            <img
              src="/banners/categories.svg"
              alt="Категории товаров Танбокс"
              className="w-40 sm:w-52 md:w-60 lg:w-72 h-auto max-h-36 sm:max-h-44 md:max-h-52 lg:max-h-56 object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-300 hover:scale-105"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-8">
        
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-[#0082FB] text-white shadow-xs'
                : 'bg-white text-[#111827] hover:bg-gray-100 border border-gray-200/80'
            }`}
          >
            {lang === 'kz' ? `Барлық санаттар (${categories.length})` : lang === 'en' ? `All Categories (${categories.length})` : `Все категории (${categories.length})`}
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('ACTIVE')}
            className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeFilter === 'ACTIVE'
                ? 'bg-[#0082FB] text-white shadow-xs'
                : 'bg-white text-[#111827] hover:bg-gray-100 border border-gray-200/80'
            }`}
          >
            {lang === 'kz' ? 'Міндетті таңбалау' : lang === 'en' ? 'Mandatory Serialization' : 'Обязательная маркировка'}
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('UPCOMING')}
            className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeFilter === 'UPCOMING'
                ? 'bg-[#0082FB] text-white shadow-xs'
                : 'bg-white text-[#111827] hover:bg-gray-100 border border-gray-200/80'
            }`}
          >
            {lang === 'kz' ? '2026–2027 жылдары енгізу' : lang === 'en' ? 'Upcoming 2026–2027' : 'Внедрение 2026–2027'}
          </button>
        </div>

        {/* Categories List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredCategories.map((item) => {
            const isActive = item.status === 'ACTIVE';
            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                id={item.id}
                to={getLocalizedPath(`/categories/${item.id}`)}
                className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-200/80 hover:border-[#0082FB]/50 hover:shadow-md transition-all duration-200 flex items-center justify-between gap-3 sm:gap-6 cursor-pointer group"
              >
                <div className="flex flex-col gap-2.5 min-w-0">
                  <span className="text-base sm:text-lg font-bold text-[#111827] group-hover:text-[#0082FB] transition-colors leading-snug">
                    <span className="sm:hidden">{item.shortTitle}</span>
                    <span className="hidden sm:inline">{item.title}</span>
                  </span>
                  <span
                    className={`inline-flex w-fit text-xs font-semibold px-3 py-1 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100'
                        : 'bg-blue-50 text-[#0082FB] group-hover:bg-blue-100'
                    }`}
                  >
                    {lang === 'kz' ? 'Толығырақ' : lang === 'en' ? 'Details' : 'Подробнее'}
                  </span>
                </div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50/80 group-hover:bg-[#0082FB]/10 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105">
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-[#0082FB]" />
                </div>
              </Link>
            );
          })}
        </div>

      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0F172A] text-white rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-2 max-w-2xl text-center md:text-left">
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {lang === 'kz'
                ? '2026–2027 жылдары таңбалауға дайындалып жатырсыз ба?'
                : lang === 'en'
                ? 'Preparing for Serialization in 2026–2027?'
                : 'Готовитесь к маркировке в 2026–2027 годах?'}
            </h3>
            <p className="text-sm text-slate-300">
              {lang === 'kz'
                ? 'Біздің «Таңба» АЖ бойынша мамандарымыз ТН ВЭД-ке тегін аудит жүргізеді, номенклатураны тексереді және DataMatrix жекелей сканерлеу үшін интеграцияны баптайды.'
                : lang === 'en'
                ? 'Our IS Tanba specialists will conduct a free HS code audit, cross-check your product SKUs, and configure integration for piece-by-piece DataMatrix scanning.'
                : 'Наши специалисты по ИС Танба проведут бесплатный аудит ТН ВЭД, проверят номенклатуру и настроят интеграцию для поштучного сканирования DataMatrix.'}
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedServiceTitle(
                lang === 'kz'
                  ? 'ТН ВЭД тегін аудиті және 2026–2027 жылдардағы таңбалауға дайындық'
                  : lang === 'en'
                  ? 'Free HS Code Audit and Preparation for 2026–2027 Serialization'
                  : 'Бесплатный аудит ТН ВЭД и подготовка к маркировке 2026–2027'
              );
              setIsModalOpen(true);
            }}
            className="bg-[#0082FB] text-white font-extrabold text-sm px-8 py-3.5 rounded-2xl hover:bg-[#0070DA] transition-all shrink-0 active:scale-95 shadow-md cursor-pointer"
          >
            {lang === 'kz' ? 'Кеңес алу' : lang === 'en' ? 'Get Consultation' : 'Получить консультацию'}
          </button>
        </div>
      </section>

      {/* Service Order Modal */}
      <ServiceOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialServiceTitle={selectedServiceTitle}
      />

    </div>
  );
};
