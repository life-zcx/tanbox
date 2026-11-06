import { prisma } from '../config/db';
import { CodeAccessUser } from '../utils/orderCodeAccess';

export class UtilisationValidationError extends Error {
  constructor(message: string, public readonly status: 400 | 403 | 409 = 400) {
    super(message);
  }
}

function normalizeTransport(code: string): string {
  return code.replace(/[\r\n]/g, '').replace(/<GS>/gi, '\u001d').trim();
}

function identification(code: string): string {
  const separator = code.indexOf('\u001d');
  const value = separator < 0 ? code : code.slice(0, separator);
  // Match the entire GTIN + serial. Never infer serial length or split on digits 91/92.
  if (!/^01\d{14}21[^\u001d]+$/.test(value)) {
    throw new UtilisationValidationError('Код должен содержать полный GTIN и серийный номер в формате 01…21….');
  }
  return value;
}

function isFullCode(code: string): boolean {
  const separator = code.indexOf('\u001d');
  return separator > 0 && separator < code.length - 1;
}

function escapeLikeLiteral(value: string): string {
  // Prisma startsWith uses LIKE/ILIKE; serial characters are data, not wildcards.
  return value.replace(/[\\%_]/g, '\\$&');
}

export function normalizeUtilisationCodes(input: unknown): string[] {
  if (!Array.isArray(input) || !input.length || input.some(code => typeof code !== 'string')) {
    throw new UtilisationValidationError('Укажите непустой список строк кодов маркировки.');
  }
  const codes = input.map(normalizeTransport);
  if (codes.some(code => !code)) throw new UtilisationValidationError('Список содержит пустой код маркировки.');
  if (new Set(codes).size !== codes.length) throw new UtilisationValidationError('Список содержит повторяющиеся коды маркировки.');
  return codes;
}

export function requireFullUtilisationCodes(codes: string[]): string[] {
  for (const code of codes) {
    identification(code);
    if (!isFullCode(code)) {
      throw new UtilisationValidationError('Для восстановления сокращённых кодов укажите заказ. Без заказа требуются полные коды с разделителями GS.');
    }
  }
  return codes;
}

/** Caller must authorize the order and account before reading its codes. */
export async function restoreOrderUtilisationCodes(orderId: string, requested: string[]): Promise<string[]> {
  const identities = [...new Set(requested.map(identification))];
  const candidates = new Map<string, Set<string>>();
  // Bound query size; query only complete identity boundaries, never the first N order rows.
  for (let offset = 0; offset < identities.length; offset += 100) {
    const batch = identities.slice(offset, offset + 100);
    const rows = await prisma.orderCodeItem.findMany({
      where: {
        orderId,
        OR: batch.flatMap(value => [
          { code: { startsWith: `${escapeLikeLiteral(value)}\u001d` } },
          { code: { startsWith: `${escapeLikeLiteral(value)}<GS>`, mode: 'insensitive' as const } },
        ]),
      },
      select: { code: true },
    });
    for (const row of rows) {
      const full = normalizeTransport(row.code);
      if (!isFullCode(full)) continue;
      const identity = full.slice(0, full.indexOf('\u001d'));
      if (!batch.includes(identity)) continue;
      const matches = candidates.get(identity) || new Set<string>();
      matches.add(full);
      candidates.set(identity, matches);
    }
  }

  const result = requested.map((code, index) => {
    const matches = candidates.get(identification(code));
    if (isFullCode(code)) {
      if (matches?.has(code)) return code;
      throw new UtilisationValidationError(`Полный код №${index + 1} не найден в указанном заказе.`, 403);
    }
    if (!matches?.size) {
      throw new UtilisationValidationError(`Полный код для строки №${index + 1} не найден. Проверьте исходные коды заказа.`);
    }
    if (matches.size !== 1) {
      throw new UtilisationValidationError(`Строке №${index + 1} соответствуют разные полные коды. Требуется сверка данных заказа.`, 409);
    }
    return [...matches][0];
  });
  if (new Set(result).size !== result.length) {
    throw new UtilisationValidationError('Полный и сокращённый варианты ссылаются на один и тот же код. Удалите повтор.');
  }
  return result;
}

export async function resolveUtilisationAccount(
  user: CodeAccessUser,
  requestedAccountId: unknown,
  order: { id: string; userId: string } | null,
) {
  if (requestedAccountId != null && (typeof requestedAccountId !== 'string' || requestedAccountId.trim() === 'ALL')) {
    throw new UtilisationValidationError('Укажите конкретный аккаунт ИС МПТ.');
  }
  const requestedId = typeof requestedAccountId === 'string' ? requestedAccountId.trim() : '';
  const linked = order ? await prisma.markirovkaOrder.findMany({
    where: { orderId: order.id }, select: { accountId: true }, distinct: ['accountId'],
  }) : [];
  const linkedIds = [...new Set(linked.map(item => item.accountId))];
  if (linkedIds.length > 1) {
    throw new UtilisationValidationError('У заказа несколько аккаунтов эмиссии. Перед отправкой требуется сверка привязок.', 409);
  }
  const linkedId = linkedIds[0];
  if (linkedId && requestedId && linkedId !== requestedId) {
    throw new UtilisationValidationError('Выбранный аккаунт не совпадает с аккаунтом эмиссии заказа.', 409);
  }
  const accountId = linkedId || requestedId;
  let account;
  if (accountId) {
    account = await prisma.markirovkaAccount.findUnique({ where: { id: accountId } });
  } else {
    // No silent choice between organizations/accounts; an omitted ID is safe only if unambiguous.
    const accounts = await prisma.markirovkaAccount.findMany({
      where: { status: 'ACTIVE', ...(order ? { userId: order.userId } : user.role !== 'ADMIN' ? { userId: user.id } : {}) },
      orderBy: { id: 'asc' }, take: 2,
    });
    if (accounts.length > 1) throw new UtilisationValidationError('Выберите аккаунт ИС МПТ: найдено несколько активных аккаунтов.', 409);
    account = accounts[0];
  }
  if (!account || (user.role !== 'ADMIN' && account.userId !== user.id)
    || (order && !linkedId && account.userId !== order.userId)) {
    throw new UtilisationValidationError('Аккаунт ИС МПТ недоступен для данного пользователя или заказа.', 403);
  }
  if (account.status !== 'ACTIVE') throw new UtilisationValidationError('Выбранный аккаунт ИС МПТ не активен.');
  return account;
}
