import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Wallet, ArrowUpRight, ArrowDownRight, Loader2, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../api/client';

interface AdminAdjustBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    email: string;
    companyName: string;
    balance?: number;
  };
  onSuccess: (newBalance: number) => void;
}

const PRESET_TOPUPS = [10000, 25000, 50000, 100000, 250000, 500000];

export const AdminAdjustBalanceModal: React.FC<AdminAdjustBalanceModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const [action, setAction] = useState<'ADD' | 'SUBTRACT'>('ADD');
  const [amountStr, setAmountStr] = useState<string>('50000');
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentBalance = Number(user.balance || 0);
  const numAmount = Math.max(0, parseInt(amountStr.replace(/\D/g, ''), 10) || 0);
  const newCalculatedBalance = action === 'ADD' ? currentBalance + numAmount : Math.max(0, currentBalance - numAmount);
  const isValid = numAmount > 0 && (action === 'ADD' || currentBalance >= numAmount);

  const handlePresetClick = (val: number) => {
    setAmountStr(val.toString());
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      if (action === 'SUBTRACT' && currentBalance < numAmount) {
        setError(`Недостаточно средств для списания. Текущий баланс: ${currentBalance.toLocaleString('ru-RU')} ₸`);
      } else {
        setError('Укажите корректную сумму операции больше 0');
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.post(`/users/${user.id}/balance`, {
        action,
        amount: numAmount,
        comment: comment.trim(),
      });

      const updatedBal = res.data?.newBalance !== undefined ? res.data.newBalance : newCalculatedBalance;
      onSuccess(updatedBal);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Ошибка при изменении баланса');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 w-screen h-screen z-[99999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
      style={{ top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              action === 'ADD' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#111827]">
                {action === 'ADD' ? 'Пополнение баланса клиента' : 'Списание средств с баланса'}
              </h3>
              <p className="text-xs text-[#64748B]">
                {user.companyName} ({user.email})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Toggle (Пополнение / Списание) */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100/80 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setAction('ADD');
              setError(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              action === 'ADD'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            <span>Пополнение (+)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAction('SUBTRACT');
              setError(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              action === 'SUBTRACT'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <ArrowDownRight className="w-4 h-4 text-rose-600" />
            <span>Списание (-)</span>
          </button>
        </div>

        {/* Balance Preview Card */}
        <div className="bg-[#F8FAFC] border border-gray-200/90 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Текущий баланс
            </span>
            <span className="text-lg font-black text-[#111827]">
              {currentBalance.toLocaleString('ru-RU')} ₸
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Баланс после операции
            </span>
            <span className={`text-lg font-black ${
              action === 'ADD' ? 'text-emerald-600' : 'text-[#111827]'
            }`}>
              {newCalculatedBalance.toLocaleString('ru-RU')} ₸
            </span>
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#111827] uppercase tracking-wider block">
            Сумма операции (₸)
          </label>
          <div className="relative">
            <input
              type="text"
              value={amountStr}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '');
                setAmountStr(digits);
                setError(null);
              }}
              placeholder="0"
              className="w-full py-3 px-4 pr-10 bg-white border border-gray-300 rounded-xl text-base font-black text-[#111827] focus:outline-none focus:border-[#0082FB]"
              autoFocus
            />
            <span className="absolute right-4 top-3.5 text-sm font-bold text-gray-400">₸</span>
          </div>

          {/* Quick presets */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
            {PRESET_TOPUPS.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handlePresetClick(val)}
                className={`py-1 px-2 rounded-lg text-[11px] font-extrabold border transition-colors cursor-pointer ${
                  numAmount === val
                    ? 'bg-[#0082FB] text-white border-[#0082FB]'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                }`}
              >
                +{(val / 1000).toFixed(0)}k
              </button>
            ))}
          </div>
        </div>

        {/* Reason / Comment */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#111827] uppercase tracking-wider block">
            Основание / Примечание для истории
          </label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              action === 'ADD'
                ? 'Например: Оплата по счёту №238 от 18.10, предоплата...'
                : 'Например: Возврат излишка, корректировка...'
            }
            className="w-full py-2.5 px-3.5 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0082FB]"
          />
          <p className="text-[11px] text-gray-400">
            Этот комментарий отобразится в финансовой выписке клиента и в журнале аудита.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-xs font-bold text-[#64748B] hover:text-[#111827] bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !isValid}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
              action === 'ADD'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Проведение операции...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {action === 'ADD' ? `Пополнить на ${numAmount.toLocaleString('ru-RU')} ₸` : `Списать ${numAmount.toLocaleString('ru-RU')} ₸`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
