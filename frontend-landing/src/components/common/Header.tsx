import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserCheck } from 'lucide-react';

interface HeaderProps {
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuth }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  // On home page and not scrolled: transparent header over video
  const isTransparent = isHomePage && !isScrolled;

  return (
    <header
      className={`transition-all duration-300 z-50 ${isHomePage ? 'fixed top-0 left-0 right-0' : 'sticky top-0'
        } ${isTransparent
          ? 'bg-transparent border-transparent shadow-none'
          : 'bg-white/85 backdrop-blur-md border-b border-gray-200/50 shadow-xs'
        }`}
    >
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between transition-all duration-300">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src={isTransparent ? '/tanbox-white.svg' : '/tanbox-dark.svg'}
            alt="tanbox.kz"
            className="h-5 sm:h-6 w-auto transition-all duration-300"
          />
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          <Link
            to="/"
            className={`text-sm font-semibold transition-colors ${isTransparent
                ? isActive('/')
                  ? 'text-white font-bold drop-shadow-sm'
                  : 'text-white/85 hover:text-white drop-shadow-sm'
                : isActive('/')
                  ? 'text-[#0082FB] font-bold'
                  : 'text-[#64748B] hover:text-[#0082FB]'
              }`}
          >
            Главная
          </Link>
          <Link
            to="/calculator"
            className={`text-sm font-semibold transition-colors ${isTransparent
                ? isActive('/calculator')
                  ? 'text-white font-bold drop-shadow-sm'
                  : 'text-white/85 hover:text-white drop-shadow-sm'
                : isActive('/calculator')
                  ? 'text-[#0082FB] font-bold'
                  : 'text-[#64748B] hover:text-[#0082FB]'
              }`}
          >
            Калькулятор цен
          </Link>
          <Link
            to="/categories"
            className={`text-sm font-semibold transition-colors ${isTransparent
                ? isActive('/categories')
                  ? 'text-white font-bold drop-shadow-sm'
                  : 'text-white/85 hover:text-white drop-shadow-sm'
                : isActive('/categories')
                  ? 'text-[#0082FB] font-bold'
                  : 'text-[#64748B] hover:text-[#0082FB]'
              }`}
          >
            Категории товаров
          </Link>
          <Link
            to="/services"
            className={`text-sm font-semibold transition-colors ${isTransparent
                ? isActive('/services')
                  ? 'text-white font-bold drop-shadow-sm'
                  : 'text-white/85 hover:text-white drop-shadow-sm'
                : isActive('/services')
                  ? 'text-[#0082FB] font-bold'
                  : 'text-[#64748B] hover:text-[#0082FB]'
              }`}
          >
            Услуги
          </Link>
          <Link
            to="/contacts"
            className={`text-sm font-semibold transition-colors ${isTransparent
                ? isActive('/contacts')
                  ? 'text-white font-bold drop-shadow-sm'
                  : 'text-white/85 hover:text-white drop-shadow-sm'
                : isActive('/contacts')
                  ? 'text-[#0082FB] font-bold'
                  : 'text-[#64748B] hover:text-[#0082FB]'
              }`}
          >
            Контакты
          </Link>
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-3">
          <a
            href="http://127.0.0.1:3001/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#0082FB] text-white font-extrabold text-xs sm:text-sm px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl hover:bg-[#0070DA] transition-all shadow-md shadow-blue-500/20 active:scale-95 flex items-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            <span>Перейти в кабинет</span>
          </a>
        </div>
      </div>
    </header>
  );
};
