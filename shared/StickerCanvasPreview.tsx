import React from 'react';

export type SymbolType =
  | 'EAC'
  | 'EAC_BOX'
  | 'KZ_GOST'
  | 'CE'
  | 'RECYCLE'
  | 'RECYCLE_LDPE'
  | 'RECYCLE_PP'
  | 'GLASS_FORK'
  | 'FRAGILE'
  | 'KEEP_DRY'
  | 'THIS_WAY_UP'
  | 'TIDY_MAN'
  | 'KEEP_AWAY_SUN'
  | 'TEMPERATURE_LIMIT'
  | 'WASH_30'
  | 'WASH_40'
  | 'WASH_HAND'
  | 'DO_NOT_WASH'
  | 'NO_BLEACH'
  | 'BLEACH_OK'
  | 'IRON_LOW'
  | 'IRON_MED'
  | 'DO_NOT_IRON'
  | 'NO_TUMBLE_DRY'
  | 'NO_DRY_CLEAN';

export interface LabelElement {
  id: string;
  type: 'datamatrix' | 'text' | 'symbol' | 'divider' | 'barcode' | 'qrcode' | 'box';
  x: number;
  y: number;
  rotation?: number;
  [key: string]: any;
}

export const PreviewSymbolSvg: React.FC<{ symbolType: SymbolType; sizePx: number }> = ({ symbolType, sizePx }) => {
  switch (symbolType) {
    case 'EAC':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="currentColor">
          <rect x="0" y="0" width="14" height="100"/>
          <rect x="14" y="0" width="14" height="14"/>
          <rect x="14" y="43" width="11" height="14"/>
          <rect x="14" y="86" width="14" height="14"/>
          <rect x="36" y="0" width="10" height="100"/>
          <rect x="54" y="0" width="10" height="100"/>
          <rect x="46" y="0" width="8" height="14"/>
          <rect x="46" y="43" width="8" height="14"/>
          <rect x="72" y="0" width="14" height="100"/>
          <rect x="86" y="0" width="14" height="14"/>
          <rect x="86" y="86" width="14" height="14"/>
        </svg>
      );
    case 'EAC_BOX':
      return (
        <div
          className="w-full h-full border-[1.5px] border-black font-black text-black flex items-center justify-center text-center tracking-tight leading-none font-sans"
          style={{ fontSize: `${sizePx * 0.38}px` }}
        >
          EAC
        </div>
      );
    case 'KZ_GOST':
      return (
        <div
          className="w-full h-full border-[1.5px] border-black font-black text-black flex items-center justify-center text-center tracking-tight leading-none font-sans"
          style={{ fontSize: `${sizePx * 0.28}px` }}
        >
          СТ РК
        </div>
      );
    case 'CE':
      return (
        <div
          className="w-full h-full font-black text-black flex items-center justify-center text-center tracking-tight leading-none font-sans"
          style={{ fontSize: `${sizePx * 0.55}px` }}
        >
          CE
        </div>
      );
    case 'RECYCLE':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="50,10 92,80 8,80" />
          <text x="50" y="52" textAnchor="middle" fill="currentColor" stroke="none" fontSize="22" fontWeight="bold" fontFamily="Arial, sans-serif">21</text>
          <text x="50" y="73" textAnchor="middle" fill="currentColor" stroke="none" fontSize="13" fontWeight="bold" fontFamily="Arial, sans-serif">PAP</text>
        </svg>
      );
    case 'RECYCLE_LDPE':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="50,10 92,80 8,80" />
          <text x="50" y="52" textAnchor="middle" fill="currentColor" stroke="none" fontSize="22" fontWeight="bold" fontFamily="Arial, sans-serif">04</text>
          <text x="50" y="73" textAnchor="middle" fill="currentColor" stroke="none" fontSize="12" fontWeight="bold" fontFamily="Arial, sans-serif">LDPE</text>
        </svg>
      );
    case 'RECYCLE_PP':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="50,10 92,80 8,80" />
          <text x="50" y="52" textAnchor="middle" fill="currentColor" stroke="none" fontSize="22" fontWeight="bold" fontFamily="Arial, sans-serif">05</text>
          <text x="50" y="73" textAnchor="middle" fill="currentColor" stroke="none" fontSize="13" fontWeight="bold" fontFamily="Arial, sans-serif">PP</text>
        </svg>
      );
    case 'GLASS_FORK':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 15 20 L 45 20 L 40 55 Q 30 65 20 55 Z" />
          <line x1="30" y1="65" x2="30" y2="85" />
          <line x1="18" y1="85" x2="42" y2="85" />
          <line x1="72" y1="45" x2="72" y2="85" />
          <line x1="62" y1="20" x2="62" y2="45" />
          <line x1="72" y1="20" x2="72" y2="45" />
          <line x1="82" y1="20" x2="82" y2="45" />
          <line x1="62" y1="45" x2="82" y2="45" />
        </svg>
      );
    case 'FRAGILE':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 28 15 L 72 15 L 68 50 Q 50 65 32 50 Z" />
          <path d="M 55 15 L 47 30 L 54 42" />
          <line x1="50" y1="65" x2="50" y2="85" />
          <line x1="30" y1="85" x2="70" y2="85" />
        </svg>
      );
    case 'THIS_WAY_UP':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <line x1="10" y1="85" x2="90" y2="85" />
          <line x1="32" y1="78" x2="32" y2="20" />
          <polyline points="18,38 32,18 46,38" />
          <line x1="68" y1="78" x2="68" y2="20" />
          <polyline points="54,38 68,18 82,38" />
        </svg>
      );
    case 'TIDY_MAN':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="40" cy="22" r="8" fill="currentColor" />
          <line x1="40" y1="30" x2="38" y2="58" />
          <line x1="38" y1="58" x2="30" y2="85" />
          <line x1="38" y1="58" x2="46" y2="85" />
          <line x1="40" y1="35" x2="60" y2="42" />
          <circle cx="63" cy="49" r="3" fill="currentColor" />
          <polyline points="60,55 63,85 80,85 83,55" />
        </svg>
      );
    case 'KEEP_AWAY_SUN':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="50" cy="60" r="16" />
          <line x1="50" y1="40" x2="50" y2="30" />
          <line x1="50" y1="80" x2="50" y2="90" />
          <line x1="30" y1="60" x2="20" y2="60" />
          <line x1="70" y1="60" x2="80" y2="60" />
          <polyline points="15,25 50,15 85,25" />
        </svg>
      );
    case 'TEMPERATURE_LIMIT':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="43" y="15" width="14" height="50" rx="7" />
          <circle cx="50" cy="75" r="14" fill="currentColor" />
          <line x1="57" y1="25" x2="69" y2="25" />
          <line x1="57" y1="40" x2="69" y2="40" />
          <line x1="57" y1="55" x2="69" y2="55" />
        </svg>
      );
    case 'WASH_30':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 10 30 L 20 80 L 80 80 L 90 30" />
          <path d="M 10 45 Q 30 35 50 45 Q 70 55 90 45" />
          <text x="50" y="73" textAnchor="middle" fill="currentColor" stroke="none" fontSize="25" fontWeight="bold" fontFamily="Arial, sans-serif">30°</text>
        </svg>
      );
    case 'WASH_40':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 10 30 L 20 80 L 80 80 L 90 30" />
          <path d="M 10 45 Q 30 35 50 45 Q 70 55 90 45" />
          <text x="50" y="73" textAnchor="middle" fill="currentColor" stroke="none" fontSize="25" fontWeight="bold" fontFamily="Arial, sans-serif">40°</text>
        </svg>
      );
    case 'WASH_HAND':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 10 30 L 20 80 L 80 80 L 90 30" />
          <path d="M 10 45 Q 30 35 50 45 Q 70 55 90 45" />
          <polyline points="35,15 50,50 65,35" strokeWidth="5" />
        </svg>
      );
    case 'DO_NOT_WASH':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 10 30 L 20 80 L 80 80 L 90 30" />
          <path d="M 10 45 Q 30 35 50 45 Q 70 55 90 45" />
          <line x1="15" y1="85" x2="85" y2="25" strokeWidth="7" />
          <line x1="15" y1="25" x2="85" y2="85" strokeWidth="7" />
        </svg>
      );
    case 'NO_BLEACH':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="50,15 88,85 12,85" />
          <line x1="20" y1="80" x2="80" y2="20" />
          <line x1="20" y1="20" x2="80" y2="80" />
        </svg>
      );
    case 'BLEACH_OK':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="50,15 88,85 12,85" />
        </svg>
      );
    case 'IRON_LOW':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 15 75 L 75 75 Q 90 50 60 35 L 15 35 Z" />
          <circle cx="45" cy="55" r="5" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'IRON_MED':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 15 75 L 75 75 Q 90 50 60 35 L 15 35 Z" />
          <circle cx="38" cy="55" r="4.5" fill="currentColor" stroke="none" />
          <circle cx="52" cy="55" r="4.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'DO_NOT_IRON':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 15 75 L 75 75 Q 90 50 60 35 L 15 35 Z" />
          <line x1="15" y1="80" x2="85" y2="30" strokeWidth="7" />
          <line x1="15" y1="30" x2="85" y2="80" strokeWidth="7" />
        </svg>
      );
    case 'NO_TUMBLE_DRY':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="15" y="15" width="70" height="70" />
          <circle cx="50" cy="50" r="28" />
          <line x1="15" y1="85" x2="85" y2="15" strokeWidth="6" />
          <line x1="15" y1="15" x2="85" y2="85" strokeWidth="6" />
        </svg>
      );
    case 'NO_DRY_CLEAN':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="50" cy="50" r="38" />
          <line x1="15" y1="85" x2="85" y2="15" strokeWidth="7" />
          <line x1="15" y1="15" x2="85" y2="85" strokeWidth="7" />
        </svg>
      );
    case 'KEEP_DRY':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 15 50 Q 50 15 85 50 Z" />
          <line x1="15" y1="50" x2="85" y2="50" />
          <path d="M 50 50 L 50 80 Q 50 90 40 90" />
        </svg>
      );
    default:
      return null;
  }
};

