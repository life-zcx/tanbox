import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';

export const CookieBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('tanbox_cookie_consent');
      if (!consent) {
        // Show banner after brief delay
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('tanbox_cookie_consent', 'true');
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 sm:bottom-6 sm:right-6 sm:left-auto sm:max-w-md z-[999] animate-fade-in">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-gray-200/90 shadow-2xl space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#111827]">
            <Cookie className="w-4 h-4 text-[#0082FB]" />
            <span>Файлы cookie и безопасность</span>
          </div>
          <button
            onClick={handleAccept}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#64748B] leading-relaxed font-normal">
          Мы используем файлы cookie в соответствии с Законом РК «Об информатизации» и Законом РК № 94-V для обеспечения работы сервиса и аналитики.{' '}
          <Link to="/cookies" className="text-[#0082FB] font-semibold underline underline-offset-2">
            Подробнее
          </Link>
        </p>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleAccept}
            className="w-full bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
          >
            Принять и продолжить
          </button>
          <Link
            to="/privacy"
            className="text-xs font-semibold text-[#64748B] hover:text-[#111827] px-2 py-1 whitespace-nowrap transition-colors"
          >
            Политика
          </Link>
        </div>
      </div>
    </div>
  );
};
