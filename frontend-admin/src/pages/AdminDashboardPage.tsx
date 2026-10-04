import React, { useState } from 'react';
import { useAdminMetrics } from '../hooks/useAdminMetrics';
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Cpu,
  DollarSign,
  PieChart,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  Printer,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  RefreshCw,
  Building2,
  Percent,
  Activity,
  Award,
} from 'lucide-react';
import { PageHeader } from '@shared';
import { ClientDetailModal } from '../components/modals/ClientDetailModal';
import { Link } from 'react-router-dom';

const PERIOD_OPTIONS = [
  { key: 'today', label: 'Сегодня' },
  { key: '7d', label: '7 дней' },
  { key: '30d', label: '30 дней' },
  { key: 'month', label: 'Этот месяц' },
  { key: 'quarter', label: 'Квартал' },
  { key: 'year', label: 'Год' },
  { key: 'all', label: 'Всё время' },
  { key: 'custom', label: 'Период...' },
];

export const AdminDashboardPage: React.FC = () => {
  const {
    analytics,
    loading,
    error,
    period,
    setPeriod,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    refetch,
  } = useAdminMetrics('30d');

  // Chart metric switch
  const [chartMetric, setChartMetric] = useState<'revenue' | 'codes' | 'orders'>('revenue');
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  // Client card modal
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState<boolean>(false);

  const summary = analytics?.summary;
  const growth = analytics?.growth;

  const handleOpenClient = (userId: string) => {
    setSelectedUserId(userId);
    setIsClientModalOpen(true);
  };

  const handleCloseClient = () => {
    setIsClientModalOpen(false);
    setSelectedUserId(null);
  };

  // SVG Chart Calculations
  const timeline = analytics?.dailyTimeline || [];
  const maxMetricVal = Math.max(
    ...timeline.map((p) =>
      chartMetric === 'revenue' ? p.revenue : chartMetric === 'codes' ? p.codes : p.orders
    ),
    1
  );

  const chartHeight = 180;
  const chartWidth = 720;
  const paddingX = 20;
  const paddingY = 20;

  const points = timeline.map((p, idx) => {
    const val = chartMetric === 'revenue' ? p.revenue : chartMetric === 'codes' ? p.codes : p.orders;
    const x =
      timeline.length <= 1
        ? chartWidth / 2
        : paddingX + (idx / (timeline.length - 1)) * (chartWidth - 2 * paddingX);
    const y =
      chartHeight - paddingY - (val / maxMetricVal) * (chartHeight - 2 * paddingY);
    return { ...p, x, y, val };
  });

  const pathD =
    points.length <= 1
      ? ''
      : points.reduce(
          (acc, p, idx) =>
            idx === 0
              ? `M ${p.x} ${p.y}`
              : `${acc} L ${p.x} ${p.y}`,
          ''
        );

  const areaD =
    points.length <= 1
      ? ''
      : `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;

  return (
    <div className="space-y-8">
      {/* Top Header & Period Filter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <PageHeader
          title="Обзор систем и Аналитика"
          description="Финансовые показатели, динамика выручки, маржинальность и воронка заказов"
        />

        {/* Period Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white border border-gray-200 p-1.5 rounded-2xl shadow-xs">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setPeriod(opt.key)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                period === opt.key
                  ? 'bg-[#111827] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {opt.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => refetch()}
            disabled={loading}
            title="Обновить аналитику"
            className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-xl transition-all cursor-pointer ml-1"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker bar if 'custom' is active */}
      {period === 'custom' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center gap-3 animate-in fade-in duration-150">
          <Calendar className="w-4 h-4 text-[#0082FB]" />
          <span className="text-xs font-extrabold text-[#111827] uppercase tracking-wider">
            Произвольный интервал:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="text-xs font-bold border border-gray-300 rounded-xl px-3 py-1.5 bg-gray-50 focus:bg-white focus:border-[#0082FB] focus:outline-none"
            />
            <span className="text-xs text-gray-400">—</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="text-xs font-bold border border-gray-300 rounded-xl px-3 py-1.5 bg-gray-50 focus:bg-white focus:border-[#0082FB] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => refetch()}
              className="bg-[#0082FB] hover:bg-[#0070DA] text-white text-xs font-extrabold px-4 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Применить
            </button>
          </div>
        </div>
      )}

      {loading && !analytics ? (
        <div className="text-center py-24 text-gray-400 font-bold text-sm">
          Загрузка расширенной аналитики...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl font-bold text-sm">
          {error}
        </div>
      ) : summary ? (
        <>
          {/* Main 4 KPI Hero Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Total Revenue */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-3 relative overflow-hidden">
              <div className="flex justify-between items-center text-xs font-extrabold text-[#64748B] uppercase tracking-wider">
                <span>Выручка платформы</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-[#0082FB]" />
                </div>
              </div>

              <div>
                <p className="text-3xl font-black text-[#111827]">
                  {summary.totalRevenue.toLocaleString('ru-RU')} ₸
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {growth && growth.revenue !== 0 && period !== 'all' && (
                    <span
                      className={`inline-flex items-center text-xs font-extrabold px-2 py-0.5 rounded-full ${
                        growth.revenue > 0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {growth.revenue > 0 ? (
                        <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                      )}
                      {growth.revenue > 0 ? `+${growth.revenue}%` : `${growth.revenue}%`}
                    </span>
                  )}
                  <span className="text-[11px] text-[#64748B]">к пред. периоду</span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500 font-semibold">Оплачено клиентами:</span>
                <span className="font-extrabold text-emerald-600">
                  {summary.paidRevenue.toLocaleString('ru-RU')} ₸
                </span>
              </div>
            </div>

            {/* 2. Estimated Profit Margin */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-3 relative overflow-hidden">
              <div className="flex justify-between items-center text-xs font-extrabold text-[#64748B] uppercase tracking-wider">
                <span>Расчетная маржа (Прибыль)</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <PieChart className="w-4 h-4 text-emerald-600" />
                </div>
              </div>

              <div>
                <p className="text-3xl font-black text-emerald-600">
                  ~{summary.estimatedProfitMargin.toLocaleString('ru-RU')} ₸
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Маржинальность ~72%
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500 font-semibold">Себестоимость/услуги:</span>
                <span className="font-bold text-gray-700">
                  ~{(summary.totalRevenue - summary.estimatedProfitMargin).toLocaleString('ru-RU')} ₸
                </span>
              </div>
            </div>

            {/* 3. Items / DataMatrix Codes Generated */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-3 relative overflow-hidden">
              <div className="flex justify-between items-center text-xs font-extrabold text-[#64748B] uppercase tracking-wider">
                <span>Кодов Data Matrix</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-purple-600" />
                </div>
              </div>

              <div>
                <p className="text-3xl font-black text-[#111827]">
                  {summary.totalItemsCodes.toLocaleString('ru-RU')} <span className="text-sm font-normal text-gray-400">шт.</span>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {growth && growth.codes !== 0 && period !== 'all' && (
                    <span
                      className={`inline-flex items-center text-xs font-extrabold px-2 py-0.5 rounded-full ${
                        growth.codes > 0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {growth.codes > 0 ? (
                        <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                      )}
                      {growth.codes > 0 ? `+${growth.codes}%` : `${growth.codes}%`}
                    </span>
                  )}
                  <span className="text-[11px] text-[#64748B]">эмиссия ИС Танба</span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500 font-semibold">Средний тираж:</span>
                <span className="font-extrabold text-[#111827]">
                  {summary.averageItemsPerOrder.toLocaleString('ru-RU')} шт./заказ
                </span>
              </div>
            </div>

            {/* 4. Total Orders & Average Check */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-3 relative overflow-hidden">
              <div className="flex justify-between items-center text-xs font-extrabold text-[#64748B] uppercase tracking-wider">
                <span>Заказов за период</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-amber-600" />
                </div>
              </div>

              <div>
                <p className="text-3xl font-black text-[#111827]">
                  {summary.totalOrders}{' '}
                  <span className="text-sm font-semibold text-gray-400">
                    ({summary.activeOrders} активных)
                  </span>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Успешность {summary.completionRate}%
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500 font-semibold">Средний чек (AOV):</span>
                <span className="font-extrabold text-[#111827]">
                  {summary.averageOrderValue.toLocaleString('ru-RU')} ₸
                </span>
              </div>
            </div>

          </div>

          {/* Interactive Trend Chart */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-[#111827] flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#0082FB]" />
                  Динамика показателей во времени
                </h3>
                <p className="text-xs text-[#64748B]">
                  Посуточная разбивка выручки, тиражей и созданных заказов
                </p>
              </div>

              {/* Chart Metric Switcher */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setChartMetric('revenue')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    chartMetric === 'revenue'
                      ? 'bg-white text-black shadow-xs'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  Выручка (₸)
                </button>
                <button
                  type="button"
                  onClick={() => setChartMetric('codes')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    chartMetric === 'codes'
                      ? 'bg-white text-black shadow-xs'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  Коды (шт.)
                </button>
                <button
                  type="button"
                  onClick={() => setChartMetric('orders')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    chartMetric === 'orders'
                      ? 'bg-white text-black shadow-xs'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  Заказы
                </button>
              </div>
            </div>

            {/* SVG Visual Area Chart */}
            <div className="relative w-full overflow-hidden bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
              {timeline.length === 0 ? (
                <div className="h-44 flex items-center justify-center text-xs font-bold text-gray-400">
                  Нет данных за выбранный период
                </div>
              ) : (
                <div className="space-y-2">
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="w-full h-44 overflow-visible"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0082FB" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#0082FB" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal guide lines */}
                    <line
                      x1={0}
                      y1={chartHeight - paddingY}
                      x2={chartWidth}
                      y2={chartHeight - paddingY}
                      stroke="#E2E8F0"
                      strokeWidth="1"
                    />
                    <line
                      x1={0}
                      y1={chartHeight / 2}
                      x2={chartWidth}
                      y2={chartHeight / 2}
                      stroke="#E2E8F0"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />

                    {/* Gradient Area Fill */}
                    {areaD && <path d={areaD} fill="url(#areaGradient)" />}

                    {/* Trend Line */}
                    {pathD && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#0082FB"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Data Points */}
                    {points.map((p, idx) => (
                      <circle
                        key={idx}
                        cx={p.x}
                        cy={p.y}
                        r={hoveredPoint?.date === p.date ? 5 : 3}
                        className="cursor-pointer transition-all"
                        fill={hoveredPoint?.date === p.date ? '#111827' : '#0082FB'}
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        onMouseEnter={() => setHoveredPoint(p)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    ))}
                  </svg>

                  {/* Bottom Date Labels */}
                  <div className="flex justify-between text-[11px] font-bold text-gray-400 px-2">
                    <span>{timeline[0]?.label}</span>
                    {timeline.length > 2 && (
                      <span>{timeline[Math.floor(timeline.length / 2)]?.label}</span>
                    )}
                    <span>{timeline[timeline.length - 1]?.label}</span>
                  </div>

                  {/* Hovered Point Tooltip */}
                  {hoveredPoint && (
                    <div className="p-2.5 bg-[#111827] text-white rounded-xl text-xs space-y-0.5 inline-block shadow-lg">
                      <div className="font-extrabold text-blue-300">{hoveredPoint.label}</div>
                      <div>Выручка: <strong className="text-white">{hoveredPoint.revenue.toLocaleString('ru-RU')} ₸</strong></div>
                      <div>Кодов: <strong className="text-white">{hoveredPoint.codes.toLocaleString('ru-RU')} шт.</strong></div>
                      <div>Заказов: <strong className="text-white">{hoveredPoint.orders} шт.</strong></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Breakdown Section: Tariffs vs Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Tariff Distribution */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#0082FB]" />
                  <h3 className="text-sm font-extrabold text-[#111827]">
                    Структура выручки по тарифам
                  </h3>
                </div>
                <span className="text-xs text-gray-400 font-bold">
                  {summary.totalOrders} заказов
                </span>
              </div>

              <div className="space-y-4">
                {analytics.tariffDistribution.map((t) => (
                  <div key={t.key} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="font-bold text-[#111827] flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#0082FB]" />
                        {t.name}
                        <span className="text-[11px] text-gray-400 font-normal">
                          ({t.count} зак.)
                        </span>
                      </div>
                      <div className="font-mono font-extrabold text-[#111827]">
                        {t.revenue.toLocaleString('ru-RU')} ₸{' '}
                        <span className="text-gray-400 font-normal">({t.percentage}%)</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#0082FB] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(t.percentage, t.count > 0 ? 3 : 0))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-extrabold text-[#111827]">
                    Категории маркируемых товаров
                  </h3>
                </div>
                <span className="text-xs text-gray-400 font-bold">
                  {analytics.categoryDistribution.length} категорий
                </span>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {analytics.categoryDistribution.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400">
                    Нет данных по категориям за период
                  </div>
                ) : (
                  analytics.categoryDistribution.map((c) => (
                    <div
                      key={c.key}
                      className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-extrabold text-[#111827]">{c.name}</div>
                        <div className="text-[11px] text-gray-500 font-mono">
                          Тираж: {c.codes.toLocaleString('ru-RU')} шт. ({c.count} заказов)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-[#111827]">
                          {c.revenue.toLocaleString('ru-RU')} ₸
                        </div>
                        <div className="text-[11px] font-bold text-emerald-600">
                          {c.percentage}% оборота
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Order Production Pipeline Funnel */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-extrabold text-[#111827]">
                  Воронка статусов заказов и производства
                </h3>
              </div>
              <span className="text-xs text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 font-bold">
                Активных в работе: {summary.activeOrders}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {analytics.statusFunnel.map((s) => (
                <div
                  key={s.key}
                  className={`p-3.5 rounded-2xl border text-center space-y-1 transition-all ${
                    s.key === 'COMPLETED'
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                      : s.key === 'CANCELLED'
                      ? 'bg-gray-50 border-gray-200 text-gray-500'
                      : s.count > 0
                      ? 'bg-blue-50/60 border-blue-200 text-blue-950'
                      : 'bg-gray-50 border-gray-200 text-gray-700'
                  }`}
                >
                  <div className="text-[11px] font-extrabold uppercase tracking-wider truncate">
                    {s.name}
                  </div>
                  <div className="text-2xl font-black">
                    {s.count}
                  </div>
                  <div className="text-[11px] font-mono text-gray-600 truncate">
                    {s.revenue.toLocaleString('ru-RU')} ₸
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Section: Top Clients & Leads Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Top 10 Clients Table (Span 2) */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-extrabold text-[#111827]">
                    Ключевые клиенты по объему выручки
                  </h3>
                </div>
                <Link
                  to="/users"
                  className="text-xs font-bold text-[#0082FB] hover:underline inline-flex items-center gap-1"
                >
                  Все клиенты ({summary.totalClientsAllTime}) <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {analytics.topClients.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">
                  В выбранном периоде нет заказов клиентов
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Организация</th>
                        <th className="py-2.5 px-3">БИН / ИИН</th>
                        <th className="py-2.5 px-3 text-center">Заказов</th>
                        <th className="py-2.5 px-3 text-right">Кодов</th>
                        <th className="py-2.5 px-3 text-right">Выручка</th>
                        <th className="py-2.5 px-3 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {analytics.topClients.map((cl, idx) => (
                        <tr key={cl.userId} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-3 font-bold text-[#111827] flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {idx + 1}
                            </span>
                            <span className="truncate max-w-[180px]">{cl.companyName}</span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-gray-700">
                            {cl.binIin}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-black">
                            {cl.ordersCount}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-gray-700">
                            {cl.totalCodes.toLocaleString('ru-RU')}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-emerald-600">
                            {cl.totalRevenue.toLocaleString('ru-RU')} ₸
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenClient(cl.userId)}
                              className="text-xs font-bold text-[#0082FB] hover:underline cursor-pointer"
                            >
                              Карточка
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Leads & Conversion Summary Card (Span 1) */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-[#111827]">
                  Воронка лидов и клиентской базы
                </h3>
              </div>

              <div className="space-y-4">
                <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-indigo-900">
                    <span>Заявок с сайта (лидов):</span>
                    <span className="text-base font-black">{analytics.leads.total}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-indigo-900">
                    <span>Успешно закрыто в работу:</span>
                    <span className="text-base font-black text-emerald-600">
                      {analytics.leads.completed}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-indigo-900">
                    <span>Конверсия заявок:</span>
                    <span className="text-base font-black text-indigo-600">
                      {analytics.leads.conversionRate}%
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                    <span>Новых регистраций за период:</span>
                    <span className="font-extrabold text-black">
                      +{summary.newClientsCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                    <span>Всего организаций в базе:</span>
                    <span className="font-extrabold text-black">
                      {summary.totalClientsAllTime}
                    </span>
                  </div>
                </div>

                <Link
                  to="/leads"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#111827] hover:bg-black text-white text-xs font-extrabold py-3 rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Перейти в реестр лидов <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

          </div>
        </>
      ) : null}

      {/* Client Detail Modal */}
      <ClientDetailModal
        userId={selectedUserId}
        isOpen={isClientModalOpen}
        onClose={handleCloseClient}
        onUserUpdated={() => refetch()}
      />
    </div>
  );
};
