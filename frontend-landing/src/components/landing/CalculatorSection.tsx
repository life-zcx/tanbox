import React, { useMemo, useState, useEffect } from 'react';
import { useCalculator } from '../../hooks/useCalculator';
import { TariffCode } from '../../types';
import { ArrowRight, Check, ChevronDown, HelpCircle, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { TariffHelpModal } from '../modals/TariffHelpModal';

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

  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState<string>(itemsCount > 0 ? itemsCount.toLocaleString('ru-RU') : '');

  // Keep input display in sync when itemsCount changes externally (e.g. presets)
  useEffect(() => {
    if (itemsCount === 0) {
      setInputValue('');
    } else {
      setInputValue(itemsCount.toLocaleString('ru-RU'));
    }
  }, [itemsCount]);

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
          'Без печати (для своего оборудования)',
        ],
      },
      {
        code: 'PRINT' as TariffCode,
        name: 'Печатный',
        desc: 'Печать рулонов стикеров',
        priceFrom: getTariffPriceFrom('PRINT', 25),
        includes: [
          'Эмиссия кодов DataMatrix',
          'Термотрансферная печать рулонов',
          'Готовые рулоны износостойких стикеров',
        ],
      },
      {
        code: 'STANDARD' as TariffCode,
        name: 'Стандарт',
        desc: 'Печать и оклейка под ключ',
        priceFrom: getTariffPriceFrom('STANDARD', 50),
        includes: [
          'Эмиссия + печать стикеров',
          'Выезд бригады стикеровщиков на склад',
          'Потоковая оклейка без вскрытия тары',
          'Проверка считываемости 2D-сканером',
        ],
      },
      {
        code: 'PRO' as TariffCode,
        name: 'PRO Склад',
        desc: 'Оклейка и агрегация в короба (SSCC)',
        priceFrom: getTariffPriceFrom('PRO', 90),
        includes: [
          'Всё, что входит в тариф «Стандарт»',
          'Вскрытие коробок и сверка артикулов',
          'Поштучная оклейка с возвратом в тару',
          'Формирование и печать кодов SSCC',
        ],
      },
    ];
  }, [lang, dbTariffs]);

  const presets = [1000, 5000, 10000, 25000, 50000, 100000];

  const selectedTariff = tariffsList.find((t) => t.code === tariffType) || tariffsList[2];

  return (
    <section
      id="calculator"
      className={hideHeading ? "pb-12 sm:pb-16 bg-[#F4F6F9]" : "py-12 sm:py-16 bg-[#F4F6F9]"}
    >
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading - strictly matching other blocks */}
        {!hideHeading && (
          <div className="mb-8 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
              {lang === 'kz' 
                ? 'Тауарларды таңбалау құнын есептеу калькуляторы (₸)' 
                : lang === 'en' 
                ? 'Marking & Serialization Cost Calculator (₸)' 
                : 'Калькулятор стоимости маркировки (₸)'}
            </h2>
            <p className="text-sm sm:text-base text-[#64748B]">
              {lang === 'kz'
                ? 'Қажетті тарифті таңдаңыз, тауар көлемін көрсетіңіз және қосымша қызметтерді белгілеңіз.'
                : lang === 'en'
                ? 'Select the preferred tariff, specify item volume, and choose optional services.'
                : 'Выберите необходимый тариф, укажите объем товара и выберите дополнительные опции.'}
            </p>
          </div>
        )}

        {/* Main Full-Width Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/80 space-y-8">
          
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
                  onClick={() => setIsTariffModalOpen(true)}
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
                  <button
                    key={t.code}
                    type="button"
                    onClick={() => setTariffType(t.code)}
                    className={`p-4 sm:p-5 rounded-2xl text-left transition-all border flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#0082FB] bg-blue-50/40 ring-2 ring-[#0082FB]/20 shadow-sm'
                        : 'border-gray-200/90 bg-white hover:border-gray-300 hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm sm:text-base font-extrabold text-[#111827]">{t.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-[#0082FB] shrink-0" />}
                      </div>

                      <div className="text-xs sm:text-sm font-bold text-[#0082FB] mt-0.5">
                        {t.priceFrom}
                      </div>

                      <p className="text-xs text-[#64748B] mt-1.5 leading-snug">
                        {t.desc}
                      </p>

                      <div className="pt-3 mt-3 border-t border-gray-100 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">
                          {lang === 'kz' ? 'Не кіреді:' : lang === 'en' ? 'Includes:' : 'Что входит:'}
                        </span>
                        {t.includes.map((inc, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-xs text-[#334155] leading-tight font-medium">
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{inc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Quantity & Presets */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label htmlFor="calculator-quantity" className="text-xs font-bold text-[#111827] uppercase tracking-wider block">
                  {lang === 'kz' ? '2. Тауарлар саны' : lang === 'en' ? '2. Items Quantity' : '2. Количество товаров'}
                </label>
                <span className="text-xs text-[#64748B]">
                  {lang === 'kz'
                    ? 'Таңбалау қажет өнімдер көлемін енгізіңіз немесе дайын нұсқаны таңдаңыз'
                    : lang === 'en'
                    ? 'Enter item volume or choose a quick preset'
                    : 'Укажите объем продукции или выберите готовую партию'}
                </span>
              </div>

              {/* Clean B2B numeric input */}
              <div className="relative w-full sm:w-80">
                <input
                  id="calculator-quantity"
                  type="text"
                  inputMode="numeric"
                  placeholder={lang === 'kz' ? 'Мысалы: 5 000' : lang === 'en' ? 'e.g. 5,000' : 'Например: 5 000'}
                  value={inputValue}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    if (!raw) {
                      setInputValue('');
                      setItemsCount(0);
                    } else {
                      const num = Math.min(10000000, parseInt(raw, 10));
                      setInputValue(num.toLocaleString('ru-RU'));
                      setItemsCount(num);
                    }
                  }}
                  className="w-full bg-[#F8FAFC] hover:bg-white focus:bg-white border border-gray-200 focus:border-[#0082FB] focus:ring-4 focus:ring-[#0082FB]/10 rounded-xl px-4 py-3 text-base sm:text-lg font-bold text-[#111827] transition-all outline-none pr-20"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {itemsCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setInputValue('');
                        setItemsCount(0);
                      }}
                      title={lang === 'kz' ? 'Тазалау' : lang === 'en' ? 'Clear' : 'Очистить'}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer mr-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <span className="text-xs font-bold text-[#64748B] uppercase select-none">
                    {lang === 'kz' ? 'дана' : lang === 'en' ? 'pcs' : 'шт.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              <span className="text-xs font-semibold text-[#64748B]">
                {lang === 'kz' ? 'Жылдам таңдау:' : lang === 'en' ? 'Quick select:' : 'Быстрый выбор:'}
              </span>
              {presets.map((preset) => {
                const isSelected = itemsCount === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setItemsCount(preset)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#0082FB] text-white border-[#0082FB] shadow-sm shadow-blue-500/20'
                        : 'bg-[#F0F4F8] hover:bg-[#E2E8F0] text-[#334155] border-transparent'
                    }`}
                  >
                    {preset.toLocaleString('ru-RU')} {lang === 'kz' ? 'дана' : lang === 'en' ? 'pcs' : 'шт.'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Extra Services */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <label className="text-xs font-bold text-[#111827] uppercase tracking-wider block">
              {lang === 'kz' ? '3. Қосымша опциялар' : lang === 'en' ? '3. Additional Options' : '3. Дополнительные опции'}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              {/* Option 1: SSCC */}
              <label
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all ${
                  ssccNeeded
                    ? 'border-[#0082FB] bg-blue-50/40'
                    : 'border-gray-200/90 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={ssccNeeded}
                    onChange={(e) => setSsccNeeded(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0082FB] focus:ring-[#0082FB] cursor-pointer"
                  />
                  <span className="text-xs font-bold text-[#111827]">
                    {lang === 'kz'
                      ? 'Қораптарға/паллеттерге агрегациялау (SSCC)'
                      : lang === 'en'
                      ? 'Carton & Pallet Aggregation (SSCC)'
                      : 'Агрегация в короба/паллеты (SSCC)'}
                  </span>
                </div>
                <span className="text-xs font-extrabold text-[#0082FB] shrink-0 ml-2">
                  +{dbPricingSettings?.ssccPrice ?? 5} ₸/{lang === 'kz' ? 'дана' : lang === 'en' ? 'pcs' : 'шт'}
                </span>
              </label>

              {/* Option 2: Layout */}
              <label
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all ${
                  extraServices.includes('STICKER_LAYOUT_DESIGN')
                    ? 'border-[#0082FB] bg-blue-50/40'
                    : 'border-gray-200/90 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={extraServices.includes('STICKER_LAYOUT_DESIGN')}
                    onChange={() => toggleExtraService('STICKER_LAYOUT_DESIGN')}
                    className="w-4 h-4 rounded text-[#0082FB] focus:ring-[#0082FB] cursor-pointer"
                  />
                  <span className="text-xs font-bold text-[#111827]">
                    {lang === 'kz'
                      ? 'Стикер макетін әзірлеу'
                      : lang === 'en'
                      ? 'Custom Label Layout Design'
                      : 'Разработка макета стикера'}
                  </span>
                </div>
                <span className="text-xs font-extrabold text-[#0082FB] shrink-0 ml-2">
                  +{(dbPricingSettings?.stickerLayoutPrice ?? 5000).toLocaleString()} ₸
                </span>
              </label>

              {/* Option 3: Urgent */}
              <label
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all ${
                  extraServices.includes('URGENT_PROCESSING')
                    ? 'border-[#0082FB] bg-blue-50/40'
                    : 'border-gray-200/90 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={extraServices.includes('URGENT_PROCESSING')}
                    onChange={() => toggleExtraService('URGENT_PROCESSING')}
                    className="w-4 h-4 rounded text-[#0082FB] focus:ring-[#0082FB] cursor-pointer"
                  />
                  <span className="text-xs font-bold text-[#111827]">
                    {lang === 'kz'
                      ? 'Шұғыл орындау (24 сағат)'
                      : lang === 'en'
                      ? 'Urgent Turnaround (24h)'
                      : 'Срочное исполнение (24 часа)'}
                  </span>
                </div>
                <span className="text-xs font-extrabold text-[#0082FB] shrink-0 ml-2">
                  +{dbPricingSettings?.urgentPercent ?? 20}%
                </span>
              </label>

              {/* Option 4: Delivery */}
              <label
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all ${
                  extraServices.includes('EXPRESS_DELIVERY')
                    ? 'border-[#0082FB] bg-blue-50/40'
                    : 'border-gray-200/90 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={extraServices.includes('EXPRESS_DELIVERY')}
                    onChange={() => toggleExtraService('EXPRESS_DELIVERY')}
                    className="w-4 h-4 rounded text-[#0082FB] focus:ring-[#0082FB] cursor-pointer"
                  />
                  <span className="text-xs font-bold text-[#111827]">
                    {lang === 'kz'
                      ? 'ҚР бойынша материалдарды жеткізу'
                      : lang === 'en'
                      ? 'Express Delivery Across Kazakhstan'
                      : 'Доставка материалов по РК'}
                  </span>
                </div>
                <span className="text-xs font-extrabold text-[#0082FB] shrink-0 ml-2">
                  +{(dbPricingSettings?.expressDeliveryPrice ?? 15000).toLocaleString()} ₸
                </span>
              </label>

            </div>
          </div>

          {/* 4. Bottom Summary Bar */}
          <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Left: Summary Details, Price & Disclaimer */}
            <div className="space-y-1.5">
              <div className="text-xs text-[#64748B]">
                {lang === 'kz' ? 'Тариф:' : lang === 'en' ? 'Tariff:' : 'Тариф:'}{' '}
                <strong className="text-[#111827]">{selectedTariff.name}</strong>
                {itemsCount > 0 ? (
                  <>
                    {' • '}
                    {lang === 'kz' ? 'Көлемі:' : lang === 'en' ? 'Volume:' : 'Объем:'}{' '}
                    <strong className="text-[#111827]">{itemsCount.toLocaleString('ru-RU')} {lang === 'kz' ? 'дана' : lang === 'en' ? 'pcs' : 'шт.'}</strong> •{' '}
                    {lang === 'kz' ? 'Бағасы:' : lang === 'en' ? 'Unit Price:' : 'Цена:'}{' '}
                    <strong className="text-[#111827]">
                      {result.unitPrice >= 1 ? result.unitPrice.toLocaleString('ru-RU') : result.unitPrice} ₸ / {lang === 'kz' ? 'дана' : lang === 'en' ? 'pcs' : 'шт.'}
                    </strong>
                  </>
                ) : (
                  <>
                    {' • '}
                    <span className="text-[#64748B]">
                      {lang === 'kz' ? 'Бағасы:' : lang === 'en' ? 'Price:' : 'Цена:'} <strong className="text-[#111827]">{selectedTariff.priceFrom}</strong>
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-[#64748B] uppercase">
                  {lang === 'kz' ? 'Алдын ала есептелген құны:' : lang === 'en' ? 'Estimated Total Price:' : 'Предварительная стоимость:'}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">
                  {itemsCount > 0 ? `${result.totalPrice.toLocaleString('ru-RU')} ₸` : '— ₸'}
                </span>
              </div>

              <p className="text-[11px] text-[#64748B]">
                {itemsCount === 0
                  ? (lang === 'kz'
                      ? '* Құнын есептеу үшін тауар санын енгізіңіз немесе жылдам таңдаудан басыңыз.'
                      : lang === 'en'
                      ? '* Enter item quantity or pick a quick preset to calculate cost.'
                      : '* Укажите количество товаров или выберите готовую партию для точного расчета.')
                  : (lang === 'kz'
                      ? '* Есептеу алдын ала сипатта. Түпкілікті құны партия сипаттамасын келіскен кезде бекітіледі.'
                      : lang === 'en'
                      ? '* Preliminary estimate. Final invoice is generated upon batch specification review.'
                      : '* Расчет является предварительным. Окончательная стоимость формируется при согласовании партии.')}
              </p>
            </div>

            {/* Right: Order Button */}
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
              className="bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-sm py-3.5 px-7 rounded-xl transition-all active:scale-95 shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer self-start md:self-auto"
            >
              <span>
                {lang === 'kz'
                  ? 'Жеке кабинетте тапсырыс беру'
                  : lang === 'en'
                  ? 'Place Order in Client Portal'
                  : 'Оформить заказ в личном кабинете'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>

        </div>

      </div>

      <TariffHelpModal
        isOpen={isTariffModalOpen}
        onClose={() => setIsTariffModalOpen(false)}
        onSelectTariff={(code) => setTariffType(code)}
        dbTariffs={dbTariffs}
      />
    </section>
  );
};
