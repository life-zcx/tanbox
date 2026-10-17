import React, { useState } from 'react';
import { X, CreditCard, ShieldCheck, ArrowRight, Loader2, Wallet } from 'lucide-react';
import { apiClient } from '../../api/client';

interface TopUpBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance?: number;
  onSuccess?: () => void;
}

const PRESET_AMOUNTS = [5000, 10000, 25000, 50000, 100000];

export const TopUpBalanceModal: React.FC<TopUpBalanceModalProps> = ({
  isOpen,
  onClose,
  currentBalance = 0,
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(10000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const effectiveAmount = isCustom ? Number(customAmount) : selectedAmount;
  const isAmountValid = effectiveAmount >= 500;

  const handleSelectPreset = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustom(false);
    setError(null);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setCustomAmount(val);
    setIsCustom(true);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-6 animate-in zoom-in-95 duration-150 relative"
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
              <p className="text-xs text-[#64748B]">Лицевой счет в системе TANBOX</p>
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
        <div className="bg-[#F8FAFC] border border-gray-200/80 rounded-2xl p-4 flex items-center justify-between">
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

        {/* Amount Selector */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-[#111827] uppercase tracking-wider block">
            Выберите сумму пополнения
          </label>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleSelectPreset(amt)}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                  !isCustom && selectedAmount === amt
                    ? 'bg-[#0082FB] text-white border-[#0082FB] shadow-md shadow-[#0082FB]/20'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'
                }`}
              >
                {amt.toLocaleString('ru-RU')} ₸
              </button>
            ))}
            <button
              type="button"
              onClick={() => setIsCustom(true)}
              className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                isCustom
                  ? 'bg-[#0082FB] text-white border-[#0082FB] shadow-md shadow-[#0082FB]/20'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'
              }`}
            >
              Другая сумма
            </button>
          </div>

          {isCustom && (
            <div className="relative pt-1 animate-in fade-in duration-100">
              <input
                type="text"
                value={customAmount}
                onChange={handleCustomChange}
                placeholder="Введите сумму (от 500 ₸)"
                className="w-full py-2.5 px-3.5 pr-10 bg-white border border-gray-300 rounded-xl text-sm font-bold text-[#111827] focus:outline-none focus:border-[#0082FB]"
                autoFocus
              />
              <span className="absolute right-3.5 top-3.5 text-xs font-bold text-gray-400">₸</span>
            </div>
          )}
        </div>

        {/* Security & Acquiring Badges */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-[11px] text-[#64748B]">
            <div className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Шлюз Freedom Pay • 3D-Secure 2.0</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-800">Visa / Mastercard</span>
            </div>
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
              <span>Оплатить {effectiveAmount ? `${effectiveAmount.toLocaleString('ru-RU')} ₸` : ''} картой</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
