import EventEmitter from 'events';
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
  resolve: (value: T) => void;
  reject: (err: any) => void;
  queuedAt: number;
  startedAt?: number;
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

  constructor(maxConcurrency: number = 2) {
    super();
    this.maxConcurrency = maxConcurrency;
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
   * Enqueue a PDF generation task.
   * If a task with the same `key` is currently in progress or in queue,
   * returns the existing promise (deduplication).
   */
  public enqueue<T>(key: string, description: string, taskFn: () => Promise<T>): Promise<T> {
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
        task.reject(err);
        this.processNext();
      }
    }
  }
}

// Global singleton queue instance (max concurrency: 2 by default or from env)
const concurrencyLimit = parseInt(process.env.PDF_CONCURRENCY || '2', 10) || 2;
export const pdfQueue = new PdfGenerationQueue(concurrencyLimit);
