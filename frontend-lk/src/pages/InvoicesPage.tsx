import React, { useState, useEffect } from 'react';
import { PageHeader } from '@shared';
import { apiClient } from '../api/client';
import {
  Receipt,
  Download,
  Eye,
  Search,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Building,
  CreditCard,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  X,
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

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalInvoice, setActiveModalInvoice] = useState<InvoiceRecord | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/invoices');
      const list = res.data?.invoices || (Array.isArray(res.data) ? res.data : []);
      setInvoices(list);
    } catch (err) {
      console.error('Failed to fetch client invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
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

  // Filter calculations
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
      <PageHeader
        title="Счета на оплату"
        description="Официальные финансовые документы и реестр счетов по заказам маркировки TANBOX"
        action={
          <button
            onClick={fetchInvoices}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-[#111827] px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#0082FB] ${loading ? 'animate-spin' : ''}`} />
            <span>Обновить</span>
          </button>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#64748B] uppercase">Всего счетов</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0082FB] flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#111827]">{totalCount}</p>
          <p className="text-[11px] text-[#64748B] mt-1 font-medium">в реестре бухгалтерии</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#64748B] uppercase">К оплате</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600">
            {pendingTotal.toLocaleString('ru-RU')} ₸
          </p>
          <p className="text-[11px] text-[#64748B] mt-1 font-medium">ожидает подтверждения платежа</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#64748B] uppercase">Оплачено</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600">
            {paidTotal.toLocaleString('ru-RU')} ₸
          </p>
          <p className="text-[11px] text-[#64748B] mt-1 font-medium">успешно оплачено</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-100 rounded-3xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xs">
        {/* Status Dropdown Filter */}
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

        {/* Search Input */}
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
      </div>

      {/* Invoices List / Table */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs">
        {loading ? (
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
                        <button
                          type="button"
                          onClick={() => setActiveModalInvoice(inv)}
                          title="Просмотреть счет"
                          className="p-2 rounded-xl text-[#64748B] hover:text-[#0082FB] hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(inv)}
                          disabled={downloadingId === inv.id}
                          title="Скачать PDF счета"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0082FB] hover:bg-[#0070DA] text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
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

      {/* Invoice Detail Modal */}
      {activeModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0082FB] flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#111827]">
                    Счет {activeModalInvoice.invoiceNumber}
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    от {new Date(activeModalInvoice.date).toLocaleDateString('ru-RU')} г.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalInvoice(null)}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payer & Status info */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl text-xs">
              <div>
                <span className="text-[#64748B] font-medium block">Плательщик:</span>
                <span className="font-extrabold text-[#111827] block text-sm">
                  {activeModalInvoice.customerName}
                </span>
                <span className="text-[#64748B] font-mono">
                  БИН/ИИН: {activeModalInvoice.customerBinIin}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[#64748B] font-medium block">Статус:</span>
                <span className="inline-block mt-1 font-bold">
                  {activeModalInvoice.status === 'PAID' ? (
                    <span className="text-emerald-600">✓ Оплачен</span>
                  ) : activeModalInvoice.status === 'CANCELLED' ? (
                    <span className="text-gray-500">Аннулирован</span>
                  ) : (
                    <span className="text-amber-600">Ожидает оплаты</span>
                  )}
                </span>
                {activeModalInvoice.orderNumber && (
                  <div className="text-[11px] text-[#64748B] mt-1 font-mono">
                    Заказ: {activeModalInvoice.orderNumber}
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="text-xs font-extrabold text-[#111827] uppercase mb-2">
                Позиции счета
              </h4>
              <div className="border border-gray-100 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[#64748B] font-bold">
                    <tr>
                      <th className="py-2 px-3">Услуга / Товар</th>
                      <th className="py-2 px-3 text-center">Кол-во</th>
                      <th className="py-2 px-3 text-right">Цена</th>
                      <th className="py-2 px-3 text-right">Сумма</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {activeModalInvoice.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3">{it.name}</td>
                        <td className="py-2 px-3 text-center">
                          {it.quantity} {it.unit}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {Number(it.price).toLocaleString('ru-RU')} ₸
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-[#111827]">
                          {Number(it.totalPrice).toLocaleString('ru-RU')} ₸
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50/70 font-extrabold">
                      <td colSpan={3} className="py-2.5 px-3 text-right">
                        ИТОГО К ОПЛАТЕ:
                      </td>
                      <td className="py-2.5 px-3 text-right text-sm text-[#0082FB]">
                        {Number(activeModalInvoice.totalAmount).toLocaleString('ru-RU')} ₸
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bank details for payment */}
            <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[#0082FB] mb-1">
                <CreditCard className="w-4 h-4" />
                <span>Банковские реквизиты для безналичной оплаты (РК)</span>
              </div>
              <p className="text-gray-700">
                <strong>Получатель:</strong> ТОО "TANBOX MARKING SOLUTIONS" / ИП
              </p>
              <p className="text-gray-700">
                <strong>ИИК:</strong> KZ000000000000000000 (АО "Kaspi Bank" / АО "Народный Банк Казахстана")
              </p>
              <p className="text-gray-700">
                <strong>БИК:</strong> CASPKZKA, <strong>КБе:</strong> 17, <strong>Назначение платежа:</strong> Оплата по счету № {activeModalInvoice.invoiceNumber}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveModalInvoice(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Закрыть
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPdf(activeModalInvoice)}
                disabled={downloadingId === activeModalInvoice.id}
                className="inline-flex items-center gap-2 bg-[#0082FB] hover:bg-[#0070DA] text-white px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Скачать официальный PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
