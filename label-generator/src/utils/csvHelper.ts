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
  let content = rawContent.replace(/^\uFEFF/, '').trim();
  if (!content) return [];

  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  // Helper: check if a field contains a marking code (starts with AI 01 + 14 digits)
  const isMarkingCode = (str: string): boolean => {
    const clean = str.replace(/^["']|["']$/g, '').trim();
    return /^01\d{14}/.test(clean);
  };

  const firstLine = lines[0];

  // Auto-detect delimiter
  let delimiter: string | null = null;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;

  if (semiCount > 0) {
    delimiter = ';';
  } else if (tabCount > 0) {
    delimiter = '\t';
  } else if (commaCount > 0 && !isMarkingCode(firstLine)) {
    delimiter = ',';
  }

  // Case A: 1-column list of codes (pure TANBA export, each line is 1 code)
  if (!delimiter) {
    const isHeader = !isMarkingCode(firstLine) && lines.length > 1;
    const startIdx = isHeader ? 1 : 0;
    const rows: Record<string, string>[] = [];

    for (let i = startIdx; i < lines.length; i++) {
      let codeVal = lines[i].trim();
      // Remove outer enclosing quotes if present, but preserve all inner quotes
      if (codeVal.startsWith('"') && codeVal.endsWith('"') && codeVal.length >= 2) {
        codeVal = codeVal.slice(1, -1);
      } else if (codeVal.startsWith("'") && codeVal.endsWith("'") && codeVal.length >= 2) {
        codeVal = codeVal.slice(1, -1);
      }
      if (codeVal) {
        rows.push({ code: codeVal });
      }
    }
    return rows;
  }

  // Case B: Delimited CSV (multiple columns)
  const firstField = firstLine.split(delimiter)[0];
  const isHeader = !isMarkingCode(firstField);
  let headers: string[] = [];
  let startIdx = 0;

  if (isHeader) {
    headers = firstLine
      .split(delimiter)
      .map((h, i) => h.trim().replace(/^["']|["']$/g, '') || `col_${i + 1}`);
    startIdx = 1;
  } else {
    const colCount = firstLine.split(delimiter).length;
    headers = ['code', ...Array.from({ length: colCount - 1 }, (_, i) => `col_${i + 2}`)];
  }

  const rows: Record<string, string>[] = [];
  for (let i = startIdx; i < lines.length; i++) {
    const parts = lines[i].split(delimiter);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      let val = (parts[idx] || '').trim();
      if (val.startsWith('"') && val.endsWith('"') && val.length >= 2) {
        val = val.slice(1, -1);
      }
      row[h] = val;
    });

    // Ensure 'code' key exists if any field in the row has the marking code
    if (!row.code) {
      for (const v of Object.values(row)) {
        if (isMarkingCode(v)) {
          row.code = v;
          break;
        }
      }
    }

    rows.push(row);
  }

  return rows;
}
