import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { LabelTemplate, LabelElement } from '../types.js';
import { generateDataMatrixBuffer, generateCode128Buffer } from './barcodeService.js';
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
    const assetsDir = path.join(__dirname, '../../assets/fonts');
    this.regularFontPath = path.join(assetsDir, 'Arial-Regular.ttf');
    this.boldFontPath = path.join(assetsDir, 'Arial-Bold.ttf');

    // Fallback if bundled fonts are not found
    if (!fs.existsSync(this.regularFontPath)) {
      if (fs.existsSync('C:\\Windows\\Fonts\\arial.ttf')) {
        this.regularFontPath = 'C:\\Windows\\Fonts\\arial.ttf';
        this.boldFontPath = 'C:\\Windows\\Fonts\\arialbd.ttf';
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

    // If rows array is empty, render at least 1 sample page
    const dataList = rows.length > 0 ? rows : [{}];

    for (let i = 0; i < dataList.length; i++) {
      const row = dataList[i];

      // Add a page for each label (thermal printer roll page)
      doc.addPage({
        size: [widthPt, heightPt],
        margin: 0,
      });

      await this.renderLabelElements(doc, template.elements, row, hasCustomFonts);
    }

    doc.end();
  }

  private async renderLabelElements(
    doc: typeof PDFDocument,
    elements: LabelElement[],
    row: Record<string, string>,
    hasCustomFonts: boolean
  ): Promise<void> {
    for (const el of elements) {
      const xPt = mmToPt(el.x);
      const yPt = mmToPt(el.y);
      const rotation = el.rotation || 0;

      if (rotation !== 0) {
        doc.save();
        let wPt = 0;
        let hPt = 0;
        if (el.type === 'datamatrix' || el.type === 'symbol') {
          wPt = mmToPt(el.size);
          hPt = mmToPt(el.size);
        } else if (el.type === 'text') {
          wPt = mmToPt(el.width);
          hPt = mmToPt((el.fontSize || 7) * 1.5);
        } else if (el.type === 'barcode') {
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

          doc.font(fontName)
            .fontSize(el.fontSize || 7)
            .fillColor('#000000')
            .text(text, xPt, yPt, {
              width: widthPt,
              align: el.align || 'left',
              lineGap: 1,
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
          const val = this.resolveVariable(el.columnName, row) || '2000000001234';
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
