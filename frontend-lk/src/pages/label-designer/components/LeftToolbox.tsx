import React, { useRef } from 'react';
import { 
  FileText, 
  Upload, 
  AlertCircle, 
  PlusCircle, 
  QrCode, 
  Barcode as BarcodeIcon, 
  Type, 
  ShieldCheck, 
  Minus, 
  Square, 
  Maximize2, 
  Check 
} from 'lucide-react';
import { LabelElement, SymbolType } from '../types';

export const PRESET_SIZES = [
  { label: '58 × 40 мм (Стандарт РК / Kaspi)', width: 58, height: 40 },
  { label: '58 × 60 мм (Одежда / Обувь)', width: 58, height: 60 },
  { label: '43 × 25 мм (Фарма / Текстиль)', width: 43, height: 25 },
  { label: '30 × 20 мм (Компактный / Ювелирка)', width: 30, height: 20 },
  { label: '75 × 120 мм (Транспортный короб SSCC)', width: 75, height: 120 },
];

interface LeftToolboxProps {
  fileName: string;
  isCsvDragOver: boolean;
  uploadError: string | null;
  csvRows: Record<string, string>[];
  totalRowsCount: number;
  csvHeaders: string[];
  handleCsvDragOver: (e: React.DragEvent) => void;
  handleCsvDragEnter?: (e: React.DragEvent) => void;
  handleCsvDragLeave: (e: React.DragEvent) => void;
  handleCsvDrop: (e: React.DragEvent) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;

  elementCategory: string;
  setElementCategory: (cat: string) => void;
  addDataMatrixElement: () => void;
  addBarcodeElement: () => void;
  addQRCodeElement: () => void;
  addTextElement: () => void;
  addPresetTextElement: (content: string, fontWeight?: 'normal' | 'bold', fontSize?: number) => void;
  addSymbolElement: (type: SymbolType, hasBorder?: boolean) => void;
  addDividerElement: () => void;
  addBoxElement: () => void;

  widthMm: number;
  heightMm: number;
  setWidthMm: (w: number) => void;
  setHeightMm: (h: number) => void;
  handleSelectPreset: (w: number, h: number) => void;

  elements: LabelElement[];
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
}

