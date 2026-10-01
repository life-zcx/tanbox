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
  columnName: string;
  matrixStructure?: 'four_regions' | 'auto';
}

export interface TextElement extends BaseElement {
  type: 'text';
  width: number; // in mm
  content: string; // e.g. "{name}" or "Арт: {sku}"
  fontSize: number; // pt
  fontWeight: 'normal' | 'bold';
  fontFamily?: string;
  align: 'left' | 'center' | 'right';
}

export interface SymbolElement extends BaseElement {
  type: 'symbol';
  symbolType: SymbolType;
  size: number; // in mm
  hasBorder?: boolean;
}

export interface DividerElement extends BaseElement {
  type: 'divider';
  length: number; // in mm
  orientation: 'horizontal' | 'vertical';
  thickness?: number; // in mm
}

export interface BarcodeElement extends BaseElement {
  type: 'barcode';
  width: number;
  height: number;
  columnName: string;
}

export interface QRCodeElement extends BaseElement {
  type: 'qrcode';
  size: number; // in mm
  columnName: string;
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
  | DividerElement 
  | BarcodeElement
  | QRCodeElement
  | BoxElement;

export interface LabelTemplate {
  name: string;
  widthMm: number;
  heightMm: number;
  elements: LabelElement[];
}

export interface SavedTemplate {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  description?: string;
  elements: LabelElement[];
  createdAt: string;
  updatedAt: string;
}
