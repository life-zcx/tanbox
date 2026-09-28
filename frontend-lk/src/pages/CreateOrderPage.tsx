import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOrders } from '../hooks/useOrders';
import { OrderCategory, TariffType } from '../types';
import { apiClient } from '../api/client';
import { CATEGORIES_LIST, CATEGORY_MAP } from '../data/categories';
import { PageHeader } from '@shared';
import {
  Check,
  ArrowRight,
  Search,
  MapPin,
  FileText,
  SlidersHorizontal,
  Loader2,
  AlertCircle,
  Truck,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';

export const CreateOrderPage: React.FC = () => {
  const { createOrder } = useOrders();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Initial values from pending order or query params
  const [category, setCategory] = useState<OrderCategory>('SHOES');
  const [tariffType, setTariffType] = useState<TariffType>('STANDARD');
  const [itemsCount, setItemsCount] = useState<number>(5000);
  const [ssccNeeded, setSsccNeeded] = useState<boolean>(false);
  const [extraServices, setExtraServices] = useState<string[]>([]);
  const [warehouseAddress, setWarehouseAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Category filtering & searching
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'ACTIVE' | 'UPCOMING'>('ALL');
  const [categorySearch, setCategorySearch] = useState<string>('');

  // Calculation state
  const [calculated, setCalculated] = useState<{ unitPrice: number; totalPrice: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load pending order data on mount (from localStorage or URL params)
  useEffect(() => {
    // 1. Query params
    const qTariff = searchParams.get('tariff');
    const qCount = searchParams.get('count');
    const qCategory = searchParams.get('category');

    if (qTariff && ['DIGITAL', 'PRINT', 'STANDARD', 'PRO'].includes(qTariff)) {
      setTariffType(qTariff as TariffType);
    }
    if (qCount) {
      const parsedCount = parseInt(qCount, 10);
      if (parsedCount > 0) setItemsCount(Math.min(1000000, parsedCount));
    }
    if (qCategory && CATEGORY_MAP[qCategory as OrderCategory]) {
      setCategory(qCategory as OrderCategory);
    }

    // 2. LocalStorage pending order
    try {
      const saved = localStorage.getItem('tanbox_pending_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.tariffType && ['DIGITAL', 'PRINT', 'STANDARD', 'PRO'].includes(parsed.tariffType)) {
          setTariffType(parsed.tariffType);
        }
        if (parsed.itemsCount && parsed.itemsCount > 0) {
          setItemsCount(Math.min(1000000, parsed.itemsCount));
        }
        if (parsed.category && CATEGORY_MAP[parsed.category as OrderCategory]) {
          setCategory(parsed.category);
        }
        if (parsed.ssccNeeded !== undefined) {
          setSsccNeeded(Boolean(parsed.ssccNeeded));
        }
        if (Array.isArray(parsed.extraServices)) {
          setExtraServices(parsed.extraServices);
        }
      }
    } catch (e) {
      console.warn('Failed to parse pending order from localStorage:', e);
    }
  }, [searchParams]);

  // Recalculate price on changes
  useEffect(() => {
    const calc = async () => {
      setLoading(true);
      try {
        const res = await apiClient.post('/calculator/calculate', {
          tariffType,
          itemsCount,
          extraServices,
          ssccNeeded: tariffType === 'PRO' ? true : ssccNeeded,
        });
        setCalculated({
          unitPrice: res.data.unitPrice,
          totalPrice: res.data.totalPrice,
        });
        setErrorMsg(null);
      } catch (e) {
        console.error('Calculation error:', e);
      } finally {
        setLoading(false);
      }
    };
    calc();
  }, [tariffType, itemsCount, ssccNeeded, extraServices]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return CATEGORIES_LIST.filter((cat) => {
      const matchesFilter =
        categoryFilter === 'ALL' || cat.statusBadge === categoryFilter;
      const q = categorySearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        cat.name.toLowerCase().includes(q) ||
        cat.shortName.toLowerCase().includes(q) ||
        cat.tnved.toLowerCase().includes(q) ||
        cat.description.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [categoryFilter, categorySearch]);

  const tariffs: {
    type: TariffType;
    name: string;
    desc: string;
    priceFrom: string;
    features: string[];
  }[] = [
    {
      type: 'DIGITAL',
      name: 'Цифровой',
      desc: 'Только эмиссия кодов Data Matrix в ИС Танба',
      priceFrom: 'от 10 ₸ / шт.',
      features: ['Заказ кодов в ИС Танба / ГС1', 'Выгрузка макетов в PDF / CSV'],
    },
    {
      type: 'PRINT',
      name: 'Печатный',
      desc: 'Печать рулонов стикеров термотрансфером',
      priceFrom: 'от 25 ₸ / шт.',
      features: ['Эмиссия кодов + печать', 'Рулоны промышленного качества'],
    },
    {
      type: 'STANDARD',
      name: 'Стандарт',
      desc: 'Печать и оклейка партии товара под ключ',
      priceFrom: 'от 50 ₸ / шт.',
      features: ['Выезд бригады на ваш склад', 'Оклейка товаров и ввод в оборот'],
    },
    {
      type: 'PRO',
      name: 'PRO Склад',
      desc: 'Оклейка, вскрытие, сверка + SSCC короба',
      priceFrom: 'от 90 ₸ / шт.',
      features: ['Агрегация SSCC коробов', 'Сверка артикулов и брак-контроль'],
    },
  ];

  const presets = [1000, 5000, 10000, 25000, 50000, 100000];
  const sliderMin = 500;
  const sliderMax = 200000;
  const sliderProgress = Math.min(
    100,
    Math.max(0, ((itemsCount - sliderMin) / (sliderMax - sliderMin)) * 100)
  );

  const toggleService = (code: string) => {
    setExtraServices((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const selectedCategoryInfo = CATEGORY_MAP[category] || CATEGORIES_LIST[0];
  const selectedTariffInfo = tariffs.find((t) => t.type === tariffType) || tariffs[2];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calculated) return;
    setSubmitting(true);
    setErrorMsg(null);

    const fullNotes = [
      warehouseAddress ? `Адрес склада в РК: ${warehouseAddress}` : '',
      notes ? `Примечания: ${notes}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    try {
      await createOrder({
        category,
        tariffType,
        itemsCount,
        pricePerItem: calculated.unitPrice,
        totalPrice: calculated.totalPrice,
        extraServices,
        ssccNeeded: tariffType === 'PRO' ? true : ssccNeeded,
        notes: fullNotes,
      });

      // Clear pending order storage on success
      try {
        localStorage.removeItem('tanbox_pending_order');
      } catch {}

      navigate('/orders');
    } catch (err: any) {
      console.error('Submit order error:', err);
      setErrorMsg(
        err.response?.data?.message ||
          'Не удалось создать заказ. Пожалуйста, проверьте данные или свяжитесь с поддержкой.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Page Header */}
      <PageHeader
        title="Создать новый заказ"
        description="Параметры партии товара для автоматического расчёта стоимости и эмиссии кодов ИС Танба"
      />

      <form onSubmit={handleSubmit} className="max-w-[1200px] space-y-8">
        
        {/* Step 1: Category Selection */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/80 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#0082FB] text-white text-xs font-black flex items-center justify-center">
                  1
                </span>
                <label className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                  Категория товара ИС Танба
                </label>
              </div>
              <p className="text-xs text-[#64748B] mt-1 pl-8">
                Выберите официальную товарную группу обязательной маркировки в Республике Казахстан
              </p>
            </div>

            <div className="text-xs text-[#64748B] sm:text-right shrink-0 pl-8 sm:pl-0">
              Выбрана: <strong className="text-[#0082FB] font-extrabold">{selectedCategoryInfo.name}</strong>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            {/* Quick status tabs */}
            <div className="flex items-center gap-1.5 bg-[#F4F6F9] p-1 rounded-xl self-start">
              <button
                type="button"
                onClick={() => setCategoryFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  categoryFilter === 'ALL'
                    ? 'bg-white text-[#111827] shadow-sm'
                    : 'text-[#64748B] hover:text-[#111827]'
                }`}
              >
                Все категории ({CATEGORIES_LIST.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('ACTIVE')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  categoryFilter === 'ACTIVE'
                    ? 'bg-white text-[#111827] shadow-sm'
                    : 'text-[#64748B] hover:text-[#111827]'
                }`}
              >
                Обязательные
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('UPCOMING')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  categoryFilter === 'UPCOMING'
                    ? 'bg-white text-[#111827] shadow-sm'
                    : 'text-[#64748B] hover:text-[#111827]'
                }`}
              >
                Внедряемые (2026–2027)
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Поиск по названию или ТН ВЭД..."
                className="w-full bg-[#F4F6F9] border border-gray-200/80 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0082FB]"
              />
            </div>
          </div>

          {/* Category Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-2">
            {filteredCategories.map((c) => {
              const Icon = c.icon;
              const isSelected = category === c.type;
              return (
                <button
                  type="button"
                  key={c.type}
                  onClick={() => setCategory(c.type)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all group relative cursor-pointer ${
                    isSelected
                      ? 'border-[#0082FB] bg-blue-50/40 ring-2 ring-[#0082FB]/20 shadow-sm'
                      : 'border-gray-200/90 bg-white hover:border-gray-300 hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div>
                    {/* Top Row: Icon + Status */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#0082FB] text-white shadow-sm'
                            : 'bg-gray-100 text-[#475569] group-hover:bg-gray-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                            c.statusBadge === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                              : 'bg-blue-50 text-[#0082FB] border border-blue-200/70'
                          }`}
                        >
                          {c.statusBadge === 'ACTIVE' ? 'Обязательно' : 'С 2026 г.'}
                        </span>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#0082FB] text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <div className="text-sm font-extrabold text-[#111827] leading-snug">
                      {c.name}
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-[#64748B] mt-1 line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>
                  </div>

                  {/* TN VED Badge */}
                  <div className="pt-2.5 mt-2.5 border-t border-gray-100 flex items-center justify-between text-[10px] font-semibold text-[#64748B]">
                    <span>{c.tnved}</span>
                    <span className="text-[#0082FB] font-bold">{c.statusText}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {filteredCategories.length === 0 && (
            <div className="p-8 text-center text-xs text-[#64748B] bg-[#F4F6F9] rounded-2xl">
              По запросу «{categorySearch}» категорий не найдено.{' '}
              <button
                type="button"
                onClick={() => {
                  setCategorySearch('');
                  setCategoryFilter('ALL');
                }}
                className="text-[#0082FB] font-bold underline ml-1 cursor-pointer"
              >
                Сбросить поиск
              </button>
            </div>
          )}
        </div>

        {/* Step 2: Tariff Selection */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/80 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#0082FB] text-white text-xs font-black flex items-center justify-center">
                  2
                </span>
                <label className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                  Тариф маркировки
                </label>
              </div>
              <p className="text-xs text-[#64748B] mt-1 pl-8">
                Выберите формат работ: от генерации цифровых кодов до выездного оклеивания под ключ
              </p>
            </div>

            <span className="text-xs text-[#64748B] pl-8 sm:pl-0">
              Выбран: <strong className="text-[#0082FB] font-extrabold">{selectedTariffInfo.name}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {tariffs.map((t) => {
              const isSelected = tariffType === t.type;
              return (
                <button
                  type="button"
                  key={t.type}
                  onClick={() => setTariffType(t.type)}
                  className={`p-4 rounded-2xl text-left transition-all border flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-[#0082FB] bg-blue-50/40 ring-2 ring-[#0082FB]/20 shadow-sm'
                      : 'border-gray-200/90 bg-white hover:border-gray-300 hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-[#111827]">{t.name}</span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#0082FB] text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      {t.desc}
                    </p>

                    <div className="space-y-1 pt-1.5">
                      {t.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[11px] text-[#475569]">
                          <span className="w-1 h-1 rounded-full bg-[#0082FB]" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 mt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#64748B] uppercase">Тариф</span>
                    <span className="text-xs font-black text-[#111827]">{t.priceFrom}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Volume & Presets */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/80 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#0082FB] text-white text-xs font-black flex items-center justify-center">
                  3
                </span>
                <label className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                  Объем партии товара
                </label>
              </div>
              <p className="text-xs text-[#64748B] mt-1 pl-8">
                Укажите точное количество единиц товара для эмиссии и нанесения кодов
              </p>
            </div>

            {/* Formatted Number Input */}
            <div className="flex items-center gap-2 bg-[#F4F6F9] border border-gray-200 rounded-xl px-3 py-1.5">
              <input
                type="text"
                inputMode="numeric"
                maxLength={7}
                value={itemsCount === 0 ? '' : itemsCount}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  const val = parseInt(raw, 10) || 0;
                  setItemsCount(Math.min(1000000, val));
                }}
                onBlur={() => {
                  if (!itemsCount || itemsCount < 100) {
                    setItemsCount(500);
                  }
                }}
                className="w-28 text-right text-sm font-black text-[#111827] bg-transparent focus:outline-none"
              />
              <span className="text-xs font-bold text-[#64748B]">шт.</span>
            </div>
          </div>

          {/* Interactive Slider */}
          <div className="space-y-2">
            <input
              type="range"
              min={sliderMin}
              max={sliderMax}
              step={500}
              value={itemsCount}
              onChange={(e) => setItemsCount(parseInt(e.target.value, 10) || sliderMin)}
              style={{
                background: `linear-gradient(to right, #0082FB 0%, #0082FB ${sliderProgress}%, #E2E8F0 ${sliderProgress}%, #E2E8F0 100%)`,
              }}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#0082FB]"
            />

            <div className="flex items-center justify-between text-[10px] font-bold text-[#64748B]">
              <span>500 шт.</span>
              <span>50 000 шт.</span>
              <span>100 000 шт.</span>
              <span>200 000+ шт.</span>
            </div>
          </div>

          {/* Quick Presets & Volume Tier Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold text-[#64748B]">Быстрый выбор:</span>
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setItemsCount(preset)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    itemsCount === preset
                      ? 'bg-[#0082FB] text-white shadow-sm'
                      : 'bg-[#F0F4F8] hover:bg-[#E2E8F0] text-[#111827]'
                  }`}
                >
                  {preset.toLocaleString()} шт.
                </button>
              ))}
            </div>

            {/* Discount note */}
            <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/60 self-start sm:self-auto">
              {itemsCount > 100000
                ? '★ Применен максимальный оптовый тариф (партия > 100k)'
                : itemsCount > 20000
                ? '✓ Применен оптовый тариф (партия > 20k)'
                : '• Базовый тариф партии'}
            </div>
          </div>
        </div>

        {/* Step 4: Extra Options */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/80 space-y-5">
          <div className="pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#0082FB] text-white text-xs font-black flex items-center justify-center">
                4
              </span>
              <label className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                Дополнительные опции
              </label>
            </div>
            <p className="text-xs text-[#64748B] mt-1 pl-8">
              Выберите сопутствующие услуги складской обработки, дизайна стикеров и логистики
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Option 1: SSCC */}
            <label
              className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer border transition-all ${
                ssccNeeded || tariffType === 'PRO'
                  ? 'border-[#0082FB] bg-blue-50/40 shadow-sm'
                  : 'border-gray-200/90 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={ssccNeeded || tariffType === 'PRO'}
                  disabled={tariffType === 'PRO'}
                  onChange={(e) => setSsccNeeded(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0082FB] focus:ring-[#0082FB] cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-[#111827] block">
                    Агрегация в короба/паллеты (SSCC)
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    {tariffType === 'PRO' ? 'Включено в тариф PRO Склад' : 'Присвоение кодов групповой таре'}
                  </span>
                </div>
              </div>
              <span className="text-xs font-extrabold text-[#0082FB] shrink-0 ml-3">
                {tariffType === 'PRO' ? 'Включено' : '+5 ₸ / шт.'}
              </span>
            </label>

            {/* Option 2: Layout */}
            <label
              className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer border transition-all ${
                extraServices.includes('STICKER_LAYOUT_DESIGN')
                  ? 'border-[#0082FB] bg-blue-50/40 shadow-sm'
                  : 'border-gray-200/90 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={extraServices.includes('STICKER_LAYOUT_DESIGN')}
                  onChange={() => toggleService('STICKER_LAYOUT_DESIGN')}
                  className="w-4 h-4 rounded text-[#0082FB] focus:ring-[#0082FB] cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-[#111827] block">
                    Разработка макета стикера
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Дизайн этикетки под требования маркетплейсов и регламентов
                  </span>
                </div>
              </div>
              <span className="text-xs font-extrabold text-[#0082FB] shrink-0 ml-3">
                +5 000 ₸
              </span>
            </label>

            {/* Option 3: Urgent */}
            <label
              className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer border transition-all ${
                extraServices.includes('URGENT_PROCESSING')
                  ? 'border-[#0082FB] bg-blue-50/40 shadow-sm'
                  : 'border-gray-200/90 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={extraServices.includes('URGENT_PROCESSING')}
                  onChange={() => toggleService('URGENT_PROCESSING')}
                  className="w-4 h-4 rounded text-[#0082FB] focus:ring-[#0082FB] cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-[#111827] block">
                    Срочное исполнение заказа (24 часа)
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Приоритетный выезд и печать в течение одних суток
                  </span>
                </div>
              </div>
              <span className="text-xs font-extrabold text-[#0082FB] shrink-0 ml-3">
                +20%
              </span>
            </label>

            {/* Option 4: Delivery */}
            <label
              className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer border transition-all ${
                extraServices.includes('EXPRESS_DELIVERY')
                  ? 'border-[#0082FB] bg-blue-50/40 shadow-sm'
                  : 'border-gray-200/90 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={extraServices.includes('EXPRESS_DELIVERY')}
                  onChange={() => toggleService('EXPRESS_DELIVERY')}
                  className="w-4 h-4 rounded text-[#0082FB] focus:ring-[#0082FB] cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-[#111827] block">
                    Доставка готовых стикеров по РК
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Курьерская доставка рулонов прямо на ваш склад
                  </span>
                </div>
              </div>
              <span className="text-xs font-extrabold text-[#0082FB] shrink-0 ml-3">
                +15 000 ₸
              </span>
            </label>
          </div>
        </div>

        {/* Step 5: Warehouse & Details */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/80 space-y-5">
          <div className="pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#0082FB] text-white text-xs font-black flex items-center justify-center">
                5
              </span>
              <label className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                Склад и примечания к оклейке
              </label>
            </div>
            <p className="text-xs text-[#64748B] mt-1 pl-8">
              Укажите адрес складского комплекса для выезда специалистов или отгрузки стикеров
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0082FB]" />
                Адрес склада в РК
              </label>
              <input
                type="text"
                value={warehouseAddress}
                onChange={(e) => setWarehouseAddress(e.target.value)}
                placeholder="г. Алматы, ул. Райымбека 212, склад №4 (или любой другой город РК)"
                className="w-full bg-[#F4F6F9] border border-gray-200/80 rounded-xl px-4 py-3 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0082FB]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#0082FB]" />
                Примечания и требования к оклейке
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Специфика упаковки, температурный режим, контакты кладовщика..."
                className="w-full bg-[#F4F6F9] border border-gray-200/80 rounded-xl px-4 py-3 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0082FB]"
              />
            </div>
          </div>
        </div>

        {/* Error message if any */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Calculation Summary Bar */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="text-xs text-[#64748B]">
              Категория: <strong className="text-[#111827]">{selectedCategoryInfo.shortName}</strong> •{' '}
              Тариф: <strong className="text-[#111827]">{selectedTariffInfo.name}</strong> •{' '}
              Объем: <strong className="text-[#111827]">{itemsCount.toLocaleString()} шт.</strong>
              {calculated && (
                <>
                  {' '}• Цена: <strong className="text-[#111827]">{calculated.unitPrice} ₸ / шт.</strong>
                </>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold text-[#64748B] uppercase">
                Предварительная стоимость:
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">
                {calculated ? `${calculated.totalPrice.toLocaleString()} ₸` : 'Расчет...'}
              </span>
            </div>

            <p className="text-[11px] text-[#64748B]">
              * Расчет является предварительным. Окончательная стоимость формируется при согласовании партии.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || loading || !calculated}
            className="bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-sm py-4 px-8 rounded-xl transition-all active:scale-95 shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50 self-start md:self-auto"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Отправка заказа...</span>
              </>
            ) : (
              <>
                <span>Подтвердить и отправить заказ в работу</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
