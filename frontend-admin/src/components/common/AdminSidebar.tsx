import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Settings,
  Users,
  LogOut,
  ExternalLink,
  ClipboardList,
  QrCode,
  Tag,
  Calculator,
  Server,
  Radio,
  FileSpreadsheet,
  Receipt,
} from 'lucide-react';
import { getLandingUrl } from '@shared';
import { AdminUser } from '../../types';

interface AdminSidebarProps {
  user: AdminUser | null;
  onLogout: () => void;
}

interface NavGroup {
  title?: string;
  items: {
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ user, onLogout }) => {
  const location = useLocation();

  const navGroups: NavGroup[] = [
    {
      items: [
        { to: '/dashboard', label: 'Обзор систем', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Продажи и заказы',
      items: [
        { to: '/orders', label: 'Заказы', icon: FileText },
        { to: '/invoices', label: 'Счета на оплату', icon: Receipt },
        { to: '/leads', label: 'Заявки на услуги', icon: ClipboardList },
        { to: '/price-builder', label: 'Конструктор прайсов', icon: FileSpreadsheet },
      ],
    },
    {
      title: 'Маркировка и производство',
      items: [
        { to: '/markirovka', label: 'Маркировка ИС МПТ', icon: Radio },
        { to: '/labels', label: 'Реестр этикеток', icon: Tag },
        { to: '/label-designer', label: 'Конструктор макетов', icon: QrCode },
        { to: '/stickering-calc', label: 'Калькулятор выезда', icon: Calculator },
      ],
    },
    {
      title: 'Управление и система',
      items: [
        { to: '/tariffs', label: 'Тарифы и цены', icon: Settings },
        { to: '/users', label: 'Пользователи', icon: Users },
        { to: '/system', label: 'Сервер & DevOps', icon: Server },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200/80 h-screen sticky top-0 p-4 flex flex-col justify-between shrink-0 z-30 overflow-y-auto">
      <div className="space-y-4">
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src="/tanbox-dark.svg" alt="tanbox" className="h-6 w-auto" />
            <span className="bg-[#0082FB] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider">
              ADMIN
            </span>
          </Link>
          <a
            href={getLandingUrl()}
            target="_blank"
            rel="noopener noreferrer"
            title="Перейти на главный сайт tanbox.kz"
            className="text-[#64748B] hover:text-[#0082FB] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Grouped Navigation Links */}
        <nav className="space-y-3.5">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-0.5">
              {group.title && (
                <div className="px-3 pt-1 pb-1 text-[10px] font-black uppercase text-[#94A3B8] tracking-wider">
                  {group.title}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((link) => {
                  const Icon = link.icon;
                  const isActive =
                    link.to === '/markirovka'
                      ? location.pathname.startsWith('/markirovka')
                      : link.to === '/system'
                      ? location.pathname.startsWith('/system')
                      : location.pathname === link.to;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#0082FB] text-white shadow-md shadow-[#0082FB]/20 font-extrabold'
                          : 'text-[#475569] hover:bg-[#EBF5FF]/60 hover:text-[#0082FB]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#64748B]'}`} />
                      <span className="truncate">{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
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
