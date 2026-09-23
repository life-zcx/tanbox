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
      <div className="bg-gradient-to-r from-[#0082FB] to-[#0052CC] text-white rounded-3xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg shadow-[#0082FB]/15 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-100 bg-white/15 px-3 py-1 rounded-full">Кабинет организации</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Приветствуем, {user?.companyName || 'Клиент'}!
          </h2>
          <p className="text-sm text-blue-50 max-w-xl font-normal leading-relaxed">
            БИН/ИИН: <span className="font-mono text-white font-bold">{user?.binIin}</span> • Все операции по маркировке товаров соответствуют стандарту ИС Танба РК.
          </p>
        </div>
        <Link
          to="/orders/new"
          className="z-10 shrink-0 bg-white text-[#0082FB] hover:bg-blue-50 font-extrabold text-xs px-6 py-3.5 rounded-2xl shadow-md transition-all active:scale-95 flex items-center gap-2"
        >
          + Создать заказ
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 text-[#64748B] mb-3">
            <div className="w-10 h-10 rounded-full bg-[#EBF5FF] text-[#0082FB] flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#64748B]">Всего заказов</span>
          </div>
          <p className="text-3xl font-extrabold text-[#111827]">{totalOrders}</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 text-[#64748B] mb-3">
            <div className="w-10 h-10 rounded-full bg-[#EBF5FF] text-[#0082FB] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#64748B]">Заказов в работе</span>
          </div>
          <p className="text-3xl font-extrabold text-[#111827]">{activeOrders}</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 text-[#64748B] mb-3">
            <div className="w-10 h-10 rounded-full bg-[#EBF5FF] text-[#0082FB] flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#64748B]">Сгенерировано кодов</span>
          </div>
          <p className="text-3xl font-extrabold text-[#111827]">{totalCodesCount.toLocaleString()} <span className="text-xs font-normal text-[#64748B]">шт.</span></p>
        </div>
      </div>

      {/* Recent Orders Preview */}
      <div className="bg-white border border-gray-100 rounded-3xl p-7 space-y-6 shadow-sm">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-extrabold text-[#111827]">Последние заказы</h3>
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
                    <td className="py-3.5 px-4 text-[#475569]">{ord.category}</td>
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
