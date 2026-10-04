import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { PageHeader } from '@shared';
import { getCategoryLabel } from '../data/categories';
import {
  Tag,
  Search,
  Download,
  Printer,
  ExternalLink,
  Copy,
  Check,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  FileSpreadsheet,
  PackagePlus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Hash,
  X,
} from 'lucide-react';

interface RegistryItem {
  id: string;
  orderId: string;
  index: number;
  code: string;
  gtin: string | null;
  serial: string | null;
  status: string;
  printedAt: string | null;
  createdAt: string;
  order?: {
    id: string;
    orderNumber: string;
    category: string;
    tariffType: string;
    status: string;
    printAllowed: boolean;
    itemsCount: number;
    stickerLayout?: any;
    createdAt: string;
  };
}

interface RegistryStats {
  totalCodes: number;
  printedCodes: number;
  newCodes: number;
  totalOrders: number;
}

interface OrderOption {
  id: string;
  orderNumber: string;
  category: string;
  itemsCount: number;
}

export const LabelsRegistryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters & State
  const [items, setItems] = useState<RegistryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<RegistryStats>({
    totalCodes: 0,
    printedCodes: 0,
    newCodes: 0,
    totalOrders: 0,
  });
  const [availableOrders, setAvailableOrders] = useState<OrderOption[]>([]);

  // Search & Filters
  const [search, setSearch] = useState<string>(searchParams.get('q') || '');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(searchParams.get('order') || '');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'ALL');
  const [page, setPage] = useState<number>(parseInt(searchParams.get('page') || '1', 10));
  const [pageSize, setPageSize] = useState<number>(50);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Interactive UI
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);

  // Load Data
  const loadRegistry = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        limit: pageSize,
      };
      if (search.trim()) params.search = search.trim();
      if (selectedOrderId) params.orderId = selectedOrderId;
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;

      const res = await apiClient.get('/orders/registry/codes', { params });
      setItems(res.data.items || []);
      setTotalCount(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
      if (res.data.stats) setStats(res.data.stats);
      if (res.data.availableOrders) setAvailableOrders(res.data.availableOrders);
    } catch (err) {
      console.error('Failed to load labels registry:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, selectedOrderId, statusFilter]);

  useEffect(() => {
    loadRegistry();
  }, [loadRegistry]);

  // Sync state to URL params
  useEffect(() => {
    const p: Record<string, string> = {};
    if (search) p.q = search;
    if (selectedOrderId) p.order = selectedOrderId;
    if (statusFilter !== 'ALL') p.status = statusFilter;
    if (page > 1) p.page = String(page);
    setSearchParams(p, { replace: true });
  }, [search, selectedOrderId, statusFilter, page, setSearchParams]);

  // Handle Copy Code
  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle Print Single Sticker
  const handlePrintSticker = async (item: RegistryItem) => {
    if (!item.orderId) return;
    setPrintingId(item.id);
    try {
      const res = await apiClient.get(`/orders/${item.orderId}/items/${item.index}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Mark as printed locally
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, status: 'PRINTED' } : it))
      );
    } catch (err: any) {
      console.error('Print single sticker error:', err);
      let msg = 'Не удалось сформировать стикер для печати.';
      if (err.response?.data?.message) msg = err.response.data.message;
      alert(msg);
    } finally {
      setPrintingId(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Реестр этикеток"
        description="Сквозной каталог Data Matrix кодов маркировки и стикеров по всем вашим заказам"
        action={
          <div className="flex items-center gap-2.5">
            <Link
              to="/orders/new"
              className="inline-flex items-center gap-1.5 h-10 bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-xs px-5 rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer active:scale-95"
            >
              <PackagePlus className="w-4 h-4" />
              Создать заказ
            </Link>
          </div>
        }
      />

      {/* Filter and Control Bar */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
              <Search className="w-4 h-4 text-[#94A3B8]" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Поиск по коду Data Matrix, номеру заказа (#TB-...), GTIN или серийному номеру..."
              className="w-full text-xs font-medium bg-gray-50/70 border border-gray-200/90 rounded-xl pl-10 pr-9 py-2.5 text-[#111827] placeholder:text-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#0082FB] transition-all"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#94A3B8] hover:text-[#111827]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Order Selector */}
          <div className="w-full md:w-64">
            <select
              value={selectedOrderId}
              onChange={(e) => {
                setSelectedOrderId(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs font-bold bg-white border border-gray-200/90 rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:border-[#0082FB] cursor-pointer"
            >
              <option value="">Все заказы ({availableOrders.length})</option>
              {availableOrders.map((ord) => (
                <option key={ord.id} value={ord.id}>
                  {ord.orderNumber} ({ord.itemsCount.toLocaleString('ru-RU')} шт.)
                </option>
              ))}
            </select>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl shrink-0">
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setPage(1);
              }}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#64748B] hover:text-[#111827]'
              }`}
            >
              Все ({stats.totalCodes})
            </button>
            <button
              onClick={() => {
                setStatusFilter('NEW');
                setPage(1);
              }}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'NEW'
                  ? 'bg-white text-[#0082FB] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0082FB]'
              }`}
            >
              Новые
            </button>
            <button
              onClick={() => {
                setStatusFilter('PRINTED');
                setPage(1);
              }}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'PRINTED'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-[#64748B] hover:text-emerald-700'
              }`}
            >
              Распечатанные
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-6 h-6 text-[#0082FB] animate-spin" />
            <p className="text-xs font-bold text-[#64748B]">Загрузка реестра этикеток...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-[#64748B] flex items-center justify-center mx-auto">
              <Tag className="w-6 h-6 text-[#94A3B8]" />
            </div>
            <h3 className="text-sm font-extrabold text-[#111827]">Этикетки не найдены</h3>
            <p className="text-xs text-[#64748B] max-w-md mx-auto leading-relaxed">
              {search || selectedOrderId || statusFilter !== 'ALL'
                ? 'По вашим критериям поиска и фильтрам ничего не найдено. Попробуйте сбросить фильтры.'
                : 'В вашем личном кабинете ещё нет кодов маркировки. Создайте первый заказ для генерации этикеток!'}
            </p>
            {(search || selectedOrderId || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedOrderId('');
                  setStatusFilter('ALL');
                  setPage(1);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0082FB] hover:underline cursor-pointer pt-2"
              >
                Сбросить фильтры
              </button>
            )}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/75 border-b border-gray-200/80 text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-16">№</th>
                  <th className="py-3 px-4">Заказ</th>
                  <th className="py-3 px-4">Код маркировки (Data Matrix)</th>
                  <th className="py-3 px-4">GTIN / Серия</th>
                  <th className="py-3 px-4">Статус</th>
                  <th className="py-3 px-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {items.map((item) => {
                  const isCopied = copiedId === item.id;
                  const isPrinting = printingId === item.id;
                  const categoryName = item.order ? getCategoryLabel(item.order.category as any) : '';

                  return (
                    <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                      {/* Index in Batch */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#64748B]">
                        #{item.index}
                      </td>

                      {/* Order info */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.order ? (
                          <Link
                            to={`/orders/${item.order.id}`}
                            className="group flex flex-col"
                          >
                            <span className="font-extrabold text-[#0082FB] group-hover:underline">
                              {item.order.orderNumber}
                            </span>
                            <span className="text-[10px] text-[#64748B]">
                              {categoryName}
                            </span>
                          </Link>
                        ) : (
                          <span className="text-[#64748B]">—</span>
                        )}
                      </td>

                      {/* Data Matrix Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 max-w-md">
                          <code className="bg-gray-50 border border-gray-200/80 px-2 py-1 rounded-md text-[11px] font-mono text-[#111827] truncate select-all block">
                            {item.code}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(item.id, item.code)}
                            className="p-1 text-[#64748B] hover:text-[#0082FB] transition-colors shrink-0 cursor-pointer"
                            title="Скопировать Data Matrix код"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* GTIN / Serial */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col text-[11px]">
                          <span className="font-mono text-[#111827]">
                            {item.gtin ? `GTIN: ${item.gtin}` : '—'}
                          </span>
                          <span className="text-[10px] text-[#64748B] font-mono">
                            {item.serial ? `SN: ${item.serial}` : ''}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.status === 'PRINTED' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Распечатан
                          </span>
                        ) : item.status === 'REPRINTED' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                            Перепечатан
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#64748B] bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                            Новый
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => handlePrintSticker(item)}
                            disabled={isPrinting}
                            className="inline-flex items-center gap-1 h-8 bg-white hover:bg-slate-50 text-[#111827] border border-gray-200 font-bold text-xs px-2.5 rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50"
                            title="Сгенерировать и напечатать 1 наклейку"
                          >
                            <Printer className="w-3 h-3 text-[#0082FB]" />
                            {isPrinting ? 'Печать...' : 'Печать'}
                          </button>

                          {item.order && (
                            <Link
                              to={`/orders/${item.order.id}`}
                              className="inline-flex items-center gap-1 h-8 bg-gray-50 hover:bg-gray-100 text-[#475569] border border-gray-200 font-bold text-xs px-2.5 rounded-lg transition-all cursor-pointer"
                              title="Перейти к заказу"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="border-t border-gray-100 p-4 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-[#64748B]">
              Показано <strong>{(page - 1) * pageSize + 1}</strong> —{' '}
              <strong>{Math.min(page * pageSize, totalCount)}</strong> из{' '}
              <strong>{totalCount.toLocaleString('ru-RU')}</strong> кодов
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-xl font-bold text-xs disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Назад
              </button>

              <span className="font-bold text-[#111827] px-2">
                {page} / {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-xl font-bold text-xs disabled:opacity-40 cursor-pointer"
              >
                Вперёд <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
