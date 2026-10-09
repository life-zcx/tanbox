import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { LabelTemplate, LabelElement } from '../types.js';
import {
  generateDataMatrixBuffer,
  generateDataMatrixRaw,
  generateQRCodeRaw,
  generateCode128Buffer,
  generateQRCodeBuffer,
  RawMatrixSymbol,
} from './barcodeService.js';
import { drawSymbol } from './symbolsService.js';

// Conversion constant: 1 mm ≈ 2.83464567 points
export const MM_TO_PT = 2.83464567;

export function mmToPt(mm: number): number {
  return mm * MM_TO_PT;
}

/**
 * Draws a 2D matrix (DataMatrix ECC200 or QR code) directly with PDFKit vector rectangles.
 * Merges consecutive horizontal black modules (run-length encoding) to minimize PDF operators.
 * Completely eliminates PNG rasterization, decompression, and zlib overhead.
 * Results in 100% sharp vector printing at any DPI (203/300/600 DPI) with zero blur.
 */
export function drawMatrixVector(
  doc: typeof PDFDocument,
  matrix: RawMatrixSymbol,
  xPt: number,
  yPt: number,
  sizePt: number,
  quietModules: number = 1
): void {
  const { pixs, pixx, pixy } = matrix;
  if (!pixs || pixx <= 0 || pixy <= 0) return;

  const totalCols = pixx + 2 * quietModules;
  const totalRows = pixy + 2 * quietModules;
  const modSize = sizePt / Math.max(totalCols, totalRows);

  doc.save();
  // Clear white background for quiet zone
  doc.rect(xPt, yPt, sizePt, sizePt).fill('#ffffff');

  const startX = xPt + quietModules * modSize;
  const startY = yPt + quietModules * modSize;

  doc.fillColor('#000000');
  for (let r = 0; r < pixy; r++) {
    let runLen = 0;
    let runStart = 0;
    const rowOffset = r * pixx;
    for (let c = 0; c < pixx; c++) {
      if (pixs[rowOffset + c]) {
        if (runLen === 0) runStart = c;
        runLen++;
      } else if (runLen > 0) {
        doc.rect(
          startX + runStart * modSize,
          startY + r * modSize,
          runLen * modSize,
          modSize
        );
        runLen = 0;
      }
    }
    if (runLen > 0) {
      doc.rect(
        startX + runStart * modSize,
        startY + r * modSize,
        runLen * modSize,
        modSize
      );
    }
  }
  doc.fill();
  doc.restore();
}

export class LabelPdfGenerator {
  private regularFontPath: string;
  private boldFontPath: string;
  private regularFontBuffer: Buffer | null = null;
  private boldFontBuffer: Buffer | null = null;

  constructor() {
    this.regularFontPath = '';
    this.boldFontPath = '';
    this.ensureFontsLoaded();
  }

  private loadFontBufferSafe(filePath: string): Buffer | null {
    if (!filePath || !fs.existsSync(filePath)) return null;

    // In Docker Linux environments, reading directly from a virtiofs/9p Windows mount
    // with fs.readFileSync can cause "ENOMEM: not enough memory, read".
    // Copying the font to /tmp/tanbox-fonts (local container tmpfs) avoids this completely.
    try {
      const isUnix = process.platform !== 'win32';
      const tmpDir = isUnix ? '/tmp/tanbox-fonts' : path.join(process.cwd(), '.fonts_cache');
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      const targetFile = path.join(tmpDir, path.basename(filePath));
      const srcStat = fs.statSync(filePath);
      if (!fs.existsSync(targetFile) || fs.statSync(targetFile).size !== srcStat.size) {
        fs.copyFileSync(filePath, targetFile);
      }
      const buf = fs.readFileSync(targetFile);
      if (buf && buf.length > 0) {
        return buf;
      }
    } catch (copyErr) {
      console.warn(`[LabelPdfGenerator] Safe font copy for ${filePath} failed:`, copyErr);
    }

    // Direct read fallback
    try {
      return fs.readFileSync(filePath);
    } catch (directErr) {
      console.warn(`[LabelPdfGenerator] Direct readFileSync for ${filePath} failed:`, directErr);
    }

    return null;
  }

