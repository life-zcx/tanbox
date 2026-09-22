import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '../hooks/useOrders';
import { OrderItem, OrderStatus } from '../types';
import { StatusBadge, PageHeader } from '@shared';
import { Search, Eye, Filter, ChevronDown } from 'lucide-react';

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
    const matchSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      
      <PageHeader
        title="Мои заказы"
        description="Реестр и отслеживание статуса всех партий маркировки ИС Танба"
      />

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
        
        {/* Status Dropdown Filter */}
        <div className="relative w-full md:w-64">
          <div className="absolute left-3 top-2.5 pointer-events-none text-gray-400 flex items-center gap-1.5 text-xs font-bold">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-gray-400">Статус:</span>
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-20 pr-8 py-2 text-xs font-extrabold text-black focus:outline-none focus:border-black appearance-none cursor-pointer"
          >
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Поиск по номеру заказа..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold focus:outline-none focus:border-black"
          />
        </div>

      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Загрузка данных...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Заказы не найдены.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">№ Заказа</th>
                  <th className="py-3.5 px-4">Дата</th>
                  <th className="py-3.5 px-4">Категория</th>
                  <th className="py-3.5 px-4">Тариф</th>
                  <th className="py-3.5 px-4">Объем (шт)</th>
                  <th className="py-3.5 px-4">Стоимость (₸)</th>
                  <th className="py-3.5 px-4">Статус</th>
                  <th className="py-3.5 px-4 text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm font-semibold">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-black">
                      <Link to={`/orders/${ord.id}`} className="hover:underline hover:text-emerald-600 transition-colors">
                        {ord.orderNumber}
                      </Link>
                    </td>
                    <td className="py-4 px-4 text-xs text-gray-500">
                      {new Date(ord.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="py-4 px-4 text-gray-800">{ord.category}</td>
                    <td className="py-4 px-4 text-gray-800">{ord.tariffType}</td>
                    <td className="py-4 px-4 font-extrabold text-black">{ord.itemsCount.toLocaleString()}</td>
                    <td className="py-4 px-4 font-bold text-black">{ord.totalPrice.toLocaleString()} ₸</td>
                    <td className="py-4 px-4"><StatusBadge status={ord.status} /></td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/orders/${ord.id}`}
                        className="inline-flex items-center gap-1.5 bg-gray-100 text-black hover:bg-black hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> Детали
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
