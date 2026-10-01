import React from 'react';
import { 
  Minus, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  QrCode, 
  RotateCw 
} from 'lucide-react';
import { LabelElement } from '../types';
import { LabelSymbolSvg } from './LabelSymbolsSvg';
import { PreviewDataMatrixSvg } from '../../../components/common/StickerCanvasPreview';

interface LabelCanvasProps {
  widthMm: number;
  heightMm: number;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  currentRowIndex: number;
  setCurrentRowIndex: React.Dispatch<React.SetStateAction<number>>;
  csvRows: Record<string, string>[];
  activeRow: Record<string, string>;
  elements: LabelElement[];
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
  isDragging: boolean;
  draggingElementId: string | null;
  handleMouseDown: (e: React.MouseEvent, id: string) => void;
  rotateElementBy90: (id: string) => void;
}

export const LabelCanvas: React.FC<LabelCanvasProps> = ({
  widthMm,
  heightMm,
  zoom,
  setZoom,
  currentRowIndex,
  setCurrentRowIndex,
  csvRows,
  activeRow,
  elements,
  selectedElementId,
  setSelectedElementId,
  isDragging,
  draggingElementId,
  handleMouseDown,
  rotateElementBy90,
}) => {
  const baseScale = 7; // 1 mm = 7 px at 100% zoom
  const effectiveScale = baseScale * zoom;
  const canvasWidthPx = widthMm * effectiveScale;
  const canvasHeightPx = heightMm * effectiveScale;

  return (
    <div className="xl:col-span-6 bg-white p-6 sm:p-8 rounded-2xl border border-gray-200/80 shadow-xs space-y-5">
      {/* Canvas Top Toolbar: Format, Zoom, and CSV Row Pager */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-[#111827] uppercase tracking-wider">
            Холст
          </span>
          <span className="bg-gray-100 text-[#64748B] text-[11px] font-bold px-2 py-0.5 rounded-md">
            {widthMm} × {heightMm} мм
          </span>
        </div>

        {/* Interactive Zoom Toolbar */}
        <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl text-xs font-bold text-gray-700">
          <span className="text-[11px] text-gray-500 px-1.5 flex items-center gap-1">
            Зум:
          </span>
          <button
            onClick={() => setZoom((prev) => Math.max(0.75, Math.round((prev - 0.25) * 100) / 100))}
            title="Уменьшить"
            className="p-1 hover:bg-white rounded-lg transition-colors cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {([1, 1.5, 2, 3] as const).map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={`px-2 py-0.5 rounded-lg text-[11px] transition-all cursor-pointer ${
                zoom === z ? 'bg-[#0082FB] text-white shadow-xs' : 'hover:bg-white text-gray-600'
              }`}
            >
              {z * 100}%
            </button>
          ))}

          <button
            onClick={() => setZoom((prev) => Math.min(4, Math.round((prev + 0.25) * 100) / 100))}
            title="Увеличить"
            className="p-1 hover:bg-white rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pagination across CSV rows */}
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <span className="text-[#64748B]">Код:</span>
          <button
            onClick={() => setCurrentRowIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentRowIndex === 0}
            className="p-1 hover:bg-gray-100 rounded-md disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono">
            {currentRowIndex + 1} / {csvRows.length || 1}
          </span>
          <button
            onClick={() => setCurrentRowIndex((prev) => Math.min((csvRows.length || 1) - 1, prev + 1))}
            disabled={currentRowIndex >= (csvRows.length || 1) - 1}
            className="p-1 hover:bg-gray-100 rounded-md disabled:opacity-30 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Actual Label Visual Canvas in exact mm proportions with Zoom */}
      <div className="flex items-center justify-center p-6 sm:p-10 bg-[#F1F5F9] rounded-2xl border border-dashed border-gray-300 overflow-auto min-h-[380px] max-h-[620px]">
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedElementId(null);
            }
          }}
          style={{
            width: `${canvasWidthPx}px`,
            height: `${canvasHeightPx}px`,
            backgroundImage: 'radial-gradient(#CBD5E1 1.2px, transparent 1.2px)',
            backgroundSize: `${effectiveScale * 5}px ${effectiveScale * 5}px`,
          }}
          className="bg-white shadow-xl relative border border-gray-400 select-none overflow-hidden transition-all duration-100 shrink-0"
        >
          {elements.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center pointer-events-none">
              <QrCode className="w-8 h-8 text-gray-300 mb-1 stroke-1" />
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Пустой макет</span>
              <span className="text-[10px] text-gray-400 mt-0.5 max-w-[180px] leading-tight">
                Добавьте DataMatrix, текст или знак кнопками слева
              </span>
            </div>
          )}

          {elements.map((el) => {
            const isSelected = selectedElementId === el.id;
            const isItemDragging = isDragging && draggingElementId === el.id;
            const leftPx = el.x * effectiveScale;
            const topPx = el.y * effectiveScale;
            const rotation = el.rotation || 0;

            return (
              <div
                key={el.id}
                onMouseDown={(e) => handleMouseDown(e, el.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedElementId(el.id);
                }}
                style={{
                  position: 'absolute',
                  left: `${leftPx}px`,
                  top: `${topPx}px`,
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  touchAction: 'none',
                }}
                className={`select-none ${
                  isItemDragging
                    ? 'cursor-grabbing z-30 shadow-lg ring-2 ring-[#0082FB] bg-blue-50/40'
                    : isSelected
                    ? 'cursor-grab z-20 ring-2 ring-[#0082FB] ring-offset-1 bg-blue-50/20'
                    : 'cursor-grab z-10 hover:outline hover:outline-1 hover:outline-dashed hover:outline-blue-400'
                }`}
              >
                {/* Floating coordinates badge */}
                {isSelected && (
                  <div className="absolute -top-5 left-0 bg-[#0082FB] text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-40 flex items-center gap-1">
                    <span>{el.x} × {el.y} мм</span>
                    {rotation !== 0 && <span>({rotation}°)</span>}
                  </div>
                )}

                {/* Quick rotate icon button right on selected element */}
                {isSelected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      rotateElementBy90(el.id);
                    }}
                    title="Повернуть на 90°"
                    className="absolute -top-3.5 -right-3.5 w-6 h-6 rounded-full bg-white border border-gray-300 shadow hover:bg-blue-50 hover:text-[#0082FB] flex items-center justify-center text-gray-700 z-40 transition-transform active:rotate-90 cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Render Element Types on Canvas */}
                {el.type === 'datamatrix' && (
                  <PreviewDataMatrixSvg sizePx={el.size * effectiveScale} />
                )}

                {el.type === 'text' && (
                  <div
                    style={{
                      width: `${el.width * effectiveScale}px`,
                      fontSize: `${el.fontSize * (effectiveScale / baseScale) * 1.33}px`,
                      fontWeight: el.fontWeight === 'bold' ? 700 : 400,
                      fontFamily: el.fontFamily || 'Arial, sans-serif',
                      textAlign: el.align,
                      lineHeight: 1.2,
                    }}
                    className="text-black whitespace-pre-wrap break-words"
                  >
                    {el.content.replace(/\{([^{}]+)\}/g, (_, key) => activeRow[key] || `{${key}}`)}
                  </div>
                )}

                {el.type === 'barcode' && (
                  <div
                    style={{
                      width: `${el.width * effectiveScale}px`,
                      height: `${el.height * effectiveScale}px`,
                    }}
                    className="bg-white border border-gray-300 p-0.5 flex flex-col items-center justify-between shadow-xs select-none overflow-hidden"
                  >
                    <div className="w-full flex-1 flex items-stretch gap-[1.5px] px-0.5 justify-between">
                      {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 4, 1, 2, 3, 1].map((_, idx) => (
                        <div
                          key={idx}
                          className={idx % 2 === 0 ? 'bg-black flex-1' : 'bg-transparent flex-1'}
                        />
                      ))}
                    </div>
                    <span
                      style={{ fontSize: `${Math.max(5.5, Math.min(9, el.height * effectiveScale * 0.28))}px` }}
                      className="font-mono text-black font-bold tracking-wider leading-none truncate max-w-full"
                    >
                      {activeRow[el.columnName] || el.columnName || '2000000001234'}
                    </span>
                  </div>
                )}

                {el.type === 'qrcode' && (
                  <div
                    style={{
                      width: `${el.size * effectiveScale}px`,
                      height: `${el.size * effectiveScale}px`,
                    }}
                    className="bg-white border border-gray-400 p-0.5 flex items-center justify-center shadow-xs select-none"
                  >
                    <svg viewBox="0 0 100 100" className="w-full h-full" fill="currentColor">
                      <rect x="5" y="5" width="30" height="30" fill="none" stroke="black" strokeWidth="6" />
                      <rect x="13" y="13" width="14" height="14" fill="black" />
                      <rect x="65" y="5" width="30" height="30" fill="none" stroke="black" strokeWidth="6" />
                      <rect x="73" y="13" width="14" height="14" fill="black" />
                      <rect x="5" y="65" width="30" height="30" fill="none" stroke="black" strokeWidth="6" />
                      <rect x="13" y="73" width="14" height="14" fill="black" />
                      <rect x="42" y="10" width="6" height="6" />
                      <rect x="52" y="10" width="6" height="6" />
                      <rect x="42" y="22" width="6" height="6" />
                      <rect x="10" y="42" width="6" height="6" />
                      <rect x="22" y="42" width="6" height="6" />
                      <rect x="42" y="42" width="16" height="16" />
                      <rect x="65" y="42" width="8" height="8" />
                      <rect x="80" y="42" width="6" height="6" />
                      <rect x="42" y="65" width="8" height="8" />
                      <rect x="55" y="75" width="6" height="6" />
                      <rect x="70" y="65" width="10" height="10" />
                      <rect x="85" y="75" width="8" height="8" />
                      <rect x="65" y="85" width="6" height="6" />
                      <rect x="80" y="85" width="8" height="8" />
                    </svg>
                  </div>
                )}

                {el.type === 'symbol' && (
                  <div
                    style={{
                      width: `${el.size * effectiveScale}px`,
                      height: `${el.size * effectiveScale}px`,
                    }}
                    className={`flex items-center justify-center select-none text-black ${
                      el.hasBorder ? 'border border-black p-0.5' : ''
                    }`}
                  >
                    <LabelSymbolSvg symbolType={el.symbolType} sizePx={el.size * effectiveScale} />
                  </div>
                )}

                {el.type === 'box' && (
                  <div
                    style={{
                      width: `${el.width * effectiveScale}px`,
                      height: `${el.height * effectiveScale}px`,
                      borderWidth: `${Math.max(1, (el.thickness || 0.3) * effectiveScale)}px`,
                    }}
                    className="border-black bg-transparent select-none box-border"
                  />
                )}

                {el.type === 'divider' && (
                  <div
                    style={{
                      width: el.orientation === 'horizontal' ? `${el.length * effectiveScale}px` : `${Math.max(1, (el.thickness || 0.3) * effectiveScale)}px`,
                      height: el.orientation === 'horizontal' ? `${Math.max(1, (el.thickness || 0.3) * effectiveScale)}px` : `${el.length * effectiveScale}px`,
                    }}
                    className="bg-black"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between text-xs text-[#64748B] pt-2 gap-2">
        <span>💡 Зажмите и тяните элемент мышкой. Кнопка <strong>⟳</strong> или стрелки на клавиатуре меняют положение и поворот.</span>
        {widthMm <= 35 && (
          <span className="text-[#0082FB] font-bold">
            🔎 Для размера 30×20 мм включен увеличенный масштаб ({zoom * 100}%)
          </span>
        )}
      </div>
    </div>
  );
};
