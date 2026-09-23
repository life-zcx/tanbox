import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Barcode, UserCheck, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuth }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200/80 shadow-xs">
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <img src="/tanbox-dark.svg" alt="tanbox.kz" className="h-6 w-auto" />
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className={`text-sm font-semibold transition-colors ${
              isActive('/') ? 'text-[#0082FB] font-bold' : 'text-[#64748B] hover:text-[#0082FB]'
            }`}
          >
            Главная
          </Link>
          <Link
            to="/calculator"
            className={`text-sm font-semibold transition-colors ${
              isActive('/calculator') ? 'text-[#0082FB] font-bold' : 'text-[#64748B] hover:text-[#0082FB]'
            }`}
          >
            Калькулятор цен
          </Link>
          <Link
            to="/categories"
            className={`text-sm font-semibold transition-colors ${
              isActive('/categories') ? 'text-[#0082FB] font-bold' : 'text-[#64748B] hover:text-[#0082FB]'
            }`}
          >
            Категории товаров
          </Link>
          <Link
            to="/services"
            className={`text-sm font-semibold transition-colors ${
              isActive('/services') ? 'text-[#0082FB] font-bold' : 'text-[#64748B] hover:text-[#0082FB]'
            }`}
          >
            Услуги
          </Link>
          <Link
            to="/contacts"
            className={`text-sm font-semibold transition-colors ${
              isActive('/contacts') ? 'text-[#0082FB] font-bold' : 'text-[#64748B] hover:text-[#0082FB]'
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
            className="bg-[#0082FB] text-white font-extrabold text-sm px-5 py-2.5 rounded-2xl hover:bg-[#0070DA] transition-all shadow-md shadow-blue-500/15 active:scale-95 flex items-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            Войти в кабинет
          </a>
        </div>
      </div>
    </header>
  );
};
