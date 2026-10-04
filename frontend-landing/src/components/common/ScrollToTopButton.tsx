import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

interface ScrollToTopButtonProps {
  duration?: number; // duration in ms, default 1000ms
}

export const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ duration = 1000 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY || document.documentElement.scrollTop;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;

      // Show after scrolling down 350px
      if (currentScroll > 350) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      // Calculate progress percentage 0 to 100
      if (totalHeight > 0) {
        const progress = Math.min(Math.max((currentScroll / totalHeight) * 100, 0), 100);
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTopSlowly = () => {
    const startPosition = window.scrollY || document.documentElement.scrollTop;
    if (startPosition <= 0) return;

    const startTime = performance.now();

    // Silky smooth ease-in-out cubic curve
    const easeInOutCubic = (t: number): number => {
      return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    };

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(progress);

      window.scrollTo(0, startPosition * (1 - eased));

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  };

  // SVG circle calculation
  const circleRadius = 22;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <div
      className={`fixed bottom-8 right-8 z-50 transition-all duration-500 ease-out ${
        isVisible
          ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 scale-75 translate-y-4 pointer-events-none'
      }`}
    >
      <button
        type="button"
        onClick={scrollToTopSlowly}
        aria-label="Наверх страницы"
        title="Наверх страницы"
        className="group relative w-12 h-12 rounded-full bg-[#0082FB] hover:bg-[#0070DA] text-white flex items-center justify-center shadow-lg shadow-[#0082FB]/35 hover:shadow-[#0082FB]/60 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer focus:outline-none"
      >
        {/* SVG Circular Progress Ring */}
        <svg
          className="absolute inset-0 w-12 h-12 -rotate-90 pointer-events-none"
          viewBox="0 0 52 52"
        >
          {/* Background track */}
          <circle
            cx="26"
            cy="26"
            r={circleRadius}
            stroke="rgba(255, 255, 255, 0.2)"
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
        <ArrowUp className="w-5 h-5 transition-transform duration-300 group-hover:-translate-y-0.5" />
      </button>
    </div>
  );
};

export default ScrollToTopButton;
