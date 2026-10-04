import React from 'react';

export interface StatusBadgeProps {
  status: string;
  tariffType?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, tariffType }) => {
  const getBadgeStyle = (st: string) => {
    switch (st) {
      case 'NEW':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'PROCESSING':
        return 'bg-amber-50/80 text-amber-700 border-amber-200';
      case 'PRINTING':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'STICKERING':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getBadgeLabel = (st: string, tariff?: string) => {
    const t = tariff?.toUpperCase() || '';

    if (t.includes('DIGITAL') || t.includes('ЦИФР')) {
      switch (st) {
        case 'NEW':
          return 'Новый';
        case 'PROCESSING':
          return 'В обработке';
        case 'PRINTING':
          return 'Генерация макетов';
        case 'STICKERING':
          return 'Подготовка файлов';
        case 'COMPLETED':
          return 'Готов к выгрузке';
        case 'CANCELLED':
          return 'Отменен';
        default:
          return st;
      }
    }

    if (t.includes('PRINT') || t.includes('ПЕЧАТ')) {
      switch (st) {
        case 'NEW':
          return 'Новый';
        case 'PROCESSING':
          return 'Подготовка';
        case 'PRINTING':
          return 'Печать рулонов';
        case 'STICKERING':
          return 'Упаковка партии';
        case 'COMPLETED':
          return 'Готов к выдаче';
        case 'CANCELLED':
          return 'Отменен';
        default:
          return st;
      }
    }

    if (t.includes('PRO') || t.includes('ПРО')) {
      switch (st) {
        case 'NEW':
          return 'Новый';
        case 'PROCESSING':
          return 'Сверка и приемка';
        case 'PRINTING':
          return 'Печать и оклейка';
        case 'STICKERING':
          return 'SSCC Агрегация';
        case 'COMPLETED':
          return 'Выполнен';
        case 'CANCELLED':
          return 'Отменен';
        default:
          return st;
      }
    }

    // Default / STANDARD
    switch (st) {
      case 'NEW':
        return 'Новый';
      case 'PROCESSING':
        return 'В обработке';
      case 'PRINTING':
        return 'Печать кодов';
      case 'STICKERING':
        return 'Стикеровка на складе';
      case 'COMPLETED':
        return 'Выполнен';
      case 'CANCELLED':
        return 'Отменен';
      default:
        return st;
    }
  };

  return (
    <span className={`inline-flex items-center text-[11px] font-extrabold px-2.5 py-1 rounded-lg border ${getBadgeStyle(status)}`}>
      {getBadgeLabel(status, tariffType)}
    </span>
  );
};
