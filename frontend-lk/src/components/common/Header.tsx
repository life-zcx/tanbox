import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Wallet, 
  User, 
  LogOut, 
  ChevronDown, 
  Bug, 
  Menu, 
  Building2
} from 'lucide-react';
import { UserProfile } from '../../types';
import { TopUpBalanceModal } from '../modals/TopUpBalanceModal';
import { BugReportModal } from '../modals/BugReportModal';
import { apiClient } from '../../api/client';

export const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Обзор и Статистика',
    subtitle: 'Сводные метрики, статус выгрузок в ИС Танба и активные заказы организации',
  },
  '/orders': {
    title: 'Мои заказы',
    subtitle: 'Реестр всех партий маркировки, статусы и скачивание документов',
  },
  '/orders/new': {
    title: 'Создать заказ',
    subtitle: 'Оформление партии на печать и маркировку DataMatrix',
  },
  '/designer': {
    title: 'Конструктор макетов',
    subtitle: 'Создавайте и утверждайте макеты для DataMatrix и штрихкодов в точном размере',
  },
  '/payments': {
    title: 'История платежей',
    subtitle: 'Финансовые транзакции, пополнения баланса и списания',
  },
  '/invoices': {
    title: 'Счета на оплату',
    subtitle: 'Формирование и скачивание безналичных счетов для бухгалтерии',
  },
  '/labels': {
    title: 'Реестр этикеток',
    subtitle: 'Архив утвержденных макетов и шаблонов печати',
  },
  '/markirovka': {
    title: 'ИС МПТ',
    subtitle: 'Операции, документооборот, заказ кодов и интеграция с СУЗ',
  },
  '/product-cards': {
    title: 'Описания товаров',
    subtitle: 'Создание описаний товаров для получения официальных GTIN в НКТ / Маркировка КЗ',
  },
  '/profile': {
    title: 'Профиль компании',
    subtitle: 'Реквизиты организации, контактные данные и настройки безопасности',
  },
};

interface HeaderProps {
  user: UserProfile | null;
  onLogout: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  isSidebarCollapsed,
  onToggleSidebar,
  onOpenMobileMenu,
}) => {
  const location = useLocation();
  const [currentBalance, setCurrentBalance] = useState<number>(Number(user?.balance || 0));
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch balance and listen for balance updates
  useEffect(() => {
    const fetchBalance = () => {
      if (user?.id) {
        apiClient
          .get('/payments/balance')
          .then((res) => {
            if (res.data?.balance !== undefined) {
              setCurrentBalance(Number(res.data.balance));
            }
          })
          .catch(() => {});
      }
    };

    fetchBalance();
    window.addEventListener('tanbox:balance-updated', fetchBalance);
    return () => window.removeEventListener('tanbox:balance-updated', fetchBalance);
  }, [user?.id, location.pathname]);

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine current page title & subtitle
  const getPageMeta = () => {
    const path = location.pathname;
    if (PAGE_TITLES[path]) {
      return PAGE_TITLES[path];
    }
    if (path.startsWith('/orders/') && path !== '/orders/new') {
      return {
        title: 'Детали заказа',
        subtitle: 'Просмотр партии, статусы и сопроводительные файлы',
      };
    }
    return {
      title: 'Личный кабинет',
      subtitle: 'Система маркировки и печати этикеток TANBOX.KZ',
    };
  };

  const pageMeta = getPageMeta();

  // Company initials for avatar
  const getInitials = () => {
    if (!user?.companyName) return 'TB';
    const words = user.companyName.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return user.companyName.slice(0, 2).toUpperCase();
  };

  return (
    <>
      <header className="h-16 sticky top-0 z-30 bg-white border-b border-gray-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 transition-all">
        {/* Left Side: Collapse Toggle & Page Titles */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#475569] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            aria-label="Открыть меню"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page Title & Subtitle */}
          <div className="min-w-0 flex flex-col justify-center">
            <h1 className="text-base sm:text-lg lg:text-xl font-black text-[#111827] tracking-tight truncate leading-tight">
              {pageMeta.title}
            </h1>
            <p className="text-[11px] sm:text-xs text-[#64748B] font-medium truncate max-w-[200px] sm:max-w-md lg:max-w-xl leading-tight hidden xs:block mt-0.5">
              {pageMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Right Side: Balance, Bug Report & Profile Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Balance (borderless) */}
          {user && (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#0082FB] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 leading-none">
                    Баланс
                  </span>
                  <span className="text-xs sm:text-sm font-black text-[#111827] leading-tight font-mono whitespace-nowrap">
                    {Number(currentBalance).toLocaleString('ru-RU')} ₸
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsTopUpOpen(true)}
                title="Пополнить баланс"
                className="px-3 py-1.5 text-xs font-black bg-[#0082FB] hover:bg-[#0070DA] text-white rounded-xl transition-all active:scale-95 cursor-pointer shadow-xs whitespace-nowrap"
              >
                + Пополнить
              </button>
            </div>
          )}

          {/* Company Profile Button (borderless, icon + text) */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 py-1.5 px-2 rounded-xl text-[#475569] hover:text-[#111827] hover:bg-gray-100 transition-all cursor-pointer"
              title="Профиль компании"
            >
              <User className="w-4 h-4 text-[#475569]" />
              <span className="text-xs font-bold text-[#111827]">Профиль</span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-3xl border border-gray-200/90 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Header Profile Info */}
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60 rounded-t-2xl">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#0082FB] flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-[#111827] truncate">
                        {user?.companyName || 'Организация'}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
                    </div>
                  </div>
                  {user?.binIin && (
                    <div className="text-[10px] font-mono text-[#64748B] bg-white px-2 py-0.5 rounded-md border border-gray-200/60 inline-block">
                      БИН/ИИН: {user.binIin}
                    </div>
                  )}
                </div>

                {/* Dropdown Navigation Actions */}
                <div className="p-2 space-y-1">
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-[#111827] hover:bg-[#EBF5FF] hover:text-[#0082FB] rounded-xl transition-colors"
                  >
                    <User className="w-4 h-4 text-[#0082FB] shrink-0" />
                    <span>Перейти в профиль</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Выйти из профиля</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Top Up Balance Modal */}
      <TopUpBalanceModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        currentBalance={currentBalance}
      />

      {/* Bug Report Modal */}
      <BugReportModal
        isOpen={isBugReportOpen}
        onClose={() => setIsBugReportOpen(false)}
      />
    </>
  );
};
