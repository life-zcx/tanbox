import https from 'https';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { prisma } from '../config/db';
import { pdfQueue } from './pdfQueue.service';
import { createDatabaseBackup } from './backup.service';
import { isMaintenanceActive, getMaintenanceMessage } from './maintenance.service';

interface TelegramSendOptions {
  replyMarkup?: any;
  disableWebPagePreview?: boolean;
}

class TelegramService {
  private botToken: string | undefined;
  private leadsChatId: string | undefined;
  private alertsChatId: string | undefined;

  // In-memory deduplication cache for error alerts (avoids Telegram 429 rate limits & chat flooding)
  private errorDeduplicationMap = new Map<string, { lastSent: number; count: number }>();
  private readonly DEDUPLICATION_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  private isPolling = false;
  private lastUpdateId = 0;

  constructor() {
    this.reloadConfig();
  }

  public reloadConfig() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.leadsChatId = process.env.TELEGRAM_LEADS_CHAT_ID;
    this.alertsChatId = process.env.TELEGRAM_ALERTS_CHAT_ID;
  }

  /**
   * Регистрация команд в меню Telegram бота (только для групп)
   */
  public async registerCommands() {
    if (!this.botToken) return;

    // Delete menu in private chats
    const delPayload = JSON.stringify({ scope: { type: 'all_private_chats' } });
    await new Promise<void>((resolve) => {
      const req = https.request(
        {
          hostname: 'api.telegram.org',
          port: 443,
          path: `/bot${this.botToken}/deleteMyCommands`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(delPayload),
          },
          timeout: 5000,
        },
        () => resolve()
      );
      req.on('error', () => resolve());
      req.write(delPayload);
      req.end();
    });

    // Set commands only in group chats
    const groupPayload = JSON.stringify({
      scope: { type: 'all_group_chats' },
      commands: [
        { command: 'help', description: 'Справка и список всех команд' },
        { command: 'server', description: 'Загрузка сервера (CPU, RAM, БД)' },
        { command: 'backup', description: 'Скачать свежий бэкап БД (.sql файл)' },
        { command: 'today', description: 'Сводка за сегодня (заявки, заказы)' },
        { command: 'status', description: 'Быстрый статус доступности узлов' },
        { command: 'errors', description: 'Последние ошибки бэкенда' },
        { command: 'maintenance', description: 'Статус режима техработ' },
        { command: 'id', description: 'Узнать Telegram ID группы' },
      ],
    });

    return new Promise<void>((resolve) => {
      const req = https.request(
        {
          hostname: 'api.telegram.org',
          port: 443,
          path: `/bot${this.botToken}/setMyCommands`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(groupPayload),
          },
          timeout: 5000,
        },
        () => resolve()
      );
      req.on('error', () => resolve());
      req.write(groupPayload);
      req.end();
    });
  }

  /**
   * Запуск фонового прослушивания команд Telegram (Long Polling)
   */
  public startPolling() {
    if (!this.botToken || this.isPolling) return;
    this.isPolling = true;
    this.registerCommands().catch(() => {});
    logger.info('🤖 Telegram Bot command listener started (Long Polling active)');
    this.pollLoop();
  }

  private async pollLoop() {
    while (this.isPolling) {
      try {
        await this.fetchUpdates();
      } catch (err) {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }

  private fetchUpdates(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.botToken) return resolve();

      const path = `/bot${this.botToken}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=15`;
      const req = https.request(
        {
          hostname: 'api.telegram.org',
          port: 443,
          path,
          method: 'GET',
          timeout: 20000,
        },
        (res) => {
          let body = '';
          res.on('data', (c) => (body += c));
          res.on('end', async () => {
            if (res.statusCode === 200) {
              try {
                const data = JSON.parse(body);
                if (data.ok && Array.isArray(data.result)) {
                  for (const update of data.result) {
                    if (update.update_id) {
                      this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);
                    }
                    if (update.message) {
                      await this.processIncomingMessage(update.message);
                    }
                  }
                }
              } catch {}
            }
            resolve();
          });
        }
      );

      req.on('error', () => resolve());
      req.on('timeout', () => {
        req.destroy();
        resolve();
      });
      req.end();
    });
  }

  private isAuthorizedUser(chatId: string, fromId: string): boolean {
    // 1. Group checks: authorized inside private DevOps / Alerts or Leads group
    if (this.alertsChatId && chatId === this.alertsChatId) return true;
    if (this.leadsChatId && chatId === this.leadsChatId) return true;

    // 2. Specific authorized Telegram user IDs
    const adminIds = (process.env.TELEGRAM_ADMIN_IDS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (adminIds.includes(fromId) || adminIds.includes(chatId)) {
      return true;
    }

    return false;
  }

  private async processIncomingMessage(msg: any) {
    const rawText = msg.text?.trim() || '';
    if (!rawText.startsWith('/')) return;

    // 1. СТРОГИЙ ЗАПРЕТ: в личных сообщениях бот не отвечает никому (полный игнор)
    if (msg.chat?.type === 'private') {
      return;
    }

    const chatId = String(msg.chat?.id);
    const fromId = String(msg.from?.id);
    const command = rawText.split(' ')[0].toLowerCase().split('@')[0];

    // 2. В группах бот отвечает ТОЛЬКО в авторизованных рабочих каналах TANBOX
    const isAuthorizedGroup =
      (this.alertsChatId && chatId === this.alertsChatId) ||
      (this.leadsChatId && chatId === this.leadsChatId);

    if (!isAuthorizedGroup) {
      // Чужая группа — бот игнорирует сообщения
      return;
    }

    // Внутри рабочего чата доступны команды
    if (command === '/id') {
      const idText = [
        `🆔 <b>Информация о группе:</b>`,
        `──────────────────────────────`,
        `• <b>ID этой группы:</b> <code>${chatId}</code>`,
        `• <b>Ваш User ID:</b> <code>${fromId}</code>`,
        `• <b>Название:</b> <b>${this.escapeHtml(msg.chat?.title || 'Группа TANBOX')}</b>`,
        `──────────────────────────────`,
      ].join('\n');
      await this.sendRaw(chatId, idText);
      return;
    }

    if (command === '/help' || command === '/start') {
      const helpText = [
        `🤖 <b>TANBOX.KZ Bot — Справка по командам</b>`,
        `──────────────────────────────`,
        `Бот интегрирован с B2B платформой маркировки <b>TANBOX.KZ</b>.`,
        ``,
        `📋 <b>Доступные команды в этой группе:</b>`,
        ``,
        `⚙️ <b>Сервер & Инфраструктура:</b>`,
        `• /server — Загрузка сервера (CPU, RAM, Uptime, БД)`,
        `• /backup — Создать и скачать бэкап базы данных (.sql прямо в чат)`,
        `• /status — Быстрая проверка доступности всех узлов`,
        `• /errors — Последние ошибки в системе`,
        ``,
        `📊 <b>Бизнес & Заказы:</b>`,
        `• /today — Сводка за сегодня (новые заявки, заказы, выручка)`,
        `• /maintenance — Статус режима техработ платформы`,
        `• /id — Узнать Telegram ID текущей группы`,
        `──────────────────────────────`,
        `🟢 <i>Доступ разрешён (рабочая группа TANBOX)</i>`,
        `⏰ <i>${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' })} (Алматы)</i>`,
      ].join('\n');

      await this.sendRaw(chatId, helpText);
      return;
    }

    if (command === '/server' || command === '/stats') {
      try {
        const memUsage = process.memoryUsage();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const ramUsagePercent = Math.round((usedMem / totalMem) * 100);
        const cpus = os.cpus();
        const cpuModel = cpus.length > 0 ? cpus[0].model : 'CPU';
        const loadAvg = os.loadavg().map((l) => l.toFixed(2)).join(', ');

        let dbStatus = 'Подключена ✅';
        let dbPingMs = 0;
        let dbSize = '—';
        let dbConnections = 0;

        try {
          const t0 = Date.now();
          await prisma.$queryRaw`SELECT 1 as ping`;
          dbPingMs = Date.now() - t0;
          const [sizeRes, connRes]: [any, any] = await Promise.all([
            prisma.$queryRawUnsafe(`SELECT pg_size_pretty(pg_database_size(current_database())) as size`),
            prisma.$queryRawUnsafe(`SELECT count(*)::int as count FROM pg_stat_activity WHERE datname = current_database()`),
          ]);
          if (Array.isArray(sizeRes) && sizeRes[0]?.size) dbSize = sizeRes[0].size;
          if (Array.isArray(connRes) && connRes[0]?.count) dbConnections = connRes[0].count;
        } catch {
          dbStatus = 'Ошибка подключения ❌';
        }

        const queueStats = pdfQueue.getStats();

        const serverUptimeHours = Math.floor(os.uptime() / 3600);
        const serverUptimeDays = Math.floor(serverUptimeHours / 24);
        const appUptimeHours = Math.floor(process.uptime() / 3600);
        const appUptimeMins = Math.floor((process.uptime() % 3600) / 60);

        const serverText = [
          `🖥 <b>Загруженность сервера TANBOX:</b>`,
          `──────────────────────────────`,
          `⚙️ <b>Процессор (CPU):</b>`,
          `• Модель: ${cpuModel}`,
          `• Ядер: ${cpus.length} | Load Avg: <code>${loadAvg}</code>`,
          ``,
          `🧠 <b>Оперативная память (RAM):</b>`,
          `• Занято: <b>${Math.round(usedMem / (1024 * 1024))} MB</b> из <b>${Math.round(totalMem / (1024 * 1024))} MB</b> (${ramUsagePercent}%)`,
          `• Свободно: ${Math.round(freeMem / (1024 * 1024))} MB`,
          `• Процесс Node.js: RSS ${Math.round(memUsage.rss / (1024 * 1024))} MB | Heap ${Math.round(memUsage.heapUsed / (1024 * 1024))} MB`,
          ``,
          `🗄 <b>База данных (PostgreSQL):</b>`,
          `• Статус: ${dbStatus} (${dbPingMs} ms)`,
          `• Размер БД: <b>${dbSize}</b>`,
          `• Активных подключений: <b>${dbConnections}</b>`,
          ``,
          `📄 <b>Очередь этикеток (PDF):</b>`,
          `• В очереди: ${queueStats.waitingJobs} | В обработке: ${queueStats.activeJobs}`,
          ``,
          `⏱ <b>Аптайм:</b>`,
          `• Сервер: ${serverUptimeDays} дн. ${serverUptimeHours % 24} ч.`,
          `• Бэкенд: ${appUptimeHours} ч. ${appUptimeMins} мин.`,
          `──────────────────────────────`,
          `⏰ <i>${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' })} (Алматы)</i>`,
        ].join('\n');

        await this.sendRaw(chatId, serverText);
      } catch (err: any) {
        await this.sendRaw(chatId, `❌ Не удалось получить телеметрию сервера: ${this.escapeHtml(err.message)}`);
      }
    } else if (command === '/backup') {
      try {
        await this.sendRaw(chatId, `⏳ <b>Создаю свежий дамп базы данных TANBOX...</b>\n<i>Пожалуйста, подождите несколько секунд.</i>`);
        const backup = await createDatabaseBackup();
        const caption = [
          `💾 <b>Резервная копия базы данных TANBOX</b>`,
          `──────────────────────────────`,
          `📦 <b>Файл:</b> <code>${backup.fileName}</code>`,
          `📊 <b>Размер:</b> <b>${backup.sizeFormatted}</b>`,
          `⏰ <b>Создан:</b> ${new Date(backup.createdAt).toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' })} (Алматы)`,
        ].join('\n');

        const success = await this.sendDocument(chatId, backup.filePath, caption);
        if (!success) {
          await this.sendRaw(chatId, `⚠️ Бэкап создан (<code>${backup.fileName}</code>, ${backup.sizeFormatted}), но произошла ошибка при передаче файла в Telegram.`);
        }
      } catch (err: any) {
        logger.error('Failed to create/send backup via Telegram:', err);
        await this.sendRaw(chatId, `❌ Ошибка при создании бэкапа: ${this.escapeHtml(err.message)}`);
      }
    } else if (command === '/today' || command === '/orders') {
      try {
        const now = new Date();
        const nowAlmaty = new Date(now.getTime() + 5 * 3600 * 1000);
        const startOfTodayUtc = new Date(Date.UTC(nowAlmaty.getUTCFullYear(), nowAlmaty.getUTCMonth(), nowAlmaty.getUTCDate(), 0, 0, 0) - 5 * 3600 * 1000);

        const [
          leadsToday,
          leadsTotal,
          ordersToday,
          ordersTotalCount,
          usersToday,
          usersTotal,
        ] = await Promise.all([
          prisma.serviceLead.count({ where: { createdAt: { gte: startOfTodayUtc } } }),
          prisma.serviceLead.count(),
          prisma.order.findMany({
            where: { createdAt: { gte: startOfTodayUtc } },
            select: { status: true, totalPrice: true },
          }),
          prisma.order.count(),
          prisma.user.count({ where: { createdAt: { gte: startOfTodayUtc } } }),
          prisma.user.count(),
        ]);

        const ordersTodayCount = ordersToday.length;
        const revenueToday = ordersToday.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);

        const statusCounts: Record<string, number> = {};
        for (const o of ordersToday) {
          statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
        }

        const todayText = [
          `📊 <b>Сводка за сегодня (TANBOX.KZ):</b>`,
          `──────────────────────────────`,
          `📥 <b>Заявки с лендинга:</b>`,
          `• Сегодня: <b>+${leadsToday}</b> шт. (Всего в базе: ${leadsTotal})`,
          ``,
          `📦 <b>Заказы маркировки:</b>`,
          `• Сегодня: <b>+${ordersTodayCount}</b> шт. на сумму <b>${revenueToday.toLocaleString('ru-RU')} ₸</b>`,
          `• Всего заказов за всё время: ${ordersTotalCount}`,
          ordersTodayCount > 0 ? `• Статусы сегодня: ` + Object.entries(statusCounts).map(([k, v]) => `${k}: ${v}`).join(', ') : '',
          ``,
          `👥 <b>Клиенты (пользователи):</b>`,
          `• Регистраций сегодня: <b>+${usersToday}</b>`,
          `• Всего зарегистрировано: <b>${usersTotal}</b>`,
          `──────────────────────────────`,
          `⏰ <i>${now.toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' })} (Алматы)</i>`,
        ].filter(Boolean).join('\n');

        await this.sendRaw(chatId, todayText);
      } catch (err: any) {
        await this.sendRaw(chatId, `❌ Ошибка формирования сводки: ${this.escapeHtml(err.message)}`);
      }
    } else if (command === '/errors') {
      try {
        const errorLogPath = path.resolve(process.cwd(), 'logs/error.log');
        if (!fs.existsSync(errorLogPath)) {
          await this.sendRaw(chatId, `✅ <b>Лог ошибок пуст.</b> Критических сбоев не зафиксировано.`);
          return;
        }
        const content = await fs.promises.readFile(errorLogPath, 'utf8');
        const lines = content.trim().split('\n').filter(Boolean);
        const lastLines = lines.slice(-5);
        if (lastLines.length === 0) {
          await this.sendRaw(chatId, `✅ <b>Лог ошибок пуст.</b> Критических сбоев не зафиксировано.`);
          return;
        }

        const formattedErrors = lastLines.map((line, idx) => {
          let text = line;
          try {
            const parsed = JSON.parse(line);
            text = `<b>[${parsed.timestamp || '—'}]</b> ${this.escapeHtml(parsed.message || line)}`;
            if (parsed.meta?.url) text += `\n   <code>${this.escapeHtml(parsed.meta.url)}</code>`;
          } catch {
            text = `<code>${this.escapeHtml(line.slice(0, 150))}</code>`;
          }
          return `${idx + 1}. ${text}`;
        }).join('\n\n');

        const errorsMsg = [
          `⚠️ <b>Последние ошибки в системе:</b>`,
          `──────────────────────────────`,
          formattedErrors,
          `──────────────────────────────`,
          `⏰ <i>${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' })} (Алматы)</i>`,
        ].join('\n');

        await this.sendRaw(chatId, errorsMsg);
      } catch (err: any) {
        await this.sendRaw(chatId, `❌ Ошибка чтения логов: ${this.escapeHtml(err.message)}`);
      }
    } else if (command === '/maintenance') {
      const active = isMaintenanceActive();
      const text = [
        `🛠 <b>Режим технического обслуживания:</b>`,
        `──────────────────────────────`,
        `• <b>Статус:</b> ${active ? '🔴 ВКЛЮЧЕН (сайт временно закрыт для клиентов)' : '🟢 ВЫКЛЮЧЕН (платформа работает в штатном режиме)'}`,
        `• <b>Сообщение для клиентов:</b>`,
        `  <i>«${this.escapeHtml(getMaintenanceMessage())}»</i>`,
        `──────────────────────────────`,
        `<i>Управление режимом доступно в панели администратора (Раздел «Система»).</i>`,
      ].join('\n');
      await this.sendRaw(chatId, text);
    } else if (command === '/status') {
      const statusText = [
        `📊 <b>Текущий статус платформы TANBOX:</b>`,
        `──────────────────────────────`,
        `• <b>API Бэкенд:</b> Работает в штатном режиме ✅`,
        `• <b>База данных (PostgreSQL):</b> Подключена ✅`,
        `• <b>Канал 1 (Заявки):</b> ${this.leadsChatId ? 'Подключен ✅' : 'Не настроен ❌'}`,
        `• <b>Канал 2 (DevOps):</b> ${this.alertsChatId ? 'Подключен ✅' : 'Не настроен ❌'}`,
        `──────────────────────────────`,
        `⏰ <i>${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' })} (Алматы)</i>`,
      ].join('\n');

      await this.sendRaw(chatId, statusText);
    } else if (command === '/chats') {
      const chatsText = [
        `📢 <b>Подключенные каналы:</b>`,
        `• Канал заявок и заказов: ${this.leadsChatId ? 'Подключен ✅' : 'Отключен ❌'}`,
        `• Канал DevOps и ошибок: ${this.alertsChatId ? 'Подключен ✅' : 'Отключен ❌'}`,
        ``,
        `💡 <i>Используйте /server для мониторинга сервера или /backup для скачивания бэкапа базы.</i>`,
      ].join('\n');

      await this.sendRaw(chatId, chatsText);
    } else if (command === '/id') {
      const idText = [
        `🆔 <b>Информация о чате:</b>`,
        `──────────────────────────────`,
        `• <b>ID этого чата:</b> <code>${chatId}</code>`,
        `• <b>Ваш User ID:</b> <code>${fromId}</code>`,
        `• <b>Тип чата:</b> <code>${msg.chat?.type || 'private'}</code>`,
        `──────────────────────────────`,
      ].join('\n');

      await this.sendRaw(chatId, idText);
    }
  }

  /**
   * Отправка документа в Telegram чат (например, дамп базы данных .sql)
   */
  public async sendDocument(
    chatId: string,
    filePath: string,
    caption?: string
  ): Promise<boolean> {
    if (!this.botToken || !chatId) return false;
    try {
      if (!fs.existsSync(filePath)) {
        logger.error(`File for Telegram sendDocument not found: ${filePath}`);
        return false;
      }
      const fileBuffer = await fs.promises.readFile(filePath);
      const fileName = path.basename(filePath);
      const formData = new FormData();
      formData.append('chat_id', chatId);
      if (caption) {
        formData.append('caption', caption);
        formData.append('parse_mode', 'HTML');
      }
      formData.append('document', new Blob([fileBuffer]), fileName);

      const res = await fetch(`https://api.telegram.org/bot${this.botToken}/sendDocument`, {
        method: 'POST',
        body: formData,
      });
      const data: any = await res.json();
      if (!data?.ok) {
        logger.error('Telegram sendDocument API error:', data);
        return false;
      }
      return true;
    } catch (err: any) {
      logger.error('Failed to send document via Telegram:', err);
      return false;
    }
  }

  public isConfigured(): boolean {
    return Boolean(this.botToken);
  }

  private escapeHtml(text?: string | null): string {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Internal low-level HTTPS dispatcher to Telegram Bot API.
   * Completely asynchronous fire-and-forget to never block client requests.
   */
  private sendRaw(chatId: string, textHtml: string, options?: TelegramSendOptions): Promise<void> {
    return new Promise((resolve) => {
      if (!this.botToken || !chatId) {
        return resolve();
      }

      const payload = JSON.stringify({
        chat_id: chatId,
        text: textHtml,
        parse_mode: 'HTML',
        disable_web_page_preview: options?.disableWebPagePreview ?? true,
        reply_markup: options?.replyMarkup,
      });

      const req = https.request(
        {
          hostname: 'api.telegram.org',
          port: 443,
          path: `/bot${this.botToken}/sendMessage`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
          timeout: 7000,
        },
        (res) => {
          let body = '';
          res.on('data', (c) => (body += c));
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 400) {
              console.warn(`[TelegramService] Warning: Telegram API responded with ${res.statusCode}: ${body.slice(0, 150)}`);
            }
            resolve();
          });
        }
      );

      req.on('error', (err) => {
        console.warn('[TelegramService] Network error sending notification:', err.message);
        resolve(); // Never reject to avoid unhandled rejections
      });

      req.on('timeout', () => {
        req.destroy();
        resolve();
      });

      req.write(payload);
      req.end();
    });
  }

  // ============================================================================
  // ЧАТ 1: ЗАЯВКИ, ЛИДЫ И ЗАКАЗЫ (Бизнес / Отдел продаж)
  // ============================================================================

  /**
   * Уведомление о новой заявке на услугу с лендинга
   */
  public async sendNewLeadNotification(lead: {
    id: string;
    serviceTitle: string;
    companyName: string;
    phone: string;
    email?: string | null;
    binIin?: string | null;
    notes?: string | null;
  }) {
    if (!this.leadsChatId) return;

    const msg = [
      `📥 <b>НОВАЯ ЗАЯВКА НА УСЛУГУ</b>`,
      `──────────────────────────────`,
      `🏷️ <b>Услуга:</b> ${this.escapeHtml(lead.serviceTitle)}`,
      `🏢 <b>Компания:</b> ${this.escapeHtml(lead.companyName)}`,
      `📞 <b>Телефон:</b> <code>${this.escapeHtml(lead.phone)}</code>`,
      lead.email ? `✉️ <b>Email:</b> ${this.escapeHtml(lead.email)}` : null,
      lead.binIin ? `🔢 <b>БИН/ИИН:</b> <code>${this.escapeHtml(lead.binIin)}</code>` : null,
      lead.notes ? `📝 <b>Примечание:</b> <i>${this.escapeHtml(lead.notes)}</i>` : null,
      `──────────────────────────────`,
      `⏰ <i>${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' })} (Алматы)</i>`,
    ]
      .filter(Boolean)
      .join('\n');

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '🌐 Открыть в админ-панели',
            url: `https://admin.tanbox.kz/leads`,
          },
        ],
      ],
    };

    await this.sendRaw(this.leadsChatId, msg, { replyMarkup: keyboard });
  }

  /**
   * Уведомление о новом оформленном заказе из кабинета клиента (ЛК)
   */
  public async sendNewOrderNotification(order: {
    id: string;
    orderNumber: string;
    category: string;
    tariffType: string;
    itemsCount: number;
    pricePerItem: any;
    totalPrice: any;
    warehouseAddress?: string | null;
    notes?: string | null;
    extraServices?: string[];
    user?: {
      companyName?: string;
      binIin?: string;
      email?: string;
      phone?: string;
    };
  }) {
    if (!this.leadsChatId) return;

    const formattedTotal = Number(order.totalPrice || 0).toLocaleString('ru-RU');
    const formattedUnit = Number(order.pricePerItem || 0).toLocaleString('ru-RU');

    const msg = [
      `🛒 <b>НОВЫЙ ЗАКАЗ: #${this.escapeHtml(order.orderNumber)}</b>`,
      `──────────────────────────────`,
      `🏢 <b>Клиент:</b> ${this.escapeHtml(order.user?.companyName || 'Не указан')}`,
      `🔢 <b>БИН/ИИН:</b> <code>${this.escapeHtml(order.user?.binIin || '—')}</code>`,
      `📞 <b>Телефон:</b> <code>${this.escapeHtml(order.user?.phone || '—')}</code>`,
      `📦 <b>Категория:</b> ${this.escapeHtml(order.category)}`,
      `⭐ <b>Тариф:</b> ${this.escapeHtml(order.tariffType)}`,
      `📊 <b>Количество:</b> <b>${order.itemsCount.toLocaleString('ru-RU')} шт.</b> (${formattedUnit} ₸/шт)`,
      `💰 <b>Итоговая сумма:</b> <b>${formattedTotal} ₸</b>`,
      order.warehouseAddress ? `📍 <b>Склад в РК:</b> ${this.escapeHtml(order.warehouseAddress)}` : null,
      order.notes ? `📝 <b>Примечание:</b> <i>${this.escapeHtml(order.notes)}</i>` : null,
      `──────────────────────────────`,
      `⏰ <i>${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' })} (Алматы)</i>`,
    ]
      .filter(Boolean)
      .join('\n');

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '🔍 Перейти к заказу в админке',
            url: `https://admin.tanbox.kz/orders/${order.id}`,
          },
        ],
      ],
    };

    await this.sendRaw(this.leadsChatId, msg, { replyMarkup: keyboard });
  }

  /**
   * Уведомление о согласовании / правках макета этикетки клиентом
   */
  public async sendStickerApprovalNotification(data: {
    orderNumber: string;
    orderId: string;
    status: 'APPROVED' | 'CHANGES_REQUESTED';
    companyName?: string;
    notes?: string | null;
  }) {
    if (!this.leadsChatId) return;

    const isApproved = data.status === 'APPROVED';
    const statusText = isApproved
      ? '✅ <b>МАКЕТ УТВЕРЖДЕН КЛИЕНТОМ</b>'
      : '✏️ <b>КЛИЕНТ ЗАПРОСИЛ ПРАВКИ В МАКЕТ</b>';

    const msg = [
      statusText,
      `──────────────────────────────`,
      `📦 <b>Заказ:</b> #${this.escapeHtml(data.orderNumber)}`,
      `🏢 <b>Компания:</b> ${this.escapeHtml(data.companyName || 'Клиент')}`,
      data.notes ? `💬 <b>Комментарий клиента:</b> <i>${this.escapeHtml(data.notes)}</i>` : null,
      isApproved
        ? `🖨️ <i>Заказ готов к запуску в очередь печати!</i>`
        : `🎨 <i>Дизайнеру необходимо внести корректировки в макет.</i>`,
      `──────────────────────────────`,
    ]
      .filter(Boolean)
      .join('\n');

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '📄 Открыть карточку заказа',
            url: `https://admin.tanbox.kz/orders/${data.orderId}`,
          },
        ],
      ],
    };

    await this.sendRaw(this.leadsChatId, msg, { replyMarkup: keyboard });
  }

  // ============================================================================
  // ЧАТ 2: DEVOPS, ОШИБКИ И МОНИТОРИНГ СЕРВЕРА (DevOps / Технический отдел)
  // ============================================================================

  /**
   * Оповещение о критической ошибке сервера (500, unhandled exceptions)
   */
  public async sendServerErrorAlert(data: {
    method?: string;
    url?: string;
    statusCode?: number;
    error: any;
    ip?: string;
    userId?: string;
  }) {
    if (!this.alertsChatId) return;

    const errMsg = data.error instanceof Error ? data.error.message : String(data.error);
    const errStack = data.error instanceof Error && data.error.stack ? data.error.stack.split('\n').slice(0, 4).join('\n') : '';

    // Error deduplication check
    const dedupKey = `${data.method}_${data.url}_${errMsg.slice(0, 100)}`;
    const now = Date.now();
    const existing = this.errorDeduplicationMap.get(dedupKey);

    if (existing && now - existing.lastSent < this.DEDUPLICATION_INTERVAL_MS) {
      existing.count++;
      return; // Suppress duplicate flood
    }

    const repeatNote = existing && existing.count > 1 ? ` <i>(повторилась ${existing.count} раз за 5 минут)</i>` : '';
    this.errorDeduplicationMap.set(dedupKey, { lastSent: now, count: 1 });

    const msg = [
      `🚨 <b>КРИТИЧЕСКАЯ ОШИБКА СЕРВЕРА (HTTP ${data.statusCode || 500})</b>${repeatNote}`,
      `──────────────────────────────`,
      `🌐 <b>Маршрут:</b> <code>${this.escapeHtml(data.method)} ${this.escapeHtml(data.url)}</code>`,
      data.ip ? `🌍 <b>Клиент IP:</b> <code>${this.escapeHtml(data.ip)}</code>` : null,
      data.userId ? `👤 <b>User ID:</b> <code>${this.escapeHtml(data.userId)}</code>` : null,
      `⚠️ <b>Ошибка:</b> <code>${this.escapeHtml(errMsg.slice(0, 500))}</code>`,
      errStack ? `<pre>${this.escapeHtml(errStack.slice(0, 400))}</pre>` : null,
      `──────────────────────────────`,
      `⏰ <i>${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' })}</i>`,
    ]
      .filter(Boolean)
      .join('\n');

    await this.sendRaw(this.alertsChatId, msg);
  }

  /**
   * Оповещение о сбое базы данных / исчерпании пула соединений
   */
  public async sendDatabaseAlert(message: string, details?: any) {
    if (!this.alertsChatId) return;

    const msg = [
      `🛑 <b>СБОЙ БАЗЫ ДАННЫХ (PostgreSQL)</b>`,
      `──────────────────────────────`,
      `⚠️ <b>Проблема:</b> ${this.escapeHtml(message)}`,
      details ? `<pre>${this.escapeHtml(JSON.stringify(details, null, 2).slice(0, 400))}</pre>` : null,
      `──────────────────────────────`,
      `⏰ <i>${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' })}</i>`,
    ]
      .filter(Boolean)
      .join('\n');

    await this.sendRaw(this.alertsChatId, msg);
  }

  /**
   * Оповещение о сбое очереди генерации этикеток / таймаутах PDF
   */
  public async sendPdfWorkerAlert(taskDesc: string, errorMessage: string) {
    if (!this.alertsChatId) return;

    const msg = [
      `⚠️ <b>СБОЙ ОЧЕРЕДИ ПЕЧАТИ / PDF GENERATOR</b>`,
      `──────────────────────────────`,
      `📄 <b>Задача:</b> ${this.escapeHtml(taskDesc)}`,
      `❌ <b>Причина:</b> <code>${this.escapeHtml(errorMessage)}</code>`,
      `──────────────────────────────`,
      `⏰ <i>${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' })}</i>`,
    ].join('\n');

    await this.sendRaw(this.alertsChatId, msg);
  }

  /**
   * Оповещение о готовности партии PDF этикеток для клиента / менеджера
   */
  public async sendPdfReadyNotification(
    orderNumber: string,
    count: number,
    sizeMb: number,
    clientChatId?: string
  ) {
    const msg = [
      `✅ <b>ПАРТИЯ ЭТИКЕТОК ГОТОВА К СКАЧИВАНИЮ!</b>`,
      `──────────────────────────────`,
      `📦 <b>Заказ:</b> <code>${this.escapeHtml(orderNumber)}</code>`,
      `🏷️ <b>Количество кодов:</b> ${count.toLocaleString('ru-RU')} шт.`,
      `💾 <b>Размер файла:</b> ${sizeMb} МБ`,
      `──────────────────────────────`,
      `🚀 <i>Файл сгенерирован и сохранён на сервере. Скачивание доступно в личном кабинете.</i>`,
      `⏰ <i>${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' })} (Алматы)</i>`,
    ].join('\n');

    if (clientChatId) {
      await this.sendRaw(clientChatId, msg).catch(() => {});
    }
    if (this.leadsChatId) {
      await this.sendRaw(this.leadsChatId, msg).catch(() => {});
    }
  }

  /**
   * Оповещение о критической ошибке JavaScript на фронтенде
   */
  public async sendFrontendTelemetryAlert(errorData: {
    message: string;
    url?: string;
    userAgent?: string;
    clientIp?: string;
  }) {
    if (!this.alertsChatId) return;

    // Deduplication key
    const dedupKey = `frontend_${errorData.message.slice(0, 100)}`;
    const now = Date.now();
    const existing = this.errorDeduplicationMap.get(dedupKey);
    if (existing && now - existing.lastSent < this.DEDUPLICATION_INTERVAL_MS) {
      existing.count++;
      return;
    }
    this.errorDeduplicationMap.set(dedupKey, { lastSent: now, count: 1 });

    const msg = [
      `📱 <b>ОШИБКА ФРОНТЕНДА У КЛИЕНТА (JS Error)</b>`,
      `──────────────────────────────`,
      `❌ <b>Ошибка:</b> <code>${this.escapeHtml(errorData.message.slice(0, 300))}</code>`,
      errorData.url ? `🔗 <b>Страница:</b> <code>${this.escapeHtml(errorData.url)}</code>` : null,
      errorData.clientIp ? `🌍 <b>IP:</b> <code>${this.escapeHtml(errorData.clientIp)}</code>` : null,
      `──────────────────────────────`,
      `⏰ <i>${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' })}</i>`,
    ]
      .filter(Boolean)
      .join('\n');

    await this.sendRaw(this.alertsChatId, msg);
  }

  /**
   * Прямое тестовое или системное оповещение в DevOps группу
   */
  public async sendDevOpsAlert(title: string, details?: Record<string, any>) {
    if (!this.alertsChatId) return;

    const msg = [
      `🛠 <b>${this.escapeHtml(title)}</b>`,
      `──────────────────────────────`,
      details
        ? Object.entries(details)
            .map(([k, v]) => `• <b>${this.escapeHtml(k)}:</b> <code>${this.escapeHtml(String(v))}</code>`)
            .join('\n')
        : null,
      `──────────────────────────────`,
      `⏰ <i>${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' })} (Алматы)</i>`,
    ]
      .filter(Boolean)
      .join('\n');

    await this.sendRaw(this.alertsChatId, msg);
  }
}

export const telegram = new TelegramService();
