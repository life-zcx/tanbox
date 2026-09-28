import PDFDocument from 'pdfkit';
import { SymbolType } from '../types.js';

export function drawSymbol(
  doc: typeof PDFDocument,
  type: SymbolType,
  xPt: number,
  yPt: number,
  sizePt: number,
  hasBorder?: boolean,
  hasCustomFonts?: boolean
) {
  doc.save();

  let drawX = xPt;
  let drawY = yPt;
  let drawSize = sizePt;

  // Draw optional outer square frame if requested
  if (hasBorder) {
    const borderWidth = Math.max(0.6, sizePt * 0.04);
    doc.lineWidth(borderWidth).strokeColor('#000000');
    doc.rect(xPt, yPt, sizePt, sizePt).stroke();

    const pad = sizePt * 0.08;
    drawX += pad;
    drawY += pad;
    drawSize -= 2 * pad;
  }

  switch (type) {
    case 'EAC':
      drawEAC(doc, drawX, drawY, drawSize);
      break;
    case 'EAC_BOX':
      drawEACBox(doc, xPt, yPt, sizePt, hasCustomFonts);
      break;
    case 'RECYCLE':
      drawRecycle(doc, drawX, drawY, drawSize);
      break;
    case 'GLASS_FORK':
      drawGlassFork(doc, drawX, drawY, drawSize);
      break;
    case 'WASH_30':
      drawWash(doc, drawX, drawY, drawSize);
      break;
    case 'NO_BLEACH':
      drawTriangleCross(doc, drawX, drawY, drawSize);
      break;
    case 'IRON_LOW':
      drawIron(doc, drawX, drawY, drawSize);
      break;
    case 'KEEP_DRY':
      drawUmbrella(doc, drawX, drawY, drawSize);
      break;
    default:
      drawEAC(doc, drawX, drawY, drawSize);
      break;
  }

  doc.restore();
}

/**
 * Official Eurasian Conformity mark (EAC)
 * Precise geometry according to TR CU regulations:
 * 1:1 square composed of stylized letters E, A, C with clean gaps.
 */
function drawEAC(doc: typeof PDFDocument, x: number, y: number, size: number) {
  doc.fillColor('#000000');
  const u = size / 100;

  // Letter E (width 28, x from 0 to 28)
  const ex = x;
  doc.rect(ex, y, 14 * u, size).fill(); // Vertical stem
  doc.rect(ex + 14 * u, y, 14 * u, 14 * u).fill(); // Top bar
  doc.rect(ex + 14 * u, y + 43 * u, 11 * u, 14 * u).fill(); // Middle bar
  doc.rect(ex + 14 * u, y + 86 * u, 14 * u, 14 * u).fill(); // Bottom bar

  // Letter A (width 28, x from 36 to 64, gap 8 from E)
  const ax = x + 36 * u;
  doc.rect(ax, y, 10 * u, size).fill(); // Left leg
  doc.rect(ax + 18 * u, y, 10 * u, size).fill(); // Right leg
  doc.rect(ax + 10 * u, y, 8 * u, 14 * u).fill(); // Top bridge
  doc.rect(ax + 10 * u, y + 43 * u, 8 * u, 14 * u).fill(); // Crossbar

  // Letter C (width 28, x from 72 to 100, gap 8 from A)
  const cx = x + 72 * u;
  doc.rect(cx, y, 14 * u, size).fill(); // Vertical stem
  doc.rect(cx + 14 * u, y, 14 * u, 14 * u).fill(); // Top bar
  doc.rect(cx + 14 * u, y + 86 * u, 14 * u, 14 * u).fill(); // Bottom bar
}

/**
 * Classic bordered EAC stamp
 */
function drawEACBox(doc: typeof PDFDocument, x: number, y: number, size: number, hasCustomFonts?: boolean) {
  doc.rect(x, y, size, size).lineWidth(Math.max(0.75, size * 0.05)).strokeColor('#000000').stroke();
  const fontSize = size * 0.38;
  const fontName = hasCustomFonts ? 'AppFontBold' : 'Helvetica-Bold';
  doc.font(fontName)
    .fontSize(fontSize)
    .fillColor('#000000')
    .text('EAC', x, y + (size - fontSize) / 2 - fontSize * 0.08, {
      width: size,
      align: 'center',
    });
}

/**
 * Recycling Mobius loop symbol
 */
function drawRecycle(doc: typeof PDFDocument, x: number, y: number, size: number) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size * 0.42;

  doc.lineWidth(Math.max(0.6, size * 0.07)).strokeColor('#000000');

  // Triangle path
  const p1 = { x: cx, y: cy - r };
  const p2 = { x: cx + r * 0.866, y: cy + r * 0.5 };
  const p3 = { x: cx - r * 0.866, y: cy + r * 0.5 };

  doc.polygon([p1.x, p1.y], [p2.x, p2.y], [p3.x, p3.y]).stroke();

  // Small inner code '21' and 'PAP'
  doc.font('Helvetica-Bold')
    .fontSize(size * 0.22)
    .fillColor('#000000')
    .text('21', x, cy - size * 0.16, {
      width: size,
      align: 'center',
    });

  doc.font('Helvetica-Bold')
    .fontSize(size * 0.14)
    .fillColor('#000000')
    .text('PAP', x, cy + size * 0.05, {
      width: size,
      align: 'center',
    });
}

