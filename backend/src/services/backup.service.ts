import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { logger } from '../utils/logger';

const execPromise = util.promisify(exec);
export const backupsDir = path.resolve(process.cwd(), 'backups');

if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

export interface BackupItem {
  fileName: string;
  filePath: string;
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: Date;
}

/**
 * Creates a database backup dump (.sql)
 */
export async function createDatabaseBackup(): Promise<BackupItem> {
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const fileName = `tanbox_backup_${timestamp}.sql`;
  const targetPath = path.join(backupsDir, fileName);

  let dbUser = process.env.POSTGRES_USER || 'tanbox_user';
  let dbPassword = process.env.POSTGRES_PASSWORD || '';
  let dbName = process.env.POSTGRES_DB || 'tanbox_db';
  let dbHost = process.env.POSTGRES_HOST || 'postgres';

  if (!dbPassword && process.env.DATABASE_URL) {
    try {
      const parsedUrl = new URL(process.env.DATABASE_URL);
      if (parsedUrl.username) dbUser = parsedUrl.username;
      if (parsedUrl.password) dbPassword = decodeURIComponent(parsedUrl.password);
      if (parsedUrl.pathname) dbName = parsedUrl.pathname.replace(/^\//, '');
      if (parsedUrl.hostname) dbHost = parsedUrl.hostname;
    } catch {}
  }

  const envWithPgPass = {
    ...process.env,
    PGPASSWORD: dbPassword,
  };

  // Validate identifiers to prevent shell command injection
  const safeIdentifier = (val: string) => val.replace(/[^a-zA-Z0-9_\-]/g, '');
  const safeUser = safeIdentifier(dbUser);
  const safeName = safeIdentifier(dbName);
  const safeHost = safeIdentifier(dbHost);

  let command = `pg_dump -h ${safeHost} -U ${safeUser} -d ${safeName} -f "${targetPath}"`;
  if (process.platform === 'win32') {
    command = `docker exec tanbox_postgres pg_dump -U ${safeUser} -d ${safeName} > "${targetPath}"`;
  }

  try {
    await execPromise(command, { env: envWithPgPass });
  } catch (cmdErr: any) {
    // Only attempt docker exec fallback if not already on win32 and if primary command was direct pg_dump
    if (process.platform !== 'win32') {
      try {
        logger.warn(`Primary pg_dump command failed (${cmdErr.message}), trying docker exec fallback...`);
        await execPromise(`docker exec tanbox_postgres pg_dump -U ${safeUser} -d ${safeName} > "${targetPath}"`, { env: envWithPgPass });
      } catch (fallbackErr: any) {
        throw new Error(`Ошибка создания дампа БД: ${cmdErr.message}`);
      }
    } else {
      throw cmdErr;
    }
  }

  const stat = await fs.promises.stat(targetPath);
  return {
    fileName,
    filePath: targetPath,
    sizeBytes: stat.size,
    sizeFormatted: `${(stat.size / (1024 * 1024)).toFixed(2)} MB`,
    createdAt: stat.mtime,
  };
}

/**
 * Returns list of existing database backups sorted newest first
 */
export async function getBackupsList(): Promise<BackupItem[]> {
  if (!fs.existsSync(backupsDir)) {
    return [];
  }
  const files = await fs.promises.readdir(backupsDir);
  const backups: BackupItem[] = [];
  for (const fileName of files) {
    if (fileName.startsWith('tanbox_') && (fileName.endsWith('.sql') || fileName.endsWith('.sql.gz'))) {
      const filePath = path.join(backupsDir, fileName);
      const stat = await fs.promises.stat(filePath);
      backups.push({
        fileName,
        filePath,
        sizeBytes: stat.size,
        sizeFormatted: `${(stat.size / (1024 * 1024)).toFixed(2)} MB`,
        createdAt: stat.mtime,
      });
    }
  }
  backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return backups;
}