interface StickerCanvasPreviewProps {
  widthMm: number;
  heightMm: number;
  elements?: LabelElement[];
  scale?: number;
  previewData?: Record<string, string>;
  className?: string;
}

const DM_N = 24;
const DM_HALF = DM_N / 2;
const DM_SUBREGIONS = [
  { r0: 0, c0: 0, r1: DM_HALF - 1, c1: DM_HALF - 1 },
  { r0: 0, c0: DM_HALF, r1: DM_HALF - 1, c1: DM_N - 1 },
  { r0: DM_HALF, c0: 0, r1: DM_N - 1, c1: DM_HALF - 1 },
  { r0: DM_HALF, c0: DM_HALF, r1: DM_N - 1, c1: DM_N - 1 },
];

const DM_GRID: boolean[][] = Array.from({ length: DM_N }, (_, r) =>
  Array.from({ length: DM_N }, (_, c) => {
    for (const sub of DM_SUBREGIONS) {
      if (r >= sub.r0 && r <= sub.r1 && c >= sub.c0 && c <= sub.c1) {
        if (r === sub.r1 || c === sub.c0) return true; // Solid L finder
        if (r === sub.r0) return (c - sub.c0) % 2 === 0; // Alternating top
        if (c === sub.c1) return (r - sub.r0) % 2 === 1; // Alternating right
        const seed = (r * 31 + c * 17 + (r ^ c) * 11) % 100;
        return seed > 48;
      }
    }
    return false;
  })
);

