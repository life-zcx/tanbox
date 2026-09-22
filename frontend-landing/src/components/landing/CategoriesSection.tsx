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
    <section className="py-8 sm:py-12 bg-white border-b border-gray-200">
      <div className="max-w-[1700px] w-full mx-auto px-6 sm:px-10 lg:px-16">
        
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-10 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">
            Какие товары подлежат маркировке
          </h2>
          <p className="text-base text-gray-600">
            В Казахстане система обязательной маркировки товаров через нанесение кодов DataMatrix GS1 внедряется поэтапно.
          </p>
        </div>

        {/* 10-Card Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
          {categories.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <Link
                key={cat.id}
                to={`/categories/${cat.id}`}
                className="bg-white border border-gray-200/90 rounded-2xl p-5 hover:border-[#0088B6] hover:shadow-xl transition-all duration-300 flex flex-col justify-between group h-full min-h-[175px] shadow-sm relative overflow-hidden"
              >
                {/* Top Section: Icon + Badge */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#0088B6] text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        cat.isUpcoming
                          ? 'bg-gray-100 text-gray-700 border-gray-200'
                          : 'bg-[#E6F4F9] text-[#00739B] border-[#0088B6]/30'
                      }`}
                    >
                      {cat.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-black leading-snug group-hover:text-[#0088B6] transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>
                </div>

                {/* Bottom Row: Date & Circular Arrow Button */}
                <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-medium">
                  <span className="font-semibold text-gray-700">{cat.date}</span>
                  <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-[#0088B6] group-hover:text-white flex items-center justify-center text-gray-600 transition-all shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
};
