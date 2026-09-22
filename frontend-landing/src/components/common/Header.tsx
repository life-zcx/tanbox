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
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <img src="/tanbox-dark.svg" alt="tanbox.kz" className="h-6 w-auto" />
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className={`text-sm font-semibold transition-colors ${
              isActive('/') ? 'text-black font-bold underline underline-offset-8' : 'text-gray-600 hover:text-black'
            }`}
          >
            Главная
          </Link>
          <Link
            to="/calculator"
            className={`text-sm font-semibold transition-colors ${
              isActive('/calculator') ? 'text-black font-bold underline underline-offset-8' : 'text-gray-600 hover:text-black'
            }`}
          >
            Калькулятор цен
          </Link>
          <Link
            to="/categories"
            className={`text-sm font-semibold transition-colors ${
              isActive('/categories') ? 'text-black font-bold underline underline-offset-8' : 'text-gray-600 hover:text-black'
            }`}
          >
            Категории товаров
          </Link>
          <Link
            to="/tariffs"
            className={`text-sm font-semibold transition-colors ${
              isActive('/tariffs') ? 'text-black font-bold underline underline-offset-8' : 'text-gray-600 hover:text-black'
            }`}
          >
            Тарифы
          </Link>
          <Link
            to="/contacts"
            className={`text-sm font-semibold transition-colors ${
              isActive('/contacts') ? 'text-black font-bold underline underline-offset-8' : 'text-gray-600 hover:text-black'
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
            className="bg-black text-white font-extrabold text-sm px-6 py-2.5 rounded-xl hover:bg-gray-800 transition-all shadow-sm active:scale-95 flex items-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            Войти в кабинет
          </a>
        </div>
      </div>
    </header>
  );
};