/**
 * Food contact safe (Glass and Fork) symbol
 */
function drawGlassFork(doc: typeof PDFDocument, x: number, y: number, size: number) {
  doc.lineWidth(Math.max(0.6, size * 0.06)).strokeColor('#000000');
  
  // Wine glass
  const gx = x + size * 0.28;
  doc.moveTo(gx - size * 0.15, y + size * 0.2)
    .lineTo(gx + size * 0.15, y + size * 0.2)
    .lineTo(gx + size * 0.1, y + size * 0.55)
    .quadraticCurveTo(gx, y + size * 0.65, gx - size * 0.1, y + size * 0.55)
    .closePath()
    .stroke();
  doc.moveTo(gx, y + size * 0.65).lineTo(gx, y + size * 0.85).stroke();
  doc.moveTo(gx - size * 0.12, y + size * 0.85).lineTo(gx + size * 0.12, y + size * 0.85).stroke();

  // Fork
  const fx = x + size * 0.72;
  doc.moveTo(fx, y + size * 0.45).lineTo(fx, y + size * 0.85).stroke();
  doc.moveTo(fx - size * 0.1, y + size * 0.2).lineTo(fx - size * 0.1, y + size * 0.45).stroke();
  doc.moveTo(fx, y + size * 0.2).lineTo(fx, y + size * 0.45).stroke();
  doc.moveTo(fx + size * 0.1, y + size * 0.2).lineTo(fx + size * 0.1, y + size * 0.45).stroke();
  doc.moveTo(fx - size * 0.1, y + size * 0.45).lineTo(fx + size * 0.1, y + size * 0.45).stroke();
}

/**
 * Washing symbol (Washtub with temperature)
 */
function drawWash(doc: typeof PDFDocument, x: number, y: number, size: number) {
  doc.lineWidth(Math.max(0.6, size * 0.07)).strokeColor('#000000');
  
  // Basin
  doc.moveTo(x + size * 0.1, y + size * 0.3)
    .lineTo(x + size * 0.2, y + size * 0.8)
    .lineTo(x + size * 0.8, y + size * 0.8)
    .lineTo(x + size * 0.9, y + size * 0.3)
    .stroke();

  // Water wave
  doc.moveTo(x + size * 0.1, y + size * 0.45)
    .quadraticCurveTo(x + size * 0.3, y + size * 0.35, x + size * 0.5, y + size * 0.45)
    .quadraticCurveTo(x + size * 0.7, y + size * 0.55, x + size * 0.9, y + size * 0.45)
    .stroke();

  // 30 text
  const fontSize = size * 0.25;
  doc.font('Helvetica-Bold')
    .fontSize(fontSize)
    .fillColor('#000000')
    .text('30°', x, y + size * 0.53, {
      width: size,
      align: 'center',
    });
}

function drawTriangleCross(doc: typeof PDFDocument, x: number, y: number, size: number) {
  doc.lineWidth(Math.max(0.6, size * 0.07)).strokeColor('#000000');
  const cx = x + size / 2;
  doc.polygon([cx, y + size * 0.15], [x + size * 0.85, y + size * 0.85], [x + size * 0.15, y + size * 0.85]).stroke();
  // Diagonal cross
  doc.moveTo(x + size * 0.2, y + size * 0.8).lineTo(x + size * 0.8, y + size * 0.2).stroke();
  doc.moveTo(x + size * 0.2, y + size * 0.2).lineTo(x + size * 0.8, y + size * 0.8).stroke();
}

function drawIron(doc: typeof PDFDocument, x: number, y: number, size: number) {
  doc.lineWidth(Math.max(0.6, size * 0.07)).strokeColor('#000000');
  // Iron shape
  doc.moveTo(x + size * 0.15, y + size * 0.75)
    .lineTo(x + size * 0.75, y + size * 0.75)
    .quadraticCurveTo(x + size * 0.9, y + size * 0.5, x + size * 0.6, y + size * 0.35)
    .lineTo(x + size * 0.15, y + size * 0.35)
    .closePath()
    .stroke();
  // Dot inside
  doc.circle(x + size * 0.45, y + size * 0.55, size * 0.06).fillColor('#000000').fill();
}

function drawUmbrella(doc: typeof PDFDocument, x: number, y: number, size: number) {
  doc.lineWidth(Math.max(0.6, size * 0.07)).strokeColor('#000000');
  // Dome
  doc.moveTo(x + size * 0.15, y + size * 0.5)
    .quadraticCurveTo(x + size * 0.5, y + size * 0.15, x + size * 0.85, y + size * 0.5)
    .closePath()
    .stroke();
  doc.moveTo(x + size * 0.15, y + size * 0.5).lineTo(x + size * 0.85, y + size * 0.5).stroke();
  // Handle
  doc.moveTo(x + size / 2, y + size * 0.5)
    .lineTo(x + size / 2, y + size * 0.8)
    .quadraticCurveTo(x + size / 2, y + size * 0.9, x + size * 0.4, y + size * 0.9)
    .stroke();
}
