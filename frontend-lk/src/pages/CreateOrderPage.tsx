import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOrders } from '../hooks/useOrders';
import { OrderCategory, TariffType, UserStickerTemplate } from '../types';
import { apiClient } from '../api/client';
import { CATEGORIES_LIST, CATEGORY_MAP, getCategoryLabel } from '../data/categories';
import { PageHeader } from '@shared';
import { StickerCanvasPreview } from '../components/common/StickerCanvasPreview';
import { TariffHelpModal } from '../components/modals/TariffHelpModal';
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
  BookmarkCheck,
  CheckCircle2,
  Palette,
  Barcode,
  Tag,
  HelpCircle,
} from 'lucide-react';

export const CreateOrderPage: React.FC = () => {
  const { createOrder } = useOrders();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Initial values: null by default as requested (user must select manually)
  const [category, setCategory] = useState<OrderCategory | null>(null);
  const [tariffType, setTariffType] = useState<TariffType | null>(null);
  const [showTariffHelpModal, setShowTariffHelpModal] = useState<boolean>(false);
  const [itemsCount, setItemsCount] = useState<number>(0);
  const [ssccNeeded, setSsccNeeded] = useState<boolean>(false);
  const [extraServices, setExtraServices] = useState<string[]>([]);
  const [warehouseAddress, setWarehouseAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

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
  const [labelBarcode, setLabelBarcode] = useState<string>('');

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
  const [codeCheckResult, setCodeCheckResult] = useState<{
    totalInFile: number;
    uniqueInFile: number;
    internalDuplicatesCount: number;
    alreadyInDbCount: number;
    validNewCodesCount: number;
    sampleExistingCodes?: string[];
    message?: string;
  } | null>(null);
  const [parsingFile, setParsingFile] = useState<boolean>(false);
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

  const handleFileSelection = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMsg('Поддерживаются только файлы выгрузки кодов в формате .CSV');
      return;
    }
    setErrorMsg('');
    setCodesFile(file);
    setCodeCheckResult(null);
    setParsingFile(true);

    try {
      // 1. Check file against backend database for duplicates
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post('/orders/check-codes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data) {
        setCodeCheckResult(res.data);
        const validCount = Number(res.data.validNewCodesCount) || 0;
        setFileCodesCount(validCount);
        setItemsCount(validCount);
      }
    } catch (apiErr: any) {
      console.warn('Backend check-codes failed, falling back to local line parse:', apiErr);
      // Fallback to local line parse if network/server error
      try {
        const text = await file.text();
        const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
        if (lines.length === 0) {
          setFileCodesCount(0);
          setItemsCount(0);
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
          setItemsCount(count);
        }
      } catch (err) {
        setFileCodesCount(null);
        setItemsCount(0);
      }
    } finally {
      setParsingFile(false);
    }
  };

  // Check URL query parameters on mount (if user came with preselected category or tariff)
  useEffect(() => {
    const qTariff = searchParams.get('tariff');
    const qCategory = searchParams.get('category');

    if (qTariff && ['DIGITAL', 'PRINT', 'STANDARD', 'PRO'].includes(qTariff)) {
      setTariffType(qTariff as TariffType);
    }
    if (qCategory && CATEGORY_MAP[qCategory as OrderCategory]) {
      setCategory(qCategory as OrderCategory);
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

  const toggleService = (code: string) => {
    setExtraServices((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const selectedCategoryInfo = category ? CATEGORY_MAP[category] : null;
  const selectedTariffInfo = tariffType ? tariffs.find((t) => t.type === tariffType) : null;

  // Triggered on clicking "Подтвердить и отправить заказ"
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!category) {
      setErrorMsg('Пожалуйста, выберите категорию товара (Шаг 1). Без категории создание заявки невозможно.');
      document.getElementById('step-category-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!tariffType) {
      setErrorMsg('Пожалуйста, выберите тариф маркировки (Шаг 2). Без тарифа создание заявки невозможно.');
      document.getElementById('step-tariff-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!warehouseAddress.trim()) {
      setErrorMsg('Пожалуйста, укажите адрес склада в РК (Шаг 4). Создание заказа без адреса невозможно.');
      const warehouseEl = document.getElementById('warehouse-address-input');
      if (warehouseEl) {
        warehouseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        warehouseEl.focus();
      }
      return;
    }

    if (!codesFile) {
      setErrorMsg('Пожалуйста, прикрепите файл с кодами маркировки (Шаг 5). Создание заказа без файла кодов невозможно.');
      document.getElementById('step-codes-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (itemsCount < 1) {
      setErrorMsg('В прикреплённом файле не найдено новых кодов для заказа. Загрузите файл со свежими кодами маркировки.');
      document.getElementById('step-codes-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    executeSubmit(itemsCount);
  };

  // Final submission execution
  const executeSubmit = async (finalCount: number) => {
    if (!category || !tariffType || !warehouseAddress.trim() || !codesFile || finalCount < 1) {
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    let unitPrice = calculated?.unitPrice || 0;
    let totalPrice = calculated?.totalPrice || 0;

    if (!calculated || calculated.totalPrice === 0) {
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

    const labelDesignPayload = (!usedTemplate && isStickerDesign)
      ? [
          '=== ТРЕБОВАНИЯ К МАКЕТУ СТИКЕРА ===',
          `Размер этикетки: ${labelWidth}×${labelHeight} мм`,
          labelProductName ? `Наименование товара: ${labelProductName}` : '',
          labelBrand ? `Бренд: ${labelBrand}` : '',
          labelArticle ? `Артикул: ${labelArticle}` : '',
          labelComposition ? `Состав/Материал: ${labelComposition}` : '',
          `Обязательные знаки: ${[labelHasEac ? 'EAC' : '', labelHasBarcode ? 'Штрихкод EAN-13' : ''].filter(Boolean).join(', ') || 'Стандартные'}`,
          labelHasBarcode ? (labelBarcode ? `Штрихкод (EAN-13): ${labelBarcode}` : 'Штрихкод (EAN-13): Сгенерировать дизайнером') : '',
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
        <div id="step-category-section" className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/80 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0082FB] flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#111827]">
                  Категория товара
                </h3>
                <p className="text-xs text-[#64748B]">
                  Выберите товарную группу маркировки в Республике Казахстан
                </p>
              </div>
            </div>

            <div className="text-xs sm:text-right shrink-0">
              {selectedCategoryInfo && (
                <span className="text-[#64748B]">
                  Выбрана: <strong className="text-[#0082FB] font-extrabold">{selectedCategoryInfo.name}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Category Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
            {CATEGORIES_LIST.map((c) => {
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
        </div>

        {/* Step 2: Tariff Selection */}
        <div id="step-tariff-section" className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/80 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0082FB] flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#111827]">
                  Тариф маркировки
                </h3>
                <p className="text-xs text-[#64748B]">
                  Выберите формат работ: от генерации цифровых кодов до выездного оклеивания под ключ
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {selectedTariffInfo && (
                <span className="text-xs text-[#64748B]">
                  Выбран: <strong className="text-[#0082FB] font-extrabold">{selectedTariffInfo.name}</strong>
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowTariffHelpModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0082FB] hover:text-[#0070DA] bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/80 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Справка по тарифам</span>
              </button>
            </div>
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

        {/* Step 3: Extra Options */}
        <div id="step-services-section" className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/80 space-y-5">
          <div className="pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0082FB] flex items-center justify-center shrink-0">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#111827]">
                  Дополнительные опции
                </h3>
                <p className="text-xs text-[#64748B]">
                  Выберите сопутствующие услуги складской обработки, дизайна стикеров и логистики
                </p>
              </div>
            </div>
          </div>

          {/* 1. Макет этикетки (стикера) */}
          {savedTemplates.length > 0 ? (
            <div className="w-full bg-[#F8FAFC] border border-gray-200/90 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-200/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0082FB] flex items-center justify-center shrink-0">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs font-black text-[#111827] uppercase tracking-wider">
                        Макет этикетки (стикера)
                      </h3>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                        {savedTemplates.length === 1
                          ? '1 сохранённый макет в библиотеке'
                          : savedTemplates.length >= 2 && savedTemplates.length <= 4
                          ? `${savedTemplates.length} сохранённых макета в библиотеке`
                          : `${savedTemplates.length} сохранённых макетов в библиотеке`}
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

                    <div className="space-y-3 pt-1">
                      <div className="flex flex-wrap items-center gap-5">
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

                      {labelHasBarcode && (
                        <div className="w-full bg-blue-50/50 border border-blue-200/80 rounded-xl p-3 space-y-1.5 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-[#111827] flex items-center gap-1.5">
                              <Barcode className="w-4 h-4 text-[#0082FB]" />
                              <span>Номер штрихкода (EAN-13)</span>
                            </label>
                            <span className="text-[10px] text-[#64748B] font-mono">
                              {labelBarcode ? `${labelBarcode.length}/13 цифр` : '13 цифр'}
                            </span>
                          </div>
                          <input
                            type="text"
                            value={labelBarcode}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 13);
                              setLabelBarcode(val);
                            }}
                            placeholder="Например: 4601234567890 (или оставьте пустым для автогенерации)"
                            maxLength={13}
                            className="w-full text-xs font-mono font-bold bg-white border border-gray-200/90 rounded-xl px-3.5 py-2 text-[#111827] placeholder:text-[#94A3B8] placeholder:font-sans placeholder:font-normal focus:outline-none focus:border-[#0082FB]"
                          />
                          <p className="text-[10px] text-[#64748B]">
                            Укажите 13-значный EAN-13 штрихкод товара для касс и складов маркетплейсов. Если кода нет — дизайнер сгенерирует штрихкод автоматически.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab 3: NONE */}
                {templateChoice === 'NONE' && (
                  <div className="p-3.5 bg-blue-50/50 border border-blue-200/70 rounded-xl flex items-center gap-3 text-xs text-[#475569]">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#0082FB] flex items-center justify-center shrink-0">
                      <Barcode className="w-4 h-4" />
                    </div>
                    <span>
                      Макет стикера не будет прикреплен к заказу. Вы можете предоставить макет позже или заказать печать только Data Matrix кодов.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full bg-[#F8FAFC] border border-gray-200/90 rounded-2xl p-5 space-y-4">
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

                    <div className="space-y-3 pt-1">
                      <div className="flex flex-wrap items-center gap-5">
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

                      {labelHasBarcode && (
                        <div className="w-full bg-blue-50/50 border border-blue-200/80 rounded-xl p-3 space-y-1.5 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-[#111827] flex items-center gap-1.5">
                              <Barcode className="w-4 h-4 text-[#0082FB]" />
                              <span>Номер штрихкода (EAN-13)</span>
                            </label>
                            <span className="text-[10px] text-[#64748B] font-mono">
                              {labelBarcode ? `${labelBarcode.length}/13 цифр` : '13 цифр'}
                            </span>
                          </div>
                          <input
                            type="text"
                            value={labelBarcode}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 13);
                              setLabelBarcode(val);
                            }}
                            placeholder="Например: 4601234567890 (или оставьте пустым для автогенерации)"
                            maxLength={13}
                            className="w-full text-xs font-mono font-bold bg-white border border-gray-200/90 rounded-xl px-3.5 py-2 text-[#111827] placeholder:text-[#94A3B8] placeholder:font-sans placeholder:font-normal focus:outline-none focus:border-[#0082FB]"
                          />
                          <p className="text-[10px] text-[#64748B]">
                            Укажите 13-значный EAN-13 штрихкод товара для касс и складов маркетплейсов. Если кода нет — дизайнер сгенерирует штрихкод автоматически.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* 2. Сопутствующие складские и логистические услуги */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#0082FB]" />
                Складские и логистические услуги
              </span>
              <span className="text-[11px] text-[#64748B]">
                Опционально для партии
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* Option 1: SSCC */}
              <label
                className={`flex flex-col justify-between p-4 rounded-2xl cursor-pointer border transition-all ${
                  ssccNeeded || tariffType === 'PRO'
                    ? 'border-[#0082FB] bg-blue-50/40 shadow-xs ring-1 ring-[#0082FB]/20'
                    : 'border-gray-200/90 bg-white hover:border-gray-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        ssccNeeded || tariffType === 'PRO'
                          ? 'bg-[#0082FB] text-white shadow-xs'
                          : 'bg-gray-100 text-[#64748B]'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                    </div>
                    <input
                      type="checkbox"
                      checked={ssccNeeded || tariffType === 'PRO'}
                      disabled={tariffType === 'PRO'}
                      onChange={(e) => setSsccNeeded(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0082FB] focus:ring-[#0082FB] cursor-pointer mt-0.5"
                    />
                  </div>
                  <span className="text-xs font-bold text-[#111827] block">
                    Агрегация в короба (SSCC)
                  </span>
                  <span className="text-[11px] text-[#64748B] block mt-0.5 leading-snug">
                    {tariffType === 'PRO' ? 'Включено в тариф PRO Склад' : 'Присвоение кодов групповой таре'}
                  </span>
                </div>
                <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Тариф</span>
                  <span className="text-xs font-extrabold text-[#0082FB]">
                    {tariffType === 'PRO' ? 'Включено' : '+5 ₸ / шт.'}
                  </span>
                </div>
              </label>

              {/* Option 2: Urgent */}
              <label
                className={`flex flex-col justify-between p-4 rounded-2xl cursor-pointer border transition-all ${
                  extraServices.includes('URGENT_PROCESSING')
                    ? 'border-[#0082FB] bg-blue-50/40 shadow-xs ring-1 ring-[#0082FB]/20'
                    : 'border-gray-200/90 bg-white hover:border-gray-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        extraServices.includes('URGENT_PROCESSING')
                          ? 'bg-[#0082FB] text-white shadow-xs'
                          : 'bg-gray-100 text-[#64748B]'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                    </div>
                    <input
                      type="checkbox"
                      checked={extraServices.includes('URGENT_PROCESSING')}
                      onChange={() => toggleService('URGENT_PROCESSING')}
                      className="w-4 h-4 rounded text-[#0082FB] focus:ring-[#0082FB] cursor-pointer mt-0.5"
                    />
                  </div>
                  <span className="text-xs font-bold text-[#111827] block">
                    Срочное исполнение (24 ч.)
                  </span>
                  <span className="text-[11px] text-[#64748B] block mt-0.5 leading-snug">
                    Приоритетный выезд и печать в течение одних суток
                  </span>
                </div>
                <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Наценка</span>
                  <span className="text-xs font-extrabold text-[#0082FB]">+20%</span>
                </div>
              </label>

              {/* Option 3: Delivery */}
              <label
                className={`flex flex-col justify-between p-4 rounded-2xl cursor-pointer border transition-all ${
                  extraServices.includes('EXPRESS_DELIVERY')
                    ? 'border-[#0082FB] bg-blue-50/40 shadow-xs ring-1 ring-[#0082FB]/20'
                    : 'border-gray-200/90 bg-white hover:border-gray-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        extraServices.includes('EXPRESS_DELIVERY')
                          ? 'bg-[#0082FB] text-white shadow-xs'
                          : 'bg-gray-100 text-[#64748B]'
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                    </div>
                    <input
                      type="checkbox"
                      checked={extraServices.includes('EXPRESS_DELIVERY')}
                      onChange={() => toggleService('EXPRESS_DELIVERY')}
                      className="w-4 h-4 rounded text-[#0082FB] focus:ring-[#0082FB] cursor-pointer mt-0.5"
                    />
                  </div>
                  <span className="text-xs font-bold text-[#111827] block">
                    Доставка готовых стикеров
                  </span>
                  <span className="text-[11px] text-[#64748B] block mt-0.5 leading-snug">
                    Курьерская доставка рулонов прямо на ваш склад по РК
                  </span>
                </div>
                <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Фиксировано</span>
                  <span className="text-xs font-extrabold text-[#0082FB]">+15 000 ₸</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Step 4: Warehouse & Notes */}
        <div id="step-warehouse-section" className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/80 space-y-5">
          <div className="pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0082FB] flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#111827]">
                  Склад и примечания к оклейке
                </h3>
                <p className="text-xs text-[#64748B]">
                  Укажите адрес складского комплекса для выезда специалистов или отгрузки стикеров
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1 items-start">
            {/* Warehouse Address */}
            <div className="space-y-2 flex flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-2 min-h-[28px]">
                <label htmlFor="warehouse-address-input" className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0082FB]" />
                  <span>Адрес склада в РК</span>
                  <span className="text-red-500 font-bold">*</span>
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
                          onClick={() => {
                            setWarehouseAddress(fullAddr);
                            if (errorMsg) setErrorMsg(null);
                          }}
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
                id="warehouse-address-input"
                type="text"
                required
                value={warehouseAddress}
                onChange={(e) => {
                  setWarehouseAddress(e.target.value);
                  if (errorMsg && e.target.value.trim()) setErrorMsg(null);
                }}
                placeholder="г. Алматы, ул. Райымбека 212, склад №4 (или любой другой город РК)"
                className={`w-full bg-[#F4F6F9] border rounded-xl px-4 py-3 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0082FB] transition-all ${
                  !warehouseAddress.trim() && errorMsg
                    ? 'border-red-400 ring-2 ring-red-100 bg-red-50/20'
                    : 'border-gray-200/80'
                }`}
              />
              {!warehouseAddress.trim() && errorMsg && (
                <p className="text-[11px] text-red-600 font-bold animate-in fade-in duration-150">
                  Пожалуйста, введите адрес склада или выберите один из ваших адресов выше.
                </p>
              )}
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
          </div>
        </div>

        {/* Step 5: Codes File Attachment (MANDATORY) */}
        <div id="step-codes-section" className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/80 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0082FB] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#111827]">
                  Файл с кодами маркировки (.CSV)
                </h3>
                <p className="text-xs text-[#64748B]">
                  Объем партии рассчитывается автоматически из загруженного файла кодов
                </p>
              </div>
            </div>

            {codesFile && (
              <button
                type="button"
                onClick={() => {
                  setCodesFile(null);
                  setFileCodesCount(null);
                  setCodeCheckResult(null);
                  setItemsCount(0);
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
            className={`border-2 border-dashed rounded-2xl p-6 transition-all text-center relative ${
              isCodesDragOver
                ? 'border-[#0082FB] bg-blue-50/80 ring-2 ring-[#0082FB]/20 scale-[1.005]'
                : !codesFile && errorMsg
                ? 'border-red-300 bg-red-50/20'
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
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-2xs">
                  <div className="flex items-center gap-3 text-left min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0082FB] flex items-center justify-center shrink-0 border border-blue-100">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-[#111827] block truncate">
                        {codesFile.name}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {(codesFile.size / 1024).toFixed(1)} КБ
                      </span>
                    </div>
                  </div>
                  <label className="text-xs font-bold text-[#0082FB] hover:underline cursor-pointer px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg shrink-0 transition-colors">
                    Заменить файл
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileSelection(e.target.files[0]);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Verification / parsing status */}
                {parsingFile && (
                  <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-[#0082FB] flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#0082FB]" />
                    <span className="font-bold">Проверка кодов маркировки по базе данных TANBOX...</span>
                  </div>
                )}

                {/* Backend DB Check Result */}
                {!parsingFile && codeCheckResult && (
                  <div className="space-y-3">
                    <div className="p-4 bg-white border border-gray-200/90 rounded-2xl text-left space-y-3.5 shadow-xs">
                      {/* Header section */}
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                            codeCheckResult.validNewCodesCount === 0
                              ? 'bg-red-50 text-red-600 border-red-200'
                              : codeCheckResult.alreadyInDbCount > 0 || codeCheckResult.internalDuplicatesCount > 0
                              ? 'bg-amber-50 text-amber-600 border-amber-200'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          }`}
                        >
                          {codeCheckResult.validNewCodesCount === 0 ? (
                            <AlertCircle className="w-4 h-4 stroke-[2.5]" />
                          ) : codeCheckResult.alreadyInDbCount > 0 || codeCheckResult.internalDuplicatesCount > 0 ? (
                            <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-[#111827]">
                              {codeCheckResult.validNewCodesCount === 0
                                ? 'Все коды из файла уже использованы в системе'
                                : codeCheckResult.alreadyInDbCount > 0 || codeCheckResult.internalDuplicatesCount > 0
                                ? 'Результат верификации кодов по базе данных'
                                : 'Коды успешно проверены по базе данных TANBOX'}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
                            {codeCheckResult.validNewCodesCount === 0
                              ? 'В данном файле нет новых кодов. Загрузите файл со свежими кодами маркировки из ИС Танба.'
                              : codeCheckResult.alreadyInDbCount > 0 || codeCheckResult.internalDuplicatesCount > 0
                              ? 'Система автоматически исключила коды, которые уже были нанесены или загружены в других заказах, чтобы избежать брака.'
                              : `Все ${codeCheckResult.validNewCodesCount.toLocaleString()} кодов уникальны и готовы к эмиссии и печати.`}
                          </p>
                        </div>
                      </div>

                      {/* Stats Pills - Clean TANBOX neutral design */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="bg-[#F8FAFC] p-3 rounded-xl border border-gray-200/80 text-center">
                          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                            Всего в файле
                          </span>
                          <span className="text-sm font-black text-[#111827] font-mono mt-0.5 block">
                            {codeCheckResult.totalInFile.toLocaleString()}
                          </span>
                        </div>
                        <div className="bg-[#F8FAFC] p-3 rounded-xl border border-gray-200/80 text-center">
                          <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">
                            Уже в базе
                          </span>
                          <span className="text-sm font-black text-red-600 font-mono mt-0.5 block">
                            −{codeCheckResult.alreadyInDbCount.toLocaleString()}
                          </span>
                        </div>
                        <div className="bg-[#F8FAFC] p-3 rounded-xl border border-gray-200/80 text-center">
                          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                            Дубли в файле
                          </span>
                          <span className="text-sm font-black text-amber-600 font-mono mt-0.5 block">
                            −{codeCheckResult.internalDuplicatesCount.toLocaleString()}
                          </span>
                        </div>
                        <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80 text-center">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                            Чистых новых
                          </span>
                          <span className="text-sm font-black text-emerald-700 font-mono mt-0.5 block">
                            +{codeCheckResult.validNewCodesCount.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {codeCheckResult.validNewCodesCount === 0 ? (
                        <div className="p-3 bg-red-50/60 border border-red-200/70 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                          <span className="text-xs font-medium text-red-900">
                            Заказ не может быть создан с нулевым тиражом. Выберите другой файл со свежими кодами.
                          </span>
                          <label className="inline-flex items-center justify-center gap-1.5 bg-[#111827] hover:bg-black active:scale-95 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer shrink-0">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Выбрать другой файл</span>
                            <input
                              type="file"
                              accept=".csv"
                              onChange={(e) => {
                                if (e.target.files?.[0]) handleFileSelection(e.target.files[0]);
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-emerald-50/60 border border-emerald-200/60 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Объем партии товара автоматически определен: <strong>{itemsCount.toLocaleString()} шт.</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Fallback if local parse only */}
                {!parsingFile && !codeCheckResult && fileCodesCount !== null && (
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center gap-3 text-left animate-in fade-in duration-150">
                    <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-emerald-950 block">
                        Файл проверен: в нем {fileCodesCount.toLocaleString()} кодов Data Matrix
                      </span>
                      <span className="text-[11px] text-emerald-700">
                        Объем партии автоматически установлен: {fileCodesCount.toLocaleString()} шт.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer block space-y-2.5 py-6 select-none"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0082FB] flex items-center justify-center mx-auto border border-blue-100">
                  <Upload className={`w-6 h-6 pointer-events-none transition-colors ${isCodesDragOver ? 'text-[#0082FB] animate-bounce' : 'text-[#0082FB]'}`} />
                </div>
                <div className="pointer-events-none">
                  <span className="text-sm font-bold text-[#0082FB] hover:underline">
                    {isCodesDragOver ? 'Отпустите файл для загрузки' : 'Нажмите для выбора файла с кодами'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {isCodesDragOver ? '' : ' или перетащите его сюда'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 pointer-events-none max-w-md mx-auto">
                  Поддерживается формат CSV (выгрузка кодов из ИС Танба / Asl Belgisi / Честный Знак)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileSelection(e.target.files[0]);
                  }}
                  className="hidden"
                />
              </div>
            )}
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
            <div className="text-xs text-[#64748B] flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>
                Категория:{' '}
                <strong className={selectedCategoryInfo ? 'text-[#111827]' : 'text-amber-600'}>
                  {selectedCategoryInfo ? selectedCategoryInfo.shortName : 'Не выбрана'}
                </strong>
              </span>
              <span>•</span>
              <span>
                Тариф:{' '}
                <strong className={selectedTariffInfo ? 'text-[#111827]' : 'text-amber-600'}>
                  {selectedTariffInfo ? selectedTariffInfo.name : 'Не выбран'}
                </strong>
              </span>
              <span>•</span>
              <span>
                Объем:{' '}
                <strong className={codesFile && itemsCount > 0 ? 'text-[#0082FB]' : 'text-amber-600'}>
                  {codesFile && itemsCount > 0 ? `${itemsCount.toLocaleString()} шт.` : 'Требуется файл кодов'}
                </strong>
              </span>
              {calculated && itemsCount > 0 && (
                <>
                  <span>•</span>
                  <span>
                    Цена: <strong className="text-[#111827]">{calculated.unitPrice} ₸ / шт.</strong>
                  </span>
                </>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold text-[#64748B] uppercase">
                Предварительная стоимость:
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">
                {calculated && itemsCount > 0 ? `${calculated.totalPrice.toLocaleString()} ₸` : '— ₸'}
              </span>
            </div>

            <p className="text-[11px] text-[#64748B]">
              * Стоимость рассчитывается автоматически на основании чистых кодов из загруженного файла.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || loading || !category || !tariffType || !warehouseAddress.trim() || !codesFile || itemsCount < 1}
            className="bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-sm py-4 px-8 rounded-xl transition-all active:scale-95 shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed self-start md:self-auto"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Отправка заказа...</span>
              </>
            ) : !category ? (
              <span>Выберите категорию (Шаг 1)</span>
            ) : !tariffType ? (
              <span>Выберите тариф (Шаг 2)</span>
            ) : !warehouseAddress.trim() ? (
              <span>Укажите адрес склада (Шаг 4)</span>
            ) : !codesFile ? (
              <span>Загрузите файл с кодами (Шаг 5)</span>
            ) : itemsCount < 1 ? (
              <span>В файле нет кодов для заказа</span>
            ) : (
              <>
                <span>Подтвердить и отправить заказ ({itemsCount.toLocaleString()} шт.)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </form>

      <TariffHelpModal
        isOpen={showTariffHelpModal}
        onClose={() => setShowTariffHelpModal(false)}
        onSelectTariff={(t) => setTariffType(t)}
        currentTariff={tariffType}
      />
    </div>
  );
};
