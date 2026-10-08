let isMaintenanceModeActive = false;
let maintenanceMessage = 'На платформе проводятся плановые регламентные работы. Сервис возобновит работу в течение 10–15 минут.';

export const isMaintenanceActive = () => isMaintenanceModeActive;
export const getMaintenanceMessage = () => maintenanceMessage;

export const setMaintenanceMode = (active?: boolean, message?: string) => {
  if (active !== undefined) {
    isMaintenanceModeActive = Boolean(active);
  }
  if (typeof message === 'string' && message.trim().length > 0) {
    maintenanceMessage = message.trim();
  }
  return {
    active: isMaintenanceModeActive,
    message: maintenanceMessage,
  };
};
