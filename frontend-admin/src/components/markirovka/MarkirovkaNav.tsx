import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldCheck, Package, FileCheck2, History } from 'lucide-react';

export const MarkirovkaNav: React.FC = () => {
  const links = [
    { to: '/markirovka/accounts', label: 'Подключенные аккаунты', icon: ShieldCheck },
    { to: '/markirovka/orders', label: 'Заказ кодов (Эмиссия)', icon: Package },
    { to: '/markirovka/utilisation', label: 'Отчет о нанесении (Утилизация)', icon: FileCheck2 },
    { to: '/markirovka/activity', label: 'Журнал операций', icon: History },
  ];

  return (
    <div className="flex border-b border-gray-200 gap-1 overflow-x-auto">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-[#0082FB] text-[#0082FB] font-extrabold'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {link.label}
          </NavLink>
        );
      })}
    </div>
  );
};
