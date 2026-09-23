import React from 'react';
import { CalculatorSection } from '../components/landing/CalculatorSection';
import { TariffCode } from '../types';

interface CalculatorPageProps {
  onOrderQuick: (tariff: TariffCode, count: number, price: number) => void;
}

export const CalculatorPage: React.FC<CalculatorPageProps> = ({ onOrderQuick }) => {
  return (
    <div className="bg-[#F4F6F9] min-h-screen pb-16 space-y-8">
      {/* Header Banner */}
      <section className="relative py-12 sm:py-16 bg-white border-b border-gray-200/80 overflow-hidden">
        {/* Subtle grid pattern & ambient tint */}
        <div className="absolute inset-0 bg-[radial-gradient(#0082FB_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.07] pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0082FB]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-100/30 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-4">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#111827] tracking-tight leading-tight max-w-4xl">
            Калькулятор стоимости маркировки (₸)
          </h1>
          <p className="text-base sm:text-lg text-[#64748B] max-w-3xl font-normal leading-relaxed">
            Рассчитайте точную стоимость эмиссии Data Matrix кодов, печати стикеров и работы выездных оклейщиков в РК.
          </p>
        </div>
      </section>

      <div className="pt-2">
        <CalculatorSection onOrderQuick={onOrderQuick} />
      </div>
    </div>
  );
};
