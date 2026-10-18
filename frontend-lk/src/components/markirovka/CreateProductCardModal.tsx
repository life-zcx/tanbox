import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Send,
  Save,
  AlertCircle,
  HelpCircle,
  Package,
  Layers,
  Globe,
  Tag,
  Building2,
  FileCheck,
  Scale,
  Camera,
  CheckCircle2,
  Filter,
  Upload,
  Loader2,
} from 'lucide-react';
import { apiClient } from '../../api/client';

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
  const [categorySchema, setCategorySchema] = useState<{ fields: FieldDefinition[]; tnvedExamples: string[] } | null>(null);

  // Active form section
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

  // Producer & Importer fields
  const [producerName, setProducerName] = useState(cardToEdit?.producerName || '');
  const [producerAddress, setProducerAddress] = useState(cardToEdit?.producerAddress || '');
  const [importerName, setImporterName] = useState(cardToEdit?.importerName || '');
  const [importerBin, setImporterBin] = useState(cardToEdit?.importerBin || '');

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

      // Auto-select first account if not editing (without forcing category)
      if (!cardToEdit && accs.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accs[0].id);
      }
    });
  }, []);

  // Selected account object
  const currentAccount = accounts.find((a) => a.id === selectedAccountId);

  // When account changes, optionally auto-fill importer details
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
          setCategorySchema(res.data.schema);
          if (!cardToEdit && !tnved && res.data.schema.tnvedExamples?.[0]) {
            setTnved(res.data.schema.tnvedExamples[0]);
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

  // Filter categories by selected account if enabled
  const visibleCategories =
    currentAccount?.categories?.length && showOnlyAccountCategories
      ? categories.filter((c) => currentAccount.categories.includes(c.category))
      : categories;

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
    if (submitToNktDirectly && !gtin.trim()) {
      setError(
        'Для отправки в Национальный каталог (НКТ) обязательно укажите штрихкод GTIN (13 или 14 цифр). Если штрихкода пока нет, сохраните карточку как «Черновик».'
      );
      setActiveTab('BASE');
      return;
    }

    setSubmitting(true);
    setError(null);

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
      producerName: producerName.trim() || undefined,
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

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/60 via-white to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0082FB]/10 text-[#0082FB] flex items-center justify-center border border-[#0082FB]/20 shadow-2xs">
              <Package className="w-5 h-5 text-[#0082FB]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                {cardToEdit ? 'Редактирование карточки товара' : 'Создание карточки товара (НКТ / Маркировка КЗ)'}
              </h2>
              <p className="text-xs text-gray-500">
                Регистрация характеристик продукции в Национальном каталоге РК (GS1 / ИС МПТ)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-2 bg-gray-50/50 border-b border-gray-100 flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
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
                className={`py-2.5 px-3.5 text-xs font-semibold rounded-t-xl flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
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

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm bg-white">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Ошибка валидации карточки</p>
                <p className="mt-0.5 text-rose-700">{error}</p>
              </div>
            </div>
          )}

          {/* TAB 1: BASE FIELDS */}
          {activeTab === 'BASE' && (
            <div className="space-y-5">
              {/* Category Selector (and optional organization selector if multiple) */}
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

              {/* Product Names (Bilingual) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Наименование товара (на русском языке) <span className="text-rose-500">*</span>
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
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Товардың қазақ тіліндегі атауы (на казахском языке)
                  </label>
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
                    placeholder="Nike, Zara, Без бренда..."
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
                    placeholder="Air Max / Sport Pro"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 transition-all text-xs"
                  />
                </div>
              </div>

              {/* TNVED, GTIN, Country, Package */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 font-mono transition-all text-xs"
                  />
                  {categorySchema?.tnvedExamples && categorySchema.tnvedExamples.length > 0 && (
                    <p className="mt-1 text-[10px] text-gray-400">
                      Примеры: {categorySchema.tnvedExamples.join(', ')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Код ОКТРУ (Каталог НКТ)
                  </label>
                  <input
                    type="text"
                    value={oktru}
                    onChange={(e) => setOktru(e.target.value)}
                    placeholder="Авто для категории"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 font-mono transition-all text-xs"
                  />
                  <p className="mt-1 text-[10px] text-gray-400">
                    Оставьте пустым для автоопределения
                  </p>
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
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 font-mono transition-all text-xs"
                  />
                  <p className="mt-1 text-[10px] text-amber-600 font-medium">
                    Обязателен при отправке в НКТ
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Страна происхождения
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 transition-all text-xs"
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
                    <option value="Бангладеш">Бангладеш (BD)</option>
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
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 transition-all text-xs"
                  >
                    <option value="UNIT">Потребительская / Единичная (UNIT)</option>
                    <option value="GROUP">Групповая упаковка (GROUP)</option>
                    <option value="SET">Транспортный комплект (SET)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CATEGORY SPECIFIC FIELDS */}
          {activeTab === 'CATEGORY' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Специфические характеристики товарной группы: {categorySchema ? selectedCategory : ''}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Обязательные поля для регистрации в Национальном Каталоге товаров РК
                  </p>
                </div>
                {loadingSchema && (
                  <span className="text-xs text-[#0082FB] animate-pulse">Загрузка полей...</span>
                )}
              </div>

              {categorySchema?.fields && categorySchema.fields.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categorySchema.fields.map((field) => {
                    const val = customAttributes[field.id] ?? '';
                    return (
                      <div key={field.id} className="space-y-1">
                        <label className="block text-xs font-semibold text-gray-700">
                          {field.name}
                          {field.nameKk && (
                            <span className="text-gray-400 font-normal ml-1">({field.nameKk})</span>
                          )}
                          {field.required && <span className="text-rose-500 ml-1">*</span>}
                        </label>

                        {field.type === 'select' ? (
                          <select
                            value={val}
                            onChange={(e) => handleAttrChange(field.id, e.target.value)}
                            className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 text-xs transition-all"
                          >
                            <option value="">-- Выберите из справочника --</option>
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
                            className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 text-xs transition-all"
                          />
                        ) : (
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => handleAttrChange(field.id, e.target.value)}
                            placeholder={field.placeholder || ''}
                            className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 text-xs transition-all"
                          />
                        )}

                        {field.hint && (
                          <p className="text-[10px] text-gray-400">{field.hint}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400 text-xs">
                  Для выбранной категории дополнительных обязательных полей не требуется.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PRODUCER & IMPORTER */}
          {activeTab === 'PRODUCER' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
                Сведения об изготовителе и импортере в РК
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Наименование изготовителя (Производитель)
                  </label>
                  <input
                    type="text"
                    value={producerName}
                    onChange={(e) => setProducerName(e.target.value)}
                    placeholder="ТОО Фабрика Обуви или Factory Co., Ltd"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 transition-all text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Фактический адрес производства
                  </label>
                  <input
                    type="text"
                    value={producerAddress}
                    onChange={(e) => setProducerAddress(e.target.value)}
                    placeholder="г. Алматы, пр. Райымбека, 120 / Китай, Гуанчжоу"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 transition-all text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Импортер / Уполномоченный представитель в РК
                  </label>
                  <input
                    type="text"
                    value={importerName}
                    onChange={(e) => setImporterName(e.target.value)}
                    placeholder="ТОО Ваш Бизнес КЗ"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 transition-all text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    БИН / ИИН импортера или заявителя в РК
                  </label>
                  <input
                    type="text"
                    value={importerBin}
                    onChange={(e) => setImporterBin(e.target.value.replace(/\D/g, ''))}
                    placeholder="12-значный БИН / ИИН"
                    maxLength={12}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 font-mono transition-all text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CERTIFICATION & STANDARDS */}
          {activeTab === 'CERT' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
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
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 transition-all text-xs"
                  >
                    <option value="">-- Выберите вид документа --</option>
                    <option value="Декларация о соответствии ЕАЭС">Декларация о соответствии ЕАЭС (ЕАС)</option>
                    <option value="Сертификат соответствия ЕАЭС">Сертификат соответствия ЕАЭС (ЕАС)</option>
                    <option value="Свидетельство о гос. регистрации (СГР)">Свидетельство о гос. регистрации (СГР)</option>
                    <option value="Регистрационное удостоверение РК (РК-ЛС)">Регистрационное удостоверение РК (РК-ЛС)</option>
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
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 transition-all text-xs"
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
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 transition-all text-xs"
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
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 transition-all text-xs"
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
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 transition-all text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LOGISTICS & SHELF LIFE */}
          {activeTab === 'LOGISTICS' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
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
                    placeholder="Например: 450 г, 1.2 кг, 500 мл"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 transition-all text-xs"
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
                    placeholder="Например: 520 г, 1.4 кг"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 transition-all text-xs"
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
                    placeholder="24 мес / при t от +5 до +25°C / Не ограничен"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 transition-all text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PHOTOS & MEDIA */}
          {activeTab === 'MEDIA' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
                Фотографии и изображения товара
              </h3>
              <p className="text-xs text-gray-500">
                Национальный Каталог требует минимум 1 фотографию товара (лицевая сторона и этикетка с маркировкой).
              </p>

              {/* Device File Upload Dropzone */}
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
                className="border-2 border-dashed border-gray-300 hover:border-[#0082FB] bg-gray-50/70 hover:bg-blue-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 group-hover:border-blue-200 flex items-center justify-center text-[#0082FB] shadow-xs">
                  {uploadingPhoto ? (
                    <Loader2 className="w-6 h-6 animate-spin text-[#0082FB]" />
                  ) : (
                    <Upload className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">
                    {uploadingPhoto ? 'Загрузка фотографий на сервер...' : 'Нажмите для выбора фото с компьютера / телефона'}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Форматы: JPG, PNG, WEBP (до 10 МБ). Можно выбрать сразу несколько фото.
                  </p>
                </div>
              </div>

              {/* Or Add by URL */}
              <div className="pt-2">
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                  Или добавить фото по прямой интернет-ссылке:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="flex-1 px-3.5 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] text-gray-900 transition-all text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold text-xs text-gray-700 transition-colors cursor-pointer"
                  >
                    Добавить ссылку
                  </button>
                </div>
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {photos.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-2xl border border-gray-200 p-2 bg-gray-50 group flex flex-col items-center"
                    >
                      <img
                        src={url}
                        alt="Фото товара"
                        className="w-full h-24 object-cover rounded-xl"
                        onError={(e) => {
                          (e.target as any).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23eee" width="100" height="100"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23aaa" font-size="12">Фото</text></svg>';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-3 right-3 p-1 rounded-full bg-rose-600 text-white shadow-xs opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] text-gray-400 mt-1 truncate max-w-full">
                        Фото #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
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
              onClick={onClose}
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
