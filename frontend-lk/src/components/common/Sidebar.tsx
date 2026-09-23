import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PackagePlus, FileText, User, LogOut, ExternalLink, Phone, Mail, Send } from 'lucide-react';
import { UserProfile } from '../../types';

interface SidebarProps {
  user: UserProfile | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  const location = useLocation();

  const links = [
    { to: '/dashboard', label: 'Обзор и Статистика', icon: LayoutDashboard },
    { to: '/orders', label: 'Мои заказы', icon: FileText },
    { to: '/profile', label: 'Профиль компании', icon: User },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200/80 h-screen sticky top-0 p-5 flex flex-col justify-between shrink-0 z-30">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src="/tanbox-dark.svg" alt="tanbox" className="h-6 w-auto" />
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

      {/* Bottom Section */}
      <div className="space-y-3 pt-4 border-t border-gray-100">
        {/* Support Box */}
        <div className="bg-[#EBF5FF]/60 border border-[#0082FB]/10 rounded-2xl p-3.5 text-xs space-y-2">
          <p className="font-extrabold text-[#0082FB] uppercase tracking-wider text-[11px]">Служба поддержки</p>
          <div className="space-y-1.5 text-[#475569]">
            <a href="tel:+77273551020" className="flex items-center gap-2 hover:text-[#0082FB] transition-colors font-semibold text-[11px]">
              <Phone className="w-3.5 h-3.5 text-[#0082FB] shrink-0" />
              <span>+7 (727) 355-10-20</span>
            </a>
            <a href="mailto:support@tanbox.kz" className="flex items-center gap-2 hover:text-[#0082FB] transition-colors font-semibold text-[11px]">
              <Mail className="w-3.5 h-3.5 text-[#0082FB] shrink-0" />
              <span>support@tanbox.kz</span>
            </a>
            <a href="https://t.me/tanbox_support" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#0082FB] transition-colors font-semibold text-[11px]">
              <Send className="w-3.5 h-3.5 text-[#0082FB] shrink-0" />
              <span>@tanbox_support</span>
            </a>
          </div>
        </div>

        {/* Logout Button */}
        {user && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4 text-red-600" />
            Выйти из аккаунта
          </button>
        )}
      </div>
    </aside>
  );
};
