import React from 'react';
import { UserProfile } from '../../types';
import { LogOut, User, Building2, ExternalLink } from 'lucide-react';

interface HeaderProps {
  user: UserProfile | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-white border-b border-gray-200 h-16 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-extrabold text-black tracking-tight">
          Личный кабинет клиента
        </h1>
        <a
          href="http://127.0.0.1:3000"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-gray-500 hover:text-black flex items-center gap-1 border border-gray-200 px-2.5 py-1 rounded-md bg-gray-50"
        >
          tanbox.kz <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {user && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-right">
            <div>
              <p className="text-xs font-extrabold text-black">{user.companyName}</p>
              <p className="text-[11px] text-gray-500 font-mono">БИН: {user.binIin}</p>
            </div>
            <div className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Выйти из аккаунта"
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      )}
    </header>
  );
};
