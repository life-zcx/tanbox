import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { TariffItem, PricingSettingsItem } from '../types';
import { PageHeader } from '@shared';
import { downloadHtmlAsPdf } from '../utils/clientPdf';
import {
  Save,
  Check,
  RotateCcw,
  Sliders,
  Calculator,
  Loader2,
  AlertCircle,
  FileText,
  FileSpreadsheet,
  Printer,
  Download,
  Copy,
  X,
  CheckCheck,
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
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Price list modal state
  const [showPriceModal, setShowPriceModal] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const printDocRef = useRef<HTMLDivElement>(null);

  // Simulator state
  const [simTariff, setSimTariff] = useState<string>('STANDARD');
  const [simCount, setSimCount] = useState<number>(25000);
  const [simSscc, setSimSscc] = useState<boolean>(true);
  const [simUrgent, setSimUrgent] = useState<boolean>(false);
  const [simLayout, setSimLayout] = useState<boolean>(false);
  const [simDelivery, setSimDelivery] = useState<boolean>(false);

  useEffect(() => {
    fetchTariffs();
  }, []);

  const fetchTariffs = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.get('/tariffs');
      if (res.data.tariffs && Array.isArray(res.data.tariffs)) {
        const parsedTariffs = res.data.tariffs.map((t: any) => ({
          ...t,
          priceRetail: Number(t.priceRetail) || 0,
          priceWholesale: Number(t.priceWholesale) || 0,
          priceLargeWholesale: Number(t.priceLargeWholesale) || 0,
          costEstimate: Number(t.costEstimate) || 0,
        }));
        setTariffs(parsedTariffs);
      }
      if (res.data.pricingSettings) {
        setPricingSettings({
          ssccPrice: Number(res.data.pricingSettings.ssccPrice) || 5,
          stickerLayoutPrice: Number(res.data.pricingSettings.stickerLayoutPrice) || 5000,
          urgentPercent: Number(res.data.pricingSettings.urgentPercent) || 20,
          expressDeliveryPrice: Number(res.data.pricingSettings.expressDeliveryPrice) || 15000,
          volumeTier1: Number(res.data.pricingSettings.volumeTier1) || 20000,
          volumeTier2: Number(res.data.pricingSettings.volumeTier2) || 100000,
        });
      }
      setHasUnsavedChanges(false);
    } catch (e: any) {
      console.error('Failed to fetch tariffs:', e);
      setErrorMsg('Не удалось загрузить актуальные тарифы с сервера');
    } finally {
      setLoading(false);
    }
  };

  const handleTariffChange = (
    index: number,
    field: keyof TariffItem,
    rawVal: string | number
  ) => {
    setTariffs((prev) => {
      const updated = [...prev];
      const val = rawVal === '' ? 0 : Number(rawVal);
      updated[index] = { ...updated[index], [field]: isNaN(val) ? 0 : val };
      return updated;
    });
    setHasUnsavedChanges(true);
    setSavedSuccess(false);
  };

  const handleSettingsChange = (
    field: keyof PricingSettingsItem,
    rawVal: string | number
  ) => {
    const val = rawVal === '' ? 0 : Number(rawVal);
    setPricingSettings((prev) => ({
      ...prev,
      [field]: isNaN(val) ? 0 : val,
    }));
    setHasUnsavedChanges(true);
    setSavedSuccess(false);
  };

  const applyMarketBenchmarks = () => {
    if (!window.confirm('Заполнить поля рекомендованными рыночными ставками РК?')) {
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

    setPricingSettings({ ...MARKET_BENCHMARKS.settings });
    setHasUnsavedChanges(true);
    setSavedSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSavedSuccess(false);

    try {
      const payloadTariffs = tariffs.map((t) => ({
        code: t.code,
        name: t.name,
        description: t.description,
        fitFor: t.fitFor,
        priceRetail: Math.max(0.1, Number(t.priceRetail) || 0),
        priceWholesale: Math.max(0.1, Number(t.priceWholesale) || 0),
        priceLargeWholesale: Math.max(0.1, Number(t.priceLargeWholesale) || 0),
        costEstimate: Math.max(0, Number(t.costEstimate) || 0),
      }));

      const payloadSettings = {
        ssccPrice: Math.max(0, Number(pricingSettings.ssccPrice) || 0),
        stickerLayoutPrice: Math.max(0, Number(pricingSettings.stickerLayoutPrice) || 0),
        urgentPercent: Math.max(0, Number(pricingSettings.urgentPercent) || 0),
        expressDeliveryPrice: Math.max(0, Number(pricingSettings.expressDeliveryPrice) || 0),
        volumeTier1: Math.max(100, Math.floor(Number(pricingSettings.volumeTier1) || 20000)),
        volumeTier2: Math.max(
          Math.floor(Number(pricingSettings.volumeTier1) || 20000) + 100,
          Math.floor(Number(pricingSettings.volumeTier2) || 100000)
        ),
      };

      const res = await apiClient.put('/tariffs', {
        tariffs: payloadTariffs,
        pricingSettings: payloadSettings,
      });

      if (res.data?.tariffs && Array.isArray(res.data.tariffs)) {
        const synced = res.data.tariffs.map((t: any) => ({
          ...t,
          priceRetail: Number(t.priceRetail) || 0,
          priceWholesale: Number(t.priceWholesale) || 0,
          priceLargeWholesale: Number(t.priceLargeWholesale) || 0,
          costEstimate: Number(t.costEstimate) || 0,
        }));
        setTariffs(synced);
      }

      if (res.data?.pricingSettings) {
        setPricingSettings({
          ssccPrice: Number(res.data.pricingSettings.ssccPrice) || 0,
          stickerLayoutPrice: Number(res.data.pricingSettings.stickerLayoutPrice) || 0,
          urgentPercent: Number(res.data.pricingSettings.urgentPercent) || 0,
          expressDeliveryPrice: Number(res.data.pricingSettings.expressDeliveryPrice) || 0,
          volumeTier1: Number(res.data.pricingSettings.volumeTier1) || 20000,
          volumeTier2: Number(res.data.pricingSettings.volumeTier2) || 100000,
        });
      }

      const now = new Date();
      const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedTime(timeStr);
      setSavedSuccess(true);
      setHasUnsavedChanges(false);

      setTimeout(() => {
        setSavedSuccess(false);
      }, 5000);
    } catch (e: any) {
      console.error('Failed to save tariffs:', e);
      const serverMessage = e.response?.data?.message || e.message || 'Ошибка сохранения тарифов';
      setErrorMsg(serverMessage);
    } finally {
      setSaving(false);
    }
  };

  // Download 1-page PDF directly using html2pdf
  const handleDownloadPdf = async () => {
    if (!printDocRef.current) return;
    setDownloadingPdf(true);
    try {
      const html = printDocRef.current.outerHTML;
      await downloadHtmlAsPdf(html, {
        filename: `tanbox-price-list-${new Date().toISOString().slice(0, 10)}.pdf`,
        landscape: false,
      });
    } catch (e) {
      console.error('Failed to generate PDF:', e);
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Copy price list to clipboard as formatted text
  const handleCopyPriceText = () => {
    const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    const tier1Fmt = (pricingSettings.volumeTier1 / 1000).toFixed(0);
    const tier2Fmt = (pricingSettings.volumeTier2 / 1000).toFixed(0);

    let text = `📋 КОММЕРЧЕСКИЙ ПРАЙС-ЛИСТ | TANBOX КАЗАХСТАН\n`;
    text += `Услуги маркировки товаров ИС «Танба» (актуально на ${today})\n`;
    text += `--------------------------------------------------\n\n`;
    text += `ТАРИФЫ НА МАРКИРОВКУ (₸ за единицу товара):\n\n`;

    tariffs.forEach((t) => {
      text += `🔹 ${t.name}\n`;
      text += `   • Розница (до ${tier1Fmt} тыс. шт): ${t.priceRetail} ₸/шт\n`;
      text += `   • Опт (${tier1Fmt} - ${tier2Fmt} тыс. шт): ${t.priceWholesale} ₸/шт\n`;
      text += `   • Крупный опт (от ${tier2Fmt} тыс. шт): ${t.priceLargeWholesale} ₸/шт\n`;
      text += `   • Состав: ${t.description}\n\n`;
    });

    text += `ДОПОЛНИТЕЛЬНЫЕ УСЛУГИ:\n`;
    text += `• Агрегация коробов (SSCC коды): ${pricingSettings.ssccPrice} ₸/короб\n`;
    text += `• Разработка макета этикетки: ${pricingSettings.stickerLayoutPrice.toLocaleString()} ₸\n`;
    text += `• Срочное исполнение (24 часа): +${pricingSettings.urgentPercent}%\n`;
    text += `• Курьерская доставка по РК: ${pricingSettings.expressDeliveryPrice.toLocaleString()} ₸\n\n`;
    text += `--------------------------------------------------\n`;
    text += `✓ Официальный договор (ИП INTERSENSE, ИИН 990601301525), ЭСФ и АВР\n`;
    text += `✓ 100% гарантия считываемости кодов DataMatrix\n`;
    text += `✓ Тел.: +7 (700) 304-85-32 | sales@tanbox.kz | www.tanbox.kz`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);
  };

  // Simulator calculation
  const simSelectedTariff = tariffs.find((t) => t.code === simTariff) || tariffs[0];
  const simUnitPriceBase =
    simCount > pricingSettings.volumeTier2
      ? Number(simSelectedTariff?.priceLargeWholesale) || 0
      : simCount > pricingSettings.volumeTier1
        ? Number(simSelectedTariff?.priceWholesale) || 0
        : Number(simSelectedTariff?.priceRetail) || 0;

  const simUnitAdditions =
    simSscc && simTariff !== 'PRO' ? Number(pricingSettings.ssccPrice) || 0 : 0;
  const simFlatAdditions =
    (simLayout ? Number(pricingSettings.stickerLayoutPrice) || 0 : 0) +
    (simDelivery ? Number(pricingSettings.expressDeliveryPrice) || 0 : 0);

  const simFinalUnitPrice = simUnitPriceBase + simUnitAdditions;
  let simTotalPrice = simFinalUnitPrice * simCount + simFlatAdditions;
  if (simUrgent) simTotalPrice *= 1 + (Number(pricingSettings.urgentPercent) || 0) / 100;
  simTotalPrice = Math.round(simTotalPrice);

  const simCostBase = Number(simSelectedTariff?.costEstimate) || 0;
  const simTotalCost = Math.round(simCostBase * simCount);
  const simTotalProfit = Math.round(simTotalPrice - simTotalCost);
  const simMarginPercent = simTotalPrice > 0 ? ((simTotalProfit / simTotalPrice) * 100).toFixed(1) : '0';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-3">
        <Loader2 className="w-8 h-8 text-[#0082FB] animate-spin" />
        <span className="text-sm font-semibold text-gray-500">Загрузка тарифной сетки...</span>
      </div>
    );
  }

  const tier1K = Math.round(pricingSettings.volumeTier1 / 1000);
  const tier2K = Math.round(pricingSettings.volumeTier2 / 1000);

  return (
    <div className="space-y-6 w-full">
      {/* Top Header - Consistent with Admin System Design */}
      <PageHeader
        title="Настройка точных цен и тарифов"
        description="Управление точными ставками (розница, опт, крупный опт), себестоимостью и дополнительными услугами маркировки ИС Танба"
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Market Standard Reset */}
            <button
              type="button"
              onClick={applyMarketBenchmarks}
              className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
              title="Заполнить стандартными рыночными ставками РК"
            >
              <RotateCcw className="w-3.5 h-3.5 text-gray-600" />
              <span>Стандарт РК</span>
            </button>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={`inline-flex items-center gap-2 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer disabled:opacity-50 ${hasUnsavedChanges
                ? 'bg-[#0082FB] hover:bg-[#0070DA] ring-2 ring-blue-400/40'
                : 'bg-[#0082FB] hover:bg-[#0070DA]'
                }`}
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
        }
      />

      {/* Save Success Alert */}
      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold p-4 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-extrabold text-emerald-800">Настройки цен и тарифная сетка успешно сохранены в базе данных!</span>
              {lastSavedTime && (
                <span className="text-emerald-700 ml-2 font-normal">Время фиксации: {lastSavedTime}</span>
              )}
            </div>
          </div>
          <span className="text-[11px] text-emerald-700 hidden sm:inline font-normal">
            Все новые расчёты на сайте и в Личном кабинете клиентов будут производиться по обновлённым ценам.
          </span>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-900 text-xs font-bold p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-red-500 hover:text-red-700 text-xs font-extrabold cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      )}

      {/* Unsaved Changes Warning Badge */}
      {hasUnsavedChanges && !savedSuccess && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold p-3 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Вы изменили цены или пороги объемов. Не забудьте нажать «Сохранить цены», чтобы применить их в системе.</span>
          </div>
        </div>
      )}

      {/* Section 1: Volume Tiers & Extra Options */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-6 space-y-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-[#0082FB]" />
            <h2 className="text-sm font-extrabold text-black">
              1. Пороги объема партий и стоимость дополнительных опций
            </h2>
          </div>
          <span className="text-xs text-gray-400">По этим порогам система автоматически переключает клиента с розничного тарифа на оптовый</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Tier 1 */}
          <div className="bg-gray-50/90 border border-gray-200 rounded-xl p-3.5 space-y-1.5">
            <label className="text-[11px] font-extrabold text-gray-700 block">
              Порог перехода на Опт
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1000}
                step={1000}
                value={pricingSettings.volumeTier1}
                onChange={(e) => handleSettingsChange('volumeTier1', e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-black text-black focus:outline-none focus:border-[#0082FB]"
              />
              <span className="text-xs font-bold text-gray-500 shrink-0">шт.</span>
            </div>
            <p className="text-[10px] text-gray-500">Партии от 1 до этого порога — розничная ставка</p>
          </div>

          {/* Tier 2 */}
          <div className="bg-gray-50/90 border border-gray-200 rounded-xl p-3.5 space-y-1.5">
            <label className="text-[11px] font-extrabold text-gray-700 block">
              Порог перехода на Крупный опт
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={50000}
                step={5000}
                value={pricingSettings.volumeTier2}
                onChange={(e) => handleSettingsChange('volumeTier2', e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-black text-black focus:outline-none focus:border-[#0082FB]"
              />
              <span className="text-xs font-bold text-gray-500 shrink-0">шт.</span>
            </div>
            <p className="text-[10px] text-gray-500">Партии свыше этого порога — максимальная оптовая скидка</p>
          </div>

          {/* SSCC price */}
          <div className="bg-gray-50/90 border border-gray-200 rounded-xl p-3.5 space-y-1.5">
            <label className="text-[11px] font-extrabold text-gray-700 block">
              Агрегация коробов (SSCC)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={1}
                value={pricingSettings.ssccPrice}
                onChange={(e) => handleSettingsChange('ssccPrice', e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-black text-black focus:outline-none focus:border-[#0082FB]"
              />
              <span className="text-xs font-bold text-gray-500 shrink-0">₸ / короб</span>
            </div>
            <p className="text-[10px] text-gray-500">Надбавка за код групповой тары</p>
          </div>

          {/* Layout design */}
          <div className="bg-gray-50/90 border border-gray-200 rounded-xl p-3.5 space-y-1.5">
            <label className="text-[11px] font-extrabold text-gray-700 block">
              Разработка макета стикера
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={500}
                value={pricingSettings.stickerLayoutPrice}
                onChange={(e) => handleSettingsChange('stickerLayoutPrice', e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-black text-black focus:outline-none focus:border-[#0082FB]"
              />
              <span className="text-xs font-bold text-gray-500 shrink-0">₸</span>
            </div>
            <p className="text-[10px] text-gray-500">Фиксированная разовая плата</p>
          </div>

          {/* Urgent surcharge */}
          <div className="bg-gray-50/90 border border-gray-200 rounded-xl p-3.5 space-y-1.5">
            <label className="text-[11px] font-extrabold text-gray-700 block">
              Срочное исполнение (24 часа)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                step={5}
                value={pricingSettings.urgentPercent}
                onChange={(e) => handleSettingsChange('urgentPercent', e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-black text-black focus:outline-none focus:border-[#0082FB]"
              />
              <span className="text-xs font-bold text-gray-500 shrink-0">%</span>
            </div>
            <p className="text-[10px] text-gray-500">Процент надбавки к стоимости заказа</p>
          </div>

          {/* Express delivery */}
          <div className="bg-gray-50/90 border border-gray-200 rounded-xl p-3.5 space-y-1.5">
            <label className="text-[11px] font-extrabold text-gray-700 block">
              Курьерская доставка по РК
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={1000}
                value={pricingSettings.expressDeliveryPrice}
                onChange={(e) => handleSettingsChange('expressDeliveryPrice', e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-black text-black focus:outline-none focus:border-[#0082FB]"
              />
              <span className="text-xs font-bold text-gray-500 shrink-0">₸</span>
            </div>
            <p className="text-[10px] text-gray-500">Фиксированная стоимость доставки материалов</p>
          </div>
        </div>
      </div>

      {/* Section 2: Tariffs Grid */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-extrabold text-black">
            2. Точные цены по тарифам (₸ / шт.)
          </h2>
          <p className="text-xs text-gray-500">
            Укажите точные цены для каждой градации объема и оценочную себестоимость единицы
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {tariffs.map((t, idx) => {
            const retail = Number(t.priceRetail) || 0;
            const cost = Number(t.costEstimate) || 0;
            const marginRetail = Math.max(0, retail - cost);
            const marginPercent = retail > 0 ? ((marginRetail / retail) * 100).toFixed(0) : 0;

            return (
              <div
                key={t.code}
                className="bg-white border border-gray-200/90 rounded-2xl p-5 space-y-4 shadow-sm hover:border-gray-300 transition-all"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-base font-black text-black">{t.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">{t.description}</p>
                  </div>
                  <span className="text-xs font-black font-mono bg-blue-50 text-[#0082FB] px-2.5 py-1 rounded-lg shrink-0">
                    {t.code}
                  </span>
                </div>

                {/* 3 Price Inputs Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Retail */}
                  <div className="bg-[#F8FAFC] border border-gray-200 rounded-xl p-3 space-y-1">
                    <label className="text-[10px] font-extrabold text-gray-600 uppercase block truncate">
                      Розница (до {tier1K}k)
                    </label>
                    <div className="flex items-baseline gap-1">
                      <input
                        type="number"
                        min={0.1}
                        step={1}
                        value={t.priceRetail}
                        onChange={(e) => handleTariffChange(idx, 'priceRetail', e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-sm font-black text-black focus:outline-none focus:border-[#0082FB]"
                      />
                      <span className="text-xs font-bold text-gray-500">₸</span>
                    </div>
                  </div>

                  {/* Wholesale */}
                  <div className="bg-[#F8FAFC] border border-gray-200 rounded-xl p-3 space-y-1">
                    <label className="text-[10px] font-extrabold text-gray-600 uppercase block truncate">
                      Опт ({tier1K}k–{tier2K}k)
                    </label>
                    <div className="flex items-baseline gap-1">
                      <input
                        type="number"
                        min={0.1}
                        step={1}
                        value={t.priceWholesale}
                        onChange={(e) => handleTariffChange(idx, 'priceWholesale', e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-sm font-black text-black focus:outline-none focus:border-[#0082FB]"
                      />
                      <span className="text-xs font-bold text-gray-500">₸</span>
                    </div>
                  </div>

                  {/* Large Wholesale */}
                  <div className="bg-[#F8FAFC] border border-gray-200 rounded-xl p-3 space-y-1">
                    <label className="text-[10px] font-extrabold text-gray-600 uppercase block truncate">
                      Крупный опт (&gt;{tier2K}k)
                    </label>
                    <div className="flex items-baseline gap-1">
                      <input
                        type="number"
                        min={0.1}
                        step={1}
                        value={t.priceLargeWholesale}
                        onChange={(e) => handleTariffChange(idx, 'priceLargeWholesale', e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-sm font-black text-black focus:outline-none focus:border-[#0082FB]"
                      />
                      <span className="text-xs font-bold text-gray-500">₸</span>
                    </div>
                  </div>
                </div>

                {/* Economics / Cost & Margin Bar */}
                <div className="bg-gray-50 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-600">Себестоимость:</span>
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      value={t.costEstimate}
                      onChange={(e) => handleTariffChange(idx, 'costEstimate', e.target.value)}
                      className="w-20 bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold text-black focus:outline-none focus:border-[#0082FB]"
                    />
                    <span className="text-gray-500 font-semibold">₸/шт</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-semibold">Чистая маржа (розница):</span>
                    <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                      +{marginRetail.toFixed(2)} ₸ ({marginPercent}%)
                    </span>
                  </div>
                </div>

                {/* Fit For Note */}
                {t.fitFor && (
                  <p className="text-[11px] text-gray-500">
                    <strong className="text-gray-700">Подходит для:</strong> {t.fitFor}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Simulator Sandbox */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-4 h-4 text-[#0082FB]" />
            <h2 className="text-sm font-extrabold text-black">
              3. Песочница проверки расчётов (Симулятор)
            </h2>
          </div>
          <span className="text-xs text-gray-400">Проверьте в реальном времени, какую стоимость увидит клиент и какую прибыль получит компания</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {/* Controls */}
          <div className="lg:col-span-2 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
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
                <label className="text-xs font-bold text-gray-700 block mb-1">
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
          <div className="bg-[#F8FAFC] border border-gray-200 rounded-xl p-4 space-y-2.5">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
              Расчёт партии ({simCount.toLocaleString()} шт.)
            </span>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Цена клиенту за ед.:</span>
              <span className="text-sm font-extrabold text-black">{simFinalUnitPrice} ₸ / шт</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Сумма заказа:</span>
              <span className="text-lg font-black text-[#0082FB]">{simTotalPrice.toLocaleString()} ₸</span>
            </div>

            <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-xs">
              <span className="text-gray-600">Себестоимость:</span>
              <span className="text-xs font-bold text-gray-700">{simTotalCost.toLocaleString()} ₸</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-xs font-extrabold text-emerald-800">Чистая прибыль TANBOX:</span>
              <span className="text-sm font-black text-emerald-700">+{simTotalProfit.toLocaleString()} ₸</span>
            </div>

            <div className="pt-2 border-t border-gray-200 text-[10px] text-gray-500 flex justify-between">
              <span>Рентабельность сделки:</span>
              <span className="text-black font-extrabold">{simMarginPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL: COMMERCIAL PRICE LIST (PORTAL & STRICT 1-PAGE A4) ================= */}
      {showPriceModal &&
        createPortal(
          <div
            id="tanbox-price-modal-portal"
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 backdrop-blur-md p-3 sm:p-5 overflow-y-auto"
          >
            <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-gray-200 max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Top Control Bar (Screen only, hidden on print) */}
              <div className="print:hidden flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-gray-50/90 shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#0082FB]" />
                  <span className="text-xs font-extrabold text-gray-900">
                    Коммерческий Прайс-лист TANBOX (А4)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Download PDF directly */}
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={downloadingPdf}
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    title="Скачать PDF документ (ровно 1 лист А4)"
                  >
                    {downloadingPdf ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Генерация PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Скачать PDF</span>
                      </>
                    )}
                  </button>

                  {/* Print / Save PDF via Browser */}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 bg-[#0082FB] hover:bg-[#0070DA] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
                    title="Печать (1 страница)"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Печать</span>
                  </button>

                  {/* Copy text */}
                  <button
                    type="button"
                    onClick={handleCopyPriceText}
                    className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-200 transition-all cursor-pointer"
                    title="Скопировать текст для WhatsApp / Email"
                  >
                    {copiedText ? (
                      <>
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 text-[11px]">Скопировано!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-gray-500" />
                        <span>Копия</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPriceModal(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-200 transition-all cursor-pointer ml-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Printable Body - Engineered for Exact 1-Page A4 Fit */}
              <div className="overflow-y-auto p-4 sm:p-6 bg-gray-100/60 print:p-0 print:bg-white flex justify-center">
                <div
                  ref={printDocRef}
                  id="printable-price-list"
                  className="w-full max-w-[210mm] bg-white p-6 sm:p-7 space-y-3.5 text-gray-900 border border-gray-200 print:border-0 rounded-2xl print:rounded-none shadow-sm print:shadow-none box-border"
                  style={{ minHeight: 'auto' }}
                >
                  {/* Header with Site Logo */}
                  <div className="border-b-2 border-gray-900 pb-3 flex justify-between items-end gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <img src="/tanbox-dark.svg" alt="TANBOX.KZ" className="h-6 w-auto" />
                        <span className="bg-[#0082FB] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
                          ПРАЙС-ЛИСТ
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight leading-tight">
                        Услуги маркировки товаров ИС «Танба»
                      </h2>
                      <p className="text-[11px] text-gray-500">
                        Республика Казахстан • Эмиссия DataMatrix кодов, печать, оклейка и агрегация
                      </p>
                    </div>

                    <div className="text-right text-[11px] text-gray-600 space-y-0.5 shrink-0">
                      <div>
                        <strong className="text-gray-900">Дата:</strong>{' '}
                        {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      <div>
                        <strong className="text-gray-900">Валюта:</strong> Казахстанский тенге (₸)
                      </div>
                      <div className="text-[10px] text-emerald-700 font-bold">Официальное предложение</div>
                    </div>
                  </div>

                  {/* Section 1: Main Tariffs Table - Clean and High Contrast */}
                  <div className="space-y-1.5">
                    <h3 className="text-[11px] font-black uppercase tracking-wider text-gray-900">
                      1. Базовые тарифы на единицу маркировки (₸ / шт.)
                    </h3>

                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-gray-100 border-b border-gray-200 text-gray-800 font-black">
                            <th className="py-2 px-3 w-[24%]">Тариф</th>
                            <th className="py-2 px-3 w-[46%]">Состав услуги</th>
                            <th className="py-2 px-2.5 text-right font-black w-[10%]">
                              Розница<br />
                              <span className="text-[9px] font-normal text-gray-500">до {tier1K}k</span>
                            </th>
                            <th className="py-2 px-2.5 text-right font-black w-[10%]">
                              Опт<br />
                              <span className="text-[9px] font-normal text-gray-500">{tier1K}–{tier2K}k</span>
                            </th>
                            <th className="py-2 px-2.5 text-right font-black w-[10%]">
                              Крупный<br />
                              <span className="text-[9px] font-normal text-gray-500">&gt;{tier2K}k</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-150">
                          {tariffs.map((t) => (
                            <tr key={t.code} className="hover:bg-gray-50/50">
                              <td className="py-2 px-3 align-middle">
                                <div className="font-black text-xs text-gray-900 leading-tight">{t.name}</div>
                                <span className="text-[9px] font-mono font-bold text-gray-400 uppercase">
                                  {t.code}
                                </span>
                              </td>
                              <td className="py-2 px-3 align-middle text-gray-600 leading-snug text-[11px]">
                                {t.description}
                              </td>
                              <td className="py-2 px-2.5 align-middle text-right font-black text-gray-900 text-xs whitespace-nowrap">
                                {t.priceRetail} ₸
                              </td>
                              <td className="py-2 px-2.5 align-middle text-right font-black text-gray-900 text-xs whitespace-nowrap">
                                {t.priceWholesale} ₸
                              </td>
                              <td className="py-2 px-2.5 align-middle text-right font-black text-[#0082FB] text-xs whitespace-nowrap">
                                {t.priceLargeWholesale} ₸
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 2: Additional Services Grid - 4 Tight Cards */}
                  <div className="space-y-1.5">
                    <h3 className="text-[11px] font-black uppercase tracking-wider text-gray-900">
                      2. Сопутствующие услуги и опции
                    </h3>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="font-extrabold text-[11px] text-gray-900">Агрегация коробов (SSCC)</div>
                          <div className="text-[10px] text-gray-500">Групповые логистические коды</div>
                        </div>
                        <div className="text-xs font-black text-gray-900 shrink-0 ml-2">
                          {pricingSettings.ssccPrice} ₸ <span className="text-[9px] font-normal text-gray-500">/ короб</span>
                        </div>
                      </div>

                      <div className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="font-extrabold text-[11px] text-gray-900">Разработка макета стикера</div>
                          <div className="text-[10px] text-gray-500">Дизайн этикетки по ГОСТ/ТР ТС</div>
                        </div>
                        <div className="text-xs font-black text-gray-900 shrink-0 ml-2">
                          {pricingSettings.stickerLayoutPrice.toLocaleString()} ₸ <span className="text-[9px] font-normal text-gray-500">разово</span>
                        </div>
                      </div>

                      <div className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="font-extrabold text-[11px] text-gray-900">Срочность (до 24 часов)</div>
                          <div className="text-[10px] text-gray-500">Приоритетная эмиссия и отгрузка</div>
                        </div>
                        <div className="text-xs font-black text-gray-900 shrink-0 ml-2">
                          +{pricingSettings.urgentPercent}% <span className="text-[9px] font-normal text-gray-500">к партии</span>
                        </div>
                      </div>

                      <div className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="font-extrabold text-[11px] text-gray-900">Курьерская доставка по РК</div>
                          <div className="text-[10px] text-gray-500">Доставка материалов до дверей</div>
                        </div>
                        <div className="text-xs font-black text-gray-900 shrink-0 ml-2">
                          {pricingSettings.expressDeliveryPrice.toLocaleString()} ₸ <span className="text-[9px] font-normal text-gray-500">фикс</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Guarantees & Terms */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-[11px] space-y-1">
                    <div className="font-extrabold text-gray-900">Гарантии и условия:</div>
                    <div className="grid grid-cols-3 gap-2 text-gray-600 text-[10px] leading-tight">
                      <div>
                        <strong className="text-gray-800 block mb-0.5">✓ Официальный договор</strong>
                        Полный комплект документов (ЭСФ, АВР).
                      </div>
                      <div>
                        <strong className="text-gray-800 block mb-0.5">✓ 100% считываемость</strong>
                        Промышленная верификация 2D кодов.
                      </div>
                      <div>
                        <strong className="text-gray-800 block mb-0.5">✓ Прямая интеграция</strong>
                        Прямая связь с ИС «Танба» РК.
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-[10px] text-gray-500">
                    <div>ИП INTERSENSE • ИИН: 990601301525 • г. Алматы, мкр. Атырау, д. 8</div>
                    <div className="font-semibold text-gray-700">Телефон: +7 (700) 304-85-32 • sales@tanbox.kz • www.tanbox.kz</div>
                  </div>
                </div>
              </div>

              {/* Bottom Close Bar */}
              <div className="print:hidden px-5 py-2.5 border-t border-gray-200 bg-gray-50 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPriceModal(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-extrabold px-4 py-1.5 rounded-xl transition-all cursor-pointer"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Global Print Styles - Strict 1-Page A4 Isolation */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: 100% !important;
            max-height: 100% !important;
            background: #ffffff !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide EVERYTHING in body except the portal modal */
          body > *:not(#tanbox-price-modal-portal) {
            display: none !important;
          }
          #tanbox-price-modal-portal {
            position: static !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            width: 100% !important;
            height: 100% !important;
            overflow: visible !important;
          }
          #tanbox-price-modal-portal > div {
            max-width: 100% !important;
            width: 100% !important;
            max-height: none !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
          }
          #printable-price-list {
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
