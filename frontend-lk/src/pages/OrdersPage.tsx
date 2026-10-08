import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '../hooks/useOrders';
import { OrderItem, OrderStatus } from '../types';
import { StatusBadge, PageHeader } from '@shared';
import { Search, Eye, Filter, ChevronDown, Plus } from 'lucide-react';
import { getCategoryLabel } from '../data/categories';

const STATUS_LABELS: Record<string, string> = {
  ALL: 'Все заказы',
  NEW: 'Новые',
  PROCESSING: 'В обработке',
  PRINTING: 'Печать кодов',
  STICKERING: 'Стикеровка',
  COMPLETED: 'Выполненные',
  CANCELLED: 'Отменённые',
};

export const OrdersPage: React.FC = () => {
  const { orders, loading, refetch } = useOrders();
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredOrders = orders.filter((o) => {
    const matchStatus = selectedStatus === 'ALL' || o.status === selectedStatus;
    const catLabel = getCategoryLabel(o.category);
    const matchSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      catLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      
      <PageHeader
        title="Мои заказы"
        description="Реестр и отслеживание статуса всех партий маркировки ИС Танба"
        action={
          <Link
            to="/orders/new"
            className="hidden sm:inline-flex items-center gap-2 bg-[#0082FB] hover:bg-[#0070DA] text-white px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-md shadow-blue-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Создать заказ</span>
          </Link>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white border border-gray-100 rounded-3xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
        
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
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-3 top-3 pointer-events-none" />
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Поиск по номеру заказа..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F4F6F9] border border-gray-200/80 rounded-xl pl-10 pr-3 py-2.5 text-xs font-medium focus:outline-none focus:border-[#0082FB]"
          />
        </div>

      </div>

      {/* Orders List / Table */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-12 text-[#64748B] text-sm">Загрузка данных...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-[#64748B] text-sm font-normal">Заказы не найдены.</div>
        ) : (
          <>
            {/* Mobile Cards (Visible only on < md) */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredOrders.map((ord) => (
                <div key={ord.id} className="p-4 space-y-3 hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      to={`/orders/${ord.id}`}
                      className="font-mono font-bold text-sm text-[#0082FB] hover:underline"
                    >
                      {ord.orderNumber}
                    </Link>
                    <StatusBadge status={ord.status} tariffType={ord.tariffType} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-[#64748B]">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-[#94A3B8]">Товар</span>
                      <span className="font-semibold text-[#111827]">{getCategoryLabel(ord.category)}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-[#94A3B8]">Тариф</span>
                      <span className="font-semibold text-[#111827]">{ord.tariffType}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-[#94A3B8]">Объем</span>
                      <span className="font-extrabold text-[#111827]">{ord.itemsCount.toLocaleString()} шт.</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-[#94A3B8]">Сумма</span>
                      <span className="font-extrabold text-[#111827]">{ord.totalPrice.toLocaleString()} ₸</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                    <span className="text-[#94A3B8] text-[11px]">
                      {new Date(ord.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                    <Link
                      to={`/orders/${ord.id}`}
                      className="inline-flex items-center gap-1.5 bg-[#EBF5FF] text-[#0082FB] hover:bg-[#0082FB] hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Детали заказа</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (Visible on md and above) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F4F6F9]/60 border-b border-gray-100 text-xs font-extrabold text-[#64748B] uppercase tracking-wider">
                    <th className="py-4 px-5">№ Заказа</th>
                    <th className="py-4 px-5">Дата</th>
                    <th className="py-4 px-5">Категория</th>
                    <th className="py-4 px-5">Тариф</th>
                    <th className="py-4 px-5">Объем (шт)</th>
                    <th className="py-4 px-5">Стоимость (₸)</th>
                    <th className="py-4 px-5">Статус</th>
                    <th className="py-4 px-5 text-right">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm font-semibold">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#F4F6F9]/50 transition-colors">
                      <td className="py-4 px-5 font-mono font-bold text-[#111827]">
                        <Link to={`/orders/${ord.id}`} className="hover:underline hover:text-[#0082FB] transition-colors">
                          {ord.orderNumber}
                        </Link>
                      </td>
                      <td className="py-4 px-5 text-xs text-[#64748B] font-normal">
                        {new Date(ord.createdAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="py-4 px-5 text-[#475569]">{getCategoryLabel(ord.category)}</td>
                      <td className="py-4 px-5 text-[#475569]">{ord.tariffType}</td>
                      <td className="py-4 px-5 font-extrabold text-[#111827]">{ord.itemsCount.toLocaleString()}</td>
                      <td className="py-4 px-5 font-bold text-[#111827]">{ord.totalPrice.toLocaleString()} ₸</td>
                      <td className="py-4 px-5"><StatusBadge status={ord.status} /></td>
                      <td className="py-4 px-5 text-right">
                        <Link
                          to={`/orders/${ord.id}`}
                          className="inline-flex items-center gap-1.5 bg-[#EBF5FF] text-[#0082FB] hover:bg-[#0082FB] hover:text-white px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" /> Детали
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

    </div>
  );
};
