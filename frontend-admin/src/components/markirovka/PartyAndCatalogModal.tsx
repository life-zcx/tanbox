import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Search,
  Building2,
  Barcode,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { apiClient } from '../../api/client';

interface PartyAndCatalogModalProps {
  onClose: () => void;
}

export const PartyAndCatalogModal: React.FC<PartyAndCatalogModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'PARTY' | 'GTIN'>('PARTY');

  // Party state
  const [tin, setTin] = useState('');
  const [loadingParty, setLoadingParty] = useState(false);
  const [partyResult, setPartyResult] = useState<any | null>(null);
  const [partyError, setPartyError] = useState<string | null>(null);

  // GTIN state
  const [gtin, setGtin] = useState('');
  const [productGroup, setProductGroup] = useState('shoes');
  const [loadingGtin, setLoadingGtin] = useState(false);
  const [gtinResult, setGtinResult] = useState<any | null>(null);
  const [gtinError, setGtinError] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCheckParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tin.trim()) return;
    setLoadingParty(true);
    setPartyError(null);
    setPartyResult(null);

    try {
      const res = await apiClient.get('/markirovka/party/status', {
        params: { tin: tin.trim() },
      });
      setPartyResult(res.data);
    } catch (err: any) {
      setPartyError(err.response?.data?.message || err.message || 'Ошибка проверки участника в ИС МПТ');
    } finally {
      setLoadingParty(false);
    }
  };

  const handleSearchGtin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gtin.trim()) return;
    setLoadingGtin(true);
    setGtinError(null);
    setGtinResult(null);
    setShowJson(false);

    try {
      const res = await apiClient.get('/markirovka/products/search-by-gtin', {
        params: { gtin: gtin.trim(), productGroup },
      });
      if (res.data?.success && res.data?.product) {
        setGtinResult(res.data.product);
      } else {
        setGtinError(res.data?.message || 'Товар с указанным GTIN не найден в каталоге');
      }
    } catch (err: any) {
      setGtinError(
        err.response?.data?.message || err.message || 'Товар с указанным GTIN не найден в каталоге'
      );
    } finally {
      setLoadingGtin(false);
    }
  };

  const copyText = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loadingParty && !loadingGtin) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-xl w-full p-5 sm:p-6 space-y-4 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 text-gray-700 flex items-center justify-center shrink-0">
              <Search className="w-4 h-4 text-gray-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Реестры ИС МПТ</h3>
              <p className="text-[11px] text-gray-500">
                Проверка статуса контрагента по БИН и поиск товара в НКТ
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

        {/* Standard Tabs */}
        <div className="flex border-b border-gray-200 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('PARTY')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'PARTY'
                ? 'border-[#0082FB] text-[#0082FB]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Проверка по БИН
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('GTIN')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'GTIN'
                ? 'border-[#0082FB] text-[#0082FB]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Barcode className="w-3.5 h-3.5" />
            Поиск товара по GTIN
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-3.5 text-xs">
          {activeTab === 'PARTY' && (
            <div className="space-y-3">
              <form onSubmit={handleCheckParty} className="flex gap-2">
                <input
                  type="text"
                  placeholder="БИН или ИИН (12 цифр)"
                  value={tin}
                  onChange={(e) => setTin(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  className="flex-1 px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg font-mono focus:outline-none focus:border-gray-900"
                  required
                />
                <button
                  type="submit"
                  disabled={loadingParty || !tin.trim()}
                  className="px-4 py-2 bg-[#0082FB] hover:bg-[#0072de] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loadingParty ? 'Проверка...' : 'Проверить'}
                </button>
              </form>

              {partyError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{partyError}</span>
                </div>
              )}

              {partyResult && (
                <>
                  {partyResult.registered ? (
                    <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                        <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Участник зарегистрирован
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {partyResult.data?.status || 'ACTIVE'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500 text-[11px] block">БИН / ИИН:</span>
                          <span className="font-mono font-medium text-gray-900">{partyResult.tin || tin}</span>
                        </div>

                        {partyResult.data?.nameRu && (
                          <div>
                            <span className="text-gray-500 text-[11px] block">Наименование (RU):</span>
                            <span className="font-medium text-gray-900">{partyResult.data.nameRu}</span>
                          </div>
                        )}

                        {partyResult.data?.nameKz && (
                          <div>
                            <span className="text-gray-500 text-[11px] block">Наименование (KZ):</span>
                            <span className="text-gray-700">{partyResult.data.nameKz}</span>
                          </div>
                        )}

                        {partyResult.data?.productGroups && partyResult.data.productGroups.length > 0 && (
                          <div>
                            <span className="text-gray-500 text-[11px] block mb-1">Товарные группы:</span>
                            <div className="flex flex-wrap gap-1">
                              {partyResult.data.productGroups.map((pg: string, i: number) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-white border border-gray-200 text-gray-800 rounded text-[11px]"
                                >
                                  {pg}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Участник не найден в ИС МПТ</span>
                        <span className="text-[11px]">БИН {partyResult.tin || tin} не зарегистрирован в системе маркировки РК.</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'GTIN' && (
            <div className="space-y-3">
              <form onSubmit={handleSearchGtin} className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Код GTIN (штрихкод)"
                      value={gtin}
                      onChange={(e) => setGtin(e.target.value.replace(/\D/g, '').slice(0, 14))}
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg font-mono focus:outline-none focus:border-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <select
                      value={productGroup}
                      onChange={(e) => setProductGroup(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                    >
                      <option value="shoes">Обувь</option>
                      <option value="autofluids">Масла</option>
                      <option value="clothes">Легпром</option>
                      <option value="tobacco">Табак</option>
                      <option value="pharma">Фарма</option>
                      <option value="water">Вода</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loadingGtin || !gtin.trim()}
                  className="w-full py-2 bg-[#0082FB] hover:bg-[#0072de] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loadingGtin ? 'Поиск...' : 'Найти в Нац. каталоге'}
                </button>
              </form>

              {gtinError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{gtinError}</span>
                </div>
              )}

              {gtinResult && (
                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg space-y-2.5">
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-gray-200">
                    <div>
                      <span className="text-gray-500 text-[11px] block">Товар:</span>
                      <h4 className="font-bold text-gray-900">
                        {gtinResult.productName?.ru || gtinResult.productName?.kz || gtinResult.name || 'Товар из НКТ'}
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {gtinResult.status?.name?.ru || gtinResult.status?.code || 'PUBLISHED'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500 text-[11px] block">GTIN:</span>
                      <span className="font-mono font-medium text-gray-900">{gtinResult.gtin}</span>
                    </div>

                    <div>
                      <span className="text-gray-500 text-[11px] block">ТН ВЭД:</span>
                      <span className="font-mono font-medium text-gray-900">
                        {gtinResult.tnved?.code || gtinResult.tnved || '—'}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 text-[11px] block">Группа:</span>
                      <span className="text-gray-900 truncate block">
                        {gtinResult.productGroup?.name?.ru || gtinResult.productGroup?.code || '—'}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 text-[11px] block">БИН заявителя:</span>
                      <span className="font-mono text-gray-900">{gtinResult.inn || '—'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-[11px]">
                    <button
                      type="button"
                      onClick={() => setShowJson(!showJson)}
                      className="text-gray-600 hover:text-gray-900 underline cursor-pointer"
                    >
                      {showJson ? 'Скрыть JSON' : 'Показать сырой JSON'}
                    </button>
                    {showJson && (
                      <button
                        type="button"
                        onClick={() => copyText(JSON.stringify(gtinResult, null, 2))}
                        className="text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Скопировано' : 'Копировать'}
                      </button>
                    )}
                  </div>

                  {showJson && (
                    <pre className="p-2.5 bg-gray-900 text-gray-200 rounded text-[10px] font-mono overflow-x-auto max-h-40 border border-gray-800">
                      {JSON.stringify(gtinResult, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-gray-100 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs font-medium rounded-lg text-gray-700 transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
