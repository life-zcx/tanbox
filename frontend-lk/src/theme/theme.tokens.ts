export const themeTokens = {
  colors: {
    background: '#F9FAFB',
    surface: '#FFFFFF',
    border: '#E5E7EB',
    textPrimary: '#000000',
    textSecondary: '#4B5563',
    primary: '#000000',
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
  },
  statusBadges: {
    NEW: { label: 'Новый заказ', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    PROCESSING: { label: 'В обработке', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    PRINTING: { label: 'Печать кодов', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
    STICKERING: { label: 'Оклейка на складе', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    COMPLETED: { label: 'Завершён', bg: 'bg-green-50 text-green-700 border-green-200' },
    CANCELLED: { label: 'Отменён', bg: 'bg-red-50 text-red-700 border-red-200' },
  }
};
