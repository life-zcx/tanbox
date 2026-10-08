import EventEmitter from 'events';
import { telegram } from './telegram.service';

export interface PdfJob {
  id: string;
  key: string;
  description: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  position: number;
  queuedAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

export interface QueueStats {
  activeJobs: number;
  waitingJobs: number;
  maxConcurrency: number;
  totalCompleted: number;
  totalFailed: number;
}

interface InFlightTask<T> {
  id: string;
  key: string;
  description: string;
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
  private totalCompleted: number = 0;
  private totalFailed: number = 0;
  private currentRunningDescriptions: Set<string> = new Set();

  constructor(maxConcurrency: number = 2) {
    super();
    this.maxConcurrency = maxConcurrency;
  }

  /**
   * Set maximum concurrent PDF generation tasks
   */
  public setMaxConcurrency(val: number) {
    this.maxConcurrency = Math.max(1, val);
    this.processNext();
  }

  /**
   * Enqueue a PDF generation task.
   * If a task with the same `key` is currently in progress or in queue,
   * returns the existing promise (deduplication).
   */
  public enqueue<T>(key: string, description: string, taskFn: () => Promise<T>): Promise<T> {
    // 1. Deduplication check: if this exact job is already running or queued, share its promise
    if (this.inFlightMap.has(key)) {
      console.log(`[PdfQueue] ⚡ Reusing in-flight generation for key: "${key}" (${description})`);
      return this.inFlightMap.get(key) as Promise<T>;
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const queuedAt = Date.now();

    const promise = new Promise<T>((resolve, reject) => {
      const task: InFlightTask<T> = {
        id: jobId,
        key,
        description,
        fn: taskFn,
        resolve: (val) => {
          this.inFlightMap.delete(key);
          resolve(val);
        },
        reject: (err) => {
          this.inFlightMap.delete(key);
          reject(err);
        },
        queuedAt,
      };

      this.waitingQueue.push(task);
      const position = this.waitingQueue.length;
      console.log(
        `[PdfQueue] 📥 Enqueued task: "${description}" (ID: ${jobId}, position: #${position}, active: ${this.activeCount}/${this.maxConcurrency})`
      );

      this.emit('enqueued', { jobId, key, description, position });
      this.processNext();
    });

    this.inFlightMap.set(key, promise);
    return promise;
  }

  /**
   * Get queue statistics
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
   * Get info for a specific task key
   */
  public getJobInfo(key: string): { status: 'processing' | 'queued' | 'idle'; position?: number } {
    if (this.currentRunningDescriptions.has(key)) {
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
    this.currentRunningDescriptions.add(task.key);

    console.log(
      `[PdfQueue] 🚀 Starting task "${task.description}" (waited ${waitTimeSec}s in queue, active: ${this.activeCount}/${this.maxConcurrency})`
    );

    // Timeout safety wrapper (max 6 minutes per single PDF task to prevent deadlocks)
    let timedOut = false;
    const timeoutHandle = setTimeout(() => {
      timedOut = true;
      console.error(`[PdfQueue] ⚠️ Task "${task.description}" exceeded 6 minute timeout guard!`);
      telegram.sendPdfWorkerAlert(task.description, 'Превышен максимальный лимит времени генерации (6 минут)').catch(() => {});
      this.currentRunningDescriptions.delete(task.key);
      this.activeCount = Math.max(0, this.activeCount - 1);
      this.totalFailed++;
      task.reject(new Error('Время генерации PDF превысило лимит 6 минут'));
      this.processNext();
    }, 360000);

    try {
      const result = await task.fn();
      if (!timedOut) {
        clearTimeout(timeoutHandle);
        const durationSec = ((Date.now() - (task.startedAt || task.queuedAt)) / 1000).toFixed(1);
        console.log(`[PdfQueue] ✅ Completed task "${task.description}" in ${durationSec}s`);
        this.totalCompleted++;
        this.currentRunningDescriptions.delete(task.key);
        this.activeCount = Math.max(0, this.activeCount - 1);
        task.resolve(result);
        this.processNext();
      }
    } catch (err: any) {
      if (!timedOut) {
        clearTimeout(timeoutHandle);
        console.error(`[PdfQueue] ❌ Failed task "${task.description}":`, err.message);
        telegram.sendPdfWorkerAlert(task.description, err.message || 'Ошибка генератора PDF').catch(() => {});
        this.totalFailed++;
        this.currentRunningDescriptions.delete(task.key);
        this.activeCount = Math.max(0, this.activeCount - 1);
        task.reject(err);
        this.processNext();
      }
    }
  }
}

// Global singleton queue instance (max concurrency: 2 by default or from env)
const concurrencyLimit = parseInt(process.env.PDF_CONCURRENCY || '2', 10) || 2;
export const pdfQueue = new PdfGenerationQueue(concurrencyLimit);
