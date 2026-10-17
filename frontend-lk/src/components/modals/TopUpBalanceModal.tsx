import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ArrowRight,
  Loader2,
  Wallet,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { useNavigate } from 'react-router-dom';

interface TopUpBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance?: number;
  initialAmount?: number;
  initialTab?: 'topup' | 'history';
  onSuccess?: () => void;
}

const PRESET_AMOUNTS = [1000, 5000, 10000, 25000, 50000, 100000];

export const TopUpBalanceModal: React.FC<TopUpBalanceModalProps> = ({
  isOpen,
  onClose,
  currentBalance = 0,
  initialAmount,
  initialTab = 'topup',
}) => {
  const navigate = useNavigate();
  const [amountInput, setAmountInput] = useState<string>(
    initialAmount ? initialAmount.toLocaleString('ru-RU') : '5 000'
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialTab === 'history') {
        onClose();
        navigate('/payments');
        return;
      }
      if (initialAmount) {
        setAmountInput(initialAmount.toLocaleString('ru-RU'));
      } else if (!amountInput) {
        setAmountInput('5 000');
      }
      setError(null);
    }
  }, [isOpen, initialTab, initialAmount, navigate, onClose]);

  if (!isOpen) return null;

  const effectiveAmount = parseInt(amountInput.replace(/\s/g, ''), 10) || 0;
  const isAmountValid = effectiveAmount >= 500;

  const handleSelectPreset = (amount: number) => {
    setAmountInput(amount.toLocaleString('ru-RU'));
    setError(null);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setAmountInput('');
      setError(null);
      return;
    }
    const num = parseInt(raw, 10);
    if (num > 50000000) return;
    setAmountInput(num.toLocaleString('ru-RU'));
    setError(null);
  };

  const handleTopUp = async () => {
    if (!isAmountValid) {
      setError('Минимальная сумма пополнения — 500 ₸');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.post('/payments/init', {
        type: 'BALANCE',
        amount: effectiveAmount,
        description: `Пополнение лицевого счета TANBOX на сумму ${effectiveAmount.toLocaleString('ru-RU')} ₸`,
      });

      if (res.data?.redirectUrl) {
        window.location.href = res.data.redirectUrl;
      } else {
        throw new Error(res.data?.message || 'Не удалось получить ссылку на оплату');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Ошибка запуска платежа');
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-150 relative max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0082FB] flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#111827]">Пополнение баланса</h3>
              <p className="text-xs text-[#64748B]">Моментальное зачисление средств на лицевой счет</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Balance Card */}
        <div className="bg-[#F8FAFC] border border-gray-200/80 rounded-2xl p-4 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Текущий остаток
            </span>
            <span className="text-xl font-black text-[#111827]">
              {Number(currentBalance).toLocaleString('ru-RU')} ₸
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-bold text-[#0082FB] uppercase tracking-wider block">
              После зачисления
            </span>
            <span className="text-xl font-black text-emerald-600">
              {(Number(currentBalance) + (isAmountValid ? effectiveAmount : 0)).toLocaleString('ru-RU')} ₸
            </span>
          </div>
        </div>

        {/* TOPUP FORM */}
        <div className="space-y-5 overflow-y-auto pr-1">
          {/* Amount input & quick presets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                Сумма пополнения
              </label>
              <span className="text-[11px] font-semibold text-gray-400">
                мин. 500 ₸
              </span>
            </div>

            {/* Input field */}
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={amountInput}
                onChange={handleAmountChange}
                placeholder="5 000"
                className="w-full text-xl sm:text-2xl font-black text-[#111827] bg-white border border-gray-300 focus:border-[#0082FB] rounded-2xl py-3 px-4 pr-12 transition-all outline-none"
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400 pointer-events-none">
                ₸
              </span>
            </div>

            {/* Presets grid */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {PRESET_AMOUNTS.map((amt) => {
                const isActive = effectiveAmount === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleSelectPreset(amt)}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                      isActive
                        ? 'bg-[#0082FB] text-white border-[#0082FB] shadow-sm shadow-[#0082FB]/20'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'
                    }`}
                  >
                    {amt.toLocaleString('ru-RU')} ₸
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
              {error}
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            onClick={handleTopUp}
            disabled={loading || !isAmountValid}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-[#0082FB] hover:bg-[#0070DA] disabled:opacity-50 text-white rounded-2xl font-extrabold text-sm shadow-md shadow-[#0082FB]/20 transition-all cursor-pointer active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Переход на платежный шлюз...</span>
              </>
            ) : (
              <>
                <span>Оплатить {effectiveAmount > 0 ? `${effectiveAmount.toLocaleString('ru-RU')} ₸` : ''} картой</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
