import https from 'https';
import crypto from 'crypto';
import { prisma } from '../config/db';
import { logger } from '../utils/logger';

interface TelegramSendOptions {
  replyMarkup?: any;
  disableWebPagePreview?: boolean;
}

interface StatusMeta {
  label: string;
  emoji: string;
  desc: string;
}

export const TARIFF_NAMES: Record<string, string> = {
  DIGITAL: 'Цифровой',
  PRINT: 'Печатный',
  STANDARD: 'Стандарт',
  PRO: 'PRO Склад',
};

export const TARIFF_STATUS_CONFIG: Record<string, Record<string, StatusMeta>> = {
  DIGITAL: {
    NEW: { label: 'Создан', emoji: '🆕', desc: 'Файл кодов проверен и принят в работу' },
    PROCESSING: { label: 'В обработке', emoji: '⏳', desc: 'Сверка кодов и товарных реквизитов' },
    PRINTING: { label: 'Генерация кодов', emoji: '⚡', desc: 'Вёрстка цифровых макетов Data Matrix' },
    STICKERING: { label: 'Формирование файлов', emoji: '📂', desc: 'Подготовка PDF рулонов и CSV файлов' },
    COMPLETED: { label: 'Готов к выгрузке', emoji: '✅', desc: 'Файлы готовы и доступны для скачивания в ЛК' },
    CANCELLED: { label: 'Отменен', emoji: '❌', desc: 'Заказ был отменен' },
  },
  PRINT: {
    NEW: { label: 'Создан', emoji: '🆕', desc: 'Файл кодов проверен и принят в работу' },
    PROCESSING: { label: 'В обработке', emoji: '⏳', desc: 'Подготовка макета к печати на производстве' },
    PRINTING: { label: 'Печать рулонов', emoji: '🖨️', desc: 'Идет термотрансферная печать этикеток партии' },
    STICKERING: { label: 'Упаковка партии', emoji: '📦', desc: 'Контроль качества и упаковка рулонов' },
    COMPLETED: { label: 'Готов к выдаче', emoji: '🎉', desc: 'Рулоны с этикетками готовы к отгрузке' },
    CANCELLED: { label: 'Отменен', emoji: '❌', desc: 'Заказ был отменен' },
  },
  STANDARD: {
    NEW: { label: 'Создан', emoji: '🆕', desc: 'Файл кодов проверен и принят в работу' },
    PROCESSING: { label: 'В обработке', emoji: '⏳', desc: 'Подготовка макета и планирование выезда специалистов' },
    PRINTING: { label: 'Печать этикеток', emoji: '🖨️', desc: 'Печать этикеток партии на производстве' },
    STICKERING: { label: 'Стикеровка на складе', emoji: '🏷️', desc: 'Оклейка товаров маркировкой на складе' },
    COMPLETED: { label: 'Выполнен', emoji: '✅', desc: 'Партия полностью маркирована и сдана в Танба' },
    CANCELLED: { label: 'Отменен', emoji: '❌', desc: 'Заказ был отменен' },
  },
  PRO: {
    NEW: { label: 'Создан', emoji: '🆕', desc: 'Файл кодов проверен и принят в работу' },
    PROCESSING: { label: 'Сверка и приемка', emoji: '📋', desc: 'Приемка партии на складе, сверка артикулов' },
    PRINTING: { label: 'Печать и стикеровка', emoji: '🏷️', desc: 'Маркировка единиц товара этикетками Data Matrix' },
    STICKERING: { label: 'SSCC Агрегация', emoji: '📦', desc: 'Формирование коробов и паллет с SSCC кодами' },
    COMPLETED: { label: 'Выполнен', emoji: '✅', desc: 'Партия агрегирована и введена в оборот в Танба' },
    CANCELLED: { label: 'Отменен', emoji: '❌', desc: 'Заказ был отменен' },
  },
};

export function getStatusForTariff(tariffType: string, status: string): StatusMeta {
  const normTariff = String(tariffType || 'STANDARD').toUpperCase();
  const config = TARIFF_STATUS_CONFIG[normTariff] || TARIFF_STATUS_CONFIG['STANDARD'];
  return config[status] || {
    label: status,
    emoji: '📦',
    desc: 'Статус заказа обновлен',
  };
}

