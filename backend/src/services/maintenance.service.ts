import { prisma } from '../config/db';
import { logger } from '../utils/logger';

let isMaintenanceModeActive = false;
let maintenanceMessage = 'На платформе проводятся плановые регламентные работы. Сервис возобновит работу в течение 10–15 минут.';

export const isMaintenanceActive = () => isMaintenanceModeActive;
export const getMaintenanceMessage = () => maintenanceMessage;

export const initMaintenanceSettings = async () => {
  try {
    const setting = await (prisma as any).systemSetting.findUnique({
      where: { key: 'maintenance' },
    });
    if (setting && setting.value && typeof setting.value === 'object') {
      const val = setting.value as { active?: boolean; message?: string };
      if (typeof val.active === 'boolean') {
        isMaintenanceModeActive = val.active;
      }
      if (typeof val.message === 'string' && val.message.trim().length > 0) {
        maintenanceMessage = val.message.trim();
      }
      logger.info(`[Maintenance] Loaded from DB: active=${isMaintenanceModeActive}`);
    }
  } catch (error: any) {
    logger.warn(`[Maintenance] Could not load from DB: ${error.message}`);
  }
};

export const setMaintenanceMode = async (active?: boolean, message?: string, updatedBy?: string) => {
  if (active !== undefined) {
    isMaintenanceModeActive = Boolean(active);
  }
  if (typeof message === 'string' && message.trim().length > 0) {
    maintenanceMessage = message.trim();
  }

  const result = {
    active: isMaintenanceModeActive,
    message: maintenanceMessage,
  };

  try {
    await (prisma as any).systemSetting.upsert({
      where: { key: 'maintenance' },
      update: {
        value: result,
        updatedBy: updatedBy || 'admin',
      },
      create: {
        key: 'maintenance',
        value: result,
        description: 'Режим технических работ платформы',
        updatedBy: updatedBy || 'admin',
      },
    });
    logger.info(`[Maintenance] Persisted to DB: active=${result.active}`);
  } catch (error: any) {
    logger.error(`[Maintenance] Failed to persist to DB: ${error.message}`);
  }

  return result;
};
