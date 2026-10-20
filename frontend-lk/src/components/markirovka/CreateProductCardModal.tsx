import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Send,
  Save,
  AlertCircle,
  Package,
  Layers,
  Globe,
  Tag,
  Building2,
  FileCheck,
  Scale,
  Camera,
  CheckCircle2,
  Upload,
  Loader2,
  Sparkles,
  Languages,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { useModalBehavior } from '@shared';

interface CreateProductCardModalProps {
  onClose: () => void;
  onSuccess: () => void;
  cardToEdit?: any | null;
}

interface CategoryOption {
  category: string;
  nameRu: string;
  nameKk: string;
  code: string;
  tnvedExamples: string[];
}

interface FieldDefinition {
  id: string;
  name: string;
  nameKk?: string;
  required: boolean;
  type: 'select' | 'text' | 'number';
  options?: string[];
  placeholder?: string;
  hint?: string;
}

export const CreateProductCardModal: React.FC<CreateProductCardModalProps> = ({
  onClose,
  onSuccess,
  cardToEdit,
}) => {
  // Accounts
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(cardToEdit?.accountId || '');
  const [showOnlyAccountCategories, setShowOnlyAccountCategories] = useState(true);

  // Categories & Schemas
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(cardToEdit?.category || 'SHOES');
  const [categorySchema, setCategorySchema] = useState<{
    fields: FieldDefinition[];
    tnvedExamples: string[];
    defaultOktru?: string;
    oktruPresets?: Array<{ code: string; nameRu: string }>;
  } | null>(null);

  // Mode: EXPRESS (all essential fields on 1 view) vs TABS (step-by-step)
  const [viewMode, setViewMode] = useState<'EXPRESS' | 'TABS'>('EXPRESS');
  const [showAdvancedInExpress, setShowAdvancedInExpress] = useState(false);

  // Active tab when in TABS mode
  const [activeTab, setActiveTab] = useState<'BASE' | 'CATEGORY' | 'PRODUCER' | 'CERT' | 'LOGISTICS' | 'MEDIA'>('BASE');

  // Base product fields
  const [name, setName] = useState(cardToEdit?.name || '');
  const [nameKk, setNameKk] = useState(cardToEdit?.nameKk || '');
  const [brand, setBrand] = useState(cardToEdit?.brand || '');
  const [article, setArticle] = useState(cardToEdit?.article || '');
  const [model, setModel] = useState(cardToEdit?.model || '');
  const [tnved, setTnved] = useState(cardToEdit?.tnved || '');
  const [gtin, setGtin] = useState(cardToEdit?.gtin || '');
  const [country, setCountry] = useState(cardToEdit?.country || 'Казахстан');
  const [packageType, setPackageType] = useState(cardToEdit?.packageType || 'UNIT');

  // Translation state
  const [translatingKk, setTranslatingKk] = useState(false);
  const [copiedOktru, setCopiedOktru] = useState(false);

  // Producer & Importer fields
  const [producerName, setProducerName] = useState(cardToEdit?.producerName || '');
  const [producerAddress, setProducerAddress] = useState(cardToEdit?.producerAddress || '');
  const [importerName, setImporterName] = useState(cardToEdit?.importerName || '');
  const [importerBin, setImporterBin] = useState(cardToEdit?.importerBin || '');
  const [producerSameAsImporter, setProducerSameAsImporter] = useState(false);

  // Signs (Признаки) & Measure units (Единицы измерения)
  const [signEaes, setSignEaes] = useState<boolean>(cardToEdit?.attributes?.signEaes ?? true);
  const [markingRequired, setMarkingRequired] = useState<boolean>(cardToEdit?.attributes?.markingRequired ?? true);
  const [isSzpt, setIsSzpt] = useState<boolean>(cardToEdit?.attributes?.isSzpt ?? false);
  const [measureUnit, setMeasureUnit] = useState<string>(cardToEdit?.attributes?.measureUnit || '796');
  const [measureQuantity, setMeasureQuantity] = useState<string>(cardToEdit?.attributes?.quantity || '1');

  // Certification fields
  const [certificateType, setCertificateType] = useState(cardToEdit?.certificateType || '');
  const [certificateNumber, setCertificateNumber] = useState(cardToEdit?.certificateNumber || '');
  const [certificateDate, setCertificateDate] = useState(
    cardToEdit?.certificateDate ? new Date(cardToEdit.certificateDate).toISOString().slice(0, 10) : ''
  );
  const [certificateExpiryDate, setCertificateExpiryDate] = useState(
    cardToEdit?.certificateExpiryDate ? new Date(cardToEdit.certificateExpiryDate).toISOString().slice(0, 10) : ''
  );
  const [gostOrTu, setGostOrTu] = useState(cardToEdit?.gostOrTu || '');

  // Logistics & Shelf life
  const [netWeight, setNetWeight] = useState(cardToEdit?.netWeight || '');
  const [grossWeight, setGrossWeight] = useState(cardToEdit?.grossWeight || '');
  const [shelfLife, setShelfLife] = useState(cardToEdit?.shelfLife || '');

  // Photos
  const [photoUrl, setPhotoUrl] = useState('');
  const [photos, setPhotos] = useState<string[]>(cardToEdit?.photos || []);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category specific attributes & OKTRU
  const [oktru, setOktru] = useState(cardToEdit?.attributes?.oktru || '');
  const [isCustomOktru, setIsCustomOktru] = useState(false);
  const [customAttributes, setCustomAttributes] = useState<Record<string, any>>(cardToEdit?.attributes || {});

  const [loadingSchema, setLoadingSchema] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load accounts and categories on mount
  useEffect(() => {
    Promise.all([
      apiClient.get('/markirovka/accounts').catch(() => ({ data: { accounts: [] } })),
      apiClient.get('/markirovka/cards/categories').catch(() => ({ data: { categories: [] } })),
    ]).then(([accRes, catRes]) => {
      const accs = accRes.data?.accounts || [];
      setAccounts(accs);

      const cats = catRes.data?.categories || [];
      setCategories(cats);

      if (!cardToEdit && accs.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accs[0].id);
      }
    });
  }, []);

  const currentAccount = accounts.find((a) => a.id === selectedAccountId);

  // Auto-fill company details from account
  const handleFillCompanyDetails = () => {
    if (!currentAccount) return;
    const compName = currentAccount.name && currentAccount.name !== 'щ' ? currentAccount.name : '';
    const compBin = /^\d{12}$/.test(currentAccount.login) ? currentAccount.login : '';
    if (compName) {
      setImporterName(compName);
      if (!producerName) {
        setProducerName(compName);
      }
    }
    if (compBin) {
      setImporterBin(compBin);
    }
  };

  useEffect(() => {
    if (currentAccount && !cardToEdit) {
      if (!importerName && currentAccount.name && currentAccount.name !== 'щ') {
        setImporterName(currentAccount.name);
      }
      if (!importerBin && /^\d{12}$/.test(currentAccount.login)) {
        setImporterBin(currentAccount.login);
      }
    }
  }, [selectedAccountId]);

  // Load category schema whenever selectedCategory changes
  useEffect(() => {
    if (!selectedCategory) return;
    setLoadingSchema(true);
    apiClient
      .get(`/markirovka/cards/categories/${selectedCategory}/schema`)
      .then((res) => {
        if (res.data?.schema) {
          const schema = res.data.schema;
          setCategorySchema(schema);
          if (!cardToEdit) {
            if (!tnved && schema.tnvedExamples?.[0]) {
              const ex = schema.tnvedExamples[0];
              setTnved(ex.length === 4 ? `${ex}900000` : ex);
            }
            if (schema.defaultOktru) {
              const isOldOrKimonoOrOked =
                !oktru ||
                oktru === '1082-0003-0007-100117541' ||
                oktru.startsWith('1920-') ||
                oktru.startsWith('1520-') ||
                oktru.startsWith('1412-') ||
                oktru.startsWith('1089-');
              if (isOldOrKimonoOrOked) {
                setOktru(schema.defaultOktru);
                setIsCustomOktru(false);
              }
            }
          } else {
            const hasPreset = schema.oktruPresets?.some((p: any) => p.code === cardToEdit?.attributes?.oktru);
            setIsCustomOktru(!hasPreset && Boolean(cardToEdit?.attributes?.oktru));
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoadingSchema(false);
      });
  }, [selectedCategory]);

  const handleAttrChange = (fieldId: string, val: any) => {
    setCustomAttributes((prev) => ({
      ...prev,
      [fieldId]: val,
    }));
  };

  const handleAddPhoto = () => {
    if (photoUrl.trim() && !photos.includes(photoUrl.trim())) {
      setPhotos([...photos, photoUrl.trim()]);
      setPhotoUrl('');
    }
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos(photos.filter((_, i) => i !== idx));
  };

  // Instant Translate Russian name -> Kazakh name
  const handleTranslateKk = async () => {
    if (!name.trim()) {
      setError('Сначала введите наименование товара на русском языке');
      return;
    }
    setTranslatingKk(true);
    setError(null);
    try {
      const res = await apiClient.post('/markirovka/cards/translate-kk', { text: name.trim() });
      if (res.data?.text) {
        setNameKk(res.data.text);
      }
    } catch {
      setError('Не удалось выполнить автоперевод, введите перевод вручную');
    } finally {
      setTranslatingKk(false);
    }
  };

  const handleSubmit = async (submitToNktDirectly: boolean) => {
    if (!name.trim()) {
      setError('Укажите наименование товара на русском языке');
      setActiveTab('BASE');
      return;
    }
    if (!brand.trim()) {
      setError('Укажите бренд / торговую марку товара');
      setActiveTab('BASE');
      return;
    }
    if (!tnved.trim()) {
      setError('Укажите код ТН ВЭД товара');
      setActiveTab('BASE');
      return;
    }
    if (submitToNktDirectly) {
      if (!gtin.trim()) {
        setError(
          'Для отправки в Национальный каталог (НКТ) обязательно укажите штрихкод GTIN (13 или 14 цифр). Если штрихкода пока нет, сохраните карточку как «Черновик».'
        );
        setActiveTab('BASE');
        return;
      }
      if (!producerName.trim()) {
        setError('Для отправки в НКТ обязательно укажите наименование изготовителя (производителя). Без этого модератор НКТ возвращает заявку на доработку.');
        setActiveTab('PRODUCER');
        return;
      }
      if (!producerAddress.trim()) {
        setError('Для отправки в НКТ обязательно укажите фактический адрес производства. Без этого модератор НКТ возвращает заявку на доработку.');
        setActiveTab('PRODUCER');
        return;
      }
      if (!importerName.trim()) {
        setError('Для отправки в НКТ обязательно укажите организацию-импортера / заявителя в РК.');
        setActiveTab('PRODUCER');
        return;
      }
      if (!importerBin.trim() || importerBin.trim().length !== 12) {
        setError('Для отправки в НКТ обязательно укажите 12-значный БИН / ИИН импортера или заявителя в РК.');
        setActiveTab('PRODUCER');
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    const actualProducerName = producerSameAsImporter && importerName ? importerName : producerName;

    const payload = {
      accountId: selectedAccountId || undefined,
      category: selectedCategory,
      name: name.trim(),
      nameKk: nameKk.trim() || undefined,
      brand: brand.trim(),
      article: article.trim() || undefined,
      model: model.trim() || undefined,
      tnved: tnved.trim(),
      gtin: gtin.trim() || undefined,
      country: country.trim() || undefined,
      packageType,
      producerName: actualProducerName.trim() || undefined,
      producerAddress: producerAddress.trim() || undefined,
      importerName: importerName.trim() || undefined,
      importerBin: importerBin.trim() || undefined,
      certificateType: certificateType.trim() || undefined,
      certificateNumber: certificateNumber.trim() || undefined,
      certificateDate: certificateDate || undefined,
      certificateExpiryDate: certificateExpiryDate || undefined,
      gostOrTu: gostOrTu.trim() || undefined,
      netWeight: netWeight.trim() || undefined,
      grossWeight: grossWeight.trim() || undefined,
      photos,
      attributes: {
        ...customAttributes,
        ...(oktru.trim() ? { oktru: oktru.trim() } : {}),
        signEaes,
        markingRequired,
        isSzpt,
        measureUnit,
        quantity: measureQuantity,
      },
    };

    try {
      let cardId = cardToEdit?.id;
      if (cardToEdit) {
        await apiClient.put(`/markirovka/cards/${cardToEdit.id}`, payload);
      } else {
        const createRes = await apiClient.post('/markirovka/cards', payload);
        cardId = createRes.data?.card?.id;
      }

      if (submitToNktDirectly && cardId) {
        await apiClient.post(`/markirovka/cards/${cardId}/submit-nkt`);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Ошибка сохранения карточки');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSafeClose = () => {
    if (submitting) return;
    const hasData = Boolean(name.trim() || brand.trim() || article.trim() || gtin.trim() || tnved.trim());
    if (hasData) {
      if (window.confirm('В форме есть заполненные данные. Вы действительно хотите закрыть окно? Все несохраненные изменения будут потеряны.')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Renders category attributes form
  const renderCategoryAttributes = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <div>
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Характеристики категории: {categories.find((c) => c.category === selectedCategory)?.nameRu || selectedCategory}
          </h3>
          <p className="text-[11px] text-gray-500">
            Обязательные параметры для корректной модерации в Национальном Каталоге РК
          </p>
        </div>
        {loadingSchema && (
          <span className="text-xs text-[#0082FB] animate-pulse flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Загрузка справочников...
          </span>
        )}
      </div>

      {categorySchema?.fields && categorySchema.fields.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {categorySchema.fields.map((field) => {
            const val = customAttributes[field.id] ?? '';
            return (
              <div key={field.id} className="flex flex-col justify-end">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 min-h-[44px] flex items-end">
                  <span className="leading-snug line-clamp-2">
                    {field.name}
                    {field.nameKk && (
                      <span className="text-gray-400 font-normal ml-1">({field.nameKk})</span>
                    )}
                    {field.required && <span className="text-rose-500 ml-1">*</span>}
                  </span>
                </label>

                {field.type === 'select' ? (
                  <select
                    value={val}
                    onChange={(e) => handleAttrChange(field.id, e.target.value)}
                    className="w-full h-10 px-3.5 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 text-xs transition-all cursor-pointer shadow-2xs"
                  >
                    <option value="">-- Выберите --</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'number' ? (
                  <input
                    type="number"
                    value={val}
                    onChange={(e) => handleAttrChange(field.id, e.target.value)}
                    placeholder={field.placeholder || '0'}
                    className="w-full h-10 px-3.5 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 text-xs transition-all shadow-2xs"
                  />
                ) : (
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => handleAttrChange(field.id, e.target.value)}
                    placeholder={field.placeholder || ''}
                    className="w-full h-10 px-3.5 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 text-xs transition-all shadow-2xs"
                  />
                )}

                {field.hint && (
                  <p className="text-[10px] text-gray-400 mt-1">{field.hint}</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 text-center text-gray-400 text-xs bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
          Для выбранной категории дополнительных обязательных характеристик не требуется.
        </div>
      )}
    </div>
  );

  // Renders media / photos upload
  const renderPhotosSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <div>
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Фотографии продукции
          </h3>
          <p className="text-[11px] text-gray-500">
            Требуется минимум 1 фото (лицевая сторона и потребительская упаковка)
          </p>
        </div>
        {photos.length > 0 && (
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
            Загружено: {photos.length}
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        onChange={async (e) => {
          const files = e.target.files;
          if (!files || files.length === 0) return;
          setUploadingPhoto(true);
          setError(null);
          try {
            const uploadedUrls: string[] = [];
            for (let i = 0; i < files.length; i++) {
              const file = files[i];
              const formData = new FormData();
              formData.append('file', file);
              const res = await apiClient.post('/markirovka/cards/upload-photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
              });
              if (res.data?.url) {
                uploadedUrls.push(res.data.url);
              }
            }
            setPhotos((prev) => [...prev, ...uploadedUrls]);
          } catch (err: any) {
            setError(err.response?.data?.message || 'Ошибка загрузки фото');
          } finally {
            setUploadingPhoto(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        }}
        className="hidden"
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 hover:border-[#0082FB] bg-gray-50/60 hover:bg-blue-50/20 rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col sm:flex-row items-center justify-center gap-3 group"
      >
        <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 group-hover:border-blue-200 flex items-center justify-center text-[#0082FB] shadow-2xs shrink-0">
          {uploadingPhoto ? (
            <Loader2 className="w-5 h-5 animate-spin text-[#0082FB]" />
          ) : (
            <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
          )}
        </div>
        <div className="text-center sm:text-left">
          <p className="text-xs font-bold text-gray-800">
            {uploadingPhoto ? 'Загрузка фотографий на сервер...' : 'Нажмите для выбора фото с компьютера / телефона'}
          </p>
          <p className="text-[11px] text-gray-500">
            Поддерживаются JPG, PNG, WEBP. Можно прикрепить несколько фото.
          </p>
        </div>
      </div>



      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-1">
          {photos.map((url, idx) => (
            <div
              key={idx}
              className="relative rounded-2xl border border-gray-200 p-1.5 bg-gray-50 group flex flex-col items-center"
            >
              <img
                src={url}
                alt="Фото товара"
                className="w-full h-20 object-cover rounded-xl"
                onError={(e) => {
                  (e.target as any).src =
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23eee" width="100" height="100"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23aaa" font-size="12">Фото</text></svg>';
                }}
              />
              <button
                type="button"
                onClick={() => handleRemovePhoto(idx)}
                className="absolute top-2.5 right-2.5 p-1 rounded-full bg-rose-600 text-white shadow-xs opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
                title="Удалить фото"
              >
                <X className="w-3 h-3" />
              </button>
              <span className="text-[10px] text-gray-400 mt-1 truncate max-w-full">
                #{idx + 1}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Renders Producer & Importer block (Mandatory for NKT moderation)
  const renderProducerImporterSection = () => (
    <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#0082FB]" />
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Сведения об изготовителе и импортере в РК <span className="text-rose-500">*</span>
            </h4>
            <p className="text-[11px] text-gray-500">
              Обязательные данные для модерации в НКТ (без них заявку возвращают на доработку)
            </p>
          </div>
        </div>
        {currentAccount && (
          <button
            type="button"
            onClick={handleFillCompanyDetails}
            className="text-xs text-[#0082FB] hover:text-[#0070DA] font-semibold flex items-center gap-1.5 cursor-pointer bg-blue-50/80 hover:bg-blue-100/80 px-2.5 py-1.5 rounded-xl transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0082FB]" />
            Заполнить из организации ({currentAccount.name && currentAccount.name !== 'щ' ? currentAccount.name : 'Мой аккаунт'})
          </button>
        )}
      </div>

      {/* Importer details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
        <div className="flex flex-col justify-end">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 h-5 flex items-center">
            Импортер / Заявитель в РК <span className="text-rose-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={importerName}
            onChange={(e) => {
              setImporterName(e.target.value);
              if (producerSameAsImporter) {
                setProducerName(e.target.value);
              }
            }}
            placeholder="ТОО Компания КЗ или ИП"
            className="w-full h-10 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 text-xs shadow-2xs"
          />
        </div>
        <div className="flex flex-col justify-end">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 h-5 flex items-center">
            БИН / ИИН импортера или заявителя в РК <span className="text-rose-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={importerBin}
            onChange={(e) => setImporterBin(e.target.value.replace(/\D/g, ''))}
            placeholder="12-значный БИН / ИИН"
            maxLength={12}
            className="w-full h-10 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 font-mono text-xs shadow-2xs"
          />
        </div>
      </div>

      {/* Checkbox: Producer same as importer */}
      <div className="pt-1">
        <label className="inline-flex items-center gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100/80 p-2.5 rounded-xl border border-gray-200/60 transition-colors w-full sm:w-auto">
          <input
            type="checkbox"
            checked={producerSameAsImporter}
            onChange={(e) => {
              const checked = e.target.checked;
              setProducerSameAsImporter(checked);
              if (checked) {
                if (importerName) setProducerName(importerName);
                if (!producerAddress) setProducerAddress('Республика Казахстан, г. Алматы');
              }
            }}
            className="rounded text-[#0082FB] focus:ring-[#0082FB]/20 cursor-pointer"
          />
          <span className="text-xs text-gray-800 font-medium">
            Изготовитель совпадает с организацией-импортером / заявителем (производство в РК)
          </span>
        </label>
      </div>

      {/* Producer Name & Factory Address (ALWAYS VISIBLE AND EDITABLE!) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
        <div className="flex flex-col justify-end">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 h-5 flex items-center">
            Наименование изготовителя (Производитель) <span className="text-rose-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={producerName}
            onChange={(e) => setProducerName(e.target.value)}
            placeholder="ТОО Фабрика Обуви, ExxonMobil Co., Ltd"
            className="w-full h-10 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 text-xs shadow-2xs"
          />
        </div>
        <div className="flex flex-col justify-end">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 h-5 flex items-center">
            Фактический адрес производства <span className="text-rose-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={producerAddress}
            onChange={(e) => setProducerAddress(e.target.value)}
            placeholder="г. Алматы, пр. Райымбека, 120 / Турция, г. Измир"
            className="w-full h-10 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 text-xs shadow-2xs"
          />
        </div>
      </div>
    </div>
  );

  // Renders Signs (Признаки) and Measure units (Единицы измерения)
  const renderSignsAndMeasuresSection = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. ПРИЗНАКИ */}
      <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Признаки товара
            </h4>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">Стандарты ЕАЭС</span>
        </div>

        <div className="space-y-2.5">
          {/* Знак ЕАЭС */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-200/60 hover:bg-gray-100/60 transition-colors">
            <div className="flex flex-col pr-2">
              <span className="text-xs font-semibold text-gray-900">Знак ЕАЭС</span>
              <span className="text-[11px] text-gray-500">Товар официально выпущен в обращение в странах ЕАЭС</span>
            </div>
            <button
              type="button"
              onClick={() => setSignEaes(!signEaes)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                signEaes ? 'bg-[#0082FB]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  signEaes ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>


          {/* СЗПТ */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-200/60 hover:bg-gray-100/60 transition-colors">
            <div className="flex flex-col pr-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-900">СЗПТ</span>
                <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-gray-200 text-gray-600 text-[10px]" title="Социально значимые продовольственные товары">
                  ?
                </span>
              </div>
              <span className="text-[11px] text-gray-500">Социально значимый продовольственный товар</span>
            </div>
            <button
              type="button"
              onClick={() => setIsSzpt(!isSzpt)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isSzpt ? 'bg-[#0082FB]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isSzpt ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 2. ЕДИНИЦЫ ИЗМЕРЕНИЯ */}
      <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-purple-600" />
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Единицы измерения
            </h4>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">Обязательные поля НКТ</span>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Единица измерения <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <span className="text-[11px] text-gray-400">
                {measureUnit === '796' ? 'Экономические единицы / Штука' :
                 measureUnit === '112' ? 'Единицы объема / Литр' :
                 measureUnit === '111' ? 'Единицы объема / Миллилитр' :
                 measureUnit === '166' ? 'Единицы массы / Килограмм' :
                 measureUnit === '163' ? 'Единицы массы / Грамм' : 'Комплект / Набор'}
              </span>
            </div>
            <select
              value={measureUnit}
              onChange={(e) => setMeasureUnit(e.target.value)}
              className="w-full h-10 px-3.5 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 text-xs shadow-2xs"
            >
              <option value="796">Штука (796)</option>
              <option value="112">Литр (112)</option>
              <option value="111">Миллилитр (111)</option>
              <option value="166">Килограмм (166)</option>
              <option value="163">Грамм (163)</option>
              <option value="642">Комплект / Единица (642)</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Количественное значение (в [ед. изм.]) <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <span className="text-[11px] text-gray-400 font-medium text-amber-600">Обязательное</span>
            </div>
            <input
              type="text"
              value={measureQuantity}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, '');
                setMeasureQuantity(val);
              }}
              placeholder="1"
              className="w-full h-10 px-3.5 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 text-xs shadow-2xs font-mono"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Укажите числовое значение: например "1" (штука) или "4" (литра), "0.5"
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Renders Advanced / Optional details (Certifications, Logistics & Weights)
  const renderAdvancedDetails = () => (
    <div className="space-y-5 pt-1">
      {/* Certification */}
      <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200/80 space-y-3.5">
        <div className="flex items-center gap-2 border-b border-gray-200/60 pb-2">
          <FileCheck className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            Сертификация и нормативные документы (ЕАЭС / РК)
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Вид разрешительного документа
            </label>
            <select
              value={certificateType}
              onChange={(e) => setCertificateType(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 transition-all text-xs"
            >
              <option value="">-- Не требуется / Не выбран --</option>
              <option value="Декларация о соответствии ЕАЭС">Декларация о соответствии ЕАЭС (ЕАС)</option>
              <option value="Сертификат соответствия ЕАЭС">Сертификат соответствия ЕАЭС (ЕАС)</option>
              <option value="Свидетельство о гос. регистрации (СГР)">Свидетельство о гос. регистрации (СГР)</option>
              <option value="Отказное письмо / Не подлежит">Отказное письмо / Не подлежит сертификации</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Номер документа соответствия
            </label>
            <input
              type="text"
              value={certificateNumber}
              onChange={(e) => setCertificateNumber(e.target.value)}
              placeholder="ЕАЭС N RU Д-CN.РА01.В.12345/24"
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 transition-all text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Дата выдачи документа
            </label>
            <input
              type="date"
              value={certificateDate}
              onChange={(e) => setCertificateDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 transition-all text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Срок действия документа (до)
            </label>
            <input
              type="date"
              value={certificateExpiryDate}
              onChange={(e) => setCertificateExpiryDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 transition-all text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Нормативный документ (ГОСТ / ТУ / СТ РК)
            </label>
            <input
              type="text"
              value={gostOrTu}
              onChange={(e) => setGostOrTu(e.target.value)}
              placeholder="ГОСТ 26167-2005 / СТ РК"
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 transition-all text-xs"
            />
          </div>
        </div>
      </div>

      {/* Logistics & Weights */}
      <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200/80 space-y-3.5">
        <div className="flex items-center gap-2 border-b border-gray-200/60 pb-2">
          <Scale className="w-4 h-4 text-purple-600" />
          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            Масса и срок годности
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Масса нетто (чистый вес)
            </label>
            <input
              type="text"
              value={netWeight}
              onChange={(e) => setNetWeight(e.target.value)}
              placeholder="450 г / 1.2 кг / 500 мл"
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 transition-all text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Масса брутто (с упаковкой)
            </label>
            <input
              type="text"
              value={grossWeight}
              onChange={(e) => setGrossWeight(e.target.value)}
              placeholder="520 г / 1.4 кг"
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 transition-all text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Срок годности / условия хранения
            </label>
            <input
              type="text"
              value={shelfLife}
              onChange={(e) => setShelfLife(e.target.value)}
              placeholder="24 мес / Не ограничен"
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 transition-all text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const { backdropProps, dialogProps } = useModalBehavior({ onClose });

  return createPortal(
    <div
      {...backdropProps}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150 select-auto"
    >
      <div
        {...dialogProps}
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-white to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0082FB]/10 text-[#0082FB] flex items-center justify-center border border-[#0082FB]/20 shadow-2xs">
              <Package className="w-5 h-5 text-[#0082FB]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900">
                {cardToEdit ? 'Редактирование карточки товара' : 'Создание карточки товара (НКТ / Маркировка КЗ)'}
              </h2>
              <p className="text-[11px] text-gray-500">
                Регистрация характеристик продукции в Национальном каталоге РК (GS1 / ИС МПТ)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 border border-gray-200/60">
              <button
                type="button"
                onClick={() => setViewMode('EXPRESS')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'EXPRESS'
                    ? 'bg-white text-[#0082FB] shadow-2xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Все ключевые поля на одном экране"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Экспресс-вид</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('TABS')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'TABS'
                    ? 'bg-white text-[#0082FB] shadow-2xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Пошаговое заполнение по вкладкам"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">По вкладкам</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleSafeClose}
              disabled={submitting}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              title="Закрыть окно"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation (only when in TABS mode) */}
        {viewMode === 'TABS' && (
          <div
            className="px-6 pt-2 bg-gray-50/50 border-b border-gray-100 flex gap-2 overflow-x-auto shrink-0 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {[
              { id: 'BASE', label: '1. Основные реквизиты', icon: Tag },
              { id: 'CATEGORY', label: '2. Специфика категории', icon: Layers },
              { id: 'PRODUCER', label: '3. Изготовитель / Импортер', icon: Building2 },
              { id: 'CERT', label: '4. Сертификация и ГОСТ', icon: FileCheck },
              { id: 'LOGISTICS', label: '5. Вес и хранение', icon: Scale },
              { id: 'MEDIA', label: '6. Фотографии', icon: Camera },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-3 text-xs font-semibold rounded-t-xl flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'border-[#0082FB] text-[#0082FB] bg-white shadow-2xs'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm bg-white">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Внимание</p>
                <p className="mt-0.5 text-rose-700">{error}</p>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW MODE 1: EXPRESS MODE (ALL ESSENTIAL ON 1 SCREEN)   */}
          {/* ======================================================== */}
          {viewMode === 'EXPRESS' && (
            <div className="space-y-6">
              
              {/* BLOCK 1: CATEGORY & ACCOUNT */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/50 via-white to-white border border-blue-100/80">
                <div className={`grid grid-cols-1 ${accounts.length > 1 ? 'sm:grid-cols-2' : ''} gap-4`}>
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1.5">
                      Товарная группа маркировки <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setCustomAttributes({});
                      }}
                      disabled={Boolean(cardToEdit)}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 font-semibold text-xs transition-all cursor-pointer shadow-xs"
                    >
                      {categories.map((c) => (
                        <option key={c.category} value={c.category}>
                          {c.nameRu} ({c.nameKk})
                        </option>
                      ))}
                    </select>
                  </div>

                  {accounts.length > 1 && (
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1.5">
                        Организация-заявитель
                      </label>
                      <select
                        value={selectedAccountId}
                        onChange={(e) => setSelectedAccountId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 font-medium text-xs transition-all cursor-pointer shadow-xs"
                      >
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name && acc.name !== 'щ' ? acc.name : 'Основная организация'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* BLOCK 2: PRODUCT NAMES (WITH AUTO-TRANSLATE) */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 h-5 flex items-center">
                      Наименование товара (на русском языке) <span className="text-rose-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Например: Кроссовки мужские кожаные Classic Sport"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 transition-all text-xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5 h-5">
                      <label className="block text-xs font-semibold text-gray-700 truncate">
                        Наименование (на казахском языке)
                      </label>
                      <button
                        type="button"
                        onClick={handleTranslateKk}
                        disabled={translatingKk || !name.trim()}
                        className="text-[11px] text-[#0082FB] hover:text-[#0070DA] font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40 transition-colors shrink-0 bg-blue-50/90 hover:bg-blue-100 px-2 py-0.5 rounded-md"
                        title="Автоматически перевести название на казахский язык"
                      >
                        {translatingKk ? (
                          <Loader2 className="w-3 h-3 animate-spin text-[#0082FB]" />
                        ) : (
                          <Languages className="w-3 h-3 text-[#0082FB]" />
                        )}
                        <span>⚡ Перевести</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={nameKk}
                      onChange={(e) => setNameKk(e.target.value)}
                      placeholder="Мысалы: Ерлерге арналған былғары кроссовкасы"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 transition-all text-xs"
                    />
                  </div>
                </div>

                {/* Brand, Article, Model */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Бренд / Торговая марка <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="Nike, Zara, Mobil, Без бренда..."
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 transition-all text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Артикул производителя
                    </label>
                    <input
                      type="text"
                      value={article}
                      onChange={(e) => setArticle(e.target.value)}
                      placeholder="ART-8892-BLK"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 transition-all text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Модель / Модификация
                    </label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="Air Max / Sport Pro / 5W-30"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 transition-all text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* BLOCK 3: CODES & CLASSIFIERS (TNVED, OKTRU, GTIN) */}
              <div className="p-4 rounded-2xl bg-gray-50/60 border border-gray-200/80 space-y-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Коды классификатора и идентификации
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                  
                  {/* TN VED */}
                  <div className="flex flex-col justify-end">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 h-5 flex items-center">
                      Код ТН ВЭД ЕАЭС (10 знаков) <span className="text-rose-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={tnved}
                      onChange={(e) => setTnved(e.target.value.replace(/\D/g, ''))}
                      placeholder="2710198200"
                      maxLength={10}
                      className="w-full h-10 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 font-mono transition-all text-xs shadow-2xs"
                    />
                    
                    {categorySchema?.tnvedExamples && categorySchema.tnvedExamples.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1 h-5">
                        <span className="text-[10px] text-gray-400">Примеры:</span>
                        {categorySchema.tnvedExamples.map((ex) => (
                          <button
                            key={ex}
                            type="button"
                            onClick={() => setTnved(ex.length === 4 ? `${ex}900000` : ex)}
                            className="px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-[#0082FB] font-mono text-[10px] font-medium transition-colors cursor-pointer"
                            title={`Нажмите, чтобы вставить пример кода ${ex}`}
                          >
                            +{ex}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* OKTRU */}
                  <div className="flex flex-col justify-end">
                    <div className="flex items-center justify-between mb-1.5 h-5">
                      <label className="block text-xs font-semibold text-gray-700">
                        Код ОКТРУ (Каталог НКТ)
                      </label>
                      {categorySchema?.defaultOktru && (
                        <button
                          type="button"
                          onClick={() => {
                            setOktru(categorySchema.defaultOktru || '');
                            setIsCustomOktru(false);
                          }}
                          className="text-[10px] text-[#0082FB] hover:underline font-medium cursor-pointer"
                          title="Вернуть стандартный код ОКТРУ"
                        >
                          Сбросить
                        </button>
                      )}
                    </div>

                    {!isCustomOktru && categorySchema?.oktruPresets && categorySchema.oktruPresets.length > 0 ? (
                      <div>
                        <select
                          value={categorySchema.oktruPresets.some((p) => p.code === oktru) ? oktru : '__CUSTOM__'}
                          onChange={(e) => {
                            if (e.target.value === '__CUSTOM__') {
                              setIsCustomOktru(true);
                            } else {
                              setOktru(e.target.value);
                            }
                          }}
                          className="w-full h-10 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-800 text-xs transition-all cursor-pointer shadow-2xs"
                        >
                          {categorySchema.oktruPresets.map((p) => (
                            <option key={p.code} value={p.code}>
                              {p.nameRu} ({p.code.slice(0, 14)}...)
                            </option>
                          ))}
                          <option value="__CUSTOM__">✏️ Ввести другой код вручную...</option>
                        </select>
                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-500 h-5">
                          <span className="font-mono text-gray-600 truncate max-w-[180px]" title={oktru}>
                            Код: {oktru || 'Не выбран'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(oktru);
                              setCopiedOktru(true);
                              setTimeout(() => setCopiedOktru(false), 2000);
                            }}
                            className="text-[#0082FB] hover:underline flex items-center gap-0.5 cursor-pointer shrink-0"
                          >
                            {copiedOktru ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                            <span>{copiedOktru ? 'Скопирован' : 'Копировать'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={oktru}
                            onChange={(e) => setOktru(e.target.value)}
                            placeholder={categorySchema?.defaultOktru || '1087-0001-0001-100045841'}
                            className="flex-1 h-10 px-3 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 font-mono transition-all text-xs"
                          />
                          {categorySchema?.oktruPresets && categorySchema.oktruPresets.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomOktru(false);
                                if (categorySchema.defaultOktru) {
                                  setOktru(categorySchema.defaultOktru);
                                }
                              }}
                              className="px-2.5 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl text-[11px] text-gray-700 font-semibold transition-colors cursor-pointer shrink-0"
                              title="Вернуться к выбору из списка"
                            >
                              Список
                            </button>
                          )}
                        </div>
                        <p className="mt-1.5 text-[10px] text-gray-400 h-5">
                          Ручной ввод ОКТРУ
                        </p>
                      </div>
                    )}
                  </div>

                  {/* GTIN */}
                  <div className="flex flex-col justify-end">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 h-5 flex items-center">
                      Штрихкод GTIN (EAN-13 / GS1)
                    </label>
                    <input
                      type="text"
                      value={gtin}
                      onChange={(e) => setGtin(e.target.value.replace(/\D/g, ''))}
                      placeholder="13 или 14 цифр"
                      maxLength={14}
                      className="w-full h-10 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 font-mono transition-all text-xs shadow-2xs"
                    />
                    <p className="mt-1.5 text-[10px] text-amber-600 font-medium h-5 flex items-center">
                      Обязателен при отправке в НКТ
                    </p>
                  </div>

                  {/* Country */}
                  <div className="flex flex-col justify-end">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 h-5 flex items-center">
                      Страна происхождения
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full h-10 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 transition-all text-xs cursor-pointer shadow-2xs"
                    >
                      <option value="Казахстан">Казахстан (KZ)</option>
                      <option value="Китай">Китай (CN)</option>
                      <option value="Турция">Турция (TR)</option>
                      <option value="Россия">Россия (RU)</option>
                      <option value="Узбекистан">Узбекистан (UZ)</option>
                      <option value="Кыргызстан">Кыргызстан (KG)</option>
                      <option value="Беларусь">Беларусь (BY)</option>
                      <option value="Германия">Германия (DE)</option>
                      <option value="Италия">Италия (IT)</option>
                      <option value="Вьетнам">Вьетнам (VN)</option>
                      <option value="Индия">Индия (IN)</option>
                      <option value="Другая страна">Другая страна</option>
                    </select>
                  </div>

                  {/* Package Type */}
                  <div className="flex flex-col justify-end">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 h-5 flex items-center">
                      Тип упаковки
                    </label>
                    <select
                      value={packageType}
                      onChange={(e) => setPackageType(e.target.value)}
                      className="w-full h-10 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 transition-all text-xs cursor-pointer shadow-2xs"
                    >
                      <option value="UNIT">Потребительская / Единичная (UNIT)</option>
                      <option value="GROUP">Групповая упаковка (GROUP)</option>
                      <option value="SET">Транспортный комплект (SET)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* BLOCK 4: CATEGORY SPECIFIC FIELDS */}
              <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs">
                {renderCategoryAttributes()}
              </div>

              {/* BLOCK 5: PRODUCER & IMPORTER (MANDATORY FOR NKT) */}
              {renderProducerImporterSection()}

              {/* BLOCK: SIGNS & MEASURE UNITS */}
              {renderSignsAndMeasuresSection()}

              {/* BLOCK 6: PHOTOS */}
              <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs">
                {renderPhotosSection()}
              </div>

              {/* BLOCK 7: OPTIONAL ACCORDION (CERTS & WEIGHTS) */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                <button
                  type="button"
                  onClick={() => setShowAdvancedInExpress(!showAdvancedInExpress)}
                  className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-gray-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <FileCheck className="w-4 h-4 text-gray-500" />
                    <div>
                      <span className="text-xs font-bold text-gray-800">
                        Дополнительно: Сертификация и ГОСТ, Вес и хранение
                      </span>
                      <span className="text-[11px] text-gray-400 block sm:inline sm:ml-2">
                        Опционально (заполняется при наличии разрешительных документов)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#0082FB] font-semibold">
                    <span>{showAdvancedInExpress ? 'Скрыть' : 'Раскрыть'}</span>
                    {showAdvancedInExpress ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {showAdvancedInExpress && (
                  <div className="p-5 border-t border-gray-100 bg-gray-50/30">
                    {renderAdvancedDetails()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW MODE 2: TABS MODE (FOR USERS PREFERRING TABS)       */}
          {/* ======================================================== */}
          {viewMode === 'TABS' && (
            <div>
              {/* TAB 1: BASE FIELDS */}
              {activeTab === 'BASE' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/50 via-white to-white border border-blue-100/80">
                    <div className={`grid grid-cols-1 ${accounts.length > 1 ? 'sm:grid-cols-2' : ''} gap-4`}>
                      <div>
                        <label className="block text-xs font-bold text-gray-800 mb-1.5">
                          Товарная группа маркировки <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={selectedCategory}
                          onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            setCustomAttributes({});
                          }}
                          disabled={Boolean(cardToEdit)}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 font-semibold text-xs cursor-pointer shadow-xs"
                        >
                          {categories.map((c) => (
                            <option key={c.category} value={c.category}>
                              {c.nameRu} ({c.nameKk})
                            </option>
                          ))}
                        </select>
                      </div>

                      {accounts.length > 1 && (
                        <div>
                          <label className="block text-xs font-bold text-gray-800 mb-1.5">
                            Организация-заявитель
                          </label>
                          <select
                            value={selectedAccountId}
                            onChange={(e) => setSelectedAccountId(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 font-medium text-xs cursor-pointer shadow-xs"
                          >
                            {accounts.map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {acc.name && acc.name !== 'щ' ? acc.name : 'Основная организация'}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5 h-5 flex items-center">
                        Наименование товара (на русском языке) <span className="text-rose-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Например: Кроссовки мужские кожаные Classic Sport"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 transition-all text-xs"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5 h-5">
                        <label className="block text-xs font-semibold text-gray-700 truncate">
                          Наименование (на казахском языке)
                        </label>
                        <button
                          type="button"
                          onClick={handleTranslateKk}
                          disabled={translatingKk || !name.trim()}
                          className="text-[11px] text-[#0082FB] hover:text-[#0070DA] font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40 shrink-0 bg-blue-50/90 hover:bg-blue-100 px-2 py-0.5 rounded-md transition-colors"
                        >
                          {translatingKk ? <Loader2 className="w-3 h-3 animate-spin text-[#0082FB]" /> : <Languages className="w-3 h-3 text-[#0082FB]" />}
                          <span>⚡ Перевести</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={nameKk}
                        onChange={(e) => setNameKk(e.target.value)}
                        placeholder="Мысалы: Ерлерге арналған былғары кроссовкасы"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 transition-all text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Бренд / Торговая марка <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="Nike, Mobil, Zara..."
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 transition-all text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Артикул производителя
                      </label>
                      <input
                        type="text"
                        value={article}
                        onChange={(e) => setArticle(e.target.value)}
                        placeholder="ART-8892-BLK"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 transition-all text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Модель / Модификация
                      </label>
                      <input
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="Air Max / Sport Pro"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 transition-all text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Код ТН ВЭД ЕАЭС (10 знаков) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={tnved}
                        onChange={(e) => setTnved(e.target.value.replace(/\D/g, ''))}
                        placeholder="6403999800"
                        maxLength={10}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 font-mono transition-all text-xs"
                      />
                      {categorySchema?.tnvedExamples && categorySchema.tnvedExamples.length > 0 && (
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <span className="text-[10px] text-gray-400">Примеры:</span>
                          {categorySchema.tnvedExamples.map((ex) => (
                            <button
                              key={ex}
                              type="button"
                              onClick={() => setTnved(ex.length === 4 ? `${ex}900000` : ex)}
                              className="px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-[#0082FB] font-mono text-[10px] font-medium transition-colors cursor-pointer"
                            >
                              +{ex}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-gray-700">
                          Код ОКТРУ
                        </label>
                        {categorySchema?.defaultOktru && (
                          <button
                            type="button"
                            onClick={() => {
                              setOktru(categorySchema.defaultOktru || '');
                              setIsCustomOktru(false);
                            }}
                            className="text-[10px] text-[#0082FB] hover:underline font-medium cursor-pointer"
                          >
                            Сбросить
                          </button>
                        )}
                      </div>

                      {!isCustomOktru && categorySchema?.oktruPresets && categorySchema.oktruPresets.length > 0 ? (
                        <select
                          value={categorySchema.oktruPresets.some((p) => p.code === oktru) ? oktru : '__CUSTOM__'}
                          onChange={(e) => {
                            if (e.target.value === '__CUSTOM__') {
                              setIsCustomOktru(true);
                            } else {
                              setOktru(e.target.value);
                            }
                          }}
                          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-800 text-xs transition-all cursor-pointer"
                        >
                          {categorySchema.oktruPresets.map((p) => (
                            <option key={p.code} value={p.code}>
                              {p.nameRu} ({p.code.slice(0, 14)}...)
                            </option>
                          ))}
                          <option value="__CUSTOM__">Ввести другой вручную...</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={oktru}
                          onChange={(e) => setOktru(e.target.value)}
                          placeholder={categorySchema?.defaultOktru || '1087-0001-0001-100045841'}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 font-mono transition-all text-xs"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Штрихкод GTIN (EAN-13)
                      </label>
                      <input
                        type="text"
                        value={gtin}
                        onChange={(e) => setGtin(e.target.value.replace(/\D/g, ''))}
                        placeholder="13 или 14 цифр"
                        maxLength={14}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 font-mono transition-all text-xs"
                      />
                      <p className="mt-1 text-[10px] text-amber-600 font-medium">
                        Обязателен при отправке в НКТ
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Страна происхождения
                      </label>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 text-xs"
                      >
                        <option value="Казахстан">Казахстан (KZ)</option>
                        <option value="Китай">Китай (CN)</option>
                        <option value="Турция">Турция (TR)</option>
                        <option value="Россия">Россия (RU)</option>
                        <option value="Узбекистан">Узбекистан (UZ)</option>
                        <option value="Кыргызстан">Кыргызстан (KG)</option>
                        <option value="Беларусь">Беларусь (BY)</option>
                        <option value="Другая страна">Другая страна</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Тип упаковки
                      </label>
                      <select
                        value={packageType}
                        onChange={(e) => setPackageType(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 text-xs"
                      >
                        <option value="UNIT">Потребительская / Единичная (UNIT)</option>
                        <option value="GROUP">Групповая упаковка (GROUP)</option>
                        <option value="SET">Транспортный комплект (SET)</option>
                      </select>
                    </div>
                  </div>

                  {/* Signs & Measure units in tab 1 */}
                  {renderSignsAndMeasuresSection()}
                </div>
              )}

              {/* TAB 2: CATEGORY SPECIFIC FIELDS */}
              {activeTab === 'CATEGORY' && renderCategoryAttributes()}

              {/* TAB 3: PRODUCER & IMPORTER */}
              {activeTab === 'PRODUCER' && renderProducerImporterSection()}

              {/* TAB 4: CERTIFICATION & STANDARDS */}
              {activeTab === 'CERT' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">
                    Подтверждение соответствия (Разрешительные документы ЕАЭС / РК)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Вид разрешительного документа
                      </label>
                      <select
                        value={certificateType}
                        onChange={(e) => setCertificateType(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 text-xs"
                      >
                        <option value="">-- Выберите вид документа --</option>
                        <option value="Декларация о соответствии ЕАЭС">Декларация о соответствии ЕАЭС (ЕАС)</option>
                        <option value="Сертификат соответствия ЕАЭС">Сертификат соответствия ЕАЭС (ЕАС)</option>
                        <option value="Свидетельство о гос. регистрации (СГР)">Свидетельство о гос. регистрации (СГР)</option>
                        <option value="Отказное письмо / Не подлежит">Отказное письмо / Не подлежит сертификации</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Номер документа соответствия
                      </label>
                      <input
                        type="text"
                        value={certificateNumber}
                        onChange={(e) => setCertificateNumber(e.target.value)}
                        placeholder="ЕАЭС N RU Д-CN.РА01.В.12345/24"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Дата выдачи документа
                      </label>
                      <input
                        type="date"
                        value={certificateDate}
                        onChange={(e) => setCertificateDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Срок действия документа (до)
                      </label>
                      <input
                        type="date"
                        value={certificateExpiryDate}
                        onChange={(e) => setCertificateExpiryDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Нормативный документ (ГОСТ / ТУ / СТ РК)
                      </label>
                      <input
                        type="text"
                        value={gostOrTu}
                        onChange={(e) => setGostOrTu(e.target.value)}
                        placeholder="ГОСТ 26167-2005 / СТ РК"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: LOGISTICS & SHELF LIFE */}
              {activeTab === 'LOGISTICS' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">
                    Логистические параметры, масса и условия хранения
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Масса нетто (чистый вес)
                      </label>
                      <input
                        type="text"
                        value={netWeight}
                        onChange={(e) => setNetWeight(e.target.value)}
                        placeholder="450 г / 1.2 кг / 500 мл"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Масса брутто (с упаковкой)
                      </label>
                      <input
                        type="text"
                        value={grossWeight}
                        onChange={(e) => setGrossWeight(e.target.value)}
                        placeholder="520 г / 1.4 кг"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Срок годности / условия хранения
                      </label>
                      <input
                        type="text"
                        value={shelfLife}
                        onChange={(e) => setShelfLife(e.target.value)}
                        placeholder="24 мес / Не ограничен"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: PHOTOS & MEDIA */}
              {activeTab === 'MEDIA' && renderPhotosSection()}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>
              Категория:{' '}
              <strong className="text-gray-800">
                {categories.find((c) => c.category === selectedCategory)?.nameRu || selectedCategory}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSafeClose}
              disabled={submitting}
              className="py-2.5 px-4 rounded-xl border border-gray-300 hover:bg-gray-100 font-semibold text-xs text-gray-700 transition-all cursor-pointer"
            >
              Отмена
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-900 text-white font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Сохранить черновик</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              className="py-2.5 px-5 rounded-xl bg-[#0082FB] hover:bg-[#0070DA] text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Отправить в НКТ</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
