import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const CookieBanner: React.FC = () => {
  const { lang, getLocalizedPath } = useLanguage();
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
    <div
      id="cookie-banner"
      className="fixed bottom-0 inset-x-0 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-md z-[999] animate-fade-in"
    >
      <div className="bg-white/95 backdrop-blur-md border-t sm:border border-gray-200/90 shadow-2xl sm:rounded-2xl px-4 py-2.5 sm:p-5">
        {/* Desktop View */}
        <div className="hidden sm:block space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#111827]">
              <Cookie className="w-4 h-4 text-[#0082FB]" />
              <span>
                {lang === 'kz'
                  ? 'Cookie файлдары және қауіпсіздік'
                  : lang === 'en'
                  ? 'Cookies and Security'
                  : 'Файлы cookie и безопасность'}
              </span>
            </div>
            <button
              onClick={handleAccept}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              aria-label={lang === 'kz' ? 'Жабу' : lang === 'en' ? 'Close' : 'Закрыть'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-[#475569] leading-relaxed font-normal">
            {lang === 'kz' ? (
              <>
                Біз сервистің жұмысын қамтамасыз ету және талдау үшін «Ақпараттандыру туралы» ҚР Заңы мен № 94-V ҚР Заңына сәйкес cookie файлдарын қолданамыз.{' '}
                <Link to={getLocalizedPath('/cookies')} className="text-[#006ED3] font-semibold underline underline-offset-2">
                  Толығырақ
                </Link>
              </>
            ) : lang === 'en' ? (
              <>
                We use cookies in accordance with the RK Law "On Informatization" and Law No. 94-V to ensure service operation and analytics.{' '}
                <Link to={getLocalizedPath('/cookies')} className="text-[#006ED3] font-semibold underline underline-offset-2">
                  Learn more
                </Link>
              </>
            ) : (
              <>
                Мы используем файлы cookie в соответствии с Законом РК «Об информатизации» и Законом РК № 94-V для обеспечения работы сервиса и аналитики.{' '}
                <Link to={getLocalizedPath('/cookies')} className="text-[#006ED3] font-semibold underline underline-offset-2">
                  Подробнее
                </Link>
              </>
            )}
          </p>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleAccept}
              className="w-full bg-[#0070DA] hover:bg-[#0060BA] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
            >
              {lang === 'kz' ? 'Қабылдау және жалғастыру' : lang === 'en' ? 'Accept and Continue' : 'Принять и продолжить'}
            </button>
            <Link
              to={getLocalizedPath('/privacy')}
              className="text-xs font-semibold text-[#475569] hover:text-[#111827] px-2 py-1 whitespace-nowrap transition-colors"
            >
              {lang === 'kz' ? 'Саясат' : lang === 'en' ? 'Privacy' : 'Политика'}
            </Link>
          </div>
        </div>

        {/* Mobile View: Slim unobtrusive strip */}
        <div className="sm:hidden flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Cookie className="w-3.5 h-3.5 text-[#006ED3] shrink-0" />
            <p className="text-[11px] text-[#475569] leading-tight truncate">
              {lang === 'kz'
                ? 'ҚР заңнамасына сай cookie қолданамыз.'
                : lang === 'en'
                ? 'We use cookies under RK law.'
                : 'Используем cookie по законам РК.'}{' '}
              <Link to={getLocalizedPath('/cookies')} className="text-[#006ED3] font-semibold underline">
                {lang === 'kz' ? 'Мәлімет' : lang === 'en' ? 'More' : 'Инфо'}
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleAccept}
              className="bg-[#0070DA] text-white font-bold text-[11px] py-1.5 px-3 rounded-lg shadow-sm cursor-pointer active:scale-95"
            >
              OK
            </button>
            <button
              onClick={handleAccept}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
