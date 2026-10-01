import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { LabelTemplate, LabelElement } from '../types.js';
import { generateDataMatrixBuffer, generateCode128Buffer, generateQRCodeBuffer } from './barcodeService.js';
import { drawSymbol } from './symbolsService.js';

// Conversion constant: 1 mm ≈ 2.83464567 points
export const MM_TO_PT = 2.83464567;

export function mmToPt(mm: number): number {
  return mm * MM_TO_PT;
}

export class LabelPdfGenerator {
  private regularFontPath: string;
  private boldFontPath: string;

  constructor() {
    const candidateDirs = [
      path.join(process.cwd(), 'assets/fonts'),
      path.join(process.cwd(), 'label-generator/assets/fonts'),
      '/app/assets/fonts',
      path.join(__dirname, '../../assets/fonts'),
      path.join(__dirname, '../assets/fonts'),
      path.join(__dirname, 'assets/fonts'),
      'C:\\Windows\\Fonts',
    ];

    this.regularFontPath = '';
    this.boldFontPath = '';

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
  }

  /**
   * Generates a multi-page roll PDF where 1 page = 1 label (Zebra, TSC, Xprinter ready)
   */
  public async generateRollPdf(
    template: LabelTemplate,
    rows: Record<string, string>[],
    outputStream: NodeJS.WritableStream
  ): Promise<void> {
    const widthPt = mmToPt(template.widthMm);
    const heightPt = mmToPt(template.heightMm);

    // Create PDF without margins
    const doc = new PDFDocument({
      size: [widthPt, heightPt],
      margin: 0,
      autoFirstPage: false,
    });

    // Register Cyrillic Unicode fonts
    const hasCustomFonts = fs.existsSync(this.regularFontPath);
    if (hasCustomFonts) {
      doc.registerFont('AppFont', this.regularFontPath);
      doc.registerFont('AppFontBold', this.boldFontPath);
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

    for (let i = 0; i < dataList.length; i++) {
      const row = dataList[i];

      // Add a page for each label (thermal printer roll page)
      allowPageAddition = true;
      doc.addPage({
        size: [widthPt, heightPt],
        margin: 0,
      });
      allowPageAddition = false;

      await this.renderLabelElements(doc, template.elements, row, hasCustomFonts, heightPt);
    }

    allowPageAddition = true;
    doc.end();
  }

  private async renderLabelElements(
    doc: typeof PDFDocument,
    elements: LabelElement[],
    row: Record<string, string>,
    hasCustomFonts: boolean,
    pageHeightPt?: number
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
          try {
            const pngBuf = await generateDataMatrixBuffer(rawCode, el.matrixStructure || 'four_regions');
            const sizePt = mmToPt(el.size);
            doc.image(pngBuf, xPt, yPt, { width: sizePt, height: sizePt });
          } catch (err) {
            console.error('Error generating DataMatrix for label:', err);
            // Draw placeholder rect on error
            const sizePt = mmToPt(el.size);
            doc.rect(xPt, yPt, sizePt, sizePt).lineWidth(1).strokeColor('#ff0000').stroke();
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
          // Sanitize: Code-128 requires ASCII printable characters
          if (/[^\x20-\x7E]/.test(val)) {
            const digits = val.replace(/\D/g, '');
            val = digits.length >= 8 ? digits : '2000000001234';
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
          try {
            const qrPng = await generateQRCodeBuffer(val);
            const sizePt = mmToPt(el.size);
            doc.image(qrPng, xPt, yPt, { width: sizePt, height: sizePt });
          } catch (err) {
            console.error('Error rendering QR code:', err);
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
