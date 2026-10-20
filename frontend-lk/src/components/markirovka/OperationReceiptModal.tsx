import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  KeyRound,
  Copy,
  Check,
  FileText,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Boxes,
  PackagePlus,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { useModalBehavior } from '@shared';

interface OperationReceiptModalProps {
  operation: any | null;
  onClose: () => void;
  onOperationUpdated?: () => void;
}

export function getHumanFriendlyError(err: any): {
  title: string;
  description: string;
  actionHint?: string;
} {
  if (err?.userTitle && err?.userMessage) {
    return {
      title: err.userTitle,
      description: err.userMessage,
      actionHint: err.actionHint,
    };
  }

  const codeStr = String(err?.errorCode || err?.result || (typeof err === 'string' ? err : '')).toLowerCase();
  const tagsStr = typeof err?.errorTags === 'object' ? JSON.stringify(err.errorTags) : String(err?.errorTags || '');

  if (codeStr.includes('invalid-code-properties') || codeStr.includes('ai_reduced') || tagsStr.includes('AI_REDUCED')) {
    return {
      title: 'Неверный формат кода маркировки',
      description: 'В отчет передан код с криптохвостом или неверной структурой. Для отчета о нанесении в ИС МПТ требуется короткий код идентификации (GTIN + серийный номер, 31 символ) без спецсимволов и криптоподписи.',
      actionHint: 'В Tanbox уже включена автоматическая нормализация кодов. Повторите операцию нанесения — коды будут отправлены в правильном формате.',
    };
  }

  if (codeStr.includes('not-found') || codeStr.includes('not_found')) {
    return {
      title: 'Код не найден в ИС МПТ',
      description: 'Данный код маркировки не зарегистрирован в системе ИС МПТ (не был эмитирован для вашей организации).',
      actionHint: 'Убедитесь, что коды были заказаны и выпущены в вашем аккаунте ИС МПТ.',
    };
  }

  if (codeStr.includes('already-utilised') || codeStr.includes('already_utilized') || codeStr.includes('already-applied')) {
    return {
      title: 'Код уже нанесен',
      description: 'Отчет о нанесении для этого кода уже был успешно зарегистрирован ранее.',
      actionHint: 'Повторное нанесение не требуется. Код готов к вводу в оборот или агрегации.',
    };
  }

  if (codeStr.includes('not-applied') || codeStr.includes('not_applied')) {
    return {
      title: 'Код еще не нанесен',
      description: 'Нельзя ввести товар в оборот или сформировать упаковку до успешной подачи отчета о нанесении.',
      actionHint: 'Сначала выполните операцию «Отчет о нанесении» для этих кодов.',
    };
  }

  if (codeStr.includes('already-in-circulation') || codeStr.includes('in-circulation') || codeStr.includes('in_circulation')) {
    return {
      title: 'Товар уже в обороте',
      description: 'Этот код маркировки уже находится в обороте.',
      actionHint: 'Повторный ввод в оборот не требуется.',
    };
  }

  if (codeStr.includes('not-in-circulation')) {
    return {
      title: 'Товар не в обороте',
      description: 'Код маркировки еще не введен в оборот либо уже списан.',
      actionHint: 'Выполните ввод в оборот перед продажей или выводом.',
    };
  }

  if (codeStr.includes('withdrawn') || codeStr.includes('retired')) {
    return {
      title: 'Код выведен из оборота',
      description: 'Данный код маркировки уже списан, продан или выведен из оборота.',
      actionHint: 'Коды, выведенные из оборота, нельзя использовать повторно.',
    };
  }

  if (codeStr.includes('owner') || codeStr.includes('mismatch')) {
    return {
      title: 'Код принадлежит другой организации',
      description: 'Текущим владельцем кода маркировки числится другой участник оборота (не совпадает БИН/ИИН).',
      actionHint: 'Проверьте, была ли проведена приемка товара по электронному акту / ВС.',
    };
  }

  if (codeStr.includes('gtin')) {
    return {
      title: 'Ошибка товара в каталоге (GTIN)',
      description: 'Товар с таким GTIN не найден в Национальном каталоге товаров (НКТ) или карточка не опубликована.',
      actionHint: 'Проверьте статус карточки товара в НКТ на markirovka.kz.',
    };
  }

  if (codeStr.includes('date') || codeStr.includes('time')) {
    return {
      title: 'Некорректная дата',
      description: 'Указана недопустимая дата производства или срок годности (например, дата из будущего).',
      actionHint: 'Укажите дату производства не позже сегодняшнего дня.',
    };
  }

  return {
    title: err?.errorCode ? `Ошибка: ${err.errorCode}` : 'Ошибка обработки кода',
    description: 'Система маркировки отклонила обработку кода по правилам валидации ИС МПТ.',
    actionHint: 'Проверьте статус кода в личном кабинете markirovka.kz или обратитесь в поддержку.',
  };
}

