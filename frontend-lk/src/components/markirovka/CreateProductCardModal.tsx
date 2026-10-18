import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sparkles,
  Send,
  Save,
  AlertCircle,
  HelpCircle,
  Package,
  Layers,
  Globe,
  Tag,
  Building2,
  CheckCircle2,
  FileText,
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
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(cardToEdit?.category || 'SHOES');
  const [categorySchema, setCategorySchema] = useState<{ fields: FieldDefinition[]; tnvedExamples: string[] } | null>(null);

  // Form base fields
  const [name, setName] = useState(cardToEdit?.name || '');
  const [brand, setBrand] = useState(cardToEdit?.brand || '');
  const [article, setArticle] = useState(cardToEdit?.article || '');
  const [tnved, setTnved] = useState(cardToEdit?.tnved || '');
  const [country, setCountry] = useState(cardToEdit?.country || 'Казахстан');
  const [producerName, setProducerName] = useState(cardToEdit?.producerName || '');
  const [size, setSize] = useState(cardToEdit?.size || '');
  const [color, setColor] = useState(cardToEdit?.color || '');
  const [packageType, setPackageType] = useState(cardToEdit?.packageType || 'UNIT');

  // Dynamic category attributes
  const [customAttributes, setCustomAttributes] = useState<Record<string, any>>(cardToEdit?.attributes || {});

  const [loadingSchema, setLoadingSchema] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load list of categories on mount
  useEffect(() => {
    apiClient.get('/markirovka/cards/categories').then((res) => {
      if (res.data?.categories) {
        setCategories(res.data.categories);
      }
    }).catch(() => {});
  }, []);

  // Load schema whenever category changes
  useEffect(() => {
    if (!selectedCategory) return;
    setLoadingSchema(true);
    apiClient.get(`/markirovka/cards/categories/${selectedCategory}/schema`).then((res) => {
      if (res.data?.schema) {
        setCategorySchema(res.data.schema);
        if (!cardToEdit) {
          // Pre-populate default TNVED example if empty
          if (!tnved && res.data.schema.tnvedExamples?.[0]) {
            setTnved(res.data.schema.tnvedExamples[0]);
          }
        }
      }
    }).catch(() => {}).finally(() => {
      setLoadingSchema(false);
    });
  }, [selectedCategory]);

  const handleAttrChange = (fieldId: string, val: any) => {
    setCustomAttributes((prev) => ({
      ...prev,
      [fieldId]: val,
    }));
  };

  const handleSubmit = async (submitToNktDirectly: boolean) => {
    if (!name.trim()) {
      setError('Укажите наименование товара');
      return;
    }
    if (!tnved.trim()) {
      setError('Укажите код ТН ВЭД товара');
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      category: selectedCategory,
      name: name.trim(),
      brand: brand.trim() || undefined,
      article: article.trim() || undefined,
      tnved: tnved.trim(),
      country: country.trim() || undefined,
      producerName: producerName.trim() || undefined,
      size: size.trim() || undefined,
      color: color.trim() || undefined,
      packageType,
      attributes: customAttributes,
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
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-white to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0082FB]/10 text-[#0082FB] flex items-center justify-center border border-[#0082FB]/20 shadow-2xs">
              <Package className="w-5 h-5 text-[#0082FB]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                {cardToEdit ? 'Редактирование карточки товара' : 'Создание карточки товара (НКТ / Маркировка)'}
              </h2>
              <p className="text-xs text-gray-500">
                Регистрация характеристик для получения официального GTIN и заказа DataMatrix
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

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Ошибка сохранения карточки</p>
                <p className="mt-0.5 text-rose-700">{error}</p>
              </div>
            </div>
          )}

          {/* 1. Category Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Товарная группа маркировки <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCustomAttributes({});
              }}
              disabled={Boolean(cardToEdit)}
              className="w-full px-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 font-medium transition-all"
            >
              {categories.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.nameRu} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Base Product Attributes */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
              Базовые параметры товара
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Наименование товара <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например: Кроссовки мужские кожаные Classic Sport"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Торговая марка / Бренд
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Например: Nike, Adidas, Tanbox"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Артикул / Модель производителя
                </label>
                <input
                  type="text"
                  value={article}
                  onChange={(e) => setArticle(e.target.value)}
                  placeholder="Например: ART-9021, M-104"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Код ТН ВЭД (10 цифр) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={tnved}
                  onChange={(e) => setTnved(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="6403993300"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 font-mono transition-all"
                />
                {categorySchema?.tnvedExamples && categorySchema.tnvedExamples.length > 0 && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    Примеры для категории: {categorySchema.tnvedExamples.join(', ')}...
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Страна происхождения <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Казахстан, Китай, Турция, Россия..."
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Производитель / Изготовитель
                </label>
                <input
                  type="text"
                  value={producerName}
                  onChange={(e) => setProducerName(e.target.value)}
                  placeholder="ТОО / ИП / Фабрика"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Тип упаковки
                </label>
                <select
                  value={packageType}
                  onChange={(e) => setPackageType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 transition-all"
                >
                  <option value="UNIT">Потребительская упаковка (UNIT)</option>
                  <option value="GROUP">Групповая упаковка (GROUP)</option>
                  <option value="SET">Набор / Комплект (SET)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Размер (при наличии)
                </label>
                <input
                  type="text"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="Например: 42, XL, 0.5 л, 500 мг"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Цвет (при наличии)
                </label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="Черный, Белый, Синий..."
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 transition-all"
                />
              </div>
            </div>
          </div>

          {/* 3. Category-Specific Dynamic Fields */}
          {categorySchema && categorySchema.fields.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#0082FB]" />
                <h3 className="text-xs font-bold text-[#0082FB] uppercase tracking-wider">
                  Обязательные атрибуты категории «{categories.find((c) => c.category === selectedCategory)?.nameRu || selectedCategory}»
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categorySchema.fields.map((field) => (
                  <div key={field.id} className={field.type === 'text' && field.placeholder?.length && field.placeholder.length > 30 ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {field.name} {field.required && <span className="text-rose-500">*</span>}
                    </label>

                    {field.type === 'select' ? (
                      <select
                        value={customAttributes[field.id] || ''}
                        onChange={(e) => handleAttrChange(field.id, e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 transition-all"
                      >
                        <option value="">-- Выберите значение --</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={customAttributes[field.id] || ''}
                        onChange={(e) => handleAttrChange(field.id, e.target.value)}
                        placeholder={field.placeholder || ''}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-2 focus:ring-[#0082FB]/10 text-gray-900 transition-all"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-gray-500 hidden sm:block">
            Карточка сохранится в реестре и будет готова к подаче в НКТ
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Сохранить черновик</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0082FB] hover:bg-[#0070D8] text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer shadow-md shadow-blue-500/10"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Отправка...' : 'Отправить в НКТ'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
