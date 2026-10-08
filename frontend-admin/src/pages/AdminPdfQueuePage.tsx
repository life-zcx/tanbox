import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Sliders,
  CheckCircle,
  XCircle,
  Loader2,
  ListOrdered,
  Layers,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@shared';
import { apiClient } from '../api/client';

export const AdminPdfQueuePage: React.FC = () => {
  const [pdfQueueData, setPdfQueueData] = useState<any>(null);
  const [pdfQueueLoading, setPdfQueueLoading] = useState(false);
  const [settingConcurrency, setSettingConcurrency] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 5000);
  };

  const fetchPdfQueue = async () => {
    setPdfQueueLoading(true);
    try {
      const res = await apiClient.get('/orders/queue/status');
      setPdfQueueData(res.data);
    } catch (err: any) {
      console.error('Failed to fetch pdf queue status', err);
    } finally {
      setPdfQueueLoading(false);
    }
  };

  const handleSetConcurrency = async (val: number) => {
    setSettingConcurrency(true);
    try {
      const res = await apiClient.post('/orders/queue/concurrency', { concurrency: val });
      setPdfQueueData(res.data);
      showToast(`Лимит параллельных потоков изменён на ${val}`);
    } catch (err: any) {
      showToast('Не удалось обновить лимит потоков', 'error');
    } finally {
      setSettingConcurrency(false);
    }
  };

  useEffect(() => {
    fetchPdfQueue();
    const interval = setInterval(fetchPdfQueue, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast notification */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Очередь PDF & Задачи"
        description="Мониторинг фоновой генерации партий этикеток и управление нагрузкой на воркеры"
        action={
          <div className="flex flex-wrap items-center gap-3">
            {/* Concurrency Selector */}
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
              <span className="text-[11px] font-bold text-gray-500 px-2 flex items-center gap-1">
                <Sliders className="w-3 h-3" /> Воркеры:
              </span>
              {[1, 2, 4].map((cnt) => {
                const isActive = (pdfQueueData?.maxConcurrency || 2) === cnt;
                return (
                  <button
                    key={cnt}
                    type="button"
                    disabled={settingConcurrency}
                    onClick={() => handleSetConcurrency(cnt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#0082FB] text-white shadow-2xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                    }`}
                  >
                    {cnt} {cnt === 1 ? 'поток' : 'потока'}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={fetchPdfQueue}
              disabled={pdfQueueLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${pdfQueueLoading ? 'animate-spin text-[#0082FB]' : ''}`} />
              Обновить
            </button>
          </div>
        }
      />

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
            Активных воркеров
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#0082FB]">
              {pdfQueueData?.activeJobs || 0}
            </span>
            <span className="text-xs font-bold text-gray-500">
              / {pdfQueueData?.maxConcurrency || 2} максимум
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Рендерятся прямо сейчас</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
            В очереди ожидания
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${(pdfQueueData?.waitingJobs || 0) > 0 ? 'text-amber-600' : 'text-[#111827]'}`}>
              {pdfQueueData?.waitingJobs || 0}
            </span>
            <span className="text-xs text-gray-500 font-bold">задач</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Ожидают свободный воркер</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
            Успешно выполнено
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">
              {pdfQueueData?.totalCompleted || 0}
            </span>
            <span className="text-xs text-gray-500 font-bold">файлов</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">С момента запуска сервера</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
            Сбоев / Ошибок
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${(pdfQueueData?.totalFailed || 0) > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
              {pdfQueueData?.totalFailed || 0}
            </span>
            <span className="text-xs text-gray-500 font-bold">инцидентов</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Ошибки парсинга / лимитов</p>
        </div>
      </div>

      {/* ACTIVE GENERATIONS SECTION */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${(pdfQueueData?.activeJobs || 0) > 0 ? 'bg-blue-500 animate-ping' : 'bg-emerald-500'}`} />
            <h3 className="text-xs font-extrabold text-[#111827] uppercase tracking-wider">
              Текущие активные генерации ({(pdfQueueData?.activeList || []).length})
            </h3>
          </div>
          <span className="text-[11px] text-gray-400">Автообновление каждые 2.5 сек</span>
        </div>

        {(!pdfQueueData?.activeList || pdfQueueData.activeList.length === 0) ? (
          <div className="p-8 text-center bg-gray-50/60 rounded-xl border border-gray-200/80 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-extrabold text-[#111827]">
              Очередь свободна — воркеры простаивают
            </h4>
            <p className="text-[11px] text-[#64748B] max-w-md mx-auto">
              В данный момент никаких тяжёлых файлов PDF не рендерится. Как только клиент или администратор запросит генерацию партии или рулона, задача появится здесь с живым таймером.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {pdfQueueData.activeList.map((job: any) => (
              <div
                key={job.id}
                className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0082FB] flex items-center justify-center shrink-0">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-[#111827]">
                        {job.description || job.key}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-[#0082FB]">
                        В процессе
                      </span>
                    </div>
                    <div className="text-[11px] text-[#64748B] flex items-center gap-3 flex-wrap">
                      {job.orderId && (
                        <Link
                          to={`/orders/${job.orderId}`}
                          className="text-[#0082FB] hover:underline font-bold"
                        >
                          Перейти к заказу →
                        </Link>
                      )}
                      <span>ID: <code className="text-[10px]">{job.id}</code></span>
                      {job.estimatedCount && (
                        <span>Объем: <strong className="text-gray-900">{job.estimatedCount.toLocaleString()}</strong> шт.</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 sm:self-center">
                  <div className="text-right">
                    <div className="text-base font-black text-[#0082FB] font-mono">
                      {job.elapsedSec || 0} сек
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">
                      время рендеринга
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* WAITING QUEUE SECTION (if any) */}
      {(pdfQueueData?.waitingList || []).length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-amber-100 pb-2.5">
            <div className="flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">
                Очередь на выполнение ({pdfQueueData.waitingList.length})
              </h3>
            </div>
            <span className="text-[11px] text-amber-800">
              Запустятся автоматически по мере освобождения воркеров
            </span>
          </div>

          <div className="space-y-2">
            {pdfQueueData.waitingList.map((waitJob: any, idx: number) => (
              <div
                key={waitJob.id}
                className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-900 font-black text-[11px] flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <span className="font-bold text-[#111827] block truncate">
                      {waitJob.description || waitJob.key}
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      ID: {waitJob.id}
                    </span>
                  </div>
                </div>
                {waitJob.orderId && (
                  <Link
                    to={`/orders/${waitJob.orderId}`}
                    className="text-[#0082FB] hover:underline font-bold text-xs shrink-0"
                  >
                    Открыть заказ →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECENT HISTORY TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-xs font-extrabold text-[#111827] uppercase tracking-wider">
            История последних выполненных задач
          </h3>
          <span className="text-[11px] text-gray-400">
            Последние 20 генераций
          </span>
        </div>

        {(!pdfQueueData?.recentHistory || pdfQueueData.recentHistory.length === 0) ? (
          <p className="text-xs text-gray-400 text-center py-6">
            История пуста. Задачи появятся после первых генераций PDF.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-[#64748B] text-[11px] uppercase tracking-wider bg-gray-50/50">
                  <th className="py-2.5 px-3 font-bold">Статус</th>
                  <th className="py-2.5 px-3 font-bold">Описание задачи</th>
                  <th className="py-2.5 px-3 font-bold">Длительность</th>
                  <th className="py-2.5 px-3 font-bold">Время завершения</th>
                  <th className="py-2.5 px-3 font-bold text-right">Заказ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pdfQueueData.recentHistory.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-3">
                      {item.status === 'completed' || item.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" /> Успешно
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3" /> Ошибка
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-medium text-[#111827]">
                      <div>{item.description || item.key}</div>
                      {item.error && (
                        <div className="text-[10px] text-rose-600 mt-0.5 font-mono">{item.error}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-gray-600 font-bold">
                      {item.durationSec} сек
                    </td>
                    <td className="py-3 px-3 text-gray-500 font-mono text-[11px]">
                      {item.completedAt ? new Date(item.completedAt).toLocaleTimeString('ru-RU') : '—'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {item.orderId ? (
                        <Link
                          to={`/orders/${item.orderId}`}
                          className="text-[#0082FB] hover:underline font-bold"
                        >
                          Заказ →
                        </Link>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
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
export default AdminPdfQueuePage;
