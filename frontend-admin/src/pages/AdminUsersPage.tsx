import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminUsers } from '../hooks/useAdminUsers';
import {
  Users,
  Building2,
  Phone,
  Mail,
  Hash,
  ShieldCheck,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Eye,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '@shared';
import { UserClient } from '../types';
import { ClientDetailModal } from '../components/modals/ClientDetailModal';

export const AdminUsersPage: React.FC = () => {
  const { users: initialUsers, loading } = useAdminUsers();
  const [users, setUsers] = useState<UserClient[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CLIENT' | 'ADMIN'>('ALL');

  // Selected user for modal
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const navigate = useNavigate();

  const handleOpenUser = (user: UserClient) => {
    navigate(`/users/${user.id}`);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUserId(null);
  };

  const handleUserUpdated = (updatedUser: UserClient) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
    );
  };

  // Filter and search
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter !== 'ALL' && u.role !== roleFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCompany = u.companyName?.toLowerCase().includes(q);
        const matchesBin = u.binIin?.toLowerCase().includes(q);
        const matchesEmail = u.email?.toLowerCase().includes(q);
        const matchesPhone = u.phone?.toLowerCase().includes(q);
        if (!matchesCompany && !matchesBin && !matchesEmail && !matchesPhone) {
          return false;
        }
      }

      return true;
    });
  }, [users, searchQuery, roleFilter]);

  const clientCount = users.filter((u) => u.role === 'CLIENT').length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Реестр клиентов и организаций РК"
          description="Управление организациями ТОО/ИП, редактирование реквизитов и назначение прав"
        />

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
            Всего: <strong className="text-black">{users.length}</strong>
          </span>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
            Клиентов: <strong>{clientCount}</strong>
          </span>
          <span className="text-xs font-bold text-gray-900 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-300">
            Администраторов: <strong>{adminCount}</strong>
          </span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию компании, БИН/ИИН, e-mail или телефону..."
            className="w-full text-xs font-bold pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:border-[#0082FB] focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-gray-400 shrink-0 hidden sm:block" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="text-xs font-bold bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 focus:border-[#0082FB] focus:outline-none cursor-pointer"
          >
            <option value="ALL">Все роли ({users.length})</option>
            <option value="CLIENT">Только клиенты ({clientCount})</option>
            <option value="ADMIN">Только администраторы ({adminCount})</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm font-bold">
            Загрузка реестра клиентов...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Users className="w-10 h-10 text-gray-300 mx-auto" />
            <div className="text-sm font-bold text-gray-700">Клиенты не найдены</div>
            <p className="text-xs text-gray-400">
              Попробуйте изменить поисковый запрос или сбросить фильтры
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-extrabold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Компания</th>
                  <th className="py-3.5 px-4">БИН / ИИН</th>
                  <th className="py-3.5 px-4">E-mail</th>
                  <th className="py-3.5 px-4">Телефон</th>
                  <th className="py-3.5 px-4">Дата рег.</th>
                  <th className="py-3.5 px-4">Роль</th>
                  <th className="py-3.5 px-4 text-right">Заказов</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm font-semibold">
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => handleOpenUser(u)}
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                    title="Нажмите, чтобы открыть карточку клиента и редактировать данные"
                  >
                    <td className="py-4 px-4 font-bold text-[#111827]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gray-100 group-hover:bg-blue-100 transition-colors flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-gray-500 group-hover:text-[#0082FB] transition-colors" />
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-[#111827] group-hover:text-[#0082FB] transition-colors">
                            {u.companyName}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">ID: {u.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-xs font-bold text-gray-800">
                      {u.binIin}
                    </td>
                    <td className="py-4 px-4 text-xs text-gray-600">
                      {u.email}
                    </td>
                    <td className="py-4 px-4 text-xs text-gray-600 font-mono">
                      {u.phone}
                    </td>
                    <td className="py-4 px-4 text-xs text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                          u.role === 'ADMIN'
                            ? 'bg-black text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {u.role === 'ADMIN' && <ShieldCheck className="w-3 h-3 text-blue-400" />}
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-black text-[#111827]">
                      {u._count?.orders ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Client Detail & Edit Modal */}
      <ClientDetailModal
        userId={selectedUserId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );
};
