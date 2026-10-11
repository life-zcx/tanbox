import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadsTempDir = path.resolve(process.cwd(), 'uploads/temp');

if (!fs.existsSync(uploadsTempDir)) {
  fs.mkdirSync(uploadsTempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsTempDir);
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
    const allowedExts = ['.csv', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Разрешены только текстовые файлы кодов маркировки в формате .csv или .txt'));
    }
  },
});
