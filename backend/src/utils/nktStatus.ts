import { MarkirovkaCardStatus } from '@prisma/client';

export function mapNktStatus(data: any, current: MarkirovkaCardStatus): MarkirovkaCardStatus {
  const values = [data?.status, data?.state, data?.data?.status, data?.code, data?.value]
    .filter(value => typeof value === 'string').map(value => value.toLowerCase().trim().replace(/[\s-]+/g, '_'));
  const matches = (options: string[]) => values.some(value => options.includes(value));
  if (matches(['rejected', 'declined', 'revision', 'needs_revision', 'отклонено', 'отклонена', 'на_доработке'])) return 'REJECTED';
  if (matches(['pending', 'pending_moderation', 'moderation', 'in_progress', 'review', 'на_рассмотрении', 'на_модерации'])) return 'PENDING_MODERATION';
  if (matches(['approved', 'completed', 'published', 'одобрено', 'одобрена', 'опубликовано', 'опубликован', 'опубликована', 'выполнено'])) return 'APPROVED';
  if (matches(['draft', 'new', 'черновик', 'новая'])) return 'DRAFT';
  return current;
}
