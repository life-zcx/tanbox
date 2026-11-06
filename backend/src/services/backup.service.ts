import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { pipeline, finished } from 'stream/promises';
import { createGunzip } from 'zlib';

export const backupsDir = path.resolve(process.cwd(), 'backups');
export interface BackupItem { fileName: string; filePath: string; sizeBytes: number; sizeFormatted: string; createdAt: Date }
let active = false;

async function dumpTo(file: string, docker: boolean) {
  const url = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;
  const user = process.env.POSTGRES_USER || (url && decodeURIComponent(url.username)) || 'tanbox_user';
  const database = process.env.POSTGRES_DB || url?.pathname.slice(1) || 'tanbox_db';
  const host = process.env.POSTGRES_HOST || url?.hostname || 'postgres';
  const port = process.env.POSTGRES_PORT || url?.port || '5432';
  const env = { ...process.env, PGPASSWORD: process.env.POSTGRES_PASSWORD || (url && decodeURIComponent(url.password)) || '' };
  const args = docker
    ? ['exec', '-e', 'PGPASSWORD', process.env.POSTGRES_CONTAINER || 'tanbox_postgres', 'pg_dump', '--no-password', '-U', user, '-d', database]
    : ['--no-password', '-h', host, '-p', port, '-U', user, '-d', database];
  const child = spawn(docker ? 'docker' : 'pg_dump', args, { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let errorText = '';
  child.stderr.on('data', chunk => { errorText = (errorText + String(chunk)).slice(-4096); });
  const exit = new Promise<void>((resolve, reject) => {
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`pg_dump failed (exit ${code})`)));
  });
  const output = fs.createWriteStream(file, { flags: 'wx' });
  try { await Promise.all([pipeline(child.stdout, output), exit]); }
  catch (error) { child.kill(); output.destroy(); await finished(output).catch(() => {}); throw error; }
}

export async function isCompleteBackup(file: string): Promise<boolean> {
  let head = '', tail = '';
  try {
    if (file.endsWith('.gz')) {
      const input = fs.createReadStream(file); const unzip = createGunzip();
      input.on('error', error => unzip.destroy(error)); input.pipe(unzip);
      try {
        for await (const chunk of unzip) { const text = String(chunk); head = (head + text).slice(0, 8192); tail = (tail + text).slice(-8192); }
      } finally { input.destroy(); unzip.destroy(); }
    } else {
      const handle = await fs.promises.open(file, 'r');
      try {
        const stat = await handle.stat(); const first = Buffer.alloc(8192), last = Buffer.alloc(8192);
        const a = await handle.read(first, 0, first.length, 0);
        const b = await handle.read(last, 0, last.length, Math.max(0, stat.size - last.length));
        head = first.subarray(0, a.bytesRead).toString(); tail = last.subarray(0, b.bytesRead).toString();
      } finally { await handle.close(); }
    }
    return head.includes('-- PostgreSQL database dump') && tail.includes('-- PostgreSQL database dump complete');
  } catch { return false; }
}

export async function createDatabaseBackup(): Promise<BackupItem> {
  if (active) throw new Error('A backup is already running');
  active = true;
  const fileName = `tanbox_backup_${new Date().toISOString().replace(/[-:T.Z]/g, '')}_${randomUUID()}.sql`;
  const filePath = path.join(backupsDir, fileName), temporary = filePath + '.part';
  try {
    await fs.promises.mkdir(backupsDir, { recursive: true });
    try { await dumpTo(temporary, process.platform === 'win32'); }
    catch (error: any) {
      if (process.platform === 'win32' || error.code !== 'ENOENT') throw error;
      await fs.promises.unlink(temporary).catch(() => {});
      await dumpTo(temporary, true);
    }
    if (!await isCompleteBackup(temporary)) throw new Error('Backup is incomplete');
    await fs.promises.rename(temporary, filePath);
    return await describe(fileName);
  } finally {
    active = false;
    await fs.promises.unlink(temporary).catch(() => {});
  }
}

async function describe(fileName: string): Promise<BackupItem> {
  const filePath = path.join(backupsDir, fileName), stat = await fs.promises.stat(filePath);
  return { fileName, filePath, sizeBytes: stat.size, sizeFormatted: `${(stat.size / 1048576).toFixed(2)} MB`, createdAt: stat.mtime };
}

export async function getBackupsList(): Promise<BackupItem[]> {
  if (!fs.existsSync(backupsDir)) return [];
  const backups: BackupItem[] = [];
  for (const entry of await fs.promises.readdir(backupsDir, { withFileTypes: true })) {
    if (!entry.isFile() || !/^tanbox_[a-zA-Z0-9_.-]+\.sql(?:\.gz)?$/.test(entry.name)) continue;
    if (await isCompleteBackup(path.join(backupsDir, entry.name))) backups.push(await describe(entry.name));
  }
  return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
