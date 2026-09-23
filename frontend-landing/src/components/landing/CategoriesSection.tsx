import React from 'react';
import { Link } from 'react-router-dom';
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
  ChevronRight 
} from 'lucide-react';

export interface CategoryCardData {
  id: string;
  title: string;
  desc: string;
  badge: string;
  date: string;
  icon: React.ComponentType<{ className?: string }>;
  isUpcoming?: boolean;
}

export const CategoriesSection: React.FC = () => {
  const categories: CategoryCardData[] = [
    {
      id: 'tobacco',
      title: 'Табачные изделия',
      desc: 'Сигареты, стики, вейпы, жидкости',
      badge: 'Обязательно',
      date: 'С 2020 г.',
      icon: Cigarette,
    },
    {
      id: 'shoes',
      title: 'Обувные товары',
      desc: 'Все виды обуви, кожа, резина, текстиль',
      badge: 'Обязательно',
      date: 'С 2021 г.',
      icon: Footprints,
    },
    {
      id: 'pharma',
      title: 'Лекарственные средства',
      desc: 'Препараты в дозированных формах',
      badge: 'Обязательно',
      date: 'С 2024 г.',
      icon: Pill,
    },
    {
      id: 'water',
      title: 'Вода и напитки',
      desc: 'Минеральная вода, питьевая, соки',
      badge: 'Обязательно',
      date: 'С 2024 г.',
      icon: Droplets,
    },
    {
      id: 'saiga',
      title: 'Дериваты сайгака',
      badge: 'С 1 дек 2025',
      date: 'С 01.12.2025',
      desc: 'Рога сайгака в любом виде',
      icon: Award,
    },
    {
      id: 'oils',
      title: 'Масла и автохимия',
      badge: 'С 2026 года',
      date: '2026 (Поэтапно)',
      desc: 'Моторные и трансмиссионные масла',
      icon: Car,
      isUpcoming: true,
    },
    {
      id: 'beer',
      title: 'Пиво и напитки',
      badge: '2026–2027',
      date: '2026–2027 гг.',
      desc: 'Кеги, бутылки, алюминиевые банки',
      icon: Beer,
      isUpcoming: true,
    },
    {
      id: 'bad',
      title: 'БАД (Добавки)',
      badge: 'С 1 сен 2026',
      date: 'С 01.09.2026',
      desc: 'Пищевые добавки со свидетельством СГР',
      icon: HeartPulse,
      isUpcoming: true,
    },
    {
      id: 'textile',
      title: 'Текстиль и одежда',
      badge: '2026–2027',
      date: '2026–2027 гг.',
      desc: 'Кожа, белье, куртки, остатки до 2028 г.',
      icon: Shirt,
      isUpcoming: true,
    },
    {
      id: 'jewelry',
      title: 'Ювелирные изделия',
      badge: 'С 1 дек 2026',
      date: 'С 01.12.2026',
      desc: 'Изделия и части из драгметаллов',
      icon: Gem,
      isUpcoming: true,
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-[#F4F6F9]">
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header - Left aligned matching tanba.telecom.kz */}
        <div className="mb-8 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            Наши сервисы и категории товаров
          </h2>
          <p className="text-sm sm:text-base text-[#64748B]">
            В Казахстане система обязательной маркировки товаров через нанесение кодов DataMatrix GS1 внедряется поэтапно.
          </p>
        </div>

        {/* Bento/Grid style cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {categories.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <Link
                key={cat.id}
                to={`/categories/${cat.id}`}
                className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group min-h-[200px] relative overflow-hidden"
              >
                {/* Top Row: Title + Description on left, Icon on right */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <h3 className="text-base sm:text-lg font-bold text-[#111827] leading-snug group-hover:text-[#0082FB] transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                      {cat.desc}
                    </p>
                  </div>

                  {/* Icon Badge */}
                  <div className="w-11 h-11 rounded-full bg-[#EBF5FF] text-[#0082FB] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <IconComponent className="w-5 h-5 stroke-[2]" />
                  </div>
                </div>

                {/* Bottom Row: Pill Button + Date Tag */}
                <div className="pt-4 mt-4 flex items-center justify-between text-xs border-t border-gray-100">
                  <span className="bg-[#F0F4F8] group-hover:bg-[#E0F2FE] group-hover:text-[#0082FB] text-[#475569] font-medium px-3.5 py-1.5 rounded-xl transition-colors inline-flex items-center gap-1">
                    Подробнее
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>

                  <span className="text-[11px] font-semibold text-[#64748B] bg-gray-50 px-2.5 py-1 rounded-lg">
                    {cat.date}
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
