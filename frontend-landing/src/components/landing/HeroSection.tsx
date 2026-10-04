import React from 'react';
import { ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  onOpenCalculator: () => void;
  onOpenAuth: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenCalculator, onOpenAuth }) => {
  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden pt-20 pb-16 lg:pt-28 lg:pb-24 bg-[#0B0F19]">
      {/* Background Video with Darkening */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/hero-bg-poster.jpg"
          preload="metadata"
          className="w-full h-full object-cover object-center"
        >
          <source src="/hero-bg.webm" type="video/webm" />
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>

        {/* Затемнение видео */}
        <div className="absolute inset-0 bg-[#0B0F19]/70" />
      </div>

      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10 my-auto">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-[84px] font-extrabold text-white tracking-tight leading-[1.08] max-w-5xl mx-auto">
          Маркировка товаров в Казахстане <span className="text-[#0082FB] relative inline-block">под ключ</span>
        </h1>

        <p className="text-base sm:text-xl lg:text-2xl text-slate-200 font-normal leading-relaxed max-w-4xl mx-auto">
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


