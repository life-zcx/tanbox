import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import {
  Calculator,
  Users,
  Package,
  Check,
  Copy,
  RotateCcw,
  ArrowLeft,
  Loader2,
  Boxes,
  Percent,
  CheckCircle2,
  Building2,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import {
  CATEGORY_PRESETS,
  WAREHOUSE_CONDITIONS,
  CategoryPreset,
  WarehouseCondition,
  ConditionConfig,
  RiskBufferLevel,
} from '../data/stickeringPresets';

export const AdminStickeringCalcPage: React.FC = () => {
  // Batch parameters
  const [itemsCount, setItemsCount] = useState<number>(5000);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('SHOES');
  const [customSpeed, setCustomSpeed] = useState<number>(200);
  const [unitsPerBox, setUnitsPerBox] = useState<number | string>(12);
  const [boxesPerPallet, setBoxesPerPallet] = useState<number | string>(40);

  // Warehouse & Weather Conditions
  const [warehouseCondition, setWarehouseCondition] = useState<WarehouseCondition>('WARM_HEATED');

  // Contingency & Force Majeure
  const [riskBuffer, setRiskBuffer] = useState<RiskBufferLevel>('STANDARD_10');
  const [codeDefectPercent, setCodeDefectPercent] = useState<number>(3); // 3% reserve for damaged codes/tape tear

  // Labor & Team
  const [workdayHours, setWorkdayHours] = useState<number>(8); // total shift hours
  const effectiveHours = Math.max(1, workdayHours - 1); // 1 hour for lunch, breaks, setup
  const [manualWorkers, setManualWorkers] = useState<number | null>(null); // null = auto-calculate
  const [wageModel, setWageModel] = useState<'DAILY_SHIFT' | 'PIECEWORK'>('DAILY_SHIFT');
  const [dailyWagePerPerson, setDailyWagePerPerson] = useState<number>(15000); // ₸ per 8h shift
  const [pieceworkRate, setPieceworkRate] = useState<number>(10); // ₸ per unit
  const [transportCostPerDay, setTransportCostPerDay] = useState<number>(5000); // ₸ per trip
  const [supervisorPerDay, setSupervisorPerDay] = useState<number>(0); // ₸ per day (0 if not needed)

  // Packaging Materials
  const [includeTape, setIncludeTape] = useState<boolean>(true);
  const [tapePricePerRoll, setTapePricePerRoll] = useState<number>(550); // ₸ for 66m roll
  const [boxesPerTapeRoll, setBoxesPerTapeRoll] = useState<number>(45); // boxes sealed per 1 roll

  const [includeStretch, setIncludeStretch] = useState<boolean>(true);
  const [stretchPricePerRoll, setStretchPricePerRoll] = useState<number>(2600); // ₸ per 2kg roll
  const [stretchRollsPerPallet, setStretchRollsPerPallet] = useState<number>(0.35); // ~1/3 roll per pallet

  const [includeLabelPrint, setIncludeLabelPrint] = useState<boolean>(false);
  const [labelCostPerUnit, setLabelCostPerUnit] = useState<number>(1.8); // ₸ (thermo-transfer label + ribbon)

  const [toolAmortization, setToolAmortization] = useState<number>(1500); // ₸ (gloves, cutters, dispensers)

  // Client Pricing
  const [clientPricePerUnit, setClientPricePerUnit] = useState<number>(45); // ₸ per unit charged to client

  // Copy notification
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedProposal, setCopiedProposal] = useState<boolean>(false);

  // Apply to order state
  const [savingToOrder, setSavingToOrder] = useState<boolean>(false);
  const [savedOrderMsg, setSavedOrderMsg] = useState<string | null>(null);

  // URL query params (if opened from order detail)
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const orderNumber = searchParams.get('orderNumber');
  const qCategory = searchParams.get('category');
  const qCount = searchParams.get('count');
  const qClimate = searchParams.get('climate');
  const qStorage = searchParams.get('storage');
  const qCompany = searchParams.get('company');

  // Prepopulate from URL parameters if present
  useEffect(() => {
    if (qCount) {
      const parsedCount = parseInt(qCount, 10);
      if (!isNaN(parsedCount) && parsedCount > 0) {
        setItemsCount(parsedCount);
      }
    }

    if (qCategory) {
      const found = CATEGORY_PRESETS.find(
        (c) => c.id.toUpperCase() === qCategory.toUpperCase()
      );
      if (found) {
        setSelectedCategoryId(found.id);
        setCustomSpeed(found.defaultSpeed);
        setUnitsPerBox(found.defaultUnitsPerBox);
        setBoxesPerPallet(found.defaultBoxesPerPallet);
      }
    }

    if (qClimate) {
      const foundCond = WAREHOUSE_CONDITIONS.find(
        (w) => w.id.toUpperCase() === qClimate.toUpperCase()
      );
      if (foundCond) {
        setWarehouseCondition(foundCond.id);
      }
    }

    if (qStorage) {
      if (qStorage === 'BOXES') {
        setBoxesPerPallet(0);
      } else if (qStorage === 'LOOSE') {
        setUnitsPerBox(0);
        setBoxesPerPallet(0);
      }
    }
  }, [qCount, qCategory, qClimate, qStorage]);

  // Current category preset
  const currentCategory = useMemo(() => {
    return CATEGORY_PRESETS.find((p) => p.id === selectedCategoryId) || CATEGORY_PRESETS[0];
  }, [selectedCategoryId]);

  // Current condition config
  const currentCondition = useMemo(() => {
    return WAREHOUSE_CONDITIONS.find((c) => c.id === warehouseCondition) || WAREHOUSE_CONDITIONS[0];
  }, [warehouseCondition]);

  // Base Speed resolution adjusted by warehouse climate/weather
  const effectiveSpeedPerHour = useMemo(() => {
    const rawSpeed = selectedCategoryId === 'OTHER' ? (customSpeed > 0 ? customSpeed : 250) : currentCategory.defaultSpeed;
    const weatherAdjusted = Math.round(rawSpeed * currentCondition.speedMultiplier);
    return Math.max(10, weatherAdjusted);
  }, [selectedCategoryId, customSpeed, currentCategory, currentCondition]);

  // Handle Preset Change
  const handleCategoryChange = (catId: string) => {
    setSelectedCategoryId(catId);
    const found = CATEGORY_PRESETS.find((p) => p.id === catId);
    if (found && catId !== 'OTHER') {
      setCustomSpeed(found.defaultSpeed);
      setUnitsPerBox(found.defaultUnitsPerBox);
      setBoxesPerPallet(found.defaultBoxesPerPallet);
    }
  };

  // Reset to default KZ benchmark values
  const handleResetToBenchmarks = () => {
    setItemsCount(5000);
    setSelectedCategoryId('SHOES');
    setCustomSpeed(200);
    setUnitsPerBox(12);
    setBoxesPerPallet(40);
    setWarehouseCondition('WARM_HEATED');
    setRiskBuffer('STANDARD_10');
    setCodeDefectPercent(3);
    setWorkdayHours(8);
    setManualWorkers(null);
    setWageModel('DAILY_SHIFT');
    setDailyWagePerPerson(15000);
    setPieceworkRate(10);
    setTransportCostPerDay(5000);
    setSupervisorPerDay(0);
    setIncludeTape(true);
    setTapePricePerRoll(550);
    setBoxesPerTapeRoll(45);
    setIncludeStretch(true);
    setStretchPricePerRoll(2600);
    setStretchRollsPerPallet(0.35);
    setIncludeLabelPrint(false);
    setLabelCostPerUnit(1.8);
    setToolAmortization(1500);
    setClientPricePerUnit(45);
  };

  // Calculations
  const calc = useMemo(() => {
    const validCount = Math.max(0, typeof itemsCount === 'number' ? itemsCount : parseInt(String(itemsCount), 10) || 0);
    const numUnitsPerBox = Math.max(0, typeof unitsPerBox === 'number' ? unitsPerBox : parseInt(String(unitsPerBox), 10) || 0);
    const numBoxesPerPallet = Math.max(0, typeof boxesPerPallet === 'number' ? boxesPerPallet : parseInt(String(boxesPerPallet), 10) || 0);

    // Physical volumes: 0 means no boxes or no pallets
    const totalBoxes = numUnitsPerBox > 0 ? Math.ceil(validCount / numUnitsPerBox) : 0;
    const totalPallets = numBoxesPerPallet > 0 && totalBoxes > 0 ? Math.ceil(totalBoxes / numBoxesPerPallet) : 0;

    // Weather & speed adjustments
    const totalManHours = validCount > 0 ? validCount / effectiveSpeedPerHour : 0;
    const dailyOutputPerWorker = effectiveSpeedPerHour * effectiveHours;

    // Team recommendations
    const autoWorkersCount = Math.max(1, Math.min(8, Math.ceil(totalManHours / (effectiveHours * 1.5))));
    const workersCount = manualWorkers !== null ? Math.max(1, manualWorkers) : autoWorkersCount;

    // Output and shifts
    const teamOutputPerShift = workersCount * dailyOutputPerWorker;
    const totalShiftsNeeded = totalManHours > 0 ? totalManHours / (workersCount * effectiveHours) : 0;
    const totalDaysNeeded = Math.ceil(totalShiftsNeeded);

    // Materials with climate adjustments and defect reserve
    const materialBufferMultiplier = currentCondition.tapeStretchMultiplier;
    const tapeRollsNeeded = (includeTape && totalBoxes > 0)
      ? Math.ceil((totalBoxes / Math.max(1, boxesPerTapeRoll)) * materialBufferMultiplier)
      : 0;
    const tapeTotalCost = tapeRollsNeeded * tapePricePerRoll;

    const stretchRollsNeeded = (includeStretch && totalPallets > 0)
      ? Math.ceil((totalPallets * stretchRollsPerPallet) * materialBufferMultiplier)
      : 0;
    const stretchTotalCost = stretchRollsNeeded * stretchPricePerRoll;

    // Labels with defect reserve (+3% codes reprint reserve)
    const totalPrintedLabels = Math.ceil(validCount * (1 + codeDefectPercent / 100));
    const labelPrintTotalCost = includeLabelPrint ? Math.round(totalPrintedLabels * labelCostPerUnit) : 0;
    const baseMaterialsTotalCost = tapeTotalCost + stretchTotalCost + labelPrintTotalCost + toolAmortization;

    // Labor costs + climate hazard/tea pay
    let baseWorkersWage = 0;
    if (wageModel === 'DAILY_SHIFT') {
      baseWorkersWage = workersCount * totalDaysNeeded * dailyWagePerPerson;
    } else {
      baseWorkersWage = validCount * pieceworkRate;
    }

    const weatherConditionExtraPay = workersCount * totalDaysNeeded * currentCondition.dailyExtraCostPerWorker;
    const transportTotalCost = totalDaysNeeded * transportCostPerDay;
    const supervisorTotalCost = totalDaysNeeded * supervisorPerDay;
    const baseLaborTotalCost = baseWorkersWage + weatherConditionExtraPay + transportTotalCost + supervisorTotalCost;

    // Direct Prime Cost
    const directPrimeCost = baseMaterialsTotalCost + baseLaborTotalCost;

    // Force Majeure Buffer Percentage
    let riskBufferPercent = 0;
    if (riskBuffer === 'LOW_5') riskBufferPercent = 5;
    else if (riskBuffer === 'STANDARD_10') riskBufferPercent = 10;
    else if (riskBuffer === 'HIGH_20') riskBufferPercent = 20;

    const contingencyFund = Math.round(directPrimeCost * (riskBufferPercent / 100));
    const fullPrimeCost = directPrimeCost + contingencyFund;
    const primeCostPerUnit = fullPrimeCost / validCount;

    // Financial Unit-Economics
    const totalRevenue = Math.round(validCount * clientPricePerUnit);
    const totalGrossProfit = totalRevenue - fullPrimeCost;
    const marginPercent = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

    // Minimum break-even & target price
    const breakEvenPrice = primeCostPerUnit;
    const recommendedTargetPrice = Math.ceil(primeCostPerUnit * 1.35); // target 26% margin

    return {
      validCount,
      totalBoxes,
      totalPallets,
      totalManHours,
      dailyOutputPerWorker,
      workersCount,
      teamOutputPerShift,
      totalShiftsNeeded,
      totalDaysNeeded,
      tapeRollsNeeded,
      tapeTotalCost,
      stretchRollsNeeded,
      stretchTotalCost,
      totalPrintedLabels,
      labelPrintTotalCost,
      baseMaterialsTotalCost,
      baseWorkersWage,
      weatherConditionExtraPay,
      transportTotalCost,
      supervisorTotalCost,
      baseLaborTotalCost,
      directPrimeCost,
      contingencyFund,
      riskBufferPercent,
      fullPrimeCost,
      primeCostPerUnit,
      totalRevenue,
      totalGrossProfit,
      marginPercent,
      breakEvenPrice,
      recommendedTargetPrice,
    };
  }, [
    itemsCount,
    unitsPerBox,
    boxesPerPallet,
    effectiveSpeedPerHour,
    effectiveHours,
    manualWorkers,
    currentCondition,
    includeTape,
    boxesPerTapeRoll,
    tapePricePerRoll,
    includeStretch,
    stretchRollsPerPallet,
    stretchPricePerRoll,
    includeLabelPrint,
    codeDefectPercent,
    labelCostPerUnit,
    toolAmortization,
    wageModel,
    dailyWagePerPerson,
    pieceworkRate,
    transportCostPerDay,
    supervisorPerDay,
    riskBuffer,
    clientPricePerUnit,
  ]);

  // Copy estimate summary
  const handleCopySummary = () => {
    const text = `
=== СМЕТА ВЫЕЗДНОЙ ОКЛЕЙКИ (С УЧЕТОМ УСЛОВИЙ И РИСКОВ) ===
Товар/Категория: ${currentCategory.name}
Условия на складе: ${currentCondition.title} (Коэф. скорости: ${(currentCondition.speedMultiplier * 100).toFixed(0)}%)
Объём партии: ${itemsCount.toLocaleString('ru-RU')} шт. (${calc.totalBoxes} коробов / ${calc.totalPallets} паллет)

⏱ РАСЧЁТ ВРЕМЕНИ И БРИГАДЫ:
- Бригада: ${calc.workersCount} чел.
- Норма выработки бригады: ${calc.teamOutputPerShift.toLocaleString('ru-RU')} шт./смена (${effectiveSpeedPerHour} шт/ч на чел.)
- Расчётный срок: ${calc.totalDaysNeeded} дн. (${calc.totalManHours.toFixed(1)} чел.-часов)

📦 РАСХОДНЫЕ МАТЕРИАЛЫ:
- Скотч упаковочный: ${calc.tapeRollsNeeded} рул. (${calc.tapeTotalCost.toLocaleString('ru-RU')} ₸)
- Стрейч-пленка: ${calc.stretchRollsNeeded} рул. (${calc.stretchTotalCost.toLocaleString('ru-RU')} ₸)
${calc.labelPrintTotalCost > 0 ? `- Термопечать этикеток (${calc.totalPrintedLabels} шт. с запасом): ${calc.labelPrintTotalCost.toLocaleString('ru-RU')} ₸\n` : ''}- Расходники/ножи/перчатки: ${toolAmortization.toLocaleString('ru-RU')} ₸
Итого материалы: ${calc.baseMaterialsTotalCost.toLocaleString('ru-RU')} ₸

👥 ОПЛАТА ТРУДА И ВЫЕЗД:
- Базовая оплата стикеровщиков: ${calc.baseWorkersWage.toLocaleString('ru-RU')} ₸
${calc.weatherConditionExtraPay > 0 ? `- Доплата за климатические условия (${currentCondition.title}): ${calc.weatherConditionExtraPay.toLocaleString('ru-RU')} ₸\n` : ''}- Транспорт/ГСМ: ${calc.transportTotalCost.toLocaleString('ru-RU')} ₸
${calc.supervisorTotalCost > 0 ? `- Супервайзер: ${calc.supervisorTotalCost.toLocaleString('ru-RU')} ₸\n` : ''}Итого персонал: ${calc.baseLaborTotalCost.toLocaleString('ru-RU')} ₸

🛡 РИСКИ И ФОРС-МАЖОР:
- Буфер непредвиденных расходов (${calc.riskBufferPercent}%): ${calc.contingencyFund.toLocaleString('ru-RU')} ₸

💰 ФИНАНСОВЫЙ ИТОГ:
- Полная себестоимость с запасом: ${calc.fullPrimeCost.toLocaleString('ru-RU')} ₸ (${calc.primeCostPerUnit.toFixed(1)} ₸/шт.)
- Выручка по тарифу: ${calc.totalRevenue.toLocaleString('ru-RU')} ₸ (${clientPricePerUnit} ₸/шт.)
- Валовая прибыль (Маржа): ${calc.totalGrossProfit.toLocaleString('ru-RU')} ₸ (${calc.marginPercent.toFixed(1)}%)
======================================================
`.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Copy client proposal for 2-hour SLA response
  const handleCopyClientProposal = () => {
    const lines = [
      `📦 Расчёт выездной оклейки Tanbox для заказа #${orderNumber || orderId}:`,
      `• Товар / Категория: ${currentCategory.name} (${calc.validCount.toLocaleString('ru-RU')} шт.)`,
      `• Условия склада: ${currentCondition.title}`,
      `• Рекомендуемая бригада: ${calc.workersCount} чел.`,
      `• Расчётный срок: ${calc.totalDaysNeeded} дн. (~${calc.totalManHours.toFixed(1)} чел.-часов работы)`,
      calc.totalBoxes > 0 ? `• Упаковка в короба: ~${calc.totalBoxes.toLocaleString('ru-RU')} кор. (${calc.tapeRollsNeeded} рул. скотча)` : '',
      calc.totalPallets > 0 ? `• Паллетирование: ~${calc.totalPallets} паллет (${calc.stretchRollsNeeded} рул. стрейч-пленки)` : '',
      `• Тариф оклейки: ${clientPricePerUnit} ₸ / шт.`,
      `• Итоговая сумма к оплате: ${calc.totalRevenue.toLocaleString('ru-RU')} ₸`,
      `\nСпециалисты готовы к выезду. Согласовываем график допуска на склад.`,
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(lines);
    setCopiedProposal(true);
    setTimeout(() => setCopiedProposal(false), 3000);
  };

  // Apply calculated stickering estimate directly to the order
  const handleApplyToOrder = async () => {
    if (!orderId) return;
    setSavingToOrder(true);
    setSavedOrderMsg(null);
    try {
      await apiClient.patch(`/orders/${orderId}/stickering-estimate`, {
        clientPricePerUnit,
        totalPrice: calc.totalRevenue,
        workersCount: calc.workersCount,
        daysNeeded: calc.totalDaysNeeded,
        manHours: calc.totalManHours,
        warehouseConditionTitle: currentCondition.title,
        tapeRollsNeeded: calc.tapeRollsNeeded,
        stretchRollsNeeded: calc.stretchRollsNeeded,
      });
      setSavedOrderMsg(
        `Смета успешно отправлена в заказ! Новая стоимость: ${calc.totalRevenue.toLocaleString('ru-RU')} ₸ (${clientPricePerUnit} ₸/шт.). Сумма и услуги обновлены в заказе, счёте на оплату и акте выполненных работ.`
      );
      setTimeout(() => setSavedOrderMsg(null), 8000);
    } catch (err: any) {
      alert('Ошибка при сохранении сметы в заказ: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingToOrder(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Contextual Order Banner (if opened from order details) */}
      {orderId && (
        <div className="bg-blue-50/90 border border-blue-200 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#0082FB] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                    Смета для заказа
                  </span>
                  <span className="font-extrabold text-sm text-[#111827]">
                    #{orderNumber || orderId}
                  </span>
                  {qCompany && (
                    <span className="text-xs font-semibold text-gray-600">
                      • {decodeURIComponent(qCompany)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#64748B] mt-1">
                  Категория: <strong className="text-[#111827]">{currentCategory.name}</strong> • Объем: <strong className="text-[#111827]">{calc.validCount.toLocaleString('ru-RU')} шт.</strong> • {currentCondition.title}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleApplyToOrder}
                disabled={savingToOrder}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {savingToOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Сохранение...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Отправить расчёт в заказ</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyClientProposal}
                className="inline-flex items-center gap-1.5 bg-[#0082FB] hover:bg-[#0070DA] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
              >
                {copiedProposal ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedProposal ? 'Скопировано!' : 'Скопировать для клиента (SLA 2ч)'}
              </button>

              <Link
                to={`/orders/${orderId}`}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-gray-500" />
                Вернуться в заказ
              </Link>
            </div>
          </div>

          {savedOrderMsg && (
            <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{savedOrderMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-blue-50 text-[#0082FB] border border-blue-100">
              <Calculator className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-[#111827] tracking-tight">
              Калькулятор выездной оклейки
            </h1>
          </div>
          <p className="text-xs text-[#64748B]">
            Расчёт норм выработки по реестру ИС Танба, учёт погодных условий складов Казахстана и буфер форс-мажоров
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleResetToBenchmarks}
            className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-[#334155] font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
            title="Сбросить все параметры к рыночным нормативам Казахстана"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Нормативы РК</span>
          </button>

          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-2 bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Скопировано в буфер</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Скопировать смету</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Parameters (Left) & Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Inputs & Variables (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section 1: 11 Product Categories & Batch */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-xs font-black text-[#111827] uppercase tracking-wider flex items-center gap-2">
                <Boxes className="w-4 h-4 text-[#0082FB]" />
                1. Объём партии и категория товара
              </span>
              <span className="text-[11px] text-[#64748B] font-medium">
                {calc.totalBoxes > 0 ? `${calc.totalBoxes} коробов` : 'Без коробов'}
                {calc.totalPallets > 0 ? ` • ${calc.totalPallets} паллет` : ''}
              </span>
            </div>

            {/* Total items input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#334155]">Количество товара к оклейке (шт.)</label>
                <span className="text-xs font-mono font-extrabold text-[#0082FB]">
                  {itemsCount.toLocaleString('ru-RU')} шт.
                </span>
              </div>
              <input
                type="number"
                min="100"
                step="500"
                value={itemsCount}
                onChange={(e) => setItemsCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full text-sm font-bold bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
              />
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {[1000, 3000, 5000, 10000, 25000, 50000, 100000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setItemsCount(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                      itemsCount === preset
                        ? 'border-[#0082FB] bg-blue-50 text-[#0082FB]'
                        : 'border-gray-200 bg-white text-[#475569] hover:border-gray-300'
                    }`}
                  >
                    {preset >= 1000 ? `${preset / 1000}k` : preset}
                  </button>
                ))}
              </div>
            </div>

            {/* 11 Official Category Grid */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-[#334155] block">
                Выберите официальную товарную группу Казахстана
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORY_PRESETS.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryChange(cat.id)}
                      className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#0082FB] bg-blue-50/50 shadow-2xs ring-1 ring-[#0082FB]'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#0082FB]' : 'text-gray-500'}`} />
                          <span className={`text-[11px] font-extrabold leading-tight ${isSelected ? 'text-[#0082FB]' : 'text-[#111827]'}`}>
                            {cat.shortName}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-100">
                        <span className="font-semibold">{cat.badge}</span>
                        <span className="font-mono font-bold text-[#111827]">
                          {cat.id === 'OTHER' ? `${customSpeed} шт/ч` : `${cat.defaultSpeed} шт/ч`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Category Description Note */}
              <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-3 text-xs text-[#334155] mt-2 flex items-start gap-2">
                <span className="text-base select-none shrink-0">📦</span>
                <div>
                  <strong className="text-[#111827]">{currentCategory.name}:</strong>{' '}
                  <span className="text-[#475569]">{currentCategory.description}</span>
                </div>
              </div>
            </div>

            {/* Custom speed override if selected */}
            {selectedCategoryId === 'OTHER' && (
              <div className="bg-blue-50/50 border border-blue-200/60 rounded-xl p-3">
                <label className="text-xs font-bold text-[#111827] block mb-1">
                  Базовая скорость на 1 человека (шт. в час)
                </label>
                <input
                  type="number"
                  min="20"
                  max="1500"
                  step="10"
                  value={customSpeed}
                  onChange={(e) => setCustomSpeed(Math.max(10, parseInt(e.target.value, 10) || 10))}
                  className="w-36 text-xs font-bold bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                />
              </div>
            )}

            {/* Units in box & Pallet capacity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-bold text-[#475569] block mb-1">
                  Штук в транспортном коробе
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={unitsPerBox}
                  onChange={(e) => {
                    const val = e.target.value;
                    setUnitsPerBox(val === '' ? '' : Math.max(0, parseInt(val, 10) || 0));
                  }}
                  placeholder="0 — без коробов"
                  className="w-full text-xs font-semibold bg-white border border-gray-200 rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                />
                <span className="text-[10px] text-gray-400 mt-0.5 block">Укажите 0, если товар без коробов</span>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#475569] block mb-1">
                  Коробов на одной паллете
                </label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={boxesPerPallet}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBoxesPerPallet(val === '' ? '' : Math.max(0, parseInt(val, 10) || 0));
                  }}
                  placeholder="0 — без паллет"
                  className="w-full text-xs font-semibold bg-white border border-gray-200 rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                />
                <span className="text-[10px] text-gray-400 mt-0.5 block">Укажите 0, если без паллетирования</span>
              </div>
            </div>
          </div>

          {/* Section 2: Warehouse Climate & Weather Conditions */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-xs font-black text-[#111827] uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0082FB]" />
                2. Условия на складе и погода в РК
              </span>
              <span className="text-[11px] font-bold text-[#0082FB]">
                {currentCondition.badge}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {WAREHOUSE_CONDITIONS.map((cond) => {
                const isSelected = warehouseCondition === cond.id;
                const Icon = cond.icon;
                return (
                  <button
                    key={cond.id}
                    type="button"
                    onClick={() => setWarehouseCondition(cond.id)}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#0082FB] bg-blue-50/50 shadow-2xs ring-1 ring-[#0082FB]'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-[#0082FB]' : 'text-gray-500'}`} />
                        <span className={`text-xs font-extrabold ${isSelected ? 'text-[#0082FB]' : 'text-[#111827]'}`}>
                          {cond.title}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        cond.speedMultiplier < 1 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {cond.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#64748B] leading-relaxed">
                      {cond.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs">
              <span className="text-[#475569] font-medium">
                Эффективная скорость с поправкой на условия:
              </span>
              <span className="font-mono font-black text-[#0082FB]">
                {effectiveSpeedPerHour} шт./час на 1 человека
              </span>
            </div>
          </div>

          {/* Section 3: Force Majeure & Risk Buffer */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-xs font-black text-[#111827] uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#0082FB]" />
                3. Страховка от форс-мажоров и простоев
              </span>
              <span className="text-[11px] font-extrabold text-indigo-700">
                +{calc.contingencyFund.toLocaleString('ru-RU')} ₸ в смету
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#334155] block mb-1.5">
                  Буфер на задержки погрузчика, перепаллечивание и простой техники
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'NONE', label: '0% (Без запаса)', desc: 'Идеальный склад' },
                    { id: 'LOW_5', label: '+5% (Минимум)', desc: 'Малый склад' },
                    { id: 'STANDARD_10', label: '+10% (Норма РК)', desc: 'Рекомендуется' },
                    { id: 'HIGH_20', label: '+20% (Высокий риск)', desc: 'Удалённый СВХ' },
                  ].map((buf) => (
                    <button
                      key={buf.id}
                      type="button"
                      onClick={() => setRiskBuffer(buf.id as RiskBufferLevel)}
                      className={`p-2.5 text-center rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        riskBuffer === buf.id
                          ? 'border-[#0082FB] bg-blue-50 text-[#0082FB] shadow-2xs'
                          : 'border-gray-200 bg-white text-[#475569] hover:border-gray-300'
                      }`}
                    >
                      <span className="block font-black">{buf.label}</span>
                      <span className="block text-[10px] text-gray-500 font-normal">{buf.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Defect percentage for DataMatrix / stickers */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div>
                  <span className="text-xs font-bold text-[#111827] block">
                    Технологический запас этикеток и термоленты
                  </span>
                  <span className="text-[10px] text-[#64748B]">
                    Компенсация замятий, нечитаемых кодов DataMatrix и брака
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 3, 5].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setCodeDefectPercent(pct)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        codeDefectPercent === pct
                          ? 'border-[#0082FB] bg-blue-50 text-[#0082FB]'
                          : 'border-gray-200 bg-white text-gray-600'
                      }`}
                    >
                      +{pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Labor & Team */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-xs font-black text-[#111827] uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0082FB]" />
                4. Состав бригады и оплата труда
              </span>
              <span className="text-[11px] text-[#0082FB] font-bold">
                {calc.workersCount} чел. • {calc.totalDaysNeeded} дн.
              </span>
            </div>

            {/* Workers Count Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#334155]">
                  Количество стикеровщиков на выезде
                </label>
                <button
                  type="button"
                  onClick={() => setManualWorkers(null)}
                  className={`text-[11px] font-bold transition-colors cursor-pointer ${
                    manualWorkers === null ? 'text-[#0082FB]' : 'text-[#64748B] hover:text-[#0082FB]'
                  }`}
                >
                  {manualWorkers === null ? '✓ Авто-расчёт' : 'Включить авто-расчёт'}
                </button>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((num) => {
                  const isCurrent = calc.workersCount === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setManualWorkers(num)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isCurrent
                          ? 'border-[#0082FB] bg-blue-50 text-[#0082FB] shadow-2xs font-extrabold'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {num} чел
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Shift length & wage model */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-bold text-[#475569] block mb-1">
                  Длина рабочей смены
                </label>
                <select
                  value={workdayHours}
                  onChange={(e) => setWorkdayHours(parseInt(e.target.value, 10))}
                  className="w-full text-xs font-semibold bg-white border border-gray-200 rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                >
                  <option value={8}>8 часов (7 ч чистой работы)</option>
                  <option value={10}>10 часов (9 ч чистой работы)</option>
                  <option value={12}>12 часов (10.5 ч чистой работы)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#475569] block mb-1">
                  Модель оплаты
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setWageModel('DAILY_SHIFT')}
                    className={`py-2 px-2 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      wageModel === 'DAILY_SHIFT'
                        ? 'border-[#0082FB] bg-blue-50 text-[#0082FB]'
                        : 'border-gray-200 bg-white text-[#475569] hover:border-gray-300'
                    }`}
                  >
                    За смену (день)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWageModel('PIECEWORK')}
                    className={`py-2 px-2 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      wageModel === 'PIECEWORK'
                        ? 'border-[#0082FB] bg-blue-50 text-[#0082FB]'
                        : 'border-gray-200 bg-white text-[#475569] hover:border-gray-300'
                    }`}
                  >
                    Сдельно (за шт.)
                  </button>
                </div>
              </div>
            </div>

            {/* Wage rate inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-bold text-[#475569] block mb-1">
                  {wageModel === 'DAILY_SHIFT' ? 'Базовая ставка (₸/смена)' : 'Ставка за штуку (₸/шт)'}
                </label>
                {wageModel === 'DAILY_SHIFT' ? (
                  <input
                    type="number"
                    min="5000"
                    step="1000"
                    value={dailyWagePerPerson}
                    onChange={(e) => setDailyWagePerPerson(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full text-xs font-semibold bg-white border border-gray-200 rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                  />
                ) : (
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={pieceworkRate}
                    onChange={(e) => setPieceworkRate(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full text-xs font-semibold bg-white border border-gray-200 rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                  />
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#475569] block mb-1">
                  Транспорт бригады (₸/день)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={transportCostPerDay}
                  onChange={(e) => setTransportCostPerDay(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full text-xs font-semibold bg-white border border-gray-200 rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#475569] block mb-1">
                  Супервайзер (₸/день)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={supervisorPerDay}
                  onChange={(e) => setSupervisorPerDay(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full text-xs font-semibold bg-white border border-gray-200 rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Packaging Materials */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-xs font-black text-[#111827] uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-[#0082FB]" />
                5. Расходные упаковочные материалы
              </span>
              <span className="text-[11px] text-[#64748B] font-medium">
                Итого: {calc.baseMaterialsTotalCost.toLocaleString('ru-RU')} ₸
              </span>
            </div>

            {/* Tape & Stretch options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Tape */}
              <div className="p-3 rounded-xl border border-gray-200/80 bg-gray-50/40 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={includeTape}
                      onChange={(e) => setIncludeTape(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0082FB] focus:ring-[#0082FB]"
                    />
                    <span className="text-xs font-bold text-[#111827]">Скотч упаковочный</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#0082FB] font-bold">
                    {calc.tapeRollsNeeded} рул.
                  </span>
                </label>
                {includeTape && (
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-[#475569]">
                    <span>Цена рулона:</span>
                    <input
                      type="number"
                      value={tapePricePerRoll}
                      onChange={(e) => setTapePricePerRoll(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-20 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                    />
                    <span>₸</span>
                  </div>
                )}
              </div>

              {/* Stretch */}
              <div className="p-3 rounded-xl border border-gray-200/80 bg-gray-50/40 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={includeStretch}
                      onChange={(e) => setIncludeStretch(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0082FB] focus:ring-[#0082FB]"
                    />
                    <span className="text-xs font-bold text-[#111827]">Стрейч-пленка</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#0082FB] font-bold">
                    {calc.stretchRollsNeeded} рул.
                  </span>
                </label>
                {includeStretch && (
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-[#475569]">
                    <span>Цена рулона:</span>
                    <input
                      type="number"
                      value={stretchPricePerRoll}
                      onChange={(e) => setStretchPricePerRoll(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-20 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                    />
                    <span>₸</span>
                  </div>
                )}
              </div>
            </div>

            {/* Label Print & Tool amortization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {/* Thermo Label Print */}
              <div className="p-3 rounded-xl border border-gray-200/80 bg-gray-50/40 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={includeLabelPrint}
                      onChange={(e) => setIncludeLabelPrint(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0082FB] focus:ring-[#0082FB]"
                    />
                    <span className="text-xs font-bold text-[#111827]">Печать стикеров (лента+риббон)</span>
                  </div>
                </label>
                {includeLabelPrint && (
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-[#475569]">
                    <span>Себестоимость 1 шт:</span>
                    <input
                      type="number"
                      step="0.1"
                      value={labelCostPerUnit}
                      onChange={(e) => setLabelCostPerUnit(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-16 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                    />
                    <span>₸</span>
                  </div>
                )}
              </div>

              {/* Tool amortization */}
              <div className="p-3 rounded-xl border border-gray-200/80 bg-gray-50/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#111827]">Амортизация инструмента</span>
                  <span className="text-xs font-mono font-bold text-[#111827]">{toolAmortization} ₸</span>
                </div>
                <p className="text-[10px] text-[#64748B]">Перчатки, ножи, диспенсеры скотча</p>
              </div>
            </div>
          </div>

          {/* Section 6: Client Pricing */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-xs font-black text-[#111827] uppercase tracking-wider flex items-center gap-2">
                <Percent className="w-4 h-4 text-[#0082FB]" />
                6. Стоимость для клиента (Тариф)
              </span>
              <span className="text-xs font-extrabold text-[#0082FB]">
                Выручка: {calc.totalRevenue.toLocaleString('ru-RU')} ₸
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#334155]">
                  Тарифная цена за оклейку 1 единицы (₸/шт.)
                </label>
                <div className="flex items-center gap-1.5">
                  {[35, 45, 55, 65, 105].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setClientPricePerUnit(rate)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                        clientPricePerUnit === rate
                          ? 'border-[#0082FB] bg-blue-50 text-[#0082FB]'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {rate} ₸
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                min="5"
                step="1"
                value={clientPricePerUnit}
                onChange={(e) => setClientPricePerUnit(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full text-sm font-bold bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Results & Unit-Economics (5 cols) */}
        <div className="lg:col-span-5 space-y-5 sticky top-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Days & Shifts */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-2xs">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                Срок оклейки
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-[#111827]">{calc.totalDaysNeeded}</span>
                <span className="text-xs font-bold text-[#64748B]">дн. ({calc.totalShiftsNeeded.toFixed(1)} см.)</span>
              </div>
              <span className="text-[11px] text-[#64748B] block mt-1">
                {calc.totalManHours.toFixed(1)} чел.-часов (скорость: {effectiveSpeedPerHour} шт/ч)
              </span>
            </div>

            {/* Workers team */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-2xs">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                Состав бригады
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-[#0082FB]">{calc.workersCount}</span>
                <span className="text-xs font-bold text-[#0082FB]">чел.</span>
              </div>
              <span className="text-[11px] text-[#64748B] block mt-1">
                Выработка: {calc.teamOutputPerShift.toLocaleString('ru-RU')} шт. / смена
              </span>
            </div>

            {/* Full Prime Cost with Buffer */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-2xs">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                Себестоимость с запасом
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-[#111827]">
                  {calc.fullPrimeCost.toLocaleString('ru-RU')}
                </span>
                <span className="text-xs font-bold text-gray-500">₸</span>
              </div>
              <span className="text-[11px] font-mono text-[#64748B] block mt-1">
                {calc.primeCostPerUnit.toFixed(1)} ₸ / ед. (риск: +{calc.contingencyFund.toLocaleString('ru-RU')} ₸)
              </span>
            </div>

            {/* Gross Profit & Margin */}
            <div className={`border rounded-2xl p-4 shadow-2xs ${
              calc.marginPercent >= 30
                ? 'bg-emerald-50/50 border-emerald-200/80'
                : calc.marginPercent >= 15
                ? 'bg-blue-50/50 border-blue-200/80'
                : 'bg-rose-50/50 border-rose-200/80'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider block mb-1 text-[#475569]">
                Валовая прибыль
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-xl font-black ${
                  calc.marginPercent >= 30
                    ? 'text-emerald-700'
                    : calc.marginPercent >= 15
                    ? 'text-blue-700'
                    : 'text-rose-700'
                }`}>
                  {calc.totalGrossProfit.toLocaleString('ru-RU')} ₸
                </span>
              </div>
              <span className={`text-[11px] font-bold block mt-1 ${
                calc.marginPercent >= 30
                  ? 'text-emerald-700'
                  : calc.marginPercent >= 15
                  ? 'text-blue-700'
                  : 'text-rose-700'
              }`}>
                Маржинальность: {calc.marginPercent.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Detailed Cost Breakdown Table */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
            <span className="text-xs font-black text-[#111827] uppercase tracking-wider block border-b border-gray-100 pb-2">
              Структура расходов на выезд
            </span>

            <div className="space-y-2.5 text-xs">
              {/* Workers wage */}
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-gray-700">Оплата труда стикеровщиков</span>
                </div>
                <span className="font-mono font-bold text-[#111827]">
                  {calc.baseWorkersWage.toLocaleString('ru-RU')} ₸
                </span>
              </div>

              {/* Climate Extra Pay */}
              {calc.weatherConditionExtraPay > 0 && (
                <div className="flex items-center justify-between py-1 border-b border-gray-50 bg-amber-50/40 px-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-amber-900 font-semibold">Доплата: {currentCondition.title}</span>
                  </div>
                  <span className="font-mono font-bold text-amber-900">
                    +{calc.weatherConditionExtraPay.toLocaleString('ru-RU')} ₸
                  </span>
                </div>
              )}

              {/* Transport */}
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-gray-700">Транспортные расходы ({calc.totalDaysNeeded} дн.)</span>
                </div>
                <span className="font-mono font-bold text-[#111827]">
                  {calc.transportTotalCost.toLocaleString('ru-RU')} ₸
                </span>
              </div>

              {/* Supervisor */}
              {calc.supervisorTotalCost > 0 && (
                <div className="flex items-center justify-between py-1 border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-gray-700">Супервайзер / Контроль</span>
                  </div>
                  <span className="font-mono font-bold text-[#111827]">
                    {calc.supervisorTotalCost.toLocaleString('ru-RU')} ₸
                  </span>
                </div>
              )}

              {/* Tape */}
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-gray-700">Скотч ({calc.tapeRollsNeeded} рулонов)</span>
                </div>
                <span className="font-mono font-bold text-[#111827]">
                  {calc.tapeTotalCost.toLocaleString('ru-RU')} ₸
                </span>
              </div>

              {/* Stretch */}
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  <span className="text-gray-700">Стрейч-пленка ({calc.stretchRollsNeeded} рулонов)</span>
                </div>
                <span className="font-mono font-bold text-[#111827]">
                  {calc.stretchTotalCost.toLocaleString('ru-RU')} ₸
                </span>
              </div>

              {/* Label Print */}
              {calc.labelPrintTotalCost > 0 && (
                <div className="flex items-center justify-between py-1 border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    <span className="text-gray-700">Печать стикеров ({calc.totalPrintedLabels} шт. с запасом)</span>
                  </div>
                  <span className="font-mono font-bold text-[#111827]">
                    {calc.labelPrintTotalCost.toLocaleString('ru-RU')} ₸
                  </span>
                </div>
              )}

              {/* Tool amortization */}
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="text-gray-700">Амортизация инструмента</span>
                </div>
                <span className="font-mono font-bold text-[#111827]">
                  {toolAmortization.toLocaleString('ru-RU')} ₸
                </span>
              </div>

              {/* Contingency Buffer */}
              {calc.contingencyFund > 0 && (
                <div className="flex items-center justify-between py-1.5 border-b border-gray-50 bg-indigo-50/50 px-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />
                    <span className="text-indigo-900 font-bold">Буфер форс-мажора (+{calc.riskBufferPercent}%)</span>
                  </div>
                  <span className="font-mono font-black text-indigo-900">
                    +{calc.contingencyFund.toLocaleString('ru-RU')} ₸
                  </span>
                </div>
              )}

              {/* Total cost footer */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="font-extrabold text-[#111827]">Итого себестоимость (с запасом)</span>
                <span className="font-mono font-black text-sm text-[#111827]">
                  {calc.fullPrimeCost.toLocaleString('ru-RU')} ₸
                </span>
              </div>
            </div>

            {/* Visual Margin Bar */}
            <div className="pt-2 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-[#64748B]">Структура выручки:</span>
                <span className="text-emerald-700">Чистая прибыль {calc.marginPercent.toFixed(1)}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-gray-100 flex overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, 100 - calc.marginPercent))}%` }}
                  title={`Себестоимость: ${(100 - calc.marginPercent).toFixed(1)}%`}
                />
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, calc.marginPercent))}%` }}
                  title={`Маржа: ${calc.marginPercent.toFixed(1)}%`}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-500 pt-0.5">
                <span>Расходы и буфер: {(100 - calc.marginPercent).toFixed(1)}%</span>
                <span>Выручка: {calc.totalRevenue.toLocaleString('ru-RU')} ₸</span>
              </div>
            </div>
          </div>

          {/* Pricing Recommendation Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2">
            <span className="text-[11px] font-bold text-[#475569] block">
              💡 Рекомендация рентабельности для коммерческого отдела:
            </span>
            <div className="text-xs text-[#334155] leading-relaxed space-y-1">
              <div>
                • Точка безубыточности: <strong>{calc.breakEvenPrice.toFixed(1)} ₸ / ед.</strong> (ниже этой цены работать в убыток).
              </div>
              <div>
                • Рекомендованный тариф клиенту: не ниже <strong>{calc.recommendedTargetPrice} ₸ / ед.</strong> (гарантирует маржу от 26% даже при задержках на складе).
              </div>
              <div>
                • Оптимальный состав: <strong>{calc.workersCount} чел.</strong> на <strong>{calc.totalDaysNeeded} дн.</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
