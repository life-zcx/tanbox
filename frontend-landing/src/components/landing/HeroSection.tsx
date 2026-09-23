import React from 'react';
import { ArrowRight, ShieldCheck, CheckCircle2, Barcode, Cpu, Truck } from 'lucide-react';

interface HeroSectionProps {
  onOpenCalculator: () => void;
  onOpenAuth: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenCalculator, onOpenAuth }) => {
  return (
    <section className="bg-[#F4F6F9] min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center relative overflow-hidden py-16 lg:py-24">
      {/* Background subtle radial ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-100/40 via-blue-50/20 to-transparent pointer-events-none blur-2xl" />

      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10 my-auto">
        
        <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-[84px] font-extrabold text-[#111827] tracking-tight leading-[1.08] max-w-5xl mx-auto">
          Маркировка товаров в Казахстане <span className="text-[#0082FB] relative inline-block">под ключ</span>
        </h1>

        <p className="text-base sm:text-xl lg:text-2xl text-[#64748B] font-normal leading-relaxed max-w-4xl mx-auto">
          Комплексные решения для импортеров и производителей: таможенное оформление, заведение товаров в НКТ, эмиссия кодов Data Matrix в ИС Танба, высокоскоростная печать, выездная оклейка на вашем складе и SSCC-агрегация с интеграцией в 1С.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={onOpenCalculator}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#0082FB] text-white text-base sm:text-lg font-extrabold px-8 py-4 rounded-2xl hover:bg-[#0070DA] transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            Рассчитать стоимость (₸)
            <ArrowRight className="w-5 h-5" />
          </button>

          <a
            href="http://127.0.0.1:3001/orders/new"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-[#111827] border border-gray-200 text-base sm:text-lg font-extrabold px-8 py-4 rounded-2xl hover:bg-gray-50 transition-all active:scale-95 shadow-xs"
          >
            Оформить заявку
          </a>
        </div>

      </div>
    </section>
  );
};
