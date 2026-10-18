import React, { useState, useEffect, useCallback } from 'react';
import {
  FileCheck2,
  RefreshCw,
  Boxes,
  FileDown,
  FileX2,
  CheckCircle,
  FileEdit,
  PackageOpen,
  RotateCcw,
  Eye,
  Building2,
  Server,
  Plus,
  Edit2,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  KeyRound,
  ShieldAlert,
  PackagePlus,
  Package,
  Wallet,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { MarkirovkaHeaderBar } from '../components/markirovka/MarkirovkaHeaderBar';
import {
  MarkirovkaOpChoice,
} from '../components/markirovka/MarkirovkaOperationsButton';
import { OperationModal } from '../components/markirovka/OperationModal';
import { OperationReceiptModal } from '../components/markirovka/OperationReceiptModal';
import { TopUpBalanceModal } from '../components/modals/TopUpBalanceModal';

export const MarkirovkaPage: React.FC = () => {
  const [operations, setOperations] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTabFilter, setActiveTabFilter] = useState<string>('ALL');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');

  // Modals state
  const [modalOp, setModalOp] = useState<MarkirovkaOpChoice | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);
  const [userBalance, setUserBalance] = useState<number>(0);

  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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
      if (activeTabFilter !== 'ALL') {
        opParams.type = activeTabFilter;
      }

      const [opRes, accRes, balRes] = await Promise.all([
        apiClient.get('/markirovka/operations', { params: opParams }).catch(() => ({ data: { operations: [] } })),
        apiClient.get('/markirovka/accounts').catch(() => ({ data: { accounts: [] } })),
        apiClient.get('/payments/balance').catch(() => ({ data: { balance: 0 } })),
      ]);

      setOperations(opRes.data?.operations || []);
      setAccounts(accRes.data?.accounts || []);
      if (balRes.data?.balance !== undefined) {
        setUserBalance(Number(balRes.data.balance));
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Ошибка загрузки данных маркировки', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId, activeTabFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getOpBadge = (type: string) => {
    switch (type) {
      case 'ORDER':
        return { label: 'Заказ кодов', icon: PackagePlus, color: 'bg-violet-50 text-violet-700 border-violet-200' };
      case 'IMPORT_NOTIFICATION':
        return { label: 'Ввоз товаров', icon: FileDown, color: 'bg-blue-50 text-[#0082FB] border-blue-200' };
      case 'UTILISATION':
        return { label: 'Нанесение КМ', icon: FileCheck2, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'AGGREGATION':
        return { label: 'Агрегация КМ', icon: Boxes, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'RETIREMENT':
        return { label: 'Вывод из оборота', icon: FileX2, color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'VALIDATION':
        return { label: 'Валидация КМ', icon: CheckCircle, color: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'CORRECTION':
        return { label: 'Корректировка', icon: FileEdit, color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'DISAGGREGATION':
        return { label: 'Дезагрегация', icon: PackageOpen, color: 'bg-orange-50 text-orange-700 border-orange-200' };
      case 'RETURN_TO_TURNOVER':
        return { label: 'Возврат в оборот', icon: RotateCcw, color: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
      default:
        return { label: type, icon: FileCheck2, color: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  const tabs = [
    { id: 'ALL', label: 'Все операции' },
    { id: 'ORDER', label: 'Заказы КМ' },
    { id: 'IMPORT_NOTIFICATION', label: 'Ввоз товаров' },
    { id: 'UTILISATION', label: 'Нанесение КМ' },
    { id: 'AGGREGATION', label: 'Агрегация' },
    { id: 'RETIREMENT', label: 'Вывод из оборота' },
    { id: 'VALIDATION', label: 'Валидация' },
    { id: 'RETURN_TO_TURNOVER', label: 'Возврат в оборот' },
  ];

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Unified Compact Bar: Account Status, Actions, and Working Modals */}
      <MarkirovkaHeaderBar
        mode="MPT"
        accounts={accounts}
        loading={loading}
        onRefresh={fetchData}
        onSelectOperation={(op) => setModalOp(op)}
      />

      {accounts.length === 0 && (
        <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-bold text-gray-900">Станция СУЗ / ИС МПТ еще не подключена</p>
            <p className="text-gray-600 text-[11px]">
              Подключите станцию, чтобы формировать заказы кодов, отчеты о нанесении и агрегацию.
            </p>
          </div>
        </div>
      )}

      {/* Operations History Section */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto px-4 pt-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTabFilter(tab.id)}
              className={`pb-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTabFilter === tab.id
                  ? 'border-[#0082FB] text-[#0082FB]'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table with Vertical & Horizontal Scroll and Sticky Header */}
        <div className="overflow-x-auto overflow-y-auto max-h-[560px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-gray-200 text-[#64748B] font-bold text-[11px] uppercase tracking-wider sticky top-0 z-10 shadow-xs">
              <tr>
                <th className="py-3 px-4">Документ</th>
                <th className="py-3 px-4">Тип операции</th>
                <th className="py-3 px-4">Кодов КМ</th>
                <th className="py-3 px-4">ЭЦП</th>
                <th className="py-3 px-4">Статус ИС МПТ</th>
                <th className="py-3 px-4">Дата</th>
                <th className="py-3 px-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && operations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-[#0082FB] border-t-transparent rounded-full animate-spin"></div>
                      <span>Загрузка истории операций...</span>
                    </div>
                  </td>
                </tr>
              ) : operations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <FileCheck2 className="w-8 h-8 text-gray-300" />
                      <p className="font-semibold text-gray-700">Операций пока нет</p>
                      <p className="text-[11px] text-gray-500">
                        Нажмите кнопку «Создать операцию», чтобы отправить отчет о нанесении, агрегацию или проверить коды.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                operations.map((op) => {
                  const badge = getOpBadge(op.type);
                  const Icon = badge.icon;
                  const isSuccess = op.status === 'COMPLETED' || op.status === 'SUCCESS';
                  const isProcessing = op.status === 'PROCESSING' || op.status === 'IN_PROCESS';

                  return (
                    <tr key={op.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                        {op.documentNumber || op.id.slice(0, 8)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${badge.color}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {badge.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-gray-800">
                        {op.codesCount || 0} шт.
                      </td>

                      <td className="py-3.5 px-4">
                        {op.isSigned ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0082FB] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            <KeyRound className="w-3 h-3" />
                            ГОСТ РК
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Принят
                          </span>
                        ) : isProcessing ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                            <Clock className="w-3 h-3 text-amber-600" />
                            В обработке
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Ошибка
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                        {new Date(op.createdAt).toLocaleString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(op)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#0082FB] hover:bg-blue-50 border border-blue-200 rounded-xl transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Квитанция</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operation Creation Modal */}
      <OperationModal
        operationType={modalOp}
        accounts={accounts}
        onClose={() => setModalOp(null)}
        onSuccess={() => {
          showToast('Операция успешно отправлена в ИС МПТ!', 'success');
          fetchData();
        }}
      />

      {/* Receipt Modal */}
      <OperationReceiptModal
        operation={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        onOperationUpdated={() => fetchData()}
      />

      {/* Top Up Balance Modal */}
      <TopUpBalanceModal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        currentBalance={userBalance}
        onSuccess={() => fetchData()}
      />
    </div>
  );
};
export default MarkirovkaPage;
