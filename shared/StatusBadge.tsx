import React from 'react';

export interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getBadgeStyle = (st: string) => {
    switch (st) {
      case 'NEW':
        return 'bg-blue-50 text-blue-700 border-blue-200/60';
      case 'PROCESSING':
        return 'bg-amber-50 text-amber-800 border-amber-200/60';
      case 'PRINTING':
        return 'bg-purple-50 text-purple-700 border-purple-200/60';
      case 'STICKERING':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200/60';
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/60';
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border-red-200/60';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getBadgeLabel = (st: string) => {
    switch (st) {
      case 'NEW':
        return 'Новый';
      case 'PROCESSING':
        return 'В обработке';
      case 'PRINTING':
        return 'Печать кодов';
      case 'STICKERING':
        return 'Стикеровка';
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
      {getBadgeLabel(status)}
    </span>
  );
};
