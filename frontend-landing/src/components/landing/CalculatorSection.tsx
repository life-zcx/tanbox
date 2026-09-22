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
    <section id="calculator" className="py-8 sm:py-12 bg-white border-b border-gray-200">
      <div className="max-w-[1700px] w-full mx-auto px-6 sm:px-10 lg:px-16">
        
        {/* Title */}
        <div className="text-center max-w-4xl mx-auto mb-8 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">
            Калькулятор стоимости <span className="whitespace-nowrap">маркировки (₸)</span>
          </h2>
          <p className="text-base text-gray-600">
            Выберите необходимый тариф, укажите объем товара и выберите дополнительные опции.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Controls (8 cols) */}
          <div className="lg:col-span-7 bg-gray-50 border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-8">
            
            {/* Step 1: Tariff Selection */}
            <div className="space-y-4">
              <label className="text-sm font-extrabold text-black uppercase tracking-wider flex items-center justify-between">
                <span>1. Выберите основной тариф</span>
                <span className="text-xs font-normal text-gray-500 text-right">Цена за 1 шт</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {tariffsList.map((t) => {
                  const isSelected = tariffType === t.code;
                  return (
                    <button
                      key={t.code}
                      onClick={() => setTariffType(t.code)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-black text-white border-black shadow-md font-bold ring-2 ring-black'
                          : 'bg-white text-black border-gray-300 hover:border-black'
                      }`}
                    >
                      <div className="text-sm font-bold">{t.name}</div>
                      <div className={`text-[11px] mt-1 ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
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
                <label className="text-sm font-extrabold text-black uppercase tracking-wider">
                  2. Количество товаров (ед.)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={100}
                    max={1000000}
                    value={itemsCount}
                    onChange={(e) => setItemsCount(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-32 text-right text-base font-extrabold text-black bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-black"
                  />
                  <span className="text-sm font-bold text-gray-700">шт.</span>
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

              <div className="flex justify-between text-xs font-semibold text-gray-500">
                <span>500 шт.</span>
                <span>10 000 шт.</span>
                <span>50 000 шт.</span>
                <span>200 000+ шт.</span>
              </div>
            </div>

            {/* Step 3: Extra Services */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <label className="text-sm font-extrabold text-black uppercase tracking-wider">
                3. Дополнительные опции и услуги
              </label>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-black transition-all">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={ssccNeeded}
                      onChange={(e) => setSsccNeeded(e.target.checked)}
                      className="w-5 h-5 accent-black rounded cursor-pointer"
                    />
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-black" />
                      <span className="text-sm font-bold text-black">Формирование кодов агрегации (SSCC)</span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-black bg-gray-100 px-2.5 py-1 rounded-md">
                    +5 ₸ / шт
                  </span>
                </label>

                <label className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-black transition-all">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={extraServices.includes('STICKER_LAYOUT_DESIGN')}
                      onChange={() => toggleExtraService('STICKER_LAYOUT_DESIGN')}
                      className="w-5 h-5 accent-black rounded cursor-pointer"
                    />
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-black" />
                      <span className="text-sm font-bold text-black">Разработка индивидуального макета макета стикера</span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-black bg-gray-100 px-2.5 py-1 rounded-md">
                    +5 000 ₸ разово
                  </span>
                </label>

                <label className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-black transition-all">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={extraServices.includes('URGENT_PROCESSING')}
                      onChange={() => toggleExtraService('URGENT_PROCESSING')}
                      className="w-5 h-5 accent-black rounded cursor-pointer"
                    />
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-black" />
                      <span className="text-sm font-bold text-black">Срочное исполнение заказа (в течение 24 часов)</span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-black bg-gray-100 px-2.5 py-1 rounded-md">
                    +20%
                  </span>
                </label>

                <label className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-black transition-all">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={extraServices.includes('EXPRESS_DELIVERY')}
                      onChange={() => toggleExtraService('EXPRESS_DELIVERY')}
                      className="w-5 h-5 accent-black rounded cursor-pointer"
                    />
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-black" />
                      <span className="text-sm font-bold text-black">Доставка готовых рулонов/материалов на склад по РК</span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-black bg-gray-100 px-2.5 py-1 rounded-md">
                    +15 000 ₸
                  </span>
                </label>
              </div>
            </div>

          </div>

          {/* Right Summary Card (4 cols) */}
          <div className="lg:col-span-5 bg-black text-white rounded-3xl p-8 shadow-2xl border border-gray-800 space-y-6 sticky top-28">
            <div className="border-b border-gray-800 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Итоговый расчёт</span>
              <h3 className="text-2xl font-extrabold text-white mt-1">Детализация стоимости</h3>
            </div>

            {loading ? (
              <div className="py-12 text-center text-gray-400">Перерасчет стоимости...</div>
            ) : result ? (
              <div className="space-y-5">
                
                {/* Unit Price & Total */}
                <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Итоговая цена за 1 шт:</span>
                    <span className="text-xl font-extrabold text-white">{result.unitPrice} ₸ / шт</span>
                  </div>

                  <div className="border-t border-gray-800 pt-3 flex justify-between items-baseline">
                    <span className="text-sm text-gray-300 font-semibold">Общая сумма заказа:</span>
                    <span className="text-3xl font-black text-white">
                      {result.totalPrice.toLocaleString()} ₸
                    </span>
                  </div>
                </div>

                {/* Profit Margin & Specs */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-300">
                    <span>Примерная маржинальность:</span>
                    <span className="font-bold text-emerald-400">~{result.estimatedMarginTotal.toLocaleString()} ₸</span>
                  </div>

                  <div className="flex justify-between text-gray-300">
                    <span>Срок выполнения заказа:</span>
                    <span className="font-bold text-white">~{result.estimatedDays} рабочих дней</span>
                  </div>

                  <div className="flex justify-between text-gray-300">
                    <span>Загрузка в ИС Танба:</span>
                    <span className="font-bold text-white flex items-center gap-1">
                      <Check className="w-4 h-4 text-emerald-400" /> Включено
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onOrderQuick(tariffType, itemsCount, result.totalPrice)}
                  className="w-full bg-white text-black font-extrabold text-base py-4 rounded-xl hover:bg-gray-100 transition-all active:scale-95 shadow-lg mt-4"
                >
                  Оформить данный заказ
                </button>

                <p className="text-[11px] text-gray-400 text-center">
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
