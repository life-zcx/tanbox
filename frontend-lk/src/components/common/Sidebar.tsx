import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PackagePlus, 
  FileText, 
  Receipt, 
  User, 
  ExternalLink, 
  Phone, 
  Mail, 
  Send, 
  Tag, 
  X, 
  FileCheck2, 
  Package,
  Palette, 
  CreditCard, 
  Bug,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { getLandingUrl, COMPANY_CONFIG } from '@shared';
import { UserProfile } from '../../types';
import { BugReportModal } from '../modals/BugReportModal';

interface SidebarProps {
  user: UserProfile | null;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  user, 
  onLogout, 
  isOpen = false, 
  onClose,
  isCollapsed,
  onToggleCollapse
}) => {
  const location = useLocation();
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);

  const navGroups = [
    {
      id: 'main',
      links: [
        { to: '/dashboard', label: 'Обзор и Статистика', icon: LayoutDashboard },
        { to: '/orders/new', label: 'Создать заказ', icon: PackagePlus },
        { to: '/orders', label: 'Мои заказы', icon: FileText },
        { to: '/labels', label: 'Реестр этикеток', icon: Tag },
        { to: '/designer', label: 'Конструктор макетов', icon: Palette },
        { to: '/markirovka', label: 'ИС МПТ', icon: FileCheck2 },
        { to: '/product-cards', label: 'Описания товаров', icon: Package },
      ],
    },
    {
      id: 'finance',
      links: [
        { to: '/invoices', label: 'Счета на оплату', icon: Receipt },
        { to: '/payments', label: 'История платежей', icon: CreditCard },
      ],
    },
  ];

  const allLinks = [...navGroups[0].links, ...navGroups[1].links];

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

  // Content for Full (Expanded) and Mobile sidebar
  const renderExpandedContent = (isMobile = false) => (
    <>
      {/* Brand Header: Exactly h-16 to align seamlessly with Top Header */}
      <div className={`h-16 ${isMobile ? 'px-0' : 'px-4'} flex items-center justify-between border-b border-gray-200/80 shrink-0`}>
        <Link
          to="/dashboard"
          onClick={isMobile ? onClose : undefined}
          className="flex items-center gap-2"
        >
          <img src="/tanbox-dark.svg" alt="tanbox" className="h-6 w-auto" />
        </Link>

        <div className="flex items-center gap-1.5">
          {!isMobile && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Свернуть меню"
              className="text-[#64748B] hover:text-[#111827] p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}

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

      {/* Navigation Links Body with scroll */}
      <div className={`flex-1 overflow-y-auto overflow-x-hidden ${isMobile ? 'py-4' : 'p-3'} space-y-4`}>
        {navGroups.map((group, groupIdx) => (
          <div key={group.id} className="space-y-1">
            {groupIdx > 0 && <div className="my-2 border-t border-gray-100" />}
            {group.links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={isMobile ? onClose : undefined}
                  className={`flex items-center gap-3 ${
                    isMobile ? 'px-4 py-3 text-sm rounded-2xl' : 'px-3 py-2.5 text-xs rounded-xl'
                  } font-bold transition-all ${
                    isActive
                      ? 'bg-[#0082FB] text-white shadow-md shadow-[#0082FB]/20 font-extrabold'
                      : 'text-[#475569] hover:bg-[#EBF5FF]/60 hover:text-[#0082FB]'
                  }`}
                >
                  <Icon className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${isActive ? 'text-white' : 'text-[#64748B]'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom Support Section - Clean minimal styling */}
      <div className={`${isMobile ? 'pt-3' : 'p-3'} border-t border-gray-100 shrink-0`}>
        <div className="px-2 py-1 space-y-2 text-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Поддержка
          </div>
          <div className="space-y-1.5">
            <a
              href={COMPANY_CONFIG.supportLk.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[#475569] hover:text-[#0082FB] transition-colors text-xs font-medium"
            >
              <Send className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{COMPANY_CONFIG.supportLk.telegram}</span>
            </a>
            <a
              href={`tel:${COMPANY_CONFIG.supportLk.phoneRaw}`}
              className="flex items-center gap-2 text-[#475569] hover:text-[#0082FB] transition-colors text-xs font-medium"
            >
              <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{COMPANY_CONFIG.supportLk.phone}</span>
            </a>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsBugReportOpen(true)}
              className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-rose-600 transition-colors cursor-pointer w-full py-0.5"
            >
              <Bug className="w-3.5 h-3.5 text-gray-400" />
              <span>Нашли баг? Сообщить</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // Content for Collapsed (icon-only) desktop sidebar
  const renderCollapsedContent = () => (
    <>
      {/* Brand Header: Exactly h-16 to align seamlessly with Top Header */}
      <div className="h-16 flex items-center justify-center border-b border-gray-200/80 shrink-0">
        <button
          type="button"
          onClick={onToggleCollapse}
          title="Развернуть меню"
          className="w-10 h-10 flex items-center justify-center hover:opacity-70 transition-opacity cursor-pointer"
        >
          <img src="/tanbox-mark.svg" alt="tanbox" className="w-6 h-6 object-contain" />
        </button>
      </div>

      {/* Navigation Icons Only (No horizontal scrollbar) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-1.5 flex flex-col items-center">
        {navGroups.map((group, groupIdx) => (
          <div key={group.id} className="space-y-1.5 w-full flex flex-col items-center">
            {groupIdx > 0 && <div className="w-8 my-1.5 border-t border-gray-100" />}
            {group.links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <div key={link.to} className="relative group flex justify-center">
                  <Link
                    to={link.to}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-[#0082FB] text-white shadow-md shadow-[#0082FB]/20'
                        : 'text-[#475569] hover:bg-[#EBF5FF]/80 hover:text-[#0082FB]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#64748B]'}`} />
                  </Link>

                  {/* Floating tooltip on hover */}
                  <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#111827] text-white text-xs font-bold rounded-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                    {link.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#111827]" />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Collapsed Bottom Icons - Clean subtle style without bulky colored boxes */}
      <div className="p-3 border-t border-gray-100 flex flex-col items-center gap-1.5 shrink-0">
        {/* Compact Bug Report */}
        <div className="relative group">
          <button
            type="button"
            onClick={() => setIsBugReportOpen(true)}
            title="Сообщить о баге"
            className="w-9 h-9 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-gray-100 flex items-center justify-center transition-all cursor-pointer"
          >
            <Bug className="w-4 h-4" />
          </button>
          <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#111827] text-white text-xs font-bold rounded-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
            Сообщить о баге
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#111827]" />
          </div>
        </div>

        {/* Compact Telegram Support */}
        <div className="relative group">
          <a
            href={COMPANY_CONFIG.supportLk.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Поддержка в Telegram"
            className="w-9 h-9 rounded-xl text-gray-400 hover:text-[#0082FB] hover:bg-gray-100 flex items-center justify-center transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </a>
          <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#111827] text-white text-xs font-bold rounded-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
            Поддержка в Telegram
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#111827]" />
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar (Collapsible) */}
      <aside 
        className={`hidden md:flex ${
          isCollapsed ? 'w-20' : 'w-64'
        } bg-white border-r border-gray-200/80 h-screen sticky top-0 flex-col justify-between shrink-0 z-30 transition-all duration-200 select-none overflow-x-hidden`}
      >
        {isCollapsed ? renderCollapsedContent() : renderExpandedContent(false)}
      </aside>

      {/* Mobile Fullscreen Menu */}
      {isOpen && (
        <div className="fixed inset-0 w-full h-full bg-white z-50 md:hidden flex flex-col justify-between p-5 overflow-y-auto animate-in fade-in duration-150">
          {renderExpandedContent(true)}
        </div>
      )}

      {/* Bug Report / Feedback Modal */}
      <BugReportModal
        isOpen={isBugReportOpen}
        onClose={() => setIsBugReportOpen(false)}
      />
    </>
  );
};
