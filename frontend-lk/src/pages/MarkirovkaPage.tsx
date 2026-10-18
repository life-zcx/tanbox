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
import { NCALayerBadge } from '../components/markirovka/NCALayerBadge';
import {
  MarkirovkaOperationsButton,
  MarkirovkaOpChoice,
} from '../components/markirovka/MarkirovkaOperationsButton';
import { OperationModal } from '../components/markirovka/OperationModal';
import { OperationReceiptModal } from '../components/markirovka/OperationReceiptModal';
import { PartyAndCatalogModal } from '../components/markirovka/PartyAndCatalogModal';
import { ConnectMarkirovkaModal } from '../components/modals/ConnectMarkirovkaModal';
import { TopUpBalanceModal } from '../components/modals/TopUpBalanceModal';
import { ProductCardsSection } from '../components/markirovka/ProductCardsSection';

export const MarkirovkaPage: React.FC = () => {
  const [mainTab, setMainTab] = useState<'CARDS' | 'OPERATIONS'>('CARDS');
  const [operations, setOperations] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTabFilter, setActiveTabFilter] = useState<string>('ALL');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');

  // Modals state
  const [modalOp, setModalOp] = useState<MarkirovkaOpChoice | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [showToolsModal, setShowToolsModal] = useState<boolean>(false);
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);
  const [accountToEdit, setAccountToEdit] = useState<any | null>(null);
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

      {/* Main Mode Navigation (Cards vs Operations) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-2 shadow-2xs flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMainTab('CARDS')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            mainTab === 'CARDS'
              ? 'bg-[#0082FB] text-white shadow-md shadow-blue-500/10'
              : 'bg-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Карточки товаров (НКТ / Каталог)</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab('OPERATIONS')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            mainTab === 'OPERATIONS'
              ? 'bg-[#0082FB] text-white shadow-md shadow-blue-500/10'
              : 'bg-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Операции и документооборот (СУЗ / True API)</span>
        </button>
      </div>

      {mainTab === 'CARDS' ? (
        <ProductCardsSection />
      ) : (
        <>
          {/* Connected Accounts Section */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-2xs space-y-4">
        {/* Unified Card Header with Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#0082FB]" />
            <h2 className="text-sm font-bold text-gray-900">Подключенные станции СУЗ / ИС МПТ</h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            <NCALayerBadge />

            <button
              type="button"
              onClick={() => setShowToolsModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
            >
              <Search className="w-3.5 h-3.5 text-gray-500" />
              <span>Реестры (БИН / GTIN)</span>
            </button>

            <button
              type="button"
              onClick={() => fetchData()}
              disabled={loading}
              className="p-1.5 text-gray-500 hover:text-[#0082FB] hover:bg-blue-50 border border-gray-200 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Обновить данные"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0082FB]' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => {
                setAccountToEdit(null);
                setShowConnectModal(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#0082FB] hover:bg-blue-50 border border-blue-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Подключить станцию</span>
            </button>

            <MarkirovkaOperationsButton
              onSelectOperation={(op) => setModalOp(op)}
              disabled={loading}
            />
          </div>
        </div>

        {accounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-1">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-3.5 rounded-xl border border-gray-200 hover:border-[#0082FB]/50 transition-all bg-gray-50/50 flex flex-col justify-between space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">{acc.name}</h3>
                    <p className="text-[11px] font-mono text-gray-500">Логин / БИН: {acc.login}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      acc.environment === 'PROD'
                        ? 'bg-blue-50 text-[#0082FB] border border-blue-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {acc.environment === 'PROD' ? 'ПРОМ' : 'ТЕСТ'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 text-[11px]">
                  <span
                    className={`inline-flex items-center gap-1 font-semibold ${
                      acc.status === 'ACTIVE'
                        ? 'text-emerald-700'
                        : acc.status === 'AUTH_ERROR'
                        ? 'text-rose-700'
                        : 'text-gray-500'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        acc.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    {acc.status === 'ACTIVE' ? 'Активен' : 'Требует проверки'}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setAccountToEdit(acc);
                      setShowConnectModal(true);
                    }}
                    className="flex items-center gap-1 text-[#0082FB] hover:underline font-medium cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    Настроить
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <p className="font-bold text-gray-900">У вас еще не подключена станция СУЗ / ИС МПТ</p>
              <p className="text-gray-600 text-[11px]">
                Подключите станцию, чтобы напрямую отправлять отчеты о нанесении и агрегации кодов маркировки.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAccountToEdit(null);
                setShowConnectModal(true);
              }}
              className="px-4 py-2 bg-[#0082FB] hover:bg-[#0072de] text-white font-bold rounded-xl shrink-0 transition-colors cursor-pointer"
            >
              + Подключить ИС МПТ
            </button>
          </div>
        )}
      </div>

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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-gray-200 text-[#64748B] font-bold text-[11px] uppercase tracking-wider">
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

      {/* Tools Modal (Party & GTIN lookup) */}
      {showToolsModal && <PartyAndCatalogModal onClose={() => setShowToolsModal(false)} />}

      {/* Connect Account Modal */}
      <ConnectMarkirovkaModal
        isOpen={showConnectModal}
        initialAccount={accountToEdit}
        onClose={() => setShowConnectModal(false)}
        onSuccess={() => {
          showToast('Аккаунт ИС МПТ сохранен!', 'success');
          fetchData();
        }}
      />

      {/* Top Up Balance Modal */}
      <TopUpBalanceModal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        currentBalance={userBalance}
        onSuccess={() => fetchData()}
      />
        </>
      )}
    </div>
  );
};
export default MarkirovkaPage;
