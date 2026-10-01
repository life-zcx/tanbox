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
    case 'KZ_GOST':
      drawKZGost(doc, xPt, yPt, sizePt, hasCustomFonts);
      break;
    case 'CE':
      drawCE(doc, drawX, drawY, drawSize);
      break;
    case 'RECYCLE':
      drawRecycle(doc, drawX, drawY, drawSize, '21', 'PAP');
      break;
    case 'RECYCLE_LDPE':
      drawRecycle(doc, drawX, drawY, drawSize, '04', 'LDPE');
      break;
    case 'RECYCLE_PP':
      drawRecycle(doc, drawX, drawY, drawSize, '05', 'PP');
      break;
    case 'GLASS_FORK':
      drawGlassFork(doc, drawX, drawY, drawSize);
      break;
    case 'FRAGILE':
      drawFragile(doc, drawX, drawY, drawSize);
      break;
    case 'KEEP_DRY':
      drawUmbrella(doc, drawX, drawY, drawSize);
      break;
    case 'THIS_WAY_UP':
      drawThisWayUp(doc, drawX, drawY, drawSize);
      break;
    case 'TIDY_MAN':
      drawTidyMan(doc, drawX, drawY, drawSize);
      break;
    case 'KEEP_AWAY_SUN':
      drawKeepAwaySun(doc, drawX, drawY, drawSize);
      break;
    case 'TEMPERATURE_LIMIT':
      drawTemperatureLimit(doc, drawX, drawY, drawSize);
      break;
    case 'WASH_30':
      drawWash(doc, drawX, drawY, drawSize, '30°');
      break;
    case 'WASH_40':
      drawWash(doc, drawX, drawY, drawSize, '40°');
      break;
    case 'WASH_HAND':
      drawWashHand(doc, drawX, drawY, drawSize);
      break;
    case 'DO_NOT_WASH':
      drawDoNotWash(doc, drawX, drawY, drawSize);
      break;
    case 'NO_BLEACH':
      drawTriangleCross(doc, drawX, drawY, drawSize);
      break;
    case 'BLEACH_OK':
      drawTriangleBleach(doc, drawX, drawY, drawSize);
      break;
    case 'IRON_LOW':
      drawIron(doc, drawX, drawY, drawSize, 1);
      break;
    case 'IRON_MED':
      drawIron(doc, drawX, drawY, drawSize, 2);
      break;
    case 'DO_NOT_IRON':
      drawDoNotIron(doc, drawX, drawY, drawSize);
      break;
    case 'NO_TUMBLE_DRY':
      drawNoTumbleDry(doc, drawX, drawY, drawSize);
      break;
    case 'NO_DRY_CLEAN':
      drawNoDryClean(doc, drawX, drawY, drawSize);
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
/**
 * Recycling Mobius loop symbol with custom code/material (21 PAP, 04 LDPE, 05 PP)
 */
function drawRecycle(doc: typeof PDFDocument, x: number, y: number, size: number, code = '21', name = 'PAP') {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size * 0.42;

  doc.lineWidth(Math.max(0.6, size * 0.07)).strokeColor('#000000');

  // Triangle path
  const p1 = { x: cx, y: cy - r };
  const p2 = { x: cx + r * 0.866, y: cy + r * 0.5 };
  const p3 = { x: cx - r * 0.866, y: cy + r * 0.5 };

  doc.polygon([p1.x, p1.y], [p2.x, p2.y], [p3.x, p3.y]).stroke();

  // Code & Name
  doc.font('Helvetica-Bold')
    .fontSize(size * 0.22)
    .fillColor('#000000')
    .text(code, x, cy - size * 0.16, {
      width: size,
      align: 'center',
    });

  doc.font('Helvetica-Bold')
    .fontSize(size * 0.13)
    .fillColor('#000000')
    .text(name, x, cy + size * 0.05, {
      width: size,
      align: 'center',
    });
}

/**
 * State standard of Kazakhstan (СТ РК / ҚР СТ)
 */
