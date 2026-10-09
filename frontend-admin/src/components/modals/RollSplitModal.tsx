import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  Download,
  Check,
  Layers,
  ChevronRight,
  ChevronLeft,
  Info,
  Sliders,
  CheckCircle2,
  FileText,
  AlertTriangle,
  AlertCircle,
  Search,
  RotateCcw,
  Hash,
  ArrowRight,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { apiClient } from '../../api/client';

interface RollSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  totalCodes: number;
  labelWidth?: number;
  labelHeight?: number;
  hasCodesFile?: boolean;
  hasLayout?: boolean;
  startLabelNumber?: number;
}

export const RollSplitModal: React.FC<RollSplitModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  totalCodes,
  labelWidth = 58,
  labelHeight = 40,
  hasCodesFile = true,
  hasLayout = true,
  startLabelNumber,
}) => {
  const [activeTab, setActiveTab] = useState<'rolls' | 'reprint'>('rolls');

  // Roll tab state
  const [rollSize, setRollSize] = useState<number>(() => {
    if (totalCodes <= 1000) return 500;
    if (totalCodes <= 5000) return 1000;
    return 1000;
  });
  const [customSize, setCustomSize] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [downloadingRoll, setDownloadingRoll] = useState<number | null>(null);
  const [downloadedRolls, setDownloadedRolls] = useState<Record<number, boolean>>({});
  const [downloadAllProgress, setDownloadAllProgress] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reprint tab state
  const [singleNum, setSingleNum] = useState<string>('');
  const [rangeFrom, setRangeFrom] = useState<string>('');
  const [rangeTo, setRangeTo] = useState<string>('');
  const [downloadingSingle, setDownloadingSingle] = useState<number | null>(null);
  const [downloadingRange, setDownloadingRange] = useState<boolean>(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Search & table items state
  const [items, setItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState<boolean>(false);
  const [itemsSearch, setItemsSearch] = useState<string>('');
  const [itemsPage, setItemsPage] = useState<number>(1);
  const [itemsTotalPages, setItemsTotalPages] = useState<number>(1);
  const [itemsTotal, setItemsTotal] = useState<number>(0);

  // Lock body scroll while modal is visible
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  // Fetch items when entering reprint tab or pagination/search changes
  useEffect(() => {
    if (!isOpen || activeTab !== 'reprint') return;
    let isCancelled = false;
    setItemsLoading(true);
    const timeout = setTimeout(() => {
      apiClient
        .get(`/orders/${orderId}/items`, {
          params: {
            page: itemsPage,
            limit: 15,
            search: itemsSearch.trim() || undefined,
          },
        })
        .then((res) => {
          if (!isCancelled) {
            setItems(res.data.items || []);
            setItemsTotalPages(res.data.totalPages || 1);
            setItemsTotal(res.data.total || 0);
          }
        })
        .catch((err) => {
          console.error('Fetch order items error:', err);
        })
        .finally(() => {
          if (!isCancelled) setItemsLoading(false);
        });
    }, 200);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [isOpen, activeTab, orderId, itemsPage, itemsSearch]);

  if (!isOpen) return null;

  const isDownloadBlocked = !hasCodesFile || !hasLayout;
  const effectiveRollSize = isCustom ? Math.max(1, parseInt(customSize, 10) || 1000) : rollSize;
  const safeTotalCodes = Math.max(1, totalCodes);
  const totalRolls = Math.ceil(safeTotalCodes / effectiveRollSize);

  // Generate roll items
  const rolls = Array.from({ length: totalRolls }, (_, i) => {
    const rollNum = i + 1;
    const start = i * effectiveRollSize;
    const end = Math.min(safeTotalCodes, start + effectiveRollSize);
    const count = end - start;
    return { rollNum, start, end, count };
  });

  const handleDownloadRoll = async (rollNum: number, start: number, count: number) => {
    if (isDownloadBlocked) return;
    setDownloadingRoll(rollNum);
    setErrorMessage(null);
    try {
      const res = await apiClient.get(
        `/orders/${orderId}/pdf?roll=${rollNum}&offset=${start}&limit=${count}`,
        { responseType: 'blob', timeout: 300000 }
      );
      const baseNum = startLabelNumber ?? 1;
      const rollStartNum = baseNum + start;
      const rollEndNum = baseNum + start + count - 1;
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `Roll_${rollNum}_(№${rollStartNum}-№${rollEndNum})_${orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setDownloadedRolls((prev) => ({ ...prev, [rollNum]: true }));
    } catch (err: any) {
      console.error('Download roll error:', err);
      let errMsg = 'Не удалось сгенерировать PDF рулона.';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json.message) errMsg = json.message;
        } catch {}
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      }
      setErrorMessage(errMsg);
    } finally {
      setDownloadingRoll(null);
    }
  };

  const handleDownloadAll = async () => {
    if (isDownloadBlocked || rolls.length === 0) return;
    setErrorMessage(null);
    for (let i = 0; i < rolls.length; i++) {
      const r = rolls[i];
      setDownloadAllProgress(`Скачивание рулона ${r.rollNum} из ${rolls.length}...`);
      await handleDownloadRoll(r.rollNum, r.start, r.count);
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
    setDownloadAllProgress(null);
  };

  const handleDownloadSingle = async (num: number) => {
    if (isDownloadBlocked || isNaN(num) || num < 1) return;
    setDownloadingSingle(num);
    setErrorMessage(null);
    try {
      const res = await apiClient.get(`/orders/${orderId}/items/${num}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `Label_№${num}_${orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setItems((prev) =>
        prev.map((it) => (it.index === num ? { ...it, status: 'REPRINTED' } : it))
      );
    } catch (err: any) {
      console.error('Download single item error:', err);
      let errMsg = `Не удалось сгенерировать этикетку №${num}`;
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json.message) errMsg = json.message;
        } catch {}
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      }
      setErrorMessage(errMsg);
    } finally {
      setDownloadingSingle(null);
    }
  };

  const handleDownloadRange = async () => {
    const from = parseInt(rangeFrom, 10);
    const to = parseInt(rangeTo, 10);
    if (isNaN(from) || isNaN(to) || from < 1 || to < from) {
      setErrorMessage('Укажите корректный диапазон этикеток (например: от 400 до 405)');
      return;
    }
    if (to - from > 1000) {
      setErrorMessage('Диапазон не должен превышать 1000 этикеток за один запрос');
      return;
    }
    setDownloadingRange(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.get(`/orders/${orderId}/items-range/pdf?from=${from}&to=${to}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `Labels_(${from}-${to})_${orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setItems((prev) =>
        prev.map((it) =>
          it.index >= from && it.index <= to ? { ...it, status: 'REPRINTED' } : it
        )
      );
    } catch (err: any) {
      console.error('Download range error:', err);
      let errMsg = `Не удалось сгенерировать этикетки с ${from} по ${to}`;
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json.message) errMsg = json.message;
        } catch {}
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      }
      setErrorMessage(errMsg);
    } finally {
      setDownloadingRange(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 1500);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-2xl w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200/80 text-gray-700 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Печать и управление тиражом (Админ)
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Заказ <span className="font-semibold text-gray-700 font-mono">{orderNumber}</span> • {safeTotalCodes.toLocaleString('ru-RU')} этикеток ({labelWidth}×{labelHeight} мм)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs - Strict Segmented Control */}
        <div className="bg-gray-100/90 p-1 rounded-lg flex items-center gap-1 border border-gray-200/60 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('rolls')}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'rolls'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-gray-500" />
            <span>Рулоны для термопринтера</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                activeTab === 'rolls' ? 'bg-gray-100 text-gray-800' : 'bg-gray-200/60 text-gray-600'
              }`}
            >
              {totalRolls}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reprint')}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'reprint'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
            <span>Поштучная печать и перепечатка брака</span>
          </button>
        </div>

        {/* Validation Warnings */}
        {!hasCodesFile && (
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900 shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block">Файл кодов ещё не загружен</strong>
              <span className="text-[11px] text-amber-800 leading-relaxed">
                В заказе отсутствуют коды маркировки Data Matrix. Загрузите файл кодов перед печатью.
              </span>
            </div>
          </div>
        )}

        {!hasLayout && (
          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg flex items-start gap-2.5 text-xs text-blue-900 shrink-0">
            <AlertCircle className="w-4 h-4 text-[#0082FB] shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block">Макет этикетки ещё не утверждён</strong>
              <span className="text-[11px] text-blue-800 leading-relaxed">
                Макет стикера ещё не настроен или не утверждён в конструкторе этикеток.
              </span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs font-semibold text-red-700 shrink-0">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {downloadAllProgress && (
          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between gap-3 text-xs font-semibold text-blue-900 shrink-0">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-[#0082FB] animate-spin shrink-0" />
              <span>{downloadAllProgress}</span>
            </div>
            <span className="text-[11px] text-blue-700 bg-white border border-blue-200 px-2 py-0.5 rounded font-mono">
              Очередь сервера активна
            </span>
          </div>
        )}

        {/* TAB 1: ROLLS VIEW */}
        {activeTab === 'rolls' && (
          <>
            {/* Roll Size Configuration */}
            <div className="bg-gray-50/70 border border-gray-200 rounded-lg p-3.5 space-y-2.5 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-gray-500" />
                  Количество этикеток в одном рулоне:
                </span>
                <span className="text-xs font-medium text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded">
                  Итого: <strong className="text-gray-900 font-semibold">{totalRolls}</strong> рулонов
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[500, 1000, 2000].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setRollSize(size);
                      setIsCustom(false);
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors border cursor-pointer text-center ${
                      !isCustom && rollSize === size
                        ? 'bg-gray-900 text-white border-gray-900 shadow-2xs'
                        : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    <div>{size.toLocaleString('ru-RU')} шт.</div>
                    {size === 1000 && (
                      <span
                        className={`block text-[10px] font-normal ${
                          !isCustom && rollSize === size ? 'text-gray-300' : 'text-gray-400'
                        }`}
                      >
                        стандарт
                      </span>
                    )}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setIsCustom(true);
                    if (!customSize) setCustomSize(String(rollSize));
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors border cursor-pointer text-center ${
                    isCustom
                      ? 'bg-gray-900 text-white border-gray-900 shadow-2xs'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                  }`}
                >
                  <div>Свой размер</div>
                  <span
                    className={`block text-[10px] font-normal ${
                      isCustom ? 'text-gray-300' : 'text-gray-400'
                    }`}
                  >
                    вручную
                  </span>
                </button>
              </div>

              {isCustom && (
                <div className="pt-1 flex items-center gap-2.5">
                  <input
                    type="number"
                    min="50"
                    max="50000"
                    step="50"
                    value={customSize}
                    onChange={(e) => setCustomSize(e.target.value)}
                    placeholder="Например: 1500"
                    className="w-44 bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 font-semibold focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                  <span className="text-xs text-gray-500">этикеток на рулон (до 50 000)</span>
                </div>
              )}

              {/* Breakdown summary */}
              <div className="flex items-center gap-2 text-[11px] text-gray-600 bg-white px-2.5 py-1.5 rounded-md border border-gray-200">
                <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>
                  Партия из {safeTotalCodes.toLocaleString('ru-RU')} кодов разбита на{' '}
                  <strong className="text-gray-900 font-semibold">{totalRolls} рулонов</strong> по{' '}
                  {effectiveRollSize.toLocaleString('ru-RU')} этикеток.
                </span>
              </div>
            </div>

            {/* Rolls List: Strict Table Queue Manifest */}
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white flex flex-col flex-1 min-h-[160px] max-h-[340px]">
              {/* Table Header */}
              <div className="bg-gray-50 px-3.5 py-2 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between shrink-0">
                <span className="w-16">№</span>
                <span className="flex-1 px-3">Рулон и диапазон кодов</span>
                <span className="w-24 text-center">Количество</span>
                <span className="w-36 text-right">Действие</span>
              </div>

              {/* Scrollable list */}
              <div className="divide-y divide-gray-100 overflow-y-auto flex-1">
                {rolls.map((r) => {
                  const isDownloaded = downloadedRolls[r.rollNum];
                  const isCurrent = downloadingRoll === r.rollNum;
                  const baseNum = startLabelNumber ?? 1;
                  const rollStartNum = baseNum + r.start;
                  const rollEndNum = baseNum + r.end - 1;

                  return (
                    <div
                      key={r.rollNum}
                      className="flex items-center justify-between px-3.5 py-2.5 hover:bg-gray-50/80 transition-colors text-xs"
                    >
                      <div className="w-16 shrink-0 flex items-center">
                        <span className="font-mono font-bold text-gray-700 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-[11px] min-w-[34px] text-center">
                          #{r.rollNum}
                        </span>
                      </div>

                      <div className="flex-1 px-3 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            Рулон {r.rollNum}
                          </span>
                          {isDownloaded && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded inline-flex items-center gap-0.5">
                              <Check className="w-3 h-3 text-emerald-600" />
                              Скачан
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-500 font-mono">
                          этикетки: № {rollStartNum.toLocaleString('ru-RU')} — № {rollEndNum.toLocaleString('ru-RU')}
                        </span>
                      </div>

                      <div className="w-24 text-center shrink-0">
                        <span className="text-gray-600 font-medium text-xs">
                          {r.count.toLocaleString('ru-RU')} шт.
                        </span>
                      </div>

                      <div className="w-36 text-right shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDownloadRoll(r.rollNum, r.start, r.count)}
                          disabled={isCurrent || isDownloadBlocked}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                            isDownloaded
                              ? 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 shadow-2xs'
                              : 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 hover:border-gray-400 shadow-2xs'
                          }`}
                        >
                          <Download className={`w-3.5 h-3.5 text-gray-500 ${isCurrent ? 'animate-bounce text-[#0082FB]' : ''}`} />
                          {isCurrent
                            ? 'Генерация...'
                            : isDownloaded
                            ? 'Повторно'
                            : 'Скачать PDF'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-gray-200 pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-gray-500">
                {downloadAllProgress ? (
                  <span className="text-[#0082FB] font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#0082FB] animate-ping" />
                    {downloadAllProgress}
                  </span>
                ) : (
                  <span>Каждый PDF сформирован индивидуально для прямой термопечати.</span>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-black transition-colors cursor-pointer"
                >
                  Закрыть
                </button>
                <button
                  type="button"
                  onClick={handleDownloadAll}
                  disabled={Boolean(downloadAllProgress) || isDownloadBlocked}
                  className="inline-flex items-center gap-1.5 bg-[#111827] hover:bg-black text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Скачать все ({totalRolls}) рулонов
                </button>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: REPRINT & DEFECT MANAGEMENT */}
        {activeTab === 'reprint' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-3 overflow-hidden">
            {/* Quick Actions Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
              {/* Single Label Reprint */}
              <div className="bg-gray-50/70 border border-gray-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5 text-gray-600" />
                  <span className="text-xs font-bold text-gray-900">
                    Перепечатать 1 этикетку
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={safeTotalCodes}
                    value={singleNum}
                    onChange={(e) => setSingleNum(e.target.value)}
                    placeholder="Номер (например: 402)"
                    className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 font-semibold focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => handleDownloadSingle(parseInt(singleNum, 10))}
                    disabled={
                      !singleNum ||
                      downloadingSingle !== null ||
                      isDownloadBlocked
                    }
                    className="shrink-0 px-3 py-1.5 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    {downloadingSingle === parseInt(singleNum, 10) ? 'Генерация...' : 'Печать'}
                  </button>
                </div>
                <span className="text-[10px] text-gray-500 block">
                  Скачивает PDF на 1 наклейку для замены замятой или испорченной.
                </span>
              </div>

              {/* Range Reprint */}
              <div className="bg-gray-50/70 border border-gray-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-gray-600" />
                  <span className="text-xs font-bold text-gray-900">
                    Перепечатать диапазон
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={safeTotalCodes}
                    value={rangeFrom}
                    onChange={(e) => setRangeFrom(e.target.value)}
                    placeholder="С №"
                    className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 font-semibold focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                  <span className="text-xs text-gray-400">—</span>
                  <input
                    type="number"
                    min="1"
                    max={safeTotalCodes}
                    value={rangeTo}
                    onChange={(e) => setRangeTo(e.target.value)}
                    placeholder="По №"
                    className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 font-semibold focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                  <button
                    type="button"
                    onClick={handleDownloadRange}
                    disabled={
                      !rangeFrom ||
                      !rangeTo ||
                      downloadingRange ||
                      isDownloadBlocked
                    }
                    className="shrink-0 px-3 py-1.5 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {downloadingRange ? '...' : 'Скачать'}
                  </button>
                </div>
                <span className="text-[10px] text-gray-500 block">
                  Например, с 400 по 405 при замятии пачки на линии.
                </span>
              </div>
            </div>

            {/* Search and Table of Codes */}
            <div className="flex-1 flex flex-col min-h-0 bg-white border border-gray-200 rounded-lg p-3 space-y-2.5">
              {/* Search Bar */}
              <div className="flex items-center justify-between gap-3 shrink-0">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={itemsSearch}
                    onChange={(e) => {
                      setItemsSearch(e.target.value);
                      setItemsPage(1);
                    }}
                    placeholder="Поиск по номеру этикетки, GTIN или серийному номеру..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-gray-900 focus:bg-white"
                  />
                </div>
                <div className="text-[11px] font-medium text-gray-500 shrink-0">
                  Всего: <strong className="text-gray-900 font-semibold">{itemsTotal.toLocaleString('ru-RU')}</strong> кодов
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-y-auto min-h-[140px] border border-gray-200 rounded-md">
                {itemsLoading ? (
                  <div className="flex items-center justify-center h-32 text-xs text-gray-400">
                    Загрузка списка кодов маркировки...
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-xs text-gray-400">
                    Коды маркировки не найдены
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="py-2 px-3 w-16">№</th>
                        <th className="py-2 px-3">Код DataMatrix</th>
                        <th className="py-2 px-3 w-28">Статус</th>
                        <th className="py-2 px-3 w-24 text-right">Действие</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                      {items.map((it) => (
                        <tr key={it.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-2 px-3 font-bold text-gray-900">
                            #{it.index}
                          </td>
                          <td className="py-2 px-3 text-gray-700 max-w-[280px] truncate">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate" title={it.code}>
                                {it.code}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(it.code, it.id)}
                                className="text-gray-400 hover:text-gray-700 p-0.5 shrink-0 cursor-pointer"
                                title="Скопировать полный код"
                              >
                                {copiedCodeId === it.id ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-2 px-3 font-sans">
                            {it.status === 'REPRINTED' ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                Перепечатан
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                                В партии
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-sans">
                            <button
                              type="button"
                              onClick={() => handleDownloadSingle(it.index)}
                              disabled={downloadingSingle === it.index || isDownloadBlocked}
                              className="px-2 py-1 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-md text-[10px] font-semibold transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                              title="Распечатать только эту этикетку"
                            >
                              <Printer className="w-3 h-3 text-gray-500" />
                              {downloadingSingle === it.index ? '...' : 'Печать'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Table Pagination */}
              {itemsTotalPages > 1 && (
                <div className="flex items-center justify-between pt-1 text-xs shrink-0">
                  <span className="text-[11px] text-gray-500">
                    Страница {itemsPage} из {itemsTotalPages}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setItemsPage((p) => Math.max(1, p - 1))}
                      disabled={itemsPage <= 1}
                      className="p-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemsPage((p) => Math.min(itemsTotalPages, p + 1))}
                      disabled={itemsPage >= itemsTotalPages}
                      className="p-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default RollSplitModal;
