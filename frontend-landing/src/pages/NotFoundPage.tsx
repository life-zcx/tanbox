import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { setPageSeo } from '../utils/seo';

export const NotFoundPage: React.FC = () => {
  const { lang, getLocalizedPath } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
    setPageSeo(
      lang === 'kz'
        ? 'Бет табылмады (404) | TANBOX.KZ'
        : lang === 'en'
        ? 'Page Not Found (404) | TANBOX.KZ'
        : 'Страница не найдена (404) | TANBOX.KZ',
      lang === 'kz'
        ? 'Сұралған бет табылмады немесе жылжытылған.'
        : lang === 'en'
        ? 'The requested page was not found or has been moved.'
        : 'Запрошенная страница не существует или была перемещена.',
      { lang }
    );
  }, [lang]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-[#F8FAFC]">
      <div className="max-w-xl w-full text-center space-y-6">
        
        {/* Visual 404 Scan Error Illustration (No frame, transparent) */}
        <div className="flex items-center justify-center">
          <img
            src="/banners/404.svg"
            alt={lang === 'kz' ? '404 — Сканерлеу қатесі' : lang === 'en' ? '404 — Scan Error' : '404 — Ошибка сканирования'}
            className="w-64 sm:w-80 md:w-96 h-auto block select-none pointer-events-none"
            loading="eager"
          />
        </div>

        {/* Text Details */}
        <div className="space-y-2 pt-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            {lang === 'kz'
              ? 'Бет табылмады'
              : lang === 'en'
              ? 'Page Not Found'
              : 'Страница не найдена'}
          </h1>

          <p className="text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
            {lang === 'kz'
              ? 'Кешіріңіз, сұралған сілтеме қате болуы мүмкін немесе бет жойылған.'
              : lang === 'en'
              ? 'The link you followed may be broken, or the page may have been removed.'
              : 'Возможно, адрес набран с ошибкой или страница была перемещена.'}
          </p>
        </div>

        {/* Single Primary Action Button */}
        <div className="pt-2">
          <Link
            to={getLocalizedPath('/')}
            className="inline-flex items-center justify-center gap-2 bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-sm px-8 py-3.5 rounded-xl transition-all active:scale-95 shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>{lang === 'kz' ? 'Басты бетке оралу' : lang === 'en' ? 'Back to Home' : 'Вернуться на главную'}</span>
          </Link>
        </div>

      </div>
    </div>
  );
};
