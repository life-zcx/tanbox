import React from 'react';
import { useCalculator } from '../../hooks/useCalculator';
import { TariffCode } from '../../types';
import { ArrowRight, Check } from 'lucide-react';

interface CalculatorSectionProps {
  onOrderQuick: (tariff: TariffCode, count: number, price: number) => void;
  hideHeading?: boolean;
}

export const CalculatorSection: React.FC<CalculatorSectionProps> = ({ onOrderQuick, hideHeading = false }) => {
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
  } = useCalculator();

  const tariffsList: {
    code: TariffCode;
    name: string;
    desc: string;
    priceFrom: string;
    includes: string[];
  }[] = [
    {
      code: 'DIGITAL',
      name: 'Цифровой',
      desc: 'Только эмиссия кодов Data Matrix',
      priceFrom: 'от 10 ₸ / шт.',
      includes: [
        'Эмиссия кодов в ИС Танба',
        'Выгрузка готовых макетов (PDF / Excel)',
        'Без печати (для своего оборудования)',
      ],
    },
    {
      code: 'PRINT',
      name: 'Печатный',
      desc: 'Печать рулонов стикеров',
      priceFrom: 'от 25 ₸ / шт.',
      includes: [
        'Эмиссия кодов DataMatrix',
        'Термотрансферная печать рулонов',
        'Готовые рулоны износостойких стикеров',
      ],
    },
    {
      code: 'STANDARD',
      name: 'Стандарт',
      desc: 'Печать и оклейка под ключ',
      priceFrom: 'от 50 ₸ / шт.',
      includes: [
        'Эмиссия + печать стикеров',
        'Выезд бригады стикеровщиков на склад',
        'Потоковая оклейка без вскрытия тары',
        'Проверка считываемости 2D-сканером',
      ],
    },
    {
      code: 'PRO',
      name: 'PRO Склад',
      desc: 'Оклейка и агрегация в короба (SSCC)',
      priceFrom: 'от 90 ₸ / шт.',
      includes: [
        'Всё, что входит в тариф «Стандарт»',
        'Вскрытие коробок и сверка артикулов',
        'Поштучная оклейка с возвратом в тару',
        'Формирование и печать кодов SSCC',
      ],
    },
  ];

  const presets = [1000, 5000, 10000, 25000, 50000, 100000];

  const selectedTariff = tariffsList.find((t) => t.code === tariffType) || tariffsList[2];

  // Dynamic slider track fill percentage
  const sliderMin = 500;
  const sliderMax = 200000;
  const sliderProgress = Math.min(100, Math.max(0, ((itemsCount - sliderMin) / (sliderMax - sliderMin)) * 100));

  return (
    <section id="calculator" className={`${hideHeading ? 'pb-12 sm:pb-16' : 'py-12 sm:py-16'} bg-[#F4F6F9]`}>
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading - strictly matching other blocks */}
        {!hideHeading && (
          <div className="mb-8 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
              Калькулятор стоимости маркировки (₸)
            </h2>
            <p className="text-sm sm:text-base text-[#64748B]">
              Выберите необходимый тариф, укажите объем товара и выберите дополнительные опции.
            </p>
          </div>
        )}

        {/* Main Full-Width Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/80 space-y-8">
          
          {/* 1. Tariff Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                1. Выберите тариф
              </label>
              <span className="text-xs text-[#64748B]">
                Выбран: <strong className="text-[#0082FB]">{selectedTariff.name}</strong> ({selectedTariff.priceFrom})
              </span>
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
                          Что входит:
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
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                2. Количество товаров
              </label>

              <div className="flex items-center gap-2 bg-[#F4F6F9] border border-gray-200 rounded-xl px-3 py-1.5">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={7}
                  value={itemsCount === 0 ? '' : itemsCount}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    const val = parseInt(raw) || 0;
                    setItemsCount(Math.min(1000000, val));
                  }}
                  onBlur={() => {
                    if (!itemsCount || itemsCount < 100) {
                      setItemsCount(500);
                    }
                  }}
                  className="w-24 text-right text-sm font-black text-[#111827] bg-transparent focus:outline-none"
                />
                <span className="text-xs font-bold text-[#64748B]">шт.</span>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={sliderMin}
              max={sliderMax}
              step={500}
              value={itemsCount}
              onChange={(e) => setItemsCount(parseInt(e.target.value) || sliderMin)}
              style={{
                background: `linear-gradient(to right, #0082FB 0%, #0082FB ${sliderProgress}%, #E2E8F0 ${sliderProgress}%, #E2E8F0 100%)`,
              }}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#0082FB]"
            />

            {/* Quick Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold text-[#64748B]">Быстрый выбор:</span>
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setItemsCount(preset)}
                  className={`text-xs font-bold px-3 py-1 rounded-xl transition-all ${
                    itemsCount === preset
                      ? 'bg-[#0082FB] text-white'
                      : 'bg-[#F0F4F8] hover:bg-[#E2E8F0] text-[#111827]'
                  }`}
                >
                  {preset.toLocaleString()} шт.
                </button>
              ))}
            </div>
          </div>

          {/* 3. Extra Services */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <label className="text-xs font-bold text-[#111827] uppercase tracking-wider block">
              3. Дополнительные опции
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
                    Агрегация в короба/паллеты (SSCC)
                  </span>
                </div>
                <span className="text-xs font-extrabold text-[#0082FB] shrink-0 ml-2">
                  +5 ₸/шт
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
                    Разработка макета стикера
                  </span>
                </div>
                <span className="text-xs font-extrabold text-[#0082FB] shrink-0 ml-2">
                  +5 000 ₸
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
                    Срочное исполнение (24 часа)
                  </span>
                </div>
                <span className="text-xs font-extrabold text-[#0082FB] shrink-0 ml-2">
                  +20%
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
                    Доставка материалов по РК
                  </span>
                </div>
                <span className="text-xs font-extrabold text-[#0082FB] shrink-0 ml-2">
                  +15 000 ₸
                </span>
              </label>

            </div>
          </div>

          {/* 4. Bottom Summary Bar */}
          <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Left: Summary Details, Price & Disclaimer */}
            <div className="space-y-1.5">
              <div className="text-xs text-[#64748B]">
                Тариф: <strong className="text-[#111827]">{selectedTariff.name}</strong> •{' '}
                Объем: <strong className="text-[#111827]">{itemsCount.toLocaleString()} шт.</strong> •{' '}
                Цена: <strong className="text-[#111827]">{result.unitPrice} ₸ / шт.</strong>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-[#64748B] uppercase">Предварительная стоимость:</span>
                <span className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">
                  {result.totalPrice.toLocaleString()} ₸
                </span>
              </div>

              <p className="text-[11px] text-[#64748B]">
                * Расчет является предварительным. Окончательная стоимость формируется при согласовании партии.
              </p>
            </div>

            {/* Right: Order Button */}
            <button
              type="button"
              onClick={() => onOrderQuick(tariffType, itemsCount, result.totalPrice)}
              className="bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-sm py-3.5 px-7 rounded-xl transition-all active:scale-95 shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer self-start md:self-auto"
            >
              <span>Оформить заказ в личном кабинете</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>

        </div>

      </div>
    </section>
  );
};
