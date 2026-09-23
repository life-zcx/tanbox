import React from 'react';
import { useCalculator } from '../../hooks/useCalculator';
import { TariffCode } from '../../types';
import { Check, Zap, Layers, Sparkles, Truck } from 'lucide-react';

interface CalculatorSectionProps {
  onOrderQuick: (tariff: TariffCode, count: number, price: number) => void;
}

export const CalculatorSection: React.FC<CalculatorSectionProps> = ({ onOrderQuick }) => {
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
    loading,
  } = useCalculator();

  const tariffsList: { code: TariffCode; name: string; subtitle: string }[] = [
    { code: 'DIGITAL', name: '«Цифровой»', subtitle: 'Только эмиссия PDF' },
    { code: 'PRINT', name: '«Печатный»', subtitle: 'Печать рулонов' },
    { code: 'STANDARD', name: '«Стандарт»', subtitle: 'Оклейка под ключ' },
    { code: 'PRO', name: '«PRO»', subtitle: 'Сложная оклейка + SSCC' },
  ];

  return (
    <section id="calculator" className="py-12 sm:py-16 bg-[#F4F6F9]">
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="mb-8 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            Калькулятор стоимости маркировки (₸)
          </h2>
          <p className="text-sm sm:text-base text-[#64748B]">
            Выберите необходимый тариф, укажите объем товара и выберите дополнительные опции.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Controls (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
            
            {/* Step 1: Tariff Selection */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center justify-between">
                <span>1. Выберите основной тариф</span>
                <span className="text-[11px] font-normal text-[#64748B]">Цена за 1 шт</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {tariffsList.map((t) => {
                  const isSelected = tariffType === t.code;
                  return (
                    <button
                      key={t.code}
                      onClick={() => setTariffType(t.code)}
                      className={`p-4 rounded-2xl text-left transition-all ${
                        isSelected
                          ? 'bg-[#0082FB] text-white shadow-md font-bold'
                          : 'bg-[#F0F4F8] text-[#111827] hover:bg-[#E2E8F0]'
                      }`}
                    >
                      <div className="text-sm font-bold">{t.name}</div>
                      <div className={`text-[11px] mt-1 ${isSelected ? 'text-blue-100' : 'text-[#64748B]'}`}>
                        {t.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Quantity Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                  2. Количество товаров (ед.)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={100}
                    max={1000000}
                    value={itemsCount}
                    onChange={(e) => setItemsCount(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-32 text-right text-base font-extrabold text-[#111827] bg-[#F8FAFC] border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#0082FB]"
                  />
                  <span className="text-sm font-bold text-[#64748B]">шт.</span>
                </div>
              </div>

              <input
                type="range"
                min={500}
                max={200000}
                step={500}
                value={itemsCount}
                onChange={(e) => setItemsCount(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />

              <div className="flex justify-between text-xs font-semibold text-[#64748B]">
                <span>500 шт.</span>
                <span>10 000 шт.</span>
                <span>50 000 шт.</span>
                <span>200 000+ шт.</span>
              </div>
            </div>

            {/* Step 3: Extra Services */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <label className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                3. Дополнительные опции и услуги
              </label>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 bg-[#F8FAFC] border border-gray-100 rounded-2xl cursor-pointer hover:border-[#0082FB] transition-all">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={ssccNeeded}
                      onChange={(e) => setSsccNeeded(e.target.checked)}
                      className="w-5 h-5 accent-[#0082FB] rounded cursor-pointer"
                    />
                    <span className="text-sm font-bold text-[#111827]">Формирование кодов агрегации (SSCC)</span>
                  </div>
                  <span className="text-xs font-bold text-[#0082FB] bg-[#EBF5FF] px-2.5 py-1 rounded-lg">
                    +5 ₸ / шт
                  </span>
                </label>

                <label className="flex items-center justify-between p-4 bg-[#F8FAFC] border border-gray-100 rounded-2xl cursor-pointer hover:border-[#0082FB] transition-all">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={extraServices.includes('STICKER_LAYOUT_DESIGN')}
                      onChange={() => toggleExtraService('STICKER_LAYOUT_DESIGN')}
                      className="w-5 h-5 accent-[#0082FB] rounded cursor-pointer"
                    />
                    <span className="text-sm font-bold text-[#111827]">Разработка макета стикера</span>
                  </div>
                  <span className="text-xs font-bold text-[#0082FB] bg-[#EBF5FF] px-2.5 py-1 rounded-lg">
                    +5 000 ₸ разово
                  </span>
                </label>

                <label className="flex items-center justify-between p-4 bg-[#F8FAFC] border border-gray-100 rounded-2xl cursor-pointer hover:border-[#0082FB] transition-all">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={extraServices.includes('URGENT_PROCESSING')}
                      onChange={() => toggleExtraService('URGENT_PROCESSING')}
                      className="w-5 h-5 accent-[#0082FB] rounded cursor-pointer"
                    />
                    <span className="text-sm font-bold text-[#111827]">Срочное исполнение заказа (24 часа)</span>
                  </div>
                  <span className="text-xs font-bold text-[#0082FB] bg-[#EBF5FF] px-2.5 py-1 rounded-lg">
                    +20%
                  </span>
                </label>

                <label className="flex items-center justify-between p-4 bg-[#F8FAFC] border border-gray-100 rounded-2xl cursor-pointer hover:border-[#0082FB] transition-all">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={extraServices.includes('EXPRESS_DELIVERY')}
                      onChange={() => toggleExtraService('EXPRESS_DELIVERY')}
                      className="w-5 h-5 accent-[#0082FB] rounded cursor-pointer"
                    />
                    <span className="text-sm font-bold text-[#111827]">Доставка материалов по РК</span>
                  </div>
                  <span className="text-xs font-bold text-[#0082FB] bg-[#EBF5FF] px-2.5 py-1 rounded-lg">
                    +15 000 ₸
                  </span>
                </label>
              </div>
            </div>

          </div>

          {/* Right Summary Card (5 cols) */}
          <div className="lg:col-span-5 bg-[#0F172A] text-white rounded-3xl p-8 shadow-xl space-y-6 sticky top-28">
            <div className="border-b border-slate-800 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0082FB]">Итоговый расчёт</span>
              <h3 className="text-2xl font-extrabold text-white mt-1">Детализация стоимости</h3>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400">Перерасчет стоимости...</div>
            ) : result ? (
              <div className="space-y-5">
                
                {/* Unit Price & Total */}
                <div className="bg-[#1E293B] rounded-2xl p-5 border border-slate-700/50 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Итоговая цена за 1 шт:</span>
                    <span className="text-xl font-extrabold text-white">{result.unitPrice} ₸ / шт</span>
                  </div>

                  <div className="border-t border-slate-700/50 pt-3 flex justify-between items-baseline">
                    <span className="text-sm text-slate-300 font-semibold">Общая сумма заказа:</span>
                    <span className="text-3xl font-black text-[#0082FB]">
                      {result.totalPrice.toLocaleString()} ₸
                    </span>
                  </div>
                </div>

                {/* Profit Margin & Specs */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>Примерная маржинальность:</span>
                    <span className="font-bold text-emerald-400">~{result.estimatedMarginTotal.toLocaleString()} ₸</span>
                  </div>

                  <div className="flex justify-between text-slate-300">
                    <span>Срок выполнения заказа:</span>
                    <span className="font-bold text-white">~{result.estimatedDays} рабочих дней</span>
                  </div>

                  <div className="flex justify-between text-slate-300">
                    <span>Загрузка в ИС Танба:</span>
                    <span className="font-bold text-white flex items-center gap-1">
                      <Check className="w-4 h-4 text-emerald-400" /> Включено
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onOrderQuick(tariffType, itemsCount, result.totalPrice)}
                  className="w-full bg-[#0082FB] text-white font-extrabold text-base py-4 rounded-2xl hover:bg-[#0070DA] transition-all active:scale-95 shadow-lg mt-4"
                >
                  Оформить данный заказ
                </button>

                <p className="text-[11px] text-slate-400 text-center">
                  *Окончательный расчет формируется при приеме партий на складе.
                </p>
              </div>
            ) : null}

          </div>

        </div>
      </div>
    </section>
  );
};
