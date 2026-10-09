import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  FileCheck2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Boxes,
  FileDown,
  FileX2,
  CheckCircle,
  FileEdit,
  PackageOpen,
  RotateCcw,
  KeyRound,
  Eye,
  History,
  Building2,
  Users,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageHeader } from '@shared';
import { apiClient } from '../api/client';
import { MarkirovkaNav } from '../components/markirovka/MarkirovkaNav';
import {
  MarkirovkaOperationsButton,
  MarkirovkaOpChoice,
} from '../components/markirovka/MarkirovkaOperationsButton';
import { NCALayerBadge } from '../components/markirovka/NCALayerBadge';
import { OperationModal } from '../components/markirovka/OperationModal';
import { OperationReceiptModal } from '../components/markirovka/OperationReceiptModal';
import { PartyAndCatalogModal } from '../components/markirovka/PartyAndCatalogModal';
import { Search } from 'lucide-react';

export const AdminMarkirovkaActivityPage: React.FC = () => {
  const navigate = useNavigate();

  const location = useLocation();
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    (location.state as any)?.accountId || 'ALL'
  );
  const [activeTabFilter, setActiveTabFilter] = useState<string>('ALL');
  const [operations, setOperations] = useState<any[]>([]);
  const [activity, setActivity] = useState<{ orders: any[]; reports: any[] }>({ orders: [], reports: [] });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals state
  const [modalOp, setModalOp] = useState<MarkirovkaOpChoice | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [showToolsModal, setShowToolsModal] = useState<boolean>(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const opParams: any = {};
      if (selectedAccountId !== 'ALL') {
        opParams.accountId = selectedAccountId;
      }
      const [actRes, opRes, accRes] = await Promise.all([
        apiClient.get('/markirovka/activity').catch(() => ({ data: { orders: [], reports: [] } })),
        apiClient.get('/markirovka/operations', { params: opParams }).catch(() => ({ data: { operations: [] } })),
        apiClient.get('/markirovka/accounts').catch(() => ({ data: { accounts: [] } })),
      ]);

      setActivity(actRes.data || { orders: [], reports: [] });
      setOperations(opRes.data?.operations || []);
      setAccounts(accRes.data?.accounts || []);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Ошибка загрузки истории операций', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const getOpBadge = (type: string) => {
    switch (type) {
      case 'IMPORT_NOTIFICATION':
        return { label: 'Ввоз товаров', icon: FileDown, color: 'bg-blue-50 text-[#0082FB] border-blue-200' };
      case 'UTILISATION':
        return { label: 'Нанесение КМ', icon: FileCheck2, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'AGGREGATION':
        return { label: 'Агрегация КМ', icon: Boxes, color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'RETIREMENT':
        return { label: 'Вывод из оборота', icon: FileX2, color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'VALIDATION':
        return { label: 'Валидация КМ', icon: CheckCircle, color: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'CORRECTION':
        return { label: 'Корректировка', icon: FileEdit, color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'DISAGGREGATION':
        return { label: 'Дезагрегация', icon: PackageOpen, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'RETURN_TO_TURNOVER':
        return { label: 'Возврат в оборот', icon: RotateCcw, color: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
      default:
        return { label: type, icon: History, color: 'bg-gray-50 text-gray-700 border-gray-200' };
    }
  };

  const filteredOperations = operations.filter((op) => {
    const matchesAccount = selectedAccountId === 'ALL' || op.accountId === selectedAccountId;
    const matchesType = activeTabFilter === 'ALL' || op.type === activeTabFilter;
    return matchesAccount && matchesType;
  });

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
        description="Операции ввода в оборот, нанесения, агрегации, вывода и взаимодействия с ИС МПТ"
        action={
          <div className="flex items-center gap-2.5">
            <NCALayerBadge />
            <button
              onClick={() => setShowToolsModal(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-all active:scale-95 shadow-xs cursor-pointer"
              title="Проверка статуса контрагента по БИН и поиск в НКТ по GTIN"
            >
              <Search className="w-3.5 h-3.5 text-[#0082FB]" />
              <span className="hidden sm:inline">Инструменты ИС МПТ</span>
            </button>
            <MarkirovkaOperationsButton
              onSelectOperation={(op) => setModalOp(op)}
              disabled={loading}
            />
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0082FB]' : ''}`} />
              <span className="hidden sm:inline">Обновить</span>
            </button>
          </div>
        }
      />

      {/* Navigation Tabs */}
      <MarkirovkaNav />

      {/* Account / Client Filter & Switcher Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-[#0082FB] flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-900">Клиент / Аккаунт ИС МПТ:</span>
              {selectedAccountId !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0082FB] border border-blue-200">
                  Фильтр активен
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500">
              {selectedAccountId === 'ALL'
                ? `Показаны операции всех клиентов (${accounts.length} акк.)`
                : `Клиент: ${accounts.find((a) => a.id === selectedAccountId)?.name || 'Выбранный'} (логин: ${accounts.find((a) => a.id === selectedAccountId)?.login || '—'})`}
            </p>
          </div>
        </div>

        {/* Switcher Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedAccountId('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedAccountId === 'ALL'
                ? 'bg-gray-900 text-white font-bold shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Все клиенты
          </button>
          {accounts.map((acc) => {
            const isSelected = selectedAccountId === acc.id;
            const accOpsCount = operations.filter((op) => op.accountId === acc.id).length;
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => setSelectedAccountId(acc.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-50 border-blue-300 text-[#0082FB] font-bold shadow-xs'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${acc.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                <span>{acc.name}</span>
                <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                  {acc.login}
                </span>
                {accOpsCount > 0 && (
                  <span className="text-[10px] text-gray-400 font-mono">
                    ({accOpsCount})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Operations Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'ALL', label: 'Все операции' },
          { id: 'IMPORT_NOTIFICATION', label: 'Ввоз товаров' },
          { id: 'UTILISATION', label: 'Нанесение КМ' },
          { id: 'AGGREGATION', label: 'Агрегация' },
          { id: 'RETIREMENT', label: 'Вывод из оборота' },
          { id: 'VALIDATION', label: 'Валидация' },
          { id: 'CORRECTION', label: 'Корректировка' },
          { id: 'DISAGGREGATION', label: 'Дезагрегация' },
          { id: 'RETURN_TO_TURNOVER', label: 'Возврат в оборот' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTabFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTabFilter === tab.id
                ? 'bg-black text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Operations Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-extrabold text-black flex items-center gap-2">
            <History className="w-4 h-4 text-[#0082FB]" />
            Реестр операций ИС МПТ ({filteredOperations.length})
          </h3>
          <span className="text-[11px] text-gray-400 font-medium">
            Синхронизировано с True API / СУЗ
          </span>
        </div>

        {filteredOperations.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
            <History className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500 font-bold mb-1">Операций пока нет</p>
            <p className="text-[11px] text-gray-400 mb-4">
              Создайте первую операцию через синюю кнопку вверху «Создать операцию».
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 uppercase font-extrabold text-[10px]">
                  <th className="pb-3 px-2">Дата и время</th>
                  <th className="pb-3 px-2">Тип операции</th>
                  <th className="pb-3 px-2">Документ / Квитанция</th>
                  <th className="pb-3 px-2">Аккаунт / БИН</th>
                  <th className="pb-3 px-2">Кодов</th>
                  <th className="pb-3 px-2">ЭЦП</th>
                  <th className="pb-3 px-2">Статус</th>
                  <th className="pb-3 px-2 text-right">Квитанция</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOperations.map((op: any) => {
                  const badge = getOpBadge(op.type);
                  const Icon = badge.icon;
                  return (
                    <tr key={op.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-2 text-gray-500 font-medium whitespace-nowrap">
                        {new Date(op.createdAt).toLocaleString('ru-RU')}
                      </td>

                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${badge.color}`}>
                          <Icon className="w-3 h-3" />
                          {badge.label}
                        </span>
                      </td>

                      <td className="py-3 px-2 font-mono font-bold text-gray-900">
                        {op.documentNumber || op.id.slice(0, 8)}
                      </td>

                      <td className="py-3 px-2">
                        <span className="font-bold text-gray-800 block">{op.account?.name || 'Системный'}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{op.account?.login || ''}</span>
                      </td>

                      <td className="py-3 px-2 font-black text-black">
                        {op.codesCount ? `${op.codesCount} шт.` : '—'}
                      </td>

                      <td className="py-3 px-2">
                        {op.isSigned ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-[#0082FB] border border-blue-100">
                            <KeyRound className="w-2.5 h-2.5" />
                            ЭЦП
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[10px]">API</span>
                        )}
                      </td>

                      <td className="py-3 px-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            op.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : op.status === 'FAILED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {op.status === 'COMPLETED' ? 'Принят' : op.status === 'FAILED' ? 'Ошибка' : 'В обработке'}
                        </span>
                      </td>

                      <td className="py-3 px-2 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(op)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold transition-all"
                        >
                          <Eye className="w-3 h-3" />
                          Детали
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Orders Table Card (Existing Emission History) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-extrabold text-black mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-[#0082FB]" />
          История заказов кодов (Эмиссия)
        </h3>

        {activity.orders.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">Заказов эмиссии пока нет</p>
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

      {/* Operation Creation Modal */}
      {modalOp && (
        <OperationModal
          operationType={modalOp}
          accounts={accounts}
          selectedAccountId={selectedAccountId !== 'ALL' ? selectedAccountId : undefined}
          onClose={() => setModalOp(null)}
          onSuccess={() => {
            showToast('Операция успешно выполнена и зарегистрирована в реестре!');
            fetchData();
          }}
        />
      )}

      {/* Receipt / Details Modal */}
      {selectedReceipt && (
        <OperationReceiptModal
          operation={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          onOperationUpdated={fetchData}
        />
      )}

      {/* Party & Catalog Tools Modal */}
      {showToolsModal && (
        <PartyAndCatalogModal onClose={() => setShowToolsModal(false)} />
      )}
    </div>
  );
};
