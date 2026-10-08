import React, { useState, useEffect } from 'react';
import {
  Package,
  FileCheck2,
  RefreshCw,
  Send,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@shared';
import { apiClient } from '../api/client';
import { MarkirovkaNav } from '../components/markirovka/MarkirovkaNav';

export const AdminMarkirovkaActivityPage: React.FC = () => {
  const navigate = useNavigate();
  const [activity, setActivity] = useState<{ orders: any[]; reports: any[] }>({ orders: [], reports: [] });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/markirovka/activity');
      setActivity(res.data);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Ошибка загрузки истории операций', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  const handleSendToUtilisation = (ord: any) => {
    navigate('/markirovka/utilisation', {
      state: {
        accountId: ord.accountId,
        category: ord.category,
        gtin: ord.gtin,
        codes: ord.codes || [],
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold transition-all animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Журнал операций ИС МПТ"
        description="История заказов эмиссии кодов и отправленных отчетов о нанесении"
        action={
          <button
            onClick={fetchActivity}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0082FB]' : ''}`} />
            Обновить данные
          </button>
        }
      />

      {/* Navigation Tabs */}
      <MarkirovkaNav />

      {/* Orders Table Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-extrabold text-black mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-[#0082FB]" />
          История заказов кодов (Эмиссия)
        </h3>

        {activity.orders.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">Заказов эмиссии пока нет</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 uppercase font-extrabold text-[10px]">
                  <th className="pb-3 px-2">Дата</th>
                  <th className="pb-3 px-2">Аккаунт</th>
                  <th className="pb-3 px-2">Категория</th>
                  <th className="pb-3 px-2">GTIN</th>
                  <th className="pb-3 px-2">Количество</th>
                  <th className="pb-3 px-2">ID в СУЗ</th>
                  <th className="pb-3 px-2">Статус</th>
                  <th className="pb-3 px-2 text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activity.orders.map((ord: any) => (
                  <tr key={ord.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-2 text-gray-500 font-medium">
                      {new Date(ord.createdAt).toLocaleString('ru-RU')}
                    </td>
                    <td className="py-3.5 px-2 font-bold text-gray-800">{ord.account?.name}</td>
                    <td className="py-3.5 px-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                        {ord.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 font-mono">{ord.gtin}</td>
                    <td className="py-3.5 px-2 font-extrabold text-black">
                      {ord.quantityReceived} / {ord.quantityRequested}
                    </td>
                    <td className="py-3.5 px-2 font-mono text-gray-500">{ord.externalOrderId || '—'}</td>
                    <td className="py-3.5 px-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'FAILED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      {ord.codes && ord.codes.length > 0 ? (
                        <button
                          onClick={() => handleSendToUtilisation(ord)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 text-[11px] font-bold transition-all shadow-sm active:scale-95"
                          title="Использовать коды в отчете о нанесении"
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          В отчет
                        </button>
                      ) : (
                        <span className="text-gray-300 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reports Table Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-extrabold text-black mb-4 flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-emerald-600" />
          История отчетов о нанесении (Утилизация)
        </h3>

        {activity.reports.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">Отчетов о нанесении пока нет</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 uppercase font-extrabold text-[10px]">
                  <th className="pb-3 px-2">Дата</th>
                  <th className="pb-3 px-2">Аккаунт</th>
                  <th className="pb-3 px-2">Категория</th>
                  <th className="pb-3 px-2">GTIN</th>
                  <th className="pb-3 px-2">Количество кодов</th>
                  <th className="pb-3 px-2">ID отчета в СУЗ</th>
                  <th className="pb-3 px-2">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activity.reports.map((rep: any) => (
                  <tr key={rep.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-2 text-gray-500 font-medium">
                      {new Date(rep.createdAt).toLocaleString('ru-RU')}
                    </td>
                    <td className="py-3.5 px-2 font-bold text-gray-800">{rep.account?.name}</td>
                    <td className="py-3.5 px-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                        {rep.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 font-mono">{rep.gtin || '—'}</td>
                    <td className="py-3.5 px-2 font-extrabold text-black">{rep.codesCount} шт</td>
                    <td className="py-3.5 px-2 font-mono text-gray-500">{rep.externalReportId || '—'}</td>
                    <td className="py-3.5 px-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rep.status === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rep.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {rep.status}
                      </span>
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
