/**
 * Robust CSV / TXT Parser specifically designed for Marking Codes:
 * - TANBA (Таңба) / ИС МПТ (Казахстан)
 * - Честный ЗНАК / Asl Belgisi / GS1 DataMatrix
 *
 * Handles:
 * - Pure 1-column list of marking codes without header (e.g. standard TANBA export)
 * - Quotes inside serial numbers (e.g. 0105055107477083213<zIl"k)2)LkK...)
 * - Outer quotes wrapping lines ("0105055107477083213...")
 * - ASCII 29 / GS (\x1d) separators
 * - UTF-8 BOM (\uFEFF)
 * - Semicolons (;), commas (,), and tabs (\t)
 * - Auto-detecting whether row 1 is a header or already data
 */
export function parseFlexibleCsv(rawContent: string): Record<string, string>[] {
  const content = rawContent.replace(/^\uFEFF/, '').trim();
  if (!content) return [];

  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  const isMarkingCode = (str: string): boolean => {
    const clean = str.replace(/^["']|["']$/g, '').trim();
    return /^01\d{14}/.test(clean);
  };

  const stripOuterQuotes = (val: string): string => {
    let s = val.trim();
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      if (s.length >= 2) s = s.slice(1, -1);
    }
    return s.trim();
  };

  const parseCsvTokens = (line: string, delimiter: string): string[] => {
    const tokens: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delimiter && !inQuotes) {
        tokens.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    tokens.push(cur);
    return tokens.map((t) => stripOuterQuotes(t));
  };

  const firstLine = lines[0];
  const firstClean = stripOuterQuotes(firstLine);

  const isSingleHeader = /^(code|код|marking|маркировка|киз|км|datamatrix)$/i.test(firstClean);
  const sample = lines.slice(0, Math.min(lines.length, 25));
  const markingCount = sample.filter((l) => isMarkingCode(l)).length;
  const isPredominantlyMarking = markingCount >= Math.min(3, sample.length) || isMarkingCode(firstLine);

  const headerKeywords = /^(code|код|marking|маркировка|gtin|serial|sn|barcode|штрихкод|номенклатура|артикул|article|brand|бренд|наименование|название|цена|price|кол-во|количество)/i;

  let hasExplicitHeader = false;
  let testDelim: string | null = null;
  const semiCount0 = (firstLine.match(/;/g) || []).length;
  const tabCount0 = (firstLine.match(/\t/g) || []).length;
  const commaCount0 = (firstLine.match(/,/g) || []).length;

  if (semiCount0 > 0 && firstLine.split(';').some((c) => headerKeywords.test(stripOuterQuotes(c)))) {
    testDelim = ';';
    hasExplicitHeader = true;
  } else if (tabCount0 > 0 && firstLine.split('\t').some((c) => headerKeywords.test(stripOuterQuotes(c)))) {
    testDelim = '\t';
    hasExplicitHeader = true;
  } else if (commaCount0 > 0 && !isMarkingCode(firstLine) && firstLine.split(',').some((c) => headerKeywords.test(stripOuterQuotes(c)))) {
    testDelim = ',';
    hasExplicitHeader = true;
  }

  if (!hasExplicitHeader) {
    if (isSingleHeader || isPredominantlyMarking) {
      const startIndex = isSingleHeader ? 1 : 0;
      const rows: Record<string, string>[] = [];
      for (let i = startIndex; i < lines.length; i++) {
        const code = stripOuterQuotes(lines[i]);
        if (code) {
          rows.push({ code });
        }
      }
      return rows;
    }

    if (semiCount0 > 0) testDelim = ';';
    else if (tabCount0 > 0) testDelim = '\t';
    else if (commaCount0 > 0) testDelim = ',';
  }

  const delimiter = testDelim;
  if (!delimiter) {
    const startIndex = isSingleHeader ? 1 : 0;
    return lines.slice(startIndex).map((l) => ({ code: stripOuterQuotes(l) })).filter((r) => r.code);
  }

  // Multi-column CSV
  const firstCols = parseCsvTokens(firstLine, delimiter);
  const startIndex = hasExplicitHeader ? 1 : 0;
  const headers = hasExplicitHeader
    ? firstCols
    : firstCols.map((c, idx) => (idx === 0 || isMarkingCode(c) ? 'code' : `col_${idx + 1}`));

  const rows: Record<string, string>[] = [];
  for (let i = startIndex; i < lines.length; i++) {
    const cols = parseCsvTokens(lines[i], delimiter);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] !== undefined ? cols[idx] : '';
    });
    if (!row.code) {
      for (const v of Object.values(row)) {
        if (isMarkingCode(v)) {
          row.code = v;
          break;
        }
      }
      if (!row.code && cols.length > 0) {
        row.code = cols[0];
      }
    }
    rows.push(row);
  }

  return rows;
}
