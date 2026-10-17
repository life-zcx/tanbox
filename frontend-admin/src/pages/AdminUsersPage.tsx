import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminUsers } from '../hooks/useAdminUsers';
import { useAdminAuth } from '../hooks/useAdminAuth';
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
  Lock,
  Unlock,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  AlertCircle,
  Wallet,
} from 'lucide-react';
import { PageHeader } from '@shared';
import { UserClient } from '../types';
import { apiClient } from '../api/client';
import { ClientDetailModal } from '../components/modals/ClientDetailModal';
import { AdminAdjustBalanceModal } from '../components/modals/AdminAdjustBalanceModal';

export const AdminUsersPage: React.FC = () => {
  const { users: initialUsers, loading } = useAdminUsers();
  const { adminUser } = useAdminAuth();
  const [users, setUsers] = useState<UserClient[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CLIENT' | 'ADMIN'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BLOCKED'>('ALL');

  // Selected user for modal
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Block Modal state
  const [blockModalUser, setBlockModalUser] = useState<UserClient | null>(null);
  const [blockedReason, setBlockedReason] = useState<string>('');
  const [blockLoading, setBlockLoading] = useState<boolean>(false);

  // Delete Modal state
  const [deleteModalUser, setDeleteModalUser] = useState<UserClient | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // Balance adjustment modal state
  const [balanceModalUser, setBalanceModalUser] = useState<UserClient | null>(null);

  // Notification message
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

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

  const handleBalanceAdjustSuccess = (newBalance: number) => {
    if (!balanceModalUser) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === balanceModalUser.id ? { ...u, balance: newBalance } : u))
    );
    showToast(`Баланс ${balanceModalUser.companyName} успешно обновлен: ${newBalance.toLocaleString('ru-RU')} ₸`, 'success');
  };

  // Execute Block / Unblock
  const handleConfirmToggleBlock = async () => {
    if (!blockModalUser) return;
    setBlockLoading(true);
    try {
      const willBlock = !blockModalUser.isBlocked;
      const res = await apiClient.patch(`/users/${blockModalUser.id}/block`, {
        isBlocked: willBlock,
        blockedReason: willBlock ? (blockedReason.trim() || 'Блокировка администратором') : null,
      });

      const updatedUser = res.data.user;
      setUsers((prev) =>
        prev.map((u) => (u.id === blockModalUser.id ? { ...u, ...updatedUser } : u))
      );

      showToast(
        willBlock
          ? `Аккаунт ${blockModalUser.email} заблокирован`
          : `Аккаунт ${blockModalUser.email} разблокирован`,
        'success'
      );
      setBlockModalUser(null);
      setBlockedReason('');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Ошибка изменения статуса блокировки', 'error');
    } finally {
      setBlockLoading(false);
    }
  };

  // Execute Delete
  const handleConfirmDelete = async () => {
    if (!deleteModalUser) return;
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/users/${deleteModalUser.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== deleteModalUser.id));
      showToast(`Пользователь ${deleteModalUser.email} навсегда удален из системы`, 'success');
      setDeleteModalUser(null);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Ошибка при удалении пользователя', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter and search
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter !== 'ALL' && u.role !== roleFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'ACTIVE' && u.isBlocked) {
        return false;
      }
      if (statusFilter === 'BLOCKED' && !u.isBlocked) {
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
  }, [users, searchQuery, roleFilter, statusFilter]);

  const clientCount = users.filter((u) => u.role === 'CLIENT').length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const blockedCount = users.filter((u) => u.isBlocked).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold transition-all animate-in fade-in slide-in-from-top-4 ${
            toastMsg.type === 'success'
              ? 'bg-black text-white border border-gray-800'
              : 'bg-red-600 text-white border border-red-700'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-white shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Реестр клиентов и организаций РК"
          description="Управление организациями ТОО/ИП, блокировка доступа и удаление аккаунтов"
        />

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
            Всего: <strong className="text-black">{users.length}</strong>
          </span>
          <span className="text-xs font-bold text-gray-800 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
            Клиентов: <strong>{clientCount}</strong>
          </span>
          <span className="text-xs font-bold text-black bg-gray-200 px-3 py-1.5 rounded-xl border border-gray-300">
            Администраторов: <strong>{adminCount}</strong>
          </span>
          {blockedCount > 0 && (
            <span className="text-xs font-bold text-red-700 bg-red-50 px-3 py-1.5 rounded-xl border border-red-200">
              Заблокировано: <strong>{blockedCount}</strong>
            </span>
          )}
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
            className="w-full text-xs font-bold pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:border-black focus:outline-none transition-all"
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

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-gray-400 shrink-0 hidden sm:block" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="text-xs font-bold bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 focus:border-black focus:outline-none cursor-pointer"
            >
              <option value="ALL">Все роли ({users.length})</option>
              <option value="CLIENT">Клиенты ({clientCount})</option>
              <option value="ADMIN">Администраторы ({adminCount})</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs font-bold bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 focus:border-black focus:outline-none cursor-pointer"
          >
            <option value="ALL">Все статусы ({users.length})</option>
            <option value="ACTIVE">Активные ({users.length - blockedCount})</option>
            <option value="BLOCKED">Заблокированные ({blockedCount})</option>
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
            <div className="text-sm font-bold text-gray-700">Пользователи не найдены</div>
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
                  <th className="py-3.5 px-4">Баланс</th>
                  <th className="py-3.5 px-4">Статус</th>
                  <th className="py-3.5 px-4">Роль</th>
                  <th className="py-3.5 px-4 text-center">Заказов</th>
                  <th className="py-3.5 px-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm font-semibold">
                {filteredUsers.map((u) => {
                  const isCurrentAdmin = adminUser?.id === u.id;

                  return (
                    <tr
                      key={u.id}
                      onClick={() => handleOpenUser(u)}
                      className={`hover:bg-gray-50/80 transition-colors cursor-pointer group ${
                        u.isBlocked ? 'bg-red-50/30' : ''
                      }`}
                      title="Нажмите, чтобы открыть карточку клиента"
                    >
                      <td className="py-4 px-4 font-bold text-[#111827]">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                              u.isBlocked
                                ? 'bg-red-100 text-red-600'
                                : 'bg-gray-100 group-hover:bg-black group-hover:text-white text-gray-600'
                            }`}
                          >
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div
                              className={`text-xs font-extrabold transition-colors ${
                                u.isBlocked
                                  ? 'text-red-900 line-through'
                                  : 'text-[#111827] group-hover:text-black'
                              }`}
                            >
                              {u.companyName}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono">
                              ID: {u.id.slice(0, 8)}...
                            </div>
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

                      {/* Balance */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <span className="font-mono font-black text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                            {Number(u.balance || 0).toLocaleString('ru-RU')} ₸
                          </span>
                          <button
                            type="button"
                            onClick={() => setBalanceModalUser(u)}
                            className="p-1 rounded-lg bg-white hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                            title="Пополнить или списать баланс"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {u.isBlocked ? (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-red-100 text-red-800 border border-red-200"
                            title={u.blockedReason || 'Заблокирован'}
                          >
                            <Lock className="w-3 h-3 text-red-600" />
                            Заблокирован
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Активен
                          </span>
                        )}
                      </td>

                      {/* Role */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                            u.role === 'ADMIN'
                              ? 'bg-black text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {u.role === 'ADMIN' && <ShieldCheck className="w-3 h-3 text-white" />}
                          {u.role}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center font-black text-[#111827]">
                        {u._count?.orders ?? 0}
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Toggle Block Button */}
                          <button
                            type="button"
                            disabled={isCurrentAdmin}
                            onClick={() => {
                              setBlockModalUser(u);
                              setBlockedReason(u.blockedReason || '');
                            }}
                            className={`p-1.5 rounded-lg border transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
                              u.isBlocked
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:text-black hover:bg-gray-100'
                            }`}
                            title={
                              isCurrentAdmin
                                ? 'Нельзя заблокировать себя'
                                : u.isBlocked
                                ? 'Разблокировать аккаунт'
                                : 'Заблокировать аккаунт'
                            }
                          >
                            {u.isBlocked ? (
                              <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Lock className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            disabled={isCurrentAdmin}
                            onClick={() => setDeleteModalUser(u)}
                            className="p-1.5 rounded-lg bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 text-gray-400 hover:text-red-600 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                            title={
                              isCurrentAdmin
                                ? 'Нельзя удалить свой аккаунт'
                                : 'Удалить аккаунт навсегда'
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Block / Unblock Confirmation */}
      {blockModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    blockModalUser.isBlocked ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {blockModalUser.isBlocked ? (
                    <Unlock className="w-5 h-5" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-black">
                    {blockModalUser.isBlocked ? 'Разблокировать аккаунт?' : 'Заблокировать аккаунт?'}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">{blockModalUser.companyName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBlockModalUser(null)}
                className="text-gray-400 hover:text-black p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-gray-600 leading-relaxed">
                {blockModalUser.isBlocked ? (
                  <>
                    После разблокировки пользователь <strong>{blockModalUser.email}</strong> сможет снова
                    авторизоваться в личном кабинете и совершать операции.
                  </>
                ) : (
                  <>
                    Пользователь <strong>{blockModalUser.email}</strong> потеряет возможность входить в
                    систему. Активные сессии будут прекращены.
                  </>
                )}
              </p>

              {!blockModalUser.isBlocked && (
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Причина блокировки (необязательно)
                  </label>
                  <textarea
                    rows={2}
                    value={blockedReason}
                    onChange={(e) => setBlockedReason(e.target.value)}
                    placeholder="Например: Нарушение условий договора / Задолженность..."
                    className="w-full text-xs font-medium p-3 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:border-black focus:outline-none resize-none"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setBlockModalUser(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:text-black hover:bg-gray-100 transition-all"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={blockLoading}
                onClick={handleConfirmToggleBlock}
                className={`px-5 py-2.5 rounded-xl text-white text-xs font-extrabold shadow-md transition-all active:scale-95 disabled:opacity-50 ${
                  blockModalUser.isBlocked
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-black hover:bg-gray-800'
                }`}
              >
                {blockLoading
                  ? 'Сохранение...'
                  : blockModalUser.isBlocked
                  ? 'Разблокировать'
                  : 'Заблокировать доступ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Delete Confirmation */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-red-950">Удалить аккаунт навсегда?</h3>
                  <p className="text-xs text-gray-500 font-medium">{deleteModalUser.companyName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalUser(null)}
                className="text-gray-400 hover:text-black p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-900 space-y-2">
              <p className="font-bold">⚠️ Внимание! Это действие необратимо.</p>
              <p className="leading-relaxed">
                Будет безвозвратно удален аккаунт <strong>{deleteModalUser.email}</strong> (БИН:{' '}
                <code>{deleteModalUser.binIin}</code>), а также все связанные с ним шаблоны этикеток и
                история заказов.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteModalUser(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:text-black hover:bg-gray-100 transition-all"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {deleteLoading ? 'Удаление...' : 'Да, удалить навсегда'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Detail & Edit Modal */}
      <ClientDetailModal
        userId={selectedUserId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUserUpdated={handleUserUpdated}
      />

      {/* Admin Adjust Balance Modal */}
      {balanceModalUser && (
        <AdminAdjustBalanceModal
          isOpen={Boolean(balanceModalUser)}
          onClose={() => setBalanceModalUser(null)}
          user={{
            id: balanceModalUser.id,
            email: balanceModalUser.email,
            companyName: balanceModalUser.companyName,
            balance: balanceModalUser.balance,
          }}
          onSuccess={handleBalanceAdjustSuccess}
        />
      )}
    </div>
  );
};
