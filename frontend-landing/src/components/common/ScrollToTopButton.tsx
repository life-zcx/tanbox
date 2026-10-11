import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface ScrollToTopButtonProps {
  duration?: number;
}

export const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = () => {
  const { lang } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [cookieBannerVisible, setCookieBannerVisible] = useState(false);

  useEffect(() => {
    const checkBanner = () => {
      setCookieBannerVisible(!!document.getElementById('cookie-banner'));
    };
    checkBanner();
    const interval = setInterval(checkBanner, 400);
    return () => clearInterval(interval);
  }, []);

  const checkScroll = useCallback(() => {
    const currentScroll =
      window.pageYOffset ||
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    const scrollHeight =
      document.documentElement.scrollHeight || document.body.scrollHeight || 0;
    const clientHeight =
      window.innerHeight || document.documentElement.clientHeight || 0;
    const totalHeight = scrollHeight - clientHeight;

    // Show button earlier (after 150px) so it's easily accessible on mobile
    if (currentScroll > 150) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }

    if (totalHeight > 0) {
      const progress = Math.min(Math.max((currentScroll / totalHeight) * 100, 0), 100);
      setScrollProgress(progress);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll, { passive: true });
    checkScroll();

    return () => {
      window.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  const scrollToTop = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }
  };

  // SVG circle calculation
  const circleRadius = 22;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <div
      className={`fixed right-5 sm:right-8 z-[1002] transition-all duration-300 ease-out select-none ${
        cookieBannerVisible ? 'bottom-[150px] sm:bottom-8' : 'bottom-5 sm:bottom-8'
      } ${
        isVisible
          ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 scale-75 translate-y-4 pointer-events-none'
      }`}
    >
      <button
        type="button"
        onClick={scrollToTop}
        onTouchEnd={scrollToTop}
        aria-label={lang === 'kz' ? 'Беттің басына шығу' : lang === 'en' ? 'Scroll to top' : 'Наверх страницы'}
        title={lang === 'kz' ? 'Беттің басына шығу' : lang === 'en' ? 'Scroll to top' : 'Наверх страницы'}
        className="group relative w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#0082FB] hover:bg-[#0070DA] text-white flex items-center justify-center shadow-[0_0_20px_rgba(0,130,251,0.55)] hover:shadow-[0_0_28px_rgba(0,130,251,0.8)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer focus:outline-none ring-2 ring-white/30"
      >
        {/* SVG Circular Progress Ring */}
        <svg
          className="absolute inset-0 w-12 h-12 sm:w-13 sm:h-13 -rotate-90 pointer-events-none"
          viewBox="0 0 52 52"
        >
          {/* Background track */}
          <circle
            cx="26"
            cy="26"
            r={circleRadius}
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="2.5"
            fill="none"
          />
          {/* Animated active progress */}
          <circle
            cx="26"
            cy="26"
            r={circleRadius}
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            className="transition-all duration-150 ease-out"
          />
        </svg>

        {/* Up Arrow Icon with hover animation */}
        <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5] transition-transform duration-300 group-hover:-translate-y-0.5" />
      </button>
    </div>
  );
};

export default ScrollToTopButton;
