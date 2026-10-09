import React, { useState, useEffect, useRef } from 'react';
import { Search, RotateCcw, Trash2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { SystemOutletContext } from '../AdminSystemLayout';

export const AdminSystemLogsPage: React.FC = () => {
  const { showToast } = useOutletContext<SystemOutletContext>();
  const [logType, setLogType] = useState<'error' | 'access' | 'frontend'>('error');
  const [logSearch, setLogSearch] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);
  const [autoRefreshLogs, setAutoRefreshLogs] = useState(false);
  const [fileSize, setFileSize] = useState<string>('');
  const [totalLines, setTotalLines] = useState<number>(0);
  const logsBottomRef = useRef<HTMLDivElement>(null);

  // Formatter for Almaty Time (Asia/Almaty, UTC+5)
  const formatAlmatyTime = (rawTimestamp: string): string => {
    if (!rawTimestamp) return '';
    const clean = rawTimestamp.replace(/[\[\]]/g, '').trim();
    const date = new Date(clean);
    if (isNaN(date.getTime())) {
      return rawTimestamp;
    }
    return new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Asia/Almaty',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await apiClient.get(`/logs/system?type=${logType}&limit=150&search=${encodeURIComponent(logSearch)}`);
      setLogs(res.data.logs || []);
      setFileSize(res.data.fileSizeFormatted || '');
      setTotalLines(res.data.totalLines || 0);
    } catch (err) {
      console.error('Ошибка чтения системных логов', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleClearLogs = async () => {
    const fileLabel =
      logType === 'error'
        ? 'ошибок (error.log)'
        : logType === 'access'
        ? 'трафика (access.log)'
        : 'браузера (frontend.log)';

    if (!window.confirm(`Вы уверены, что хотите полностью очистить лог ${fileLabel}? Это действие необратимо.`)) {
      return;
    }

    setClearingLogs(true);
    try {
      const res = await apiClient.post('/logs/system/clear', { type: logType });
      showToast(res.data?.message || 'Лог успешно очищен', 'success');
      await fetchLogs();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Ошибка очистки логов', 'error');
    } finally {
      setClearingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [logType]);

  useEffect(() => {
    if (!autoRefreshLogs) return;
    const interval = setInterval(() => {
      fetchLogs();
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRefreshLogs, logType, logSearch]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden w-full">
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

        {fileSize && (
          <div className="text-[11px] text-gray-500 font-medium hidden sm:inline">
            Размер: <strong className="text-gray-700 font-mono">{fileSize}</strong> ({totalLines} строк)
          </div>
        )}

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

        {/* Controls: Live, Clear, Refresh */}
        <div className="flex items-center gap-2.5">
          <label className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefreshLogs}
              onChange={(e) => setAutoRefreshLogs(e.target.checked)}
              className="rounded border-gray-300 text-[#0082FB] focus:ring-0 cursor-pointer"
            />
            Live (4с)
          </label>

          <button
            type="button"
            onClick={handleClearLogs}
            disabled={clearingLogs || logsLoading || logs.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40 shadow-2xs"
            title={`Очистить файл логов ${logType}.log`}
          >
            <Trash2 className={`w-3.5 h-3.5 ${clearingLogs ? 'animate-spin' : ''}`} />
            <span>Очистить лог</span>
          </button>

          <button
            type="button"
            onClick={fetchLogs}
            disabled={logsLoading}
            className="p-2 bg-white hover:bg-gray-100 text-gray-600 border border-gray-300 rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Обновить логи"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Clean Terminal Viewport */}
      <div className="bg-[#0B1120] p-4 sm:p-5 font-mono text-[11px] leading-relaxed min-h-[550px] max-h-[750px] overflow-y-auto space-y-1.5 select-text w-full">
        {logs.length === 0 ? (
          <div className="text-slate-500 py-20 text-center font-sans text-xs space-y-2">
            <p className="text-sm font-semibold text-slate-400">
              {logsLoading ? 'Загрузка системных логов...' : 'Лог чист — записей не обнаружено.'}
            </p>
            <p className="text-[11px] text-slate-500">
              Новые ошибки или запросы появятся здесь автоматически в реальном времени.
            </p>
          </div>
        ) : (
          logs.map((log) => {
            const raw = log.raw || '';
            const isError = log.level?.includes('ERROR') || raw.includes('[ERROR]') || raw.includes('[FRONTEND-ERROR]');
            const isWarn = log.level?.includes('WARN') || raw.includes('[WARN]');

            // Match timestamp: [2026-10-08T12:28:45.242Z] or 2026-10-08T12:28:45.242Z
            const match = raw.match(/^\[?(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[^\]\s]*)\]?\s*(\[[^\]]+\])?\s*(.*)$/s);

            if (match) {
              const rawTimestamp = match[1];
              const tag = match[2];
              const message = match[3];
              const almatyTime = formatAlmatyTime(rawTimestamp);

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
                  <span className="text-slate-400 font-bold shrink-0 select-none bg-slate-800/90 border border-slate-700/80 px-1.5 py-0.5 rounded text-[10px]" title={`UTC: ${rawTimestamp} | Алматы: ${almatyTime}`}>
                    {almatyTime}
                  </span>
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
  );
};

export default AdminSystemLogsPage;
