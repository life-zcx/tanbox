import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  FileDown,
  FileCheck2,
  Boxes,
  FileX2,
  CheckCircle,
  FileEdit,
  PackageOpen,
  RotateCcw,
  KeyRound,
} from 'lucide-react';

export type MarkirovkaOpChoice =
  | 'IMPORT_NOTIFICATION'
  | 'UTILISATION'
  | 'AGGREGATION'
  | 'RETIREMENT'
  | 'VALIDATION'
  | 'CORRECTION'
  | 'DISAGGREGATION'
  | 'RETURN_TO_TURNOVER';

interface MarkirovkaOperationsButtonProps {
  onSelectOperation: (op: MarkirovkaOpChoice) => void;
  disabled?: boolean;
}

export const MarkirovkaOperationsButton: React.FC<MarkirovkaOperationsButtonProps> = ({
  onSelectOperation,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const items: {
    id: MarkirovkaOpChoice;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    requiresEds: boolean;
  }[] = [
    {
      id: 'IMPORT_NOTIFICATION',
      label: 'Уведомление о ввозе товаров',
      icon: FileDown,
      requiresEds: true,
    },
    {
      id: 'UTILISATION',
      label: 'Нанесение КМ',
      icon: FileCheck2,
      requiresEds: false,
    },
    {
      id: 'AGGREGATION',
      label: 'Агрегация КМ',
      icon: Boxes,
      requiresEds: false,
    },
    {
      id: 'RETIREMENT',
      label: 'Уведомление о выводе товара из оборота',
      icon: FileX2,
      requiresEds: true,
    },
    {
      id: 'VALIDATION',
      label: 'Валидация КМ',
      icon: CheckCircle,
      requiresEds: false,
    },
    {
      id: 'CORRECTION',
      label: 'Корректировка сведений о КМ',
      icon: FileEdit,
      requiresEds: true,
    },
    {
      id: 'DISAGGREGATION',
      label: 'Дезагрегация',
      icon: PackageOpen,
      requiresEds: false,
    },
    {
      id: 'RETURN_TO_TURNOVER',
      label: 'Возврат товара в оборот',
      icon: RotateCcw,
      requiresEds: false,
    },
  ];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-4 py-2.5 bg-[#0082FB] hover:bg-[#0072de] text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all active:scale-95 disabled:opacity-50"
      >
        <span>Создать операцию</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 border-b border-gray-100">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
              Операции ИС МПТ (True API / СУЗ)
            </span>
          </div>

          <div className="py-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onSelectOperation(item.id);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-gray-700 hover:text-black hover:bg-gray-50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-gray-400 group-hover:text-[#0082FB] transition-colors shrink-0" />
                    <span className="font-semibold">{item.label}</span>
                  </div>

                  {item.requiresEds && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#0082FB] border border-blue-100 shrink-0">
                      <KeyRound className="w-2.5 h-2.5" />
                      ЭЦП
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
