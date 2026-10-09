import EventEmitter from 'events';
import fs from 'fs';
import path from 'path';
import { telegram } from './telegram.service';

export interface ActiveJobItem {
  id: string;
  key: string;
  description: string;
  orderId?: string;
  queuedAt: number;
  startedAt: number;
  elapsedSec: number;
  estimatedCount?: number;
  progress?: {
    current: number;
    total: number;
    percent: number;
  };
}

export interface WaitingJobItem {
  id: string;
  key: string;
  description: string;
  orderId?: string;
  position: number;
  queuedAt: number;
  waitingSec: number;
}

export interface CompletedJobItem {
  id: string;
  key: string;
  description: string;
  orderId?: string;
  status: 'completed' | 'failed';
  durationSec: number;
  completedAt: number;
  error?: string;
}

export interface QueueStats {
  activeJobs: number;
  waitingJobs: number;
  maxConcurrency: number;
  totalCompleted: number;
  totalFailed: number;
}

export interface DetailedQueueStats extends QueueStats {
  activeList: ActiveJobItem[];
  waitingList: WaitingJobItem[];
  recentHistory: CompletedJobItem[];
}

interface InFlightTask<T> {
  id: string;
  key: string;
  description: string;
  orderId?: string;
  fn: () => Promise<T>;
  abort?: () => void;
  resolve: (value: T) => void;
  reject: (err: any) => void;
  queuedAt: number;
  startedAt?: number;
  progress?: {
    current: number;
    total: number;
    percent: number;
  };
}

class PdfGenerationQueue extends EventEmitter {
  private maxConcurrency: number;
  private activeCount: number = 0;
  private waitingQueue: InFlightTask<any>[] = [];
  private inFlightMap: Map<string, Promise<any>> = new Map();
  private runningTasksMap: Map<string, InFlightTask<any>> = new Map();
  private recentHistory: CompletedJobItem[] = [];
  private totalCompleted: number = 0;
  private totalFailed: number = 0;
  private stateFilePath = path.resolve(process.cwd(), 'uploads', 'pdf_queue_state.json');

  constructor(maxConcurrency: number = 2) {
    super();
    this.maxConcurrency = maxConcurrency;
    this.loadPersistentState();
  }

  private loadPersistentState() {
    try {
      if (fs.existsSync(this.stateFilePath)) {
        const raw = fs.readFileSync(this.stateFilePath, 'utf-8');
        const data = JSON.parse(raw);
        if (data) {
          if (typeof data.totalCompleted === 'number') this.totalCompleted = data.totalCompleted;
          if (typeof data.totalFailed === 'number') this.totalFailed = data.totalFailed;
          if (Array.isArray(data.recentHistory)) this.recentHistory = data.recentHistory.slice(0, 50);
          console.log(
            `[PdfQueue] 💾 Loaded persistent state: ${this.totalCompleted} completed, ${this.totalFailed} failed, ${this.recentHistory.length} history items`
          );
        }
      }
    } catch (err) {
      console.warn('[PdfQueue] Failed to load persistent state:', err);
    }

    this.cleanupOrphanTempFiles();
  }

  private savePersistentState() {
    try {
      const dir = path.dirname(this.stateFilePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        this.stateFilePath,
        JSON.stringify(
          {
            totalCompleted: this.totalCompleted,
            totalFailed: this.totalFailed,
            recentHistory: this.recentHistory.slice(0, 50),
            savedAt: new Date().toISOString(),
          },
          null,
          2
        ),
        'utf-8'
      );
    } catch (err) {
      console.warn('[PdfQueue] Failed to save persistent state:', err);
    }
  }

