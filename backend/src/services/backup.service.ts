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

  const dbUser = process.env.POSTGRES_USER || 'tanbox_user';
  const dbPassword = process.env.POSTGRES_PASSWORD || 'tanbox_pass_2026';
  const dbName = process.env.POSTGRES_DB || 'tanbox_db';
  const dbHost = process.env.POSTGRES_HOST || 'postgres';

  const envWithPgPass = {
    ...process.env,
    PGPASSWORD: dbPassword,
  };

  let command = `pg_dump -h ${dbHost} -U ${dbUser} -d ${dbName} -f "${targetPath}"`;
  if (process.platform === 'win32') {
    command = `docker exec -e PGPASSWORD=${dbPassword} tanbox_postgres pg_dump -U ${dbUser} -d ${dbName} > "${targetPath}"`;
  }

  try {
    await execPromise(command, { env: envWithPgPass });
  } catch (cmdErr: any) {
    logger.warn(`Primary pg_dump command failed (${cmdErr.message}), trying fallback...`);
    await execPromise(`docker exec -e PGPASSWORD=${dbPassword} tanbox_postgres pg_dump -U ${dbUser} -d ${dbName} > "${targetPath}"`, { env: envWithPgPass });
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
