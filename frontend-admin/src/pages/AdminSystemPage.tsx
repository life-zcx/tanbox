import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  HardDrive,
  Cpu,
  RefreshCw,
  Terminal,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Send,
  Search,
  Power,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@shared';
import { apiClient } from '../api/client';

export const AdminSystemPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'logs' | 'backups' | 'telegram' | 'storage'>('logs');

  // Telemetry state
  const [health, setHealth] = useState<any>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Storage state
  const [storage, setStorage] = useState<any>(null);
  const [cleaningCache, setCleaningCache] = useState(false);

  // Logs state
  const [logType, setLogType] = useState<'error' | 'access' | 'frontend'>('error');
  const [logSearch, setLogSearch] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [autoRefreshLogs, setAutoRefreshLogs] = useState(false);
  const logsBottomRef = useRef<HTMLDivElement>(null);

  // Backups state
  const [backups, setBackups] = useState<any[]>([]);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [downloadingBackup, setDownloadingBackup] = useState<string | null>(null);

  // Maintenance state
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

  // Telegram test state
  const [testingTelegram, setTestingTelegram] = useState<string | null>(null);

  // Status message
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

  // 3. Fetch Logs
  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await apiClient.get(`/logs/system?type=${logType}&limit=150&search=${encodeURIComponent(logSearch)}`);
      setLogs(res.data.logs || []);
    } catch (err) {
      showToast('Ошибка чтения системных логов', 'error');
    } finally {
      setLogsLoading(false);
    }
  };

  // 4. Fetch Backups
  const fetchBackups = async () => {
    try {
      const res = await apiClient.get('/system/backups');
      setBackups(res.data.backups || []);
    } catch (err) {}
  };

  useEffect(() => {
    fetchHealth();
    fetchStorage();
    fetchBackups();
    fetchLogs();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [logType]);

  // Live log polling if enabled
  useEffect(() => {
    if (!autoRefreshLogs) return;
    const interval = setInterval(() => {
      fetchLogs();
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRefreshLogs, logType, logSearch]);

  // 5. Actions
  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const res = await apiClient.post('/system/backups');
      showToast(`Бэкап ${res.data.backup?.fileName} успешно создан!`);
      fetchBackups();
    } catch (err: any) {
      showToast('Ошибка создания бэкапа базы данных', 'error');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleDownloadBackup = async (fileName: string) => {
    setDownloadingBackup(fileName);
    try {
      const res = await apiClient.get(`/system/backups/${encodeURIComponent(fileName)}/download`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/sql' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast(`Бэкап ${fileName} успешно скачан!`);
    } catch (err: any) {
      showToast('Ошибка скачивания файла бэкапа', 'error');
    } finally {
      setDownloadingBackup(null);
    }
  };

  const handleCleanPdfCache = async () => {
    if (!window.confirm('Очистить сгенерированные кэш-файлы PDF на сервере? Исходные коды в базе данных останутся нетронутыми.')) {
      return;
    }
    setCleaningCache(true);
    try {
      const res = await apiClient.post('/system/storage/clean-cache');
      showToast(res.data.message || 'Кэш успешно очищен');
      fetchStorage();
    } catch (err) {
      showToast('Ошибка очистки кэша', 'error');
    } finally {
      setCleaningCache(false);
    }
  };

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

  const handleTestTelegram = async (channel: 'leads' | 'alerts') => {
    setTestingTelegram(channel);
    try {
      const res = await apiClient.post('/system/telegram/test', { channel });
      showToast(res.data.message || 'Тестовое уведомление успешно отправлено в Telegram!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Ошибка отправки тестового уведомления', 'error');
    } finally {
      setTestingTelegram(null);
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
    <div className="space-y-6">
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
        description="Мониторинг инфраструктуры, управление бэкапами, системные логи и Telegram-алерты"
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
              onClick={() => {
                fetchHealth();
                fetchStorage();
                fetchBackups();
                fetchLogs();
              }}
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
                  to="/pdf-queue"
                  className="text-xs text-[#0082FB] hover:underline font-bold inline-flex items-center gap-1"
                >
                  Перейти в Очередь PDF & Задачи →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Standard Admin Tabs Navigation */}
      <div className="flex border-b border-gray-200 gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'logs'
              ? 'border-[#0082FB] text-[#0082FB] font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
          }`}
        >
          <Terminal className="w-4 h-4" />
          Системные логи
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('backups')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'backups'
              ? 'border-[#0082FB] text-[#0082FB] font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
          }`}
        >
          <Database className="w-4 h-4" />
          Резервные копии БД {backups.length > 0 && `(${backups.length})`}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('telegram')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'telegram'
              ? 'border-[#0082FB] text-[#0082FB] font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
          }`}
        >
          <Send className="w-4 h-4" />
          Telegram Мониторинг
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('storage')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'storage'
              ? 'border-[#0082FB] text-[#0082FB] font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          Очистка диска и кэш
        </button>
      </div>

      {/* TAB 1: LOGS VIEWER */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          {/* Controls Bar */}
          <div className="bg-gray-50/80 border-b border-gray-200 p-3.5 flex flex-wrap items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-gray-200/60 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setLogType('error')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  logType === 'error' ? 'bg-white text-rose-600 shadow-2xs font-extrabold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Ошибки (error.log)
              </button>
              <button
                type="button"
                onClick={() => setLogType('access')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  logType === 'access' ? 'bg-white text-[#0082FB] shadow-2xs font-extrabold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Трафик (access.log)
              </button>
              <button
                type="button"
                onClick={() => setLogType('frontend')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  logType === 'frontend' ? 'bg-white text-amber-600 shadow-2xs font-extrabold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Браузер (frontend.log)
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск по строкам лога..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
                className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0082FB]"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoRefreshLogs}
                  onChange={(e) => setAutoRefreshLogs(e.target.checked)}
                  className="rounded border-gray-300 text-[#0082FB] focus:ring-0 cursor-pointer"
                />
                Live (каждые 4с)
              </label>

              <button
                type="button"
                onClick={fetchLogs}
                disabled={logsLoading}
                className="p-2 bg-white hover:bg-gray-100 text-gray-600 border border-gray-300 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                title="Обновить логи"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Clean Terminal Viewport */}
          <div className="bg-[#0B1120] p-4 font-mono text-[11px] leading-relaxed max-h-[550px] overflow-y-auto space-y-1.5 select-text">
            {logs.length === 0 ? (
              <div className="text-slate-500 py-14 text-center font-sans text-xs">
                {logsLoading ? 'Загрузка системных логов...' : 'Записей в логе не обнаружено или по фильтру ничего не найдено.'}
              </div>
            ) : (
              logs.map((log) => {
                const raw = log.raw || '';
                const isError = log.level?.includes('ERROR') || raw.includes('[ERROR]') || raw.includes('[FRONTEND-ERROR]');
                const isWarn = log.level?.includes('WARN') || raw.includes('[WARN]');

                // Try extracting [timestamp] [tag] message
                const match = raw.match(/^(\[[^\]]+\])\s*(\[[^\]]+\])?\s*(.*)$/s);

                if (match) {
                  const timestamp = match[1];
                  const tag = match[2];
                  const message = match[3];

                  return (
                    <div
                      key={log.id}
                      className={`p-2 rounded-lg font-mono text-[11px] leading-relaxed transition-colors break-words flex flex-wrap items-start gap-2 ${
                        isError
                          ? 'bg-rose-500/10 text-rose-200 hover:bg-rose-500/15'
                          : isWarn
                          ? 'bg-amber-500/10 text-amber-200 hover:bg-amber-500/15'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="text-slate-500 shrink-0 select-none">{timestamp}</span>
                      {tag && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 uppercase select-none ${
                            isError
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : isWarn
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {tag.replace(/[\[\]]/g, '')}
                        </span>
                      )}
                      <span className="flex-1 font-mono break-all">{message}</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={log.id}
                    className={`p-2 rounded-lg font-mono text-[11px] leading-relaxed transition-colors break-words ${
                      isError
                        ? 'bg-rose-500/10 text-rose-200 hover:bg-rose-500/15'
                        : isWarn
                        ? 'bg-amber-500/10 text-amber-200 hover:bg-amber-500/15'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    {raw}
                  </div>
                );
              })
            )}
            <div ref={logsBottomRef} />
          </div>
        </div>
      )}

      {/* TAB 2: BACKUPS */}
      {activeTab === 'backups' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-extrabold text-[#111827]">Резервные копии базы данных (PostgreSQL)</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Дампы содержат все таблицы: заказы, маркировочные коды, шаблоны и учетные записи пользователей
              </p>
            </div>

            <button
              type="button"
              onClick={handleCreateBackup}
              disabled={creatingBackup}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Database className="w-3.5 h-3.5" />
              {creatingBackup ? 'Создается дамп...' : 'Создать бэкап сейчас'}
            </button>
          </div>

          {/* Backups Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[#64748B] font-extrabold uppercase text-[11px] tracking-wider border-b border-gray-200">
                <tr>
                  <th className="p-3.5">Имя архива</th>
                  <th className="p-3.5">Размер файла</th>
                  <th className="p-3.5">Дата создания</th>
                  <th className="p-3.5 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {backups.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[#64748B]">
                      Архивов бэкапов пока нет. Нажмите «Создать бэкап сейчас» для создания первого дампа.
                    </td>
                  </tr>
                ) : (
                  backups.map((b) => (
                    <tr key={b.fileName} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3.5 font-bold text-[#111827] font-mono">{b.fileName}</td>
                      <td className="p-3.5 text-[#64748B]">{b.sizeFormatted}</td>
                      <td className="p-3.5 text-[#64748B]">{new Date(b.createdAt).toLocaleString('ru-RU')}</td>
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDownloadBackup(b.fileName)}
                          disabled={downloadingBackup === b.fileName}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0082FB] border border-blue-200/60 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Download className={`w-3.5 h-3.5 ${downloadingBackup === b.fileName ? 'animate-bounce' : ''}`} />
                          {downloadingBackup === b.fileName ? 'Скачивание...' : 'Скачать .sql'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TELEGRAM MONITORING */}
      {activeTab === 'telegram' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-sm font-extrabold text-[#111827]">Подключенные Telegram Каналы и Боты</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Система автоматически направляет уведомления о лидах в Чат 1, а системные сбои в Чат 2
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Channel 1 Card */}
            <div className="p-5 border border-gray-200 bg-white rounded-2xl space-y-3 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#111827] uppercase tracking-wider">ЧАТ 1: Заявки & Заказы</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-extrabold">АКТИВЕН</span>
                </div>
                <div className="text-xs text-gray-700 space-y-1 font-medium mt-3">
                  <div>ID Группы: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-900 font-mono">-5222464755</code></div>
                  <div className="text-[#64748B] pt-1">Назначение: Заявки с лендинга, новые заказы из кабинета, утверждение макетов</div>
                  <div className="text-[11px] text-emerald-700 pt-1 font-semibold">
                    ✓ Уведомления поступают мгновенно без задержек
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleTestTelegram('leads')}
                disabled={testingTelegram === 'leads'}
                className="w-full mt-3 py-2 px-3 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                <Send className="w-3.5 h-3.5 text-[#0082FB]" />
                {testingTelegram === 'leads' ? 'Отправка...' : 'Отправить тестовый лид в Чат 1'}
              </button>
            </div>

            {/* Channel 2 Card */}
            <div className="p-5 border border-gray-200 bg-white rounded-2xl space-y-3 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#111827] uppercase tracking-wider">ЧАТ 2: DevOps & Алерты</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-extrabold">АКТИВЕН</span>
                </div>
                <div className="text-xs text-gray-700 space-y-1 font-medium mt-3">
                  <div>ID Группы: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-900 font-mono">-5378607890</code></div>
                  <div className="text-[#64748B] pt-1">Назначение: Ошибки 500 API, сбои базы данных, падение рендера PDF</div>
                  <div className="text-[11px] text-[#64748B] pt-1">
                    ✓ Авто-дедупликация повторов (не чаще 1 раза в 5 мин)
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleTestTelegram('alerts')}
                disabled={testingTelegram === 'alerts'}
                className="w-full mt-3 py-2 px-3 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                <Send className="w-3.5 h-3.5 text-rose-600" />
                {testingTelegram === 'alerts' ? 'Отправка...' : 'Отправить тестовый алерт в Чат 2'}
              </button>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#64748B] flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#111827]">Бот @tanboxkzbot верифицирован и готов к работе.</span>
              <p className="mt-0.5">Тестовые сообщения отправлены в обе группы. Любая новая заявка или сбой сервера моментально публикуется в соответствующую группу.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STORAGE & CACHE CLEANER */}
      {activeTab === 'storage' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-sm font-extrabold text-[#111827]">Управление дисковым пространством и кэшем</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Очистка временных сгенерированных PDF-файлов освобождает место на SSD сервере
            </p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-extrabold text-amber-900">Безопасная очистка кэша PDF этикеток</h4>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                  Удалит сгенерированные файлы <code>labels.pdf</code> из папки заказов. Сами коды маркировки в базе данных останутся в безопасности и при повторном скачивании PDF сгенерируется заново.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCleanPdfCache}
              disabled={cleaningCache}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              {cleaningCache ? 'Очищается...' : 'Очистить кэш PDF'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
              <div className="font-bold text-[#111827]">Файлы кодов клиентов (.csv, .txt):</div>
              <div className="text-base font-extrabold text-[#0082FB] mt-1">
                {storage?.uploads?.totalCsvCount || 0} шт ({storage?.uploads?.totalCsvSizeFormatted || '0 МБ'})
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
              <div className="font-bold text-[#111827]">Сгенерированные файлы PDF:</div>
              <div className="text-base font-extrabold text-purple-600 mt-1">
                {storage?.uploads?.totalPdfCount || 0} шт ({storage?.uploads?.totalPdfSizeFormatted || '0 МБ'})
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

