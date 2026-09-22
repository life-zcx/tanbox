import React, { useState } from 'react';
import { useAdminOrders } from '../hooks/useAdminOrders';
import { OrderAdminItem, OrderStatus } from '../types';
import { OrderStatusModal } from '../components/modals/OrderStatusModal';
import { Search, Edit, FileText, Download, Filter, ChevronDown } from 'lucide-react';
import { PageHeader, StatusBadge } from '@shared';

const STATUS_LABELS: Record<string, string> = {
  ALL: 'Все заказы',
  NEW: 'Новые',
  PROCESSING: 'В обработке',
  PRINTING: 'Печать кодов',
  STICKERING: 'Стикеровка',
  COMPLETED: 'Выполненные',
  CANCELLED: 'Отменённые',
};

export const AdminOrdersPage: React.FC = () => {
  const { orders, loading, updateStatus } = useAdminOrders();
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalOrder, setActiveModalOrder] = useState<OrderAdminItem | null>(null);

  const filteredOrders = orders.filter((o) => {
    const matchStatus = selectedStatus === 'ALL' || o.status === selectedStatus;
    const matchSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.user?.companyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.user?.binIin || '').includes(searchQuery);
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      
      <PageHeader
        title="Все заказы"
        description="Смена статусов, прикрепление файлов кодов и контроль исполнения партий"
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

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Поиск по БИН, названию, №..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold focus:outline-none focus:border-black"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Загрузка заказов...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Заказы не найдены.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">№ Заказа</th>
                  <th className="py-3.5 px-4">Компания / БИН</th>
                  <th className="py-3.5 px-4">Категория</th>
                  <th className="py-3.5 px-4">Тариф</th>
                  <th className="py-3.5 px-4">Объем</th>
                  <th className="py-3.5 px-4">Сумма (₸)</th>
                  <th className="py-3.5 px-4">Статус</th>
                  <th className="py-3.5 px-4 text-right">Управление</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm font-semibold">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-black">{ord.orderNumber}</td>
                    <td className="py-4 px-4">
                      <div className="text-xs font-extrabold text-black">{ord.user?.companyName}</div>
                      <div className="text-[11px] font-mono text-gray-500">БИН: {ord.user?.binIin}</div>
                    </td>
                    <td className="py-4 px-4 text-xs text-gray-700">{ord.category}</td>
                    <td className="py-4 px-4 text-xs text-gray-700">{ord.tariffType}</td>
                    <td className="py-4 px-4 font-extrabold text-black">{ord.itemsCount.toLocaleString()} шт</td>
                    <td className="py-4 px-4 font-bold text-black">{ord.totalPrice.toLocaleString()} ₸</td>
                    <td className="py-4 px-4">
                      <StatusBadge status={ord.status} />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => setActiveModalOrder(ord)}
                        className="inline-flex items-center gap-1.5 bg-black text-white hover:bg-gray-800 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      >
                        <Edit className="w-3.5 h-3.5" /> Сменить статус
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <OrderStatusModal
        order={activeModalOrder}
        onClose={() => setActiveModalOrder(null)}
        onSave={async (id, status, pdfUrl) => {
          await updateStatus(id, status, pdfUrl);
        }}
      />

    </div>
  );
};
