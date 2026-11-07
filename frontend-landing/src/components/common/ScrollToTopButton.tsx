import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowUp } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface ScrollToTopButtonProps {
  duration?: number;
}

export const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ duration = 650 }) => {
  const { lang } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [cookieBannerVisible, setCookieBannerVisible] = useState(false);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const cancelAnim = () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };

    window.addEventListener('wheel', cancelAnim, { passive: true });
    window.addEventListener('touchmove', cancelAnim, { passive: true });

    return () => {
      window.removeEventListener('wheel', cancelAnim);
      window.removeEventListener('touchmove', cancelAnim);
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const checkBanner = () => {
      setCookieBannerVisible(!!document.getElementById('cookie-banner'));
    };
    checkBanner();
    window.addEventListener('storage', checkBanner);
    window.addEventListener('tanbox:cookie-banner', checkBanner);
    return () => {
      window.removeEventListener('storage', checkBanner);
      window.removeEventListener('tanbox:cookie-banner', checkBanner);
    };
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

    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const startPosition =
      window.pageYOffset ||
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    if (startPosition <= 0) return;

    const startTime = performance.now();
    // Dynamic duration based on distance so long pages feel natural (500ms - 800ms)
    const animDuration = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 0
      : Math.min(Math.max(startPosition * 0.12, 500), duration);

    // Easing: cubic bezier easeInOut for silky smooth start & soft deceleration
    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = animDuration === 0 ? 1 : Math.min(elapsed / animDuration, 1);
      const eased = easeInOutCubic(progress);

      const targetY = startPosition * (1 - eased);
      window.scrollTo(0, targetY);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        window.scrollTo(0, 0);
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
  };

  // SVG circle calculation
  const circleRadius = 22;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <div
      className={`fixed right-4 sm:right-6 z-[1000] transition-[opacity,transform,bottom] duration-300 ease-out select-none motion-reduce:transition-none ${
        cookieBannerVisible ? 'bottom-[122px] sm:bottom-[92px]' : 'bottom-[76px] sm:bottom-[92px]'
      } ${
        isVisible
          ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 scale-75 translate-y-4 pointer-events-none'
      }`}
    >
      <button
        type="button"
        onClick={scrollToTop}
        tabIndex={isVisible ? 0 : -1}
        aria-label={lang === 'kz' ? 'Беттің басына шығу' : lang === 'en' ? 'Scroll to top' : 'Наверх страницы'}
        title={lang === 'kz' ? 'Беттің басына шығу' : lang === 'en' ? 'Scroll to top' : 'Наверх страницы'}
        className="group relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border border-gray-200 bg-white/95 hover:bg-white text-gray-600 hover:text-[#0088B6] backdrop-blur-md flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 active:scale-95 transition duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0088B6] focus-visible:ring-offset-2 motion-reduce:transform-none"
      >
        {/* SVG Circular Progress Ring */}
        <svg
          className="absolute inset-1 h-10 w-10 sm:inset-2 -rotate-90 pointer-events-none"
          viewBox="0 0 52 52"
        >
          {/* Background track */}
          <circle
            cx="26"
            cy="26"
            r={circleRadius}
            stroke="rgba(0, 136, 182, 0.08)"
            strokeWidth="1.5"
            fill="none"
          />
          {/* Animated active progress */}
          <circle
            cx="26"
            cy="26"
            r={circleRadius}
            stroke="rgba(0, 136, 182, 0.45)"
            strokeWidth="1.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            className="transition-all duration-150 ease-out"
          />
        </svg>

        {/* Up Arrow Icon with hover animation */}
        <ArrowUp className="w-5 h-5 stroke-2" />
      </button>
    </div>
  );
};

export default ScrollToTopButton;