  private cleanupOrphanTempFiles() {
    try {
      const ordersDir = path.resolve(process.cwd(), 'uploads', 'orders');
      if (!fs.existsSync(ordersDir)) return;

      const orderDirs = fs.readdirSync(ordersDir);
      let cleanedCount = 0;

      for (const oDir of orderDirs) {
        const fullDir = path.join(ordersDir, oDir);
        try {
          if (fs.statSync(fullDir).isDirectory()) {
            const files = fs.readdirSync(fullDir);
            for (const file of files) {
              if (file.includes('.tmp') || file.endsWith('.tmp')) {
                try {
                  fs.unlinkSync(path.join(fullDir, file));
                  cleanedCount++;
                } catch {}
              }
            }
          }
        } catch {}
      }

      if (cleanedCount > 0) {
        console.log(`[PdfQueue] 🧹 Cleaned up ${cleanedCount} orphan temp file(s) left from previous server run`);
        this.totalFailed += cleanedCount;
        this.recentHistory.unshift({
          id: `interrupted_${Date.now()}`,
          key: 'server_reboot_cleanup',
          description: `Прерванные генерации (${cleanedCount} шт.) — очищены при рестарте`,
          status: 'failed',
          durationSec: 0,
          completedAt: Date.now(),
          error: 'Сервер был перезапущен во время генерации. Незавершённые временные файлы удалены.',
        });
        if (this.recentHistory.length > 50) this.recentHistory = this.recentHistory.slice(0, 50);
        this.savePersistentState();
      }
    } catch (err) {
      console.warn('[PdfQueue] Orphan temp cleanup error:', err);
    }
  }

  private extractOrderId(key: string): string | undefined {
    const match = key.match(/^order_([a-zA-Z0-9-]+)/);
    return match ? match[1] : undefined;
  }