export const PreviewDataMatrixSvg: React.FC<{ sizePx: number }> = ({ sizePx }) => {
  return (
    <div
      style={{ width: `${sizePx}px`, height: `${sizePx}px` }}
      className="relative flex items-center justify-center bg-white p-[1px] select-none border border-black shadow-2xs"
    >
      <svg
        viewBox={`0 0 ${DM_N} ${DM_N}`}
        width="100%"
        height="100%"
        className="block"
        shapeRendering="crispEdges"
      >
        {DM_GRID.map((row, r) =>
          row.map((val, c) =>
            val ? (
              <rect
                key={`${r}-${c}`}
                x={c}
                y={r}
                width={1}
                height={1}
                fill="#000000"
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
};

export const StickerCanvasPreview: React.FC<StickerCanvasPreviewProps> = ({
  widthMm,
  heightMm,
  elements = [],
  scale = 4.5,
  previewData = {},
  className = '',
}) => {
  const baseScale = 7;
  const canvasWidthPx = widthMm * scale;
  const canvasHeightPx = heightMm * scale;

  return (
    <div
      style={{
        width: `${canvasWidthPx}px`,
        height: `${canvasHeightPx}px`,
      }}
      className={`relative bg-white border-2 border-black rounded-lg shadow-md overflow-hidden select-none text-left font-sans ${className}`}
    >
      {elements.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-gray-50/50">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            {widthMm} × {heightMm} мм
          </span>
          <span className="text-[9px] text-gray-400 mt-1">
            Черновик этикетки пустой
          </span>
        </div>
      ) : (
        elements.map((el) => {
          const leftPx = el.x * scale;
          const topPx = el.y * scale;
          const rotation = el.rotation || 0;

          return (
            <div
              key={el.id}
              style={{
                position: 'absolute',
                left: `${leftPx}px`,
                top: `${topPx}px`,
                transform: `rotate(${rotation}deg)`,
                transformOrigin: 'center center',
              }}
              className="pointer-events-none"
            >
              {/* Data Matrix */}
              {el.type === 'datamatrix' && (
                <PreviewDataMatrixSvg sizePx={el.size * scale} />
              )}

              {/* Text */}
              {el.type === 'text' && (
                <div
                  style={{
                    width: `${el.width * scale}px`,
                    fontSize: `${el.fontSize * (scale / baseScale) * 1.33}px`,
                    fontWeight: el.fontWeight === 'bold' ? 700 : 400,
                    fontFamily: el.fontFamily || 'Arial, sans-serif',
                    textAlign: el.align || 'left',
                    lineHeight: 1.2,
                  }}
                  className="text-black whitespace-pre-wrap break-words"
                >
                  {el.content?.replace(/\{([^{}]+)\}/g, (_: string, key: string) => previewData[key] || `{${key}}`)}
                </div>
              )}

              {/* Barcode */}
              {el.type === 'barcode' && (
                <div
                  style={{
                    width: `${el.width * scale}px`,
                    height: `${el.height * scale}px`,
                  }}
                  className="bg-white border border-gray-300 p-0.5 flex flex-col items-center justify-between shadow-xs select-none overflow-hidden"
                >
                  <div className="w-full flex-1 flex items-stretch gap-[1px] px-0.5 justify-between">
                    {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 4, 1, 2, 3, 1].map((_, idx) => (
                      <div
                        key={idx}
                        className={idx % 2 === 0 ? 'bg-black flex-1' : 'bg-transparent flex-1'}
                      />
                    ))}
                  </div>
                  <span
                    style={{ fontSize: `${Math.max(5, Math.min(8.5, el.height * scale * 0.28))}px` }}
                    className="font-mono text-black font-bold tracking-wider leading-none truncate max-w-full"
                  >
                    {previewData[el.columnName] || el.columnName || '2000000001234'}
                  </span>
                </div>
              )}

              {/* QR Code */}
              {el.type === 'qrcode' && (
                <div
                  style={{
                    width: `${el.size * scale}px`,
                    height: `${el.size * scale}px`,
                  }}
                  className="bg-white border border-gray-400 p-0.5 flex items-center justify-center shadow-xs"
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full" fill="currentColor">
                    <rect x="5" y="5" width="30" height="30" fill="none" stroke="black" strokeWidth="6" />
                    <rect x="13" y="13" width="14" height="14" fill="black" />
                    <rect x="65" y="5" width="30" height="30" fill="none" stroke="black" strokeWidth="6" />
                    <rect x="73" y="13" width="14" height="14" fill="black" />
                    <rect x="5" y="65" width="30" height="30" fill="none" stroke="black" strokeWidth="6" />
                    <rect x="13" y="73" width="14" height="14" fill="black" />
                    <rect x="42" y="42" width="16" height="16" />
                  </svg>
                </div>
              )}

              {/* Symbol */}
              {el.type === 'symbol' && (
                <div
                  style={{
                    width: `${el.size * scale}px`,
                    height: `${el.size * scale}px`,
                  }}
                  className={`flex items-center justify-center text-black ${
                    el.hasBorder ? 'border border-black p-0.5' : ''
                  }`}
                >
                  <PreviewSymbolSvg symbolType={el.symbolType} sizePx={el.size * scale} />
                </div>
              )}

              {/* Divider */}
              {el.type === 'divider' && (
                <div
                  style={{
                    width: el.orientation === 'horizontal' ? `${el.length * scale}px` : `${Math.max(1, (el.thickness || 0.3) * scale)}px`,
                    height: el.orientation === 'horizontal' ? `${Math.max(1, (el.thickness || 0.3) * scale)}px` : `${el.length * scale}px`,
                  }}
                  className="bg-black"
                />
              )}

              {/* Box */}
              {el.type === 'box' && (
                <div
                  style={{
                    width: `${el.width * scale}px`,
                    height: `${el.height * scale}px`,
                    borderWidth: `${Math.max(1, (el.thickness || 0.3) * scale)}px`,
                  }}
                  className="border-black bg-transparent box-border"
                />
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
