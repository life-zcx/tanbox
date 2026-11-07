import { ResponsiveBanner } from '../components/common/ResponsiveBanner';
import React, { useEffect } from 'react';
import { CalculatorSection } from '../components/landing/CalculatorSection';
import { TariffCode } from '../types';

import { useLanguage } from '../context/LanguageContext';

interface CalculatorPageProps {
  onOrderQuick: (tariff: TariffCode, count: number, price: number) => void;
}

export const CalculatorPage: React.FC<CalculatorPageProps> = ({ onOrderQuick }) => {
  const { lang } = useLanguage();

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
                ? 'Тауарларды таңбалау құнын есептеу (₸)' 
                : lang === 'en' 
                ? 'Product Marking Cost Calculator (₸)' 
                : 'Калькулятор стоимости маркировки (₸)'}
            </h1>
            <p className="text-xs sm:text-base lg:text-lg text-[#64748B] font-normal leading-relaxed">
              {lang === 'kz'
                ? 'Қазақстанда Data Matrix кодтарын шығару, стикерлерді басып шығару және қоймаға оклейка жасаудың нақты құнын есептеңіз.'
                : lang === 'en'
                ? 'Calculate the exact turnkey cost of Data Matrix code issuance, industrial label printing, and onsite stickering in Kazakhstan.'
                : 'Рассчитайте точную стоимость эмиссии Data Matrix кодов, печати стикеров и работы выездных оклейщиков в РК.'}
            </p>
          </div>

          <div className="hidden md:flex shrink-0 items-center justify-end">
            <ResponsiveBanner
              src="/banners/calculator.svg?v=20261029"
              alt={lang === 'kz' ? 'Таңбалау құнының калькуляторы' : lang === 'en' ? 'Marking cost calculator' : 'Калькулятор стоимости маркировки'}
              className="w-40 sm:w-52 md:w-60 lg:w-72 h-auto max-h-36 sm:max-h-44 md:max-h-52 lg:max-h-56 object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-300 hover:scale-105"
            />
          </div>
        </div>
      </section>

      <div>
        <CalculatorSection onOrderQuick={onOrderQuick} hideHeading={true} />
      </div>
    </div>
  );
};