  private extractEstimatedCount(desc: string): number | undefined {
    const match = desc.match(/\((\d[\d\s]*)\s*шт/i);
    if (match) {
      const num = parseInt(match[1].replace(/\s+/g, ''), 10);
      return !isNaN(num) ? num : undefined;
    }
    return undefined;
  }

  /**
   * Set maximum concurrent PDF generation tasks
   */
  public setMaxConcurrency(val: number) {
    this.maxConcurrency = Math.max(1, Math.min(10, val));
    this.processNext();
  }

  /**
   * Update live progress for an active job
   */
  public updateJobProgress(jobIdOrKey: string, current: number, total: number) {
    for (const [key, task] of this.runningTasksMap.entries()) {
      if (task.id === jobIdOrKey || task.key === jobIdOrKey) {
        const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
        task.progress = { current, total, percent };
        this.emit('progress', { jobId: task.id, key: task.key, current, total, percent });
        break;
      }
    }
  }

  /**
   * Cancel a task by its ID or Key
   */
  public cancelTask(jobIdOrKey: string): boolean {
    const now = Date.now();
    // 1. Check waiting queue
    const waitingIdx = this.waitingQueue.findIndex(
      (t) => t.id === jobIdOrKey || t.key === jobIdOrKey
    );
    if (waitingIdx !== -1) {
      const [task] = this.waitingQueue.splice(waitingIdx, 1);
      this.inFlightMap.delete(task.key);
      try {
        task.abort?.();
      } catch {}
      task.reject(new Error('Задача отменена администратором'));
      this.totalFailed++;
      this.recentHistory.unshift({
        id: task.id,
        key: task.key,
        description: task.description,
        orderId: task.orderId,
        status: 'failed',
        durationSec: 0,
        completedAt: now,
        error: 'Отменено из очереди ожидания',
      });
      if (this.recentHistory.length > 50) this.recentHistory.pop();
      this.savePersistentState();
      console.log(`[PdfQueue] 🚫 Task cancelled from waiting queue: "${task.description}" (ID: ${task.id})`);
      return true;
    }

    // 2. Check running tasks
    for (const [key, task] of this.runningTasksMap.entries()) {
      if (task.id === jobIdOrKey || task.key === jobIdOrKey) {
        this.runningTasksMap.delete(key);
        this.inFlightMap.delete(key);
        this.activeCount = Math.max(0, this.activeCount - 1);
        this.totalFailed++;
        const durationSec = task.startedAt
          ? parseFloat(((now - task.startedAt) / 1000).toFixed(1))
          : 0;
        try {
          task.abort?.();
        } catch {}
        this.recentHistory.unshift({
          id: task.id,
          key: task.key,
          description: task.description,
          orderId: task.orderId,
          status: 'failed',
          durationSec,
          completedAt: now,
          error: 'Принудительно остановлено администратором',
        });
        if (this.recentHistory.length > 50) this.recentHistory.pop();
        this.savePersistentState();
        task.reject(new Error('Задача принудительно остановлена администратором'));
        console.log(`[PdfQueue] 🛑 Running task stopped by admin: "${task.description}" (ID: ${task.id})`);
        this.processNext();
        return true;
      }
    }

    return false;
  }

  /**
   * Clear and abort all running and waiting tasks
   */
  public clearAll(): number {
    const now = Date.now();
    let count = 0;
    // Cancel running
    for (const [key, task] of this.runningTasksMap.entries()) {
      this.runningTasksMap.delete(key);
      this.inFlightMap.delete(key);
      this.totalFailed++;
      const durationSec = task.startedAt
        ? parseFloat(((now - task.startedAt) / 1000).toFixed(1))
        : 0;
      try {
        task.abort?.();
      } catch {}
      this.recentHistory.unshift({
        id: task.id,
        key: task.key,
        description: task.description,
        orderId: task.orderId,
        status: 'failed',
        durationSec,
        completedAt: now,
        error: 'Остановлено при сбросе очереди',
      });
      task.reject(new Error('Очередь сброшена администратором'));
      count++;
    }
    this.activeCount = 0;

    // Cancel waiting
    while (this.waitingQueue.length > 0) {
      const task = this.waitingQueue.shift()!;
      this.inFlightMap.delete(task.key);
      this.totalFailed++;
      try {
        task.abort?.();
      } catch {}
      this.recentHistory.unshift({
        id: task.id,
        key: task.key,
        description: task.description,
        orderId: task.orderId,
        status: 'failed',
        durationSec: 0,
        completedAt: now,
        error: 'Отменено при сбросе очереди',
      });
      task.reject(new Error('Очередь сброшена администратором'));
      count++;
    }

    if (this.recentHistory.length > 50) {
      this.recentHistory = this.recentHistory.slice(0, 50);
    }
    this.savePersistentState();
    console.log(`[PdfQueue] 🧹 Cleared all ${count} tasks from queue`);
    return count;
  }

  /**
   * Enqueue a PDF generation task.
   * If a task with the same `key` is currently in progress or in queue,
   * returns the existing promise (deduplication).
   */
  public enqueue<T>(
    key: string,
    description: string,
    taskFn: () => Promise<T>,
    abortFn?: () => void
  ): Promise<T> {
    // Deduplication check: if this exact job is already running or queued, share its promise
    if (this.inFlightMap.has(key)) {
      console.log(`[PdfQueue] ⚡ Reusing in-flight generation for key: "${key}" (${description})`);
      return this.inFlightMap.get(key) as Promise<T>;
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const queuedAt = Date.now();
    const orderId = this.extractOrderId(key);

    const promise = new Promise<T>((resolve, reject) => {
      const task: InFlightTask<T> = {
        id: jobId,
        key,
        description,
        orderId,
        fn: taskFn,
        abort: abortFn,
        resolve: (val) => {
          this.inFlightMap.delete(key);
          this.runningTasksMap.delete(key);
          resolve(val);
        },
        reject: (err) => {
          this.inFlightMap.delete(key);
          this.runningTasksMap.delete(key);
          reject(err);
        },
        queuedAt,
      };

      this.waitingQueue.push(task);
      const position = this.waitingQueue.length;
      console.log(
        `[PdfQueue] 📥 Enqueued task: "${description}" (ID: ${jobId}, position: #${position}, active: ${this.activeCount}/${this.maxConcurrency})`
      );

      this.emit('enqueued', { jobId, key, description, position, orderId });
      this.processNext();
    });

    this.inFlightMap.set(key, promise);
    return promise;
  }

  /**
   * Basic queue statistics
   */
  public getStats(): QueueStats {
    return {
      activeJobs: this.activeCount,
      waitingJobs: this.waitingQueue.length,
      maxConcurrency: this.maxConcurrency,
      totalCompleted: this.totalCompleted,
      totalFailed: this.totalFailed,
    };
  }

  /**
   * Detailed queue statistics with all active, queued, and recent items for DevOps
   */
  public getDetailedStats(): DetailedQueueStats {
    const now = Date.now();
    const activeList: ActiveJobItem[] = Array.from(this.runningTasksMap.values()).map((t) => ({
      id: t.id,
      key: t.key,
      description: t.description,
      orderId: t.orderId,
      queuedAt: t.queuedAt,
      startedAt: t.startedAt || t.queuedAt,
      elapsedSec: Math.max(0, Math.round((now - (t.startedAt || t.queuedAt)) / 1000)),
      estimatedCount: this.extractEstimatedCount(t.description),
      progress: t.progress,
    }));

    const waitingList: WaitingJobItem[] = this.waitingQueue.map((t, idx) => ({
      id: t.id,
      key: t.key,
      description: t.description,
      orderId: t.orderId,
      position: idx + 1,
      queuedAt: t.queuedAt,
      waitingSec: Math.max(0, Math.round((now - t.queuedAt) / 1000)),
    }));

    return {
      activeJobs: this.activeCount,
      waitingJobs: this.waitingQueue.length,
      maxConcurrency: this.maxConcurrency,
      totalCompleted: this.totalCompleted,
      totalFailed: this.totalFailed,
      activeList,
      waitingList,
      recentHistory: this.recentHistory.slice(0, 30),
    };
  }

  /**
   * Check if any task for this order is currently running or in queue
   */
  public getOrderJobs(orderId: string): {
    hasActive: boolean;
    activeJob?: ActiveJobItem;
    hasWaiting: boolean;
    waitingJob?: WaitingJobItem;
  } {
    const now = Date.now();
    // Check running
    const running = Array.from(this.runningTasksMap.values()).find(
      (t) => t.orderId === orderId || t.key.includes(orderId)
    );
    // Check waiting
    const waitingIdx = this.waitingQueue.findIndex(
      (t) => t.orderId === orderId || t.key.includes(orderId)
    );
    const waiting = waitingIdx !== -1 ? this.waitingQueue[waitingIdx] : undefined;

    return {
      hasActive: Boolean(running),
      activeJob: running
        ? {
            id: running.id,
            key: running.key,
            description: running.description,
            orderId: running.orderId,
            queuedAt: running.queuedAt,
            startedAt: running.startedAt || running.queuedAt,
            elapsedSec: Math.max(0, Math.round((now - (running.startedAt || running.queuedAt)) / 1000)),
            estimatedCount: this.extractEstimatedCount(running.description),
            progress: running.progress,
          }
        : undefined,
      hasWaiting: Boolean(waiting),
      waitingJob: waiting
        ? {
            id: waiting.id,
            key: waiting.key,
            description: waiting.description,
            orderId: waiting.orderId,
            position: waitingIdx + 1,
            queuedAt: waiting.queuedAt,
            waitingSec: Math.max(0, Math.round((now - waiting.queuedAt) / 1000)),
          }
        : undefined,
    };
  }

  /**
   * Get info for a specific task key
   */
  public getJobInfo(key: string): { status: 'processing' | 'queued' | 'idle'; position?: number } {
    if (this.runningTasksMap.has(key)) {
      return { status: 'processing' };
    }
    const idx = this.waitingQueue.findIndex((t) => t.key === key);
    if (idx !== -1) {
      return { status: 'queued', position: idx + 1 };
    }
    return { status: 'idle' };
  }

  /**
   * Process next waiting task if under concurrency limit
   */
  private async processNext() {
    if (this.activeCount >= this.maxConcurrency) {
      return;
    }

    const task = this.waitingQueue.shift();
    if (!task) {
      return;
    }

    this.activeCount++;
    task.startedAt = Date.now();
    const waitTimeSec = ((task.startedAt - task.queuedAt) / 1000).toFixed(1);
    this.runningTasksMap.set(task.key, task);

    console.log(
      `[PdfQueue] 🚀 Starting task "${task.description}" (waited ${waitTimeSec}s in queue, active: ${this.activeCount}/${this.maxConcurrency})`
    );

    // Adaptive timeout safety: minimum 30 minutes, or 30ms per estimated label (for 150k labels ~ 75 mins)
    const estimatedCount = this.extractEstimatedCount(task.description);
    const estimatedSec = Math.max(1800, Math.ceil(((estimatedCount || 50000) * 30) / 1000));
    const timeoutMs = estimatedSec * 1000;
    const timeoutMin = Math.round(estimatedSec / 60);

    let timedOut = false;
    const timeoutHandle = setTimeout(() => {
      timedOut = true;
      console.error(`[PdfQueue] ⚠️ Task "${task.description}" exceeded ${timeoutMin} minute timeout guard!`);
      telegram.sendPdfWorkerAlert(task.description, `Превышен максимальный лимит времени генерации (${timeoutMin} минут)`).catch(() => {});
      this.runningTasksMap.delete(task.key);
      this.inFlightMap.delete(task.key);
      this.activeCount = Math.max(0, this.activeCount - 1);
      this.totalFailed++;
      this.recentHistory.unshift({
        id: task.id,
        key: task.key,
        description: task.description,
        orderId: task.orderId,
        status: 'failed',
        durationSec: estimatedSec,
        completedAt: Date.now(),
        error: `Превышен лимит времени (${timeoutMin} мин)`,
      });
      if (this.recentHistory.length > 50) this.recentHistory.pop();
      this.savePersistentState();
      task.reject(new Error(`Время генерации PDF превысило лимит ${timeoutMin} минут`));
      this.processNext();
    }, timeoutMs);

    try {
      const result = await task.fn();
      if (!timedOut) {
        clearTimeout(timeoutHandle);
        const durationSec = parseFloat(((Date.now() - (task.startedAt || task.queuedAt)) / 1000).toFixed(1));
        console.log(`[PdfQueue] ✅ Completed task "${task.description}" in ${durationSec}s`);
        this.totalCompleted++;
        this.runningTasksMap.delete(task.key);
        this.inFlightMap.delete(task.key);
        this.activeCount = Math.max(0, this.activeCount - 1);
        this.recentHistory.unshift({
          id: task.id,
          key: task.key,
          description: task.description,
          orderId: task.orderId,
          status: 'completed',
          durationSec,
          completedAt: Date.now(),
        });
        if (this.recentHistory.length > 50) this.recentHistory.pop();
        this.savePersistentState();
        task.resolve(result);
        this.processNext();
      }
    } catch (err: any) {
      if (!timedOut) {
        clearTimeout(timeoutHandle);
        const durationSec = parseFloat(((Date.now() - (task.startedAt || task.queuedAt)) / 1000).toFixed(1));
        console.error(`[PdfQueue] ❌ Failed task "${task.description}":`, err.message);
        telegram.sendPdfWorkerAlert(task.description, err.message || 'Ошибка генератора PDF').catch(() => {});
        this.totalFailed++;
        this.runningTasksMap.delete(task.key);
        this.inFlightMap.delete(task.key);
        this.activeCount = Math.max(0, this.activeCount - 1);
        this.recentHistory.unshift({
          id: task.id,
          key: task.key,
          description: task.description,
          orderId: task.orderId,
          status: 'failed',
          durationSec,
          completedAt: Date.now(),
          error: err.message,
        });
        if (this.recentHistory.length > 50) this.recentHistory.pop();
        this.savePersistentState();
        task.reject(err);
        this.processNext();
      }
    }
  }
}

// Global singleton queue instance (max concurrency: 2 by default or from env)
const concurrencyLimit = parseInt(process.env.PDF_CONCURRENCY || '2', 10) || 2;
export const pdfQueue = new PdfGenerationQueue(concurrencyLimit);
