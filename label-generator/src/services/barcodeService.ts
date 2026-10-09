import bwipjs from 'bwip-js';

export interface RawMatrixSymbol {
  pixs: number[];
  pixx: number;
  pixy: number;
}

/**
 * Normalizes input text and applies GS1 FNC1 encoding for TANBA / ИС МПТ Kazakhstan.
 */
function prepareDataMatrixInput(text: string): { bwipText: string; useParsefnc: boolean } {
  let cleanText = text.trim();

  // Strip enclosing quotes if present (e.g. from CSV lines)
  if (cleanText.startsWith('"') && cleanText.endsWith('"')) {
    cleanText = cleanText.slice(1, -1).trim();
  }

  // Normalize all possible representations of GS (ASCII 29) to \x1D first
  cleanText = cleanText
    .replace(/\\u001d/gi, '\x1D')
    .replace(/\\x1d/gi, '\x1D')
    .replace(/<gs>/gi, '\x1D')
    .replace(/\^]/g, '\x1D');

  let bwipText = cleanText;
  let useParsefnc = false;

  // Check if code is a GS1 marking code (TANBA Казахстан / Честный Знак: starts with AI 01 followed by 14 digits)
  if (/^01\d{14}/.test(cleanText)) {
    // In DataMatrix ECC200, GS1 compliance requires:
    // 1. FNC1 in the first position (signals GS1 ]d2 format to 2D scanners)
    // 2. FNC1 as the delimiter between variable-length fields (AI 21 serial, AI 91 key)
    let fnc1Body = cleanText.replace(/[\x1D\u001D]/g, '^FNC1');
    if (!fnc1Body.startsWith('^FNC1')) {
      fnc1Body = '^FNC1' + fnc1Body;
    }
    bwipText = fnc1Body;
    useParsefnc = true;
  }

  return { bwipText, useParsefnc };
}

/**
 * High-performance synchronous raw DataMatrix bit extraction.
 * Bypasses all PNG encoding/decoding and zlib compression.
 * Enforces 4-region 36x36 / 40x40 / 44x44 structure for TANBA Kazakhstan.
 */
export function generateDataMatrixRaw(
  text: string,
  matrixStructure: 'four_regions' | 'auto' = 'four_regions'
): RawMatrixSymbol {
  const { bwipText, useParsefnc } = prepareDataMatrixInput(text);

  if (matrixStructure !== 'auto') {
    const candidateSizes = [36, 40, 44, 48];
    for (const s of candidateSizes) {
      try {
        const raw = bwipjs.raw({
          bcid: 'datamatrix',
          text: bwipText,
          parsefnc: useParsefnc,
          rows: s,
          columns: s,
        } as any) as any;
        if (raw && raw[0] && raw[0].pixs && raw[0].pixx && raw[0].pixy) {
          return {
            pixs: raw[0].pixs,
            pixx: raw[0].pixx,
            pixy: raw[0].pixy,
          };
        }
      } catch {
        // try next larger size
      }
    }
  }

  const raw = bwipjs.raw({
    bcid: 'datamatrix',
    text: bwipText,
    parsefnc: useParsefnc,
  } as any) as any;
  const first = raw && raw[0];
  return {
    pixs: first?.pixs || [],
    pixx: first?.pixx || 0,
    pixy: first?.pixy || 0,
  };
}

/**
 * Raw vector QR Code symbol matrix
 */
export function generateQRCodeRaw(text: string): RawMatrixSymbol {
  const cleanText = text.trim();
  const raw = bwipjs.raw({
    bcid: 'qrcode',
    text: cleanText,
  } as any) as any;
  const first = raw && raw[0];
  return {
    pixs: first?.pixs || [],
    pixx: first?.pixx || 0,
    pixy: first?.pixy || 0,
  };
}

/**
 * Generates high-res DataMatrix ECC200 PNG buffer (legacy fallback).
 */
export async function generateDataMatrixBuffer(
  text: string,
  matrixStructure: 'four_regions' | 'auto' = 'four_regions'
): Promise<Buffer> {
  const { bwipText, useParsefnc } = prepareDataMatrixInput(text);

  if (matrixStructure !== 'auto') {
    const candidateSizes = [36, 40, 44, 48];
    for (const s of candidateSizes) {
      try {
        const png = await new Promise<Buffer>((resolve, reject) => {
          bwipjs.toBuffer(
            {
              bcid: 'datamatrix',
              text: bwipText,
              parsefnc: useParsefnc,
              rows: s,
              columns: s,
              padding: 2,
              scale: 5,
              includetext: false,
            } as any,
            (err, buf) => (err ? reject(err) : resolve(buf))
          );
        });
        return png;
      } catch {}
    }
  }

  return new Promise<Buffer>((resolve, reject) => {
    bwipjs.toBuffer(
      {
        bcid: 'datamatrix',
        text: bwipText,
        parsefnc: useParsefnc,
        padding: 2,
        scale: 5,
        includetext: false,
      } as any,
      (err, png) => {
        if (err) return reject(err);
        resolve(png);
      }
    );
  });
}

export async function generateCode128Buffer(text: string): Promise<Buffer> {
  const cleanText = text.trim();

  return new Promise((resolve, reject) => {
    bwipjs.toBuffer(
      {
        bcid: 'code128',
        text: cleanText,
        scale: 3,
        height: 10,
        includetext: true,
        textsize: 8,
      },
      (err, png) => {
        if (err) return reject(err);
        resolve(png);
      }
    );
  });
}

export async function generateQRCodeBuffer(text: string): Promise<Buffer> {
  const cleanText = text.trim();

  return new Promise((resolve, reject) => {
    bwipjs.toBuffer(
      {
        bcid: 'qrcode',
        text: cleanText,
        scale: 4,
        padding: 1,
      },
      (err, png) => {
        if (err) return reject(err);
        resolve(png);
      }
    );
  });
}

