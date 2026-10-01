import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadsBaseDir = path.resolve(process.cwd(), 'uploads/orders');

if (!fs.existsSync(uploadsBaseDir)) {
  fs.mkdirSync(uploadsBaseDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const orderId = req.params.id || 'temp';
    const targetDir = path.join(uploadsBaseDir, orderId);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_\-\u0400-\u04FF]/g, '_');
    cb(null, `${Date.now()}_${baseName}${ext}`);
  },
});

export const orderCodesUpload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // up to 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.csv', '.txt', '.pdf', '.zip', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Разрешены только файлы .csv, .txt, .pdf, .zip, .xlsx'));
    }
  },
});
