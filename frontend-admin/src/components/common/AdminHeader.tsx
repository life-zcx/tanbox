import React from 'react';
import { UserClient } from '../../types';
import { LogOut, ShieldAlert, ExternalLink, ShieldCheck } from 'lucide-react';

interface AdminHeaderProps {
  adminUser: UserClient | null;
  onLogout: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ adminUser, onLogout }) => {
  return (
    <header className="bg-black text-white h-16 px-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-800">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded border border-emerald-500/30 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> TANBOX ERP HQ
        </span>
        <h1 className="text-sm font-extrabold text-white">
          Панель Администратора
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <a
          href="http://127.0.0.1:3000"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1 bg-gray-900 border border-gray-700 px-3 py-1.5 rounded-lg transition-all"
        >
          tanbox.kz <ExternalLink className="w-3 h-3" />
        </a>

        {adminUser && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-extrabold text-white block">{adminUser.email}</span>
              <span className="text-[10px] text-gray-400 uppercase font-bold">Главный администратор</span>
            </div>

            <button
              onClick={onLogout}
              title="Выйти из системы"
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-900 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
