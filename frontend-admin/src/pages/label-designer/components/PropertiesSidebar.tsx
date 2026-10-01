import React from 'react';
import { 
  Settings2, 
  Trash2, 
  RotateCw, 
  Bold, 
  AlignLeft, 
  AlignCenter, 
  AlignRight 
} from 'lucide-react';
import { LabelElement, SymbolType } from '../types';

const FONT_FAMILIES = [
  { label: 'Arial (Стандартный без засечек)', value: 'Arial, sans-serif' },
  { label: 'Roboto (Современный)', value: 'Roboto, sans-serif' },
  { label: 'Inter (Чистый системный)', value: 'Inter, sans-serif' },
  { label: 'Courier New (Моноширинный)', value: '"Courier New", monospace' },
  { label: 'Times New Roman (С засечками)', value: '"Times New Roman", serif' },
];

interface PropertiesSidebarProps {
  selectedElement: LabelElement | null;
  widthMm: number;
  heightMm: number;
  csvHeaders: string[];
  updateElement: (id: string, updates: Partial<LabelElement>) => void;
  deleteElement: (id: string) => void;
  rotateElementBy90: (id: string) => void;
}

export const PropertiesSidebar: React.FC<PropertiesSidebarProps> = ({
  selectedElement,
  widthMm,
  heightMm,
  csvHeaders,
  updateElement,
  deleteElement,
  rotateElementBy90,
}) => {
  return (
    <div className="xl:col-span-3 space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#111827] flex items-center gap-1.5">
            <Settings2 className="w-4 h-4 text-[#0082FB]" />
            Свойства элемента
          </h3>
          {selectedElement && (
            <button
              onClick={() => deleteElement(selectedElement.id)}
              title="Удалить элемент"
              className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {selectedElement ? (
          <div className="space-y-4">
            {/* 1. Rotation Controls (0°, 90°, 180°, 270°) */}
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-extrabold text-[#111827] flex items-center gap-1">
                  <RotateCw className="w-3.5 h-3.5 text-[#0082FB]" />
                  Поворот (Вращение)
                </label>
                <span className="text-[11px] font-mono font-bold text-[#0082FB]">
                  {selectedElement.rotation || 0}°
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1">
                {([0, 90, 180, 270] as const).map((angle) => (
                  <button
                    key={angle}
                    onClick={() => updateElement(selectedElement.id, { rotation: angle })}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      (selectedElement.rotation || 0) === angle
                        ? 'bg-[#0082FB] text-white shadow-xs'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-blue-50'
                    }`}
                  >
                    {angle}°
                  </button>
                ))}
              </div>

              <button
                onClick={() => rotateElementBy90(selectedElement.id)}
                className="w-full mt-1 py-1.5 px-3 bg-white border border-blue-200 hover:bg-blue-100 text-[#0082FB] text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Повернуть на +90°
              </button>
            </div>

            {/* 2. Coordinates & Positioning */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-[#64748B]">X (мм)</label>
                <input
                  type="number"
                  step="0.5"
                  value={selectedElement.x}
                  onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })}
                  className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2 mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#64748B]">Y (мм)</label>
                <input
                  type="number"
                  step="0.5"
                  value={selectedElement.y}
                  onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })}
                  className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2 mt-1"
                />
              </div>
            </div>

            {/* Quick Centering Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const elW = (selectedElement as any).size || (selectedElement as any).width || (selectedElement as any).length || 10;
                  updateElement(selectedElement.id, { x: Math.max(0, Math.round(((widthMm - elW) / 2) * 2) / 2) });
                }}
                className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold border border-gray-200 cursor-pointer"
              >
                По центру X
              </button>
              <button
                onClick={() => {
                  const elH = (selectedElement as any).size || 6;
                  updateElement(selectedElement.id, { y: Math.max(0, Math.round(((heightMm - elH) / 2) * 2) / 2) });
                }}
                className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold border border-gray-200 cursor-pointer"
              >
                По центру Y
              </button>
            </div>

            {/* 3. Text specific properties */}
            {selectedElement.type === 'text' && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div>
                  <label className="text-[11px] font-bold text-[#64748B] flex items-center justify-between">
                    <span>Текст шаблона</span>
                    <span className="text-[#0082FB] font-normal">{'{поле}'} из CSV</span>
                  </label>
                  <textarea
                    rows={3}
                    value={selectedElement.content}
                    onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                    className="w-full text-xs border border-gray-200 rounded-lg p-2 mt-1 font-mono"
                  />
                </div>

                {/* Font Family Selector */}
                <div>
                  <label className="text-[11px] font-bold text-[#64748B]">Шрифт (гарнитура)</label>
                  <select
                    value={selectedElement.fontFamily || 'Arial, sans-serif'}
                    onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                    className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2 mt-1 bg-white cursor-pointer"
                  >
                    {FONT_FAMILIES.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Font Size & Stepper */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#64748B]">Размер шрифта</label>
                    <span className="text-xs font-mono font-bold text-[#111827]">
                      {selectedElement.fontSize} pt
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => updateElement(selectedElement.id, { fontSize: Math.max(3.5, selectedElement.fontSize - 0.5) })}
                      className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min="3.5"
                      max="24"
                      step="0.5"
                      value={selectedElement.fontSize}
                      onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                      className="w-full cursor-pointer"
                    />
                    <button
                      onClick={() => updateElement(selectedElement.id, { fontSize: Math.min(32, selectedElement.fontSize + 0.5) })}
                      className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Width of text block */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#64748B]">Ширина блока текста</label>
                    <span className="text-xs font-mono font-bold text-[#111827]">
                      {selectedElement.width} мм
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max={widthMm}
                    step="1"
                    value={selectedElement.width}
                    onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })}
                    className="w-full mt-1 cursor-pointer"
                  />
                </div>

                {/* Styling: Bold & Alignment */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => updateElement(selectedElement.id, { fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedElement.fontWeight === 'bold' ? 'bg-[#0082FB] text-white border-[#0082FB]' : 'bg-gray-50 border-gray-200 text-gray-700'
                    }`}
                  >
                    <Bold className="w-3.5 h-3.5" />
                    Жирный
                  </button>

                  <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                    <button
                      onClick={() => updateElement(selectedElement.id, { align: 'left' })}
                      title="По левому краю"
                      className={`p-1.5 cursor-pointer ${selectedElement.align === 'left' ? 'bg-[#0082FB] text-white' : 'bg-gray-50 text-gray-700'}`}
                    >
                      <AlignLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateElement(selectedElement.id, { align: 'center' })}
                      title="По центру"
                      className={`p-1.5 cursor-pointer ${selectedElement.align === 'center' ? 'bg-[#0082FB] text-white' : 'bg-gray-50 text-gray-700'}`}
                    >
                      <AlignCenter className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateElement(selectedElement.id, { align: 'right' })}
                      title="По правому краю"
                      className={`p-1.5 cursor-pointer ${selectedElement.align === 'right' ? 'bg-[#0082FB] text-white' : 'bg-gray-50 text-gray-700'}`}
                    >
                      <AlignRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* CSV Column quick insert pills */}
                {csvHeaders.length > 0 && (
                  <div className="pt-2">
                    <label className="text-[10px] font-bold text-[#94A3B8] uppercase block mb-1">
                      Вставить переменную из CSV:
                    </label>
                    <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto">
                      {csvHeaders.map((hdr) => (
                        <button
                          key={hdr}
                          onClick={() =>
                            updateElement(selectedElement.id, {
                              content: `${selectedElement.content} {${hdr}}`,
                            })
                          }
                          className="bg-gray-100 hover:bg-blue-100 hover:text-[#0082FB] text-[10px] font-bold px-2 py-0.5 rounded transition-colors cursor-pointer"
                        >
                          +{hdr}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. DataMatrix specific properties */}
            {selectedElement.type === 'datamatrix' && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div>
                  <label className="text-[11px] font-bold text-[#64748B]">Колонка с кодом из CSV</label>
                  <input
                    type="text"
                    value={selectedElement.columnName}
                    onChange={(e) => updateElement(selectedElement.id, { columnName: e.target.value })}
                    className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2 mt-1"
                    placeholder="code"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#64748B]">Формат / Плотность сетки</label>
                  <select
                    value={selectedElement.matrixStructure || 'four_regions'}
                    onChange={(e) => updateElement(selectedElement.id, { matrixStructure: e.target.value as any })}
                    className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2 mt-1 bg-white cursor-pointer"
                  >
                    <option value="four_regions">4 секции с перекрестием (TANBA / ИС МПТ РК)</option>
                    <option value="auto">Авто (минимальная сетка)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#64748B]">Размер стороны (мм)</label>
                    <span className="text-xs font-mono font-bold text-[#111827]">
                      {selectedElement.size} × {selectedElement.size} мм
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max={Math.min(widthMm, heightMm)}
                    step="0.5"
                    value={selectedElement.size}
                    onChange={(e) => updateElement(selectedElement.id, { size: Number(e.target.value) })}
                    className="w-full mt-1 cursor-pointer"
                  />
                  <div className="flex gap-1.5 mt-1.5">
                    {[8, 10, 12, 14, 16].filter(s => s <= Math.min(widthMm, heightMm)).map((sz) => (
                      <button
                        key={sz}
                        onClick={() => updateElement(selectedElement.id, { size: sz })}
                        className={`flex-1 py-1 text-[10px] font-bold rounded border cursor-pointer ${
                          selectedElement.size === sz ? 'bg-[#0082FB] text-white border-[#0082FB]' : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}
                      >
                        {sz} мм
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 5. Barcode specific properties */}
            {selectedElement.type === 'barcode' && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div>
                  <label className="text-[11px] font-bold text-[#64748B]">Колонка со штрихкодом из CSV</label>
                  <input
                    type="text"
                    value={selectedElement.columnName}
                    onChange={(e) => updateElement(selectedElement.id, { columnName: e.target.value })}
                    className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2 mt-1"
                    placeholder="barcode"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#64748B]">Ширина штрихкода</label>
                    <span className="text-xs font-mono font-bold text-[#111827]">
                      {selectedElement.width} мм
                    </span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max={widthMm}
                    step="1"
                    value={selectedElement.width}
                    onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })}
                    className="w-full mt-1 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#64748B]">Высота штрихкода</label>
                    <span className="text-xs font-mono font-bold text-[#111827]">
                      {selectedElement.height} мм
                    </span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max={Math.min(30, heightMm)}
                    step="0.5"
                    value={selectedElement.height}
                    onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value) })}
                    className="w-full mt-1 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* 6. QR-code specific properties */}
            {selectedElement.type === 'qrcode' && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div>
                  <label className="text-[11px] font-bold text-[#64748B]">Ссылка / Текст или колонка CSV</label>
                  <input
                    type="text"
                    value={selectedElement.columnName}
                    onChange={(e) => updateElement(selectedElement.id, { columnName: e.target.value })}
                    className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2 mt-1"
                    placeholder="https://... или название колонки"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#64748B]">Размер QR-кода</label>
                    <span className="text-xs font-mono font-bold text-[#111827]">
                      {selectedElement.size} × {selectedElement.size} мм
                    </span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max={Math.min(widthMm, heightMm)}
                    step="0.5"
                    value={selectedElement.size}
                    onChange={(e) => updateElement(selectedElement.id, { size: Number(e.target.value) })}
                    className="w-full mt-1 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* 7. Box / Border specific properties */}
            {selectedElement.type === 'box' && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#64748B]">Ширина рамки</label>
                    <span className="text-xs font-mono font-bold text-[#111827]">
                      {selectedElement.width} мм
                    </span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max={widthMm}
                    step="1"
                    value={selectedElement.width}
                    onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })}
                    className="w-full mt-1 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#64748B]">Высота рамки</label>
                    <span className="text-xs font-mono font-bold text-[#111827]">
                      {selectedElement.height} мм
                    </span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max={heightMm}
                    step="1"
                    value={selectedElement.height}
                    onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value) })}
                    className="w-full mt-1 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#64748B]">Толщина рамки (мм)</label>
                    <span className="text-xs font-mono font-bold text-[#111827]">
                      {selectedElement.thickness || 0.3} мм
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.1"
                    value={selectedElement.thickness || 0.3}
                    onChange={(e) => updateElement(selectedElement.id, { thickness: Number(e.target.value) })}
                    className="w-full mt-1 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* 8. Symbol specific properties */}
            {selectedElement.type === 'symbol' && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div>
                  <label className="text-[11px] font-bold text-[#64748B]">Тип знака маркировки</label>
                  <select
                    value={selectedElement.symbolType}
                    onChange={(e) => updateElement(selectedElement.id, { symbolType: e.target.value as SymbolType })}
                    className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2 mt-1 bg-white cursor-pointer"
                  >
                    <optgroup label="Сертификация и соответствие">
                      <option value="EAC">Знак EAC (Официальный по ТР ТС)</option>
                      <option value="EAC_BOX">Знак [EAC] (В прямоугольной рамке)</option>
                      <option value="KZ_GOST">Знак СТ РК (Стандарт Казахстана)</option>
                      <option value="CE">Знак CE (Европейский стандарт)</option>
                    </optgroup>
                    <optgroup label="Уход за одеждой (ISO 3758)">
                      <option value="WASH_30">🧺 Стирка при 30°</option>
                      <option value="WASH_40">🧺 Стирка при 40°</option>
                      <option value="WASH_HAND">🖐 Ручная стирка</option>
                      <option value="DO_NOT_WASH">🚫 Не стирать</option>
                      <option value="NO_BLEACH">🚫 Не отбеливать</option>
                      <option value="BLEACH_OK">△ Отбеливание разрешено</option>
                      <option value="IRON_LOW">熨 Глажка до 110° (1 точка)</option>
                      <option value="IRON_MED">熨 Глажка до 150° (2 точки)</option>
                      <option value="DO_NOT_IRON">🚫 Не гладить</option>
                      <option value="NO_TUMBLE_DRY">🌀 Не сушить в барабане</option>
                      <option value="NO_DRY_CLEAN">🚫 Без химчистки</option>
                    </optgroup>
                    <optgroup label="Упаковка и экология (ГОСТ 14192)">
                      <option value="RECYCLE">♻ Петля 21 PAP (бумага/картон)</option>
                      <option value="RECYCLE_LDPE">♻ Петля 04 LDPE (полиэтилен)</option>
                      <option value="RECYCLE_PP">♻ Петля 05 PP (полипропилен)</option>
                      <option value="GLASS_FORK">🍷🍴 Бокал и вилка (Пищевой)</option>
                      <option value="FRAGILE">🍸 Хрупкое (Бокал с трещиной)</option>
                      <option value="KEEP_DRY">☂ Беречь от влаги (Зонт)</option>
                      <option value="THIS_WAY_UP">⬆⬆ Верх / Не кантовать</option>
                      <option value="TIDY_MAN">🚯 Не сорить (Tidy Man)</option>
                      <option value="KEEP_AWAY_SUN">☀️ Беречь от солнца</option>
                      <option value="TEMPERATURE_LIMIT">❄️ Температурный режим</option>
                    </optgroup>
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={!!selectedElement.hasBorder}
                    onChange={(e) => updateElement(selectedElement.id, { hasBorder: e.target.checked })}
                    className="rounded text-[#0082FB] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-gray-700">Квадратная рамка вокруг знака</span>
                </label>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#64748B]">Размер знака</label>
                    <span className="text-xs font-mono font-bold text-[#111827]">
                      {selectedElement.size} × {selectedElement.size} мм
                    </span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max={Math.min(25, Math.min(widthMm, heightMm))}
                    step="0.5"
                    value={selectedElement.size}
                    onChange={(e) => updateElement(selectedElement.id, { size: Number(e.target.value) })}
                    className="w-full mt-1 cursor-pointer"
                  />
                  <div className="flex gap-1.5 mt-1.5">
                    {[4, 5, 6, 8, 10].filter(s => s <= Math.min(widthMm, heightMm)).map((sz) => (
                      <button
                        key={sz}
                        onClick={() => updateElement(selectedElement.id, { size: sz })}
                        className={`flex-1 py-1 text-[10px] font-bold rounded border cursor-pointer ${
                          selectedElement.size === sz ? 'bg-[#0082FB] text-white border-[#0082FB]' : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}
                      >
                        {sz} мм
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 9. Divider specific properties */}
            {selectedElement.type === 'divider' && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div>
                  <label className="text-[11px] font-bold text-[#64748B]">Ориентация</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      onClick={() => updateElement(selectedElement.id, { orientation: 'horizontal' })}
                      className={`p-2 rounded-lg text-xs font-bold border cursor-pointer ${
                        selectedElement.orientation === 'horizontal' ? 'bg-[#0082FB] text-white border-[#0082FB]' : 'bg-gray-50 border-gray-200 text-gray-700'
                      }`}
                    >
                      Горизонтальная
                    </button>
                    <button
                      onClick={() => updateElement(selectedElement.id, { orientation: 'vertical' })}
                      className={`p-2 rounded-lg text-xs font-bold border cursor-pointer ${
                        selectedElement.orientation === 'vertical' ? 'bg-[#0082FB] text-white border-[#0082FB]' : 'bg-gray-50 border-gray-200 text-gray-700'
                      }`}
                    >
                      Вертикальная
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#64748B]">Длина (мм)</label>
                    <span className="text-xs font-mono font-bold text-[#111827]">
                      {selectedElement.length} мм
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max={Math.max(widthMm, heightMm)}
                    step="1"
                    value={selectedElement.length}
                    onChange={(e) => updateElement(selectedElement.id, { length: Number(e.target.value) })}
                    className="w-full mt-1 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#64748B]">Толщина линии (мм)</label>
                    <span className="text-xs font-mono font-bold text-[#111827]">
                      {selectedElement.thickness || 0.3} мм
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.1"
                    value={selectedElement.thickness || 0.3}
                    onChange={(e) => updateElement(selectedElement.id, { thickness: Number(e.target.value) })}
                    className="w-full mt-1 cursor-pointer"
                  />
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="text-center py-8 text-xs text-[#94A3B8]">
            Выберите элемент на макете для настройки параметров.
          </div>
        )}
      </div>
    </div>
  );
};
