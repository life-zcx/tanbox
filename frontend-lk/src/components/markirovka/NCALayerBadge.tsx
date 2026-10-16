import React from 'react';
import { useNCALayer } from '../../hooks/useNCALayer';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

export const NCALayerBadge: React.FC = () => {
  const { isRunning, checking, checkStatus } = useNCALayer();

  return (
    <button
      type="button"
      onClick={() => checkStatus()}
      disabled={checking}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
        isRunning
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
      }`}
      title={
        isRunning
          ? 'NCALayer активен на порту 13579 (ЭЦП готова к подписанию). Нажмите для проверки.'
          : 'NCALayer не запущен. Для операций с ЭЦП запустите NCALayer на вашем компьютере.'
      }
    >
      <span
        className={`w-2 h-2 rounded-full ${
          checking ? 'bg-amber-400 animate-pulse' : isRunning ? 'bg-emerald-500' : 'bg-gray-400'
        }`}
      />
      {isRunning ? (
        <>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>NCALayer активен</span>
        </>
      ) : (
        <>
          <ShieldAlert className="w-3.5 h-3.5 text-gray-500" />
          <span>NCALayer не запущен</span>
        </>
      )}
    </button>
  );
};