export const LeftToolbox: React.FC<LeftToolboxProps> = ({
  fileName,
  isCsvDragOver,
  uploadError,
  csvRows,
  totalRowsCount,
  csvHeaders,
  handleCsvDragOver,
  handleCsvDragEnter,
  handleCsvDragLeave,
  handleCsvDrop,
  handleFileUpload,
  elementCategory,
  setElementCategory,
  addDataMatrixElement,
  addBarcodeElement,
  addQRCodeElement,
  addTextElement,
  addPresetTextElement,
  addSymbolElement,
  addDividerElement,
  addBoxElement,
  widthMm,
  heightMm,
  setWidthMm,
  setHeightMm,
  handleSelectPreset,
  elements,
  selectedElementId,
  setSelectedElementId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="xl:col-span-3 space-y-4">
      {/* 1. Размер этикетки (всегда виден вверху) */}
      <div className="bg-white p-5 rounded-3xl border border-gray-200/90 shadow-sm space-y-3.5">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#111827] flex items-center gap-1.5">
          <Maximize2 className="w-4 h-4 text-[#0082FB]" />
          Размер этикетки
        </h3>

        <div className="space-y-1.5">
          {PRESET_SIZES.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handleSelectPreset(preset.width, preset.height)}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                widthMm === preset.width && heightMm === preset.height
                  ? 'bg-[#0082FB] text-white shadow-xs'
                  : 'bg-gray-50 text-[#475569] hover:bg-gray-100'
              }`}
            >
              <span>{preset.label}</span>
              {widthMm === preset.width && heightMm === preset.height && (
                <Check className="w-3.5 h-3.5" />
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
          <div>
            <label className="text-[11px] font-bold text-[#64748B]">Ширина (мм)</label>
            <input
              type="number"
              value={widthMm}
              onChange={(e) => setWidthMm(Number(e.target.value))}
              className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2 mt-1"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-[#64748B]">Высота (мм)</label>
            <input
              type="number"
              value={heightMm}
              onChange={(e) => setHeightMm(Number(e.target.value))}
              className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2 mt-1"
            />
          </div>
        </div>
      </div>

      {/* 2. Добавить элементы */}
      <div className="bg-white p-5 rounded-3xl border border-gray-200/90 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#111827] flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4 text-[#0082FB]" />
            Добавить элементы
          </h3>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-1 border-b border-gray-100 pb-2.5">
          {[
            { id: 'all', label: 'Все' },
            { id: 'codes', label: 'Коды' },
            { id: 'text', label: 'Текст' },
            { id: 'cert', label: 'Знаки' },
            { id: 'care', label: 'Уход' },
            { id: 'pack', label: 'Упаковка' },
            { id: 'shapes', label: 'Линии' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setElementCategory(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                elementCategory === tab.id
                  ? 'bg-[#0082FB] text-white shadow-xs'
                  : 'bg-gray-100 text-[#64748B] hover:bg-gray-200 hover:text-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
          {/* Category: Codes & Barcodes */}
          {(elementCategory === 'all' || elementCategory === 'codes') && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold text-[#94A3B8] uppercase tracking-wider block">
                Штрихкоды и маркировка:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={addDataMatrixElement}
                  className="col-span-2 p-2.5 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-[#0082FB]" />
                  + DataMatrix (Маркировка)
                </button>

                <button
                  type="button"
                  onClick={addBarcodeElement}
                  className="p-2 bg-gray-50 hover:bg-[#EBF5FF] hover:text-[#0082FB] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-gray-200/60"
                >
                  <BarcodeIcon className="w-3.5 h-3.5 text-gray-700" />
                  + Штрихкод (EAN-13)
                </button>

                <button
                  type="button"
                  onClick={addQRCodeElement}
                  className="p-2 bg-gray-50 hover:bg-[#EBF5FF] hover:text-[#0082FB] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-gray-200/60"
                >
                  <QrCode className="w-3.5 h-3.5 text-purple-600" />
                  + QR-код
                </button>
              </div>
            </div>
          )}

          {/* Category: Text & Fields */}
          {(elementCategory === 'all' || elementCategory === 'text') && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold text-[#94A3B8] uppercase tracking-wider block">
                Текст и реквизиты товара:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={addTextElement}
                  className="col-span-2 p-2 bg-gray-50 hover:bg-[#EBF5FF] hover:text-[#0082FB] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-gray-200/60"
                >
                  <Type className="w-3.5 h-3.5 text-[#0082FB]" />
                  + Произвольный текст
                </button>

                <button
                  type="button"
                  onClick={() => addPresetTextElement('{name}', 'bold', 8)}
                  className="p-1.5 bg-gray-50 hover:bg-blue-50 text-[11px] font-bold rounded-lg text-left truncate border border-gray-200/50 cursor-pointer"
                >
                  + Название {'{name}'}
                </button>

                <button
                  type="button"
                  onClick={() => addPresetTextElement('Арт: {sku}', 'bold', 7)}
                  className="p-1.5 bg-gray-50 hover:bg-blue-50 text-[11px] font-bold rounded-lg text-left truncate border border-gray-200/50 cursor-pointer"
                >
                  + Артикул {'{sku}'}
                </button>

                <button
                  type="button"
                  onClick={() => addPresetTextElement('Размер: {size}', 'bold', 7)}
                  className="p-1.5 bg-gray-50 hover:bg-blue-50 text-[11px] font-bold rounded-lg text-left truncate border border-gray-200/50 cursor-pointer"
                >
                  + Размер {'{size}'}
                </button>

                <button
                  type="button"
                  onClick={() => addPresetTextElement('Цвет: {color}', 'normal', 6.5)}
                  className="p-1.5 bg-gray-50 hover:bg-blue-50 text-[11px] font-bold rounded-lg text-left truncate border border-gray-200/50 cursor-pointer"
                >
                  + Цвет {'{color}'}
                </button>

                <button
                  type="button"
                  onClick={() => addPresetTextElement('Состав: 100% хлопок', 'normal', 6)}
                  className="p-1.5 bg-gray-50 hover:bg-blue-50 text-[11px] font-bold rounded-lg text-left truncate border border-gray-200/50 cursor-pointer"
                >
                  + Состав
                </button>

                <button
                  type="button"
                  onClick={() => addPresetTextElement('Импортер: {importer}', 'normal', 5.5)}
                  className="p-1.5 bg-gray-50 hover:bg-blue-50 text-[11px] font-bold rounded-lg text-left truncate border border-gray-200/50 cursor-pointer"
                >
                  + Импортер / ТОО
                </button>

                <button
                  type="button"
                  onClick={() => addPresetTextElement('Сделано в: {country}', 'normal', 6)}
                  className="p-1.5 bg-gray-50 hover:bg-blue-50 text-[11px] font-bold rounded-lg text-left truncate border border-gray-200/50 cursor-pointer"
                >
                  + Страна {'{country}'}
                </button>

                <button
                  type="button"
                  onClick={() => addPresetTextElement('Срок годности: не ограничен', 'normal', 5.5)}
                  className="p-1.5 bg-gray-50 hover:bg-blue-50 text-[11px] font-bold rounded-lg text-left truncate border border-gray-200/50 cursor-pointer"
                >
                  + Срок годности
                </button>
              </div>
            </div>
          )}

          {/* Category: Certification & Standards */}
          {(elementCategory === 'all' || elementCategory === 'cert') && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold text-[#94A3B8] uppercase tracking-wider block">
                Сертификация (ЕАЭС / РК / ЕС):
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => addSymbolElement('EAC')}
                  className="p-2 bg-gray-50 hover:bg-[#EBF5FF] hover:text-[#0082FB] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-gray-200/50"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  + Знак EAC
                </button>

                <button
                  type="button"
                  onClick={() => addSymbolElement('EAC_BOX')}
                  className="p-2 bg-gray-50 hover:bg-[#EBF5FF] hover:text-[#0082FB] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-gray-200/50"
                >
                  [EAC] в рамке
                </button>

                <button
                  type="button"
                  onClick={() => addSymbolElement('KZ_GOST')}
                  className="p-2 bg-gray-50 hover:bg-[#EBF5FF] hover:text-[#0082FB] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-gray-200/50"
                >
                  🇰🇿 СТ РК (ҚР СТ)
                </button>

                <button
                  type="button"
                  onClick={() => addSymbolElement('CE')}
                  className="p-2 bg-gray-50 hover:bg-[#EBF5FF] hover:text-[#0082FB] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-gray-200/50"
                >
                  🇪🇺 Знак CE
                </button>
              </div>
            </div>
          )}

          {/* Category: Garment / Textile Care Symbols */}
          {(elementCategory === 'all' || elementCategory === 'care') && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold text-[#94A3B8] uppercase tracking-wider block">
                Уход за одеждой и текстилем (ISO 3758):
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => addSymbolElement('WASH_30')}
                  className="p-2 bg-gray-50 hover:bg-blue-50 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-gray-200/50 cursor-pointer"
                >
                  🧺 Стирка 30°
                </button>
                <button
                  type="button"
                  onClick={() => addSymbolElement('WASH_40')}
                  className="p-2 bg-gray-50 hover:bg-blue-50 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-gray-200/50 cursor-pointer"
                >
                  🧺 Стирка 40°
                </button>
                <button
                  type="button"
                  onClick={() => addSymbolElement('WASH_HAND')}
                  className="p-2 bg-gray-50 hover:bg-blue-50 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-gray-200/50 cursor-pointer"
                >
                  🖐 Ручная стирка
                </button>
                <button
                  type="button"
                  onClick={() => addSymbolElement('DO_NOT_WASH')}
                  className="p-2 bg-gray-50 hover:bg-blue-50 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-gray-200/50 cursor-pointer"
                >
                  🚫 Не стирать
                </button>
                <button
                  type="button"
                  onClick={() => addSymbolElement('NO_BLEACH')}
                  className="p-2 bg-gray-50 hover:bg-blue-50 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-gray-200/50 cursor-pointer"
                >
                  🚫 Не отбеливать
                </button>
                <button
                  type="button"
                  onClick={() => addSymbolElement('BLEACH_OK')}
                  className="p-2 bg-gray-50 hover:bg-blue-50 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-gray-200/50 cursor-pointer"
                >
                  △ Отбеливание
                </button>
                <button
                  type="button"
                  onClick={() => addSymbolElement('IRON_LOW')}
                  className="p-2 bg-gray-50 hover:bg-blue-50 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-gray-200/50 cursor-pointer"
                >
                  熨 Глажка 110°
                </button>
                <button
                  type="button"
                  onClick={() => addSymbolElement('IRON_MED')}
                  className="p-2 bg-gray-50 hover:bg-blue-50 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-gray-200/50 cursor-pointer"
                >
                  熨 Глажка 150°
                </button>
                <button
                  type="button"
                  onClick={() => addSymbolElement('DO_NOT_IRON')}
                  className="p-2 bg-gray-50 hover:bg-blue-50 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-gray-200/50 cursor-pointer"
                >
                  🚫 Не гладить
                </button>
                <button
                  type="button"
                  onClick={() => addSymbolElement('NO_TUMBLE_DRY')}
                  className="p-2 bg-gray-50 hover:bg-blue-50 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-gray-200/50 cursor-pointer"
                >
                  🌀 Без сушки
                </button>
                <button
                  type="button"
                  onClick={() => addSymbolElement('NO_DRY_CLEAN')}
                  className="col-span-2 p-2 bg-gray-50 hover:bg-blue-50 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-gray-200/50 cursor-pointer"
                >
                  🚫 Без химчистки
                </button>
              </div>
            </div>
          )}

          {/* Category: Logistics, Packaging & Eco */}
          {(elementCategory === 'all' || elementCategory === 'pack') && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold text-[#94A3B8] uppercase tracking-wider block">
                Упаковка и логистика:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => addSymbolElement('RECYCLE')}
                  className="p-2 bg-gray-50 hover:bg-blue-50 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-gray-200/50 cursor-pointer"
                >
                  ♻ Петля 21 PAP
                </button>
                <button
                  type="button"
                  onClick={() => addSymbolElement('RECYCLE_LDPE')}
                  className="p-2 bg-gray-50 hover:bg-blue-50 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-gray-200/50 cursor-pointer"
                >
                  ♻ Петля 04 LDPE
                </button>
                <button
                  type="button"
                  onClick={() => addSymbolElement('RECYCLE_PP')}
                  className="p-2 bg-gray-50 hover:bg-blue-50 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-gray-200/50 cursor-pointer"
                >
                  ♻ Петля 05 PP
                </button>
                <button
                  type="button"
                  onClick={() => addSymbolElement('GLASS_FORK')}
                  className="p-2 bg-gray-50 hover:bg-blue-50 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-gray-200/50 cursor-pointer"
                >
                  🍷🍴 Пищевой
                </button>
                <button
                  type="button"
                  onClick={() => addSymbolElement('KEEP_DRY')}
                  className="p-2 bg-gray-50 hover:bg-blue-50 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-gray-200/50 cursor-pointer"
                >
                  ☂ От влаги
                </button>
                <button
                  type="button"
                  onClick={() => addSymbolElement('FRAGILE')}
                  className="p-2 bg-gray-50 hover:bg-blue-50 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-gray-200/50 cursor-pointer"
                >
                  🍸 Хрупкое
                </button>
                <button
                  type="button"
                  onClick={() => addSymbolElement('THIS_WAY_UP')}
                  className="p-2 bg-gray-50 hover:bg-blue-50 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-gray-200/50 cursor-pointer"
                >
                  ⬆⬆ Верх
                </button>
                <button
                  type="button"
                  onClick={() => addSymbolElement('TIDY_MAN')}
                  className="p-2 bg-gray-50 hover:bg-blue-50 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-gray-200/50 cursor-pointer"
                >
                  🚯 Не сорить
                </button>
              </div>
            </div>
          )}

          {/* Category: Geometry & Dividers */}
          {(elementCategory === 'all' || elementCategory === 'shapes') && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold text-[#94A3B8] uppercase tracking-wider block">
                Линии и геометрия:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={addDividerElement}
                  className="p-2.5 bg-gray-50 hover:bg-[#EBF5FF] hover:text-[#0082FB] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-gray-200/50"
                >
                  <Minus className="w-4 h-4" />
                  — Линия
                </button>

                <button
                  type="button"
                  onClick={addBoxElement}
                  className="p-2.5 bg-gray-50 hover:bg-[#EBF5FF] hover:text-[#0082FB] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-gray-200/50"
                >
                  <Square className="w-4 h-4" />
                  ▢ Рамка / Бокс
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Тестовые данные (CSV) */}
      <div className="bg-white p-5 rounded-3xl border border-gray-200/90 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#111827] flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#0082FB]" />
            Тестовые данные (CSV)
          </h3>
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleCsvDragOver}
          onDragEnter={handleCsvDragEnter || handleCsvDragOver}
          onDragLeave={handleCsvDragLeave}
          onDrop={handleCsvDrop}
          className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all text-center select-none ${
            isCsvDragOver
              ? 'border-[#0082FB] bg-blue-50/80 ring-2 ring-[#0082FB]/20 scale-[1.01]'
              : 'border-gray-200 hover:border-[#0082FB] bg-gray-50/60 hover:bg-blue-50/20'
          }`}
        >
          <Upload className={`w-5 h-5 mb-1.5 pointer-events-none transition-colors ${isCsvDragOver ? 'text-[#0082FB] animate-bounce' : 'text-[#64748B]'}`} />
          <span
            title={fileName || undefined}
            className="text-xs font-bold text-[#111827] max-w-full px-2 truncate block pointer-events-none"
          >
            {fileName ? fileName : 'Загрузить CSV с кодами'}
          </span>
          <span className="text-[11px] text-[#94A3B8] pointer-events-none">
            {isCsvDragOver ? 'Отпустите файл для загрузки' : 'для проверки автозаполнения полей'}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {uploadError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>Ошибка чтения файла:</span>
            </div>
            <p className="text-[11px] text-red-600 leading-relaxed">{uploadError}</p>
          </div>
        )}

        {csvRows.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 space-y-1">
            <div className="flex items-center justify-between font-bold">
              <span>Загружено записей:</span>
              <span className="bg-emerald-200/60 px-2 py-0.5 rounded-md font-black">
                {totalRowsCount || csvRows.length} шт.
              </span>
            </div>
            <p className="text-[11px] text-emerald-600 truncate">
              Колонки: {csvHeaders.join(', ')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
