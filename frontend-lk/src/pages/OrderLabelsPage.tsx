import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { OrderItem } from '../types';
import {
  ArrowLeft,
  Printer,
  Download,
  Search,
  Layers,
  RefreshCw,
  Copy,
  Check,
  Grid,
  List,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Lock,
  Hash,
  Eye,
  Tag,
  FileText,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import RollSplitModal from '../components/modals/RollSplitModal';

interface CodeItem {
  id: string;
  orderId: string;
  index: number;
  code: string;
  gtin: string | null;
  serial: string | null;
  status: string;
  printedAt: string | null;
  createdAt: string;
}

export const OrderLabelsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderItem | null>(null);
  const [loadingOrder, setLoadingOrder] = useState<boolean>(true);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Items State
  const [items, setItems] = useState<CodeItem[]>([]);
  const [loadingItems, setLoadingItems] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(24);

  // View Mode: grid of realistic stickers vs tabular list
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Reprint Inputs
  const [singleNum, setSingleNum] = useState<string>('');
  const [rangeFrom, setRangeFrom] = useState<string>('');
  const [rangeTo, setRangeTo] = useState<string>('');
  const [downloadingSingle, setDownloadingSingle] = useState<number | null>(null);
  const [downloadingRange, setDownloadingRange] = useState<boolean>(false);
  const [downloadingBatch, setDownloadingBatch] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Roll Split Modal
  const [showRollModal, setShowRollModal] = useState<boolean>(false);

  // Fetch Order Details
  useEffect(() => {
    if (!id) return;
    setLoadingOrder(true);
    apiClient
      .get(`/orders/${id}`)
      .then((res) => {
        setOrder(res.data);
      })
      .catch((err) => {
        console.error('Fetch order error:', err);
        setOrderError(err.response?.data?.message || 'Не удалось загрузить данные заказа.');
      })
      .finally(() => {
        setLoadingOrder(false);
      });
  }, [id]);

  // Fetch Paginated Code Items
  const fetchItems = () => {
    if (!id) return;
    setLoadingItems(true);
    apiClient
      .get(`/orders/${id}/items`, {
        params: {
          page,
          limit: pageSize,
          search: search.trim() || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        },
      })
      .then((res) => {
        setItems(res.data.items || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.total || 0);
      })
      .catch((err) => {
        console.error('Fetch items error:', err);
      })
      .finally(() => {
        setLoadingItems(false);
      });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems();
    }, 250);
    return () => clearTimeout(timer);
  }, [id, page, pageSize, search, statusFilter]);

  // Handlers
  const handleCopy = (text: string, itemId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(itemId);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleDownloadSingle = async (num: number) => {
    if (!id || isNaN(num) || num < 1) return;
    setDownloadingSingle(num);
    setActionMessage(null);
    try {
      const res = await apiClient.get(`/orders/${id}/items/${num}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `Label_№${num}_${order?.orderNumber || 'TB'}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setActionMessage({ type: 'success', text: `Этикетка №${num} успешно сформирована и скачана.` });
      // Update local item status
      setItems((prev) =>
        prev.map((it) => (it.index === num ? { ...it, status: 'REPRINTED' } : it))
      );
    } catch (err: any) {
      console.error('Download single error:', err);
      setActionMessage({ type: 'error', text: `Ошибка формирования этикетки №${num}` });
    } finally {
      setDownloadingSingle(null);
    }
  };

  const handleDownloadRange = async () => {
    const from = parseInt(rangeFrom, 10);
    const to = parseInt(rangeTo, 10);
    if (!id || isNaN(from) || isNaN(to) || from < 1 || to < from) {
      setActionMessage({ type: 'error', text: 'Укажите корректный диапазон этикеток (например: с 400 по 405)' });
      return;
    }
    if (to - from > 1000) {
      setActionMessage({ type: 'error', text: 'Диапазон не должен превышать 1000 этикеток за раз' });
      return;
    }

    setDownloadingRange(true);
    setActionMessage(null);
    try {
      const res = await apiClient.get(`/orders/${id}/items-range/pdf?from=${from}&to=${to}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `Labels_(${from}-${to})_${order?.orderNumber || 'TB'}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setActionMessage({ type: 'success', text: `Партия с №${from} по №${to} успешно скачана.` });
      setItems((prev) =>
        prev.map((it) => (it.index >= from && it.index <= to ? { ...it, status: 'REPRINTED' } : it))
      );
    } catch (err: any) {
      console.error('Download range error:', err);
      setActionMessage({ type: 'error', text: `Ошибка скачивания диапазона с ${from} по ${to}` });
    } finally {
      setDownloadingRange(false);
    }
  };

  const handleDownloadFullBatch = async () => {
    if (!id || !canPrintBatch) return;
    setDownloadingBatch(true);
    setActionMessage(null);
    try {
      const res = await apiClient.get(`/orders/${id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `Labels_${order?.orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      console.error('Download batch error:', err);
      setActionMessage({ type: 'error', text: 'Ошибка скачивания файла тиража.' });
    } finally {
      setDownloadingBatch(false);
    }
  };

  if (loadingOrder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-8 h-8 border-3 border-[#0082FB] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-gray-500 font-bold">Загрузка данных этикеток партии...</span>
      </div>
    );
  }

  if (orderError || !order) {
    return (
      <div className="max-w-xl mx-auto mt-16 p-8 bg-white border border-gray-200 rounded-3xl text-center space-y-4 shadow-sm">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-base font-extrabold text-gray-900">Заказ не найден</h2>
        <p className="text-xs text-gray-500">{orderError || 'Не удалось открыть страницу этикеток.'}</p>
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-black transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Вернуться к заказам
        </Link>
      </div>
    );
  }

  const isApprovedByClient = order.stickerApprovalStatus === 'APPROVED';
  const canPrintBatch =
    (order as any).printAllowed === true ||
    (order as any).paymentStatus === 'PAID' ||
    isApprovedByClient;
  const stickerLayout = order.stickerLayout as any;
  const labelWidth = stickerLayout?.widthMm || 58;
  const labelHeight = stickerLayout?.heightMm || 40;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 animate-in fade-in duration-150">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            to={`/orders/${order.id}`}
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к заказу {order.orderNumber}
          </Link>
          <div className="flex items-center gap-3 pt-1">
            <h1 className="text-2xl font-black text-[#111827] tracking-tight">
              Все этикетки партии
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-50 text-[#0082FB] border border-blue-200">
              {order.itemsCount.toLocaleString()} шт.
            </span>
          </div>
          <p className="text-xs text-[#64748B]">
            Поштучная нумерация, предварительный просмотр каждого стикера и моментальная печать брака на производстве.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowRollModal(true)}
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-[#111827] border border-gray-200 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Layers className="w-4 h-4 text-[#0082FB]" />
            Скачать по рулонам
          </button>

          <button
            type="button"
            onClick={handleDownloadFullBatch}
            disabled={downloadingBatch || !canPrintBatch}
            className="inline-flex items-center gap-2 bg-[#0082FB] hover:bg-[#0070DA] text-white px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${downloadingBatch ? 'animate-bounce' : ''}`} />
            {downloadingBatch ? 'Формирование PDF...' : 'Скачать все этикетки (PDF)'}
          </button>
        </div>
      </div>

      {/* Action Notification Message */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold border transition-all ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-gray-400 hover:text-black cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
            Всего в заказе
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#111827]">
            {order.itemsCount.toLocaleString()} <span className="text-xs font-semibold text-gray-400">этикеток</span>
          </div>
          <span className="text-[10px] text-gray-400 font-mono">
            Номера: #1 — #{order.itemsCount}
          </span>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
            Размер наклейки
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#111827]">
            {labelWidth} × {labelHeight} <span className="text-xs font-semibold text-gray-400">мм</span>
          </div>
          <span className="text-[10px] text-gray-400">
            Термотрансфер / ТОП
          </span>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
            Терморулоны
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#0082FB]">
            {Math.ceil(order.itemsCount / 500)} <span className="text-xs font-semibold text-gray-400">рулонов</span>
          </div>
          <span className="text-[10px] text-gray-400">
            Стандартно по 500 шт.
          </span>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
            Сквозная нумерация
          </span>
          <div className="flex items-center gap-1.5 text-xl sm:text-2xl font-black text-emerald-600">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Включена</span>
          </div>
          <span className="text-[10px] text-gray-400">
            Печатается в углу стикера (№ 1..{order.itemsCount})
          </span>
        </div>
      </div>

      {/* Quick Action Panels: Single Label Reprint & Range Reprint */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card 1: Reprint 1 Specific Label */}
        <div className="bg-gradient-to-br from-blue-50/70 via-white to-sky-50/40 border border-blue-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0082FB] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#111827]">
                Моментальная печать одной этикетки
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Зажевало ленту или поврежден стикер? Введите номер для быстрой перепечатки.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                №
              </span>
              <input
                type="number"
                min="1"
                max={order.itemsCount}
                value={singleNum}
                onChange={(e) => setSingleNum(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && singleNum) handleDownloadSingle(parseInt(singleNum, 10));
                }}
                placeholder="Например: 402"
                className="w-full bg-white border border-gray-300 rounded-xl pl-8 pr-3.5 py-2 text-xs text-[#111827] font-bold focus:outline-none focus:border-[#0082FB] shadow-2xs"
              />
            </div>
            <button
              type="button"
              onClick={() => handleDownloadSingle(parseInt(singleNum, 10))}
              disabled={!singleNum || downloadingSingle !== null}
              className="px-5 py-2 bg-[#0082FB] hover:bg-[#0070DA] text-white rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-2 shrink-0"
            >
              <Printer className="w-4 h-4" />
              {downloadingSingle === parseInt(singleNum, 10) ? 'Печать...' : 'Печать 1 шт.'}
            </button>
          </div>
          <span className="text-[11px] text-gray-400 block">
            Генерирует PDF ровно на 1 наклейку с номером #{singleNum || '402'} и его оригинальным кодом DataMatrix.
          </span>
        </div>

        {/* Card 2: Reprint Range */}
        <div className="bg-white border border-gray-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#111827]">
                Перепечатка диапазона этикеток
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Печать пачки на замену при браке партии на производственной линии.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                С
              </span>
              <input
                type="number"
                min="1"
                max={order.itemsCount}
                value={rangeFrom}
                onChange={(e) => setRangeFrom(e.target.value)}
                placeholder="400"
                className="w-full bg-white border border-gray-300 rounded-xl pl-7 pr-3 py-2 text-xs text-[#111827] font-bold focus:outline-none focus:border-[#0082FB] shadow-2xs"
              />
            </div>
            <span className="text-xs font-bold text-gray-400">—</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                По
              </span>
              <input
                type="number"
                min="1"
                max={order.itemsCount}
                value={rangeTo}
                onChange={(e) => setRangeTo(e.target.value)}
                placeholder="405"
                className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-3 py-2 text-xs text-[#111827] font-bold focus:outline-none focus:border-[#0082FB] shadow-2xs"
              />
            </div>
            <button
              type="button"
              onClick={handleDownloadRange}
              disabled={!rangeFrom || !rangeTo || downloadingRange}
              className="px-5 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-2 shrink-0"
            >
              <Download className="w-4 h-4" />
              {downloadingRange ? '...' : 'Скачать'}
            </button>
          </div>
          <span className="text-[11px] text-gray-400 block">
            Формирует компактный файл с номерами этикеток от {rangeFrom || '400'} до {rangeTo || '405'}.
          </span>
        </div>
      </div>

      {/* Interactive Controls Bar: Search, Status Filter & View Toggle */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 flex items-center gap-3">
          {/* Live Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Поиск по номеру (#402), GTIN или серийному номеру..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-[#0082FB] focus:bg-white transition-all font-medium"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shrink-0 text-xs">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ALL');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Все
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('NEW');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'NEW'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              В партии
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('REPRINTED');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'REPRINTED'
                  ? 'bg-white text-amber-800 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Перепечатанные
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
          <span className="text-xs font-bold text-gray-500">
            Найдено: <strong className="text-gray-900">{totalCount.toLocaleString()}</strong>
          </span>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#0082FB] shadow-2xs'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
              title="Плитка этикеток"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#0082FB] shadow-2xs'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
              title="Таблица кодов"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Grid View or Table View */}
      {loadingItems ? (
        <div className="bg-white border border-gray-200/80 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-3 shadow-xs">
          <div className="w-7 h-7 border-2 border-[#0082FB] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-500 font-bold">Загрузка этикеток...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-gray-200/80 rounded-3xl p-12 text-center space-y-3 shadow-xs">
          <AlertCircle className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-sm font-extrabold text-gray-800">Этикетки не найдены</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            По вашему поисковому запросу ничего не найдено. Проверьте правильность номера или кода.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatusFilter('ALL');
              setPage(1);
            }}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Сбросить фильтры
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW: Realistic Sticker Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((it) => (
            <div
              key={it.id}
              className="bg-white border border-gray-200 hover:border-blue-300 rounded-3xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-7 h-7 rounded-xl bg-gray-900 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                    #{it.index}
                  </span>
                  <span className="text-[11px] font-bold text-gray-400 font-mono">
                    из {order.itemsCount}
                  </span>
                </div>

                {it.status === 'REPRINTED' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                    Перепечатан
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                    В партии
                  </span>
                )}
              </div>

              {/* Realistic Sticker Mockup Box */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 relative flex flex-col justify-between min-h-[110px] shadow-2xs">
                {/* Simulated Content */}
                <div className="flex items-start gap-2.5">
                  <div className="w-12 h-12 bg-white border border-slate-300 rounded-lg p-1 flex items-center justify-center shrink-0 shadow-2xs">
                    {/* DataMatrix visual glyph */}
                    <div className="w-full h-full bg-slate-900 rounded-[2px] flex items-center justify-center">
                      <span className="text-[7px] text-white font-mono font-bold">DM</span>
                    </div>
                  </div>

                  <div className="space-y-0.5 flex-1 min-w-0">
                    <span className="text-[9px] font-mono text-gray-500 block truncate">
                      GTIN: {it.gtin || '—'}
                    </span>
                    <span className="text-[9px] font-mono text-gray-500 block truncate">
                      SN: {it.serial || '—'}
                    </span>
                    <span className="text-[8px] font-mono text-gray-400 block line-clamp-2 leading-tight">
                      {it.code}
                    </span>
                  </div>
                </div>

                {/* Bottom Neat Label Number */}
                <div className="border-t border-slate-200/60 pt-1.5 mt-2 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-sans font-bold">
                    {labelWidth}×{labelHeight} мм
                  </span>
                  <span className="font-extrabold text-[#0082FB] font-mono bg-blue-50 px-1.5 py-0.2 rounded">
                    № {it.index}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleDownloadSingle(it.index)}
                  disabled={downloadingSingle === it.index}
                  className="flex-1 py-2 px-3 bg-[#0082FB] hover:bg-[#0070DA] text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  title="Скачать PDF этой этикетки"
                >
                  <Printer className="w-3.5 h-3.5" />
                  {downloadingSingle === it.index ? 'Печать...' : 'Печать 1 шт.'}
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(it.code, it.id)}
                  className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all cursor-pointer shrink-0"
                  title="Скопировать полный код маркировки"
                >
                  {copiedId === it.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white border border-gray-200/80 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-[11px] font-extrabold text-gray-500 uppercase border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4 w-20">№</th>
                  <th className="py-3 px-4 w-36">GTIN</th>
                  <th className="py-3 px-4 w-36">Серийный номер</th>
                  <th className="py-3 px-4">Код DataMatrix (Таңба)</th>
                  <th className="py-3 px-4 w-28">Статус</th>
                  <th className="py-3 px-4 w-32 text-right">Печать</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                {items.map((it) => (
                  <tr key={it.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="py-3 px-4 font-black text-[#111827]">
                      #{it.index}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {it.gtin || '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {it.serial || '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-700 max-w-md truncate">
                      <div className="flex items-center gap-2">
                        <span className="truncate" title={it.code}>
                          {it.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(it.code, it.id)}
                          className="text-gray-400 hover:text-gray-700 p-0.5 shrink-0 cursor-pointer"
                          title="Скопировать"
                        >
                          {copiedId === it.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      {it.status === 'REPRINTED' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Перепечатан
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                          В партии
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <button
                        type="button"
                        onClick={() => handleDownloadSingle(it.index)}
                        disabled={downloadingSingle === it.index}
                        className="px-3 py-1.5 bg-[#0082FB] hover:bg-[#0070DA] text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Printer className="w-3 h-3" />
                        {downloadingSingle === it.index ? '...' : 'Печать'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-gray-500 font-medium">
            Показаны этикетки с{' '}
            <strong className="text-gray-900">{(page - 1) * pageSize + 1}</strong> по{' '}
            <strong className="text-gray-900">
              {Math.min(totalCount, page * pageSize)}
            </strong>{' '}
            из <strong className="text-gray-900">{totalCount.toLocaleString()}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Назад
            </button>

            <span className="text-xs font-bold text-gray-700 px-3 py-1.5 bg-gray-100 rounded-xl">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 cursor-pointer flex items-center gap-1"
            >
              Вперед
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Roll Splitting Modal */}
      {order && (
        <RollSplitModal
          isOpen={showRollModal}
          onClose={() => setShowRollModal(false)}
          orderId={order.id}
          orderNumber={order.orderNumber}
          totalCodes={order.itemsCount}
          labelWidth={labelWidth}
          labelHeight={labelHeight}
          hasCodesFile={Boolean(order.codesFileUrl)}
          hasLayout={Boolean(order.stickerLayout)}
          canPrintBatch={canPrintBatch}
        />
      )}
    </div>
  );
};

export default OrderLabelsPage;
