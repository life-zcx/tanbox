import fs from 'fs';
import path from 'path';

const logsDir = path.join(__dirname, '../../logs');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

class RotatingLogStream {
  private filePath: string;
  private maxBytes: number;
  private maxBackups: number;
  private currentSize: number = 0;
  private stream: fs.WriteStream | null = null;

  constructor(filePath: string, maxBytes: number = 10 * 1024 * 1024, maxBackups: number = 5) {
    this.filePath = filePath;
    this.maxBytes = maxBytes;
    this.maxBackups = maxBackups;
    this.initStream();
  }

  private initStream() {
    try {
      if (fs.existsSync(this.filePath)) {
        const stats = fs.statSync(this.filePath);
        this.currentSize = stats.size;
      } else {
        this.currentSize = 0;
      }
    } catch {
      this.currentSize = 0;
    }
    this.stream = fs.createWriteStream(this.filePath, { flags: 'a' });
  }

  public write(line: string) {
    const bytes = Buffer.byteLength(line, 'utf-8');
    if (this.currentSize + bytes > this.maxBytes) {
      this.rotate();
    }
    if (this.stream) {
      this.stream.write(line);
      this.currentSize += bytes;
    }
  }

  private rotate() {
    try {
      if (this.stream) {
        this.stream.end();
        this.stream = null;
      }

      for (let i = this.maxBackups - 1; i >= 1; i--) {
        const src = `${this.filePath}.${i}`;
        const dest = `${this.filePath}.${i + 1}`;
        if (fs.existsSync(src)) {
          try {
            if (fs.existsSync(dest)) fs.unlinkSync(dest);
            fs.renameSync(src, dest);
          } catch {}
        }
      }

      const firstBackup = `${this.filePath}.1`;
      if (fs.existsSync(this.filePath)) {
        if (fs.existsSync(firstBackup)) fs.unlinkSync(firstBackup);
        fs.renameSync(this.filePath, firstBackup);
      }
    } catch (err) {
      console.error('Log rotation error:', err);
    } finally {
      this.initStream();
    }
  }
}

const accessStream = new RotatingLogStream(path.join(logsDir, 'access.log'));
const errorStream = new RotatingLogStream(path.join(logsDir, 'error.log'));
const frontendStream = new RotatingLogStream(path.join(logsDir, 'frontend.log'));

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