const PAYMENT_STATUS_LABELS: Record<string, { label: string; emoji: string; desc: string }> = {
  UNPAID: { label: 'Ожидает оплаты', emoji: '⏳', desc: 'Счёт выставлен и ожидает оплаты' },
  PAID: { label: 'Оплачен', emoji: '🟢', desc: 'Оплата успешно подтверждена' },
  PARTIAL: { label: 'Частично оплачен', emoji: '🟡', desc: 'Поступила частичная оплата' },
  REFUNDED: { label: 'Возврат средств', emoji: '↩️', desc: 'Произведен возврат средств' },
};

export class ClientTelegramBotService {
  private botToken: string;
  private botUsername: string;
  private isPolling = false;
  private lastUpdateId = 0;

  constructor() {
    this.botToken = (process.env.TELEGRAM_CLIENT_BOT_TOKEN || '').trim();
    this.botUsername =
      (process.env.TELEGRAM_CLIENT_BOT_USERNAME || 'tanboxnotificationsbot').replace('@', '').trim();
  }

  public getBotUsername(): string {
    return this.botUsername;
  }

  /**
   * Отправка запроса к Telegram Bot API
   */
  private async apiRequest(method: string, data: Record<string, any>): Promise<any> {
    if (!this.botToken) return null;

    return new Promise((resolve) => {
      const payload = JSON.stringify(data);
      const req = https.request(
        {
          hostname: 'api.telegram.org',
          port: 443,
          path: `/bot${this.botToken}/${method}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
          timeout: 45000,
        },
        (res) => {
          let responseBody = '';
          res.on('data', (chunk) => {
            responseBody += chunk;
          });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(responseBody);
              resolve(parsed);
            } catch {
              resolve(null);
            }
          });
        }
      );

      req.on('error', (err) => {
        logger.warn(`[Client TG Bot] API request ${method} error: ${err.message}`);
        resolve(null);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });

      req.write(payload);
      req.end();
    });
  }

  /**
   * Отправка форматированного HTML-сообщения конкретному пользователю
   */
  public async sendMessage(chatId: string | number, text: string, options?: TelegramSendOptions): Promise<boolean> {
    const payload: Record<string, any> = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: options?.disableWebPagePreview ?? true,
    };

    if (options?.replyMarkup) {
      payload.reply_markup = options.replyMarkup;
    }

    const res = await this.apiRequest('sendMessage', payload);
    return Boolean(res?.ok);
  }

  /**
   * Генерация уникальной ссылки привязки для пользователя в личном кабинете
   */
  public async generateAuthLink(userId: string): Promise<{ link: string; token: string }> {
    const randomHex = crypto.randomBytes(16).toString('hex');
    const token = `bind_${randomHex}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes TTL

    await (prisma as any).user.update({
      where: { id: userId },
      data: {
        telegramAuthToken: token,
        telegramAuthTokenExpiresAt: expiresAt,
      },
    });

    const link = `https://t.me/${this.botUsername}?start=${token}`;
    return { link, token };
  }

  /**
   * Отвязка Telegram от пользователя
   */
  public async unlinkUser(userId: string): Promise<boolean> {
    await (prisma as any).user.update({
      where: { id: userId },
      data: {
        telegramChatId: null,
        telegramUsername: null,
        telegramAuthToken: null,
        telegramLinkedAt: null,
      },
    });
    return true;
  }

  /**
   * Уведомление об изменении статуса заказа (с учетом выбранного тарифа)
   */
  public async notifyOrderStatusChanged(orderId: string, newStatus: string, comment?: string): Promise<void> {
    try {
      const order = await (prisma as any).order.findUnique({
        where: { id: orderId },
        include: { user: true },
      });

      if (!order || !order.user?.telegramChatId) return;

      const tariffName = TARIFF_NAMES[order.tariffType] || order.tariffType;
      const statusInfo = getStatusForTariff(order.tariffType, newStatus);

      const message = [
        `<b>${statusInfo.emoji} Статус заказа #${order.orderNumber} изменён</b>`,
        ``,
        `• Тариф: <b>${tariffName}</b>`,
        `• Текущий этап: <b>${statusInfo.label}</b>`,
        `<i>${statusInfo.desc}</i>`,
        ``,
        `• Кол-во кодов: <b>${order.itemsCount?.toLocaleString('ru-RU') || 0} шт.</b>`,
        `• Сумма: <b>${Number(order.totalPrice || 0).toLocaleString('ru-RU')} ₸</b>`,
        comment ? `\n💬 Комментарий: <i>${comment}</i>` : '',
        ``,
        `🌐 <a href="https://lk.tanbox.kz/orders/${order.id}">Перейти в карточку заказа в ЛК</a>`,
      ].filter(Boolean).join('\n');

      await this.sendMessage(order.user.telegramChatId, message, {
        replyMarkup: {
          inline_keyboard: [
            [{ text: '🔍 Открыть заказ в ЛК', url: `https://lk.tanbox.kz/orders/${order.id}` }],
          ],
        },
      });

      logger.info(`[Client TG Bot] Order #${order.orderNumber} (${tariffName}) status alert sent to user ${order.user.email}`);
    } catch (err: any) {
      logger.error(`[Client TG Bot] Error sending order status alert: ${err.message}`);
    }
  }

  /**
   * Уведомление об изменении статуса согласования макета
   */
  public async notifyStickerApprovalChanged(orderId: string, approvalStatus: string, comment?: string): Promise<void> {
    try {
      const order = await (prisma as any).order.findUnique({
        where: { id: orderId },
        include: { user: true },
      });

      if (!order || !order.user?.telegramChatId) return;

      const tariffName = TARIFF_NAMES[order.tariffType] || order.tariffType;

      let title = '';
      let desc = '';
      let emoji = '🎨';

      if (approvalStatus === 'WAITING_APPROVAL') {
        title = `Макет этикетки по заказу #${order.orderNumber} готов к согласованию!`;
        desc = `Дизайнер подготовил макет. Пожалуйста, откройте заказ в личном кабинете, чтобы проверить и утвердить его.`;
        emoji = '🎨';
      } else if (approvalStatus === 'APPROVED') {
        title = `Макет этикетки по заказу #${order.orderNumber} успешно согласован!`;
        desc = `Макет утверждён клиентом. Заказ переходит к печати партии.`;
        emoji = '✅';
      } else if (approvalStatus === 'CHANGES_REQUESTED') {
        title = `Запрос правок по макету заказа #${order.orderNumber} отправлен дизайнеру`;
        desc = comment ? `Комментарий: "${comment}"` : `Дизайнер внесёт необходимые корректировки.`;
        emoji = '✏️';
      } else {
        return;
      }

      const message = [
        `<b>${emoji} ${title}</b>`,
        ``,
        `• Тариф: <b>${tariffName}</b>`,
        `• Партия: <b>${order.itemsCount?.toLocaleString('ru-RU') || 0} шт.</b>`,
        ``,
        `<i>${desc}</i>`,
        ``,
        `🌐 <a href="https://lk.tanbox.kz/orders/${order.id}">Перейти в карточку заказа в ЛК</a>`,
      ].join('\n');

      await this.sendMessage(order.user.telegramChatId, message, {
        replyMarkup: {
          inline_keyboard: [
            [{ text: '🔍 Посмотреть макет в ЛК', url: `https://lk.tanbox.kz/orders/${order.id}` }],
          ],
        },
      });

      logger.info(`[Client TG Bot] Sticker approval notification (${approvalStatus}) sent for order #${order.orderNumber}`);
    } catch (err: any) {
      logger.error(`[Client TG Bot] Error sending sticker approval alert: ${err.message}`);
    }
  }

  /**
   * Уведомление об изменении статуса оплаты заказа
   */
  public async notifyPaymentStatusChanged(orderId: string, newPaymentStatus: string): Promise<void> {
    try {
      const order = await (prisma as any).order.findUnique({
        where: { id: orderId },
        include: { user: true },
      });

      if (!order || !order.user?.telegramChatId) return;

      const payInfo = PAYMENT_STATUS_LABELS[newPaymentStatus] || {
        label: newPaymentStatus,
        emoji: '💳',
        desc: 'Статус оплаты обновлен',
      };

      const message = [
        `<b>${payInfo.emoji} Оплата по заказу #${order.orderNumber}</b>`,
        ``,
        `Статус оплаты: <b>${payInfo.label}</b>`,
        `<i>${payInfo.desc}</i>`,
        ``,
        `• Сумма к оплате: <b>${Number(order.totalPrice || 0).toLocaleString('ru-RU')} ₸</b>`,
        ``,
        `🌐 <a href="https://lk.tanbox.kz/orders/${order.id}">Подробнее в личном кабинете</a>`,
      ].join('\n');

      await this.sendMessage(order.user.telegramChatId, message, {
        replyMarkup: {
          inline_keyboard: [
            [{ text: '📄 Посмотреть счёт / квитанцию', url: `https://lk.tanbox.kz/orders/${order.id}` }],
          ],
        },
      });

      logger.info(`[Client TG Bot] Order #${order.orderNumber} payment alert sent to user ${order.user.email}`);
    } catch (err: any) {
      logger.error(`[Client TG Bot] Error sending payment alert: ${err.message}`);
    }
  }

  /**
   * Запуск фонового Long-Polling для бота
   */
  public startPolling(): void {
    if (this.isPolling) return;
    if (!this.botToken) {
      logger.warn('[Client TG Bot] TELEGRAM_CLIENT_BOT_TOKEN is not configured in .env. Client notifications bot disabled.');
      return;
    }
    this.isPolling = true;

    logger.info(`[Client TG Bot] Starting client notifications bot @${this.botUsername}...`);
    this.pollLoop();
  }

  private async pollLoop(): Promise<void> {
    while (this.isPolling) {
      try {
        const updates = await this.apiRequest('getUpdates', {
          offset: this.lastUpdateId + 1,
          timeout: 25,
          allowed_updates: ['message', 'callback_query'],
        });

        if (updates && updates.ok && Array.isArray(updates.result)) {
          for (const update of updates.result) {
            this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);
            await this.handleUpdate(update);
          }
        }
      } catch (err: any) {
        logger.warn(`[Client TG Bot] Polling iteration error: ${err.message}`);
        await new Promise((r) => setTimeout(r, 4000));
      }
    }
  }

  /**
   * Обработка входящего события от Telegram
   */
  private async handleUpdate(update: any): Promise<void> {
    const msg = update.message;
    if (!msg || !msg.text) return;

    const text = msg.text.trim();
    const chatId = msg.chat.id;
    const username = msg.from?.username || '';
    const firstName = msg.from?.first_name || 'Клиент';

    // 1. Обработка /start с токеном привязки
    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      const token = parts[1]?.trim();

      if (token && token.startsWith('bind_')) {
        await this.handleAuthToken(chatId, token, username);
        return;
      }

      // /start без токена
      await this.handleStartDefault(chatId, firstName);
      return;
    }

    // 2. Команда /orders (список моих заказов)
    if (text === '/orders' || text === '📦 Мои заказы') {
      await this.handleListOrders(chatId);
      return;
    }

    // 3. Команда /unlink (отвязать аккаунт)
    if (text === '/unlink' || text === '❌ Отвязать аккаунт') {
      await this.handleUnlinkFromBot(chatId);
      return;
    }

    // 4. Любое другое сообщение
    await this.handleUnknownMessage(chatId);
  }

  /**
   * Привязка аккаунта по токену
   */
  private async handleAuthToken(chatId: number, token: string, username: string): Promise<void> {
    const user = await (prisma as any).user.findFirst({
      where: {
        telegramAuthToken: token,
        OR: [
          { telegramAuthTokenExpiresAt: null },
          { telegramAuthTokenExpiresAt: { gte: new Date() } },
        ],
      },
    });

    if (!user) {
      await this.sendMessage(
        chatId,
        `⚠️ <b>Ссылка привязки недействительна или устарела (срок действия 15 минут).</b>\n\n` +
        `Пожалуйста, вернитесь в личный кабинет на сайте lk.tanbox.kz и нажмите кнопку «Получать уведомления о заказах» для создания новой ссылки.`
      );
      return;
    }

    // 1. Снимаем привязку с других пользователей с этим же chatId во избежание P2002 коллизии уникального индекса
    try {
      await (prisma as any).user.updateMany({
        where: {
          telegramChatId: String(chatId),
          id: { not: user.id },
        },
        data: {
          telegramChatId: null,
          telegramUsername: null,
        },
      });
    } catch (cleanErr: any) {
      logger.warn(`[Client TG Bot] Could not clean prior telegramChatId link: ${cleanErr.message}`);
    }

    // 2. Успешно связываем с текущим пользователем
    try {
      await (prisma as any).user.update({
        where: { id: user.id },
        data: {
          telegramChatId: String(chatId),
          telegramUsername: username || null,
          telegramAuthToken: null,
          telegramAuthTokenExpiresAt: null,
          telegramLinkedAt: new Date(),
        },
      });
    } catch (updateErr: any) {
      logger.error(`[Client TG Bot] Failed to link chatId ${chatId} to user ${user.id}: ${updateErr.message}`);
      await this.sendMessage(
        chatId,
        `⚠️ <b>Ошибка привязки аккаунта:</b> ${updateErr.message || 'Сбой базы данных'}.\n` +
        `Пожалуйста, повторите попытку через минуту.`
      );
      return;
    }

    logger.info(`[Client TG Bot] Successfully linked chatId ${chatId} to user ${user.email} (${user.companyName})`);

    await this.sendMessage(
      chatId,
      `🎉 <b>Аккаунт успешно привязан!</b>\n\n` +
      `Здравствуйте, <b>${user.companyName || user.email}</b>!\n\n` +
      `Теперь вы будете получать моментальные уведомления по вашим заказам:\n` +
      `• 📦 Изменение этапов печати и стикеровки\n` +
      `• 💳 Поступление оплат и выставление счетов\n` +
      `• 🚀 Готовность файлов маркировки\n\n` +
      `<i>Уведомления приходят строго по заказам вашей компании.</i>`,
      {
        replyMarkup: {
          keyboard: [
            [{ text: '📦 Мои заказы' }],
            [{ text: '❌ Отвязать аккаунт' }],
          ],
          resize_keyboard: true,
        },
      }
    );
  }

  /**
   * Ответ на /start без токена
   */
  private async handleStartDefault(chatId: number, firstName: string): Promise<void> {
    const user = await (prisma as any).user.findUnique({
      where: { telegramChatId: String(chatId) },
    });

    if (user) {
      await this.sendMessage(
        chatId,
        `Здравствуйте, <b>${user.companyName || firstName}</b>! 👋\n\n` +
        `Ваш Telegram успешно подключен к личному кабинету <b>${user.email}</b>.\n` +
        `Здесь вы оперативно получаете информацию обо всех изменениях по вашим заказам.\n\n` +
        `Нажмите <b>«📦 Мои заказы»</b> ниже, чтобы просмотреть текущие заказы.`,
        {
          replyMarkup: {
            keyboard: [
              [{ text: '📦 Мои заказы' }],
              [{ text: '❌ Отвязать аккаунт' }],
            ],
            resize_keyboard: true,
          },
        }
      );
      return;
    }

    // Если аккаунт не привязан — четкое уведомление
    await this.sendMessage(
      chatId,
      `⚠️ <b>Ваш аккаунт не привязан к боту.</b>\n\n` +
      `Чтобы получать уведомления об изменении статусов и оплат ваших заказов:\n` +
      `1. Войдите в личный кабинет на сайте <b>lk.tanbox.kz</b>\n` +
      `2. В разделе «Мои заказы» нажмите кнопку <b>«🔔 Получать уведомления о заказах»</b>\n` +
      `3. Нажмите кнопку перехода в бот — аккаунт привяжется автоматически!\n\n` +
      `🌐 <a href="https://lk.tanbox.kz">Войти в Личный кабинет TANBOX</a>`,
      {
        replyMarkup: {
          inline_keyboard: [
            [{ text: '🌐 Войти в Личный кабинет', url: 'https://lk.tanbox.kz' }],
          ],
        },
      }
    );
  }

  /**
   * Список последних заказов клиента
   */
  private async handleListOrders(chatId: number): Promise<void> {
    const user = await (prisma as any).user.findUnique({
      where: { telegramChatId: String(chatId) },
      include: {
        orders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      await this.handleStartDefault(chatId, '');
      return;
    }

    if (!user.orders || user.orders.length === 0) {
      await this.sendMessage(
        chatId,
        `У вас пока нет оформленных заказов.\n\n` +
        `Создать заказ можно в вашем <a href="https://lk.tanbox.kz/orders/new">личном кабинете</a>.`
      );
      return;
    }

    const orderLines = user.orders.map((o: any) => {
      const tariffName = TARIFF_NAMES[o.tariffType] || o.tariffType;
      const stConfig = getStatusForTariff(o.tariffType, o.status);
      const payInfo = PAYMENT_STATUS_LABELS[o.paymentStatus] || { label: o.paymentStatus, emoji: '💳', desc: '' };

      let stickerInfo = '';
      if (o.stickerApprovalStatus === 'APPROVED') {
        stickerInfo = '\n• Макет: <b>✅ Согласован</b>';
      } else if (o.stickerApprovalStatus === 'WAITING_APPROVAL') {
        stickerInfo = '\n• Макет: <b>🎨 Ожидает вашего согласования!</b>';
      } else if (o.stickerApprovalStatus === 'CHANGES_REQUESTED') {
        stickerInfo = '\n• Макет: <i>✏️ Правки в работе у дизайнера</i>';
      }

      return (
        `<b>${stConfig.emoji} Заказ #${o.orderNumber}</b>\n` +
        `• Тариф: <b>${tariffName}</b>\n` +
        `• Этап: <b>${stConfig.label}</b> <i>(${stConfig.desc})</i>` +
        stickerInfo +
        `\n• Оплата: ${payInfo.emoji} <i>${payInfo.label}</i>\n` +
        `• Сумма: <b>${Number(o.totalPrice || 0).toLocaleString('ru-RU')} ₸</b>\n` +
        `👉 <a href="https://lk.tanbox.kz/orders/${o.id}">Открыть детали</a>\n`
      );
    });

    const text = [
      `<b>📦 Ваши последние заказы:</b>\n`,
      ...orderLines,
      `<i>Всего отображено: ${user.orders.length} из последних заказов.</i>`,
    ].join('\n');

    await this.sendMessage(chatId, text, {
      replyMarkup: {
        inline_keyboard: [
          [{ text: '🌐 Открыть все заказы в ЛК', url: 'https://lk.tanbox.kz/orders' }],
        ],
      },
    });
  }

  /**
   * Отвязка пользователя через Telegram
   */
  private async handleUnlinkFromBot(chatId: number): Promise<void> {
    const user = await (prisma as any).user.findUnique({
      where: { telegramChatId: String(chatId) },
    });

    if (!user) {
      await this.sendMessage(chatId, `Ваш аккаунт и так не привязан.`);
      return;
    }

    await (prisma as any).user.update({
      where: { id: user.id },
      data: {
        telegramChatId: null,
        telegramUsername: null,
        telegramLinkedAt: null,
      },
    });

    await this.sendMessage(
      chatId,
      `✅ <b>Уведомления отключены.</b>\n\n` +
      `Ваш Telegram отвязан от аккаунта ${user.companyName || user.email}.\n` +
      `Вы в любой момент сможете подключить их снова в личном кабинете на сайте lk.tanbox.kz.`,
      {
        replyMarkup: { remove_keyboard: true },
      }
    );
  }

  /**
   * Ответ на нераспознанное сообщение
   */
  private async handleUnknownMessage(chatId: number): Promise<void> {
    const user = await (prisma as any).user.findUnique({
      where: { telegramChatId: String(chatId) },
    });

    if (user) {
      await this.sendMessage(
        chatId,
        `Я бот автоматических уведомлений по заказам TANBOX. 🤖\n\n` +
        `Используйте кнопки меню ниже для просмотра заказов или обратитесь в поддержку, если возникли вопросы.`,
        {
          replyMarkup: {
            keyboard: [
              [{ text: '📦 Мои заказы' }],
              [{ text: '❌ Отвязать аккаунт' }],
            ],
            resize_keyboard: true,
          },
        }
      );
    } else {
      await this.handleStartDefault(chatId, '');
    }
  }
}

export const clientTelegramBot = new ClientTelegramBotService();
