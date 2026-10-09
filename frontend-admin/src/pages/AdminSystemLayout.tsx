import React, { useState, useEffect } from 'react';
import {
  Database,
  HardDrive,
  Cpu,
  RefreshCw,
  Power,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import { PageHeader } from '@shared';
import { apiClient } from '../api/client';
import { SystemNav } from '../components/system/SystemNav';

export interface SystemOutletContext {
  health: any;
  storage: any;
  refreshSystem: () => Promise<void>;
  showToast: (text: string, type?: 'success' | 'error') => void;
}

export const AdminSystemLayout: React.FC = () => {
  // Telemetry state
  const [health, setHealth] = useState<any>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Storage state
  const [storage, setStorage] = useState<any>(null);

  // Maintenance state
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

  // Status toast message
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 5000);
  };

  // 1. Fetch Health
  const fetchHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await apiClient.get('/system/health');
      setHealth(res.data);
    } catch (err: any) {
      showToast('Ошибка загрузки статуса системы', 'error');
    } finally {
      setLoadingHealth(false);
    }
  };

  // 2. Fetch Storage Analysis
  const fetchStorage = async () => {
    try {
      const res = await apiClient.get('/system/storage');
      setStorage(res.data);
    } catch (err) {}
  };

  const refreshSystem = async () => {
    await Promise.all([fetchHealth(), fetchStorage()]);
  };

  useEffect(() => {
    fetchHealth();
    fetchStorage();
  }, []);

  const handleToggleMaintenance = async () => {
    const nextState = !health?.maintenance?.active;
    const confirmMsg = nextState
      ? 'Включить режим регламентных технических работ? Клиенты увидят сервисную страницу-заглушку.'
      : 'Отключить режим техработ и открыть сайт для всех клиентов?';

    if (!window.confirm(confirmMsg)) return;

    setMaintenanceLoading(true);
    try {
      const res = await apiClient.post('/system/maintenance', { active: nextState });
      showToast(res.data.message || 'Режим обновлен');
      fetchHealth();
    } catch (err) {
      showToast('Ошибка переключения режима техработ', 'error');
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const formatSeconds = (sec?: number) => {
    if (!sec) return '—';
    const d = Math.floor(sec / (3600 * 24));
    const h = Math.floor((sec % (3600 * 24)) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (d > 0) return `${d} дн. ${h} ч. ${m} мин.`;
    if (h > 0) return `${h} ч. ${m} мин.`;
    return `${m} мин.`;
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Toast Alert */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs transition-all ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="opacity-70 hover:opacity-100 cursor-pointer">✕</button>
        </div>
      )}

      {/* Prominent Maintenance Alert Banner */}
      {health?.maintenance?.active && (
        <div className="bg-amber-50 border border-amber-200 text-amber-950 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs text-amber-900 tracking-wide uppercase">Режим технических работ активен</span>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md text-[10px] font-black">СЕРВИС ПЕРЕКРЫТ</span>
              </div>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Публичный доступ к сайту и кабинету клиентов перекрыт сервисной заглушкой 503. Все внешние операции заморожены. Панель администратора работает штатно.
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleMaintenance}
            disabled={maintenanceLoading}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 shadow-xs cursor-pointer"
          >
            Отключить техработы
          </button>
        </div>
      )}

      {/* Standard Admin PageHeader */}
      <PageHeader
        title="Контроль сервера & DevOps"
        description="Мониторинг инфраструктуры, управление бэкапами, системные логи, Telegram-алерты и очередь воркеров"
        action={
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleToggleMaintenance}
              disabled={maintenanceLoading}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                health?.maintenance?.active
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 shadow-2xs'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {health?.maintenance?.active ? 'Отключить техработы' : 'Включить техработы'}
            </button>

            <button
              type="button"
              onClick={refreshSystem}
              disabled={loadingHealth}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0082FB] hover:bg-[#0070DA] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin' : ''}`} />
              Обновить статус
            </button>
          </div>
        }
      />

      {/* 4 Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Database Status */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">База данных</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-xl font-extrabold text-[#111827]">PostgreSQL 15</span>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-[#64748B] space-y-1">
              <div className="flex justify-between">
                <span>Пинг базы:</span>
                <span className="font-bold text-emerald-600">{health?.database?.latencyMs ?? '—'} мс</span>
              </div>
              <div className="flex justify-between">
                <span>Размер БД:</span>
                <span className="font-bold text-[#111827]">{health?.database?.size || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>Коннекты:</span>
                <span className="font-bold text-[#111827]">{health?.database?.activeConnections || '0'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. RAM Memory */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Оперативная память</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0082FB]">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-[#111827]">
              {health?.system?.ramUsedMb ? `${health.system.ramUsedMb} МБ` : '—'}
              <span className="text-xs text-[#64748B] font-medium ml-1">/ {health?.system?.ramTotalMb || 0} МБ</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div
                className="bg-[#0082FB] h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min(100, health?.system?.ramUsagePercent || 0)}%` }}
              ></div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-[#64748B] space-y-1">
              <div className="flex justify-between">
                <span>Загрузка:</span>
                <span className="font-bold text-[#111827]">{health?.system?.ramUsagePercent || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span>Node RSS:</span>
                <span className="font-bold text-[#111827]">{health?.system?.processMemoryRssMb || 0} МБ</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Storage & Uploads */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Хранилище заказов</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-[#111827]">
              {storage?.uploads?.totalStorageFormatted || '0 МБ'}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-[#64748B] space-y-1">
              <div className="flex justify-between">
                <span>CSV кодов:</span>
                <span className="font-bold text-[#111827]">
                  {storage?.uploads?.totalCsvCount || 0} шт ({storage?.uploads?.totalCsvSizeFormatted || '0 MB'})
                </span>
              </div>
              <div className="flex justify-between">
                <span>PDF стикеров:</span>
                <span className="font-bold text-[#111827]">
                  {storage?.uploads?.totalPdfCount || 0} шт ({storage?.uploads?.totalPdfSizeFormatted || '0 MB'})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. PDF Queue & Uptime */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Аптайм и Очередь PDF</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-[#111827]">
              {formatSeconds(health?.serverUptimeSec)}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-[#64748B] space-y-1">
              <div className="flex justify-between">
                <span>Активных задач:</span>
                <span className="font-bold text-[#0082FB]">
                  {health?.pdfQueue?.activeJobs || 0} / {health?.pdfQueue?.maxConcurrency || 2}
                </span>
              </div>
              <div className="flex justify-between">
                <span>В очереди / Готово:</span>
                <span className="font-bold text-[#111827]">
                  {health?.pdfQueue?.waitingJobs || 0} / {health?.pdfQueue?.totalCompleted || 0}
                </span>
              </div>
              <div className="pt-2">
                <Link
                  to="/system/pdf-queue"
                  className="text-xs text-[#0082FB] hover:underline font-bold inline-flex items-center gap-1"
                >
                  Перейти в Очередь PDF & Задачи →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <SystemNav />

      {/* Active Subpage Content */}
      <Outlet context={{ health, storage, refreshSystem, showToast }} />
    </div>
  );
};

export default AdminSystemLayout;
