import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Palette,
  Search,
  Plus,
  Printer,
  Trash2,
  Check,
  Edit3,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { UserStickerTemplate } from '../../../types';
import { getCategoryLabel } from '../../../data/categories';
import { StickerCanvasPreview } from '../../../components/common/StickerCanvasPreview';

interface TemplateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: UserStickerTemplate[];
  activeTemplateId?: string | null;
  onSelectTemplate: (template: UserStickerTemplate) => void;
  onCreateNew: () => void;
  onDeleteTemplate?: (id: string) => Promise<void>;
  onOrderPrint?: (template: UserStickerTemplate) => void;
}

export const TemplateLibraryModal: React.FC<TemplateLibraryModalProps> = ({
  isOpen,
  onClose,
  templates,
  activeTemplateId,
  onSelectTemplate,
  onCreateNew,
  onDeleteTemplate,
  onOrderPrint,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = templates.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${t.widthMm}x${t.heightMm}`.includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'ALL' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!confirm(`Вы действительно хотите удалить макет «${name}» из библиотеки?`)) {
      return;
    }
    if (onDeleteTemplate) {
      setDeletingId(id);
      try {
        await onDeleteTemplate(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 w-screen h-screen z-[99999] overflow-y-auto bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 text-[#111827]"
      >
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0082FB] flex items-center justify-center shrink-0">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#111827]">
                Моя библиотека макетов
              </h3>
              <p className="text-xs text-[#64748B]">
                Сохранённые шаблоны для мгновенного запуска в печать без повторного согласования
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onCreateNew();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0082FB] hover:bg-[#0070DA] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Создать новый</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="px-6 py-3.5 bg-gray-50/70 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Поиск по названию или размеру..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0082FB] placeholder:text-gray-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
              Категория:
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0082FB] cursor-pointer"
            >
              <option value="ALL">Все категории</option>
              <option value="SHOES">Обувь</option>
              <option value="TEXTILE">Одежда и текстиль</option>
              <option value="MEDICINE">Лекарства</option>
              <option value="OILS">Моторные масла</option>
              <option value="WATER">Вода и напитки</option>
              <option value="TOBACCO">Табачные изделия</option>
              <option value="BEER">Пивная продукция</option>
              <option value="OTHER">Прочее</option>
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
          {filtered.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                <Palette className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-[#111827]">
                {templates.length === 0
                  ? 'У вас пока нет сохранённых макетов'
                  : 'Макеты не найдены'}
              </p>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                {templates.length === 0
                  ? 'Создайте макет в конструкторе или закажите разработку у дизайнера. Сохранённые макеты применяются во всех заказах без ожидания согласования!'
                  : 'Попробуйте изменить поисковый запрос или фильтр категории.'}
              </p>
              {templates.length === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onCreateNew();
                    onClose();
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0082FB] hover:bg-[#0070DA] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Создать первый макет</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((t) => {
                const isActive = activeTemplateId === t.id;
                const isPaid = Boolean(t.isPaid);
                const scale = Math.min(160 / (t.widthMm || 58), 105 / (t.heightMm || 40), 2.2);

                return (
                  <div
                    key={t.id}
                    className={`group rounded-2xl border transition-all flex flex-col justify-between bg-white overflow-hidden hover:shadow-lg hover:border-[#0082FB]/50 ${
                      isActive
                        ? 'border-[#0082FB] ring-2 ring-[#0082FB]/30 shadow-md'
                        : 'border-gray-200/90'
                    }`}
                  >
                    {/* Visual Sticker Preview */}
                    <div
                      onClick={() => {
                        onSelectTemplate(t);
                        onClose();
                      }}
                      className="bg-[#F8FAFC] border-b border-gray-100 p-5 flex items-center justify-center relative min-h-[160px] cursor-pointer group-hover:bg-blue-50/20 transition-colors select-none"
                    >
                      {/* Realistic Miniature Sticker */}
                      <div className="relative transform group-hover:scale-105 transition-transform duration-200">
                        <StickerCanvasPreview
                          widthMm={t.widthMm || 58}
                          heightMm={t.heightMm || 40}
                          elements={(t.elements as any) || []}
                          scale={scale}
                          className="shadow-sm rounded-sm"
                        />
                      </div>

                      {/* Dimension Badge */}
                      <div className="absolute top-2.5 left-2.5">
                        <span className="font-mono text-[10px] font-bold text-gray-700 bg-white/95 backdrop-blur-xs border border-gray-200/90 px-2 py-0.5 rounded-md shadow-2xs">
                          {t.widthMm} × {t.heightMm} мм
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div className="absolute top-2.5 right-2.5">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-2xs">
                            <Check className="w-2.5 h-2.5" />
                            Утвержден
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200/90 shadow-2xs">
                            Черновик
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Details & Actions */}
                    <div className="p-4 flex flex-col justify-between flex-1">
                      <div>
                        <h4
                          onClick={() => {
                            onSelectTemplate(t);
                            onClose();
                          }}
                          className="text-xs font-extrabold text-[#111827] line-clamp-1 group-hover:text-[#0082FB] transition-colors cursor-pointer"
                          title={t.name}
                        >
                          {t.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-[#64748B]">
                          <span className="font-medium">
                            {t.category ? getCategoryLabel(t.category as any) : 'Общая категория'}
                          </span>
                          <span>•</span>
                          <span>{Array.isArray(t.elements) ? t.elements.length : 0} эл.</span>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectTemplate(t);
                            onClose();
                          }}
                          className="flex-1 bg-[#0082FB] hover:bg-[#0070DA] text-white text-xs font-bold py-2 px-3 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Открыть</span>
                        </button>

                        {onOrderPrint && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOrderPrint(t);
                              onClose();
                            }}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                            title="Создать заказ на печать с этим макетом"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>В заказ</span>
                          </button>
                        )}

                        {onDeleteTemplate && (
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, t.id, t.name)}
                            disabled={deletingId === t.id}
                            className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                            title="Удалить макет"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-gray-100 bg-white flex items-center justify-between text-xs text-[#64748B]">
          <span>
            Всего макетов в вашей библиотеке: <strong className="text-[#111827]">{templates.length}</strong>
          </span>
          <span className="font-medium text-[11px] text-gray-400">
            Готовые макеты запускаются в печать мгновенно без повторного согласования
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
};
