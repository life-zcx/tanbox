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
  Plus,
  Trash2,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';

import { CategoryStickerSpecs, getCategoryStickerSpecs } from '../data/categoryStickerSpecs';

export interface FormPositionItem {
  id: string;
  name: string;
  article: string;
  size: string;
  color: string;
  gtin: string;
  quantity: number;
}

export interface UploadedCsvPosition {
  id: string;
  file: File;
  name: string;
  gtin: string;
  quantity: number;
  rawCodes: string[];
  sampleCode?: string;
  alreadyInDbCount?: number;
  internalDuplicatesCount?: number;
  validNewCodesCount?: number;
  hasCryptoTail?: boolean;
}

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

  // Multi-position state
  const [positionsMode, setPositionsMode] = useState<'SINGLE' | 'MULTI'>('SINGLE');
  const [positions, setPositions] = useState<FormPositionItem[]>([
    { id: '1', name: '', article: '', size: '', color: '', gtin: '', quantity: 0 },
  ]);
  const specFileInputRef = useRef<HTMLInputElement>(null);

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
  const [markirovkaMode, setMarkirovkaMode] = useState<'FILE' | 'EMISSION' | null>(null);
  const [markirovkaAccounts, setMarkirovkaAccounts] = useState<any[]>([]);
  const [markirovkaAccountId, setMarkirovkaAccountId] = useState<string>('');
  const [markirovkaGtin, setMarkirovkaGtin] = useState<string>('');
  const [manualCount, setManualCount] = useState<number>(500);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);
  const [emissionReleaseType, setEmissionReleaseType] = useState<'PRODUCTION' | 'IMPORT' | 'REMAINDER' | ''>('');
  const [emissionPurpose, setEmissionPurpose] = useState<'FOR_SALE' | 'CROSS_BORDER' | ''>('');

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

  // Active tariffs & pricing settings from database (managed in admin panel)
  const [dbTariffs, setDbTariffs] = useState<any[]>([]);
  const [dbPricingSettings, setDbPricingSettings] = useState<any>({
    ssccPrice: 5,
    stickerLayoutPrice: 5000,
    urgentPercent: 20,
    expressDeliveryPrice: 15000,
  });

  useEffect(() => {
    const fetchTariffData = async () => {
      try {
        const res = await apiClient.get('/tariffs');
        if (res.data?.tariffs && Array.isArray(res.data.tariffs)) {
          setDbTariffs(res.data.tariffs);
        }
        if (res.data?.pricingSettings) {
          setDbPricingSettings(res.data.pricingSettings);
        }
      } catch (err) {
        console.warn('Could not load active tariffs from server:', err);
      }
    };
    fetchTariffData();
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

  // Total positions count calculation
  const totalPositionsCount = useMemo(() => {
    return positions.reduce((acc, p) => acc + Math.max(0, Number(p.quantity) || 0), 0);
  }, [positions]);

  // Synchronize itemsCount when multi-positions or emission mode is active
  useEffect(() => {
    if (markirovkaMode === 'EMISSION' || (markirovkaMode === 'FILE' && positionsMode === 'MULTI')) {
      setItemsCount(totalPositionsCount);
    }
  }, [markirovkaMode, positionsMode, totalPositionsCount]);

  const [loadingNktMap, setLoadingNktMap] = useState<Record<string, boolean>>({});

  const handleFetchNkt = async (posId: string, gtinToFetch?: string) => {
    const targetPos = positions.find((p) => p.id === posId);
    const gtin = (gtinToFetch || targetPos?.gtin || '').trim();
    if (!gtin || gtin.length < 8) return;

    setLoadingNktMap((prev) => ({ ...prev, [posId]: true }));
    try {
      const res = await apiClient.get('/markirovka/products/search-by-gtin', {
        params: { gtin, category: category || undefined },
      });
      if (res.data?.success && res.data?.product) {
        const prod = res.data.product;
        setPositions((prev) =>
          prev.map((item) => {
            if (item.id !== posId) return item;
            return {
              ...item,
              name: prod.name || item.name,
              article: prod.article || item.article,
              size: prod.size || item.size,
              color: prod.color || item.color,
            };
          })
        );
        // Also auto-update sticker preview fields if this is first position
        if (posId === positions[0]?.id) {
          if (prod.name) setLabelProductName(prod.name);
          if (prod.article) setLabelArticle(prod.article);
        }
      }
    } catch (e) {
      console.warn('Could not fetch NKT for GTIN:', gtin, e);
    } finally {
      setLoadingNktMap((prev) => ({ ...prev, [posId]: false }));
    }
  };

  const handlePositionChange = (id: string, field: keyof FormPositionItem, value: any) => {
    setPositions((prev) => {
      const next = prev.map((item) => {
        if (item.id !== id) return item;
        if (field === 'quantity') {
          return { ...item, quantity: Math.max(0, parseInt(value, 10) || 0) };
        }
        if (field === 'gtin') {
          const cleanVal = String(value).replace(/\D/g, '').slice(0, 14);
          if (cleanVal.length === 14) {
            setTimeout(() => handleFetchNkt(id, cleanVal), 150);
          }
          return { ...item, gtin: cleanVal };
        }
        return { ...item, [field]: value };
      });
      if (markirovkaMode === 'EMISSION') {
        const sum = next.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0);
        setItemsCount(sum);
      }
      return next;
    });
  };

  const handleAddPosition = () => {
    setPositions((prev) => {
      const next = [
        ...prev,
        {
          id: String(Date.now() + Math.random()),
          name: '',
          article: '',
          size: '',
          color: '',
          gtin: '',
          quantity: 0,
        },
      ];
      if (markirovkaMode === 'EMISSION') {
        const sum = next.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0);
        setItemsCount(sum);
      }
      return next;
    });
  };

  const handleRemovePosition = (id: string) => {
    if (positions.length <= 1) return;
    setPositions((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (markirovkaMode === 'EMISSION') {
        const sum = next.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0);
        setItemsCount(sum);
      }
      return next;
    });
  };

  const handleParseSpecificationFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        alert('Файл должен содержать строку заголовков и хотя бы одну строку с данными.');
        return;
      }

      const firstLine = lines[0];
      let delimiter = ',';
      if (firstLine.includes(';')) delimiter = ';';
      else if (firstLine.includes('\t')) delimiter = '\t';

      const headers = firstLine.split(delimiter).map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));

      const nameIdx = headers.findIndex((h) => /^(наименование|название|товар|позиция|name|product|title)/i.test(h));
      const artIdx = headers.findIndex((h) => /^(артикул|модель|article|art|model|sku)/i.test(h));
      const sizeIdx = headers.findIndex((h) => /^(размер|size)/i.test(h));
      const colorIdx = headers.findIndex((h) => /^(цвет|color)/i.test(h));
      const gtinIdx = headers.findIndex((h) => /^(gtin|штрихкод|barcode|ean)/i.test(h));
      const qtyIdx = headers.findIndex((h) => /^(количество|кол-во|колво|qty|quantity|count|тираж)/i.test(h));

      const parsedItems: FormPositionItem[] = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(delimiter).map((p) => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length === 0 || parts.every((p) => !p)) continue;

        const name = nameIdx !== -1 && parts[nameIdx] ? parts[nameIdx] : `Товар ${i}`;
        const article = artIdx !== -1 && parts[artIdx] ? parts[artIdx] : '';
        const size = sizeIdx !== -1 && parts[sizeIdx] ? parts[sizeIdx] : '';
        const color = colorIdx !== -1 && parts[colorIdx] ? parts[colorIdx] : '';
        const gtin = gtinIdx !== -1 && parts[gtinIdx] ? parts[gtinIdx].replace(/\D/g, '').slice(0, 14) : '';
        const qty = qtyIdx !== -1 && parts[qtyIdx] ? Math.max(1, parseInt(parts[qtyIdx].replace(/\D/g, ''), 10) || 1) : 100;

        parsedItems.push({
          id: String(Date.now() + i),
          name,
          article,
          size,
          color,
          gtin,
          quantity: qty,
        });
      }

      if (parsedItems.length > 0) {
        setPositions(parsedItems);
        setPositionsMode('MULTI');
        const sum = parsedItems.reduce((acc, p) => acc + p.quantity, 0);
        setItemsCount(sum);
        alert(`Успешно импортировано ${parsedItems.length} позиций на общий тираж ${sum.toLocaleString()} шт.!`);
      } else {
        alert('Не удалось распознать строки с позициями в файле. Проверьте формат.');
      }
    } catch (err: any) {
      alert('Ошибка при чтении файла спецификации: ' + err.message);
    } finally {
      if (e.target) e.target.value = '';
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
  const [uploadedCsvFiles, setUploadedCsvFiles] = useState<UploadedCsvPosition[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const activeFile = uploadedCsvFiles.find((f) => f.id === selectedFileId) || uploadedCsvFiles[0];
  const [fileCodesCount, setFileCodesCount] = useState<number | null>(null);
  const [codeCheckResult, setCodeCheckResult] = useState<{
    totalInFile: number;
    uniqueInFile: number;
    internalDuplicatesCount: number;
    alreadyInDbCount: number;
    validNewCodesCount: number;
    detectedGtin?: string | null;
    sampleCode?: string | null;
    hasCryptoTail?: boolean;
    formatStandard?: string;
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMultipleFilesSelection(e.dataTransfer.files);
    }
  };

  const handleMultipleFilesSelection = async (incomingFiles: FileList | File[]) => {
    const validCsvs: File[] = [];
    for (let i = 0; i < incomingFiles.length; i++) {
      const f = incomingFiles[i];
      if (f.name.toLowerCase().endsWith('.csv')) {
        validCsvs.push(f);
      }
    }

    if (validCsvs.length === 0) {
      setErrorMsg('Поддерживаются только файлы выгрузки кодов в формате .CSV');
      return;
    }

    setErrorMsg('');
    setParsingFile(true);

    try {
      const newParsedPositions: UploadedCsvPosition[] = [];
      const newFormPositions: FormPositionItem[] = [];

      for (let i = 0; i < validCsvs.length; i++) {
        const file = validCsvs[i];
        const rawText = await file.text();
        const text = rawText.replace(/^\uFEFF/, '').trim();
        const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
        if (lines.length === 0) continue;

        const isMarking = (s: string) => {
          const clean = s.replace(/^["']|["']$/g, '').trim();
          return (
            clean.startsWith('010') ||
            clean.startsWith('01') ||
            clean.startsWith('(01)') ||
            clean.startsWith('\u001d01') ||
            (clean.includes('21') && clean.length >= 25)
          );
        };

        const firstLine = lines[0];
        const sample = lines.slice(0, Math.min(lines.length, 25));
        const markingCount = sample.filter((l) => isMarking(l)).length;
        const isPredominantlyMarking = markingCount >= Math.min(3, sample.length) || isMarking(firstLine);

        let delimiter = ',';
        if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) delimiter = ';';
        if ((firstLine.match(/\t/g) || []).length > (firstLine.match(/[,;]/g) || []).length) delimiter = '\t';
        const firstCols = firstLine.split(delimiter).map((c) => c.replace(/^["']|["']$/g, '').trim());
        const hasHeader = firstCols.some((c) =>
          /^(code|код|marking|маркировка|gtin|serial|sn|barcode|штрихкод|номенклатура|артикул|article|brand|бренд|наименование)/i.test(c)
        );

        const stripCode = (s: string) => {
          let str = s.replace(/^\uFEFF/, '').trim();
          if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
            str = str.slice(1, -1);
          }
          return str.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').trim();
        };

        const rawCodes: string[] = [];
        let extractedGtin = '';

        if (!hasHeader && isPredominantlyMarking) {
          // 1-column list of DataMatrix codes: keep whole lines intact.
          // Crypto tail / serial can contain comma, semicolon, quotes etc.
          for (const line of lines) {
            const cleanCode = stripCode(line);
            if (cleanCode) {
              rawCodes.push(cleanCode);
              if (!extractedGtin) {
                const m = cleanCode.match(/(?:01|\(01\))(\d{14})/) || cleanCode.match(/(?:^|[^\d])01(\d{14})/) || cleanCode.match(/\b(\d{14})\b/);
                if (m) extractedGtin = m[1];
              }
            }
          }
        } else {
          // Multi-column CSV file
          const dataLines = hasHeader ? lines.slice(1) : lines;
          for (const line of dataLines) {
            const cleanLine = line.replace(/^\uFEFF/, '').trim();
            if (!cleanLine) continue;
            const parts = cleanLine
              .split(delimiter)
              .map(stripCode);
            
            let codeVal = parts[0] || '';
            for (const col of parts) {
              if (isMarking(col)) {
                codeVal = col;
                break;
              }
            }

            if (codeVal) {
              rawCodes.push(codeVal);
              if (!extractedGtin) {
                const m = codeVal.match(/(?:01|\(01\))(\d{14})/) || codeVal.match(/(?:^|[^\d])01(\d{14})/) || codeVal.match(/\b(\d{14})\b/);
                if (m) extractedGtin = m[1];
              }
            }
          }
        }

        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_\-]+/g, ' ').trim();
        const id = String(Date.now() + i + Math.random());

        newParsedPositions.push({
          id,
          file,
          name: cleanName || `Позиция ${i + 1}`,
          gtin: extractedGtin,
          quantity: rawCodes.length,
          rawCodes,
        });

        newFormPositions.push({
          id,
          name: cleanName || `Позиция ${i + 1}`,
          article: '',
          size: '',
          color: '',
          gtin: extractedGtin,
          quantity: rawCodes.length,
        });
      }

      if (newParsedPositions.length > 0) {
        // Check each uploaded file individually with backend DB
        await Promise.all(
          newParsedPositions.map(async (pos) => {
            try {
              const formData = new FormData();
              formData.append('file', pos.file);
              const res = await apiClient.post('/orders/check-codes', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
              });
              if (res.data) {
                pos.alreadyInDbCount = Number(res.data.alreadyInDbCount) || 0;
                pos.internalDuplicatesCount = Number(res.data.internalDuplicatesCount) || 0;
                pos.validNewCodesCount = Number(res.data.validNewCodesCount) ?? pos.quantity;
                if (res.data.detectedGtin) pos.gtin = res.data.detectedGtin;
                if (res.data.sampleCode) pos.sampleCode = res.data.sampleCode;
                if (res.data.hasCryptoTail) pos.hasCryptoTail = res.data.hasCryptoTail;
              }
            } catch (apiErr) {
              console.warn('Per-file check-codes error:', apiErr);
            }
          })
        );

        const combinedParsed = [...uploadedCsvFiles, ...newParsedPositions];
        const combinedForm: FormPositionItem[] = combinedParsed.map((pos) => ({
          id: pos.id,
          name: pos.name,
          article: '',
          size: '',
          color: '',
          gtin: pos.gtin,
          quantity: pos.validNewCodesCount !== undefined ? pos.validNewCodesCount : pos.quantity,
        }));

        setUploadedCsvFiles(combinedParsed);
        setSelectedFileId(newParsedPositions[0].id);
        setPositions(combinedForm);
        setPositionsMode(combinedForm.length > 1 ? 'MULTI' : 'SINGLE');

        const validTotalQty = combinedParsed.reduce(
          (acc, p) => acc + (p.validNewCodesCount !== undefined ? p.validNewCodesCount : p.quantity),
          0
        );
        setFileCodesCount(validTotalQty);
        setItemsCount(validTotalQty);
        setCodesFile(combinedParsed[0].file);
      }
    } catch (err: any) {
      setErrorMsg('Ошибка при обработке файлов кодов маркировки: ' + err.message);
    } finally {
      setParsingFile(false);
    }
  };

  const handleRemoveCsvFile = (id: string) => {
    const updated = uploadedCsvFiles.filter((f) => f.id !== id);
    setUploadedCsvFiles(updated);
    if (selectedFileId === id) {
      setSelectedFileId(updated[0]?.id || null);
    }
    const updatedPos = updated.map((pos) => ({
      id: pos.id,
      name: pos.name,
      article: '',
      size: '',
      color: '',
      gtin: pos.gtin,
      quantity: pos.validNewCodesCount !== undefined ? pos.validNewCodesCount : pos.quantity,
    }));
    setPositions(updatedPos.length > 0 ? updatedPos : [{ id: '1', name: '', article: '', size: '', color: '', gtin: '', quantity: 0 }]);
    if (updated.length <= 1) {
      setPositionsMode('SINGLE');
    }
    const validTotalQty = updated.reduce(
      (acc, f) => acc + (f.validNewCodesCount !== undefined ? f.validNewCodesCount : f.quantity),
      0
    );
    setFileCodesCount(validTotalQty > 0 ? validTotalQty : null);
    setItemsCount(validTotalQty);
    if (updated.length === 0) {
      setCodesFile(null);
      setCodeCheckResult(null);
    } else {
      setCodesFile(updated[0].file);
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
  }[] = useMemo(() => {
    const getPriceFrom = (code: string, fallback: number) => {
      const found = dbTariffs.find((t) => t.code === code);
      const minPrice = found?.priceLargeWholesale ?? fallback;
      return `от ${minPrice} ₸ / шт.`;
    };

    return [
      {
        type: 'DIGITAL',
        name: 'Цифровой',
        desc: 'Только эмиссия кодов Data Matrix в ИС Танба',
        priceFrom: getPriceFrom('DIGITAL', 10),
        features: ['Заказ кодов в ИС Танба / ГС1', 'Выгрузка макетов в PDF / CSV'],
      },
      {
        type: 'PRINT',
        name: 'Печатный',
        desc: 'Печать рулонов стикеров термотрансфером',
        priceFrom: getPriceFrom('PRINT', 25),
        features: ['Эмиссия кодов + печать', 'Рулоны промышленного качества'],
      },
      {
        type: 'STANDARD',
        name: 'Стандарт',
        desc: 'Печать и оклейка партии товара под ключ',
        priceFrom: getPriceFrom('STANDARD', 50),
        features: ['Выезд бригады на ваш склад', 'Оклейка товаров и ввод в оборот'],
      },
      {
        type: 'PRO',
        name: 'PRO Склад',
        desc: 'Оклейка, вскрытие, сверка + SSCC короба',
        priceFrom: getPriceFrom('PRO', 90),
        features: ['Агрегация SSCC коробов', 'Сверка артикулов и брак-контроль'],
      },
    ];
  }, [dbTariffs]);

  const availableTariffs = useMemo(() => {
    if (markirovkaMode === 'FILE') {
      return tariffs.filter((t) => t.type !== 'DIGITAL');
    }
    return tariffs;
  }, [markirovkaMode, tariffs]);

  const toggleService = (code: string) => {
    setExtraServices((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const selectedCategoryInfo = category ? CATEGORY_MAP[category] : null;
  const selectedTariffInfo = tariffType ? tariffs.find((t) => t.type === tariffType) : null;

  // Triggered on clicking "Подтвердить и отправить заказ"
  // Triggered on clicking "Подтвердить и отправить заказ"
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Шаг 1: Категория
    if (!category) {
      setErrorMsg('Пожалуйста, выберите категорию товара (Шаг 1). Без категории создание заявки невозможно.');
      document.getElementById('step-category-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Шаг 2: Коды маркировки и позиции
    if (!markirovkaMode) {
      setErrorMsg('Пожалуйста, выберите способ работы с кодами (Шаг 2): файлы CSV или заказ эмиссии.');
      document.getElementById('step-codes-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (markirovkaMode === 'FILE') {
      if (!codesFile && uploadedCsvFiles.length === 0) {
        setErrorMsg('Пожалуйста, прикрепите файлы с кодами маркировки (Шаг 2). Создание заказа без файлов кодов невозможно.');
        document.getElementById('step-codes-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      if (itemsCount < 1) {
        setErrorMsg('В прикреплённых файлах не найдено новых кодов для заказа (Шаг 2). Загрузите файлы со свежими кодами маркировки.');
        document.getElementById('step-codes-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    } else {
      if (!markirovkaAccountId) {
        setErrorMsg('Пожалуйста, выберите аккаунт маркировки (Шаг 2).');
        document.getElementById('step-codes-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      if (!emissionReleaseType) {
        setErrorMsg('Пожалуйста, выберите способ выпуска в оборот (Шаг 2).');
        document.getElementById('step-codes-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      if (!emissionPurpose) {
        setErrorMsg('Пожалуйста, выберите цель маркировки (Шаг 2).');
        document.getElementById('step-codes-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const hasValidEmissionGtin = positions.some((p) => p.gtin && p.gtin.trim().length >= 8);

      if (!hasValidEmissionGtin) {
        setErrorMsg('Пожалуйста, укажите хотя бы один GTIN товара (14 цифр) в позициях эмиссии (Шаг 2).');
        document.getElementById('step-codes-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      if (itemsCount < 1) {
        setErrorMsg('Пожалуйста, укажите количество товара для заказа (Шаг 2).');
        document.getElementById('step-codes-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    // Шаг 3: Тариф
    if (!tariffType) {
      setErrorMsg('Пожалуйста, выберите тариф маркировки (Шаг 3). Без тарифа создание заявки невозможно.');
      document.getElementById('step-tariff-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Шаг 4: Адрес выполнения / доставки
    if (tariffType !== 'DIGITAL' && !warehouseAddress.trim()) {
      setErrorMsg(
        tariffType === 'PRINT'
          ? 'Пожалуйста, укажите адрес доставки рулонов (со стикерами) в РК (Шаг 4).'
          : 'Пожалуйста, укажите адрес склада в РК для выезда бригады (Шаг 4).'
      );
      const warehouseEl = document.getElementById('warehouse-address-input');
      if (warehouseEl) {
        warehouseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        warehouseEl.focus();
      }
      return;
    }

    executeSubmit(itemsCount);
  };

  // Final submission execution
  const executeSubmit = async (finalCount: number) => {
    const hasValidEmissionGtin = positions.some((p) => p.gtin && p.gtin.trim().length >= 8);

    if (
      !category ||
      !markirovkaMode ||
      !tariffType ||
      (tariffType !== 'DIGITAL' && !warehouseAddress.trim()) ||
      (markirovkaMode === 'FILE' && (!codesFile && uploadedCsvFiles.length === 0)) ||
      (markirovkaMode === 'EMISSION' && (!markirovkaAccountId || !hasValidEmissionGtin || !emissionReleaseType || !emissionPurpose)) ||
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

    const addressNote = tariffType === 'DIGITAL'
      ? 'Адрес / доставка: Не требуется (электронный заказ, выгрузка кодов в ЛК)'
      : (warehouseAddress ? `${tariffType === 'PRINT' ? 'Адрес доставки рулонов' : 'Адрес склада в РК'}: ${warehouseAddress}` : '');

    const fullNotes = [
      addressNote,
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
        warehouseAddress: tariffType === 'DIGITAL' ? 'Электронная выгрузка в ЛК' : warehouseAddress.trim(),
        extraServices,
        ssccNeeded: tariffType === 'PRO' ? true : ssccNeeded,
        positions: markirovkaMode === 'EMISSION' || uploadedCsvFiles.length > 1
          ? positions.map((p, i) => ({
              ...p,
              name: p.name.trim() || `Позиция ${i + 1} (${p.gtin || 'GTIN'})`,
            })).filter((p) => (p.gtin && p.gtin.trim().length > 0) || p.quantity > 0)
          : undefined,
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
        markirovkaGtin: markirovkaMode === 'EMISSION' ? (positions.find((p) => p.gtin)?.gtin?.trim() || markirovkaGtin.trim()) : undefined,
        markirovkaReleaseType: markirovkaMode === 'EMISSION' ? emissionReleaseType : undefined,
        markirovkaPurpose: markirovkaMode === 'EMISSION' ? emissionPurpose : undefined,
      } as any);

      const newOrderId = res?.order?.id || res?.id;

      // If user attached codes file during creation, upload it now
      if (newOrderId && (uploadedCsvFiles.length > 0 || codesFile)) {
        try {
          let fileToUpload = codesFile;
          if (uploadedCsvFiles.length > 1) {
            const allCodesMerged = uploadedCsvFiles.flatMap((p) => p.rawCodes);
            const blob = new Blob([allCodesMerged.join('\n')], { type: 'text/csv' });
            fileToUpload = new File([blob], `batch_${uploadedCsvFiles.length}_positions.csv`, { type: 'text/csv' });
          } else if (uploadedCsvFiles.length === 1) {
            fileToUpload = uploadedCsvFiles[0].file;
          }

          if (fileToUpload) {
            const fileData = new FormData();
            fileData.append('file', fileToUpload);
            await apiClient.post(`/orders/${newOrderId}/upload-codes`, fileData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          }
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
                  Шаг 1: Категория товара
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

        {/* Step 2: Unified Codes & Positions / Markirovka */}
        <div id="step-codes-section" className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0082FB] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#111827]">
                  Шаг 2: Коды маркировки и товарные позиции
                </h3>
                <p className="text-xs text-[#64748B]">
                  Выберите источник кодов: загрузите файлы из ИС МПТ (1 файл = 1 позиция) или оформите эмиссию под ключ
                </p>
              </div>
            </div>

            {markirovkaMode === 'FILE' && uploadedCsvFiles.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setUploadedCsvFiles([]);
                  setPositions([{ id: '1', name: '', article: '', size: '', color: '', gtin: '', quantity: 0 }]);
                  setCodesFile(null);
                  setFileCodesCount(null);
                  setCodeCheckResult(null);
                  setItemsCount(0);
                }}
                className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
              >
                Очистить все файлы
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
                if (tariffType === 'DIGITAL') {
                  setTariffType('PRINT');
                }
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
                <div className="text-xs font-extrabold text-[#111827]">У меня есть файлы кодов (CSV)</div>
                <div className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                  Загрузка выгруженных кодов DataMatrix из вашего кабинета ИС МПТ (1 файл = 1 позиция / GTIN)
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setMarkirovkaMode('EMISSION');
                const cnt = positionsMode === 'MULTI' ? totalPositionsCount : (manualCount || 500);
                setItemsCount(cnt);
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

          {/* MODE 1: FILE UPLOAD (1 FILE = 1 POSITION) */}
          {markirovkaMode === 'FILE' && (
            <div className="space-y-4">
              {uploadedCsvFiles.length === 0 ? (
                /* Empty state: Clean dropzone */
                <div
                  onDragOver={handleCodesDragOver}
                  onDragEnter={handleCodesDragEnter}
                  onDragLeave={handleCodesDragLeave}
                  onDrop={handleCodesDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 transition-all text-center cursor-pointer select-none ${
                    isCodesDragOver
                      ? 'border-[#0082FB] bg-blue-50/80 ring-2 ring-[#0082FB]/20 scale-[1.005]'
                      : 'border-blue-200 bg-blue-50/30 hover:bg-blue-50/60 hover:border-[#0082FB]'
                  }`}
                >
                  <div className="w-11 h-11 rounded-2xl bg-blue-100 text-[#0082FB] flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-gray-900 mb-1">
                    <span className="text-[#0082FB] hover:underline">Выберите CSV-файлы</span> или перетащите их сюда
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Можно выбрать один или несколько файлов — каждый файл станет отдельной позицией (SKU)
                  </div>
                </div>
              ) : (
                /* Files uploaded state: Tabs + Active file details */
                <div className="space-y-3">
                  {/* Top Bar with count and Add button */}
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-900">
                        Файлы позиций ({uploadedCsvFiles.length})
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-gray-500">
                        Тираж к печати: <strong className="text-gray-900 font-semibold">{itemsCount.toLocaleString()} шт.</strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0082FB] hover:text-[#0070DA] hover:bg-blue-50/80 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Добавить файл</span>
                    </button>
                  </div>

                  {/* Tabs when there are multiple files */}
                  {uploadedCsvFiles.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {uploadedCsvFiles.map((item, idx) => {
                        const isSelected = item.id === activeFile?.id;
                        const printableQty = item.validNewCodesCount !== undefined ? item.validNewCodesCount : item.quantity;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedFileId(item.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                              isSelected
                                ? 'bg-blue-50 border-blue-200 text-[#0082FB] font-semibold shadow-2xs'
                                : 'bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300'
                            }`}
                          >
                            <span className="text-gray-400 font-mono text-[10px]">#{idx + 1}</span>
                            <span className="truncate max-w-[150px]">{item.file.name}</span>
                            <span className={`text-[11px] font-mono ${printableQty === 0 ? 'text-amber-600 font-bold' : 'opacity-80'}`}>
                              ({printableQty} шт.)
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Active file inspection card */}
                  {activeFile && (
                    <div className="p-4 bg-white rounded-2xl border border-gray-200/90 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileSpreadsheet className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="text-xs font-semibold text-gray-900 truncate">
                            {activeFile.file.name}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            ({(activeFile.file.size / 1024).toFixed(1)} КБ)
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveCsvFile(activeFile.id)}
                          className="text-xs text-gray-400 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
                          title="Удалить этот файл"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Удалить файл</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="p-2.5 bg-gray-50/70 rounded-xl border border-gray-200/60">
                          <span className="text-[10px] text-gray-500 block mb-0.5">GTIN позиции</span>
                          <span className="text-xs font-mono font-semibold text-gray-900 block">
                            {activeFile.gtin || 'Не определен'}
                          </span>
                        </div>
                        <div className="p-2.5 bg-gray-50/70 rounded-xl border border-gray-200/60">
                          <span className="text-[10px] text-gray-500 block mb-0.5">Тираж к печати</span>
                          <span className="text-xs font-semibold text-gray-900 flex items-center gap-1.5 flex-wrap">
                            <span>{(activeFile.validNewCodesCount !== undefined ? activeFile.validNewCodesCount : activeFile.quantity).toLocaleString()} шт.</span>
                            {activeFile.alreadyInDbCount && activeFile.alreadyInDbCount > 0 ? (
                              <span className="text-[10px] font-normal text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                                {activeFile.alreadyInDbCount} в базе отфильтровано
                              </span>
                            ) : null}
                          </span>
                        </div>
                      </div>

                      {/* Verification status for active file */}
                      {activeFile.alreadyInDbCount !== undefined && (
                        <div className="pt-0.5">
                          {activeFile.alreadyInDbCount === activeFile.quantity ? (
                            <div className="flex items-center gap-2 p-2 bg-amber-50/80 border border-amber-200/70 rounded-xl text-amber-800 text-[11px]">
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>Все {activeFile.quantity} кодов из этого файла уже зарегистрированы в базе TANBOX.</span>
                            </div>
                          ) : activeFile.alreadyInDbCount > 0 ? (
                            <div className="flex items-center gap-2 p-2 bg-amber-50/80 border border-amber-200/70 rounded-xl text-amber-800 text-[11px]">
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>
                                В файле найдено {activeFile.alreadyInDbCount} повторных кодов. К печати будет принято {activeFile.validNewCodesCount} шт.
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 p-2 bg-emerald-50/80 border border-emerald-200/70 rounded-xl text-emerald-800 text-[11px]">
                              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Все {activeFile.quantity} кодов уникальны и готовы к печати.</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Drag and drop zone below to drop more files */}
                  <div
                    onDragOver={handleCodesDragOver}
                    onDragEnter={handleCodesDragEnter}
                    onDragLeave={handleCodesDragLeave}
                    onDrop={handleCodesDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border border-dashed rounded-xl py-2.5 px-3 transition-all text-center cursor-pointer select-none flex items-center justify-center gap-2 text-xs text-gray-500 hover:border-[#0082FB] hover:text-[#0082FB] ${
                      isCodesDragOver ? 'border-[#0082FB] bg-blue-50/60 text-[#0082FB]' : 'border-gray-300 bg-gray-50/40'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Перетащите еще CSV-файлы сюда для добавления позиций</span>
                  </div>
                </div>
              )}

              {/* Parsing loader */}
              {parsingFile && (
                <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-[#0082FB] flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#0082FB]" />
                  <span className="font-semibold">Проверка кодов маркировки...</span>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                multiple
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleMultipleFilesSelection(e.target.files);
                  }
                }}
                className="hidden"
              />
            </div>
          )}

          {/* MODE 2: TURNKEY EMISSION (MANUAL SKU TABLE OR SINGLE GTIN) */}
          {markirovkaMode === 'EMISSION' && (
            <div className="space-y-6 p-5 sm:p-6 bg-gradient-to-b from-blue-50/30 to-white rounded-2xl border border-blue-100">
              {/* Account, Release Type and Purpose */}
              <div className="space-y-4 pb-4 border-b border-gray-200/80">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Account Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium text-gray-700">
                        Аккаунт Markirovka.kz
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsConnectModalOpen(true)}
                        className="text-xs font-semibold text-[#0082FB] hover:underline cursor-pointer"
                      >
                        + Подключить
                      </button>
                    </div>
                    <select
                      value={markirovkaAccountId}
                      onChange={(e) => setMarkirovkaAccountId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs text-gray-900 bg-white focus:outline-none focus:border-[#0082FB]"
                    >
                      {markirovkaAccounts.length === 0 ? (
                        <option value="">Нет сохраненных аккаунтов</option>
                      ) : (
                        markirovkaAccounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} ({acc.environment})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Release Type */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Способ выпуска в оборот
                    </label>
                    <select
                      value={emissionReleaseType}
                      onChange={(e) => setEmissionReleaseType(e.target.value as any)}
                      className={`w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none focus:border-[#0082FB] ${
                        !emissionReleaseType ? 'text-gray-400' : 'text-gray-900'
                      }`}
                    >
                      <option value="" disabled>Выберите способ выпуска...</option>
                      <option value="PRODUCTION">Производство в РК (внутреннее)</option>
                      <option value="IMPORT">Импорт в РК (ввоз товара)</option>
                      <option value="REMAINDER">Маркировка остатков / в обороте</option>
                    </select>
                  </div>

                  {/* Purpose */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Цель маркировки
                    </label>
                    <select
                      value={emissionPurpose}
                      onChange={(e) => setEmissionPurpose(e.target.value as any)}
                      className={`w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none focus:border-[#0082FB] ${
                        !emissionPurpose ? 'text-gray-400' : 'text-gray-900'
                      }`}
                    >
                      <option value="" disabled>Выберите цель маркировки...</option>
                      <option value="FOR_SALE">Для реализации в РК</option>
                      <option value="CROSS_BORDER">Трансграничная торговля / ЕАЭС</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Positions for Emission */}
              <div className="pt-2 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-900">
                    Товарные позиции (GTIN)
                  </span>
                  {totalPositionsCount > 0 && (
                    <span className="text-xs text-gray-500">
                      Общий тираж: <span className="font-semibold text-gray-900">{totalPositionsCount.toLocaleString()} шт.</span>
                    </span>
                  )}
                </div>

                <div className="space-y-2.5">
                  {positions.map((pos) => (
                    <div
                      key={pos.id}
                      className="flex items-end gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-medium text-gray-600">
                            GTIN (14 цифр)
                          </label>
                          {pos.gtin && pos.gtin.length >= 8 && (
                            <button
                              type="button"
                              onClick={() => handleFetchNkt(pos.id)}
                              disabled={loadingNktMap[pos.id]}
                              className="text-[11px] font-bold text-[#0082FB] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <RefreshCw className={`w-3 h-3 ${loadingNktMap[pos.id] ? 'animate-spin' : ''}`} />
                              <span>{loadingNktMap[pos.id] ? 'Загрузка...' : 'Подтянуть из НКТ'}</span>
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          maxLength={14}
                          value={pos.gtin || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            handlePositionChange(pos.id, 'gtin', val);
                          }}
                          placeholder="05055107433614"
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono text-gray-900 bg-white focus:outline-none focus:border-[#0082FB]"
                        />
                        {pos.name && !pos.name.startsWith('Позиция ') && (
                          <div className="mt-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200/80 rounded-lg text-[11px] text-emerald-900 flex items-center gap-1.5 font-medium">
                            <span className="font-bold text-emerald-600">✓ НКТ:</span>
                            <span className="truncate">{pos.name}</span>
                            {pos.article && <span className="text-emerald-700 font-mono">({pos.article})</span>}
                            {pos.size && <span className="text-emerald-700">р.{pos.size}</span>}
                            {pos.color && <span className="text-emerald-700">цв.{pos.color}</span>}
                          </div>
                        )}
                      </div>

                      <div className="w-36 sm:w-44">
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">
                          Количество
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="150000"
                          value={pos.quantity || ''}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                            handlePositionChange(pos.id, 'quantity', val);
                          }}
                          placeholder="0"
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs text-gray-900 bg-white focus:outline-none focus:border-[#0082FB]"
                        />
                      </div>

                      {positions.length > 1 && (
                        <div className="pb-1">
                          <button
                            type="button"
                            onClick={() => handleRemovePosition(pos.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Удалить"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleAddPosition}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0082FB] hover:text-[#0070DA] hover:bg-blue-50/70 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Добавить позицию</span>
                  </button>
                </div>
              </div>


            </div>
          )}
        </div>

        {/* Step 3: Tariff Selection */}
        <div id="step-tariff-section" className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/80 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0082FB] flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#111827]">
                  Шаг 3: Тариф маркировки
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

          <div className={`grid grid-cols-1 sm:grid-cols-2 ${availableTariffs.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-3 pt-1`}>
            {availableTariffs.map((t) => {
              const isSelected = tariffType === t.type;
              return (
                <button
                  type="button"
                  key={t.type}
                  onClick={() => {
                    setTariffType(t.type);
                    if (t.type === 'DIGITAL') {
                      setSsccNeeded(false);
                      setExtraServices((prev) => prev.filter((s) => s !== 'EXPRESS_DELIVERY' && s !== 'ON_SITE_STICKERING'));
                    }
                  }}
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

        {/* Step 4: Extra Options & Delivery */}
        <div id="step-services-section" className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/80 space-y-6">
          <div className="pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0082FB] flex items-center justify-center shrink-0">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#111827]">
                  Шаг 4: Дополнительные услуги и доставка
                </h3>
                <p className="text-xs text-[#64748B]">
                  Макет этикетки, логистические опции и адрес выполнения заказа
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
                        Дизайнер подготовит макет под ваши требования и стандарты маркировки
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-[#0082FB] shrink-0 ml-3">
                    +{Number(dbPricingSettings?.stickerLayoutPrice || 5000).toLocaleString()} ₸
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


                    {/* Informational note about nomenclature */}
                    <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0082FB] mt-1.5 shrink-0" />
                      <p className="text-[11px] text-[#475569] leading-relaxed">
                        Данные о товарах (наименования на каз. и рус. языках, артикулы, составы, бренды) берутся автоматически из спецификации вашего заказа (Шаг 2). Дизайнер согласует макет перед запуском в печать.
                      </p>
                    </div>

                    {/* Extra details / wishes */}
                    <div>
                      <label className="text-[11px] font-bold text-[#475569] block mb-1">
                        Пожелания к макету и реквизиты (опционально)
                      </label>
                      <textarea
                        rows={2}
                        value={labelExtraDetails}
                        onChange={(e) => setLabelExtraDetails(e.target.value)}
                        placeholder="Укажите реквизиты производителя/импортера в РК, знаки ухода, логотип или особые требования к этикетке..."
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
                        Дизайн этикетки под требования ваших стандартов. Сохранится в библиотеку для повторных заказов!
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-[#0082FB] shrink-0 ml-3">
                    +{Number(dbPricingSettings?.stickerLayoutPrice || 5000).toLocaleString()} ₸
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


                    {/* Informational note about nomenclature */}
                    <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0082FB] mt-1.5 shrink-0" />
                      <p className="text-[11px] text-[#475569] leading-relaxed">
                        Данные о товарах (наименования на каз. и рус. языках, артикулы, составы, бренды) берутся автоматически из спецификации вашего заказа (Шаг 2). Дизайнер согласует макет перед запуском в печать.
                      </p>
                    </div>

                    {/* Extra details / wishes */}
                    <div>
                      <label className="text-[11px] font-bold text-[#475569] block mb-1">
                        Пожелания к макету и реквизиты (опционально)
                      </label>
                      <textarea
                        rows={2}
                        value={labelExtraDetails}
                        onChange={(e) => setLabelExtraDetails(e.target.value)}
                        placeholder="Укажите реквизиты производителя/импортера в РК, знаки ухода, логотип или особые требования к этикетке..."
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

            <div className={`grid grid-cols-1 sm:grid-cols-2 ${tariffType === 'DIGITAL' ? 'lg:grid-cols-1 max-w-sm' : 'lg:grid-cols-3'} gap-3.5`}>
              {/* Option 1: SSCC */}
              {tariffType !== 'DIGITAL' && (
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
                      {tariffType === 'PRO' ? 'Включено' : `+${dbPricingSettings?.ssccPrice ?? 5} ₸ / шт.`}
                    </span>
                  </div>
                </label>
              )}

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
                  <span className="text-xs font-extrabold text-[#0082FB]">
                    +{dbPricingSettings?.urgentPercent ?? 20}%
                  </span>
                </div>
              </label>

              {/* Option 3: Delivery */}
              {tariffType !== 'DIGITAL' && (
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
                    <span className="text-xs font-extrabold text-[#0082FB]">
                      +{Number(dbPricingSettings?.expressDeliveryPrice || 15000).toLocaleString()} ₸
                    </span>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* 3. Адрес выполнения / доставки и примечания */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#0082FB]" />
                {tariffType === 'DIGITAL'
                  ? 'Получение кодов'
                  : tariffType === 'PRINT'
                  ? 'Адрес доставки рулонов'
                  : 'Адрес склада и примечания'}
              </span>
              <span className="text-[11px] text-[#64748B]">
                {tariffType === 'DIGITAL'
                  ? 'Электронный заказ'
                  : tariffType === 'PRINT'
                  ? 'Курьерская доставка по РК'
                  : 'Для выезда бригады специалистов'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1 items-start">
            {/* Warehouse Address or Digital Info Notice */}
            {tariffType === 'DIGITAL' ? (
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 flex items-start gap-3.5 self-center">
                <div className="w-9 h-9 rounded-xl bg-[#0082FB]/10 text-[#0082FB] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-[#111827]">
                    Адрес склада не требуется
                  </div>
                  <div className="text-xs text-[#64748B] leading-relaxed">
                    Для цифрового тарифа выезд бригады и курьерская доставка не требуются — готовые коды маркировки поступят в электронном виде (в формате CSV и PDF) прямо в ваш личный кабинет.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 flex flex-col justify-between">
                <div className="flex flex-wrap items-center justify-between gap-2 min-h-[28px]">
                  <label htmlFor="warehouse-address-input" className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#0082FB]" />
                    <span>
                      {tariffType === 'PRINT'
                        ? 'Адрес доставки рулонов (со стикерами)'
                        : 'Адрес склада в РК (для выезда бригады)'}
                    </span>
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
                  placeholder={
                    tariffType === 'PRINT'
                      ? 'г. Алматы, ул. Райымбека 212, склад №4 (или адрес для курьера DPD / СДЭК)'
                      : 'г. Алматы, ул. Райымбека 212, склад №4 (или любой другой город РК)'
                  }
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
                    Пожалуйста, введите адрес или выберите один из ваших адресов выше.
                  </p>
                )}
              </div>
            )}

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
                    : !markirovkaMode
                    ? 'Способ не выбран'
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
              !markirovkaMode ||
              (markirovkaMode === 'FILE' && !codesFile && uploadedCsvFiles.length === 0) ||
              (markirovkaMode === 'EMISSION' &&
                (!markirovkaAccountId || !positions.some((p) => p.gtin && p.gtin.trim().length >= 8))) ||
              itemsCount < 1 ||
              !tariffType ||
              (tariffType !== 'DIGITAL' && !warehouseAddress.trim())
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
            ) : !markirovkaMode ? (
              <span>Выберите способ получения кодов (Шаг 2)</span>
            ) : markirovkaMode === 'FILE' && !codesFile && uploadedCsvFiles.length === 0 ? (
              <span>Загрузите файлы с кодами (Шаг 2)</span>
            ) : markirovkaMode === 'EMISSION' && !markirovkaAccountId ? (
              <span>Выберите аккаунт маркировки (Шаг 2)</span>
            ) : markirovkaMode === 'EMISSION' && !positions.some((p) => p.gtin && p.gtin.trim().length >= 8) ? (
              <span>Укажите GTIN позиций (Шаг 2)</span>
            ) : itemsCount < 1 ? (
              <span>Укажите тираж заказа (Шаг 2)</span>
            ) : !tariffType ? (
              <span>Выберите тариф (Шаг 3)</span>
            ) : tariffType !== 'DIGITAL' && !warehouseAddress.trim() ? (
              <span>
                {tariffType === 'PRINT'
                  ? 'Укажите адрес доставки (Шаг 4)'
                  : 'Укажите адрес склада (Шаг 4)'}
              </span>
            ) : (
              <>
                <span>
                  Подтвердить и отправить заказ (
                  {positions.length > 1 ? `${positions.length} поз., ` : ''}
                  {itemsCount.toLocaleString()} шт.)
                </span>
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
        allowDigital={markirovkaMode === 'EMISSION'}
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
