import React from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '../hooks/useOrders';
import { useAuth } from '../hooks/useAuth';
import { FileText, Cpu, CheckCircle2, ArrowRight } from 'lucide-react';
import { StatusBadge, PageHeader } from '@shared';
import { getCategoryLabel } from '../data/categories';

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
        action={
          <Link
            to="/orders/new"
            className="inline-flex items-center gap-2 bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-sm transition-all active:scale-95"
          >
            + Создать заказ
          </Link>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Всего заказов</span>
            <FileText className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-extrabold text-[#111827]">{totalOrders}</p>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Заказов в работе</span>
            <CheckCircle2 className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-extrabold text-[#111827]">{activeOrders}</p>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Сгенерировано кодов</span>
            <Cpu className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-extrabold text-[#111827]">
            {totalCodesCount.toLocaleString()} <span className="text-xs font-semibold text-[#64748B]">шт.</span>
          </p>
        </div>
      </div>

      {/* Recent Orders Preview */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 space-y-5 shadow-xs">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-extrabold text-[#111827]">Последние заказы</h3>
          <Link to="/orders" className="text-xs font-extrabold text-[#0082FB] hover:text-[#0070DA] flex items-center gap-1 transition-colors">
            Смотреть все <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8 text-[#64748B] text-sm font-normal">Загрузка заказов...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-[#64748B] space-y-3">
            <p className="text-sm font-normal">У вас пока нет активных заказов на маркировку.</p>
            <Link
              to="/orders/new"
              className="inline-block bg-[#0082FB] hover:bg-[#0070DA] text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-md shadow-[#0082FB]/20 transition-all"
            >
              Создать первый заказ
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-extrabold text-[#64748B] uppercase tracking-wider">
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
                  <tr key={ord.id} className="hover:bg-[#F4F6F9]/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#111827]">
                      <Link to={`/orders/${ord.id}`} className="hover:underline hover:text-[#0082FB] transition-colors">
                        {ord.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-[#475569]">{getCategoryLabel(ord.category)}</td>
                    <td className="py-3.5 px-4 text-[#475569]">{ord.tariffType}</td>
                    <td className="py-3.5 px-4 font-extrabold text-[#111827]">{ord.itemsCount.toLocaleString()} шт</td>
                    <td className="py-3.5 px-4 font-bold text-[#111827]">{ord.totalPrice.toLocaleString()} ₸</td>
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
