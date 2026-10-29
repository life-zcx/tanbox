import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { getLkUrl } from '../../utils/navigation';
import { useLanguage } from '../../context/LanguageContext';

interface HeroSectionProps {
  onOpenCalculator?: () => void;
  onOpenAuth: () => void;
  onOpenOrderModal?: () => void;
  onScrollNext?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenCalculator, onScrollNext, onOpenOrderModal }) => {
  const { lang, t, getLocalizedPath } = useLanguage();
  const [titleNumber, setTitleNumber] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [loadVideo, setLoadVideo] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);

    // Delay video load until main thread is idle and critical resources are loaded
    const timer = setTimeout(() => {
      setLoadVideo(true);
    }, 1800);

    return () => {
      window.removeEventListener('resize', checkDesktop);
      clearTimeout(timer);
    };
  }, []);

  const titles = useMemo(() => {
    if (lang === 'kz') {
      return ['жылдам', 'сенімді', 'мерзімінде'];
    }
    if (lang === 'en') {
      return ['fast', 'reliably', 'on time'];
    }
    return ['быстро', 'надежно', 'в срок'];
  }, [lang]);

  useEffect(() => {
    setTitleNumber(0);
  }, [lang]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2500);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <section
      id="hero"
      className="relative min-h-screen min-h-[100dvh] w-full flex flex-col justify-between items-center overflow-hidden pt-16 sm:pt-24 pb-4 sm:pb-8 bg-[#0B0F19] text-white select-none"
    >
      {/* Background Video / Image with Darkening */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        {/* Mobile Background: Real authentic warehouse (matches desktop video) */}
        <picture className="block md:hidden w-full h-full">
          <source srcSet="/hero-bg-poster-mobile.webp" type="image/webp" />
          <img
            src="/hero-bg-mobile.jpg"
            alt="TANBOX Background"
            width={640}
            height={1138}
            className="w-full h-full object-cover object-center"
            loading="eager"
            {...({ fetchpriority: 'high' } as any)}
          />
        </picture>

        {/* Desktop Poster: Immediate crisp LCP paint without waiting for heavy video download */}
        <picture className="hidden md:block w-full h-full">
          <source srcSet="/hero-bg-poster.webp" type="image/webp" />
          <img
            src="/hero-bg-poster.webp"
            alt="TANBOX Warehouse"
            width={1920}
            height={1080}
            className="w-full h-full object-cover object-center"
            loading="eager"
            {...({ fetchpriority: 'high' } as any)}
          />
        </picture>

        {/* Desktop Video: Loaded asynchronously on md+ screens after critical render, avoiding 2.5MB network lock */}
        {isDesktop && loadVideo && (
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="none"
            className="hidden md:block absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000"
          >
            <source src="/hero-bg.webm" type="video/webm" />
            <source src="/hero-bg.mp4" type="video/mp4" />
          </video>
        )}

        {/* Затемнение фона: умеренное (60%), чтобы склад и стеллажи были отлично видны до самого верха */}
        <div className="absolute inset-0 bg-[#0B0F19]/60 md:bg-[#0B0F19]/75" />
      </div>

      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 sm:space-y-8 relative z-10 my-auto">
        
        {/* Main Title - Monumental & Grand scale (fills header width) */}
        <div className="space-y-2 sm:space-y-3">
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[76px] font-black text-white tracking-tight leading-[1.12] max-w-7xl mx-auto">
            <span className="block whitespace-normal lg:whitespace-nowrap">
              {lang === 'kz' 
                ? 'Қазақстанда тауарларды таңбалау' 
                : lang === 'en' 
                ? 'Product Marking in Kazakhstan' 
                : 'Маркировка товаров в Казахстане'}
            </span>

            {/* Second line: 'под ключ' is anchored to the center line and never moves. Dynamic word rotates seamlessly */}
            <div className="flex items-center justify-center mt-2 sm:mt-3">
              <span className="w-1/2 text-right pr-2 sm:pr-3.5 text-white whitespace-nowrap">
                {lang === 'kz' ? 'кілтке дейін' : lang === 'en' ? 'turnkey' : 'под ключ'}
              </span>
              <span className="w-1/2 text-left pl-2 sm:pr-0 pl-2 sm:pl-3.5 text-[#0082FB] overflow-hidden flex items-center">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`${lang}-${titleNumber}`}
                    className="block font-black text-[#0082FB] whitespace-nowrap"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    style={{ willChange: 'transform, opacity' }}
                  >
                    {titles[titleNumber]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </div>
          </h1>
        </div>

        {/* Subtitle - Wide, readable, premium */}
        <p className="text-sm sm:text-lg lg:text-xl text-slate-200/90 font-normal leading-relaxed max-w-3xl sm:max-w-4xl lg:max-w-5xl mx-auto px-2 sm:px-0">
          {t('hero.subtitle')}
        </p>

        {/* Buttons - Natural proportional width and proper rounded corners */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-4">
          <Link
            to={getLocalizedPath('/calculator')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#0082FB] hover:bg-[#0070DA] text-white text-sm sm:text-base font-bold px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-95 cursor-pointer"
          >
            <span>{lang === 'kz' ? 'Құнын есептеу' : lang === 'en' ? 'Calculate Cost' : 'Рассчитать стоимость'}</span>
            <ArrowRight className="w-5 h-5 shrink-0" />
          </Link>

          <button
            type="button"
            onClick={onOpenOrderModal}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent hover:bg-white/10 text-white border border-white/40 hover:border-white/70 text-sm sm:text-base font-bold px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl backdrop-blur-sm transition-all active:scale-95 cursor-pointer"
          >
            <span>{t('hero.btn_order')}</span>
          </button>
        </div>

      </div>

      {/* Down arrow indicator to screen 2 */}
      {onScrollNext && (
        <div className="z-10 shrink-0 pt-4">
          <button
            type="button"
            onClick={onScrollNext}
            aria-label={lang === 'kz' ? 'Төмен жылжу' : lang === 'en' ? 'Scroll down' : 'Листать вниз'}
            className="text-slate-400 hover:text-white transition-colors animate-bounce p-2 cursor-pointer flex flex-col items-center gap-1 text-xs"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>
      )}
    </section>
  );
};

export default HeroSection;
