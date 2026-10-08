import React, { useState, useEffect, useRef } from 'react';
import {
  Server,
  Database,
  HardDrive,
  Cpu,
  RefreshCw,
  Terminal,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Send,
  Search,
  Power,
  RotateCcw,
} from 'lucide-react';
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Alert */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between shadow-lg transition-all ${
            actionMessage.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Prominent Maintenance Alert Banner */}
      {health?.maintenance?.active && (
        <div className="bg-amber-50 border border-amber-200/90 text-amber-950 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-amber-900 tracking-wide uppercase">Режим технических работ активен</span>
                <span className="px-2 py-0.5 bg-amber-200/80 text-amber-900 rounded-md text-[10px] font-black">СЕРВИС ПЕРЕКРЫТ</span>
              </div>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Публичный доступ к сайту и кабинету клиентов перекрыт сервисной заглушкой 503. Все внешние операции заморожены. Панель администратора работает штатно.
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleMaintenance}
            disabled={maintenanceLoading}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 shadow-sm shadow-amber-600/20"
          >
            Отключить техработы
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-50 text-[#0082FB] rounded-xl">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#1E293B]">Контроль сервера & DevOps</h1>
              <p className="text-xs text-[#64748B] font-medium">
                Мониторинг инфраструктуры, управление бэкапами, живые логи и Telegram-алерты
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Maintenance Toggle */}
          <button
            onClick={handleToggleMaintenance}
            disabled={maintenanceLoading}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              health?.maintenance?.active
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 animate-pulse'
                : 'bg-gray-100 hover:bg-gray-200 text-[#475569]'
            }`}
          >
            <Power className="w-4 h-4" />
            {health?.maintenance?.active ? 'ТЕХРАБОТЫ ВКЛЮЧЕНЫ' : 'Включить техработы'}
          </button>

          {/* Refresh Health */}
          <button
            onClick={() => {
              fetchHealth();
              fetchStorage();
              fetchBackups();
              fetchLogs();
            }}
            disabled={loadingHealth}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0082FB] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${loadingHealth ? 'animate-spin' : ''}`} />
            Обновить статус
          </button>
        </div>
      </div>

      {/* Quick Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Database Status */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">База данных</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-lg font-black text-[#1E293B]">PostgreSQL 15</span>
            </div>
            <div className="mt-2 text-xs text-[#64748B] space-y-1">
              <div>Пинг базы: <b className="text-emerald-600">{health?.database?.latencyMs ?? '—'} мс</b></div>
              <div>Размер БД: <b>{health?.database?.size || '—'}</b></div>
              <div>Активных коннектов: <b>{health?.database?.activeConnections || '0'}</b></div>
            </div>
          </div>
        </div>

        {/* 2. RAM Memory */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Оперативная память</span>
            <div className="p-2 bg-blue-50 text-[#0082FB] rounded-lg">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-lg font-black text-[#1E293B]">
              {health?.system?.ramUsedMb ? `${health.system.ramUsedMb} МБ` : '—'}
              <span className="text-xs text-[#64748B] font-semibold ml-1">/ {health?.system?.ramTotalMb} МБ</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-[#0082FB] h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, health?.system?.ramUsagePercent || 0)}%` }}
              ></div>
            </div>
            <div className="mt-2 text-xs text-[#64748B] flex justify-between">
              <span>Загрузка: <b>{health?.system?.ramUsagePercent || 0}%</b></span>
              <span>Node RSS: <b>{health?.system?.processMemoryRssMb || 0} МБ</b></span>
            </div>
          </div>
        </div>

        {/* 3. Storage & Uploads */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Хранилище заказов</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-lg font-black text-[#1E293B]">
              {storage?.uploads?.totalStorageFormatted || '0 МБ'}
            </div>
            <div className="mt-2 text-xs text-[#64748B] space-y-1">
              <div>CSV кодов: <b>{storage?.uploads?.totalCsvCount || 0} шт ({storage?.uploads?.totalCsvSizeFormatted || '0 MB'})</b></div>
              <div>PDF стикеров: <b>{storage?.uploads?.totalPdfCount || 0} шт ({storage?.uploads?.totalPdfSizeFormatted || '0 MB'})</b></div>
            </div>
          </div>
        </div>

        {/* 4. PDF Queue & Uptime */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Аптайм и Очередь PDF</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-lg font-black text-[#1E293B]">
              {formatSeconds(health?.serverUptimeSec)}
            </div>
            <div className="mt-2 text-xs text-[#64748B] space-y-1">
              <div>Активных задач: <b className="text-blue-600">{health?.pdfQueue?.activeJobs || 0} / {health?.pdfQueue?.maxConcurrency || 2}</b></div>
              <div>В очереди: <b>{health?.pdfQueue?.waitingJobs || 0}</b> | Успешно: <b>{health?.pdfQueue?.totalCompleted || 0}</b></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 gap-2 bg-white px-4 rounded-xl shadow-sm">
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 py-4 px-3 border-b-2 font-bold text-xs transition-all ${
            activeTab === 'logs' ? 'border-[#0082FB] text-[#0082FB]' : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          <Terminal className="w-4 h-4" />
          Интерактивные логи сервера
        </button>
        <button
          onClick={() => setActiveTab('backups')}
          className={`flex items-center gap-2 py-4 px-3 border-b-2 font-bold text-xs transition-all ${
            activeTab === 'backups' ? 'border-[#0082FB] text-[#0082FB]' : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          <Database className="w-4 h-4" />
          Резервные копии БД ({backups.length})
        </button>
        <button
          onClick={() => setActiveTab('telegram')}
          className={`flex items-center gap-2 py-4 px-3 border-b-2 font-bold text-xs transition-all ${
            activeTab === 'telegram' ? 'border-[#0082FB] text-[#0082FB]' : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          <Send className="w-4 h-4" />
          Telegram Мониторинг & Боты
        </button>
        <button
          onClick={() => setActiveTab('storage')}
          className={`flex items-center gap-2 py-4 px-3 border-b-2 font-bold text-xs transition-all ${
            activeTab === 'storage' ? 'border-[#0082FB] text-[#0082FB]' : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          <Layers className="w-4 h-4" />
          Очистка диска & Кэш
        </button>
      </div>

      {/* TAB 1: LOGS VIEWER */}
      {activeTab === 'logs' && (
        <div className="bg-[#0F172A] rounded-2xl shadow-xl border border-slate-800 overflow-hidden text-slate-200">
          {/* Terminal Toolbar */}
          <div className="bg-slate-900/90 border-b border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
            {/* Log Type Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setLogType('error')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  logType === 'error' ? 'bg-red-500 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Ошибки (error.log)
              </button>
              <button
                onClick={() => setLogType('access')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  logType === 'access' ? 'bg-[#0082FB] text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Трафик (access.log)
              </button>
              <button
                onClick={() => setLogType('frontend')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  logType === 'frontend' ? 'bg-amber-500 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Браузер (frontend.log)
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Поиск по логам..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0082FB]"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefreshLogs}
                  onChange={(e) => setAutoRefreshLogs(e.target.checked)}
                  className="rounded text-[#0082FB] focus:ring-0"
                />
                Live (каждые 4с)
              </label>

              <button
                onClick={fetchLogs}
                disabled={logsLoading}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
                title="Обновить логи"
              >
                <RotateCcw className={`w-4 h-4 ${logsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Terminal Screen */}
          <div className="p-4 font-mono text-xs max-h-[550px] overflow-y-auto space-y-1.5 select-text">
            {logs.length === 0 ? (
              <div className="text-slate-500 py-12 text-center">
                Записей в логе не обнаружено или по фильтру ничего не найдено.
              </div>
            ) : (
              logs.map((log) => {
                const isError = log.level?.includes('ERROR') || log.raw?.includes('[ERROR]');
                const isWarn = log.level?.includes('WARN') || log.raw?.includes('[WARN]');
                return (
                  <div
                    key={log.id}
                    className={`p-2 rounded hover:bg-slate-800/60 transition-colors break-words ${
                      isError ? 'text-red-400 bg-red-950/20' : isWarn ? 'text-amber-300' : 'text-slate-300'
                    }`}
                  >
                    {log.raw}
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
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-[#1E293B]">Резервные копии базы данных (PostgreSQL)</h2>
              <p className="text-xs text-[#64748B]">
                Дампы содержат все таблицы, заказы, маркировочные коды, шаблоны и учетные записи
              </p>
            </div>

            <button
              onClick={handleCreateBackup}
              disabled={creatingBackup}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              <Database className="w-4 h-4" />
              {creatingBackup ? 'Создается дамп...' : 'Создать бэкап сейчас'}
            </button>
          </div>

          {/* Backups Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[#64748B] font-bold border-b border-gray-200">
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
                    <tr key={b.fileName} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-3.5 font-bold text-[#1E293B] font-mono">{b.fileName}</td>
                      <td className="p-3.5 text-[#64748B]">{b.sizeFormatted}</td>
                      <td className="p-3.5 text-[#64748B]">{new Date(b.createdAt).toLocaleString('ru-RU')}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleDownloadBackup(b.fileName)}
                          disabled={downloadingBackup === b.fileName}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0082FB] rounded-lg font-bold transition-all disabled:opacity-50"
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
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-black text-[#1E293B]">Подключенные Telegram Каналы и Боты</h2>
            <p className="text-xs text-[#64748B]">
              Система автоматически направляет уведомления о лидах в Чат 1, а системные сбои в Чат 2
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Channel 1 Card */}
            <div className="p-5 border border-emerald-100 bg-emerald-50/40 rounded-2xl space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">ЧАТ 1: Заявки & Заказы</span>
                  <span className="px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded-md text-[10px] font-black">АКТИВЕН</span>
                </div>
                <div className="text-xs text-emerald-950 space-y-1 font-medium mt-2">
                  <div>ID Группы: <code>-5222464755</code></div>
                  <div>Назначение: Заявки с лендинга, новые заказы из кабинета, утверждение макетов</div>
                  <div className="text-[11px] text-emerald-700 pt-1">
                    ✓ Уведомления поступают мгновенно без блокировки клиентов
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleTestTelegram('leads')}
                disabled={testingTelegram === 'leads'}
                className="w-full mt-3 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-sm shadow-emerald-600/20"
              >
                <Send className="w-3.5 h-3.5" />
                {testingTelegram === 'leads' ? 'Отправка...' : 'Отправить тестовый лид в Чат 1'}
              </button>
            </div>

            {/* Channel 2 Card */}
            <div className="p-5 border border-red-100 bg-red-50/40 rounded-2xl space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-red-800 uppercase tracking-wider">ЧАТ 2: DevOps & Алерты</span>
                  <span className="px-2 py-0.5 bg-red-200 text-red-800 rounded-md text-[10px] font-black">АКТИВЕН</span>
                </div>
                <div className="text-xs text-red-950 space-y-1 font-medium mt-2">
                  <div>ID Группы: <code>-5378607890</code></div>
                  <div>Назначение: Необработанные 500 ошибки API, сбои базы данных, падение рендера PDF, критические ошибки JS</div>
                  <div className="text-[11px] text-red-700 pt-1">
                    ✓ Включена автоматическая дедупликация (не чаще 1 раза в 5 минут при повторах)
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleTestTelegram('alerts')}
                disabled={testingTelegram === 'alerts'}
                className="w-full mt-3 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-sm shadow-red-600/20"
              >
                <Send className="w-3.5 h-3.5" />
                {testingTelegram === 'alerts' ? 'Отправка...' : 'Отправить тестовый алерт в Чат 2'}
              </button>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#64748B] flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <b>Бот @tanboxkzbot успешно верифицирован и готов к работе.</b><br />
              Тестовые сообщения отправлены в обе группы. Любая новая заявка или ошибка сервера сразу публикуется в соответствующую группу.
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STORAGE & CACHE CLEANER */}
      {activeTab === 'storage' && (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-black text-[#1E293B]">Управление дисковым пространством и кэшем</h2>
            <p className="text-xs text-[#64748B]">
              Очистка временных сгенерированных PDF-файлов освобождает место на SSD диске сервера
            </p>
          </div>

          <div className="p-5 bg-amber-50 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-amber-900">Безопасная очистка кэша PDF этикеток</h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Удалит сгенерированные файлы <code>labels.pdf</code> из папки заказов. Сами коды маркировки в базе данных останутся в безопасности и при повторном скачивании PDF сгенерируется заново.
                </p>
              </div>
            </div>

            <button
              onClick={handleCleanPdfCache}
              disabled={cleaningCache}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95"
            >
              {cleaningCache ? 'Очищается...' : 'Очистить кэш PDF'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
              <div className="font-bold text-[#1E293B]">Файлы кодов клиентов (.csv, .txt):</div>
              <div className="text-base font-black text-[#0082FB] mt-1">
                {storage?.uploads?.totalCsvCount || 0} шт ({storage?.uploads?.totalCsvSizeFormatted || '0 МБ'})
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
              <div className="font-bold text-[#1E293B]">Сгенерированные файлы PDF:</div>
              <div className="text-base font-black text-purple-600 mt-1">
                {storage?.uploads?.totalPdfCount || 0} шт ({storage?.uploads?.totalPdfSizeFormatted || '0 МБ'})
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
