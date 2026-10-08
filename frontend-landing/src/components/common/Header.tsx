import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, UserCheck } from 'lucide-react';

interface HeaderProps {
  onOpenAuth: () => void;
  maintenance?: boolean;
}

const NAV_LINKS = [
  { path: '/', label: 'Главная' },
  { path: '/calculator', label: 'Калькулятор цен' },
  { path: '/categories', label: 'Категории товаров' },
  { path: '/services', label: 'Услуги маркировки' },
  { path: '/contacts', label: 'Контакты' },
];

export const Header: React.FC<HeaderProps> = ({ onOpenAuth, maintenance }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const isActive = (path: string) => location.pathname === path;

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
            : 'bg-white/85 backdrop-blur-md border-b border-gray-200/50 shadow-xs'
        }`}
      >
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
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={isTransparent ? '/tanbox-white.svg' : '/tanbox-dark.svg'}
              alt="tanbox.kz"
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
                  to={link.path}
                  className={`text-sm font-semibold transition-colors ${
                    isTransparent
                      ? active
                        ? 'text-white font-bold drop-shadow-sm'
                        : 'text-white/85 hover:text-white drop-shadow-sm'
                      : active
                        ? 'text-[#0082FB] font-bold'
                        : 'text-[#64748B] hover:text-[#0082FB]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop LK Button */}
            <a
              href="http://127.0.0.1:3001/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex bg-[#0082FB] text-white font-extrabold text-xs sm:text-sm px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl hover:bg-[#0070DA] transition-all shadow-md shadow-blue-500/20 active:scale-95 items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Перейти в кабинет</span>
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

      {/* Fullscreen Mobile Menu (Без лишнего мусора) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 w-full h-full bg-white z-[100] md:hidden flex flex-col justify-between p-6 sm:p-8 animate-in fade-in duration-150">
          {/* Top: Logo and Close Button */}
          <div className="flex items-center justify-between pb-6 border-b border-gray-100">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
              <img
                src="/tanbox-dark.svg"
                alt="tanbox.kz"
                className="h-6 sm:h-7 w-auto"
              />
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Закрыть меню"
              className="w-10 h-10 rounded-2xl bg-gray-100 hover:bg-gray-200 text-[#111827] flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links (Строгие, крупные, понятные) */}
          <nav className="flex-1 py-8 flex flex-col justify-center space-y-4">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-2xl sm:text-3xl font-extrabold tracking-tight transition-colors py-2 flex items-center justify-between ${
                    active ? 'text-[#0082FB]' : 'text-[#111827] hover:text-[#0082FB]'
                  }`}
                >
                  <span>{link.label}</span>
                  {active && <span className="w-2.5 h-2.5 rounded-full bg-[#0082FB]" />}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Action: Только Личный кабинет */}
          <div className="pt-6 border-t border-gray-100">
            <a
              href="http://127.0.0.1:3001/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-base py-4 rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-md shadow-blue-500/25 active:scale-95"
            >
              <UserCheck className="w-5 h-5" />
              <span>Личный кабинет</span>
            </a>
          </div>
        </div>
      )}
    </>
  );
};
