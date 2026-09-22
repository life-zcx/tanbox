import React from 'react';
import { useAdminMetrics } from '../hooks/useAdminMetrics';
import { TrendingUp, Users, FileText, Cpu, DollarSign, PieChart, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@shared';

export const AdminDashboardPage: React.FC = () => {
  const { metrics, loading } = useAdminMetrics();

  if (loading) {
    return <div className="text-center py-12 text-gray-500 font-bold">Загрузка аналитики...</div>;
  }

  return (
    <div className="space-y-8">
      
      <PageHeader
        title="Обзор систем"
        description="Финансовые показатели, объем заказов и маржинальность оператора"
      />

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase">
            <span>Общая выручка платформы</span>
            <DollarSign className="w-5 h-5 text-black" />
          </div>
          <p className="text-3xl font-black text-black">
            {metrics?.totalRevenue.toLocaleString()} ₸
          </p>
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
            За текущий расчетный период
          </span>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase">
            <span>Расчетная маржа (Прибыль)</span>
            <PieChart className="w-5 h-5 text-black" />
          </div>
          <p className="text-3xl font-black text-emerald-600">
            ~{metrics?.estimatedProfitMargin.toLocaleString()} ₸
          </p>
          <span className="text-[11px] font-bold text-gray-500">
            Средняя маржинальность ~72%
          </span>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase">
            <span>Зарегистрированных компаний</span>
            <Users className="w-5 h-5 text-black" />
          </div>
          <p className="text-3xl font-black text-black">
            {metrics?.totalClients}
          </p>
          <span className="text-[11px] font-bold text-gray-500">
            ТОО / ИП с верификацией БИН
          </span>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase">
            <span>Всего заказов на маркировку</span>
            <FileText className="w-5 h-5 text-black" />
          </div>
          <p className="text-3xl font-black text-black">
            {metrics?.totalOrders}
          </p>
          <span className="text-[11px] font-bold text-gray-500">
            Активных в работе: {metrics?.activeOrders}
          </span>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-2 sm:col-span-2">
          <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase">
            <span>Сгенерировано кодов Data Matrix</span>
            <Cpu className="w-5 h-5 text-black" />
          </div>
          <p className="text-3xl font-black text-black">
            {metrics?.totalItemsCodes.toLocaleString()} <span className="text-sm font-normal text-gray-500">единиц товара</span>
          </p>
          <span className="text-[11px] font-bold text-emerald-600">
            Эмиссия через ИС Танба РК прошла успешно
          </span>
        </div>

      </div>

    </div>
  );
};
