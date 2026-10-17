import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { PaymentChoiceModal } from '../components/modals/PaymentChoiceModal';
import { TopUpBalanceModal } from '../components/modals/TopUpBalanceModal';
import {
  Receipt,
  Download,
  Printer,
  Search,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  RefreshCw,
  CreditCard,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';

interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  totalPrice: number;
}

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  orderId?: string;
  orderNumber?: string;
  customerName: string;
  customerBinIin: string;
  customerAddress: string;
  customerPhone?: string;
  totalAmount: number;
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'CANCELLED';
  notes?: string;
  items: InvoiceItem[];
  createdAt: string;
}

interface BalanceHistoryItem {
  id: string;
  paymentNumber: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  createdAt: string;
  direction: 'IN' | 'OUT';
  category: string;
  order?: {
    id: string;
    orderNumber: string;
    totalPrice: number;
    status: string;
  } | null;
  metadata?: any;
}

export const InvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');

  // Invoices state
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<InvoiceRecord | null>(null);

  // Balance state
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (tabFromUrl === 'balance' || tabFromUrl === 'history') {
      navigate('/payments', { replace: true });
    }
  }, [tabFromUrl, navigate]);

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const res = await apiClient.get('/invoices');
      const list = res.data?.invoices || (Array.isArray(res.data) ? res.data : []);
      setInvoices(list);
    } catch (err) {
      console.error('Failed to fetch client invoices:', err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const res = await apiClient.get('/payments/balance').catch(() => ({ data: { balance: 0 } }));
      setCurrentBalance(Number(res.data?.balance || 0));
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchBalance();

    const handleBalanceUpdate = () => {
      fetchBalance();
    };
    window.addEventListener('tanbox:balance-updated', handleBalanceUpdate);
    return () => window.removeEventListener('tanbox:balance-updated', handleBalanceUpdate);
  }, []);

  const handleDownloadPdf = async (inv: InvoiceRecord) => {
    setDownloadingId(inv.id);
    try {
      const res = await apiClient.get(`/invoices/${inv.id}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${inv.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download invoice PDF:', err);
      alert('Не удалось скачать PDF счета');
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrintPdf = async (inv: InvoiceRecord) => {
    setPrintingId(inv.id);
    try {
      const res = await apiClient.get(`/invoices/${inv.id}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = blobUrl;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (e) {
            console.error('Print iframe error:', e);
            window.open(blobUrl, '_blank');
          }
        }, 200);
      };
    } catch (err) {
      console.error('Failed to print invoice PDF:', err);
      alert('Не удалось распечатать счет');
    } finally {
      setPrintingId(null);
    }
  };

  // Filter calculations for invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchStatus = selectedStatus === 'ALL' || inv.status === selectedStatus;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      (inv.orderNumber && inv.orderNumber.toLowerCase().includes(q)) ||
      inv.customerName.toLowerCase().includes(q) ||
      inv.items.some((it) => it.name.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  const totalCount = invoices.length;
  const pendingTotal = invoices
    .filter((i) => i.status === 'PENDING')
    .reduce((acc, i) => acc + Number(i.totalAmount || 0), 0);
  const paidTotal = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((acc, i) => acc + Number(i.totalAmount || 0), 0);

  return (
    <div className="space-y-6">

      {/* Invoices Content */}
      <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">
                Всего счетов
              </div>
              <div className="text-2xl font-black text-[#111827] font-mono">
                {totalCount}
              </div>
            </div>

            <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">
                К оплате
              </div>
              <div className="text-2xl font-black text-[#111827] font-mono">
                {pendingTotal.toLocaleString('ru-RU')} ₸
              </div>
            </div>

            <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">
                Оплачено
              </div>
              <div className="text-2xl font-black text-[#111827] font-mono">
                {paidTotal.toLocaleString('ru-RU')} ₸
              </div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xs">
            <div className="relative w-full md:w-64">
              <div className="absolute left-3.5 top-3 pointer-events-none text-[#64748B] flex items-center gap-1.5 text-xs font-bold">
                <Filter className="w-3.5 h-3.5 text-[#0082FB]" />
                <span className="text-[#64748B]">Статус:</span>
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-[#F4F6F9] border border-gray-200/80 rounded-xl pl-20 pr-8 py-2.5 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0082FB] appearance-none cursor-pointer"
              >
                <option value="ALL">Все счета</option>
                <option value="PENDING">Ожидают оплаты</option>
                <option value="PAID">Оплаченные</option>
                <option value="CANCELLED">Аннулированные</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-3 top-3 pointer-events-none" />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Поиск по номеру счета или заказу..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#F4F6F9] border border-gray-200/80 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0082FB] placeholder:text-gray-400"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  fetchInvoices();
                  fetchBalance();
                }}
                disabled={loadingInvoices}
                className="p-2.5 bg-[#F4F6F9] hover:bg-gray-200/70 border border-gray-200/80 text-[#111827] rounded-xl transition-all cursor-pointer shrink-0 active:scale-95"
                title="Обновить список счетов"
              >
                <RefreshCw
                  className={`w-4 h-4 text-[#0082FB] ${
                    loadingInvoices ? 'animate-spin' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Invoices List / Table */}
          <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs">
            {loadingInvoices ? (
              <div className="p-12 text-center text-sm font-semibold text-[#64748B] flex flex-col items-center justify-center gap-3">
                <div className="w-6 h-6 border-2 border-[#0082FB] border-t-transparent rounded-full animate-spin"></div>
                <span>Загрузка счетов...</span>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="p-12 text-center">
                <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-base font-bold text-[#111827]">Счета не найдены</p>
                <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                  {searchQuery || selectedStatus !== 'ALL'
                    ? 'Нет счетов, соответствующих заданным критериям поиска.'
                    : 'Бухгалтерия формирует счета при оформлении заказов или выставлении счетов на услуги.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                      <th className="py-3.5 px-6">Счет / Дата</th>
                      <th className="py-3.5 px-4">Связанный заказ</th>
                      <th className="py-3.5 px-4">Состав услуг</th>
                      <th className="py-3.5 px-4 text-right">Сумма</th>
                      <th className="py-3.5 px-4 text-center">Статус</th>
                      <th className="py-3.5 px-6 text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-medium text-[#111827]">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-extrabold text-[#111827] text-sm flex items-center gap-1.5">
                            <Receipt className="w-4 h-4 text-[#0082FB]" />
                            <span>{inv.invoiceNumber}</span>
                          </div>
                          <div className="text-[11px] text-[#64748B] mt-0.5">
                            от {new Date(inv.date).toLocaleDateString('ru-RU')}
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          {inv.orderNumber ? (
                            <span className="font-mono text-xs font-bold text-[#0082FB] bg-blue-50 px-2.5 py-1 rounded-lg inline-block">
                              {inv.orderNumber}
                            </span>
                          ) : (
                            <span className="text-[#94A3B8]">—</span>
                          )}
                        </td>

                        <td className="py-4 px-4 max-w-xs truncate">
                          {inv.items && inv.items.length > 0 ? (
                            <span title={inv.items.map((i) => `${i.name} (${i.quantity} ${i.unit})`).join('; ')}>
                              {inv.items[0].name}
                              {inv.items.length > 1 && (
                                <span className="text-[#64748B] font-normal ml-1">
                                  (+{inv.items.length - 1})
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-[#64748B]">Услуги маркировки</span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-right font-black text-sm text-[#111827]">
                          {Number(inv.totalAmount || 0).toLocaleString('ru-RU')} ₸
                        </td>

                        <td className="py-4 px-4 text-center">
                          {inv.status === 'PAID' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              Оплачен
                            </span>
                          ) : inv.status === 'CANCELLED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-gray-100 text-gray-600">
                              <XCircle className="w-3 h-3 text-gray-500" />
                              Аннулирован
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Ожидает оплаты
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                              <button
                                type="button"
                                onClick={() => setSelectedInvoiceForPayment(inv)}
                                title="Оплатить счет (с баланса или онлайн)"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Оплатить</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDownloadPdf(inv)}
                              disabled={downloadingId === inv.id || printingId === inv.id}
                              title="Скачать PDF счета"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0082FB] hover:bg-[#0070DA] text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Скачать PDF</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrintPdf(inv)}
                              disabled={downloadingId === inv.id || printingId === inv.id}
                              title="Распечатать счет"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#111827] rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                            >
                              <Printer className="w-3.5 h-3.5 text-[#64748B]" />
                              <span>Распечатать</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      {/* Payment Choice Modal (Balance vs Card) */}
      {selectedInvoiceForPayment && (
        <PaymentChoiceModal
          isOpen={!!selectedInvoiceForPayment}
          onClose={() => setSelectedInvoiceForPayment(null)}
          title="Оплата счета"
          itemTitle={`Счет ${selectedInvoiceForPayment.invoiceNumber}`}
          itemSubtitle={
            selectedInvoiceForPayment.orderNumber
              ? `Связанный заказ: ${selectedInvoiceForPayment.orderNumber}`
              : 'Оплата услуг маркировки TANBOX'
          }
          amount={Number(selectedInvoiceForPayment.totalAmount)}
          onPayBalance={async () => {
            await apiClient.post(`/invoices/${selectedInvoiceForPayment.id}/pay-balance`);
          }}
          onPayCard={async () => {
            const res = await apiClient.post('/payments/init', {
              type: 'INVOICE',
              invoiceId: selectedInvoiceForPayment.id,
              amount: selectedInvoiceForPayment.totalAmount,
            });
            if (res.data?.redirectUrl) {
              window.location.href = res.data.redirectUrl;
            } else {
              throw new Error(res.data?.message || 'Не удалось получить ссылку на оплату');
            }
          }}
          onPaymentSuccess={() => {
            fetchInvoices();
            fetchBalance();
          }}
        />
      )}

      {/* Top Up Balance Modal */}
      <TopUpBalanceModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
        currentBalance={currentBalance}
        onSuccess={() => {
          fetchBalance();
        }}
      />
    </div>
  );
};

export default InvoicesPage;
