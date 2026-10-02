import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { UserClient, OrderAdminItem } from '../types';
import {
  Printer,
  Download,
  Search,
  Layers,
  Copy,
  Check,
  Grid,
  List,
  CheckCircle2,
  AlertCircle,
  Hash,
  X,
  ChevronLeft,
  ChevronRight,
  Building2,
  FileText,
  Filter,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Palette,
  ArrowRight,
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

export const AdminLabelsHubPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlClientId = searchParams.get('clientId') || '';
  const urlOrderId = searchParams.get('orderId') || '';

  // Clients & Orders list
  const [users, setUsers] = useState<UserClient[]>([]);
  const [orders, setOrders] = useState<OrderAdminItem[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);

  // Selections
  const [selectedClientId, setSelectedClientId] = useState<string>(urlClientId);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(urlOrderId);
  const [quickOrderSearch, setQuickOrderSearch] = useState<string>('');

  // Selected Order details & Code items
  const [currentOrder, setCurrentOrder] = useState<OrderAdminItem | null>(null);
  const [loadingOrder, setLoadingOrder] = useState<boolean>(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const [items, setItems] = useState<CodeItem[]>([]);
  const [loadingItems, setLoadingItems] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(24);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Reprint states
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

  // 1. Initial fetch of Users and Orders
  useEffect(() => {
    let isMounted = true;
    setLoadingInitial(true);

    Promise.all([
      apiClient.get('/users').catch(() => ({ data: [] })),
      apiClient.get('/orders').catch(() => ({ data: [] })),
    ])
      .then(([usersRes, ordersRes]) => {
        if (!isMounted) return;
        setUsers(usersRes.data || []);
        setOrders(ordersRes.data || []);

        // If URL had orderId, select it and find corresponding user
        if (urlOrderId) {
          const foundOrder = (ordersRes.data || []).find((o: OrderAdminItem) => o.id === urlOrderId || o.orderNumber === urlOrderId);
          if (foundOrder) {
            setSelectedOrderId(foundOrder.id);
            if (foundOrder.userId && !urlClientId) {
              setSelectedClientId(foundOrder.userId);
            }
          }
        }
      })
      .finally(() => {
        if (isMounted) setLoadingInitial(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter orders for the selected client
  const clientOrders = useMemo(() => {
    if (!selectedClientId) return orders;
    return orders.filter((o) => o.userId === selectedClientId);
  }, [orders, selectedClientId]);

  // Sync URL when selection changes
  const updateUrlParams = (clientId: string, orderId: string) => {
    const params = new URLSearchParams();
    if (clientId) params.set('clientId', clientId);
    if (orderId) params.set('orderId', orderId);
    setSearchParams(params, { replace: true });
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    // Find if the currently selected order belongs to this client; if not, reset or select first
    const ordersForClient = orders.filter((o) => o.userId === clientId);
    if (ordersForClient.length > 0) {
      const firstOrder = ordersForClient[0];
      setSelectedOrderId(firstOrder.id);
      updateUrlParams(clientId, firstOrder.id);
    } else {
      setSelectedOrderId('');
      updateUrlParams(clientId, '');
    }
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    const ord = orders.find((o) => o.id === orderId);
    if (ord && ord.userId && ord.userId !== selectedClientId) {
      setSelectedClientId(ord.userId);
      updateUrlParams(ord.userId, orderId);
    } else {
      updateUrlParams(selectedClientId, orderId);
    }
  };

  // Direct quick search by order number
  const handleQuickOrderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = quickOrderSearch.trim().toLowerCase();
    if (!query) return;

    const matched = orders.find(
      (o) =>
        o.orderNumber.toLowerCase() === query ||
        o.orderNumber.toLowerCase().includes(query) ||
        o.id.toLowerCase() === query
    );

    if (matched) {
      if (matched.userId) setSelectedClientId(matched.userId);
      setSelectedOrderId(matched.id);
      updateUrlParams(matched.userId || '', matched.id);
      setQuickOrderSearch('');
    } else {
      setActionMessage({ type: 'error', text: `Заказ "${quickOrderSearch}" не найден в системе.` });
    }
  };

  // 2. Fetch Order details whenever selectedOrderId changes
  useEffect(() => {
    if (!selectedOrderId) {
      setCurrentOrder(null);
      setItems([]);
      return;
    }

    setLoadingOrder(true);
    setOrderError(null);

    apiClient
      .get(`/orders/${selectedOrderId}`)
      .then((res) => {
        setCurrentOrder(res.data);
        if (res.data.userId && res.data.userId !== selectedClientId) {
          setSelectedClientId(res.data.userId);
        }
      })
      .catch((err) => {
        console.error('Fetch order error:', err);
        setOrderError(err.response?.data?.message || 'Не удалось загрузить данные заказа.');
      })
      .finally(() => {
        setLoadingOrder(false);
      });
  }, [selectedOrderId]);

  // 3. Fetch paginated code items
  const fetchItems = () => {
    if (!selectedOrderId) return;
    setLoadingItems(true);
    apiClient
      .get(`/orders/${selectedOrderId}/items`, {
        params: {
          page,
          limit: pageSize,
          search: searchQuery.trim() || undefined,
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
    if (!selectedOrderId) return;
    const timer = setTimeout(() => {
      fetchItems();
    }, 250);
    return () => clearTimeout(timer);
  }, [selectedOrderId, page, pageSize, searchQuery, statusFilter]);

  // Copy helper
  const handleCopy = (text: string, itemId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(itemId);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // 4. Download Single Label
  const handleDownloadSingle = async (num: number) => {
    if (!selectedOrderId || isNaN(num) || num < 1) return;
    setDownloadingSingle(num);
    setActionMessage(null);
    try {
      const res = await apiClient.get(`/orders/${selectedOrderId}/items/${num}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `Label_№${num}_${currentOrder?.orderNumber || 'TB'}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setActionMessage({ type: 'success', text: `Этикетка №${num} успешно сформирована и скачана.` });
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

  // 5. Download Range
  const handleDownloadRange = async () => {
    const from = parseInt(rangeFrom, 10);
    const to = parseInt(rangeTo, 10);
    if (!selectedOrderId || isNaN(from) || isNaN(to) || from < 1 || to < from) {
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
      const res = await apiClient.get(`/orders/${selectedOrderId}/items-range/pdf?from=${from}&to=${to}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `Labels_(${from}-${to})_${currentOrder?.orderNumber || 'TB'}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setActionMessage({ type: 'success', text: `Партия этикеток с №${from} по №${to} скачана.` });
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

  // 6. Download Full Batch
  const handleDownloadFullBatch = async () => {
    if (!selectedOrderId) return;
    setDownloadingBatch(true);
    setActionMessage(null);
    try {
      const res = await apiClient.get(`/orders/${selectedOrderId}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `Labels_${currentOrder?.orderNumber}.pdf`);
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

  const stickerLayout = currentOrder?.stickerLayout as any;
  const labelWidth = stickerLayout?.widthMm || 58;
  const labelHeight = stickerLayout?.heightMm || 40;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-[#0082FB]">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-[#111827] tracking-tight">
              Генератор и реестр этикеток
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Выберите клиента и заказ для просмотра кодов, печати рулонов и выборочной допечатки этикеток
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/label-designer"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-extrabold text-gray-700 shadow-2xs transition-all"
          >
            <Palette className="w-4 h-4 text-[#0082FB]" />
            Конструктор макетов
          </Link>
        </div>
      </div>

      {/* Selector Hub: Client -> Order -> Labels */}
      <div className="bg-white border border-gray-200/90 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#0082FB]" />
            <span className="text-xs font-black uppercase tracking-wider text-gray-700">
              Выбор партии для печати
            </span>
          </div>
          {currentOrder && (
            <span className="text-xs font-bold text-gray-500">
              Выбран заказ: <strong className="text-gray-900">{currentOrder.orderNumber}</strong> ({currentOrder.itemsCount.toLocaleString()} шт.)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Step 1: Client Selector */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-xs font-black text-gray-700 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-blue-100 text-[#0082FB] text-[10px] font-black flex items-center justify-center">
                1
              </span>
              Клиент / Организация:
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              <select
                value={selectedClientId}
                onChange={(e) => handleSelectClient(e.target.value)}
                disabled={loadingInitial}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-9 pr-8 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#0082FB] focus:bg-white appearance-none cursor-pointer disabled:opacity-50"
              >
                <option value="">— Все клиенты ({users.length}) —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.companyName || u.email} {u.binIin ? `(БИН: ${u.binIin})` : ''} — {u._count?.orders || 0} зак.
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Step 2: Order Selector */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-xs font-black text-gray-700 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-blue-100 text-[#0082FB] text-[10px] font-black flex items-center justify-center">
                2
              </span>
              Заказ с этикетками:
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              <select
                value={selectedOrderId}
                onChange={(e) => handleSelectOrder(e.target.value)}
                disabled={loadingInitial || clientOrders.length === 0}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-9 pr-8 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#0082FB] focus:bg-white appearance-none cursor-pointer disabled:opacity-50"
              >
                <option value="">
                  {clientOrders.length === 0 ? 'У клиента нет заказов' : '— Выберите заказ для просмотра этикеток —'}
                </option>
                {clientOrders.map((ord) => (
                  <option key={ord.id} value={ord.id}>
                    {ord.orderNumber} • {ord.category} • {ord.itemsCount.toLocaleString()} кодов
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Direct Search Input */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-extrabold text-gray-500">Или прямой номер заказа:</label>
            <form onSubmit={handleQuickOrderSearch} className="flex items-center gap-1.5">
              <input
                type="text"
                value={quickOrderSearch}
                onChange={(e) => setQuickOrderSearch(e.target.value)}
                placeholder="TB-2026-..."
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#0082FB] focus:bg-white"
              />
              <button
                type="submit"
                className="px-3 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
              >
                Найти
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Global Notification Banner */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold border transition-all ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
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

      {/* STATE 1: Loading Order */}
      {loadingOrder && (
        <div className="bg-white border border-gray-200 rounded-3xl p-16 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
          <div className="w-10 h-10 border-3 border-[#0082FB] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-extrabold text-gray-700">Загрузка данных заказа и кодов...</span>
        </div>
      )}

      {/* STATE 2: Order Load Error */}
      {!loadingOrder && orderError && (
        <div className="bg-white border border-red-200 rounded-3xl p-10 text-center space-y-3 shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-base font-extrabold text-gray-900">Не удалось загрузить заказ</h3>
          <p className="text-xs text-gray-500">{orderError}</p>
        </div>
      )}

      {/* STATE 3: No Order Selected -> Welcome / Directory View */}
      {!loadingOrder && !orderError && !currentOrder && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-50/80 via-white to-sky-50/40 border border-blue-200/70 rounded-3xl p-8 sm:p-10 shadow-sm text-center max-w-3xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white border border-blue-200 text-[#0082FB] flex items-center justify-center mx-auto shadow-sm">
              <Printer className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-gray-900">
              Выберите клиента и заказ выше
            </h2>
            <p className="text-xs text-gray-600 max-w-lg mx-auto leading-relaxed">
              На этой странице администратор может мгновенно просмотреть все этикетки выбранного заказа,
              распечатать отдельные наклейки по номеру (#1, #402), напечатать бракованный диапазон или
              скачать готовые рулоны термоэтикеток по 500 / 1000 шт.
            </p>
          </div>

          {/* Quick list of Recent Orders with Codes */}
          <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm space-y-0">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-gray-900">Недавние партии для печати</h3>
                <p className="text-xs text-gray-400">Нажмите на заказ для моментального открытия этикеток</p>
              </div>
              <span className="text-xs font-bold text-gray-500">
                Всего заказов: {orders.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4">№ Заказа</th>
                    <th className="py-3 px-4">Клиент / Компания</th>
                    <th className="py-3 px-4">Категория</th>
                    <th className="py-3 px-4">Объем кодов</th>
                    <th className="py-3 px-4">Статус</th>
                    <th className="py-3 px-4 text-right">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-semibold">
                  {orders.slice(0, 8).map((ord) => (
                    <tr
                      key={ord.id}
                      onClick={() => handleSelectOrder(ord.id)}
                      className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0082FB] group-hover:underline">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-gray-900">{ord.user?.companyName || '—'}</div>
                        <div className="text-[10px] text-gray-400 font-mono">БИН: {ord.user?.binIin || '—'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">{ord.category}</td>
                      <td className="py-3.5 px-4 font-extrabold text-gray-900">
                        {ord.itemsCount.toLocaleString()} шт.
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-[#0082FB] border border-blue-100">
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectOrder(ord.id);
                          }}
                          className="inline-flex items-center gap-1.5 bg-[#0082FB] hover:bg-[#0070DA] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                        >
                          <span>Показать этикетки</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STATE 4: Order Selected -> Full Labels Console */}
      {!loadingOrder && currentOrder && (
        <div className="space-y-6">
          {/* Order Details & Summary Banner */}
          <div className="bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 rounded-3xl p-6 text-white shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 bg-white/10 border border-white/20 rounded-xl text-xs font-mono font-bold tracking-wider">
                  {currentOrder.orderNumber}
                </span>
                <span className="px-3 py-1 bg-[#0082FB] text-white rounded-xl text-xs font-bold">
                  {currentOrder.category}
                </span>
                <span className="px-3 py-1 bg-white/10 border border-white/20 rounded-xl text-xs font-bold">
                  Размер: {labelWidth}×{labelHeight} мм
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                {currentOrder.user?.companyName || 'Клиент Tanbox'}
              </h2>
              <p className="text-xs text-slate-300">
                БИН: <span className="font-mono">{currentOrder.user?.binIin || '—'}</span> • Email: {currentOrder.user?.email || '—'} • Всего кодов:{' '}
                <strong className="text-white">{currentOrder.itemsCount.toLocaleString()} шт.</strong>
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <Link
                to={`/orders/${currentOrder.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                Карточка заказа
              </Link>

              <button
                type="button"
                onClick={() => setShowRollModal(true)}
                className="inline-flex items-center gap-2 bg-white text-gray-900 hover:bg-gray-100 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Layers className="w-4 h-4 text-[#0082FB]" />
                Скачать по рулонам
              </button>

              <button
                type="button"
                onClick={handleDownloadFullBatch}
                disabled={downloadingBatch}
                className="inline-flex items-center gap-2 bg-[#0082FB] hover:bg-[#0070DA] text-white px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Download className={`w-4 h-4 ${downloadingBatch ? 'animate-bounce' : ''}`} />
                {downloadingBatch ? 'Генерация PDF...' : 'Скачать все этикетки (PDF)'}
              </button>
            </div>
          </div>

          {/* Quick Action Panels: Single Label Reprint & Range Reprint */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Single Label Reprint */}
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
                    Замена замятой ленты или поврежденного стикера на линии.
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
                    max={currentOrder.itemsCount}
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

            {/* Range Reprint */}
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
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    С
                  </span>
                  <input
                    type="number"
                    min="1"
                    max={currentOrder.itemsCount}
                    value={rangeFrom}
                    onChange={(e) => setRangeFrom(e.target.value)}
                    placeholder="400"
                    className="w-full bg-white border border-gray-300 rounded-xl pl-7 pr-3 py-2 text-xs text-[#111827] font-bold focus:outline-none focus:border-[#0082FB] shadow-2xs"
                  />
                </div>
                <span className="text-xs font-bold text-gray-400">—</span>
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    По
                  </span>
                  <input
                    type="number"
                    min="1"
                    max={currentOrder.itemsCount}
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
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Поиск по номеру (#402), GTIN или серийному номеру..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-[#0082FB] focus:bg-white transition-all font-medium"
                />
              </div>

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
                  setSearchQuery('');
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-7 h-7 rounded-xl bg-gray-900 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                        #{it.index}
                      </span>
                      <span className="text-[11px] font-bold text-gray-400 font-mono">
                        из {currentOrder.itemsCount}
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
                    <div className="flex items-start gap-2.5">
                      <div className="w-12 h-12 bg-white border border-slate-300 rounded-lg p-1 flex items-center justify-center shrink-0 shadow-2xs">
                        <div className="w-full h-full bg-slate-900 rounded-[2px] flex items-center justify-center">
                          <span className="text-[7px] text-white font-mono font-bold">DM</span>
                        </div>
                      </div>

                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="text-[10px] font-mono text-gray-400 uppercase">
                          {currentOrder.category}
                        </div>
                        <div className="text-[11px] font-mono font-bold text-gray-800 truncate">
                          {it.gtin ? `GTIN: ${it.gtin}` : 'Код маркировки'}
                        </div>
                        <div className="text-[10px] font-mono text-gray-500 truncate">
                          {it.serial ? `SN: ${it.serial}` : ''}
                        </div>
                      </div>
                    </div>

                    {/* Bottom row of Sticker Mockup */}
                    <div className="flex items-center justify-between border-t border-slate-200/80 pt-1.5 mt-2">
                      <span className="text-[9px] font-mono text-gray-400">
                        {labelWidth}×{labelHeight} мм
                      </span>
                      <span className="text-[10px] font-mono font-black text-gray-900 bg-white px-1.5 py-0.5 rounded border border-gray-300">
                        № {it.index}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => handleCopy(it.code, it.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-black transition-colors cursor-pointer"
                    >
                      {copiedId === it.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Скопирован</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-gray-400" />
                          <span>Код</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadSingle(it.index)}
                      disabled={downloadingSingle === it.index}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-[#0082FB] text-[#0082FB] hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>{downloadingSingle === it.index ? 'Печать...' : 'Печать'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                      <th className="py-3 px-4 w-16">№</th>
                      <th className="py-3 px-4">GTIN</th>
                      <th className="py-3 px-4">Серийный номер</th>
                      <th className="py-3 px-4">Полный DataMatrix код</th>
                      <th className="py-3 px-4">Статус</th>
                      <th className="py-3 px-4 text-right">Печать</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-semibold">
                    {items.map((it) => (
                      <tr key={it.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">
                            #{it.index}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-gray-800">
                          {it.gtin || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-600">
                          {it.serial || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-500 max-w-xs truncate" title={it.code}>
                          {it.code}
                        </td>
                        <td className="py-3 px-4">
                          {it.status === 'REPRINTED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                              Перепечатан
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                              В партии
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopy(it.code, it.id)}
                              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500 cursor-pointer"
                              title="Скопировать код"
                            >
                              {copiedId === it.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadSingle(it.index)}
                              disabled={downloadingSingle === it.index}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-[#0082FB] text-[#0082FB] hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Печать
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-gray-500 font-medium">
                Страница <strong className="text-gray-900">{page}</strong> из{' '}
                <strong className="text-gray-900">{totalPages}</strong> (всего {totalCount.toLocaleString()})
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-30 cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Назад
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = page;
                    if (page <= 3) pageNum = i + 1;
                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = page - 2 + i;

                    if (pageNum < 1 || pageNum > totalPages) return null;

                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          page === pageNum
                            ? 'bg-[#0082FB] text-white shadow-2xs'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-30 cursor-pointer flex items-center gap-1"
                >
                  Вперед
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Page Size Switcher */}
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
                <span>Показывать по:</span>
                {[24, 48, 96].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => {
                      setPageSize(sz);
                      setPage(1);
                    }}
                    className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                      pageSize === sz ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Roll Split Modal */}
      {currentOrder && showRollModal && (
        <RollSplitModal
          isOpen={showRollModal}
          onClose={() => setShowRollModal(false)}
          orderId={currentOrder.id}
          orderNumber={currentOrder.orderNumber}
          totalCodes={currentOrder.itemsCount}
          labelWidth={labelWidth}
          labelHeight={labelHeight}
          hasCodesFile={Boolean(currentOrder.codesFileName || currentOrder.codesFileUrl)}
          hasLayout={Boolean(currentOrder.stickerLayout)}
        />
      )}
    </div>
  );
};

export default AdminLabelsHubPage;
