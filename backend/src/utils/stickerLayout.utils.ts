export interface StickerElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  size?: number;
  columnName?: string;
  matrixStructure?: string;
  content?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  align?: string;
  rotation?: number;
}

export interface StickerLayout {
  widthMm: number;
  heightMm: number;
  elements: StickerElement[];
}

export const getDefaultStickerLayout = (
  widthMm: number,
  heightMm: number,
  companyName?: string
): StickerLayout => {
  const w = widthMm || 58;
  const h = heightMm || 40;
  const dmSize = Math.min(22, Math.floor(h * 0.55));

  return {
    widthMm: w,
    heightMm: h,
    elements: [
      {
        id: 'el-dm',
        type: 'datamatrix',
        x: 3,
        y: 4,
        size: dmSize,
        columnName: 'code',
        matrixStructure: 'four_regions',
        rotation: 0,
      },
      {
        id: 'el-title',
        type: 'text',
        x: dmSize + 6,
        y: 4,
        width: Math.max(10, w - dmSize - 8),
        content: companyName || 'МАРКИРОВКА ТОВАРА',
        fontSize: 6.5,
        fontWeight: 'bold',
        fontFamily: 'Arial, sans-serif',
        align: 'left',
        rotation: 0,
      },
      {
        id: 'el-gtin',
        type: 'text',
        x: dmSize + 6,
        y: 11,
        width: Math.max(10, w - dmSize - 8),
        content: 'GTIN: {gtin}',
        fontSize: 5,
        fontWeight: 'normal',
        fontFamily: 'Arial, sans-serif',
        align: 'left',
        rotation: 0,
      },
      {
        id: 'el-serial',
        type: 'text',
        x: dmSize + 6,
        y: 16,
        width: Math.max(10, w - dmSize - 8),
        content: 'С/Н: {serial}',
        fontSize: 5,
        fontWeight: 'normal',
        fontFamily: 'Arial, sans-serif',
        align: 'left',
        rotation: 0,
      },
      {
        id: 'el-eac',
        type: 'eac',
        x: w - 9,
        y: h - 9,
        width: 6,
        height: 6,
        rotation: 0,
      },
    ],
  };
};
