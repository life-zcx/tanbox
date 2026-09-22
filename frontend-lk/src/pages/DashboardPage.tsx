import React from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '../hooks/useOrders';
import { useAuth } from '../hooks/useAuth';
import { FileText, Cpu, CheckCircle2, ArrowRight } from 'lucide-react';
import { StatusBadge, PageHeader } from '@shared';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { orders, loading } = useOrders();

  const totalOrders = orders.length;
  const activeOrders = orders.filter((o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED').length;
  const totalCodesCount = orders.reduce((acc, o) => acc + o.itemsCount, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Обзор и Статистика"
        description="Сводные метрики, статус выгрузок в ИС Танба и активные заказы организации"
      />
      
      {/* Banner */}
      <div className="bg-black text-white rounded-3xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Кабинет организации</span>
          <h2 className="text-3xl font-extrabold text-white">
            Приветствуем, {user?.companyName || 'Клиент'}!
          </h2>
          <p className="text-sm text-gray-300 max-w-xl">
            БИН/ИИН: <span className="font-mono text-white font-bold">{user?.binIin}</span> • Все операции по маркировке товаров соответствуют стандарту ИС Танба РК.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <FileText className="w-5 h-5 text-black" />
            <span className="text-xs font-bold uppercase">Всего заказов</span>
          </div>
          <p className="text-3xl font-black text-black">{totalOrders}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <CheckCircle2 className="w-5 h-5 text-black" />
            <span className="text-xs font-bold uppercase">Заказов в работе</span>
          </div>
          <p className="text-3xl font-black text-black">{activeOrders}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <Cpu className="w-5 h-5 text-black" />
            <span className="text-xs font-bold uppercase">Сгенерировано кодов</span>
          </div>
          <p className="text-3xl font-black text-black">{totalCodesCount.toLocaleString()} <span className="text-xs font-normal text-gray-400">шт.</span></p>
        </div>
      </div>

      {/* Recent Orders Preview */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6 shadow-sm">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-extrabold text-black">Последние заказы</h3>
          <Link to="/orders" className="text-xs font-bold text-gray-600 hover:text-black flex items-center gap-1">
            Смотреть все <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400 text-sm">Загрузка заказов...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-400 space-y-3">
            <p className="text-sm">У вас пока нет активных заказов на маркировку.</p>
            <Link
              to="/orders/new"
              className="inline-block bg-black text-white text-xs font-bold px-4 py-2 rounded-lg"
            >
              Создать первый заказ
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">№ Заказа</th>
                  <th className="py-3 px-4">Категория</th>
                  <th className="py-3 px-4">Тариф</th>
                  <th className="py-3 px-4">Объем</th>
                  <th className="py-3 px-4">Сумма (₸)</th>
                  <th className="py-3 px-4">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm font-semibold">
                {orders.slice(0, 5).map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-black">
                      <Link to={`/orders/${ord.id}`} className="hover:underline hover:text-emerald-600 transition-colors">
                        {ord.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-gray-700">{ord.category}</td>
                    <td className="py-3.5 px-4 text-gray-700">{ord.tariffType}</td>
                    <td className="py-3.5 px-4 font-extrabold text-black">{ord.itemsCount.toLocaleString()} шт</td>
                    <td className="py-3.5 px-4 font-bold text-black">{ord.totalPrice.toLocaleString()} ₸</td>
                    <td className="py-3.5 px-4"><StatusBadge status={ord.status} /></td>
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
