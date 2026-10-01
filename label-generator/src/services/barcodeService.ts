import bwipjs from 'bwip-js';

/**
 * Generates high-res DataMatrix ECC200 PNG buffer.
 * By default enforces 4-region (four_regions) structure:
 * Minimum size 32x32 / 36x36 / 40x40 (the official standard for TANBA / Таңба and ИС МПТ Казахстан).
 * Automatically adds ^FNC1 codeword if code starts with AI 01 for full GS1 / scanner compliance.
 */
export async function generateDataMatrixBuffer(
  text: string,
  matrixStructure: 'four_regions' | 'auto' = 'four_regions'
): Promise<Buffer> {
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
    // In bwip-js with parsefnc: true, ^FNC1 generates the official GS1 FNC1 codeword (232).
    let fnc1Body = cleanText.replace(/[\x1D\u001D]/g, '^FNC1');
    if (!fnc1Body.startsWith('^FNC1')) {
      fnc1Body = '^FNC1' + fnc1Body;
    }
    bwipText = fnc1Body;
    useParsefnc = true;
  }

  // If four_regions is requested (official standard for TANBA / Таңба и ИС МПТ):
  // Candidate sizes with 4 sub-quadrants: 36x36 (standard for 85-88 chars), 40x40, 44x44
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
              padding: 2, // 2-module quiet zone required for barcode scanner detection
              scale: 5,   // High resolution for 203/300 DPI thermal printing
              includetext: false,
            } as any,
            (err, buf) => (err ? reject(err) : resolve(buf))
          );
        });
        return png;
      } catch {
        // Continue to next larger matrix size that fits the text
      }
    }
  }

  // Fallback to auto-sizing with quiet zone
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

