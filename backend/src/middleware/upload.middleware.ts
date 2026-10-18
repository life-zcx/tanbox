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

const bugReportsDir = path.resolve(process.cwd(), 'uploads/bug-reports');
if (!fs.existsSync(bugReportsDir)) {
  fs.mkdirSync(bugReportsDir, { recursive: true });
}

const bugReportStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, bugReportsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_\-]/g, '_');
    cb(null, `bug_${Date.now()}_${cleanName}${ext}`);
  },
});

export const bugReportUpload = multer({
  storage: bugReportStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.png', '.jpg', '.jpeg', '.webp', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Разрешены только изображения (PNG, JPG, WEBP) или файлы PDF'));
    }
  },
});

const productCardsDir = path.resolve(process.cwd(), 'uploads/product-cards');
if (!fs.existsSync(productCardsDir)) {
  fs.mkdirSync(productCardsDir, { recursive: true });
}

const productCardStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productCardsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_\-]/g, '_');
    cb(null, `card_${Date.now()}_${cleanName}${ext}`);
  },
});

export const productCardImageUpload = multer({
  storage: productCardStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.png', '.jpg', '.jpeg', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Разрешены только форматы изображений: PNG, JPG, JPEG, WEBP'));
    }
  },
});


