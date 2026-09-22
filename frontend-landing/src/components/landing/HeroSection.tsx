import React from 'react';
import { ArrowRight, ShieldCheck, CheckCircle2, Barcode, Cpu, Truck } from 'lucide-react';

interface HeroSectionProps {
  onOpenCalculator: () => void;
  onOpenAuth: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenCalculator, onOpenAuth }) => {
  return (
    <section className="bg-white border-b border-gray-200 min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center relative overflow-hidden py-16 lg:py-24">
      {/* Background subtle radial gradient accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-100 via-white to-white pointer-events-none opacity-80" />

      <div className="max-w-[1700px] w-full mx-auto px-6 sm:px-10 lg:px-16 text-center space-y-10 relative z-10 my-auto">
        
        <h1 className="text-5xl sm:text-7xl lg:text-8xl xl:text-[92px] font-black text-black tracking-tight leading-[1.06] max-w-6xl mx-auto font-heading">
          Маркировка товаров в Казахстане <span className="underline decoration-[6px] underline-offset-[12px] decoration-black">под ключ</span>
        </h1>

        <p className="text-xl sm:text-2xl lg:text-3xl text-gray-600 font-normal leading-relaxed max-w-5xl mx-auto font-body">
          Эмиссия кодов Data Matrix в ИС Танба, высокоскоростная термотрансферная печать, выездные бригады оклейщиков на склад и формирование SSCC агрегации для импортеров и производителей.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4">
          <button
            onClick={onOpenCalculator}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-black text-white text-xl font-extrabold px-10 py-5 rounded-2xl hover:bg-gray-800 transition-all shadow-xl active:scale-95"
          >
            Рассчитать стоимость (₸)
            <ArrowRight className="w-6 h-6" />
          </button>

          <a
            href="http://127.0.0.1:3001/orders/new"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black border-2 border-black text-xl font-extrabold px-10 py-5 rounded-2xl hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
          >
            Оформить заявку
          </a>
        </div>

      </div>
    </section>
  );
};
