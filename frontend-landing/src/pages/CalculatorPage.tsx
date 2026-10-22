import React, { useEffect } from 'react';
import { CalculatorSection } from '../components/landing/CalculatorSection';
import { TariffCode } from '../types';
import { setPageSeo } from '../utils/seo';

import { useLanguage } from '../context/LanguageContext';

interface CalculatorPageProps {
  onOrderQuick: (tariff: TariffCode, count: number, price: number) => void;
}

export const CalculatorPage: React.FC<CalculatorPageProps> = ({ onOrderQuick }) => {
  const { lang } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (lang === 'kz') {
      setPageSeo(
        'Тауарларды таңбалау құнын есептеу калькуляторы (₸) | TANBOX.KZ',
        'Қазақстанда тауарларды Data Matrix бойынша цифрлық таңбалау құнын онлайн есептеу калькуляторы. ТМБ АЖ-де кодтарды эмиссиялау, термопечать және қоймада оклейка тарифтері.',
        { lang: 'kz', keywords: 'таңбалау бағасы калькулятор, Data Matrix бағасы, ТМБ АЖ кодтары бағасы' }
      );
    } else if (lang === 'en') {
      setPageSeo(
        'Product Serialization Cost Calculator (₸) in Kazakhstan | TANBOX.KZ',
        'Online pricing calculator for mandatory Data Matrix product marking in Kazakhstan. Calculate code issuance, label printing, and onsite stickering fees.',
        { lang: 'en', keywords: 'marking calculator Kazakhstan, serialization price, Data Matrix cost' }
      );
    } else {
      setPageSeo(
        'Калькулятор стоимости маркировки товаров в Казахстане (₸) | TANBOX.KZ',
        'Онлайн-калькулятор расчета стоимости обязательной маркировки товаров Data Matrix в Республике Казахстан. Тарифы на эмиссию кодов в ИС Танба, печать этикеток и выездную оклейку на складе.',
        { lang: 'ru', keywords: 'калькулятор маркировки Казахстан, стоимость маркировки, цена Data Matrix' }
      );
    }
  }, [lang]);

  return (
    <div className="bg-[#F4F6F9] min-h-screen pb-16 space-y-8">
      {/* Header Banner */}
      <section className="relative py-6 sm:py-8 lg:py-9 bg-white border-b border-gray-200/80 overflow-hidden">
        {/* Subtle grid pattern & ambient tint */}
        <div className="absolute inset-0 bg-[radial-gradient(#0082FB_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.07] pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0082FB]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-100/30 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 lg:gap-8">
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#111827] tracking-tight leading-tight">
              {lang === 'kz' 
                ? 'Тауарларды таңбалау құнын есептеу (₸)' 
                : lang === 'en' 
                ? 'Product Marking Cost Calculator (₸)' 
                : 'Калькулятор стоимости маркировки (₸)'}
            </h1>
            <p className="text-base sm:text-lg text-[#64748B] font-normal leading-relaxed">
              {lang === 'kz'
                ? 'Қазақстанда Data Matrix кодтарын шығару, стикерлерді басып шығару және қоймаға оклейка жасаудың нақты құнын есептеңіз.'
                : lang === 'en'
                ? 'Calculate the exact turnkey cost of Data Matrix code issuance, industrial label printing, and onsite stickering in Kazakhstan.'
                : 'Рассчитайте точную стоимость эмиссии Data Matrix кодов, печати стикеров и работы выездных оклейщиков в РК.'}
            </p>
          </div>

          <div className="shrink-0 flex items-center justify-center md:justify-end self-center md:self-auto">
            <img
              src="/banners/calculator.svg"
              alt="Калькулятор стоимости маркировки"
              className="w-40 sm:w-52 md:w-60 lg:w-72 h-auto max-h-36 sm:max-h-44 md:max-h-52 lg:max-h-56 object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-300 hover:scale-105"
              loading="eager"
            />
          </div>
        </div>
      </section>

      <div className="pt-2">
        <CalculatorSection onOrderQuick={onOrderQuick} hideHeading={true} />
      </div>
    </div>
  );
};