  private ensureFontsLoaded(): void {
    if (this.regularFontBuffer && this.boldFontBuffer) return;

    const candidateDirs = [
      path.join(process.cwd(), 'assets/fonts'),
      path.join(process.cwd(), 'label-generator/assets/fonts'),
      '/app/assets/fonts',
      path.join(__dirname, '../../assets/fonts'),
      path.join(__dirname, '../assets/fonts'),
      path.join(__dirname, 'assets/fonts'),
      '/usr/share/fonts/truetype/dejavu',
      '/usr/share/fonts/TTF',
      'C:\\Windows\\Fonts',
    ];

    for (const dir of candidateDirs) {
      const reg = path.join(dir, 'Arial-Regular.ttf');
      const bld = path.join(dir, 'Arial-Bold.ttf');
      if (fs.existsSync(reg)) {
        this.regularFontPath = reg;
        this.boldFontPath = fs.existsSync(bld) ? bld : reg;
        break;
      }
      const winReg = path.join(dir, 'arial.ttf');
      const winBld = path.join(dir, 'arialbd.ttf');
      if (fs.existsSync(winReg)) {
        this.regularFontPath = winReg;
        this.boldFontPath = fs.existsSync(winBld) ? winBld : winReg;
        break;
      }
    }

    if (this.regularFontPath) {
      this.regularFontBuffer = this.loadFontBufferSafe(this.regularFontPath);
      this.boldFontBuffer = this.boldFontPath
        ? this.loadFontBufferSafe(this.boldFontPath)
        : this.regularFontBuffer;
      if (this.regularFontBuffer && !this.boldFontBuffer) {
        this.boldFontBuffer = this.regularFontBuffer;
      }
    }

    if (this.regularFontBuffer) {
      console.log(`[LabelPdfGenerator] Fonts loaded successfully: ${this.regularFontBuffer.length} bytes (Regular), ${this.boldFontBuffer?.length} bytes (Bold)`);
    } else {
      console.error('[LabelPdfGenerator] CRITICAL: Failed to load Unicode fonts! Cyrillic text will be garbled!');
    }
  }

  /**
   * Generates a multi-page roll PDF where 1 page = 1 label (Zebra, TSC, Xprinter ready)
   */
  public async generateRollPdf(
    template: LabelTemplate,
    rows: Record<string, string>[],
    outputStream: NodeJS.WritableStream,
    onProgress?: (current: number, total: number) => void
  ): Promise<void> {
    const widthPt = mmToPt(template.widthMm);
    const heightPt = mmToPt(template.heightMm);

    // Create PDF without margins
    const doc = new PDFDocument({
      size: [widthPt, heightPt],
      margin: 0,
      autoFirstPage: false,
    });

    // Register Cyrillic Unicode fonts using preloaded in-memory Buffers (prevents repeated fs.readFileSync ENOMEM)
    this.ensureFontsLoaded();
    const hasCustomFonts = Boolean(this.regularFontBuffer);
    if (this.regularFontBuffer && this.boldFontBuffer) {
      doc.registerFont('AppFont', this.regularFontBuffer);
      doc.registerFont('AppFontBold', this.boldFontBuffer);
    }

    doc.pipe(outputStream);

    // Guard against PDFKit auto-adding pages during text overflow
    let allowPageAddition = true;
    const originalAddPage = doc.addPage.bind(doc);
    (doc as any).addPage = (...args: any[]) => {
      if (!allowPageAddition) {
        return doc;
      }
      return originalAddPage(...args);
    };

    // If rows array is empty, render at least 1 sample page
    const dataList = rows.length > 0 ? rows : [{}];
    const totalCount = dataList.length;

    for (let i = 0; i < totalCount; i++) {
      if ((outputStream as any).destroyed || (outputStream as any).closed || (outputStream as any).writableEnded) {
        console.log('[LabelPdfGenerator] Client aborted connection, stopping roll PDF generation');
        allowPageAddition = true;
        try {
          doc.end();
        } catch {}
        return;
      }

      if (onProgress && (i % 100 === 0 || i === totalCount - 1)) {
        try {
          onProgress(i + 1, totalCount);
        } catch {}
      }

      const row = dataList[i];

      // Add a page for each label (thermal printer roll page)
      allowPageAddition = true;
      doc.addPage({
        size: [widthPt, heightPt],
        margin: 0,
      });
      allowPageAddition = false;

      await this.renderLabelElements(doc, template.elements, row, hasCustomFonts, heightPt, widthPt);
    }

    if (onProgress) {
      try {
        onProgress(totalCount, totalCount);
      } catch {}
    }

    allowPageAddition = true;
    doc.end();
  }

