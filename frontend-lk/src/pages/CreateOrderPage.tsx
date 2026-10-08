import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOrders } from '../hooks/useOrders';
import { useAuth } from '../hooks/useAuth';
import { OrderCategory, TariffType, UserStickerTemplate } from '../types';
import { apiClient } from '../api/client';
import { CATEGORIES_LIST, CATEGORY_MAP, getCategoryLabel } from '../data/categories';
import { PageHeader } from '@shared';
import { StickerCanvasPreview } from '../components/common/StickerCanvasPreview';
import { TariffHelpModal } from '../components/modals/TariffHelpModal';
import { ConnectMarkirovkaModal } from '../components/modals/ConnectMarkirovkaModal';
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
  Clock,
  Boxes,
} from 'lucide-react';

import { CategoryStickerSpecs, getCategoryStickerSpecs } from '../data/categoryStickerSpecs';

export const CreateOrderPage: React.FC = () => {
  const { createOrder } = useOrders();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Initial values: null by default as requested (user must select manually)
  const [category, setCategory] = useState<OrderCategory | null>(null);
  const categorySpecs = useMemo(() => getCategoryStickerSpecs(category), [category]);
  const [tariffType, setTariffType] = useState<TariffType | null>(null);
  const [showTariffHelpModal, setShowTariffHelpModal] = useState<boolean>(false);
  const [itemsCount, setItemsCount] = useState<number>(0);
  const [ssccNeeded, setSsccNeeded] = useState<boolean>(false);
  const [extraServices, setExtraServices] = useState<string[]>([]);
  const [warehouseAddress, setWarehouseAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Warehouse on-site stickering condition states (null by default - user chooses manually)
  const [warehouseStorageType, setWarehouseStorageType] = useState<'PALLETS' | 'BOXES' | 'LOOSE' | null>(null);
  const [warehouseClimate, setWarehouseClimate] = useState<'WARM_HEATED' | 'COLD_WINTER' | 'RAMP_CUSTOMS' | null>(null);
  const [warehouseEquipment, setWarehouseEquipment] = useState<'HAS_EQUIPMENT' | 'MANUAL' | null>(null);

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

  // Turnkey Markirovka Emission states
  const [markirovkaMode, setMarkirovkaMode] = useState<'FILE' | 'EMISSION'>('FILE');
  const [markirovkaAccounts, setMarkirovkaAccounts] = useState<any[]>([]);
  const [markirovkaAccountId, setMarkirovkaAccountId] = useState<string>('');
  const [markirovkaGtin, setMarkirovkaGtin] = useState<string>('');
  const [manualCount, setManualCount] = useState<number>(500);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);
  const [emissionReleaseType, setEmissionReleaseType] = useState<'PRODUCTION' | 'IMPORT' | 'REMAINDER'>('PRODUCTION');
  const [emissionPurpose, setEmissionPurpose] = useState<'FOR_SALE' | 'CROSS_BORDER'>('FOR_SALE');

  // Load available markirovka accounts on mount
  useEffect(() => {
    const fetchMarkirovkaAccounts = async () => {
      try {
        const res = await apiClient.get('/markirovka/accounts');
        const list = res.data.accounts || [];
        setMarkirovkaAccounts(list);
        if (list.length > 0) {
          setMarkirovkaAccountId(list[0].id);
        }
      } catch (err) {
        console.warn('Could not load markirovka accounts:', err);
      }
    };
    fetchMarkirovkaAccounts();
  }, []);

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
  const [savedWarehouses, setSavedWarehouses] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('tanbox_warehouses');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // ignore
    }
    return [];
  });

  // State to optionally save entered address to profile
  const [saveAddressToProfile, setSaveAddressToProfile] = useState<boolean>(true);
  const [addressSavedSuccess, setAddressSavedSuccess] = useState<boolean>(false);

  // Helper to save current warehouse address to user profile
  const handleSaveAddressToProfile = (customAddress?: string) => {
    const raw = (customAddress || warehouseAddress).trim();
    if (!raw) return;

    try {
      const currentList: any[] = JSON.parse(localStorage.getItem('tanbox_warehouses') || '[]');

      // Check if already in list
      const alreadyExists = currentList.some((w: any) => {
        const formatted = `${w.city}, ${w.address} (${w.name})`;
        return raw === formatted || raw === `${w.city}, ${w.address}` || (w.address && raw.toLowerCase().includes(w.address.toLowerCase()));
      });

      if (!alreadyExists) {
        let city = 'г. Алматы';
        let streetAddress = raw;

        const cityMatch = raw.match(/^(г\.\s*[^,]+),\s*(.+)$/i);
        if (cityMatch) {
          city = cityMatch[1].trim();
          streetAddress = cityMatch[2].trim();
        }

        const newWh = {
          id: `wh_${Date.now()}`,
          name: `Склад №${currentList.length + 1}`,
          city,
          address: streetAddress,
          warehouseContact: user?.companyName || 'Контактное лицо',
          warehousePhone: user?.phone || '',
          selectedDays: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'],
          startTime: '09:00',
          endTime: '18:00',
          isPrimary: currentList.length === 0,
        };

        const updated = [...currentList, newWh];
        localStorage.setItem('tanbox_warehouses', JSON.stringify(updated));
        setSavedWarehouses(updated);
        setAddressSavedSuccess(true);
        setTimeout(() => setAddressSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.warn('Failed to save warehouse address:', err);
    }
  };

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
    if (!tariffType || !itemsCount || itemsCount < 1) return;

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

    if (markirovkaMode === 'FILE') {
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
    } else {
      if (!markirovkaAccountId) {
        setErrorMsg('Пожалуйста, выберите аккаунт маркировки (Шаг 5).');
        document.getElementById('step-codes-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      if (!markirovkaGtin.trim()) {
        setErrorMsg('Пожалуйста, укажите GTIN товара (14 цифр) для эмиссии кодов (Шаг 5).');
        document.getElementById('step-codes-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      if (itemsCount < 1) {
        setErrorMsg('Пожалуйста, укажите количество товара для заказа (Шаг 5).');
        document.getElementById('step-codes-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    executeSubmit(itemsCount);
  };

  // Final submission execution
  const executeSubmit = async (finalCount: number) => {
    if (
      !category ||
      !tariffType ||
      !warehouseAddress.trim() ||
      (markirovkaMode === 'FILE' && !codesFile) ||
      (markirovkaMode === 'EMISSION' && (!markirovkaAccountId || !markirovkaGtin.trim())) ||
      finalCount < 1
    ) {
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

    const signsList = [
      labelHasBarcode && 'Штрихкод EAN-13 (из CSV)',
      labelHasEac && 'Знак EAC',
    ].filter(Boolean);

    const labelDesignPayload = (!usedTemplate && isStickerDesign)
      ? [
          '=== ТРЕБОВАНИЯ К МАКЕТУ СТИКЕРА (РК) ===',
          `Категория: ${getCategoryLabel(category || 'OTHER')}`,
          `Регламент: ${categorySpecs.lawTitle}`,
          `Размер этикетки: ${labelWidth}×${labelHeight} мм`,
          labelProductName ? `${categorySpecs.productNameLabel}: ${labelProductName}` : '',
          labelBrand ? `${categorySpecs.brandLabel}: ${labelBrand}` : '',
          labelArticle ? `${categorySpecs.articleLabel}: ${labelArticle}` : '',
          labelComposition ? `${categorySpecs.compositionLabel}: ${labelComposition}` : '',
          signsList.length > 0 ? `Знаки на макете: ${signsList.join(', ')}` : '',
          labelExtraDetails ? `Пожелания: ${labelExtraDetails}` : '',
          '========================================',
        ]
          .filter(Boolean)
          .join('\n')
      : '';

    const storageLabels: Record<string, string> = {
      PALLETS: 'На паллетах в коробах',
      BOXES: 'В коробках на стеллажах / полу',
      LOOSE: 'Россыпью / в мешках',
    };
    const climateLabels: Record<string, string> = {
      WARM_HEATED: 'Тёплый склад (Класс А/В)',
      COLD_WINTER: 'Холодный ангар / зима',
      RAMP_CUSTOMS: 'Открытый пандус / СВХ',
    };
    const equipmentLabels: Record<string, string> = {
      HAS_EQUIPMENT: 'Есть рохля / погрузчик',
      MANUAL: 'Техники нет (вручную)',
    };

    const hasAnyWarehouseOption = Boolean(warehouseStorageType || warehouseClimate || warehouseEquipment);
    const warehouseConditionsPayload = ((tariffType === 'STANDARD' || tariffType === 'PRO' || extraServices.includes('ON_SITE_STICKERING')) && hasAnyWarehouseOption)
      ? [
          '=== СКЛАДСКИЕ УСЛОВИЯ (ВЫЕЗДНАЯ ОКЛЕЙКА) ===',
          warehouseStorageType ? `Размещение: ${storageLabels[warehouseStorageType]}` : '',
          warehouseClimate ? `Температурный режим: ${climateLabels[warehouseClimate]}` : '',
          warehouseEquipment ? `Складская техника: ${equipmentLabels[warehouseEquipment]}` : '',
          '==========================================',
        ].filter(Boolean).join('\n')
      : '';

    const fullNotes = [
      warehouseAddress ? `Адрес склада в РК: ${warehouseAddress}` : '',
      warehouseConditionsPayload,
      labelDesignPayload,
      usedTemplate ? `Макет этикетки: Шаблон «${usedTemplate.name}» (${usedTemplate.widthMm}×${usedTemplate.heightMm} мм)` : '',
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
        stickerLayout: usedTemplate
          ? {
              widthMm: usedTemplate.widthMm,
              heightMm: usedTemplate.heightMm,
              elements: usedTemplate.elements,
            }
          : undefined,
        stickerWidth: usedTemplate ? usedTemplate.widthMm : parseInt(String(labelWidth), 10) || 58,
        stickerHeight: usedTemplate ? usedTemplate.heightMm : parseInt(String(labelHeight), 10) || 40,
        markirovkaMode,
        markirovkaAccountId: markirovkaMode === 'EMISSION' ? markirovkaAccountId : undefined,
        markirovkaGtin: markirovkaMode === 'EMISSION' ? markirovkaGtin.trim() : undefined,
        markirovkaReleaseType: markirovkaMode === 'EMISSION' ? emissionReleaseType : undefined,
        markirovkaPurpose: markirovkaMode === 'EMISSION' ? emissionPurpose : undefined,
      } as any);

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

      // Save warehouse address to profile if user kept option checked
      if (saveAddressToProfile && warehouseAddress.trim()) {
        handleSaveAddressToProfile(warehouseAddress);
      }

      const isOnSite = Boolean(hasAnyWarehouseOption || tariffType === 'STANDARD' || tariffType === 'PRO' || extraServices.includes('ON_SITE_STICKERING'));
      navigate(newOrderId ? `/orders/${newOrderId}` : '/orders', {
        state: {
          fromCreate: true,
          isOnSite,
        },
      });
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
            <div className="w-full bg-[#F8FAFC] border border-gray-200/90 rounded-2xl p-5 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-200/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0082FB] flex items-center justify-center shrink-0">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#111827] uppercase tracking-wider block">
                      Макет этикетки (стикера)
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      Печать по готовому шаблону или разработка нового макета
                    </span>
                  </div>
                </div>
              </div>

              {/* 3 Clean Native Radio Options */}
              <div className="space-y-2">
                {/* Option 1: Saved Template */}
                <label
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    templateChoice === 'SAVED'
                      ? 'border-[#0082FB] bg-blue-50/40 shadow-2xs'
                      : 'border-gray-200/90 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="radio"
                      name="templateChoice"
                      checked={templateChoice === 'SAVED'}
                      onChange={() => handleTemplateChoiceChange('SAVED')}
                      className="w-4 h-4 text-[#0082FB] focus:ring-[#0082FB] cursor-pointer shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#111827]">
                          {selectedTemplate ? selectedTemplate.name : 'Использовать готовый макет'}
                        </span>
                        {selectedTemplate && (
                          <span className="text-[10px] font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                            {selectedTemplate.widthMm} × {selectedTemplate.heightMm} мм
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                          Утверждён
                        </span>
                      </div>
                      <span className="text-[11px] text-[#64748B] block mt-0.5">
                        Сохранённый шаблон из вашей библиотеки
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-extrabold text-emerald-600 shrink-0 ml-3">
                    0 ₸
                  </span>
                </label>

                {/* If more than 1 saved template, allow choosing which one */}
                {templateChoice === 'SAVED' && savedTemplates.length > 1 && (
                  <div className="pl-7 pr-2 py-1">
                    <select
                      value={selectedTemplateId || ''}
                      onChange={(e) => handleSelectTemplate(e.target.value)}
                      className="w-full text-xs font-medium bg-white border border-gray-200 rounded-lg px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                    >
                      {savedTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.widthMm} × {t.heightMm} мм)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Option 2: New Design */}
                <label
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    templateChoice === 'NEW'
                      ? 'border-[#0082FB] bg-blue-50/40 shadow-2xs'
                      : 'border-gray-200/90 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="templateChoice"
                      checked={templateChoice === 'NEW'}
                      onChange={() => handleTemplateChoiceChange('NEW')}
                      className="w-4 h-4 text-[#0082FB] focus:ring-[#0082FB] cursor-pointer shrink-0"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#111827] block">
                        Заказать разработку нового макета
                      </span>
                      <span className="text-[11px] text-[#64748B] block mt-0.5">
                        Дизайнер подготовит макет под требования маркетплейса
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-[#0082FB] shrink-0 ml-3">
                    +5 000 ₸
                  </span>
                </label>

                {/* Option 3: None */}
                <label
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    templateChoice === 'NONE'
                      ? 'border-[#0082FB] bg-blue-50/40 shadow-2xs'
                      : 'border-gray-200/90 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="templateChoice"
                      checked={templateChoice === 'NONE'}
                      onChange={() => handleTemplateChoiceChange('NONE')}
                      className="w-4 h-4 text-[#0082FB] focus:ring-[#0082FB] cursor-pointer shrink-0"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#111827] block">
                        Без макета стикера
                      </span>
                      <span className="text-[11px] text-[#64748B] block mt-0.5">
                        Печать только кодов Data Matrix без товарной этикетки
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-400 shrink-0 ml-3">
                    0 ₸
                  </span>
                </label>
              </div>

                {/* Tab 2: NEW DESIGN FORM */}
                {templateChoice === 'NEW' && (
                  <div className="pt-3 border-t border-gray-200/80 space-y-3.5 animate-in fade-in duration-150">
                    {/* Size selection */}
                    <div>
                      <label className="text-[11px] font-bold text-[#475569] block mb-1.5">
                        Размер стикера (мм)
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          { w: '58', h: '40', label: '58 × 40' },
                          { w: '60', h: '60', label: '60 × 60' },
                          { w: '40', h: '30', label: '40 × 30' },
                          { w: '75', h: '120', label: '75 × 120' },
                        ].map((preset) => {
                          const isPreset = String(labelWidth) === preset.w && String(labelHeight) === preset.h;
                          return (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => {
                                setLabelWidth(preset.w);
                                setLabelHeight(preset.h);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer border ${
                                isPreset
                                  ? 'border-[#0082FB] bg-blue-50 text-[#0082FB] font-bold shadow-2xs'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              {preset.label} мм
                            </button>
                          );
                        })}

                        <div className="flex items-center gap-1.5 text-xs text-gray-500 pl-1">
                          <span className="text-[11px] text-[#64748B] font-medium whitespace-nowrap">или вручную:</span>
                          <input
                            type="number"
                            min="10"
                            max="300"
                            value={labelWidth}
                            onChange={(e) => setLabelWidth(e.target.value)}
                            placeholder="Ш"
                            className="w-12 text-center py-1 px-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#0082FB]"
                          />
                          <span>×</span>
                          <input
                            type="number"
                            min="10"
                            max="300"
                            value={labelHeight}
                            onChange={(e) => setLabelHeight(e.target.value)}
                            placeholder="В"
                            className="w-12 text-center py-1 px-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#0082FB]"
                          />
                          <span className="text-gray-400">мм</span>
                        </div>
                      </div>
                    </div>


                    {/* Product Name & Brand */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-[#475569] block mb-1">
                          {categorySpecs.productNameLabel}
                        </label>
                        <input
                          type="text"
                          value={labelProductName}
                          onChange={(e) => setLabelProductName(e.target.value)}
                          placeholder={categorySpecs.productNamePlaceholder}
                          className="w-full text-xs bg-white border border-gray-200/90 rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-[#475569] block mb-1">
                          {categorySpecs.brandLabel}
                        </label>
                        <input
                          type="text"
                          value={labelBrand}
                          onChange={(e) => setLabelBrand(e.target.value)}
                          placeholder={categorySpecs.brandPlaceholder}
                          className="w-full text-xs bg-white border border-gray-200/90 rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                        />
                      </div>
                    </div>

                    {/* Article & Composition */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-[#475569] block mb-1">
                          {categorySpecs.articleLabel}
                        </label>
                        <input
                          type="text"
                          value={labelArticle}
                          onChange={(e) => setLabelArticle(e.target.value)}
                          placeholder={categorySpecs.articlePlaceholder}
                          className="w-full text-xs bg-white border border-gray-200/90 rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-[#475569] block mb-1">
                          {categorySpecs.compositionLabel}
                        </label>
                        <input
                          type="text"
                          value={labelComposition}
                          onChange={(e) => setLabelComposition(e.target.value)}
                          placeholder={categorySpecs.compositionPlaceholder}
                          className="w-full text-xs bg-white border border-gray-200/90 rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                        />
                      </div>
                    </div>

                    {/* Extra details */}
                    <div>
                      <label className="text-[11px] font-bold text-[#475569] block mb-1">
                        Дополнительный текст и пожелания к макету
                      </label>
                      <textarea
                        rows={2}
                        value={labelExtraDetails}
                        onChange={(e) => setLabelExtraDetails(e.target.value)}
                        placeholder={categorySpecs.extraDetailsPlaceholder}
                        className="w-full text-xs bg-white border border-gray-200/90 rounded-xl p-2.5 text-[#111827] focus:outline-none focus:border-[#0082FB] resize-none"
                      />
                    </div>

                    {/* Signs & Barcode */}
                    <div className="pt-1">
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#111827]">
                          <input
                            type="checkbox"
                            checked={labelHasBarcode}
                            onChange={(e) => setLabelHasBarcode(e.target.checked)}
                            className="w-4 h-4 rounded text-[#0082FB] focus:ring-[#0082FB]"
                          />
                          <span>Штрихкод EAN-13 (из CSV)</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#111827]">
                          <input
                            type="checkbox"
                            checked={labelHasEac}
                            onChange={(e) => setLabelHasEac(e.target.checked)}
                            className="w-4 h-4 rounded text-[#0082FB] focus:ring-[#0082FB]"
                          />
                          <span>Знак обращения EAC</span>
                        </label>
                      </div>
                    </div>
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
                  <div className="pt-3 border-t border-gray-200/80 space-y-3.5 animate-in fade-in duration-150">
                    {/* Size selection */}
                    <div>
                      <label className="text-[11px] font-bold text-[#475569] block mb-1.5">
                        Размер стикера (мм)
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          { w: '58', h: '40', label: '58 × 40' },
                          { w: '60', h: '60', label: '60 × 60' },
                          { w: '40', h: '30', label: '40 × 30' },
                          { w: '75', h: '120', label: '75 × 120' },
                        ].map((preset) => {
                          const isPreset = String(labelWidth) === preset.w && String(labelHeight) === preset.h;
                          return (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => {
                                setLabelWidth(preset.w);
                                setLabelHeight(preset.h);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer border ${
                                isPreset
                                  ? 'border-[#0082FB] bg-blue-50 text-[#0082FB] font-bold shadow-2xs'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              {preset.label} мм
                            </button>
                          );
                        })}

                        <div className="flex items-center gap-1.5 text-xs text-gray-500 pl-1">
                          <span className="text-[11px] text-[#64748B] font-medium whitespace-nowrap">или вручную:</span>
                          <input
                            type="number"
                            min="10"
                            max="300"
                            value={labelWidth}
                            onChange={(e) => setLabelWidth(e.target.value)}
                            placeholder="Ш"
                            className="w-12 text-center py-1 px-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#0082FB]"
                          />
                          <span>×</span>
                          <input
                            type="number"
                            min="10"
                            max="300"
                            value={labelHeight}
                            onChange={(e) => setLabelHeight(e.target.value)}
                            placeholder="В"
                            className="w-12 text-center py-1 px-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#0082FB]"
                          />
                          <span className="text-gray-400">мм</span>
                        </div>
                      </div>
                    </div>


                    {/* Product Name & Brand */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-[#475569] block mb-1">
                          {categorySpecs.productNameLabel}
                        </label>
                        <input
                          type="text"
                          value={labelProductName}
                          onChange={(e) => setLabelProductName(e.target.value)}
                          placeholder={categorySpecs.productNamePlaceholder}
                          className="w-full text-xs bg-white border border-gray-200/90 rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-[#475569] block mb-1">
                          {categorySpecs.brandLabel}
                        </label>
                        <input
                          type="text"
                          value={labelBrand}
                          onChange={(e) => setLabelBrand(e.target.value)}
                          placeholder={categorySpecs.brandPlaceholder}
                          className="w-full text-xs bg-white border border-gray-200/90 rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                        />
                      </div>
                    </div>

                    {/* Article & Composition */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-[#475569] block mb-1">
                          {categorySpecs.articleLabel}
                        </label>
                        <input
                          type="text"
                          value={labelArticle}
                          onChange={(e) => setLabelArticle(e.target.value)}
                          placeholder={categorySpecs.articlePlaceholder}
                          className="w-full text-xs bg-white border border-gray-200/90 rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-[#475569] block mb-1">
                          {categorySpecs.compositionLabel}
                        </label>
                        <input
                          type="text"
                          value={labelComposition}
                          onChange={(e) => setLabelComposition(e.target.value)}
                          placeholder={categorySpecs.compositionPlaceholder}
                          className="w-full text-xs bg-white border border-gray-200/90 rounded-xl px-3 py-2 text-[#111827] focus:outline-none focus:border-[#0082FB]"
                        />
                      </div>
                    </div>

                    {/* Extra details */}
                    <div>
                      <label className="text-[11px] font-bold text-[#475569] block mb-1">
                        Дополнительный текст и пожелания к макету
                      </label>
                      <textarea
                        rows={2}
                        value={labelExtraDetails}
                        onChange={(e) => setLabelExtraDetails(e.target.value)}
                        placeholder={categorySpecs.extraDetailsPlaceholder}
                        className="w-full text-xs bg-white border border-gray-200/90 rounded-xl p-2.5 text-[#111827] focus:outline-none focus:border-[#0082FB] resize-none"
                      />
                    </div>

                    {/* Signs & Barcode */}
                    <div className="pt-1">
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#111827]">
                          <input
                            type="checkbox"
                            checked={labelHasBarcode}
                            onChange={(e) => setLabelHasBarcode(e.target.checked)}
                            className="w-4 h-4 rounded text-[#0082FB] focus:ring-[#0082FB]"
                          />
                          <span>Штрихкод EAN-13 (из CSV)</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#111827]">
                          <input
                            type="checkbox"
                            checked={labelHasEac}
                            onChange={(e) => setLabelHasEac(e.target.checked)}
                            className="w-4 h-4 rounded text-[#0082FB] focus:ring-[#0082FB]"
                          />
                          <span>Знак обращения EAC</span>
                        </label>
                      </div>
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

              {/* Option to save new address to profile */}
              {warehouseAddress.trim().length > 3 && !savedWarehouses.some((w: any) => `${w.city}, ${w.address} (${w.name})` === warehouseAddress || `${w.city}, ${w.address}` === warehouseAddress) && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 px-0.5">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={saveAddressToProfile}
                      onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-[#0082FB] focus:ring-[#0082FB] cursor-pointer"
                    />
                    <span className="text-[11px] font-semibold text-gray-600">
                      Сохранить этот адрес в профиль для будущих заказов
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleSaveAddressToProfile()}
                    className="text-[11px] font-bold text-[#0082FB] hover:text-[#0070DA] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {addressSavedSuccess ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Сохранено в профиль
                      </span>
                    ) : (
                      <span>+ Сохранить сейчас</span>
                    )}
                  </button>
                </div>
              )}

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
                placeholder="Специфика упаковки, контакты кладовщика..."
                className="w-full bg-[#F4F6F9] border border-gray-200/80 rounded-xl px-4 py-3 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0082FB]"
              />
            </div>
          </div>

          {/* Warehouse on-site stickering specifications (active for STANDARD / PRO or on-site services) */}
          {(tariffType === 'STANDARD' || tariffType === 'PRO' || extraServices.includes('ON_SITE_STICKERING')) && (
            <div className="pt-4 mt-2 border-t border-gray-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-2">
                  <Boxes className="w-3.5 h-3.5 text-[#0082FB]" />
                  Условия на складе для выездной бригады
                </span>
                <span className="text-[11px] text-[#64748B]">
                  Помогает точно рассчитать время и расходные материалы
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* 1. Storage placement */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700 block">
                    1. Размещение товара:
                  </label>
                  <div className="space-y-1.5">
                    {[
                      { id: 'PALLETS', label: 'На паллетах в коробах', desc: 'Сформированные паллеты' },
                      { id: 'BOXES', label: 'В коробках на стеллажах / полу', desc: 'Индивидуальные короба' },
                      { id: 'LOOSE', label: 'Россыпью / в мешках', desc: 'Требуется переборка товара' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setWarehouseStorageType((prev) => (prev === item.id ? null : (item.id as any)))}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          warehouseStorageType === item.id
                            ? 'border-[#0082FB] bg-blue-50/70 text-[#0082FB] ring-1 ring-[#0082FB]/30'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-bold">{item.label}</div>
                        <div className="text-[10px] text-gray-500 font-normal mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Temperature & Climate */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700 block">
                    2. Температурный режим:
                  </label>
                  <div className="space-y-1.5">
                    {[
                      { id: 'WARM_HEATED', label: 'Тёплый склад (+15...+22°C)', desc: 'Отапливаемый класс А/В' },
                      { id: 'COLD_WINTER', label: 'Холодный ангар / зима', desc: 'Без отопления, утепление бригады' },
                      { id: 'RAMP_CUSTOMS', label: 'Пандус / зона СВХ', desc: 'Разгрузочная рампа, таможня' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setWarehouseClimate((prev) => (prev === item.id ? null : (item.id as any)))}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          warehouseClimate === item.id
                            ? 'border-[#0082FB] bg-blue-50/70 text-[#0082FB] ring-1 ring-[#0082FB]/30'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-bold">{item.label}</div>
                        <div className="text-[10px] text-gray-500 font-normal mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Warehouse Equipment */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700 block">
                    3. Складская техника:
                  </label>
                  <div className="space-y-1.5">
                    {[
                      { id: 'HAS_EQUIPMENT', label: 'Есть рохля / погрузчик', desc: 'Предоставим на складе' },
                      { id: 'MANUAL', label: 'Техники нет (вручную)', desc: 'Ручное перемещение коробов' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setWarehouseEquipment((prev) => (prev === item.id ? null : (item.id as any)))}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          warehouseEquipment === item.id
                            ? 'border-[#0082FB] bg-blue-50/70 text-[#0082FB] ring-1 ring-[#0082FB]/30'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-bold">{item.label}</div>
                        <div className="text-[10px] text-gray-500 font-normal mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2-Hour SLA Reassurance notification */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/90 rounded-2xl flex items-start gap-3">
                <Clock className="w-4 h-4 text-[#0082FB] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-extrabold text-[#111827] block">
                    Расчет сметы и сроков выезда — в течение 2 часов
                  </span>
                  <span className="text-[#475569] mt-0.5 block leading-relaxed">
                    После оформления заявки менеджер свяжется с вами для согласования удобной даты выезда и финальной сметы.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 5: Codes / Emission Selection */}
        <div id="step-codes-section" className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0082FB] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#111827]">
                  Шаг 5: Коды маркировки и эмиссия
                </h3>
                <p className="text-xs text-[#64748B]">
                  Выберите источник кодов: загрузите свой файл или закажите выпуск кодов через Tanbox
                </p>
              </div>
            </div>

            {markirovkaMode === 'FILE' && codesFile && (
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

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setMarkirovkaMode('FILE');
                setItemsCount(fileCodesCount || 0);
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                markirovkaMode === 'FILE'
                  ? 'border-[#0082FB] bg-blue-50/50 shadow-sm ring-1 ring-[#0082FB]'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  markirovkaMode === 'FILE' ? 'bg-[#0082FB] text-white shadow-sm' : 'bg-gray-100 text-gray-500'
                }`}
              >
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-[#111827]">У меня есть файл кодов (CSV)</div>
                <div className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                  Загрузка уже выгруженных кодов DataMatrix из вашего кабинета ИС МПТ
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setMarkirovkaMode('EMISSION');
                setItemsCount(manualCount || 500);
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                markirovkaMode === 'EMISSION'
                  ? 'border-[#0082FB] bg-blue-50/50 shadow-sm ring-1 ring-[#0082FB]'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  markirovkaMode === 'EMISSION' ? 'bg-[#0082FB] text-white shadow-sm' : 'bg-gray-100 text-gray-500'
                }`}
              >
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-[#111827] flex items-center gap-1.5">
                  Заказать эмиссию через Tanbox
                  <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-[#0082FB] text-white">
                    Авто
                  </span>
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                  Эмиссия кодов под ключ в ИС МПТ Казахстана без ручной выгрузки файлов
                </div>
              </div>
            </button>
          </div>

          {/* Mode 1: File Upload */}
          {markirovkaMode === 'FILE' && (

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
          )}

          {/* Mode 2: Turnkey Automatic Emission */}
          {markirovkaMode === 'EMISSION' && (
            <div className="space-y-4 p-5 bg-gradient-to-b from-blue-50/40 to-white rounded-2xl border border-blue-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Quantity */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                    Количество кодов (тираж партии) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="150000"
                    value={manualCount}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                      setManualCount(val);
                      setItemsCount(val);
                    }}
                    placeholder="500"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-900 bg-white focus:outline-none focus:border-[#0082FB]"
                  />
                  <div className="flex items-center gap-1.5 mt-2">
                    {[100, 500, 1000, 5000].map((step) => (
                      <button
                        key={step}
                        type="button"
                        onClick={() => {
                          setManualCount(step);
                          setItemsCount(step);
                        }}
                        className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 hover:border-[#0082FB] hover:text-[#0082FB] cursor-pointer"
                      >
                        +{step}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Account Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase">
                      Аккаунт Markirovka.kz *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsConnectModalOpen(true)}
                      className="text-xs font-bold text-[#0082FB] hover:text-[#0070DA] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      + Подключить аккаунт
                    </button>
                  </div>
                  <select
                    value={markirovkaAccountId}
                    onChange={(e) => setMarkirovkaAccountId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-900 bg-white focus:outline-none focus:border-[#0082FB]"
                  >
                    {markirovkaAccounts.length === 0 ? (
                      <option value="">Нет сохраненных аккаунтов</option>
                    ) : (
                      markirovkaAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.environment} — {acc.login})
                        </option>
                      ))
                    )}
                  </select>
                  {markirovkaAccounts.length === 0 ? (
                    <div className="mt-1.5 flex items-center justify-between p-2 bg-amber-50/80 rounded-lg border border-amber-200/80 text-[11px] text-amber-900">
                      <span>У вас еще нет привязанных аккаунтов ИС МПТ.</span>
                      <button
                        type="button"
                        onClick={() => setIsConnectModalOpen(true)}
                        className="font-bold text-[#0082FB] hover:underline shrink-0 ml-2"
                      >
                        Подключить сейчас →
                      </button>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-500 mt-1">
                      Эмиссия будет выполнена от имени выбранного личного кабинета
                    </p>
                  )}
                </div>
              </div>

              {/* GTIN input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  GTIN товара (штрихкод упаковки, 14 цифр) *
                </label>
                <input
                  type="text"
                  maxLength={14}
                  value={markirovkaGtin}
                  onChange={(e) => setMarkirovkaGtin(e.target.value.replace(/\D/g, ''))}
                  placeholder="05055107433614"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold font-mono text-gray-900 bg-white focus:outline-none focus:border-[#0082FB]"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  14-значный номер GTIN зарегистрированного товара в Национальном каталоге товаров
                </p>
              </div>

              {/* Release Type & Purpose */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                    Способ выпуска в оборот *
                  </label>
                  <select
                    value={emissionReleaseType}
                    onChange={(e) => setEmissionReleaseType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-900 bg-white focus:outline-none focus:border-[#0082FB]"
                  >
                    <option value="PRODUCTION">Производство в РК (внутреннее)</option>
                    <option value="IMPORT">Импорт в РК (ввоз товара)</option>
                    <option value="REMAINDER">Маркировка остатков / в обороте</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                    Цель маркировки *
                  </label>
                  <select
                    value={emissionPurpose}
                    onChange={(e) => setEmissionPurpose(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-900 bg-white focus:outline-none focus:border-[#0082FB]"
                  >
                    <option value="FOR_SALE">Для реализации в РК</option>
                    <option value="CROSS_BORDER">Трансграничная торговля / ЕАЭС</option>
                  </select>
                </div>
              </div>

              {/* Auto context: Category & Warehouse location */}
              <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500 font-medium">Товарная группа ИС МПТ:</span>
                  <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {category ? getCategoryLabel(category) : 'Определяется выбором в Шаге 1'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500 font-medium">Место осуществления:</span>
                  <span className="font-bold text-gray-800 truncate max-w-xs" title={warehouseAddress || 'Склад из Шага 4'}>
                    {warehouseAddress ? warehouseAddress : 'Склад из Шага 4'}
                  </span>
                </div>
              </div>

              {/* SLA Info */}
              <div className="p-3.5 bg-blue-100/60 rounded-xl border border-blue-200/70 flex items-start gap-2.5 text-xs text-blue-950">
                <CheckCircle2 className="w-4 h-4 text-[#0082FB] shrink-0 mt-0.5" />
                <span>
                  Tanbox автоматически отправит заказ в ИС МПТ, выпустит коды DataMatrix и сформирует готовые термоэтикетки для оклейки партии на складе.
                </span>
              </div>
            </div>
          )}
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
                <strong className={itemsCount > 0 ? 'text-[#0082FB]' : 'text-amber-600'}>
                  {itemsCount > 0
                    ? `${itemsCount.toLocaleString()} шт.`
                    : markirovkaMode === 'EMISSION'
                    ? 'Укажите количество'
                    : 'Требуется файл кодов'}
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
              * Стоимость рассчитывается автоматически на основании тиража кодов маркировки.
            </p>
          </div>

          <button
            type="submit"
            disabled={
              submitting ||
              loading ||
              !category ||
              !tariffType ||
              !warehouseAddress.trim() ||
              (markirovkaMode === 'FILE' && !codesFile) ||
              (markirovkaMode === 'EMISSION' && (!markirovkaAccountId || !markirovkaGtin.trim())) ||
              itemsCount < 1
            }
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
            ) : markirovkaMode === 'FILE' && !codesFile ? (
              <span>Загрузите файл с кодами (Шаг 5)</span>
            ) : markirovkaMode === 'EMISSION' && !markirovkaAccountId ? (
              <span>Выберите аккаунт маркировки (Шаг 5)</span>
            ) : markirovkaMode === 'EMISSION' && !markirovkaGtin.trim() ? (
              <span>Укажите GTIN товара (Шаг 5)</span>
            ) : itemsCount < 1 ? (
              <span>Укажите тираж заказа</span>
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

      <ConnectMarkirovkaModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onSuccess={(newAccount) => {
          setMarkirovkaAccounts((prev) => [newAccount, ...prev]);
          setMarkirovkaAccountId(newAccount.id);
        }}
      />
    </div>
  );
};
