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

export interface BaseElement {
  id: string;
  type: 'datamatrix' | 'text' | 'symbol' | 'divider' | 'barcode' | 'qrcode' | 'box';
  x: number; // in mm
  y: number; // in mm
  rotation?: number; // 0, 90, 180, 270 degrees
}

export interface DataMatrixElement extends BaseElement {
  type: 'datamatrix';
  size: number; // in mm
  columnName: string; // Column from CSV, e.g. "code"
  matrixStructure?: 'four_regions' | 'auto'; // 'four_regions' forces 32x32 / 36x36 (TANBA / ИС МПТ РК standard with 4 sections)
}

export interface TextElement extends BaseElement {
  type: 'text';
  width: number; // in mm
  content: string; // Template string with {variables}, e.g. "Артикул: {sku}"
  fontSize: number; // in pt (e.g. 6, 7, 8, 9, 10)
  fontWeight: 'normal' | 'bold';
  fontFamily?: 'Arial' | 'Roboto' | 'Inter' | 'Courier' | 'Times' | string;
  align: 'left' | 'center' | 'right';
  maxLines?: number;
}

export interface SymbolElement extends BaseElement {
  type: 'symbol';
  symbolType: SymbolType;
  size: number; // in mm
  hasBorder?: boolean;
}

export interface BarcodeElement extends BaseElement {
  type: 'barcode';
  width: number; // in mm
  height: number; // in mm
  columnName: string;
  format?: 'code128' | 'ean13';
}

export interface QRCodeElement extends BaseElement {
  type: 'qrcode';
  size: number; // in mm
  columnName: string; // CSV column or static text/URL
}

export interface DividerElement extends BaseElement {
  type: 'divider';
  length: number; // in mm
  orientation: 'horizontal' | 'vertical';
  thickness?: number; // in mm
}

export interface BoxElement extends BaseElement {
  type: 'box';
  width: number; // in mm
  height: number; // in mm
  thickness?: number; // in mm
}

export type LabelElement = 
  | DataMatrixElement 
  | TextElement 
  | SymbolElement 
  | BarcodeElement 
  | QRCodeElement
  | DividerElement
  | BoxElement;

export interface LabelTemplate {
  name: string;
  widthMm: number; // e.g. 58
  heightMm: number; // e.g. 40
  elements: LabelElement[];
}

export interface GeneratePdfRequest {
  template: LabelTemplate;
  csvData?: Record<string, string>[];
  csvText?: string;
  limit?: number;
}
