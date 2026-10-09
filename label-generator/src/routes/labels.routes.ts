import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parseFlexibleCsv } from '../utils/csvHelper.js';
import { LabelTemplate } from '../types.js';
import { LabelPdfGenerator } from '../services/pdfGenerator.js';

const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB CSV support for 100k+ codes
});

const router = Router();
const pdfGen = new LabelPdfGenerator();

/**
 * 1. Parse CSV and return detected headers + preview rows
 */
router.post('/parse-csv', upload.single('file'), (req: Request, res: Response) => {
  try {
    let csvContent = '';

    if (req.file) {
      csvContent = req.file.buffer.toString('utf-8');
    } else if (req.body.csvText) {
      csvContent = String(req.body.csvText);
    } else {
      return res.status(400).json({ message: 'CSV файл или текст не передан' });
    }

    const records = parseFlexibleCsv(csvContent);

    if (records.length === 0) {
      return res.status(400).json({ message: 'CSV файл пуст или не содержит распознаваемых строк' });
    }

    const headers = Object.keys(records[0]);
    const previewRows = records.slice(0, 10);

    return res.json({
      totalRows: records.length,
      headers,
      previewRows,
    });
  } catch (err: any) {
    console.error('CSV Parse Error:', err);
    return res.status(500).json({ message: 'Ошибка при обработке и чтении CSV файла' });
  }
});

interface JobProgress {
  current: number;
  total: number;
  percent: number;
  updatedAt: number;
}
const progressMap = new Map<string, JobProgress>();

// Periodically clean stale track IDs (older than 30 minutes)
setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [key, val] of progressMap.entries()) {
    if (val.updatedAt < cutoff) progressMap.delete(key);
  }
}, 60000);

/**
 * Check generation progress for a tracked task
 */
router.get('/progress/:trackId', (req: Request, res: Response) => {
  const trackId = String(req.params.trackId || '');
  const p = progressMap.get(trackId);
  if (!p) {
    return res.json({ found: false, current: 0, total: 0, percent: 0 });
  }
  return res.json({ found: true, ...p });
});

/**
 * 2. Generate Roll PDF (multi-page, 1 label per page, thermal printer ready)
 */
router.post('/generate-pdf', upload.single('file'), async (req: Request, res: Response) => {
  const trackId = (req.query.trackId || req.body.trackId) ? String(req.query.trackId || req.body.trackId) : undefined;
  try {
    let template: LabelTemplate;
    let rows: Record<string, string>[] = [];

    // Parse template
    if (typeof req.body.template === 'string') {
      template = JSON.parse(req.body.template);
    } else {
      template = req.body.template;
    }

    if (!template || !template.widthMm || !template.heightMm) {
      return res.status(400).json({ message: 'Некорректный шаблон этикетки (widthMm, heightMm обязательны)' });
    }

    // Parse rows from uploaded file or JSON
    if (req.file) {
      const csvContent = req.file.buffer.toString('utf-8');
      rows = parseFlexibleCsv(csvContent);
    } else if (Array.isArray(req.body.csvData)) {
      rows = req.body.csvData;
    } else if (req.body.csvText) {
      const csvContent = String(req.body.csvText);
      rows = parseFlexibleCsv(csvContent);
    }

    // Optional limit
    if (req.query.limit) {
      const lim = parseInt(String(req.query.limit), 10);
      if (!isNaN(lim) && lim > 0) {
        rows = rows.slice(0, lim);
      }
    }

    if (trackId) {
      progressMap.set(trackId, {
        current: 0,
        total: rows.length,
        percent: 0,
        updatedAt: Date.now(),
      });
    }

    const filename = `tanbox-labels-${template.widthMm}x${template.heightMm}-${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await pdfGen.generateRollPdf(template, rows, res, (current, total) => {
      if (trackId) {
        progressMap.set(trackId, {
          current,
          total,
          percent: total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0,
          updatedAt: Date.now(),
        });
      }
    });

    if (trackId) {
      // Keep completed state for 15 seconds before deleting
      progressMap.set(trackId, {
        current: rows.length,
        total: rows.length,
        percent: 100,
        updatedAt: Date.now(),
      });
      setTimeout(() => progressMap.delete(trackId), 15000);
    }
  } catch (err: any) {
    if (trackId) progressMap.delete(trackId);
    console.error('PDF Generation Error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Ошибка при генерации PDF файла этикеток' });
    }
  }
});

/**
 * 3. Render single preview sample PDF
 */
router.post('/preview', async (req: Request, res: Response) => {
  try {
    const { template, sampleRow = {} } = req.body;

    if (!template || !template.widthMm || !template.heightMm) {
      return res.status(400).json({ message: 'Некорректный шаблон этикетки' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="preview.pdf"');

    await pdfGen.generateRollPdf(template, [sampleRow], res);
  } catch (err: any) {
    console.error('Preview Error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Ошибка при формировании образца этикетки' });
    }
  }
});

export default router;
