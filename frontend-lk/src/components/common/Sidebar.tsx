import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PackagePlus, FileText, User, LogOut, ExternalLink, Phone, Mail, Send, Tag, X } from 'lucide-react';
import { UserProfile } from '../../types';

interface SidebarProps {
  user: UserProfile | null;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, isOpen = false, onClose }) => {
  const location = useLocation();

  const links = [
    { to: '/dashboard', label: 'Обзор и Статистика', icon: LayoutDashboard },
    { to: '/orders/new', label: 'Создать заказ', icon: PackagePlus },
    { to: '/orders', label: 'Мои заказы', icon: FileText },
    { to: '/labels', label: 'Реестр этикеток', icon: Tag },
    { to: '/profile', label: 'Профиль компании', icon: User },
  ];

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const renderContent = (isMobile = false) => (
    <>
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <Link
            to="/dashboard"
            onClick={isMobile ? onClose : undefined}
            className="flex items-center gap-2"
          >
            <img src="/tanbox-dark.svg" alt="tanbox" className="h-6 w-auto" />
          </Link>
          <div className="flex items-center gap-2">
            <a
              href="http://127.0.0.1:3000"
              target="_blank"
              rel="noopener noreferrer"
              title="Перейти на главный сайт tanbox.kz"
              className="text-[#64748B] hover:text-[#0082FB] p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            {isMobile && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 hover:text-black hover:bg-gray-200 transition-colors cursor-pointer"
                aria-label="Закрыть меню"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* User Card in Mobile Drawer */}
        {isMobile && user && (
          <div className="bg-[#F8FAFC] border border-gray-200/80 rounded-2xl p-4 space-y-1 shadow-2xs">
            <p className="text-sm font-extrabold text-[#111827] truncate">
              {user.companyName || 'Организация'}
            </p>
            <p className="text-xs text-[#64748B] truncate font-medium">{user.email}</p>
            {user.binIin && (
              <p className="text-xs text-[#94A3B8] font-mono">БИН/ИИН: {user.binIin}</p>
            )}
          </div>
        )}

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={isMobile ? onClose : undefined}
                className={`flex items-center gap-3.5 ${
                  isMobile ? 'px-4 py-3.5 text-sm rounded-2xl' : 'px-3.5 py-3 text-xs rounded-xl'
                } font-bold transition-all ${
                  isActive
                    ? 'bg-[#0082FB] text-white shadow-md shadow-[#0082FB]/20 font-extrabold'
                    : 'text-[#475569] hover:bg-[#EBF5FF]/60 hover:text-[#0082FB]'
                }`}
              >
                <Icon className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${isActive ? 'text-white' : 'text-[#64748B]'}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="space-y-3 pt-4 border-t border-gray-100">
        {/* Support Box */}
        <div className="bg-[#EBF5FF]/60 border border-[#0082FB]/10 rounded-2xl p-4 text-xs space-y-2">
          <p className="font-extrabold text-[#0082FB] uppercase tracking-wider text-[11px]">Служба поддержки</p>
          <div className="space-y-2 text-[#475569]">
            <a href="tel:+77273551020" className="flex items-center gap-2.5 hover:text-[#0082FB] transition-colors font-semibold text-xs">
              <Phone className="w-4 h-4 text-[#0082FB] shrink-0" />
              <span>+7 (727) 355-10-20</span>
            </a>
            <a href="mailto:support@tanbox.kz" className="flex items-center gap-2.5 hover:text-[#0082FB] transition-colors font-semibold text-xs">
              <Mail className="w-4 h-4 text-[#0082FB] shrink-0" />
              <span>support@tanbox.kz</span>
            </a>
            <a href="https://t.me/tanbox_support" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 hover:text-[#0082FB] transition-colors font-semibold text-xs">
              <Send className="w-4 h-4 text-[#0082FB] shrink-0" />
              <span>@tanbox_support</span>
            </a>
          </div>
        </div>

        {/* Logout Button */}
        {user && (
          <button
            onClick={() => {
              if (isMobile && onClose) onClose();
              onLogout();
            }}
            className={`w-full flex items-center justify-center gap-3 ${
              isMobile ? 'py-3.5 text-sm rounded-2xl' : 'px-3.5 py-2.5 text-xs rounded-xl'
            } font-bold text-red-600 bg-red-50 hover:bg-red-100/80 transition-all active:scale-95 cursor-pointer`}
          >
            <LogOut className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} text-red-600`} />
            Выйти из аккаунта
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200/80 h-screen sticky top-0 p-5 flex-col justify-between shrink-0 z-30">
        {renderContent(false)}
      </aside>

      {/* Mobile Fullscreen Menu */}
      {isOpen && (
        <div className="fixed inset-0 w-full h-full bg-white z-50 md:hidden flex flex-col justify-between p-5 overflow-y-auto animate-in fade-in duration-150">
          {renderContent(true)}
        </div>
      )}
    </>
  );
};
