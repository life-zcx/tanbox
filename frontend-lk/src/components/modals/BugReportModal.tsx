import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Bug,
  Send,
  Loader2,
  CheckCircle2,
  Upload,
  AlertCircle,
  FileImage,
  Globe,
  Trash2,
} from 'lucide-react';
import { apiClient } from '../../api/client';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { key: 'ORDERS', label: 'Заказы и коды' },
  { key: 'PAYMENTS', label: 'Оплата и баланс' },
  { key: 'MARKAROVKA', label: 'ИС МПТ / СУЗ' },
  { key: 'PDF_PRINT', label: 'Печать / PDF' },
  { key: 'INTERFACE', label: 'Интерфейс / баг' },
  { key: 'OTHER', label: 'Другое' },
];

export const BugReportModal: React.FC<BugReportModalProps> = ({ isOpen, onClose }) => {
  const [category, setCategory] = useState<string>('INTERFACE');
  const [description, setDescription] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
  const resolution = typeof window !== 'undefined' ? `${window.innerWidth}×${window.innerHeight}` : '';

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsSuccess(false);
      setDescription('');
      setFile(null);
      setFilePreview(null);
      setCategory('INTERFACE');
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Размер файла не должен превышать 10 МБ');
      return;
    }
    setError(null);
    setFile(selectedFile);

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Пожалуйста, опишите обнаруженную ошибку или замечание');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('description', description.trim());
      formData.append('pageUrl', typeof window !== 'undefined' ? window.location.href : '');
      formData.append('screenResolution', resolution);
      if (file) {
        formData.append('screenshot', file);
      }

      const res = await apiClient.post('/support/bug-report', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data?.success) {
        setIsSuccess(true);
      } else {
        throw new Error(res.data?.message || 'Не удалось отправить отчет');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Ошибка при отправке отчета');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xl max-w-lg w-full p-6 sm:p-7 relative space-y-5 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute top-5 right-5 text-gray-400 hover:text-[#111827] transition-colors p-1.5 rounded-xl hover:bg-gray-100 cursor-pointer disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-[#111827]">Отчет об ошибке отправлен</h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto leading-relaxed">
                Спасибо за помощь в улучшении сервиса! Мы передали информацию в отдел разработки и проверим ситуацию в ближайшее время.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-[#0082FB] hover:bg-[#0070DA] text-white rounded-xl text-xs font-black transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shrink-0">
                <Bug className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#111827]">Сообщить об ошибке или недоработке</h3>
                <p className="text-xs text-[#64748B]">Зафиксируйте проблему — мы оперативно всё исправим</p>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Context bar */}
            <div className="bg-gray-50 border border-gray-200/80 rounded-xl px-3 py-2 text-[11px] text-[#64748B] flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 truncate">
                <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="truncate">Раздел: <strong className="text-[#111827]">{currentUrl || '/'}</strong></span>
              </span>
              <span className="text-gray-400 shrink-0 text-[10px] font-mono">{resolution}</span>
            </div>

            {/* Category selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[#111827] block">
                Где возникла проблема?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategory(cat.key)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                      category === cat.key
                        ? 'bg-[#0082FB] text-white border-[#0082FB] shadow-xs'
                        : 'bg-white text-[#475569] border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[#111827] block">
                Описание ошибки <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Что пошло не так? Что вы ожидали увидеть или сделать? Если есть номер заказа — укажите его..."
                rows={4}
                className="w-full text-xs font-medium text-[#111827] bg-white border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#0082FB]/20 focus:border-[#0082FB] transition-all resize-none placeholder:text-gray-400"
              />
            </div>

            {/* File/Screenshot upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[#111827] flex items-center justify-between">
                <span>Скриншот или файл (опционально)</span>
                <span className="text-[10px] text-gray-400 font-normal">до 10 МБ</span>
              </label>

              {file ? (
                <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs">
                  <div className="flex items-center gap-2 truncate">
                    {filePreview ? (
                      <img src={filePreview} alt="Preview" className="w-8 h-8 rounded-lg object-cover border border-gray-200 shrink-0" />
                    ) : (
                      <FileImage className="w-5 h-5 text-gray-400 shrink-0" />
                    )}
                    <span className="font-semibold text-[#111827] truncate">{file.name}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      ({(file.size / (1024 * 1024)).toFixed(1)} МБ)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                    title="Удалить файл"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-[#0082FB] bg-blue-50/50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/60'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center gap-2 text-xs text-[#64748B]">
                    <Upload className="w-4 h-4 text-gray-400" />
                    <span>Нажмите для выбора скриншота или перетащите сюда</span>
                  </div>
                </div>
              )}
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || !description.trim()}
                className="w-full py-2.5 bg-[#0082FB] hover:bg-[#0070DA] text-white rounded-xl text-xs font-black transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Отправка отчета...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Отправить отчет об ошибке</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
