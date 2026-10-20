import React from 'react';
import { createPortal } from 'react-dom';
import { Save, Tag } from 'lucide-react';
import { LabelElement } from '../types';
import { useModalBehavior } from '@shared';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  saveTemplateName: string;
  setSaveTemplateName: (name: string) => void;
  category: string;
  setCategory: (cat: string) => void;
  widthMm: number;
  heightMm: number;
  elements: LabelElement[];
  savingTemplate: boolean;
  onConfirmSave: () => void;
}

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  isOpen,
  onClose,
  saveTemplateName,
  setSaveTemplateName,
  category,
  setCategory,
  widthMm,
  heightMm,
  elements,
  savingTemplate,
  onConfirmSave,
}) => {
  const { backdropProps, dialogProps } = useModalBehavior({ onClose, isOpen });

  if (!isOpen) return null;

  return createPortal(
    <div
      {...backdropProps}
      className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        {...dialogProps}
        className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-6 max-w-md w-full space-y-4 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-base font-black text-[#111827] flex items-center gap-2">
            <Save className="w-5 h-5 text-[#0082FB]" />
            Сохранить шаблон в библиотеку
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer p-1"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-[#64748B] leading-relaxed">
          Макет сохранится в вашем личном кабинете. Вы сможете применять его при создании заказов на печать и маркировку.
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-black text-[#111827] uppercase tracking-wider block mb-1.5">
              Название шаблона
            </label>
            <input
              type="text"
              value={saveTemplateName}
              onChange={(e) => setSaveTemplateName(e.target.value)}
              placeholder="Например: Обувь Kaspi 58x40"
              className="w-full text-xs font-bold border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-[#0082FB]"
            />
          </div>

          <div>
            <label className="text-xs font-black text-[#111827] uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#0082FB]" />
              Категория товара
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs font-bold border border-gray-200 rounded-xl p-3 bg-white focus:outline-none focus:border-[#0082FB] cursor-pointer"
            >
              <option value="SHOES">Обувь</option>
              <option value="TEXTILE">Одежда и легпром</option>
              <option value="MEDICINE">Лекарства</option>
              <option value="WATER">Вода и напитки</option>
              <option value="TOBACCO">Табачная продукция</option>
              <option value="BEER">Пивная продукция</option>
              <option value="OTHER">Другие товары</option>
            </select>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3 space-y-1 text-xs">
          <div className="flex justify-between text-[#64748B]">
            <span>Размер этикетки:</span>
            <span className="font-bold text-[#111827]">{widthMm} × {heightMm} мм</span>
          </div>
          <div className="flex justify-between text-[#64748B]">
            <span>Элементов на макете:</span>
            <span className="font-bold text-[#111827]">{elements.length} шт.</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-xs font-bold text-[#64748B] hover:text-[#111827] bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirmSave}
            disabled={savingTemplate || !saveTemplateName.trim()}
            className="flex-1 py-3 text-xs font-extrabold text-white bg-[#0082FB] hover:bg-[#0070DA] disabled:opacity-50 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            {savingTemplate ? 'Сохранение...' : 'Сохранить шаблон'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
