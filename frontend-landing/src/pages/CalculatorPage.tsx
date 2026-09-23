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
      <section className="py-10 sm:py-16 bg-white border-b border-gray-200/80">
        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
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
