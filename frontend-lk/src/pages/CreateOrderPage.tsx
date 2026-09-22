import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../hooks/useOrders';
import { OrderCategory, TariffType } from '../types';
import { apiClient } from '../api/client';
import { PackagePlus, Shirt, Droplets, Pill, Cigarette, PackageCheck, Layers, Sparkles, Zap, ArrowRight, Check } from 'lucide-react';

import { PageHeader } from '@shared';

export const CreateOrderPage: React.FC = () => {
  const { createOrder } = useOrders();
  const navigate = useNavigate();

  const [category, setCategory] = useState<OrderCategory>('SHOES');
  const [tariffType, setTariffType] = useState<TariffType>('STANDARD');
  const [itemsCount, setItemsCount] = useState<number>(5000);
  const [ssccNeeded, setSsccNeeded] = useState<boolean>(true);
  const [extraServices, setExtraServices] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');

  const [calculated, setCalculated] = useState<{ unitPrice: number; totalPrice: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Recalculate on input changes
  useEffect(() => {
    const calc = async () => {
      setLoading(true);
      try {
        const res = await apiClient.post('/calculator/calculate', {
          tariffType,
          itemsCount,
          extraServices,
          ssccNeeded,
        });
        setCalculated({
          unitPrice: res.data.unitPrice,
          totalPrice: res.data.totalPrice,
        });
      } catch (e) {
        console.error('Calculation error:', e);
      } finally {
        setLoading(false);
      }
    };
    calc();
  }, [tariffType, itemsCount, ssccNeeded, extraServices]);

  const categories: { type: OrderCategory; label: string; icon: any }[] = [
    { type: 'SHOES', label: 'Обувная продукция', icon: PackageCheck },
    { type: 'TEXTILE', label: 'Текстиль и Одежда', icon: Shirt },
    { type: 'WATER', label: 'Вода и Напитки', icon: Droplets },
    { type: 'MEDICINE', label: 'Лекарственные средства', icon: Pill },
    { type: 'TOBACCO', label: 'Табачные изделия', icon: Cigarette },
    { type: 'OTHER', label: 'Иное / Прочее', icon: PackagePlus },
  ];

  const tariffs: { type: TariffType; name: string; price: string; description: string }[] = [
    {
      type: 'DIGITAL',
      name: '«Цифровой»',
      price: '10 - 15 ₸/шт',
      description: 'Эмиссия кодов в ИС Танба. Выгрузка файлов макетов в PDF',
    },
    {
      type: 'PRINT',
      name: '«Печатный»',
      price: '25 - 35 ₸/шт',
      description: 'Эмиссия + готовые термотрансферные рулоны',
    },
    {
      type: 'STANDARD',
      name: '«Стандарт»',
      price: '50 - 65 ₸/шт',
      description: 'Под ключ: эмиссия, печать и выездная оклейка на склад',
    },
    {
      type: 'PRO',
      name: '«PRO»',
      price: '90 - 120 ₸/шт',
      description: 'Сложная оклейка: вскрытие, сверка артикулов + SSCC',
    },
  ];

  const toggleService = (code: string) => {
    setExtraServices((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calculated) return;
    setSubmitting(true);
    try {
      await createOrder({
        category,
        tariffType,
        itemsCount,
        pricePerItem: calculated.unitPrice,
        totalPrice: calculated.totalPrice,
        extraServices,
        ssccNeeded,
        notes,
      });
      navigate('/orders');
    } catch (err) {
      alert('Ошибка при сохранении заказа');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      <PageHeader
        title="Создать новый заказ"
        description="Параметры партии товара для автоматического расчёта стоимости и эмиссии кодов ИС Танба"
      />

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
        
        {/* Step 1: Category */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <h3 className="text-sm font-extrabold text-black uppercase tracking-wider">
            1. Выберите категорию товара
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map((c) => {
              const Icon = c.icon;
              const isSelected = category === c.type;
              return (
                <button
                  type="button"
                  key={c.type}
                  onClick={() => setCategory(c.type)}
                  className={`p-4 rounded-2xl border text-left flex flex-col gap-2 transition-all ${
                    isSelected
                      ? 'bg-black text-white border-black shadow-md font-bold'
                      : 'bg-gray-50 text-black border-gray-200 hover:border-black'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-black'}`} />
                  <span className="text-xs font-bold">{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Tariff */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <h3 className="text-sm font-extrabold text-black uppercase tracking-wider">
            2. Выберите тариф маркировки
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tariffs.map((t) => {
              const isSelected = tariffType === t.type;
              return (
                <button
                  type="button"
                  key={t.type}
                  onClick={() => setTariffType(t.type)}
                  className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'bg-black text-white border-black shadow-lg font-bold ring-2 ring-black'
                      : 'bg-gray-50 text-black border-gray-200 hover:border-black'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="text-base font-extrabold">{t.name}</div>
                    <div className={`text-xs leading-relaxed ${isSelected ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t.description}
                    </div>
                  </div>
                  <div className={`text-xs font-black uppercase tracking-wider mt-4 pt-3 border-t ${
                    isSelected ? 'border-gray-800 text-white' : 'border-gray-200 text-black'
                  }`}>
                    {t.price}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Count & Extra */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <h3 className="text-sm font-extrabold text-black uppercase tracking-wider">
            3. Объём партии и опции
          </h3>

          <div>
            <label className="text-xs font-bold text-black uppercase block mb-2">
              Объем партий товаров (единиц / штук):
            </label>
            <input
              type="number"
              min={100}
              required
              value={itemsCount}
              onChange={(e) => setItemsCount(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-lg font-extrabold text-black focus:outline-none focus:border-black"
            />
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:border-black transition-all">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={ssccNeeded}
                  onChange={(e) => setSsccNeeded(e.target.checked)}
                  className="w-5 h-5 accent-black rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-black">Формирование кодов агрегации коробов (SSCC)</span>
              </div>
              <span className="text-[11px] font-extrabold text-black bg-white px-2 py-1 rounded border border-gray-200">+5 ₸ / шт</span>
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:border-black transition-all">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={extraServices.includes('STICKER_LAYOUT_DESIGN')}
                  onChange={() => toggleService('STICKER_LAYOUT_DESIGN')}
                  className="w-5 h-5 accent-black rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-black">Разработка индивидуального макета стикера</span>
              </div>
              <span className="text-[11px] font-extrabold text-black bg-white px-2 py-1 rounded border border-gray-200">+5 000 ₸</span>
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:border-black transition-all">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={extraServices.includes('URGENT_PROCESSING')}
                  onChange={() => toggleService('URGENT_PROCESSING')}
                  className="w-5 h-5 accent-black rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-black">Срочное исполнение заказа (в течение 24 часов)</span>
              </div>
              <span className="text-[11px] font-extrabold text-black bg-white px-2 py-1 rounded border border-gray-200">+20%</span>
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:border-black transition-all">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={extraServices.includes('EXPRESS_DELIVERY')}
                  onChange={() => toggleService('EXPRESS_DELIVERY')}
                  className="w-5 h-5 accent-black rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-black">Доставка готовых стикеров/рулонов курьером по РК</span>
              </div>
              <span className="text-[11px] font-extrabold text-black bg-white px-2 py-1 rounded border border-gray-200">+15 000 ₸</span>
            </label>
          </div>

          <div>
            <label className="text-xs font-bold text-black uppercase block mb-1">
              Примечания / Требования к оклейке
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Адрес склада, желаемое время прибытия выездной бригады..."
              className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-black"
            />
          </div>
        </div>

        {/* Calculation Summary Bar */}
        {calculated && (
          <div className="bg-black text-white rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-center gap-6 shadow-xl">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Предварительный расчёт:</span>
              <div className="text-3xl font-black text-white mt-1">
                {calculated.totalPrice.toLocaleString()} ₸
              </div>
              <p className="text-xs text-gray-400">
                {calculated.unitPrice} ₸ / шт • {itemsCount.toLocaleString()} ед.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-white text-black font-extrabold text-sm px-8 py-4 rounded-xl hover:bg-gray-100 transition-all active:scale-95 shadow-md disabled:opacity-50"
            >
              {submitting ? 'Отправка...' : 'Отправить заказ в работу'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

      </form>
    </div>
  );
};