  private async renderLabelElements(
    doc: typeof PDFDocument,
    elements: LabelElement[],
    row: Record<string, string>,
    hasCustomFonts: boolean,
    pageHeightPt?: number,
    pageWidthPt?: number
  ): Promise<void> {
    // In LabelCanvas.tsx: baseScale = 7 px/mm, font size = el.fontSize * 1.33 px.
    // True physical 1 pt = (25.4 / 72) mm. On a 7 px/mm canvas, 1 pt is (25.4 / 72) * 7 = 2.4694 px.
    // Therefore, canvas font visual size corresponds to: el.fontSize * (1.33333333 / 2.46944444) ≈ el.fontSize * 0.54 pt.
    const CANVAS_FONT_SCALE = 1.333333333 / (7 * 25.4 / 72);

    for (const el of elements) {
      const xPt = mmToPt(el.x);
      const yPt = mmToPt(el.y);
      const rotation = el.rotation || 0;

      if (rotation !== 0) {
        doc.save();
        let wPt = 0;
        let hPt = 0;
        if (el.type === 'datamatrix' || el.type === 'symbol' || el.type === 'qrcode') {
          wPt = mmToPt(el.size);
          hPt = mmToPt(el.size);
        } else if (el.type === 'text') {
          wPt = mmToPt(el.width);
          hPt = mmToPt((el.fontSize || 7) * 1.5);
        } else if (el.type === 'barcode' || el.type === 'box') {
          wPt = mmToPt(el.width);
          hPt = mmToPt(el.height);
        } else if (el.type === 'divider') {
          wPt = el.orientation === 'horizontal' ? mmToPt(el.length) : 2;
          hPt = el.orientation === 'horizontal' ? 2 : mmToPt(el.length);
        }
        const originX = xPt + wPt / 2;
        const originY = yPt + hPt / 2;
        doc.rotate(rotation, { origin: [originX, originY] });
      }

      switch (el.type) {
        case 'datamatrix': {
          let rawCode = this.resolveVariable(el.columnName, row);
          if (!rawCode) {
            rawCode = row['code'] || row['marking_code'] || row['dm'] || '';
            if (!rawCode) {
              for (const val of Object.values(row)) {
                if (typeof val === 'string' && /^01\d{14}/.test(val.trim())) {
                  rawCode = val.trim();
                  break;
                }
              }
            }
          }
          if (!rawCode) {
            rawCode = '0104600439931256215ABC12391FFD092';
          }
          const sizePt = mmToPt(el.size);
          try {
            const rawMatrix = generateDataMatrixRaw(rawCode, el.matrixStructure || 'four_regions');
            drawMatrixVector(doc, rawMatrix, xPt, yPt, sizePt, 1);
          } catch (err) {
            try {
              const pngBuf = await generateDataMatrixBuffer(rawCode, el.matrixStructure || 'four_regions');
              doc.image(pngBuf, xPt, yPt, { width: sizePt, height: sizePt });
            } catch (bufErr) {
              console.error('Error generating DataMatrix for label:', bufErr);
              doc.rect(xPt, yPt, sizePt, sizePt).lineWidth(1).strokeColor('#ff0000').stroke();
            }
          }
          break;
        }

        case 'text': {
          const text = this.interpolateTemplate(el.content, row);
          const widthPt = mmToPt(el.width);
          const fontName = hasCustomFonts
            ? el.fontWeight === 'bold'
              ? 'AppFontBold'
              : 'AppFont'
            : el.fontWeight === 'bold'
            ? 'Helvetica-Bold'
            : 'Helvetica';

          const scaledFontSize = Math.max(2, (Number(el.fontSize) || 7) * CANVAS_FONT_SCALE);
          const maxHeightPt = pageHeightPt ? Math.max(5, pageHeightPt - yPt) : undefined;

          doc.font(fontName)
            .fontSize(scaledFontSize)
            .fillColor('#000000')
            .text(text, xPt, yPt, {
              width: widthPt,
              height: maxHeightPt,
              align: el.align || 'left',
              lineGap: 0,
              ellipsis: true,
            });
          break;
        }

        case 'symbol': {
          const sizePt = mmToPt(el.size);
          drawSymbol(doc, el.symbolType, xPt, yPt, sizePt, el.hasBorder, hasCustomFonts);
          break;
        }

        case 'barcode': {
          let val = this.resolveVariable(el.columnName, row) || el.columnName || '2000000001234';
          const dmMatch = String(val).match(/^01(\d{14})21/);
          if (dmMatch) {
            val = dmMatch[1].startsWith('0') ? dmMatch[1].slice(1) : dmMatch[1];
          }
          if (/[^\x20-\x7E]/.test(val) || val.length > 30) {
            const digits = val.replace(/\D/g, '');
            val = digits.length >= 8 ? digits.slice(0, 14) : '2000000001234';
          }
          try {
            const barcodePng = await generateCode128Buffer(val);
            const wPt = mmToPt(el.width);
            const hPt = mmToPt(el.height);
            doc.image(barcodePng, xPt, yPt, { width: wPt, height: hPt });
          } catch (err) {
            console.error('Error rendering linear barcode:', err);
          }
          break;
        }

        case 'qrcode': {
          const val = this.resolveVariable(el.columnName, row) || el.columnName || 'https://tanbox.kz';
          const sizePt = mmToPt(el.size);
          try {
            const rawMatrix = generateQRCodeRaw(val);
            drawMatrixVector(doc, rawMatrix, xPt, yPt, sizePt, 1);
          } catch (err) {
            try {
              const qrPng = await generateQRCodeBuffer(val);
              doc.image(qrPng, xPt, yPt, { width: sizePt, height: sizePt });
            } catch (qrErr) {
              console.error('Error rendering QR code:', qrErr);
            }
          }
          break;
        }

        case 'divider': {
          const lenPt = mmToPt(el.length);
          const thicknessPt = el.thickness ? mmToPt(el.thickness) : 0.75;
          doc.lineWidth(thicknessPt).strokeColor('#000000');
          if (el.orientation === 'vertical') {
            doc.moveTo(xPt, yPt).lineTo(xPt, yPt + lenPt).stroke();
          } else {
            doc.moveTo(xPt, yPt).lineTo(xPt + lenPt, yPt).stroke();
          }
          break;
        }

        case 'box': {
          const wPt = mmToPt(el.width);
          const hPt = mmToPt(el.height);
          const thicknessPt = el.thickness ? mmToPt(el.thickness) : 0.75;
          doc.lineWidth(thicknessPt).strokeColor('#000000').rect(xPt, yPt, wPt, hPt).stroke();
          break;
        }
      }

      if (rotation !== 0) {
        doc.restore();
      }
    }

    // Automatic neat label serial number in bottom right corner if not explicitly placed in template
    const hasCustomNumber = elements.some(
      (el) => el.type === 'text' && /\{(index|number|номер)\}/i.test(el.content || '')
    );
    const labelNum = row.index || row.number;
    if (!hasCustomNumber && labelNum && pageHeightPt && pageWidthPt) {
      const fontName = hasCustomFonts ? 'AppFont' : 'Helvetica';
      const labelText = `№ ${labelNum}`;
      doc.save();
      doc.font(fontName)
        .fontSize(5.5)
        .fillColor('#64748B')
        .text(labelText, pageWidthPt - mmToPt(16), pageHeightPt - mmToPt(3.5), {
          width: mmToPt(14),
          align: 'right',
          lineGap: 0,
        });
      doc.restore();
    }
  }

  private resolveVariable(name: string, row: Record<string, string>): string {
    if (!name) return '';
    const cleanKey = name.trim().toLowerCase();
    // Direct match or case-insensitive search
    for (const [k, v] of Object.entries(row)) {
      if (k.toLowerCase() === cleanKey) return String(v);
    }
    return '';
  }

  private interpolateTemplate(template: string, row: Record<string, string>): string {
    if (!template) return '';
    // Replace {variable_name} with value from row
    return template.replace(/\{([^{}]+)\}/g, (_, key) => {
      const val = this.resolveVariable(key, row);
      return val !== undefined && val !== null ? val : `{${key}}`;
    });
  }
}