function drawKZGost(doc: typeof PDFDocument, x: number, y: number, size: number, hasCustomFonts?: boolean) {
  doc.rect(x, y, size, size).lineWidth(Math.max(0.6, size * 0.04)).strokeColor('#000000').stroke();
  const fontName = hasCustomFonts ? 'AppFontBold' : 'Helvetica-Bold';
  doc.font(fontName)
    .fontSize(size * 0.28)
    .fillColor('#000000')
    .text('СТ РК', x, y + size * 0.32, {
      width: size,
      align: 'center',
    });
}

/**
 * Conformité Européenne (CE)
 */
function drawCE(doc: typeof PDFDocument, x: number, y: number, size: number) {
  doc.font('Helvetica-Bold')
    .fontSize(size * 0.55)
    .fillColor('#000000')
    .text('CE', x, y + size * 0.2, {
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
 * Fragile (wine glass with crack)
 */
function drawFragile(doc: typeof PDFDocument, x: number, y: number, size: number) {
  doc.lineWidth(Math.max(0.6, size * 0.06)).strokeColor('#000000');
  const cx = x + size / 2;
  // Glass bowl
  doc.moveTo(cx - size * 0.22, y + size * 0.15)
    .lineTo(cx + size * 0.22, y + size * 0.15)
    .lineTo(cx + size * 0.18, y + size * 0.5)
    .quadraticCurveTo(cx, y + size * 0.65, cx - size * 0.18, y + size * 0.5)
    .closePath()
    .stroke();
  // Crack line
  doc.moveTo(cx + size * 0.05, y + size * 0.15)
    .lineTo(cx - size * 0.03, y + size * 0.3)
    .lineTo(cx + size * 0.04, y + size * 0.42)
    .stroke();
  // Stem & Base
  doc.moveTo(cx, y + size * 0.65).lineTo(cx, y + size * 0.85).stroke();
  doc.moveTo(cx - size * 0.2, y + size * 0.85).lineTo(cx + size * 0.2, y + size * 0.85).stroke();
}

/**
 * This way up (two arrows pointing up with base)
 */
function drawThisWayUp(doc: typeof PDFDocument, x: number, y: number, size: number) {
  doc.lineWidth(Math.max(0.6, size * 0.06)).strokeColor('#000000');
  // Base line
  doc.moveTo(x + size * 0.1, y + size * 0.85).lineTo(x + size * 0.9, y + size * 0.85).stroke();

  // Left arrow
  const lX = x + size * 0.32;
  doc.moveTo(lX, y + size * 0.78).lineTo(lX, y + size * 0.2).stroke();
  doc.moveTo(lX - size * 0.14, y + size * 0.38).lineTo(lX, y + size * 0.18).lineTo(lX + size * 0.14, y + size * 0.38).stroke();

  // Right arrow
  const rX = x + size * 0.68;
  doc.moveTo(rX, y + size * 0.78).lineTo(rX, y + size * 0.2).stroke();
  doc.moveTo(rX - size * 0.14, y + size * 0.38).lineTo(rX, y + size * 0.18).lineTo(rX + size * 0.14, y + size * 0.38).stroke();
}

/**
 * Tidy man / Don't litter
 */
function drawTidyMan(doc: typeof PDFDocument, x: number, y: number, size: number) {
  doc.lineWidth(Math.max(0.6, size * 0.05)).strokeColor('#000000');
  // Head
  doc.circle(x + size * 0.4, y + size * 0.22, size * 0.08).fillColor('#000000').fill();
  // Body & Legs
  doc.moveTo(x + size * 0.4, y + size * 0.3).lineTo(x + size * 0.38, y + size * 0.58).stroke();
  doc.moveTo(x + size * 0.38, y + size * 0.58).lineTo(x + size * 0.3, y + size * 0.85).stroke();
  doc.moveTo(x + size * 0.38, y + size * 0.58).lineTo(x + size * 0.46, y + size * 0.85).stroke();
  // Arm dropping waste
  doc.moveTo(x + size * 0.4, y + size * 0.35).lineTo(x + size * 0.6, y + size * 0.42).stroke();
  doc.circle(x + size * 0.63, y + size * 0.49, size * 0.03).fillColor('#000000').fill();
  // Waste bin
  doc.moveTo(x + size * 0.6, y + size * 0.55).lineTo(x + size * 0.63, y + size * 0.85).lineTo(x + size * 0.8, y + size * 0.85).lineTo(x + size * 0.83, y + size * 0.55).stroke();
}

/**
 * Keep away from sunlight
 */
function drawKeepAwaySun(doc: typeof PDFDocument, x: number, y: number, size: number) {
  doc.lineWidth(Math.max(0.6, size * 0.06)).strokeColor('#000000');
  const cx = x + size / 2;
  const cy = y + size * 0.6;
  // Sun circle
  doc.circle(cx, cy, size * 0.16).stroke();
  // Rays
  for (let a = 0; a < 8; a++) {
    const angle = (a * Math.PI) / 4;
    const x1 = cx + Math.cos(angle) * size * 0.2;
    const y1 = cy + Math.sin(angle) * size * 0.2;
    const x2 = cx + Math.cos(angle) * size * 0.3;
    const y2 = cy + Math.sin(angle) * size * 0.3;
    doc.moveTo(x1, y1).lineTo(x2, y2).stroke();
  }
  // Roof / shield above
  doc.moveTo(x + size * 0.15, y + size * 0.25)
    .lineTo(cx, y + size * 0.15)
    .lineTo(x + size * 0.85, y + size * 0.25)
    .stroke();
}

/**
 * Temperature limits (Thermometer)
 */
function drawTemperatureLimit(doc: typeof PDFDocument, x: number, y: number, size: number) {
  doc.lineWidth(Math.max(0.6, size * 0.06)).strokeColor('#000000');
  const cx = x + size / 2;
  // Stem
  doc.rect(cx - size * 0.07, y + size * 0.15, size * 0.14, size * 0.5).stroke();
  // Bottom bulb
  doc.circle(cx, y + size * 0.75, size * 0.14).fillColor('#000000').fill();
  // Ticks
  doc.moveTo(cx + size * 0.08, y + size * 0.25).lineTo(cx + size * 0.2, y + size * 0.25).stroke();
  doc.moveTo(cx + size * 0.08, y + size * 0.4).lineTo(cx + size * 0.2, y + size * 0.4).stroke();
  doc.moveTo(cx + size * 0.08, y + size * 0.55).lineTo(cx + size * 0.2, y + size * 0.55).stroke();
}

/**
 * Washing symbol (Washtub with temperature)
 */
function drawWash(doc: typeof PDFDocument, x: number, y: number, size: number, temp = '30°') {
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

  // Text
  const fontSize = size * 0.24;
  doc.font('Helvetica-Bold')
    .fontSize(fontSize)
    .fillColor('#000000')
    .text(temp, x, y + size * 0.53, {
      width: size,
      align: 'center',
    });
}

function drawWashHand(doc: typeof PDFDocument, x: number, y: number, size: number) {
  drawWash(doc, x, y, size, '');
  // Hand dipping into water
  doc.lineWidth(Math.max(0.6, size * 0.06)).strokeColor('#000000');
  doc.moveTo(x + size * 0.35, y + size * 0.15)
    .lineTo(x + size * 0.5, y + size * 0.5)
    .lineTo(x + size * 0.65, y + size * 0.35)
    .stroke();
}

function drawDoNotWash(doc: typeof PDFDocument, x: number, y: number, size: number) {
  drawWash(doc, x, y, size, '');
  doc.lineWidth(Math.max(0.6, size * 0.07)).strokeColor('#000000');
  doc.moveTo(x + size * 0.15, y + size * 0.85).lineTo(x + size * 0.85, y + size * 0.25).stroke();
  doc.moveTo(x + size * 0.15, y + size * 0.25).lineTo(x + size * 0.85, y + size * 0.85).stroke();
}

function drawTriangleCross(doc: typeof PDFDocument, x: number, y: number, size: number) {
  doc.lineWidth(Math.max(0.6, size * 0.07)).strokeColor('#000000');
  const cx = x + size / 2;
  doc.polygon([cx, y + size * 0.15], [x + size * 0.85, y + size * 0.85], [x + size * 0.15, y + size * 0.85]).stroke();
  // Diagonal cross
  doc.moveTo(x + size * 0.2, y + size * 0.8).lineTo(x + size * 0.8, y + size * 0.2).stroke();
  doc.moveTo(x + size * 0.2, y + size * 0.2).lineTo(x + size * 0.8, y + size * 0.8).stroke();
}

function drawTriangleBleach(doc: typeof PDFDocument, x: number, y: number, size: number) {
  doc.lineWidth(Math.max(0.6, size * 0.07)).strokeColor('#000000');
  const cx = x + size / 2;
  doc.polygon([cx, y + size * 0.15], [x + size * 0.85, y + size * 0.85], [x + size * 0.15, y + size * 0.85]).stroke();
}

function drawIron(doc: typeof PDFDocument, x: number, y: number, size: number, dots = 1) {
  doc.lineWidth(Math.max(0.6, size * 0.07)).strokeColor('#000000');
  // Iron shape
  doc.moveTo(x + size * 0.15, y + size * 0.75)
    .lineTo(x + size * 0.75, y + size * 0.75)
    .quadraticCurveTo(x + size * 0.9, y + size * 0.5, x + size * 0.6, y + size * 0.35)
    .lineTo(x + size * 0.15, y + size * 0.35)
    .closePath()
    .stroke();

  // Dots inside
  doc.fillColor('#000000');
  if (dots === 1) {
    doc.circle(x + size * 0.45, y + size * 0.55, size * 0.06).fill();
  } else if (dots === 2) {
    doc.circle(x + size * 0.38, y + size * 0.55, size * 0.05).fill();
    doc.circle(x + size * 0.52, y + size * 0.55, size * 0.05).fill();
  }
}

function drawDoNotIron(doc: typeof PDFDocument, x: number, y: number, size: number) {
  drawIron(doc, x, y, size, 0);
  doc.lineWidth(Math.max(0.6, size * 0.07)).strokeColor('#000000');
  doc.moveTo(x + size * 0.15, y + size * 0.8).lineTo(x + size * 0.85, y + size * 0.3).stroke();
  doc.moveTo(x + size * 0.15, y + size * 0.3).lineTo(x + size * 0.85, y + size * 0.8).stroke();
}

function drawNoTumbleDry(doc: typeof PDFDocument, x: number, y: number, size: number) {
  doc.lineWidth(Math.max(0.6, size * 0.06)).strokeColor('#000000');
  // Square
  doc.rect(x + size * 0.15, y + size * 0.15, size * 0.7, size * 0.7).stroke();
  // Circle inside
  doc.circle(x + size / 2, y + size / 2, size * 0.28).stroke();
  // Diagonal cross
  doc.moveTo(x + size * 0.15, y + size * 0.85).lineTo(x + size * 0.85, y + size * 0.15).stroke();
  doc.moveTo(x + size * 0.15, y + size * 0.15).lineTo(x + size * 0.85, y + size * 0.85).stroke();
}

function drawNoDryClean(doc: typeof PDFDocument, x: number, y: number, size: number) {
  doc.lineWidth(Math.max(0.6, size * 0.07)).strokeColor('#000000');
  // Circle
  doc.circle(x + size / 2, y + size / 2, size * 0.38).stroke();
  // Cross
  doc.moveTo(x + size * 0.15, y + size * 0.85).lineTo(x + size * 0.85, y + size * 0.15).stroke();
  doc.moveTo(x + size * 0.15, y + size * 0.15).lineTo(x + size * 0.85, y + size * 0.85).stroke();
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

