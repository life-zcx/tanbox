import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOrders } from '../hooks/useOrders';
import { OrderCategory, TariffType, UserStickerTemplate } from '../types';
import { apiClient } from '../api/client';
import { CATEGORIES_LIST, CATEGORY_MAP, getCategoryLabel } from '../data/categories';
import { PageHeader } from '@shared';
import { StickerCanvasPreview } from '../components/common/StickerCanvasPreview';
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
  Upload,
  AlertTriangle,
  FileSpreadsheet,
  X,
  BookmarkCheck,
  CheckCircle2,
  Palette,
} from 'lucide-react';

export const CreateOrderPage: React.FC = () => {
  const { createOrder } = useOrders();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Initial values from pending order or query params
  const [category, setCategory] = useState<OrderCategory>('SHOES');
  const [tariffType, setTariffType] = useState<TariffType>('STANDARD');
  const [itemsCount, setItemsCount] = useState<number>(5000);
  const [itemsCountInput, setItemsCountInput] = useState<string>('5 000');
  const [ssccNeeded, setSsccNeeded] = useState<boolean>(false);
  const [extraServices, setExtraServices] = useState<string[]>([]);
  const [warehouseAddress, setWarehouseAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Keep itemsCountInput in sync when itemsCount changes externally (presets, slider, pending order)
  useEffect(() => {
    if (itemsCount > 0) {
      setItemsCountInput(itemsCount.toLocaleString('ru-RU'));
    }
  }, [itemsCount]);

  // Custom sticker design states
  const [labelWidth, setLabelWidth] = useState<number | string>(58);
  const [labelHeight, setLabelHeight] = useState<number | string>(40);
  const [labelProductName, setLabelProductName] = useState<string>('');
  const [labelArticle, setLabelArticle] = useState<string>('');
  const [labelBrand, setLabelBrand] = useState<string>('');
  const [labelComposition, setLabelComposition] = useState<string>('');
  const [labelExtraDetails, setLabelExtraDetails] = useState<string>('');
  const [labelHasEac, setLabelHasEac] = useState<boolean>(true);
  const [labelHasBarcode, setLabelHasBarcode] = useState<boolean>(true);

  // Saved sticker templates
  const [savedTemplates, setSavedTemplates] = useState<UserStickerTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateChoice, setTemplateChoice] = useState<'SAVED' | 'NEW' | 'NONE'>('NONE');

  // Load user saved sticker templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await apiClient.get('/user-templates');
        const list: UserStickerTemplate[] = res.data.templates || [];
        setSavedTemplates(list);
        if (list.length > 0) {
          setSelectedTemplateId(list[0].id);
          setTemplateChoice('SAVED');
          setLabelWidth(String(list[0].widthMm));
          setLabelHeight(String(list[0].heightMm));
        }
      } catch (err) {
        console.warn('Could not load user templates:', err);
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  const selectedTemplate = useMemo(
    () => savedTemplates.find((t) => t.id === selectedTemplateId) || null,
    [savedTemplates, selectedTemplateId]
  );

  const handleTemplateChoiceChange = (choice: 'SAVED' | 'NEW' | 'NONE') => {
    setTemplateChoice(choice);
    if (choice === 'SAVED') {
      setExtraServices((prev) => prev.filter((s) => s !== 'STICKER_LAYOUT_DESIGN'));
      if (!selectedTemplateId && savedTemplates.length > 0) {
        setSelectedTemplateId(savedTemplates[0].id);
        setLabelWidth(String(savedTemplates[0].widthMm));
        setLabelHeight(String(savedTemplates[0].heightMm));
      }
    } else if (choice === 'NEW') {
      if (!extraServices.includes('STICKER_LAYOUT_DESIGN')) {
        setExtraServices((prev) => [...prev, 'STICKER_LAYOUT_DESIGN']);
      }
    } else {
      setExtraServices((prev) => prev.filter((s) => s !== 'STICKER_LAYOUT_DESIGN'));
    }
  };

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const found = savedTemplates.find((t) => t.id === id);
    if (found) {
      setLabelWidth(String(found.widthMm));
      setLabelHeight(String(found.heightMm));
    }
  };

  // Saved warehouses from user profile (localStorage)
  const savedWarehouses = useMemo(() => {
    try {
      const saved = localStorage.getItem('tanbox_warehouses');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // ignore
    }
    return [];
  }, []);

  // Auto-populate warehouse from profile (primary warehouse or first warehouse)
  useEffect(() => {
    if (savedWarehouses.length > 0 && !warehouseAddress) {
      const primary = savedWarehouses.find((w: any) => w.isPrimary) || savedWarehouses[0];
      if (primary) {
        const fullAddr = `${primary.city}, ${primary.address} (${primary.name})`;
        setWarehouseAddress(fullAddr);
      }
    }
  }, [savedWarehouses]);

  // Category filtering & searching
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'ACTIVE' | 'UPCOMING'>('ALL');
  const [categorySearch, setCategorySearch] = useState<string>('');

  // Calculation state
  const [calculated, setCalculated] = useState<{ unitPrice: number; totalPrice: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [codesFile, setCodesFile] = useState<File | null>(null);
  const [fileCodesCount, setFileCodesCount] = useState<number | null>(null);
  const [parsingFile, setParsingFile] = useState<boolean>(false);
  const [showMismatchModal, setShowMismatchModal] = useState<boolean>(false);
  const [isCodesDragOver, setIsCodesDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCodesDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (!isCodesDragOver) setIsCodesDragOver(true);
  };

  const handleCodesDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (!isCodesDragOver) setIsCodesDragOver(true);
  };

  const handleCodesDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsCodesDragOver(false);
  };

  const handleCodesDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCodesDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  // Lock body scroll when modal is active
  useEffect(() => {
    if (showMismatchModal) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [showMismatchModal]);

  const handleFileSelection = async (file: File) => {
    setCodesFile(file);
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.csv') || fileName.endsWith('.txt') || fileName.endsWith('.tsv')) {
      setParsingFile(true);
      try {
        const text = await file.text();
        const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
        if (lines.length === 0) {
          setFileCodesCount(0);
        } else {
          const firstLine = lines[0];
          let delimiter = ',';
          if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) delimiter = ';';
          if ((firstLine.match(/\t/g) || []).length > (firstLine.match(/[,;]/g) || []).length) delimiter = '\t';
          const firstCols = firstLine.split(delimiter).map((c) => c.replace(/^["']|["']$/g, '').trim());
          const hasHeader = firstCols.some((c) =>
            /^(code|код|marking|маркировка|gtin|serial|sn|barcode|штрихкод|номенклатура|артикул|article|brand|бренд|наименование)/i.test(c)
          );
          const count = hasHeader ? Math.max(0, lines.length - 1) : lines.length;
          setFileCodesCount(count);
        }
      } catch (err) {
        console.warn('Could not parse codes count from file in browser:', err);
        setFileCodesCount(null);
      } finally {
        setParsingFile(false);
      }
    } else {
      setFileCodesCount(null);
    }
  };

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

  // Recalculate price on changes (debounced by 200ms to prevent race conditions and server spam)
  useEffect(() => {
    if (!itemsCount || itemsCount < 1) return;

    const timer = setTimeout(async () => {
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
    }, 200);

    return () => clearTimeout(timer);
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

  const presets = [100, 500, 1000, 5000, 10000, 25000, 50000];

  // Breakpoints mapping batch size to non-linear slider percentage (0 to 100)
  // Supports any batch size from 1 to 200 000+
  const SLIDER_POINTS = useMemo(
    () => [
      { count: 1, p: 0 },
      { count: 100, p: 8 },
      { count: 500, p: 20 },
      { count: 1000, p: 32 },
      { count: 5000, p: 48 },
      { count: 10000, p: 62 },
      { count: 25000, p: 74 },
      { count: 50000, p: 84 },
      { count: 100000, p: 92 },
      { count: 200000, p: 100 },
    ],
    []
  );

  const countToSliderPercent = (count: number): number => {
    if (count <= 1) return 0;
    if (count >= 200000) return 100;
    for (let i = 0; i < SLIDER_POINTS.length - 1; i++) {
      const p1 = SLIDER_POINTS[i];
      const p2 = SLIDER_POINTS[i + 1];
      if (count >= p1.count && count <= p2.count) {
        const ratio = (count - p1.count) / (p2.count - p1.count);
        return p1.p + ratio * (p2.p - p1.p);
      }
    }
    return 100;
  };

  const sliderPercentToCount = (percent: number): number => {
    if (percent <= 0) return 1;
    if (percent >= 100) return 200000;
    for (let i = 0; i < SLIDER_POINTS.length - 1; i++) {
      const p1 = SLIDER_POINTS[i];
      const p2 = SLIDER_POINTS[i + 1];
      if (percent >= p1.p && percent <= p2.p) {
        const ratio = (percent - p1.p) / (p2.p - p1.p);
        const rawCount = p1.count + ratio * (p2.count - p1.count);
        if (rawCount <= 20) return Math.max(1, Math.round(rawCount));
        if (rawCount <= 100) return Math.round(rawCount / 5) * 5;
        if (rawCount < 1000) return Math.round(rawCount / 50) * 50;
        if (rawCount < 10000) return Math.round(rawCount / 500) * 500;
        if (rawCount < 50000) return Math.round(rawCount / 1000) * 1000;
        return Math.round(rawCount / 5000) * 5000;
      }
    }
    return 200000;
  };

  const sliderProgress = countToSliderPercent(itemsCount);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setItemsCountInput('');
      setItemsCount(0);
      return;
    }
    const val = Math.min(1000000, parseInt(raw, 10) || 0);
    setItemsCountInput(val.toLocaleString('ru-RU'));
    setItemsCount(val);
  };

  const handleInputBlur = () => {
    if (!itemsCount || itemsCount < 1) {
      const fallback = 1;
      setItemsCount(fallback);
      setItemsCountInput('1');
    } else {
      setItemsCountInput(itemsCount.toLocaleString('ru-RU'));
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
  };

  const toggleService = (code: string) => {
    setExtraServices((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const selectedCategoryInfo = CATEGORY_MAP[category] || CATEGORIES_LIST[0];
  const selectedTariffInfo = tariffs.find((t) => t.type === tariffType) || tariffs[2];

  // Triggered on clicking "Подтвердить и отправить заказ"
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!calculated) return;

    // If file code count does not match the entered batch size, prompt user with choices
    if (fileCodesCount !== null && fileCodesCount > 0 && fileCodesCount !== itemsCount) {
      setShowMismatchModal(true);
      return;
    }

    executeSubmit(itemsCount);
  };

  // Final submission execution
  const executeSubmit = async (finalCount: number) => {
    setShowMismatchModal(false);
    setSubmitting(true);
    setErrorMsg(null);

    let unitPrice = calculated?.unitPrice || 0;
    let totalPrice = calculated?.totalPrice || 0;

    // If batch size adjusted to match file count, recalculate price first
    if (finalCount !== itemsCount) {
      setItemsCount(finalCount);
      try {
        const calcRes = await apiClient.post('/calculator/calculate', {
          tariffType,
          itemsCount: finalCount,
          extraServices,
          ssccNeeded: tariffType === 'PRO' ? true : ssccNeeded,
        });
        if (calcRes.data) {
          unitPrice = calcRes.data.unitPrice;
          totalPrice = calcRes.data.totalPrice;
          setCalculated({ unitPrice, totalPrice });
        }
      } catch (calcErr) {
        console.warn('Recalculation error:', calcErr);
      }
    }

    const isStickerDesign = extraServices.includes('STICKER_LAYOUT_DESIGN');
    const usedTemplate = templateChoice === 'SAVED' ? selectedTemplate : null;

    const labelDesignPayload = usedTemplate
      ? [
          '=== МАКЕТ ЭТИКЕТКИ: ИСПОЛЬЗОВАН СОХРАНЁННЫЙ ШАБЛОН ===',
          `Название макета: ${usedTemplate.name}`,
          `Размер: ${usedTemplate.widthMm} × ${usedTemplate.heightMm} мм`,
          `Статус: Утверждён ранее (0 ₸, без повторной оплаты разработки)`,
          '=====================================================',
        ].join('\n')
      : isStickerDesign
      ? [
          '=== ТРЕБОВАНИЯ К МАКЕТУ СТИКЕРА ===',
          `Размер этикетки: ${labelWidth}×${labelHeight} мм`,
          labelProductName ? `Наименование товара: ${labelProductName}` : '',
          labelBrand ? `Бренд: ${labelBrand}` : '',
          labelArticle ? `Артикул: ${labelArticle}` : '',
          labelComposition ? `Состав/Материал: ${labelComposition}` : '',
          `Обязательные знаки: ${[labelHasEac ? 'EAC' : '', labelHasBarcode ? 'Штрихкод EAN-13' : ''].filter(Boolean).join(', ') || 'Стандартные'}`,
          labelExtraDetails ? `Пожелания: ${labelExtraDetails}` : '',
          '===================================',
        ]
          .filter(Boolean)
          .join('\n')
      : '';

    const fullNotes = [
      warehouseAddress ? `Адрес склада в РК: ${warehouseAddress}` : '',
      labelDesignPayload,
      notes ? `Примечания: ${notes}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    try {
      const res = await createOrder({
        category,
        tariffType,
        itemsCount: finalCount,
        pricePerItem: unitPrice,
        totalPrice: totalPrice,
        extraServices,
        ssccNeeded: tariffType === 'PRO' ? true : ssccNeeded,
        notes: fullNotes,
        templateId: usedTemplate ? usedTemplate.id : undefined,
        stickerWidth: usedTemplate ? usedTemplate.widthMm : parseInt(String(labelWidth), 10) || 58,
        stickerHeight: usedTemplate ? usedTemplate.heightMm : parseInt(String(labelHeight), 10) || 40,
      });

      const newOrderId = res?.order?.id || res?.id;

      // If user attached codes file during creation, upload it now
      if (codesFile && newOrderId) {
        try {
          const fileData = new FormData();
          fileData.append('file', codesFile);
          await apiClient.post(`/orders/${newOrderId}/upload-codes`, fileData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (uploadErr) {
          console.warn('Codes file upload failed:', uploadErr);
        }
      }

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

      <form onSubmit={handleFormSubmit} className="w-full space-y-8">
        
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
            {filteredCategories.map((c) => {
              const Icon = c.icon;
              const isSelected = category === c.type;
              return (
                <button
                  type="button"
                  key={c.type}
                  onClick={() => setCategory(c.type)}
                  className={`p-3.5 rounded-xl border text-left transition-all group relative cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-[#0082FB] bg-blue-50/50 ring-2 ring-[#0082FB]/20 shadow-xs'
                      : 'border-gray-200/90 bg-white hover:border-gray-300 hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#0082FB] text-white shadow-xs'
                          : 'bg-gray-100 text-[#475569] group-hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#111827] truncate">
                        {c.name}
                      </div>
                      <span className="text-[10px] text-[#64748B] block mt-0.5">
                        {c.statusBadge === 'ACTIVE' ? 'Обязательно' : 'С 2026 г.'}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#0082FB] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
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

            {/* Formatted Number Input & Live Price Preview */}
            <div className="flex items-center gap-3">
              {calculated && (
                <div className="hidden sm:flex flex-col items-end text-right pr-1">
                  <span className="text-xs font-black text-[#0082FB] tracking-tight">
                    ≈ {calculated.totalPrice.toLocaleString('ru-RU')} ₸
                  </span>
                  <span className="text-[10px] text-gray-500 font-semibold">
                    {calculated.unitPrice} ₸ / шт.
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 bg-[#F4F6F9] hover:bg-white focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0082FB]/20 border border-gray-200 focus-within:border-[#0082FB] rounded-xl px-3 py-1.5 transition-all shadow-2xs">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  value={itemsCountInput}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onKeyDown={handleInputKeyDown}
                  placeholder="500"
                  className="w-28 text-right text-sm font-black text-[#111827] bg-transparent focus:outline-none"
                />
                <span className="text-xs font-bold text-[#64748B]">шт.</span>
              </div>
            </div>
          </div>

          {/* Interactive Responsive Slider */}
          <div className="space-y-2">
            <input
              type="range"
              min={0}
              max={100}
              step={0.5}
              value={sliderProgress}
              onChange={(e) => {
                const nextCount = sliderPercentToCount(parseFloat(e.target.value));
                setItemsCount(nextCount);
              }}
              style={{
                background: `linear-gradient(to right, #0082FB 0%, #0082FB ${sliderProgress}%, #E2E8F0 ${sliderProgress}%, #E2E8F0 100%)`,
              }}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#0082FB]"
            />

            <div className="flex items-center justify-between text-[10px] font-bold text-[#64748B] select-none pt-0.5">
              <button
                type="button"
                onClick={() => setItemsCount(1)}
                className="hover:text-[#0082FB] transition-colors cursor-pointer"
              >
                1 шт.
              </button>
              <button
                type="button"
                onClick={() => setItemsCount(100)}
                className="hover:text-[#0082FB] transition-colors cursor-pointer hidden sm:inline"
              >
                100 шт.
              </button>
              <button
                type="button"
                onClick={() => setItemsCount(500)}
                className="hover:text-[#0082FB] transition-colors cursor-pointer"
              >
                500 шт.
              </button>
              <button
                type="button"
                onClick={() => setItemsCount(5000)}
                className="hover:text-[#0082FB] transition-colors cursor-pointer"
              >
                5 000 шт.
              </button>
              <button
                type="button"
                onClick={() => setItemsCount(25000)}
                className="hover:text-[#0082FB] transition-colors cursor-pointer"
              >
                25 000 шт.
              </button>
              <button
                type="button"
                onClick={() => setItemsCount(50000)}
                className="hover:text-[#0082FB] transition-colors cursor-pointer"
              >
                50 000 шт.
              </button>
              <button
                type="button"
                onClick={() => setItemsCount(100000)}
                className="hover:text-[#0082FB] transition-colors cursor-pointer hidden sm:inline"
              >
                100 000 шт.
              </button>
              <button
                type="button"
                onClick={() => setItemsCount(200000)}
                className="hover:text-[#0082FB] transition-colors cursor-pointer"
              >
                200 000+ шт.
              </button>
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
                  {preset.toLocaleString('ru-RU')} шт.
                </button>
              ))}
            </div>

            {/* Discount note & Volume summary */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/60 self-start sm:self-auto">
                {itemsCount > 100000
                  ? '★ Применен максимальный оптовый тариф (партия > 100k)'
                  : itemsCount > 20000
                  ? '✓ Применен оптовый тариф (партия > 20k)'
                  : '• Базовый тариф партии'}
              </div>
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

            {/* Option 2: Layout / Template Selection */}
            {savedTemplates.length > 0 ? (
              <div className="col-span-1 sm:col-span-2 bg-white border border-gray-200/90 rounded-2xl p-5 space-y-4 shadow-2xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0082FB] flex items-center justify-center shrink-0">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xs font-black text-[#111827] uppercase tracking-wider">
                          Макет этикетки (стикера)
                        </h3>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                          {savedTemplates.length} сохранённых макета в библиотеке
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B]">
                        Используйте ранее утверждённый макет бесплатно или закажите новый дизайн
                      </p>
                    </div>
                  </div>

                  {/* Choice Tabs */}
                  <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl self-start md:self-auto">
                    <button
                      type="button"
                      onClick={() => handleTemplateChoiceChange('SAVED')}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        templateChoice === 'SAVED'
                          ? 'bg-white text-[#0082FB] shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <BookmarkCheck className="w-3.5 h-3.5" />
                      <span>Мой макет (0 ₸)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTemplateChoiceChange('NEW')}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        templateChoice === 'NEW'
                          ? 'bg-white text-[#0082FB] shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Новый дизайн (+5 000 ₸)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTemplateChoiceChange('NONE')}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        templateChoice === 'NONE'
                          ? 'bg-white text-gray-900 shadow-xs'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      Без макета
                    </button>
                  </div>
                </div>

                {/* Tab 1: SAVED TEMPLATES */}
                {templateChoice === 'SAVED' && (
                  <div className="space-y-4 pt-1 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                      {/* Templates List */}
                      <div className="lg:col-span-7 space-y-2.5">
                        <label className="text-[11px] font-bold text-[#64748B] block">
                          Выберите макет из ваших утверждённых:
                        </label>
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {savedTemplates.map((tpl) => {
                            const isSelected = selectedTemplateId === tpl.id;
                            return (
                              <div
                                key={tpl.id}
                                onClick={() => handleSelectTemplate(tpl.id)}
                                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-3 ${
                                  isSelected
                                    ? 'border-[#0082FB] bg-blue-50/60 ring-2 ring-[#0082FB]/20'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-extrabold text-[#111827] truncate block">
                                      {tpl.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                      {tpl.widthMm} × {tpl.heightMm} мм
                                    </span>
                                    {tpl.category && (
                                      <span className="text-[10px] text-gray-500">
                                        {getCategoryLabel(tpl.category)}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="shrink-0 flex items-center gap-2.5">
                                  <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-lg">
                                    Бесплатно (0 ₸)
                                  </span>
                                  <div
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                      isSelected
                                        ? 'border-[#0082FB] bg-[#0082FB] text-white'
                                        : 'border-gray-300'
                                    }`}
                                  >
                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center gap-2.5 text-xs text-emerald-950 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Макет уже утверждён. Повторная разработка не оплачивается (0 ₸)!</span>
                        </div>
                      </div>

                      {/* Live Canvas Preview */}
                      <div className="lg:col-span-5 bg-gray-50 border border-gray-200/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2.5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          Интерактивное превью макета
                        </span>
                        {selectedTemplate ? (
                          <>
                            <div className="p-2 bg-white rounded-xl shadow-xs border border-gray-200/80 flex items-center justify-center max-w-full overflow-hidden">
                              <StickerCanvasPreview
                                widthMm={selectedTemplate.widthMm}
                                heightMm={selectedTemplate.heightMm}
                                elements={(selectedTemplate.elements as any) || []}
                                scale={2.0}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-gray-700">
                              {selectedTemplate.widthMm} × {selectedTemplate.heightMm} мм
                            </span>
                          </>
                        ) : (
                          <div className="py-8 text-xs text-gray-400">
                            Выберите макет из списка слева
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: NEW DESIGN FORM */}
                {templateChoice === 'NEW' && (
                  <div className="space-y-4 pt-1 animate-in fade-in duration-150">
                    <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center gap-2.5 text-xs text-blue-950 font-medium">
                      <Sparkles className="w-4 h-4 text-[#0082FB] shrink-0" />
                      <span>
                        Дизайнер подготовит новый макет под ваши требования (+5 000 ₸). После согласования он сохранится в библиотеку для повторных заказов.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                      <div>
                        <label className="text-[11px] font-bold text-[#64748B] block mb-1">
                          Размер стикера (Ш × В, мм)
                        </label>
                        <div className="flex items-center gap-1.5">
                          <div className="relative flex-1">
                            <input
                              type="number"
                              min="10"
                              max="300"
                              value={labelWidth}
                              onChange={(e) => setLabelWidth(e.target.value)}
                              placeholder="58"
                              className="w-full text-xs font-bold bg-white border border-gray-200/90 rounded-xl px-2.5 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB] text-center"
                            />
                            <span className="absolute right-2 top-2 text-[10px] text-gray-400 font-bold pointer-events-none">мм</span>
                          </div>
                          <span className="text-xs font-bold text-gray-400">×</span>
                          <div className="relative flex-1">
                            <input
                              type="number"
                              min="10"
                              max="300"
                              value={labelHeight}
                              onChange={(e) => setLabelHeight(e.target.value)}
                              placeholder="40"
                              className="w-full text-xs font-bold bg-white border border-gray-200/90 rounded-xl px-2.5 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB] text-center"
                            />
                            <span className="absolute right-2 top-2 text-[10px] text-gray-400 font-bold pointer-events-none">мм</span>
                          </div>
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="text-[11px] font-bold text-[#64748B] block mb-1">
                          Наименование товара
                        </label>
                        <input
                          type="text"
                          value={labelProductName}
                          onChange={(e) => setLabelProductName(e.target.value)}
                          placeholder="Например: Ботинки мужские зимние"
                          className="w-full text-xs font-semibold bg-white border border-gray-200/90 rounded-xl px-3.5 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className="text-[11px] font-bold text-[#64748B] block mb-1">
                          Бренд / Производитель
                        </label>
                        <input
                          type="text"
                          value={labelBrand}
                          onChange={(e) => setLabelBrand(e.target.value)}
                          placeholder="Например: NORTH STEP"
                          className="w-full text-xs font-semibold bg-white border border-gray-200/90 rounded-xl px-3.5 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-[#64748B] block mb-1">
                          Артикул / Модель
                        </label>
                        <input
                          type="text"
                          value={labelArticle}
                          onChange={(e) => setLabelArticle(e.target.value)}
                          placeholder="Например: NS-8821"
                          className="w-full text-xs font-semibold bg-white border border-gray-200/90 rounded-xl px-3.5 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-[#64748B] block mb-1">
                          Состав / Материалы
                        </label>
                        <input
                          type="text"
                          value={labelComposition}
                          onChange={(e) => setLabelComposition(e.target.value)}
                          placeholder="Например: 100% натуральная кожа"
                          className="w-full text-xs font-semibold bg-white border border-gray-200/90 rounded-xl px-3.5 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#64748B] block mb-1">
                        Дополнительный текст и пожелания к макету
                      </label>
                      <textarea
                        rows={2}
                        value={labelExtraDetails}
                        onChange={(e) => setLabelExtraDetails(e.target.value)}
                        placeholder="Укажите размер, цвет, страну производства, адрес изготовителя или особые требования..."
                        className="w-full text-xs font-medium bg-white border border-gray-200/90 rounded-xl p-3 text-[#111827] focus:outline-none focus:border-[#0082FB] resize-none"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-5 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#111827]">
                        <input
                          type="checkbox"
                          checked={labelHasEac}
                          onChange={(e) => setLabelHasEac(e.target.checked)}
                          className="w-4 h-4 rounded text-[#0082FB] focus:ring-[#0082FB]"
                        />
                        <span>Знак обращения EAC</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#111827]">
                        <input
                          type="checkbox"
                          checked={labelHasBarcode}
                          onChange={(e) => setLabelHasBarcode(e.target.checked)}
                          className="w-4 h-4 rounded text-[#0082FB] focus:ring-[#0082FB]"
                        />
                        <span>Штрихкод EAN-13</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Tab 3: NONE */}
                {templateChoice === 'NONE' && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500">
                    Макет стикера не будет прикреплен к заказу. Вы можете предоставить макет позже или заказать печать только Data Matrix кодов.
                  </div>
                )}
              </div>
            ) : (
              <>
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
                        Дизайн этикетки под требования маркетплейсов. Сохранится в библиотеку для повторных заказов!
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-[#0082FB] shrink-0 ml-3">
                    +5 000 ₸
                  </span>
                </label>

                {/* Custom Sticker Layout Input Form */}
                {extraServices.includes('STICKER_LAYOUT_DESIGN') && (
                  <div className="col-span-1 sm:col-span-2 bg-[#F8FAFC] border border-gray-200/90 rounded-2xl p-5 space-y-4">
                    <div className="border-b border-gray-200/80 pb-2.5">
                      <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                        Параметры и текст макета стикера
                      </h4>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Укажите точный размер этикетки и данные для нанесения на стикер
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                      {/* Manual Size Inputs */}
                      <div>
                        <label className="text-[11px] font-bold text-[#64748B] block mb-1">
                          Размер стикера (Ш × В, мм)
                        </label>
                        <div className="flex items-center gap-1.5">
                          <div className="relative flex-1">
                            <input
                              type="number"
                              min="10"
                              max="300"
                              value={labelWidth}
                              onChange={(e) => setLabelWidth(e.target.value)}
                              placeholder="58"
                              className="w-full text-xs font-bold bg-white border border-gray-200/90 rounded-xl px-2.5 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB] text-center"
                            />
                            <span className="absolute right-2 top-2 text-[10px] text-gray-400 font-bold pointer-events-none">мм</span>
                          </div>
                          <span className="text-xs font-bold text-gray-400">×</span>
                          <div className="relative flex-1">
                            <input
                              type="number"
                              min="10"
                              max="300"
                              value={labelHeight}
                              onChange={(e) => setLabelHeight(e.target.value)}
                              placeholder="40"
                              className="w-full text-xs font-bold bg-white border border-gray-200/90 rounded-xl px-2.5 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB] text-center"
                            />
                            <span className="absolute right-2 top-2 text-[10px] text-gray-400 font-bold pointer-events-none">мм</span>
                          </div>
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="text-[11px] font-bold text-[#64748B] block mb-1">
                          Наименование товара
                        </label>
                        <input
                          type="text"
                          value={labelProductName}
                          onChange={(e) => setLabelProductName(e.target.value)}
                          placeholder="Например: Ботинки мужские зимние"
                          className="w-full text-xs font-semibold bg-white border border-gray-200/90 rounded-xl px-3.5 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className="text-[11px] font-bold text-[#64748B] block mb-1">
                          Бренд / Производитель
                        </label>
                        <input
                          type="text"
                          value={labelBrand}
                          onChange={(e) => setLabelBrand(e.target.value)}
                          placeholder="Например: NORTH STEP"
                          className="w-full text-xs font-semibold bg-white border border-gray-200/90 rounded-xl px-3.5 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-[#64748B] block mb-1">
                          Артикул / Модель
                        </label>
                        <input
                          type="text"
                          value={labelArticle}
                          onChange={(e) => setLabelArticle(e.target.value)}
                          placeholder="Например: NS-8821"
                          className="w-full text-xs font-semibold bg-white border border-gray-200/90 rounded-xl px-3.5 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-[#64748B] block mb-1">
                          Состав / Материалы
                        </label>
                        <input
                          type="text"
                          value={labelComposition}
                          onChange={(e) => setLabelComposition(e.target.value)}
                          placeholder="Например: 100% натуральная кожа"
                          className="w-full text-xs font-semibold bg-white border border-gray-200/90 rounded-xl px-3.5 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#64748B] block mb-1">
                        Дополнительный текст и пожелания к макету
                      </label>
                      <textarea
                        rows={2}
                        value={labelExtraDetails}
                        onChange={(e) => setLabelExtraDetails(e.target.value)}
                        placeholder="Укажите размер, цвет, страну производства, адрес изготовителя или особые требования..."
                        className="w-full text-xs font-medium bg-white border border-gray-200/90 rounded-xl p-3 text-[#111827] focus:outline-none focus:border-[#0082FB] resize-none"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-5 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#111827]">
                        <input
                          type="checkbox"
                          checked={labelHasEac}
                          onChange={(e) => setLabelHasEac(e.target.checked)}
                          className="w-4 h-4 rounded text-[#0082FB] focus:ring-[#0082FB]"
                        />
                        <span>Знак обращения EAC</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#111827]">
                        <input
                          type="checkbox"
                          checked={labelHasBarcode}
                          onChange={(e) => setLabelHasBarcode(e.target.checked)}
                          className="w-4 h-4 rounded text-[#0082FB] focus:ring-[#0082FB]"
                        />
                        <span>Штрихкод EAN-13</span>
                      </label>
                    </div>
                  </div>
                )}
              </>
            )}

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1 items-start">
            {/* Warehouse Address */}
            <div className="space-y-2 flex flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-2 min-h-[28px]">
                <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0082FB]" />
                  Адрес склада в РК
                </label>

                {savedWarehouses.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {savedWarehouses.map((w: any) => {
                      const fullAddr = `${w.city}, ${w.address} (${w.name})`;
                      const isSelected = warehouseAddress === fullAddr;
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => setWarehouseAddress(fullAddr)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#0082FB] text-white border-[#0082FB] shadow-xs'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-[#0082FB] hover:text-[#0082FB]'
                          }`}
                        >
                          {w.isPrimary ? '★ ' : ''}{w.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <input
                type="text"
                value={warehouseAddress}
                onChange={(e) => setWarehouseAddress(e.target.value)}
                placeholder="г. Алматы, ул. Райымбека 212, склад №4 (или любой другой город РК)"
                className="w-full bg-[#F4F6F9] border border-gray-200/80 rounded-xl px-4 py-3 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0082FB]"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2 flex flex-col justify-between">
              <div className="flex items-center min-h-[28px]">
                <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#0082FB]" />
                  Примечания и требования к оклейке
                </label>
              </div>

              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Специфика упаковки, температурный режим, контакты кладовщика..."
                className="w-full bg-[#F4F6F9] border border-gray-200/80 rounded-xl px-4 py-3 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0082FB]"
              />
            </div>

            {/* Codes File Attachment */}
            <div className="md:col-span-2 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-[#0082FB]" />
                  Файл с кодами маркировки (необязательно, можно прикрепить позже)
                </label>
                {codesFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setCodesFile(null);
                      setFileCodesCount(null);
                    }}
                    className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    Удалить выбранный файл
                  </button>
                )}
              </div>

              <div
                onDragOver={handleCodesDragOver}
                onDragEnter={handleCodesDragEnter}
                onDragLeave={handleCodesDragLeave}
                onDrop={handleCodesDrop}
                className={`border-2 border-dashed rounded-2xl p-5 transition-all text-center relative ${
                  isCodesDragOver
                    ? 'border-[#0082FB] bg-blue-50/80 ring-2 ring-[#0082FB]/20 scale-[1.005]'
                    : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'
                }`}
              >
                {isCodesDragOver && codesFile && (
                  <div className="absolute inset-0 bg-blue-50/95 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-[#0082FB] z-10 pointer-events-none">
                    <Upload className="w-8 h-8 text-[#0082FB] animate-bounce mb-2" />
                    <span className="text-xs font-bold text-[#0082FB]">Отпустите файл для замены</span>
                  </div>
                )}

                {codesFile ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 bg-white border border-gray-200 rounded-xl">
                      <div className="flex items-center gap-3 text-left">
                        <FileText className="w-6 h-6 text-[#0082FB] shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-[#111827] block truncate">
                            {codesFile.name}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {(codesFile.size / 1024).toFixed(1)} КБ • Будет автоматически сохранён на сервере и подтянут в макет
                          </span>
                        </div>
                      </div>
                      <label className="text-xs font-bold text-[#0082FB] hover:underline cursor-pointer px-3 py-1.5 bg-blue-50 rounded-lg">
                        Заменить
                        <input
                          type="file"
                          accept=".csv,.txt,.pdf,.zip,.xlsx"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleFileSelection(e.target.files[0]);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Parsing status */}
                    {parsingFile && (
                      <div className="p-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-600 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#0082FB]" />
                        <span>Подсчет кодов маркировки в файле...</span>
                      </div>
                    )}

                    {/* Discrepancy notification banner */}
                    {!parsingFile && fileCodesCount !== null && (
                      fileCodesCount !== itemsCount ? (
                        <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left animate-in fade-in duration-150 shadow-xs">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0082FB] flex items-center justify-center shrink-0 mt-0.5 border border-blue-100">
                              <FileSpreadsheet className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-black text-[#111827]">
                                  В файле обнаружено {fileCodesCount.toLocaleString()} кодов
                                </span>
                                <span className="text-[11px] font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                                  В заказе: {itemsCount.toLocaleString()} шт.
                                </span>
                                <span className="text-[11px] font-bold text-[#0082FB] bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                                  {fileCodesCount < itemsCount
                                    ? `на ${(itemsCount - fileCodesCount).toLocaleString()} шт. меньше`
                                    : `на ${(fileCodesCount - itemsCount).toLocaleString()} шт. больше`}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">
                                {fileCodesCount < itemsCount
                                  ? `Количество кодов в файле меньше указанного тиража партии. Нажмите кнопку справа, чтобы синхронизировать объем и пересчитать стоимость заказа:`
                                  : `В файле больше кодов, чем указано в тираже партии. Нажмите кнопку, чтобы расширить заказ до фактического объема файла:`}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setItemsCount(fileCodesCount)}
                            className="inline-flex items-center justify-center gap-1.5 bg-[#0082FB] hover:bg-[#0070DA] active:scale-95 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-blue-500/15 cursor-pointer shrink-0"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Установить {fileCodesCount.toLocaleString()} шт.</span>
                          </button>
                        </div>
                      ) : (
                        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center gap-3 text-left animate-in fade-in duration-150">
                          <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-emerald-950 block">
                              Файл проверен: в нем ровно {fileCodesCount.toLocaleString()} кодов Data Matrix
                            </span>
                            <span className="text-[11px] text-emerald-700">
                              Количество полностью совпадает с тиражом партии заказа.
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer block space-y-2 select-none"
                  >
                    <Upload className={`w-6 h-6 mx-auto pointer-events-none transition-colors ${isCodesDragOver ? 'text-[#0082FB] animate-bounce' : 'text-gray-400'}`} />
                    <div className="pointer-events-none">
                      <span className="text-xs font-bold text-[#0082FB] hover:underline">
                        {isCodesDragOver ? 'Отпустите файл для загрузки' : 'Выберите файл с кодами'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {isCodesDragOver ? '' : ' или перетащите его сюда'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 pointer-events-none">
                      Поддерживаются CSV, TXT, PDF, ZIP от ИС Танба / Asl Belgisi / Честный Знак (до 50 МБ)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.txt,.pdf,.zip,.xlsx"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileSelection(e.target.files[0]);
                      }}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
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

      {/* Discrepancy Confirmation Modal on Submit */}
      {showMismatchModal && fileCodesCount !== null && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowMismatchModal(false);
          }}
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-6 animate-in zoom-in-95 duration-150 relative">
            <button
              type="button"
              onClick={() => setShowMismatchModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center space-y-2 pt-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0082FB] flex items-center justify-center mx-auto border border-blue-100">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[#111827]">
                Несоответствие количества кодов
              </h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto leading-relaxed">
                В прикрепленном файле обнаружено иное количество кодов маркировки, чем указано в объеме партии заказа.
              </p>
            </div>

            {/* Comparison Cards */}
            <div className="grid grid-cols-2 gap-3 bg-[#F8FAFC] p-4 rounded-2xl border border-slate-200/80">
              <div className="text-center p-3.5 bg-white rounded-xl border border-blue-100 shadow-2xs">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  В файле
                </div>
                <div className="text-xl font-black text-[#0082FB]">
                  {fileCodesCount.toLocaleString()} <span className="text-xs font-bold text-slate-500">шт.</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Фактический объем кодов</div>
              </div>

              <div className="text-center p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  В заказе
                </div>
                <div className="text-xl font-black text-[#111827]">
                  {itemsCount.toLocaleString()} <span className="text-xs font-bold text-slate-500">шт.</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Заявленный тираж</div>
              </div>

              <div className="col-span-2 text-center text-xs font-medium text-slate-600 pt-1">
                Разница: <strong className="text-[#111827]">{Math.abs(itemsCount - fileCodesCount).toLocaleString()} шт.</strong>{' '}
                ({fileCodesCount < itemsCount ? 'в файле меньше, чем в заказе' : 'в файле больше, чем в заказе'})
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => executeSubmit(fileCodesCount)}
                className="w-full py-3.5 px-4 bg-[#0082FB] hover:bg-[#0070DA] active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Скорректировать тираж до {fileCodesCount.toLocaleString()} шт. и отправить</span>
              </button>

              <button
                type="button"
                onClick={() => executeSubmit(itemsCount)}
                className="w-full py-3 px-4 bg-white hover:bg-slate-50 active:scale-[0.99] text-[#111827] font-bold text-xs rounded-xl border border-gray-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Оставить заявленный объем ({itemsCount.toLocaleString()} шт.) и отправить</span>
              </button>

              <button
                type="button"
                onClick={() => setShowMismatchModal(false)}
                className="w-full py-2 text-center text-xs font-bold text-[#64748B] hover:text-[#111827] transition-colors cursor-pointer"
              >
                Вернуться к редактированию
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