const OPERATION_TYPE_LABELS: Record<string, string> = {
  ORDER: 'Заказ кодов маркировки',
  UTILISATION: 'Отчет о нанесении',
  IMPORT_NOTIFICATION: 'Ввод в оборот',
  AGGREGATION: 'Агрегация (Короб)',
  DISAGGREGATION: 'Расформирование',
  RETIREMENT: 'Вывод из оборота',
  RETURN_TO_TURNOVER: 'Возврат в оборот',
  CORRECTION: 'Корректировка',
  VALIDATION: 'Проверка кодов',
};

export const OperationReceiptModal: React.FC<OperationReceiptModalProps> = ({
  operation,
  onClose,
  onOperationUpdated,
}) => {
  const [copiedErrors, setCopiedErrors] = useState(false);
  const [loading, setLoading] = useState(false);
  const [receiptData, setReceiptData] = useState<any | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'CODES' | 'ERRORS'>('CODES');
  const [searchQuery, setSearchQuery] = useState('');
  const [codeFilter, setCodeFilter] = useState<'ALL' | 'SUCCESS' | 'ERROR'>('ALL');

  const onOperationUpdatedRef = React.useRef(onOperationUpdated);
  useEffect(() => {
    onOperationUpdatedRef.current = onOperationUpdated;
  }, [onOperationUpdated]);

  const fetchReceipt = useCallback(
    async (isManual = false) => {
      if (!operation?.id) return;
      try {
        setLoading(true);
        setFetchError(null);
        const res = await apiClient.get(`/markirovka/operations/${operation.id}/receipt`);
        setReceiptData(res.data);
        const newStatus = res.data?.receipt?.status;
        if (
          (isManual || (newStatus && newStatus !== operation.status)) &&
          onOperationUpdatedRef.current
        ) {
          onOperationUpdatedRef.current();
        }
      } catch (err: any) {
        setFetchError(err.response?.data?.message || err.message || 'Ошибка загрузки квитанции из ИС МПТ');
      } finally {
        setLoading(false);
      }
    },
    [operation?.id, operation?.status]
  );

  useEffect(() => {
    if (operation?.id) {
      fetchReceipt(false);
    }
  }, [operation?.id]);

  const receipt = receiptData?.receipt;
  const rawCodes = receipt?.codes && receipt.codes.length > 0
    ? receipt.codes
    : Array.isArray((operation?.responsePayload as any)?.results) && (operation.responsePayload as any).results.length > 0
    ? (operation.responsePayload as any).results.map((r: any) => ({
        code: r.code,
        state: r.isValid !== false ? 'SUCCESS' : 'ERROR',
        result: r.statusLabel || r.status || (r.isValid !== false ? 'Успешно' : 'Ошибка'),
        gtin: r.gtin,
        packageType: r.packageType,
        emissionDate: r.emissionDate,
      }))
    : Array.isArray((operation?.responsePayload as any)?.codes) && (operation.responsePayload as any).codes.length > 0
    ? ((operation.responsePayload as any).codes as string[]).map((c: string) => ({
        code: c,
        state: 'SUCCESS',
        result: 'Эмитирован в ИС МПТ',
        gtin: (operation?.responsePayload as any)?.details?.gtin || (operation?.requestPayload as any)?.gtin,
      }))
    : Array.isArray((operation?.requestPayload as any)?.codes)
    ? ((operation.requestPayload as any).codes as string[]).map((c: string) => ({
        code: c,
        state: operation?.status === 'COMPLETED' ? 'SUCCESS' : 'ERROR',
        result: operation?.status === 'COMPLETED' ? 'Успешно' : 'Ошибка',
      }))
    : [];

  const codes: any[] = rawCodes;
  const errors: any[] = receipt?.errors || [];
  const docInfo = receipt?.docInfo;

  const aggregationSscc = useMemo(() => {
    if (operation?.type !== 'AGGREGATION') return null;
    return (
      (operation?.requestPayload as any)?.sscc ||
      codes.find((c) => c.code && (c.code.length === 18 || c.code.length === 20))?.code ||
      null
    );
  }, [operation, codes]);

  // Filtered codes
  const filteredCodes = useMemo(() => {
    return codes.filter((item) => {
      const matchesSearch = searchQuery
        ? String(item.code || '').toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const matchesState =
        codeFilter === 'ALL'
          ? true
          : codeFilter === 'SUCCESS'
          ? item.state === 'SUCCESS'
          : item.state === 'ERROR';
      return matchesSearch && matchesState;
    });
  }, [codes, searchQuery, codeFilter]);

  const errorCodesList = useMemo(() => {
    return codes.filter((c) => c.state === 'ERROR').map((c) => c.code);
  }, [codes]);

  const handleCopyErrorCodes = () => {
    if (errorCodesList.length === 0) return;
    navigator.clipboard.writeText(errorCodesList.join('\n'));
    setCopiedErrors(true);
    setTimeout(() => setCopiedErrors(false), 2000);
  };

  const { backdropProps, dialogProps } = useModalBehavior({ onClose, isOpen: Boolean(operation) });

  if (!operation) return null;

  const currentStatus = docInfo?.status || receipt?.status || operation.status;

  const successCount = codes.filter((c) => c.state === 'SUCCESS').length;
  const errorCount = codes.filter((c) => c.state === 'ERROR').length;
  const totalCount = codes.length || operation.codesCount || 0;

  return createPortal(
    <div
      {...backdropProps}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        {...dialogProps}
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-3xl w-full p-5 sm:p-6 space-y-4 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-[#0082FB] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-[#0082FB]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900">
                  Документ {operation.documentNumber || operation.id}
                </h3>
                {currentStatus === 'SUCCESS' || currentStatus === 'COMPLETED' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ИС МПТ: Принят
                  </span>
                ) : currentStatus === 'IN_PROCESS' || currentStatus === 'PROCESSING' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                    <Clock className="w-3 h-3 text-amber-600" />
                    ИС МПТ: В обработке
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <XCircle className="w-3 h-3 text-rose-600" />
                    ИС МПТ: Ошибка
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Зарегистрирован: {new Date(operation.createdAt).toLocaleString('ru-RU')}
                {receiptData?.documentId && (
                  <span className="ml-2 font-mono text-[10px] text-gray-400">
                    docId: {receiptData.documentId}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fetchReceipt(true)}
              disabled={loading}
              title="Обновить квитанцию из ИС МПТ"
              className="p-1.5 text-gray-500 hover:text-[#0082FB] hover:bg-blue-50 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0082FB]' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status / Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
          <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200/80">
            <span className="text-[10px] text-gray-500 font-bold uppercase block">Тип операции</span>
            <span className="text-xs font-bold text-gray-900 mt-0.5 block truncate">
              {OPERATION_TYPE_LABELS[operation.type] || operation.type}
            </span>
          </div>

          <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200/80">
            <span className="text-[10px] text-gray-500 font-bold uppercase block">Кодов маркировки</span>
            <div className="text-xs font-bold text-gray-900 mt-0.5 flex items-center gap-1.5">
              <span>{totalCount} шт.</span>
              {codes.length > 0 && (
                <span className="text-[10px] text-emerald-600 font-medium">({successCount} ✓ / {errorCount} ✗)</span>
              )}
            </div>
          </div>

          <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200/80">
            <span className="text-[10px] text-gray-500 font-bold uppercase block">Подписание ЭЦП</span>
            <span className="text-xs font-bold text-gray-900 mt-0.5 flex items-center gap-1">
              {operation.isSigned ? (
                <>
                  <KeyRound className="w-3.5 h-3.5 text-[#0082FB]" />
                  Подписан ЭЦП ГОСТ
                </>
              ) : (
                'Не требуется'
              )}
            </span>
          </div>

          <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200/80">
            <span className="text-[10px] text-gray-500 font-bold uppercase block">Результат</span>
            <span className="text-xs font-bold text-gray-800 mt-0.5 truncate block">
              {currentStatus === 'SUCCESS' || currentStatus === 'COMPLETED'
                ? 'Обработан успешно'
                : currentStatus === 'IN_PROCESS' || currentStatus === 'PROCESSING'
                ? 'В обработке'
                : 'Ошибка обработки'}
            </span>
          </div>
        </div>

        {/* Fetch Error banner */}
        {fetchError && (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{fetchError}</span>
          </div>
        )}

        {/* ORDER: Dedicated Order Info Box */}
        {operation.type === 'ORDER' && (
          <div className="p-3 bg-violet-50/70 border border-violet-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                <PackagePlus className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-violet-900 block">
                  Заказ эмиссии кодов маркировки (СУЗ)
                </span>
                <span className="text-[11px] text-violet-700 font-mono">
                  GTIN: {docInfo?.gtin || (operation.requestPayload as any)?.gtin || '—'}
                  {docInfo?.category ? ` • Категория: ${docInfo.category}` : ''}
                  {docInfo?.quantityRequested ? ` • Заказано: ${docInfo.quantityRequested} шт.` : ''}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* AGGREGATION: Dedicated SSCC Box */}
        {operation.type === 'AGGREGATION' && (
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Boxes className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-gray-600 font-medium text-[11px]">Код агрегата (SSCC упаковки):</span>
                  <span className="font-mono font-bold text-gray-900 bg-white px-2 py-0.5 rounded-md border border-blue-200 select-all">
                    {aggregationSscc || '0487...'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  В упаковку вложено <strong>{codes.length > 1 ? codes.length - 1 : (operation.requestPayload as any)?.codesCount || operation.codesCount || 0} шт.</strong> товаров.
                </p>
              </div>
            </div>
            {aggregationSscc && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(aggregationSscc);
                }}
                className="px-2.5 py-1.5 text-xs font-semibold bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 rounded-xl shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Copy className="w-3.5 h-3.5 text-gray-600" />
                Скопировать SSCC
              </button>
            )}
          </div>
        )}

        {/* Tab navigation */}
        <div className="flex items-center justify-between border-b border-gray-200 shrink-0">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('CODES')}
              className={`pb-2 px-1 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'CODES'
                  ? 'border-[#0082FB] text-[#0082FB]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Коды маркировки {codes.length > 0 ? `(${codes.length})` : ''}
            </button>
            {errors.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('ERRORS')}
                className={`pb-2 px-1 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1 ${
                  activeTab === 'ERRORS'
                    ? 'border-rose-600 text-rose-600'
                    : 'border-transparent text-rose-500 hover:text-rose-700'
                }`}
              >
                Ошибки ({errors.length})
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 pb-1.5">
            {activeTab === 'CODES' && errorCount > 0 && (
              <button
                type="button"
                onClick={handleCopyErrorCodes}
                className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg border border-rose-200 transition-colors cursor-pointer"
              >
                {copiedErrors ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedErrors ? 'Скопировано!' : `Скопировать ошибки (${errorCount})`}
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto pr-1 flex-1 min-h-[220px]">
          {activeTab === 'CODES' && (
            <div className="space-y-3">
              {codes.length > 0 ? (
                <>
                  {/* Filter and Search controls */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Поиск по коду или серийному номеру..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0082FB]"
                      />
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setCodeFilter('ALL')}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                          codeFilter === 'ALL'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Все ({codes.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCodeFilter('SUCCESS')}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                          codeFilter === 'SUCCESS'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        Успешные ({successCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCodeFilter('ERROR')}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                          codeFilter === 'ERROR'
                            ? 'bg-rose-600 text-white'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                        }`}
                      >
                        Ошибки ({errorCount})
                      </button>
                    </div>
                  </div>

                  {/* Codes list */}
                  <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100 text-xs">
                    {filteredCodes.length === 0 ? (
                      <div className="p-4 text-center text-gray-400 text-xs">
                        Коды маркировки не найдены по заданному фильтру
                      </div>
                    ) : (
                      filteredCodes.map((item, idx) => {
                        const isSuccess = item.state === 'SUCCESS';
                        return (
                          <div
                            key={idx}
                            className={`p-2.5 flex items-start justify-between gap-3 transition-colors ${
                              isSuccess ? 'hover:bg-emerald-50/30' : 'bg-rose-50/30 hover:bg-rose-50/60'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                              <span className="text-[10px] text-gray-400 font-mono w-6 pt-0.5 text-right shrink-0">
                                #{item.index !== undefined ? item.index + 1 : idx + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-[11px] text-gray-800 break-all select-all font-semibold">
                                    {item.code}
                                  </span>
                                  {operation.type === 'AGGREGATION' && (item.code === aggregationSscc || (aggregationSscc && item.code.includes(aggregationSscc))) && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                      Упаковка (SSCC)
                                    </span>
                                  )}
                                  {item.packageType && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                                      {item.packageType}
                                    </span>
                                  )}
                                </div>
                                {item.gtin && (
                                  <span className="text-[10px] text-gray-500 font-mono mt-0.5 block">
                                    GTIN: {item.gtin}
                                  </span>
                                )}
                                {item.result && (
                                  <span className={`text-[11px] font-medium mt-0.5 block ${isSuccess ? 'text-emerald-700' : 'text-rose-600'}`}>
                                    {isSuccess ? item.result : `Причина: ${getHumanFriendlyError(item).title}`}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="shrink-0 pt-0.5">
                              {isSuccess ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                  Успешно
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800">
                                  <XCircle className="w-3 h-3 text-rose-700" />
                                  Ошибка
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              ) : (
                <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-2xl border border-gray-200">
                  <p className="text-xs">
                    {loading
                      ? 'Запрос детализации кодов из хранилища ИС МПТ...'
                      : 'В хранилище ИС МПТ нет детализированного списка кодов для этого документа, либо обработка ещё завершается.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ERRORS' && (
            <div className="space-y-3">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">ИС МПТ отклонила обработку кодов ({errors.length} шт.)</p>
                  <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                    Ниже приведены понятные причины отклонения и инструкции, что необходимо сделать.
                  </p>
                </div>
              </div>

              {errors.map((errItem, idx) => {
                const readable = getHumanFriendlyError(errItem);
                return (
                  <div key={idx} className="p-3.5 bg-white border border-rose-200 rounded-xl shadow-2xs space-y-2 text-xs transition-colors hover:border-rose-300">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                        <span className="font-bold text-gray-900 text-xs">
                          {readable.title}
                        </span>
                      </div>
                      {errItem.index !== undefined && (
                        <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md font-mono font-bold shrink-0">
                          Код #{errItem.index + 1}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-gray-700 leading-relaxed pl-4">
                      {readable.description}
                    </p>

                    {readable.actionHint && (
                      <div className="ml-4 p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg text-[11px] text-blue-900 flex items-start gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span><strong>Что делать:</strong> {readable.actionHint}</span>
                      </div>
                    )}

                    <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                      <span>Код ошибки ИС МПТ: <strong className="text-rose-600 font-semibold">{errItem.errorCode || 'UNKNOWN'}</strong></span>
                      {errItem.propertyName && <span>Поле: {errItem.propertyName}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-gray-400">
            {receiptData?.documentId || (operation?.responsePayload as any)?.reportId || (operation?.responsePayload as any)?.documentId
              ? 'Синхронизировано с ИС МПТ (True API / СУЗ)'
              : 'Локальная запись'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-xs font-semibold rounded-xl text-gray-700 transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
