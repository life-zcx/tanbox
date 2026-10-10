import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Tag } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

// Icons
const CigarettePackIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="18" y="24" width="28" height="34" rx="2" />
    <path d="M18 36h28" />
    <path d="M22 46h20" />
    <rect x="22" y="10" width="6" height="14" rx="1" />
    <rect x="30" y="8" width="6" height="16" rx="1" />
    <rect x="38" y="12" width="6" height="12" rx="1" />
  </svg>
);

const SneakerIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M8 44h48v6a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-6z" />
    <path d="M8 44c0-7 5-13 14-13 4 0 7-3 10-10l9 4c3 5 7 13 15 19" />
    <path d="M26 36h8" />
    <path d="M29 31h7" />
    <path d="M33 26h6" />
  </svg>
);

const PillCapsuleIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="16" y="24" width="36" height="18" rx="9" transform="rotate(-45 34 33)" />
    <line x1="21" y1="21" x2="33" y2="33" />
    <circle cx="23" cy="39" r="1.5" fill="currentColor" />
    <circle cx="28" cy="44" r="1.5" fill="currentColor" />
  </svg>
);

const SaigaDeerIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M24 38c0-3 3-7 8-7s8 4 8 7c0 7-4 17-8 20-4-3-8-13-8-20z" />
    <path d="M28 47h8" />
    <circle cx="28.5" cy="37" r="1.5" fill="currentColor" />
    <circle cx="35.5" cy="37" r="1.5" fill="currentColor" />
    <path d="M24 32c-4-4-9-6-15-6m6 0c-2-7 1-15 9-18m-4 8c-4-3-7-1-8 4m9 1c3-4 7-7 13-7" />
    <path d="M40 32c4-4 9-6 15-6m-6 0c2-7-1-15-9-18m4 8c4-3 7-1 8 4m-9 1c-3-4-7-7-13-7" />
  </svg>
);

const WaterBottleIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M26 8h12v4H26z" />
    <path d="M28 12v6l-6 6v28a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4V24l-6-6v-6" />
    <path d="M22 34c4-2 8 2 12 0s6-2 8 0" />
    <path d="M22 42c4-2 8 2 12 0s6-2 8 0" />
  </svg>
);

const OilCanisterIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="18" y="20" width="28" height="36" rx="4" />
    <path d="M22 20V12h8v8" />
    <path d="M38 20V10l8 4v6" />
    <path d="M26 35c0 3 6 8 6 8s6-5 6-8a6 6 0 0 0-12 0z" />
  </svg>
);

const BeerMugIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="16" y="20" width="24" height="34" rx="3" />
    <path d="M40 26h6a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4h-6" />
    <path d="M14 20c0-4 4-6 8-6s6 2 8 0 4-4 8 0 4 4 4 6" />
    <line x1="24" y1="28" x2="24" y2="46" />
    <line x1="32" y1="28" x2="32" y2="46" />
  </svg>
);

const SupplementsIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M32 54s-18-12-18-24a10 10 0 0 1 18-6 10 10 0 0 1 18 6c0 12-18 24-18 24z" />
    <path d="M22 30h6l3-6 4 12 3-6h4" />
  </svg>
);

const ApparelIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M24 10a8 8 0 0 0 16 0l12 6-4 12-8-3v27a2 2 0 0 1-2 2H26a2 2 0 0 1-2-2V25l-8 3-4-12 12-6z" />
  </svg>
);

const JewelryIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 16l-8 12 22 24 22-24-8-12H18z" />
    <path d="M10 28h44" />
    <path d="M24 16l-4 12 12 24 12-24-4-12" />
  </svg>
);

interface CategoriesSectionProps {
  onScrollNext?: () => void;
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({ onScrollNext }) => {
  const { lang, t } = useLanguage();

  const categories = [
    {
      id: 'shoes',
      title: lang === 'kz' ? 'Аяқ киім өнімдері' : lang === 'en' ? 'Footwear' : 'Обувные товары',
      icon: SneakerIcon,
    },
    {
      id: 'tobacco',
      title: lang === 'kz' ? 'Темекі өнімдері' : lang === 'en' ? 'Tobacco' : 'Табачные изделия',
      icon: CigarettePackIcon,
    },
    {
      id: 'pharma',
      title: lang === 'kz' ? 'Дәрілік заттар' : lang === 'en' ? 'Pharmaceuticals' : 'Лекарственные препараты',
      icon: PillCapsuleIcon,
    },
    {
      id: 'water',
      title: lang === 'kz' ? 'Қапталған су' : lang === 'en' ? 'Bottled Water' : 'Упакованная вода',
      icon: WaterBottleIcon,
    },
    {
      id: 'saiga',
      title: lang === 'kz' ? 'Киік дериваттары' : lang === 'en' ? 'Saiga Horns' : 'Дериваты сайгака',
      icon: SaigaDeerIcon,
    },
    {
      id: 'oils',
      title: lang === 'kz' ? 'Майлар мен автохимия' : lang === 'en' ? 'Motor Oils' : 'Масла и автохимия',
      icon: OilCanisterIcon,
    },
    {
      id: 'beer',
      title: lang === 'kz' ? 'Сыра және сусындар' : lang === 'en' ? 'Beer & Drinks' : 'Пиво и напитки',
      icon: BeerMugIcon,
    },
    {
      id: 'bad',
      title: lang === 'kz' ? 'ББҚ (Қоспалар)' : lang === 'en' ? 'Supplements' : 'БАД (Добавки)',
      icon: SupplementsIcon,
    },
    {
      id: 'textile',
      title: lang === 'kz' ? 'Текстиль және киім' : lang === 'en' ? 'Textiles & Apparel' : 'Текстиль и одежда',
      icon: ApparelIcon,
    },
    {
      id: 'jewelry',
      title: lang === 'kz' ? 'Зергерлік бұйымдар' : lang === 'en' ? 'Jewelry' : 'Ювелирные изделия',
      icon: JewelryIcon,
    },
  ];

  return (
    <section
      id="categories"
      className="py-12 sm:py-16 bg-[#F4F6F9]"
    >
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Section Header */}
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111827] tracking-tight">
            {t('cat.title')}
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] max-w-3xl">
            {t('cat.subtitle')}
          </p>
        </div>

        {/* 5-column x 2-row cards grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {categories.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <Link
                key={cat.id}
                to={`/categories/${cat.id}`}
                className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group border border-gray-200/70 hover:border-blue-300 min-h-[130px] sm:min-h-[145px]"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-xs sm:text-sm font-bold text-[#111827] group-hover:text-[#0082FB] transition-colors leading-snug line-clamp-2">
                    {cat.title}
                  </h3>
                  <div className="text-[#0082FB] shrink-0 ml-2 group-hover:scale-110 transition-transform duration-200">
                    <IconComponent className="w-7 h-7 sm:w-8 sm:h-8 text-[#0082FB]" />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 group-hover:text-[#0082FB] transition-colors">
                    {t('cat.btn_more')} →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
};
