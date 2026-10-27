import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, UserCheck } from 'lucide-react';
import { getLkUrl } from '../../utils/navigation';
import { useLanguage } from '../../context/LanguageContext';

interface HeaderProps {
  onOpenAuth: () => void;
  maintenance?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuth, maintenance }) => {
  const location = useLocation();
  const { lang, setLang, t, getLocalizedPath } = useLanguage();

  // Normalize path without language prefix: '/', '/kz', '/en' all map to '/'
  const cleanPath = location.pathname.replace(/^\/(kz|en)(\/|$)/, '/').replace(/\/$/, '') || '/';
  const isHomePage = cleanPath === '/';

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTopBannerVisible, setIsTopBannerVisible] = useState(true);

  // Load top regulatory banner dismissal state from sessionStorage
  useEffect(() => {
    try {
      if (sessionStorage.getItem('tanbox_hide_jewelry_banner') === 'true') {
        setIsTopBannerVisible(false);
      }
    } catch {}
  }, []);

  const handleDismissTopBanner = () => {
    setIsTopBannerVisible(false);
    try {
      sessionStorage.setItem('tanbox_hide_jewelry_banner', 'true');
    } catch {}
  };

  const NAV_LINKS = [
    { path: '/', label: t('nav.home') },
    { path: '/calculator', label: t('nav.calc') },
    { path: '/categories', label: t('nav.categories') },
    { path: '/services', label: t('nav.services') },
    { path: '/articles', label: t('nav.articles') },
    { path: '/contacts', label: t('nav.contacts') },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu on page navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => cleanPath === path;

  // On home page and not scrolled: transparent header over hero video
  const isTransparent = isHomePage && !isScrolled;

  return (
    <>
      <header
        className={`transition-all duration-300 z-50 ${
          isHomePage ? 'fixed top-0 left-0 right-0' : 'sticky top-0'
        } ${
          isTransparent
            ? 'bg-transparent border-transparent shadow-none'
            : 'bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-xs'
        }`}
      >
        {/* Sleek On-Brand Regulatory Top Strip (Dismissable Notification) */}
        {isTopBannerVisible && (
          <div className="bg-[#0B132B]/95 text-slate-300 text-xs py-1.5 sm:py-2 border-b border-white/10 block transition-all">
            <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">
              <span className="text-slate-300 text-[11px] sm:text-xs leading-snug">
                <strong className="text-white font-bold">
                  {lang === 'kz' ? '2026 ж. 1 желтоқсаннан' : lang === 'en' ? 'From Dec 1, 2026' : 'С 1 декабря 2026 года'}
                </strong>{' '}
                <span className="hidden sm:inline">
                  {lang === 'kz'
                    ? 'Қазақстанда зергерлік бұйымдарды міндетті цифрлық таңбалау енгізіледі'
                    : lang === 'en'
                    ? 'mandatory jewelry digital marking is introduced in Kazakhstan'
                    : 'вводится обязательная маркировка ювелирных изделий в Казахстане'}
                </span>
                <span className="sm:hidden">
                  {lang === 'kz'
                    ? '— зергерлік бұйымдарды таңбалау'
                    : lang === 'en'
                    ? '— маркировка ювелирки'
                    : '— маркировка ювелирки'}
                </span>
              </span>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <Link
                  to={getLocalizedPath('/categories/jewelry')}
                  className="text-[10px] sm:text-[11px] font-extrabold text-white bg-[#0082FB] hover:bg-[#0070DA] px-2.5 sm:px-3 py-1 rounded-lg transition-all shadow-xs"
                >
                  {lang === 'kz' ? 'Толығырақ' : lang === 'en' ? 'Learn more' : 'Подробнее'} →
                </Link>
                <button
                  type="button"
                  onClick={handleDismissTopBanner}
                  className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                  aria-label={lang === 'kz' ? 'Жабу' : lang === 'en' ? 'Close' : 'Закрыть'}
                  title={lang === 'kz' ? 'Жабу' : lang === 'en' ? 'Close' : 'Закрыть'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Maintenance Announcement Bar */}
        {maintenance && (
          <div className="bg-[#0F172A] text-slate-200 text-xs font-medium py-2 px-4 text-center border-b border-slate-800 flex items-center justify-center gap-2">
            <span className="px-2 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-bold rounded">
              ТЕХРАБОТЫ
            </span>
            <span>На платформе проводятся регламентные работы. Оформление заказов возобновится в течение 10–15 минут.</span>
          </div>
        )}

        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between transition-all duration-300">
          {/* Logo */}
          <Link to={getLocalizedPath('/')} className="flex items-center gap-3 group">
            <img
              src={isTransparent ? '/tanbox-white.svg' : '/tanbox-dark.svg'}
              alt="tanbox.kz"
              width={140}
              height={24}
              className="h-5 sm:h-6 w-auto transition-all duration-300"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={getLocalizedPath(link.path)}
                  className={`text-sm font-semibold transition-colors ${
                    isTransparent
                      ? active
                        ? 'text-white font-bold drop-shadow-sm'
                        : 'text-white/85 hover:text-white drop-shadow-sm'
                      : active
                        ? 'text-[#0082FB] font-bold'
                        : 'text-[#334155] hover:text-[#0082FB]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher Pill (Desktop only, mobile has it in drawer) */}
            <div
              className={`hidden md:flex items-center h-8 sm:h-9 p-0.5 sm:p-1 rounded-xl border text-[11px] sm:text-xs font-bold transition-all ${
                isTransparent
                  ? 'bg-white/10 border-white/20 text-white backdrop-blur-md'
                  : 'bg-gray-100 border-gray-200 text-slate-700'
              }`}
            >
              <button
                type="button"
                onClick={() => setLang('kz')}
                className={`h-full px-1.5 sm:px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                  lang === 'kz'
                    ? 'bg-[#0082FB] text-white shadow-xs'
                    : 'hover:text-[#0082FB] opacity-75 hover:opacity-100'
                }`}
              >
                ҚАЗ
              </button>
              <button
                type="button"
                onClick={() => setLang('ru')}
                className={`h-full px-1.5 sm:px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                  lang === 'ru'
                    ? 'bg-[#0082FB] text-white shadow-xs'
                    : 'hover:text-[#0082FB] opacity-75 hover:opacity-100'
                }`}
              >
                РУС
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`h-full px-1.5 sm:px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                  lang === 'en'
                    ? 'bg-[#0082FB] text-white shadow-xs'
                    : 'hover:text-[#0082FB] opacity-75 hover:opacity-100'
                }`}
              >
                ENG
              </button>
            </div>

            {/* Desktop LK Button (matched height, font and padding) */}
            <a
              href={getLkUrl('/dashboard')}
              target="_blank"
              rel="noopener noreferrer"
              className={`hidden md:inline-flex items-center justify-center gap-1.5 sm:gap-2 h-8 sm:h-9 font-bold text-[11px] sm:text-xs px-3 sm:px-3.5 rounded-xl border transition-all active:scale-95 ${
                isTransparent
                  ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-md shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200 text-[#111827] border-gray-200/80 shadow-2xs'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{t('nav.cabinet')}</span>
            </a>

            {/* Mobile Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Открыть навигационное меню"
              className={`md:hidden p-2 sm:p-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
                isTransparent
                  ? 'bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-md shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200 text-[#111827] border border-gray-200/80 shadow-2xs'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Fullscreen Sleek Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 w-full h-full bg-[#0F1E36] z-[9999] md:hidden flex flex-col justify-between p-6 sm:p-8 text-white select-none animate-in fade-in duration-200">
          {/* Top row: Logo on left, X on right */}
          <div className="flex items-center justify-between pb-5 border-b border-white/10">
            <Link
              to={getLocalizedPath('/')}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 group"
            >
              <img
                src="/tanbox-white.svg"
                alt="tanbox.kz"
                width={140}
                height={28}
                className="h-6 sm:h-7 w-auto"
              />
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label={lang === 'kz' ? 'Мәзірді жабу' : lang === 'en' ? 'Close menu' : 'Закрыть меню'}
              className="p-1.5 text-white/80 hover:text-white transition-colors cursor-pointer focus:outline-none"
            >
              <X className="w-6 h-6 stroke-[2]" />
            </button>
          </div>

          {/* Navigation links - centered with generous breathing room */}
          <nav className="flex-1 my-auto flex flex-col items-center justify-center space-y-5 text-center py-4">
            {NAV_LINKS.map((link) => {
              const active =
                cleanPath === link.path ||
                (link.path !== '/' && cleanPath.startsWith(link.path));
              return (
                <Link
                  key={link.path}
                  to={getLocalizedPath(link.path)}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-lg sm:text-xl tracking-wide transition-colors ${
                    active
                      ? 'text-[#0082FB] font-bold'
                      : 'text-slate-100 hover:text-[#0082FB] font-medium'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section: KZ RU EN + LK button */}
          <div className="space-y-5 pt-5 border-t border-white/10 max-w-sm w-full mx-auto">
            {/* Language switcher KZ RU EN */}
            <div className="flex items-center justify-center gap-8 text-sm sm:text-base tracking-wider font-semibold">
              <button
                type="button"
                onClick={() => setLang('kz')}
                className={`transition-colors cursor-pointer ${
                  lang === 'kz'
                    ? 'text-[#0082FB] font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                KZ
              </button>
              <button
                type="button"
                onClick={() => setLang('ru')}
                className={`transition-colors cursor-pointer ${
                  lang === 'ru'
                    ? 'text-[#0082FB] font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                RU
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`transition-colors cursor-pointer ${
                  lang === 'en'
                    ? 'text-[#0082FB] font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
            </div>

            {/* Cabinet Button */}
            <a
              href={getLkUrl('/dashboard')}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#0082FB] hover:bg-[#0070DA] text-white text-xs sm:text-sm font-semibold py-3 px-4 rounded-xl text-center flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span className="truncate">{t('nav.cabinet')}</span>
            </a>
          </div>
        </div>
      )}
    </>
  );
};
