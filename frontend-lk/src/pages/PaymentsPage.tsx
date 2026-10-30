import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import {
  Search,
  RefreshCw,
  ExternalLink,
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';

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

export const PaymentsPage: React.FC = () => {
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [balanceHistory, setBalanceHistory] = useState<BalanceHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchBalanceAndHistory = async () => {
    setLoading(true);
    try {
      const [balRes, histRes] = await Promise.all([
        apiClient.get('/payments/balance').catch(() => ({ data: { balance: 0 } })),
        apiClient.get('/payments/history').catch(() => ({ data: { history: [] } })),
      ]);
      setCurrentBalance(Number(balRes.data?.balance || 0));
      setBalanceHistory(histRes.data?.history || []);
    } catch (err) {
      console.error('Failed to fetch balance or payment history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalanceAndHistory();

    const handleBalanceUpdate = () => {
      fetchBalanceAndHistory();
    };

    window.addEventListener('tanbox:balance-updated', handleBalanceUpdate);
    return () => window.removeEventListener('tanbox:balance-updated', handleBalanceUpdate);
  }, []);

  const totalTopUps = balanceHistory
    .filter((i) => i.direction === 'IN' && (i.status === 'SUCCESS' || i.status === 'PAID' || i.status === 'COMPLETED'))
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const totalSpentBalance = balanceHistory
    .filter((i) => i.direction === 'OUT' && (i.status === 'SUCCESS' || i.status === 'PAID' || i.status === 'COMPLETED'))
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const filteredHistory = balanceHistory.filter((item) => {
    if (filterType !== 'ALL' && item.direction !== filterType) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNum = item.paymentNumber?.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchOrder = item.order?.orderNumber?.toLowerCase().includes(q);
      const matchComment = item.metadata?.comment?.toLowerCase().includes(q);
      return matchNum || matchDesc || matchOrder || matchComment;
    }
    return true;
  });

  const countIn = balanceHistory.filter((i) => i.direction === 'IN').length;
  const countOut = balanceHistory.filter((i) => i.direction === 'OUT').length;

  return (
    <div className="space-y-6 w-full">
      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Balance */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">
            Текущий баланс
          </div>
          <div className="text-2xl font-black text-[#111827] font-mono">
            {currentBalance.toLocaleString('ru-RU')} ₸
          </div>
        </div>

        {/* Card 2: Total Top-Ups */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">
            Всего пополнено
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            +{totalTopUps.toLocaleString('ru-RU')} ₸
          </div>
        </div>

        {/* Card 3: Total Spent */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">
            Списано за услуги
          </div>
          <div className="text-2xl font-black text-[#111827] font-mono">
            -{totalSpentBalance.toLocaleString('ru-RU')} ₸
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-gray-200/90 rounded-2xl p-3.5 shadow-xs">
        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-[#111827] text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Все операции ({balanceHistory.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('IN')}
            className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              filterType === 'IN'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
            }`}
          >
            Пополнения (+{countIn})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('OUT')}
            className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              filterType === 'OUT'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Списания и оплаты (-{countOut})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по номеру или описанию..."
            className="w-full pl-9 pr-7 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-black focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table Card */}
      <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs font-semibold text-gray-500 flex flex-col items-center justify-center gap-2.5">
            <div className="w-6 h-6 border-2 border-[#0082FB] border-t-transparent rounded-full animate-spin"></div>
            <span>Загрузка истории операций...</span>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <Wallet className="w-6 h-6" />
            </div>
            <p className="text-sm font-extrabold text-[#111827]">Операций не найдено</p>
            <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'По вашему поисковому запросу ничего не найдено.'
                : 'Здесь будут отображаться пополнения с банковской карты, оплаты партий кодов и списания за макеты.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/75 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3.5 px-5">Дата и время</th>
                  <th className="py-3.5 px-4">№ Транзакции</th>
                  <th className="py-3.5 px-4">Тип операции / Описание</th>
                  <th className="py-3.5 px-4 text-right">Сумма</th>
                  <th className="py-3.5 px-4 text-center">Статус</th>
                  <th className="py-3.5 px-5">Связанный заказ / Детали</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-[#111827]">
                {filteredHistory.map((item) => {
                  const isCredit = item.direction === 'IN';
                  const meta = item.metadata || {};
                  const isManual = Boolean(meta.manualByAdmin);

                  let title = item.description || 'Операция';
                  if (isManual) {
                    title = isCredit ? 'Пополнение администратором' : 'Корректировка администратором';
                  } else if (item.category === 'ONLINE_TOPUP') {
                    title = 'Пополнение лицевого счета';
                  } else if (item.category === 'ORDER_PAYMENT') {
                    title = item.order ? `Оплата заказа №${item.order.orderNumber}` : 'Оплата заказа';
                  } else if (item.category === 'LAYOUT_PAYMENT') {
                    title = 'Оплата макета этикетки';
                  }

                  const isCompleted = item.status === 'SUCCESS' || item.status === 'PAID' || item.status === 'COMPLETED';
                  const isPending = item.status === 'PENDING';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-5 whitespace-nowrap text-[#64748B]">
                        <div className="font-bold text-[#111827]">
                          {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                          {new Date(item.createdAt).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-gray-700 whitespace-nowrap">
                        {item.paymentNumber}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isCredit
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                                : 'bg-gray-100 text-gray-600 border border-gray-200/60'
                            }`}
                          >
                            {isCredit ? (
                              <ArrowDownRight className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold text-[#111827]">{title}</div>
                            {item.description && item.description !== title && (
                              <div className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right whitespace-nowrap font-mono font-black text-sm">
                        <span className={isCredit ? 'text-emerald-600' : 'text-[#111827]'}>
                          {isCredit ? '+' : '-'}
                          {Number(item.amount || 0).toLocaleString('ru-RU')} ₸
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : isPending
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-red-50 text-red-800 border border-red-200'
                          }`}
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{isCredit ? 'Зачислено' : 'Оплачено'}</span>
                            </>
                          ) : isPending ? (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>В обработке</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-red-600" />
                              <span>{item.status}</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-gray-600 text-xs">
                        {item.order && (
                          <Link
                            to={`/orders/${item.order.id}`}
                            className="inline-flex items-center gap-1 font-bold text-[#0082FB] hover:underline"
                          >
                            Заказ №{item.order.orderNumber}
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                        {meta.comment && (
                          <div className="text-[11px] text-gray-700 font-medium italic mt-0.5">
                            «{meta.comment}»
                          </div>
                        )}
                        {!item.order && !meta.comment && (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
