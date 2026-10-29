import React, { useMemo, useState, useEffect } from 'react';
import { useCalculator } from '../../hooks/useCalculator';
import { TariffCode } from '../../types';
import {
  ArrowRight,
  Check,
  ChevronDown,
  HelpCircle,
  X,
  MessageCircle,
  GraduationCap,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { TariffHelpModal } from '../modals/TariffHelpModal';
import { ServiceOrderModal } from '../modals/ServiceOrderModal';

interface CalculatorSectionProps {
  onOrderQuick: (tariff: TariffCode, count: number, price: number) => void;
  hideHeading?: boolean;
}

export const CalculatorSection: React.FC<CalculatorSectionProps> = ({
  onOrderQuick,
  hideHeading = false,
}) => {
  const { lang } = useLanguage();
  const {
    tariffType,
    setTariffType,
    itemsCount,
    setItemsCount,
    ssccNeeded,
    setSsccNeeded,
    extraServices,
    toggleExtraService,
    result,
    dbTariffs,
    dbPricingSettings,
  } = useCalculator();

  const [activeTab, setActiveTab] = useState<'batch' | 'outsourcing' | 'cards' | 'training'>('batch');
  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);
  const [tariffHelpTab, setTariffHelpTab] = useState<'batch' | 'outsourcing' | 'cards' | 'training'>('batch');
  const [inputValue, setInputValue] = useState<string>(itemsCount > 0 ? itemsCount.toLocaleString('ru-RU') : '');

  // Outsourcing tab state
  const [outsourcingPlan, setOutsourcingPlan] = useState<'tier1' | 'tier2' | 'tier3' | 'tier4' | 'onetime'>('tier2');

  // Cards tab state (capped at logical 10 000 SKU limit)
  const MAX_SKU_LIMIT = 10000;
  const [skuCount, setSkuCount] = useState<number>(1);
  const [skuInputValue, setSkuInputValue] = useState<string>('1');
  const [skuType, setSkuType] = useState<'mpt' | 'nkt' | 'full'>('full');

  // Service Order modal state
  const [isServiceOrderOpen, setIsServiceOrderOpen] = useState(false);
  const [serviceOrderTitle, setServiceOrderTitle] = useState('');

  // Synchronize input display with itemsCount
  useEffect(() => {
    if (itemsCount === 0) {
      setInputValue('');
    } else {
      setInputValue(itemsCount.toLocaleString('ru-RU'));
    }
  }, [itemsCount]);

  // Derived prices from dbPricingSettings (with rock-solid fallbacks)
  const outsourcingOneTime = dbPricingSettings?.outsourcingOneTimePrice ?? 100000;
  const outsourcingTier1 = dbPricingSettings?.outsourcingTier1Price ?? 200000;
  const outsourcingTier2 = dbPricingSettings?.outsourcingTier2Price ?? 300000;
  const outsourcingTier3 = dbPricingSettings?.outsourcingTier3Price ?? 400000;
  const outsourcingTier4 = dbPricingSettings?.outsourcingTier4Price ?? 500000;

  const cardNktPrice = dbPricingSettings?.cardNktPrice ?? 200;
  const cardMptPrice = dbPricingSettings?.cardMptPrice ?? 300;
  const cardFullPrice = dbPricingSettings?.cardFullPackagePrice ?? 400;

  const trainingCoursePrice = dbPricingSettings?.trainingCoursePrice ?? 100000;

  const getTariffPriceFrom = (code: TariffCode, fallback: number) => {
    const found = dbTariffs?.find((t) => t.code === code);
    const minPrice = found?.priceLargeWholesale ?? found?.priceMin ?? fallback;
    if (lang === 'kz') return `${minPrice} ₸ / данадан`;
    if (lang === 'en') return `from ${minPrice} ₸ / pcs`;
    return `от ${minPrice} ₸ / шт.`;
  };

  const tariffsList = useMemo(() => {
    if (lang === 'kz') {
      return [
        {
          code: 'DIGITAL' as TariffCode,
          name: 'Сандық',
          desc: 'Тек Data Matrix кодтарының эмиссиясы',
          priceFrom: getTariffPriceFrom('DIGITAL', 10),
          includes: [
            '«Таңба» АЖ-де кодтардың эмиссиясы',
            'Дайын макеттерді жүктеу (PDF / Excel)',
            'Басып шығарусыз (жеке жабдық үшін)',
          ],
        },
        {
          code: 'PRINT' as TariffCode,
          name: 'Баспа',
          desc: 'Жапсырма рулондарын басып шығару',
          priceFrom: getTariffPriceFrom('PRINT', 25),
          includes: [
            'Data Matrix кодтарының эмиссиясы',
            'Рулондарды термотрансферлік баспа',
            'Төзімді стикерлердің дайын рулондары',
          ],
        },
        {
          code: 'STANDARD' as TariffCode,
          name: 'Стандарт',
          desc: 'Басып шығару және кілтке дейін оклейка',
          priceFrom: getTariffPriceFrom('STANDARD', 50),
          includes: [
            'Эмиссия + стикерлерді басып шығару',
            'Стикерлеушілер тобының қоймаға шығуы',
            'Қорапты ашпай ағынды оклейка жасау',
            '2D-сканермен оқылу сапасын 100% тексеру',
          ],
        },
        {
          code: 'PRO' as TariffCode,
          name: 'PRO Қойма',
          desc: 'Оклейка және қораптарға агрегациялау (SSCC)',
          priceFrom: getTariffPriceFrom('PRO', 90),
          includes: [
            '«Стандарт» тарифіндегі барлық қызметтер',
            'Қораптарды ашу және артикулдарды тексеру',
            'Өнімді жекелеп жапсырып, қайта жинау',
            'SSCC кодтарын қалыптастыру және басу',
          ],
        },
      ];
    }

    if (lang === 'en') {
      return [
        {
          code: 'DIGITAL' as TariffCode,
          name: 'Digital',
          desc: 'Data Matrix code emission only',
          priceFrom: getTariffPriceFrom('DIGITAL', 10),
          includes: [
            'Code emission in IS Tanba',
            'Ready layout export (PDF / Excel)',
            'Without printing (for internal printers)',
          ],
        },
        {
          code: 'PRINT' as TariffCode,
          name: 'Print',
          desc: 'Industrial roll printing',
          priceFrom: getTariffPriceFrom('PRINT', 25),
          includes: [
            'Data Matrix code generation',
            'Thermal transfer roll printing',
            'Durable industrial roll labels',
          ],
        },
        {
          code: 'STANDARD' as TariffCode,
          name: 'Standard',
          desc: 'Turnkey printing & stickering',
          priceFrom: getTariffPriceFrom('STANDARD', 50),
          includes: [
            'Emission + roll sticker printing',
            'Onsite stickering crew dispatch',
            'Batch stickering without box unboxing',
            '100% 2D scanner readability verification',
          ],
        },
        {
          code: 'PRO' as TariffCode,
          name: 'PRO Warehouse',
          desc: 'Unboxing, labeling & SSCC aggregation',
          priceFrom: getTariffPriceFrom('PRO', 90),
          includes: [
            'Everything included in Standard',
            'Unpacking boxes & SKU cross-checking',
            'Piece-by-piece relabeling & repacking',
            'SSCC aggregation code generation & print',
          ],
        },
      ];
    }

    return [
      {
        code: 'DIGITAL' as TariffCode,
        name: 'Цифровой',
        desc: 'Только эмиссия кодов Data Matrix',
        priceFrom: getTariffPriceFrom('DIGITAL', 10),
        includes: [
          'Эмиссия кодов в ИС Танба',
          'Выгрузка готовых макетов (PDF / Excel)',
          'Без нанесения (для своей печати)',
        ],
      },
      {
        code: 'PRINT' as TariffCode,
        name: 'Печать',
        desc: 'Печать рулонов стикеров',
        priceFrom: getTariffPriceFrom('PRINT', 25),
        includes: [
          'Эмиссия кодов Data Matrix',
          'Термотрансферная печать в рулонах',
          'Готовые рулоны стойких этикеток',
        ],
      },
      {
        code: 'STANDARD' as TariffCode,
        name: 'Стандарт',
        desc: 'Печать и оклейка под ключ',
        priceFrom: getTariffPriceFrom('STANDARD', 50),
        includes: [
          'Эмиссия + печать этикеток в рулонах',
          'Выезд бригады оклейщиков на склад',
          'Поточная оклейка без вскрытия коробов',
          '100% верификация считываемости 2D-сканером',
        ],
      },
      {
        code: 'PRO' as TariffCode,
        name: 'PRO Склад',
        desc: 'Оклейка и агрегация в короба (SSCC)',
        priceFrom: getTariffPriceFrom('PRO', 90),
        includes: [
          'Всё, что входит в тариф «Стандарт»',
          'Вскрытие коробов и сверка артикулов',
          'Поштучная оклейка и переупаковка',
          'Формирование и печать кодов SSCC',
        ],
      },
    ];
  }, [lang, dbTariffs]);

  const presets = [1000, 5000, 10000, 25000, 50000, 100000];
  const selectedTariff = tariffsList.find((t) => t.code === tariffType) || tariffsList[2];

  // Helpers for WhatsApp and Lead Modal
  const openLeadModal = (title: string) => {
    setServiceOrderTitle(title);
    setIsServiceOrderOpen(true);
  };

  const currentOutsourcingPrice = useMemo(() => {
    switch (outsourcingPlan) {
      case 'tier1':
        return outsourcingTier1;
      case 'tier2':
        return outsourcingTier2;
      case 'tier3':
        return outsourcingTier3;
      case 'tier4':
        return outsourcingTier4;
      case 'onetime':
        return outsourcingOneTime;
    }
  }, [outsourcingPlan, outsourcingTier1, outsourcingTier2, outsourcingTier3, outsourcingTier4, outsourcingOneTime]);

  const currentCardUnitPrice = useMemo(() => {
    switch (skuType) {
      case 'nkt':
        return cardNktPrice;
      case 'mpt':
        return cardMptPrice;
      case 'full':
        return cardFullPrice;
    }
  }, [skuType, cardNktPrice, cardMptPrice, cardFullPrice]);

  const currentCardsTotal = useMemo(() => {
    return skuCount * currentCardUnitPrice;
  }, [skuCount, currentCardUnitPrice]);

  return (
    <section
      id="calculator"
      className={hideHeading ? 'pb-12 sm:pb-16 bg-[#F4F6F9]' : 'py-12 sm:py-16 bg-[#F4F6F9]'}
    >
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        {!hideHeading && (
          <div className="mb-6 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
              {lang === 'kz'
                ? 'Тауарларды таңбалау және B2B қызметтер калькуляторы (₸)'
                : lang === 'en'
                ? 'Marking & B2B Services Cost Calculator (₸)'
                : 'Калькулятор стоимости маркировки и B2B услуг (₸)'}
            </h2>
            <p className="text-sm sm:text-base text-[#64748B]">
              {lang === 'kz'
                ? 'Партияны таңбалау, ай сайынғы аутсорсинг, тауар карточкалары мен оқыту құнын есептеңіз.'
                : lang === 'en'
                ? 'Calculate pricing for batch serialization, monthly outsourcing, product cards, and staff training.'
                : 'Рассчитайте стоимость маркировки партии, ежемесячного аутсорсинга, заведения карточек товаров или обучения.'}
            </p>
          </div>
        )}

        {/* Top Segmented Tabs Switcher (Clean, calm enterprise style) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('batch')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'batch'
                ? 'bg-[#111827] text-white shadow-xs'
                : 'bg-white text-gray-700 hover:text-black hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {lang === 'kz' ? 'Топтаманы таңбалау' : lang === 'en' ? 'Batch Serialization' : 'Партия под ключ'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('outsourcing')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'outsourcing'
                ? 'bg-[#111827] text-white shadow-xs'
                : 'bg-white text-gray-700 hover:text-black hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {lang === 'kz' ? 'Толық аутсорсинг' : lang === 'en' ? 'Turnkey Outsourcing' : 'Полный аутсорсинг'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cards')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'cards'
                ? 'bg-[#111827] text-white shadow-xs'
                : 'bg-white text-gray-700 hover:text-black hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {lang === 'kz' ? 'Тауар карточкалары' : lang === 'en' ? 'Product Cards' : 'Операции с карточками товаров'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('training')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'training'
                ? 'bg-[#111827] text-white shadow-xs'
                : 'bg-white text-gray-700 hover:text-black hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {lang === 'kz' ? 'Оқыту' : lang === 'en' ? 'Training' : 'Обучение'}
          </button>
        </div>

        {/* TAB 1: BATCH MARKING (EXISTING FULL CALCULATOR) */}
        {activeTab === 'batch' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/80 space-y-8 animate-in fade-in duration-200">
            {/* 1. Tariff Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                  {lang === 'kz' ? '1. Тарифті таңдаңыз' : lang === 'en' ? '1. Select Tariff' : '1. Выберите тариф'}
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#64748B] hidden sm:inline">
                    {lang === 'kz' ? 'Таңдалды:' : lang === 'en' ? 'Selected:' : 'Выбран:'}{' '}
                    <strong className="text-[#0082FB]">{selectedTariff.name}</strong> ({selectedTariff.priceFrom})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setTariffHelpTab('batch');
                      setIsTariffModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0082FB] hover:text-[#0070DA] bg-blue-50/80 hover:bg-blue-100/80 px-3 py-1.5 rounded-xl border border-blue-200/60 transition-all cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'kz' ? 'Тарифтер анықтамалығы' : lang === 'en' ? 'Tariff Guide' : 'Справка по тарифам'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {tariffsList.map((t) => {
                  const isSelected = tariffType === t.code;
                  return (
                    <div
                      key={t.code}
                      onClick={() => setTariffType(t.code)}
                      className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#0082FB] bg-blue-50/30 shadow-xs'
                          : 'border-gray-200/90 hover:border-gray-300 bg-white hover:bg-gray-50/50'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-extrabold text-[#111827] text-base leading-snug">
                              {t.name}
                            </h3>
                            <p className="text-xs text-[#64748B] mt-0.5">{t.desc}</p>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                              isSelected ? 'border-[#0082FB] bg-[#0082FB]' : 'border-gray-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-gray-100">
                          <span className="text-xs font-extrabold text-[#0082FB] tracking-tight">
                            {t.priceFrom}
                          </span>
                        </div>

                        <ul className="space-y-1.5 pt-1">
                          {t.includes.map((inc, i) => (
                            <li key={i} className="text-xs text-[#475569] flex items-start gap-1.5">
                              <span className="text-[#0082FB] font-bold text-xs leading-none shrink-0 mt-0.5">•</span>
                              <span className="leading-tight">{inc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Volume Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label
                  htmlFor="calculator-quantity"
                  className="text-xs font-bold text-[#111827] uppercase tracking-wider"
                >
                  {lang === 'kz' ? '2. Тауар санын енгізіңіз' : lang === 'en' ? '2. Specify Quantity' : '2. Укажите количество товара'}
                </label>
                <span className="text-xs text-[#64748B]">
                  {lang === 'kz' ? 'Бірлігі: дана / код' : lang === 'en' ? 'Units: pcs / codes' : 'Единица: штук / кодов'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                  <div className="relative flex-1">
                    <input
                      id="calculator-quantity"
                      type="text"
                      inputMode="numeric"
                      value={inputValue}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        if (!raw) {
                          setInputValue('');
                          setItemsCount(0);
                          return;
                        }
                        const parsed = Math.min(parseInt(raw.slice(0, 8), 10) || 0, 5000000);
                        setInputValue(parsed.toLocaleString('ru-RU'));
                        setItemsCount(parsed);
                      }}
                      placeholder="0"
                      className="w-full bg-[#F4F6F9] border border-gray-200 focus:border-[#0082FB] focus:bg-white rounded-2xl px-5 py-3.5 text-xl font-extrabold text-[#111827] outline-none transition-all placeholder:text-gray-400"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#64748B] pointer-events-none uppercase">
                      {lang === 'kz' ? 'дана' : lang === 'en' ? 'pcs' : 'шт.'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {presets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setItemsCount(preset)}
                        className={`px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                          itemsCount === preset
                            ? 'bg-[#111827] text-white shadow-xs'
                            : 'bg-[#F4F6F9] text-[#475569] hover:bg-gray-200/80 hover:text-[#111827]'
                        }`}
                      >
                        {preset >= 1000 ? `${preset / 1000}k` : preset}
                      </button>
                    ))}
                    {itemsCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setItemsCount(0)}
                        className="px-3 py-3 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{lang === 'kz' ? 'Тазалау' : lang === 'en' ? 'Clear' : 'Сброс'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {itemsCount >= 5000000 && (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200/80 rounded-xl px-3.5 py-2 font-medium">
                    {lang === 'kz'
                      ? 'Ең жоғары онлайн есептеу көлемі — 5 000 000 дана. Ірі өндірістік көлемдер үшін жеке шарт қарастырылған.'
                      : lang === 'en'
                      ? 'Maximum online calculation is 5,000,000 units. For enterprise scale volumes, individual contracts apply.'
                      : 'Максимальный объем онлайн-расчета — 5 000 000 шт. Для сверхкрупных партий предусмотрен индивидуальный контракт.'}
                  </p>
                )}
              </div>
            </div>

            {/* 3. Additional Options */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-[#111827] uppercase tracking-wider block">
                {lang === 'kz' ? '3. Қосымша опциялар' : lang === 'en' ? '3. Optional Services' : '3. Дополнительные опции'}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* SSCC */}
                <div
                  onClick={() => setSsccNeeded(!ssccNeeded)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    ssccNeeded
                      ? 'border-[#0082FB] bg-blue-50/30'
                      : 'border-gray-200/80 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      ssccNeeded ? 'border-[#0082FB] bg-[#0082FB]' : 'border-gray-300 bg-white'
                    }`}
                  >
                    {ssccNeeded && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#111827]">
                      {lang === 'kz' ? 'SSCC агрегациясы' : lang === 'en' ? 'SSCC Aggregation' : 'Агрегация коробов (SSCC)'}
                    </h4>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      +{dbPricingSettings?.ssccPrice ?? 5} ₸ / короб
                    </p>
                  </div>
                </div>

                {/* Sticker layout */}
                <div
                  onClick={() => toggleExtraService('STICKER_LAYOUT_DESIGN')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    extraServices.includes('STICKER_LAYOUT_DESIGN')
                      ? 'border-[#0082FB] bg-blue-50/30'
                      : 'border-gray-200/80 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      extraServices.includes('STICKER_LAYOUT_DESIGN') ? 'border-[#0082FB] bg-[#0082FB]' : 'border-gray-300 bg-white'
                    }`}
                  >
                    {extraServices.includes('STICKER_LAYOUT_DESIGN') && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#111827]">
                      {lang === 'kz' ? 'Стикер макетін әзірлеу' : lang === 'en' ? 'Sticker Layout Design' : 'Разработка макета'}
                    </h4>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      +{(dbPricingSettings?.stickerLayoutPrice ?? 5000).toLocaleString()} ₸
                    </p>
                  </div>
                </div>

                {/* Express delivery */}
                <div
                  onClick={() => toggleExtraService('EXPRESS_DELIVERY')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    extraServices.includes('EXPRESS_DELIVERY')
                      ? 'border-[#0082FB] bg-blue-50/30'
                      : 'border-gray-200/80 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      extraServices.includes('EXPRESS_DELIVERY') ? 'border-[#0082FB] bg-[#0082FB]' : 'border-gray-300 bg-white'
                    }`}
                  >
                    {extraServices.includes('EXPRESS_DELIVERY') && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#111827]">
                      {lang === 'kz' ? 'ҚР бойынша жедел жеткізу' : lang === 'en' ? 'Express Delivery' : 'Курьерская доставка по РК'}
                    </h4>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      +{(dbPricingSettings?.expressDeliveryPrice ?? 15000).toLocaleString()} ₸
                    </p>
                  </div>
                </div>

                {/* Urgent */}
                <div
                  onClick={() => toggleExtraService('URGENT_PROCESSING')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    extraServices.includes('URGENT_PROCESSING')
                      ? 'border-[#0082FB] bg-blue-50/30'
                      : 'border-gray-200/80 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      extraServices.includes('URGENT_PROCESSING') ? 'border-[#0082FB] bg-[#0082FB]' : 'border-gray-300 bg-white'
                    }`}
                  >
                    {extraServices.includes('URGENT_PROCESSING') && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#111827]">
                      {lang === 'kz' ? 'Шұғыл орындау (24 сағат)' : lang === 'en' ? 'Urgent (24h turnaround)' : 'Срочное исполнение'}
                    </h4>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      +{dbPricingSettings?.urgentPercent ?? 20}% к заказу
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Results Bar */}
            <div className="pt-6 border-t border-gray-200/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block">
                  {lang === 'kz' ? 'Жалпы есептік құны' : lang === 'en' ? 'Total Estimated Price' : 'Итоговая расчетная стоимость'}
                </span>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-black text-[#111827] tracking-tight">
                    {result.totalPrice > 0 ? `${result.totalPrice.toLocaleString('ru-RU')} ₸` : '0 ₸'}
                  </span>
                  {result.itemsCount > 0 && (
                    <span className="text-xs sm:text-sm font-semibold text-[#0082FB]">
                      ≈ {result.unitPrice} ₸ / {lang === 'kz' ? 'дана' : lang === 'en' ? 'pcs' : 'шт.'}
                    </span>
                  )}
                  {result.estimatedDays > 0 && itemsCount > 0 && (
                    <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg font-bold border border-emerald-200/60">
                      Срок: ~{result.estimatedDays} {result.estimatedDays === 1 ? 'день' : 'дня'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={() => {
                    if (itemsCount <= 0) {
                      const input = document.getElementById('calculator-quantity');
                      input?.focus();
                      return;
                    }
                    onOrderQuick(tariffType, itemsCount, result.totalPrice);
                  }}
                  className="w-full sm:w-auto bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-sm py-3.5 px-7 rounded-xl transition-all shadow-md shadow-[#0082FB]/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{lang === 'kz' ? 'Тапсырыс беру' : lang === 'en' ? 'Order Batch' : 'Оформить партию'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href={`https://wa.me/77003048532?text=${encodeURIComponent(
                    `Здравствуйте! Хочу заказать маркировку партии в TANBOX:\nТариф: ${selectedTariff.name}\nКоличество: ${itemsCount.toLocaleString()} шт.\nРасчетная стоимость: ${result.totalPrice.toLocaleString()} ₸`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3.5 px-5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FULL OUTSOURCING (Matching competitor clean structure) */}
        {activeTab === 'outsourcing' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/80 space-y-6 animate-in fade-in duration-200">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="space-y-1.5 max-w-3xl">
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
                  Полный аутсорсинг маркировки
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Передайте регулярные операционные процессы маркировки специалистам TANBOX — по модели внешней профильной команды.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTariffHelpTab('outsourcing');
                  setIsTariffModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0082FB] hover:text-[#0070DA] bg-blue-50/80 hover:bg-blue-100/80 px-3 py-1.5 rounded-xl border border-blue-200/60 transition-all cursor-pointer shrink-0"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>
                  {lang === 'kz' ? 'Тарифтер анықтамалығы' : lang === 'en' ? 'Tariff Guide' : 'Справка по тарифам'}
                </span>
              </button>
            </div>

            {/* Section: One-time */}
            <div className="space-y-2.5 pt-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                Разовый аутсорсинг
              </span>
              <div
                onClick={() => setOutsourcingPlan('onetime')}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  outsourcingPlan === 'onetime'
                    ? 'border-[#0082FB] bg-blue-50/20 shadow-xs'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      outsourcingPlan === 'onetime' ? 'border-[#0082FB]' : 'border-gray-300'
                    }`}
                  >
                    {outsourcingPlan === 'onetime' && <div className="w-2.5 h-2.5 rounded-full bg-[#0082FB]" />}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[#111827] text-sm sm:text-base">
                      Аутсорсинг по заявке
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Разовое выполнение согласованного объёма работ
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-base sm:text-lg font-black text-[#111827]">
                    от {outsourcingOneTime.toLocaleString()} ₸
                  </span>
                  <span className="text-xs text-gray-400 font-medium block">За заявку</span>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Стоимость зависит от состава и объёма работ: количества товарных карточек, кодов маркировки и других операций.
              </p>
            </div>

            {/* Section: Monthly */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                Ежемесячный аутсорсинг
              </span>
              <div className="space-y-2.5">
                {[
                  { id: 'tier1', title: 'До 5 000 кодов в месяц', price: outsourcingTier1 },
                  { id: 'tier2', title: 'До 10 000 кодов в месяц', price: outsourcingTier2 },
                  { id: 'tier3', title: 'До 50 000 кодов в месяц', price: outsourcingTier3 },
                  { id: 'tier4', title: 'До 100 000 кодов в месяц', price: outsourcingTier4 },
                ].map((tier) => (
                  <div
                    key={tier.id}
                    onClick={() => setOutsourcingPlan(tier.id as any)}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      outsourcingPlan === tier.id
                        ? 'border-[#0082FB] bg-blue-50/20 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          outsourcingPlan === tier.id ? 'border-[#0082FB]' : 'border-gray-300'
                        }`}
                      >
                        {outsourcingPlan === tier.id && <div className="w-2.5 h-2.5 rounded-full bg-[#0082FB]" />}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[#111827] text-sm sm:text-base">
                          {tier.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">Полный аутсорсинг</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base sm:text-lg font-black text-[#111827]">
                        {tier.price.toLocaleString()} ₸
                      </span>
                      <span className="text-xs text-gray-400 font-medium block">В месяц</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400">
                Точный состав выполняемых операций фиксируется при подключении услуги.
              </p>
            </div>

            {/* Bottom summary bar */}
            <div className="pt-6 border-t border-gray-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-gray-400 font-bold uppercase block">Выбранный тариф:</span>
                <span className="text-2xl sm:text-3xl font-black text-[#111827]">
                  {currentOutsourcingPrice.toLocaleString()} ₸
                  <span className="text-xs text-gray-500 font-normal ml-1.5">
                    {outsourcingPlan === 'onetime' ? '/ за заявку' : '/ в месяц'}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() =>
                    openLeadModal(
                      `Аутсорсинг маркировки (${
                        outsourcingPlan === 'onetime' ? 'По заявке' : `План ${outsourcingPlan.toUpperCase()}`
                      }, ${currentOutsourcingPrice.toLocaleString()} ₸)`
                    )
                  }
                  className="flex-1 sm:flex-none bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-sm py-3.5 px-7 rounded-xl transition-all shadow-md shadow-[#0082FB]/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Оставить заявку</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href={`https://wa.me/77003048532?text=${encodeURIComponent(
                    `Здравствуйте! Интересует аутсорсинг маркировки TANBOX (${
                      outsourcingPlan === 'onetime' ? 'По заявке' : `План ${outsourcingPlan.toUpperCase()}`
                    }, ${currentOutsourcingPrice.toLocaleString()} ₸). Подскажите подробнее.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3.5 px-5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCT CARDS (Matching competitor clean structure) */}
        {activeTab === 'cards' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/80 space-y-6 animate-in fade-in duration-200">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="space-y-1.5 max-w-3xl">
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
                  Операции с карточками товаров
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Создание и регистрация номенклатуры в национальных системах и каталогах маркировки Республики Казахстан.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTariffHelpTab('cards');
                  setIsTariffModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0082FB] hover:text-[#0070DA] bg-blue-50/80 hover:bg-blue-100/80 px-3 py-1.5 rounded-xl border border-blue-200/60 transition-all cursor-pointer shrink-0"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>
                  {lang === 'kz' ? 'Тарифтер анықтамалығы' : lang === 'en' ? 'Tariff Guide' : 'Справка по тарифам'}
                </span>
              </button>
            </div>

            {/* Quantity input */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                Количество товаров
              </label>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center bg-[#F4F6F9] border border-gray-200 rounded-2xl px-3 py-1.5 w-40">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={skuInputValue}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      if (!raw) {
                        setSkuInputValue('');
                        setSkuCount(1);
                        return;
                      }
                      const parsed = Math.max(1, Math.min(parseInt(raw.slice(0, 5), 10) || 1, MAX_SKU_LIMIT));
                      setSkuInputValue(parsed.toLocaleString('ru-RU'));
                      setSkuCount(parsed);
                    }}
                    onBlur={() => {
                      if (!skuInputValue || skuCount < 1) {
                        setSkuInputValue('1');
                        setSkuCount(1);
                      } else {
                        setSkuInputValue(skuCount.toLocaleString('ru-RU'));
                      }
                    }}
                    className="w-full text-center bg-transparent font-extrabold text-lg text-[#111827] outline-none"
                  />
                  <div className="flex flex-col ml-1 border-l border-gray-200 pl-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.min(MAX_SKU_LIMIT, skuCount + 1);
                        setSkuCount(next);
                        setSkuInputValue(next.toLocaleString('ru-RU'));
                      }}
                      className="p-0.5 hover:text-[#0082FB] cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.max(1, skuCount - 1);
                        setSkuCount(next);
                        setSkuInputValue(next.toLocaleString('ru-RU'));
                      }}
                      className="p-0.5 hover:text-[#0082FB] cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {[5, 10, 25, 50, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setSkuCount(preset);
                        setSkuInputValue(preset.toLocaleString('ru-RU'));
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        skuCount === preset
                          ? 'bg-[#111827] text-white'
                          : 'bg-[#F4F6F9] text-gray-600 hover:bg-gray-200/80 hover:text-black'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {skuCount >= MAX_SKU_LIMIT && (
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200/80 rounded-xl px-3.5 py-2 font-medium">
                  {lang === 'kz'
                    ? 'Калькулятордағы ең жоғары көлем — 10 000 тауар. Ірі каталогтар үшін өтінім қалдырыңыз.'
                    : lang === 'en'
                    ? 'Maximum online calculation is 10,000 SKUs. Contact us for larger catalogs.'
                    : 'Максимальный объем онлайн-расчета — 10 000 товаров. Для более крупных каталогов оставьте заявку.'}
                </p>
              )}
            </div>

            {/* Radio options exactly matching screenshot media_1793258264813.png */}
            <div className="space-y-2.5 pt-2">
              {[
                {
                  id: 'mpt',
                  title: 'ИС МПТ',
                  desc: 'Создание карточки товара в ИС МПТ',
                  price: cardMptPrice,
                  badge: null,
                },
                {
                  id: 'nkt',
                  title: 'НКТ',
                  desc: 'Создание карточки товара в НКТ',
                  price: cardNktPrice,
                  badge: null,
                },
                {
                  id: 'full',
                  title: 'GS1 + ИС МПТ + НКТ',
                  desc: 'Комплексное создание карточки сразу в трёх системах',
                  price: cardFullPrice,
                  badge: 'Полный пакет',
                },
              ].map((card) => (
                <div
                  key={card.id}
                  onClick={() => setSkuType(card.id as any)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    skuType === card.id
                      ? 'border-[#0082FB] bg-blue-50/20 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        skuType === card.id ? 'border-[#0082FB]' : 'border-gray-300'
                      }`}
                    >
                      {skuType === card.id && <div className="w-2.5 h-2.5 rounded-full bg-[#0082FB]" />}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-[#111827] text-sm sm:text-base">
                        {card.title}
                      </h4>
                      <p className="text-xs text-gray-500">{card.desc}</p>
                      {card.badge && (
                        <span className="inline-block text-[11px] font-bold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-lg mt-1">
                          {card.badge}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-base sm:text-lg font-black text-[#111827]">
                      {card.price} ₸
                    </span>
                    <span className="text-xs text-gray-400 font-medium block">За один товар</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom summary bar */}
            <div className="pt-6 border-t border-gray-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-gray-400 font-bold uppercase block">
                  Итого за {skuCount.toLocaleString('ru-RU')} {skuCount === 1 ? 'товар' : skuCount < 5 ? 'товара' : 'товаров'}:
                </span>
                <span className="text-2xl sm:text-3xl font-black text-[#111827]">
                  {currentCardsTotal.toLocaleString('ru-RU')} ₸
                  <span className="text-xs text-gray-500 font-normal ml-2">
                    ({skuCount.toLocaleString('ru-RU')} × {currentCardUnitPrice} ₸)
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() =>
                    openLeadModal(
                      `Операции с карточками (${skuCount} SKU, ${
                        skuType === 'nkt' ? 'НКТ' : skuType === 'mpt' ? 'ИС МПТ' : 'GS1 + ИС МПТ + НКТ'
                      }, ${currentCardsTotal.toLocaleString()} ₸)`
                    )
                  }
                  className="flex-1 sm:flex-none bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-sm py-3.5 px-7 rounded-xl transition-all shadow-md shadow-[#0082FB]/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Оставить заявку</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href={`https://wa.me/77003048532?text=${encodeURIComponent(
                    `Здравствуйте! Нужны карточки товаров (${skuCount} SKU, ${
                      skuType === 'nkt' ? 'НКТ' : skuType === 'mpt' ? 'ИС МПТ' : 'GS1 + ИС МПТ + НКТ'
                    }, сумма: ${currentCardsTotal.toLocaleString()} ₸). Подскажите, пожалуйста, по срокам.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3.5 px-5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TRAINING (Matching competitor clean structure media_1793258260141.png) */}
        {activeTab === 'training' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/80 space-y-6 animate-in fade-in duration-200">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-2 text-[#0082FB]">
                  <GraduationCap className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Обучение</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
                  Обучение обязательной маркировке
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Разберём весь процесс маркировки: от нормативных требований и подготовки товарных данных до работы с кодами и обязательными системами.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTariffHelpTab('training');
                  setIsTariffModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0082FB] hover:text-[#0070DA] bg-blue-50/80 hover:bg-blue-100/80 px-3 py-1.5 rounded-xl border border-blue-200/60 transition-all cursor-pointer shrink-0"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>
                  {lang === 'kz' ? 'Тарифтер анықтамалығы' : lang === 'en' ? 'Tariff Guide' : 'Справка по тарифам'}
                </span>
              </button>
            </div>

            <div className="inline-block bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-xl">
              3 онлайн-занятия
            </div>

            <ul className="space-y-2.5 text-sm text-gray-700 max-w-2xl">
              <li className="flex items-start gap-2.5">
                <span className="text-gray-400 font-bold">•</span>
                <span>Требования обязательной маркировки и нормативные правовые акты (НПА).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-gray-400 font-bold">•</span>
                <span>Последовательность действий участников оборота.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-gray-400 font-bold">•</span>
                <span>Подготовка данных о товарах и создание товарных карточек.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-gray-400 font-bold">•</span>
                <span>Получение кодов маркировки и работа с ними.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-gray-400 font-bold">•</span>
                <span>Работа в обязательных информационных системах.</span>
              </li>
            </ul>

            {/* Price radio card exactly like screenshot media_1793258260141.png */}
            <div className="p-5 rounded-2xl border border-[#0082FB] bg-blue-50/20 max-w-md">
              <div className="flex items-start gap-3.5">
                <div className="w-5 h-5 rounded-full border border-[#0082FB] flex items-center justify-center shrink-0 mt-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0082FB]" />
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-[#111827]">
                    {trainingCoursePrice.toLocaleString()} ₸
                  </span>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    Разовая стоимость за полный курс
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom summary bar */}
            <div className="pt-6 border-t border-gray-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-gray-400 font-bold uppercase block">Итого за курс:</span>
                <span className="text-2xl sm:text-3xl font-black text-[#111827]">
                  {trainingCoursePrice.toLocaleString()} ₸
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() =>
                    openLeadModal(
                      `Обучение обязательной маркировке (${trainingCoursePrice.toLocaleString()} ₸, 3 онлайн-занятия)`
                    )
                  }
                  className="flex-1 sm:flex-none bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-sm py-3.5 px-7 rounded-xl transition-all shadow-md shadow-[#0082FB]/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Записаться на обучение</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href={`https://wa.me/77003048532?text=${encodeURIComponent(
                    `Здравствуйте! Интересует обучение обязательной маркировке в TANBOX (${trainingCoursePrice.toLocaleString()} ₸, 3 онлайн-занятия). Подскажите дату ближайшей группы.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3.5 px-5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      <TariffHelpModal
        isOpen={isTariffModalOpen}
        onClose={() => setIsTariffModalOpen(false)}
        onSelectTariff={(code) => setTariffType(code)}
        dbTariffs={dbTariffs}
        initialTab={tariffHelpTab}
      />

      <ServiceOrderModal
        isOpen={isServiceOrderOpen}
        onClose={() => setIsServiceOrderOpen(false)}
        initialServiceTitle={serviceOrderTitle}
      />
    </section>
  );
};
