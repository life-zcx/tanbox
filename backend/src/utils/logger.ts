import fs from 'fs';
import path from 'path';

const logsDir = path.join(__dirname, '../../logs');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const accessLogPath = path.join(logsDir, 'access.log');
const errorLogPath = path.join(logsDir, 'error.log');
const frontendLogPath = path.join(logsDir, 'frontend.log');

const accessStream = fs.createWriteStream(accessLogPath, { flags: 'a' });
const errorStream = fs.createWriteStream(errorLogPath, { flags: 'a' });
const frontendStream = fs.createWriteStream(frontendLogPath, { flags: 'a' });

function sanitizeLog(text: string): string {
  return String(text).replace(/[\r\n]+/g, ' ').slice(0, 1000);
}

export const logger = {
  info: (message: string, meta?: any) => {
    const time = new Date().toISOString();
    const safeMsg = sanitizeLog(message);
    const safeMeta = meta ? ' ' + JSON.stringify(meta).slice(0, 500) : '';
    const logLine = `[${time}] [INFO] ${safeMsg}${safeMeta}\n`;
    process.stdout.write(logLine);
    accessStream.write(logLine);
  },

  warn: (message: string, meta?: any) => {
    const time = new Date().toISOString();
    const safeMsg = sanitizeLog(message);
    const safeMeta = meta ? ' ' + JSON.stringify(meta).slice(0, 500) : '';
    const logLine = `[${time}] [WARN] ${safeMsg}${safeMeta}\n`;
    process.stdout.write(logLine);
    accessStream.write(logLine);
  },

  error: (message: string, error?: any) => {
    const time = new Date().toISOString();
    const safeMsg = sanitizeLog(message);
    let errStr = '';
    if (error) {
      if (error instanceof Error) {
        errStr = ` ${error.message} - Stack: ${error.stack}`;
      } else if (typeof error === 'object') {
        errStr = ` ${JSON.stringify(error)}`;
      } else {
        errStr = ` ${error}`;
      }
    }
    const logLine = `[${time}] [ERROR] ${safeMsg}${sanitizeLog(errStr)}\n`;
    process.stderr.write(logLine);
    errorStream.write(logLine);
    accessStream.write(logLine);
  },

  frontend: (level: string, message: string, meta?: any) => {
    const time = new Date().toISOString();
    const safeLevel = sanitizeLog(level).toUpperCase();
    const safeMsg = sanitizeLog(message);
    const safeMeta = meta ? ' ' + JSON.stringify(meta).slice(0, 500) : '';
    const logLine = `[${time}] [FRONTEND-${safeLevel}] ${safeMsg}${safeMeta}\n`;
    process.stdout.write(logLine);
    frontendStream.write(logLine);
    if (level.toLowerCase() === 'error') {
      errorStream.write(logLine);
    }
  },
};
