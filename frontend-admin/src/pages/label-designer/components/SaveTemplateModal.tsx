import React from 'react';
import { createPortal } from 'react-dom';
import { Save } from 'lucide-react';
import { LabelElement } from '../types';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  saveTemplateName: string;
  setSaveTemplateName: (name: string) => void;
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
  widthMm,
  heightMm,
  elements,
  savingTemplate,
  onConfirmSave,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-6 max-w-md w-full space-y-4 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-base font-black text-[#111827] flex items-center gap-2">
            <Save className="w-5 h-5 text-emerald-600" />
            Сохранить шаблон в БД
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-[#64748B] leading-relaxed">
          Шаблон сохранится в PostgreSQL: размеры, разделители, положение DataMatrix и текстовые поля из CSV будут доступны в любой момент.
        </p>

        <div>
          <label className="text-xs font-extrabold text-[#111827] uppercase tracking-wider block mb-1.5">
            Название шаблона
          </label>
          <input
            type="text"
            required
            value={saveTemplateName}
            onChange={(e) => setSaveTemplateName(e.target.value)}
            placeholder="Например: WB Ювелирка 30x20"
            className="w-full text-xs font-bold border border-gray-300 rounded-xl p-3 focus:border-[#0082FB] focus:outline-none bg-gray-50"
            autoFocus
          />
        </div>

        <div className="bg-[#F8FAFC] border border-gray-200 rounded-xl p-3 text-xs space-y-1 font-mono text-gray-700">
          <div className="flex justify-between">
            <span>Размер:</span>
            <span className="font-bold">{widthMm} × {heightMm} мм</span>
          </div>
          <div className="flex justify-between">
            <span>Элементов на холсте:</span>
            <span className="font-bold">{elements.length} шт.</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirmSave}
            disabled={savingTemplate || !saveTemplateName.trim()}
            className="px-5 py-2.5 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {savingTemplate ? 'Сохранение...' : 'Сохранить шаблон'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
