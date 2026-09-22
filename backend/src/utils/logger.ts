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

export const logger = {
  info: (message: string, meta?: any) => {
    const time = new Date().toISOString();
    const logLine = `[${time}] [INFO] ${message}${meta ? ' ' + JSON.stringify(meta) : ''}\n`;
    process.stdout.write(logLine);
    accessStream.write(logLine);
  },

  warn: (message: string, meta?: any) => {
    const time = new Date().toISOString();
    const logLine = `[${time}] [WARN] ${message}${meta ? ' ' + JSON.stringify(meta) : ''}\n`;
    process.stdout.write(logLine);
    accessStream.write(logLine);
  },

  error: (message: string, error?: any) => {
    const time = new Date().toISOString();
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
    const logLine = `[${time}] [ERROR] ${message}${errStr}\n`;
    process.stderr.write(logLine);
    errorStream.write(logLine);
    accessStream.write(logLine);
  },

  frontend: (level: string, message: string, meta?: any) => {
    const time = new Date().toISOString();
    const logLine = `[${time}] [FRONTEND-${level.toUpperCase()}] ${message}${meta ? ' ' + JSON.stringify(meta) : ''}\n`;
    process.stdout.write(logLine);
    frontendStream.write(logLine);
    if (level.toLowerCase() === 'error') {
      errorStream.write(logLine);
    }
  }
};
