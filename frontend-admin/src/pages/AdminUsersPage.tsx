import React from 'react';
import { useAdminUsers } from '../hooks/useAdminUsers';
import { Users, Building2, Phone, Mail, Hash, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@shared';

export const AdminUsersPage: React.FC = () => {
  const { users, loading } = useAdminUsers();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Реестр клиентов и организаций РК"
        description="Зарегистрированные ТОО/ИП с проверкой БИН/ИИН"
      />

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Загрузка клиентов...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Клиенты не зарегистрированы.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
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
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 font-bold text-black flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                      {u.companyName}
                    </td>
                    <td className="py-4 px-4 font-mono text-xs font-bold text-gray-800">{u.binIin}</td>
                    <td className="py-4 px-4 text-xs text-gray-700">{u.email}</td>
                    <td className="py-4 px-4 text-xs text-gray-700">{u.phone}</td>
                    <td className="py-4 px-4 text-xs text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded ${
                        u.role === 'ADMIN' ? 'bg-black text-white' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-black text-black">
                      {u._count?.orders || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
