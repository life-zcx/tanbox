import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { TariffItem, PricingSettingsItem } from '../types';
import { PageHeader } from '@shared';
import {
  Save,
  Check,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Calculator,
  Sliders,
  Sparkles,
  Layers,
  ShieldCheck,
  Info,
  DollarSign,
  Loader2,
  RotateCcw,
} from 'lucide-react';

const MARKET_BENCHMARKS: {
  tariffs: Record<string, { retail: number; wholesale: number; large: number; cost: number }>;
  settings: PricingSettingsItem;
} = {
  tariffs: {
    DIGITAL: { retail: 15, wholesale: 12, large: 10, cost: 2.68 },
    PRINT: { retail: 35, wholesale: 30, large: 25, cost: 6.0 },
    STANDARD: { retail: 65, wholesale: 55, large: 50, cost: 18.0 },
    PRO: { retail: 120, wholesale: 105, large: 90, cost: 35.0 },
  },
  settings: {
    ssccPrice: 5,
    stickerLayoutPrice: 5000,
    urgentPercent: 20,
    expressDeliveryPrice: 15000,
    volumeTier1: 20000,
    volumeTier2: 100000,
  },
};

export const AdminTariffsPage: React.FC = () => {
  const [tariffs, setTariffs] = useState<TariffItem[]>([]);
  const [pricingSettings, setPricingSettings] = useState<PricingSettingsItem>({
    ssccPrice: 5,
    stickerLayoutPrice: 5000,
    urgentPercent: 20,
    expressDeliveryPrice: 15000,
    volumeTier1: 20000,
    volumeTier2: 100000,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState<boolean>(true);

  // Simulator state
  const [simTariff, setSimTariff] = useState<string>('STANDARD');
  const [simCount, setSimCount] = useState<number>(25000);
  const [simSscc, setSimSscc] = useState<boolean>(true);
  const [simUrgent, setSimUrgent] = useState<boolean>(false);
  const [simLayout, setSimLayout] = useState<boolean>(false);
  const [simDelivery, setSimDelivery] = useState<boolean>(false);

  // Fetch tariffs on mount
  useEffect(() => {
    fetchTariffs();
  }, []);

  const fetchTariffs = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.get('/tariffs');
      if (res.data.tariffs) {
        setTariffs(res.data.tariffs);
      }
      if (res.data.pricingSettings) {
        setPricingSettings(res.data.pricingSettings);
      }
    } catch (e: any) {
      console.error('Failed to fetch tariffs:', e);
      setErrorMsg('Не удалось загрузить тарифы с сервера');
    } finally {
      setLoading(false);
    }
  };

  const handleTariffChange = (
    index: number,
    field: keyof TariffItem,
    value: any
  ) => {
    setTariffs((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSettingsChange = (
    field: keyof PricingSettingsItem,
    value: number
  ) => {
    setPricingSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const applyMarketBenchmarks = () => {
    if (!window.confirm('Применить рекомендованные рыночные цены Республики Казахстан?')) {
      return;
    }

    setTariffs((prev) =>
      prev.map((t) => {
        const bench = MARKET_BENCHMARKS.tariffs[t.code];
        if (bench) {
          return {
            ...t,
            priceRetail: bench.retail,
            priceWholesale: bench.wholesale,
            priceLargeWholesale: bench.large,
            costEstimate: bench.cost,
          };
        }
        return t;
      })
    );

    setPricingSettings((prev) => ({
      ...prev,
      ...MARKET_BENCHMARKS.settings,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      await apiClient.put('/tariffs', {
        tariffs,
        pricingSettings,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (e: any) {
      console.error('Failed to save tariffs:', e);
      setErrorMsg(e.response?.data?.message || 'Ошибка сохранения настроек тарифов');
    } finally {
      setSaving(false);
    }
  };

  // Simulator calculation
  const simSelectedTariff = tariffs.find((t) => t.code === simTariff) || tariffs[0];
  const simUnitPriceBase =
    simCount > pricingSettings.volumeTier2
      ? simSelectedTariff?.priceLargeWholesale || 0
      : simCount > pricingSettings.volumeTier1
      ? simSelectedTariff?.priceWholesale || 0
      : simSelectedTariff?.priceRetail || 0;

  const simUnitAdditions =
    simSscc && simTariff !== 'PRO' ? pricingSettings.ssccPrice : 0;
  const simFlatAdditions =
    (simLayout ? pricingSettings.stickerLayoutPrice : 0) +
    (simDelivery ? pricingSettings.expressDeliveryPrice : 0);

  const simFinalUnitPrice = simUnitPriceBase + simUnitAdditions;
  let simTotalPrice = simFinalUnitPrice * simCount + simFlatAdditions;
  if (simUrgent) simTotalPrice *= 1 + pricingSettings.urgentPercent / 100;
  simTotalPrice = Math.round(simTotalPrice);

  const simCostBase = simSelectedTariff?.costEstimate || 0;
  const simTotalCost = Math.round(simCostBase * simCount);
  const simTotalProfit = Math.round(simTotalPrice - simTotalCost);
  const simMarginPercent = simTotalPrice > 0 ? ((simTotalProfit / simTotalPrice) * 100).toFixed(1) : '0';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <Loader2 className="w-8 h-8 text-[#0082FB] animate-spin" />
        <span className="text-xs font-bold text-gray-500">Загрузка тарифной сетки...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            Настройка точных цен и тарифов
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Управление точными ставками (розница, опт, крупный опт), себестоимостью и дополнительными услугами маркировки ИС Танба
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={applyMarketBenchmarks}
            className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-black font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
            title="Заполнить проверенными рыночными ставками Казахстана"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-600" />
            <span>Рыночный стандарт РК</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Сохранение...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Сохранить цены</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-4 rounded-2xl flex items-center gap-3 shadow-sm">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div>Настройки цен и тарифная сетка успешно сохранены в базе данных!</div>
            <div className="text-[11px] font-normal text-emerald-700 mt-0.5">
              Все новые расчёты на сайте и в Личном кабинете клиентов будут производиться по обновлённым ценам.
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs font-bold p-4 rounded-2xl flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}



      {/* Global Volume Tiers & Extra Options Configuration */}
      <div className="bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
          <Sliders className="w-5 h-5 text-[#0082FB]" />
          <div>
            <h3 className="text-sm font-extrabold text-black uppercase tracking-wider">
              1. Пороги объема партий и стоимость дополнительных опций
            </h3>
            <p className="text-xs text-gray-500">
              По этим порогам система автоматически переключает клиента с розничного тарифа на оптовый
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Volume Tier 1 */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 uppercase block">
              Порог перехода на Опт (шт.)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1000}
                step={1000}
                value={pricingSettings.volumeTier1}
                onChange={(e) => handleSettingsChange('volumeTier1', parseInt(e.target.value) || 20000)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-extrabold text-black focus:outline-none focus:border-[#0082FB]"
              />
              <span className="text-xs font-bold text-gray-500">шт.</span>
            </div>
            <span className="text-[10px] text-gray-500 block">Партии от 1 до этого значения — розница</span>
          </div>

          {/* Volume Tier 2 */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 uppercase block">
              Порог перехода на Крупный Опт (шт.)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={50000}
                step={5000}
                value={pricingSettings.volumeTier2}
                onChange={(e) => handleSettingsChange('volumeTier2', parseInt(e.target.value) || 100000)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-extrabold text-black focus:outline-none focus:border-[#0082FB]"
              />
              <span className="text-xs font-bold text-gray-500">шт.</span>
            </div>
            <span className="text-[10px] text-gray-500 block">Партии свыше этого значения — максимальная скидка</span>
          </div>

          {/* SSCC price */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 uppercase block">
              Агрегация коробов (SSCC)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={1}
                value={pricingSettings.ssccPrice}
                onChange={(e) => handleSettingsChange('ssccPrice', parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-extrabold text-black focus:outline-none focus:border-[#0082FB]"
              />
              <span className="text-xs font-bold text-gray-500">₸ / шт</span>
            </div>
            <span className="text-[10px] text-gray-500 block">Надбавка за код групповой тары</span>
          </div>

          {/* Sticker layout design */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 uppercase block">
              Разработка макета стикера
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={500}
                value={pricingSettings.stickerLayoutPrice}
                onChange={(e) => handleSettingsChange('stickerLayoutPrice', parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-extrabold text-black focus:outline-none focus:border-[#0082FB]"
              />
              <span className="text-xs font-bold text-gray-500">₸</span>
            </div>
            <span className="text-[10px] text-gray-500 block">Фиксированная разовая плата</span>
          </div>

          {/* Urgent surcharge */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 uppercase block">
              Срочное исполнение (24 часа)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                step={5}
                value={pricingSettings.urgentPercent}
                onChange={(e) => handleSettingsChange('urgentPercent', parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-extrabold text-black focus:outline-none focus:border-[#0082FB]"
              />
              <span className="text-xs font-bold text-gray-500">%</span>
            </div>
            <span className="text-[10px] text-gray-500 block">Процент надбавки к стоимости заказа</span>
          </div>

          {/* Express delivery in KZ */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 uppercase block">
              Курьерская доставка по РК
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={1000}
                value={pricingSettings.expressDeliveryPrice}
                onChange={(e) => handleSettingsChange('expressDeliveryPrice', parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-extrabold text-black focus:outline-none focus:border-[#0082FB]"
              />
              <span className="text-xs font-bold text-gray-500">₸</span>
            </div>
            <span className="text-[10px] text-gray-500 block">Фиксированная стоимость доставки материалов</span>
          </div>
        </div>
      </div>

      {/* Exact Tariff Pricing Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-black uppercase tracking-wider">
              2. Точные цены по тарифам (₸ / шт.)
            </h3>
            <p className="text-xs text-gray-500">
              Укажите точные цены для каждой градации объема и оценочную себестоимость единицы
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tariffs.map((t, idx) => {
            const marginRetail = Math.max(0, (t.priceRetail || 0) - (t.costEstimate || 0));
            const marginPercent = t.priceRetail > 0 ? ((marginRetail / t.priceRetail) * 100).toFixed(0) : 0;

            return (
              <div
                key={t.code}
                className="bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-7 space-y-5 shadow-sm hover:border-gray-300 transition-all"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <h4 className="text-lg font-black text-black">{t.name}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
                  </div>
                  <span className="text-xs font-black font-mono bg-blue-50 text-[#0082FB] px-3 py-1 rounded-xl shrink-0">
                    {t.code}
                  </span>
                </div>

                {/* 3 Price Tiers Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Retail */}
                  <div className="bg-[#F8FAFC] border border-gray-200 rounded-2xl p-3.5 space-y-1">
                    <label className="text-[10px] font-extrabold text-gray-500 uppercase block truncate">
                      Розница (до {pricingSettings.volumeTier1 / 1000}k)
                    </label>
                    <div className="flex items-baseline gap-1">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={t.priceRetail}
                        onChange={(e) =>
                          handleTariffChange(idx, 'priceRetail', parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-white border border-gray-300 rounded-xl px-2.5 py-1.5 text-base font-black text-black focus:outline-none focus:border-[#0082FB]"
                      />
                      <span className="text-xs font-bold text-gray-500">₸</span>
                    </div>
                  </div>

                  {/* Wholesale */}
                  <div className="bg-[#F8FAFC] border border-gray-200 rounded-2xl p-3.5 space-y-1">
                    <label className="text-[10px] font-extrabold text-gray-500 uppercase block truncate">
                      Опт ({pricingSettings.volumeTier1 / 1000}k – {pricingSettings.volumeTier2 / 1000}k)
                    </label>
                    <div className="flex items-baseline gap-1">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={t.priceWholesale}
                        onChange={(e) =>
                          handleTariffChange(idx, 'priceWholesale', parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-white border border-gray-300 rounded-xl px-2.5 py-1.5 text-base font-black text-black focus:outline-none focus:border-[#0082FB]"
                      />
                      <span className="text-xs font-bold text-gray-500">₸</span>
                    </div>
                  </div>

                  {/* Large Wholesale */}
                  <div className="bg-[#F8FAFC] border border-gray-200 rounded-2xl p-3.5 space-y-1">
                    <label className="text-[10px] font-extrabold text-gray-500 uppercase block truncate">
                      Крупный опт (&gt; {pricingSettings.volumeTier2 / 1000}k)
                    </label>
                    <div className="flex items-baseline gap-1">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={t.priceLargeWholesale}
                        onChange={(e) =>
                          handleTariffChange(idx, 'priceLargeWholesale', parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-white border border-gray-300 rounded-xl px-2.5 py-1.5 text-base font-black text-black focus:outline-none focus:border-[#0082FB]"
                      />
                      <span className="text-xs font-bold text-gray-500">₸</span>
                    </div>
                  </div>
                </div>

                {/* Economics / Cost & Margin Bar */}
                <div className="bg-gray-50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-600">Себестоимость:</span>
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      value={t.costEstimate}
                      onChange={(e) =>
                        handleTariffChange(idx, 'costEstimate', parseFloat(e.target.value) || 0)
                      }
                      className="w-20 bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold text-black focus:outline-none focus:border-[#0082FB]"
                    />
                    <span className="text-gray-500 font-semibold">₸/шт</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-semibold">Чистая маржа (розница):</span>
                    <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      +{marginRetail.toFixed(2)} ₸ ({marginPercent}%)
                    </span>
                  </div>
                </div>

                {/* Description & Fit For */}
                <div className="text-[11px] text-gray-500 space-y-1">
                  <div><strong>Для кого подходит:</strong> {t.fitFor}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Order Simulator Sandbox */}
      <div className="bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
          <Calculator className="w-5 h-5 text-[#0082FB]" />
          <div>
            <h3 className="text-sm font-extrabold text-black uppercase tracking-wider">
              3. Песочница проверки расчётов (Симулятор)
            </h3>
            <p className="text-xs text-gray-500">
              Проверьте в реальном времени, какую стоимость увидит клиент и какую прибыль получит компания
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase block mb-1">
                  Тестовый тариф
                </label>
                <select
                  value={simTariff}
                  onChange={(e) => setSimTariff(e.target.value)}
                  className="w-full bg-[#F4F6F9] border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-black focus:outline-none focus:border-[#0082FB]"
                >
                  {tariffs.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 uppercase block mb-1">
                  Количество единиц в партии
                </label>
                <input
                  type="number"
                  min={100}
                  step={1000}
                  value={simCount}
                  onChange={(e) => setSimCount(parseInt(e.target.value) || 1000)}
                  className="w-full bg-[#F4F6F9] border border-gray-300 rounded-xl px-3 py-2 text-xs font-extrabold text-black focus:outline-none focus:border-[#0082FB]"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <label className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={simSscc}
                  onChange={(e) => setSimSscc(e.target.checked)}
                  className="rounded text-[#0082FB]"
                />
                <span className="font-bold text-gray-700">SSCC (+{pricingSettings.ssccPrice}₸)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={simLayout}
                  onChange={(e) => setSimLayout(e.target.checked)}
                  className="rounded text-[#0082FB]"
                />
                <span className="font-bold text-gray-700">Макет (+{pricingSettings.stickerLayoutPrice}₸)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={simUrgent}
                  onChange={(e) => setSimUrgent(e.target.checked)}
                  className="rounded text-[#0082FB]"
                />
                <span className="font-bold text-gray-700">Срочно (+{pricingSettings.urgentPercent}%)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={simDelivery}
                  onChange={(e) => setSimDelivery(e.target.checked)}
                  className="rounded text-[#0082FB]"
                />
                <span className="font-bold text-gray-700">Доставка (+{pricingSettings.expressDeliveryPrice}₸)</span>
              </label>
            </div>
          </div>

          {/* Results Display */}
          <div className="bg-[#F8FAFC] border border-gray-200 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                Расчёт партии ({simCount.toLocaleString()} шт.)
              </span>

              <div className="flex items-baseline justify-between pt-1">
                <span className="text-xs text-gray-600">Цена клиенту за ед.:</span>
                <span className="text-sm font-extrabold text-black">{simFinalUnitPrice} ₸ / шт</span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-xs text-gray-600">Общая сумма заказа:</span>
                <span className="text-xl font-black text-[#0082FB]">{simTotalPrice.toLocaleString()} ₸</span>
              </div>

              <div className="flex items-baseline justify-between pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-600">Себестоимость партии:</span>
                <span className="text-xs font-bold text-gray-700">{simTotalCost.toLocaleString()} ₸</span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-xs font-extrabold text-emerald-800">Чистая прибыль TANBOX:</span>
                <span className="text-sm font-black text-emerald-700">+{simTotalProfit.toLocaleString()} ₸</span>
              </div>
            </div>

            <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-200">
              Рентабельность сделки: <strong className="text-black font-extrabold">{simMarginPercent}%</strong>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
