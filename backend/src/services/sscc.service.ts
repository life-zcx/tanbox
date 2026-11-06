import { prisma } from '../config/db';
import { generateValidSscc18 } from './markirovkaClient.service';

export async function allocateSscc(userId: string): Promise<string> {
  const prefix = process.env.SSCC_COMPANY_PREFIX || '0487000';
  if (!/^\d{7}$/.test(prefix)) throw new Error('SSCC_COMPANY_PREFIX must contain 7 digits');
  const rows = await prisma.$queryRaw<Array<{ serial: string }>>`SELECT nextval('sscc_serial_seq')::text AS serial`;
  const code = generateValidSscc18(prefix, rows[0].serial);
  await prisma.ssccAllocation.create({ data: { code, createdById: userId } });
  return code;
}
