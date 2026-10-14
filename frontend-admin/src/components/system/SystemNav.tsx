import React from 'react';
import { NavLink } from 'react-router-dom';
import { Terminal, Database, Send, HardDrive, ListOrdered } from 'lucide-react';

export const SystemNav: React.FC = () => {
  const links = [
    { to: '/system/logs', label: 'Системные логи', icon: Terminal },
    { to: '/system/backups', label: 'БД & Бэкапы', icon: Database },
    { to: '/system/telegram', label: 'Telegram мониторинг', icon: Send },
    { to: '/system/storage', label: 'Очистка диска и кэш', icon: HardDrive },
    { to: '/system/pdf-queue', label: 'Очередь PDF & Задачи', icon: ListOrdered },
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
