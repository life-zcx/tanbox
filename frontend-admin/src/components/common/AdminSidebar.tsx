import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, Users, LogOut, ExternalLink, ClipboardList } from 'lucide-react';
import { AdminUser } from '../../types';

interface AdminSidebarProps {
  user: AdminUser | null;
  onLogout: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ user, onLogout }) => {
  const location = useLocation();

  const links = [
    { to: '/dashboard', label: 'Обзор систем', icon: LayoutDashboard },
    { to: '/leads', label: 'Заявки на услуги', icon: ClipboardList },
    { to: '/orders', label: 'Все заказы', icon: FileText },
    { to: '/tariffs', label: 'Тарифы и цены', icon: Settings },
    { to: '/users', label: 'Пользователи', icon: Users },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200/80 h-screen sticky top-0 p-5 flex flex-col justify-between shrink-0 z-30">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src="/tanbox-dark.svg" alt="tanbox" className="h-6 w-auto" />
            <span className="bg-[#0082FB] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider">
              ADMIN
            </span>
          </Link>
          <a
            href="http://127.0.0.1:3000"
            target="_blank"
            rel="noopener noreferrer"
            title="Перейти на главный сайт tanbox.kz"
            className="text-[#64748B] hover:text-[#0082FB] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#0082FB] text-white shadow-md shadow-[#0082FB]/20 font-extrabold'
                    : 'text-[#475569] hover:bg-[#EBF5FF]/60 hover:text-[#0082FB]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#64748B]'}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Logout */}
      <div className="pt-4 border-t border-gray-100">
        {user && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-extrabold text-red-600 hover:bg-red-50 transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4 text-red-600" />
            Выйти из аккаунта
          </button>
        )}
      </div>
    </aside>
  );
};
