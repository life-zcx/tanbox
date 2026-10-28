import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Wallet,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { TopUpBalanceModal } from './TopUpBalanceModal';
import { useModalBehavior } from '@shared';

export interface PaymentChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  itemTitle: string; // e.g. "Счет № СЧ-0004"
  itemSubtitle?: string; // e.g. "Печатный тариф • 25 шт."
  amount: number;
  onPayBalance: () => Promise<void>;
  onPayCard: () => Promise<void>;
  onPaymentSuccess?: () => void;
}

export const PaymentChoiceModal: React.FC<PaymentChoiceModalProps> = ({
  isOpen,
  onClose,
  title = 'Оплата',
  itemTitle,
  itemSubtitle,
  amount,
  onPayBalance,
  onPayCard,
  onPaymentSuccess,
}) => {
  const [balance, setBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState<boolean>(true);
  const [selectedMethod, setSelectedMethod] = useState<'BALANCE' | 'CARD'>('BALANCE');
  const [processing, setProcessing] = useState<boolean>(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { backdropProps, dialogProps } = useModalBehavior({ onClose, isOpen });

  const fetchBalance = async () => {
    setLoadingBalance(true);
    try {
      const res = await apiClient.get('/payments/balance');
      if (res.data?.balance !== undefined) {
        const bal = Number(res.data.balance) || 0;
        setBalance(bal);
        // Default to balance if sufficient, otherwise card
        if (bal >= amount) {
          setSelectedMethod('BALANCE');
        } else {
          setSelectedMethod('CARD');
        }
      }
    } catch (e) {
      console.warn('Failed to fetch user balance:', e);
    } finally {
      setLoadingBalance(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setProcessing(false);
      fetchBalance();
    }
  }, [isOpen, amount]);

  if (!isOpen) return null;

  const hasEnoughBalance = balance >= amount;
  const missingAmount = Math.max(0, amount - balance);

  const handleConfirmPayment = async () => {
    setErrorMessage(null);
    setProcessing(true);
    try {
      if (selectedMethod === 'BALANCE') {
        if (!hasEnoughBalance) {
          setErrorMessage('Недостаточно средств на балансе.');
          setProcessing(false);
          return;
        }
        await onPayBalance();
        window.dispatchEvent(new Event('tanbox:balance-updated'));
        try {
          if (onPaymentSuccess) onPaymentSuccess();
        } catch (callbackErr) {
          console.warn('onPaymentSuccess callback warning:', callbackErr);
        }
        onClose();
      } else {
        await onPayCard();
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Ошибка проведения платежа'
      );
      setProcessing(false);
    }
  };

  return createPortal(
    <>
      <div
        {...backdropProps}
        className="fixed inset-0 z-[99999] overflow-y-auto bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      >
        <div
          {...dialogProps}
          className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200 relative text-[#111827]"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-gray-100">
            <div>
              <h3 className="text-base font-extrabold text-[#111827]">{title}</h3>
              <p className="text-xs text-[#64748B] mt-0.5">Выберите удобный способ оплаты</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-black flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Amount & Target Document Banner */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 border border-gray-200/70 rounded-2xl p-4 text-center space-y-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Сумма к оплате
              </span>
              <p className="text-3xl font-black text-[#111827] tracking-tight">
                {amount.toLocaleString('ru-RU')} ₸
              </p>
              <div className="pt-1 flex items-center justify-center gap-1.5 text-xs text-[#64748B] font-semibold flex-wrap">
                <span className="text-[#111827] font-bold">{itemTitle}</span>
                {itemSubtitle && (
                  <>
                    <span>•</span>
                    <span>{itemSubtitle}</span>
                  </>
                )}
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="font-semibold">{errorMessage}</div>
              </div>
            )}

            {/* Payment Methods (Radio Cards) */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block px-1">
                Способ оплаты
              </span>

              {/* METHOD 1: Personal LK Balance */}
              <div
                onClick={() => setSelectedMethod('BALANCE')}
                className={`relative rounded-2xl border p-4 cursor-pointer transition-all ${
                  selectedMethod === 'BALANCE'
                    ? 'border-[#0082FB] bg-blue-50/30 shadow-xs ring-1 ring-[#0082FB]'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        selectedMethod === 'BALANCE'
                          ? 'bg-[#0082FB] text-white'
                          : 'bg-gray-100 text-[#475569]'
                      }`}
                    >
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#111827]">
                          С баланса личного кабинета
                        </span>
                      </div>
                      <div className="text-xs text-[#64748B] mt-0.5 flex items-center gap-1.5">
                        <span>На балансе:</span>
                        {loadingBalance ? (
                          <Loader2 className="w-3 h-3 animate-spin text-[#0082FB]" />
                        ) : (
                          <span
                            className={`font-black ${
                              hasEnoughBalance ? 'text-emerald-600' : 'text-amber-600'
                            }`}
                          >
                            {balance.toLocaleString('ru-RU')} ₸
                          </span>
                        )}
                        {hasEnoughBalance ? (
                          <span className="text-emerald-600 font-bold text-[11px]">
                            (останется {(balance - amount).toLocaleString('ru-RU')} ₸)
                          </span>
                        ) : (
                          <span className="text-amber-600 font-bold text-[11px]">
                            (не хватает {missingAmount.toLocaleString('ru-RU')} ₸)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Radio indicator */}
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      selectedMethod === 'BALANCE'
                        ? 'border-[#0082FB] bg-[#0082FB]'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {selectedMethod === 'BALANCE' && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>

                {/* If selected and insufficient balance, show prompt to top up */}
                {selectedMethod === 'BALANCE' && !hasEnoughBalance && (
                  <div className="mt-3 pt-3 border-t border-gray-200/60 flex items-center justify-between gap-2">
                    <span className="text-xs text-amber-700 font-medium">
                      Пополните счет на {missingAmount.toLocaleString('ru-RU')} ₸
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsTopUpOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0082FB] rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Пополнить</span>
                    </button>
                  </div>
                )}
              </div>

              {/* METHOD 2: Bank Card (Freedom Pay) */}
              <div
                onClick={() => setSelectedMethod('CARD')}
                className={`relative rounded-2xl border p-4 cursor-pointer transition-all ${
                  selectedMethod === 'CARD'
                    ? 'border-[#0082FB] bg-blue-50/30 shadow-xs ring-1 ring-[#0082FB]'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        selectedMethod === 'CARD'
                          ? 'bg-[#0082FB] text-white'
                          : 'bg-gray-100 text-[#475569]'
                      }`}
                    >
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-[#111827]">
                        Банковской картой онлайн
                      </span>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Visa, Mastercard, Apple Pay через Freedom Pay
                      </p>
                    </div>
                  </div>

                  {/* Radio indicator */}
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      selectedMethod === 'CARD'
                        ? 'border-[#0082FB] bg-[#0082FB]'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {selectedMethod === 'CARD' && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              {selectedMethod === 'BALANCE' && !hasEnoughBalance ? (
                <button
                  type="button"
                  onClick={() => setIsTopUpOpen(true)}
                  className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-extrabold shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Пополнить баланс на {missingAmount.toLocaleString('ru-RU')} ₸</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={processing}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-extrabold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-60"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        {selectedMethod === 'BALANCE' ? 'Списание средств...' : 'Переход к оплате...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>
                        {selectedMethod === 'BALANCE'
                          ? `Оплатить с баланса • ${amount.toLocaleString('ru-RU')} ₸`
                          : `Оплатить картой • ${amount.toLocaleString('ru-RU')} ₸`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Agreement Notice */}
            <p className="text-[11px] text-gray-500 text-center leading-relaxed">
              Нажимая кнопку оплаты, вы соглашаетесь с{' '}
              <a
                href="https://tanbox.kz/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0082FB] hover:underline font-semibold"
              >
                Публичной офертой
              </a>{' '}
              и{' '}
              <a
                href="https://tanbox.kz/payment-procedure"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0082FB] hover:underline font-semibold"
              >
                Правилами оплаты и возврата
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* TopUp Modal */}
      <TopUpBalanceModal
        isOpen={isTopUpOpen}
        onClose={() => {
          setIsTopUpOpen(false);
          fetchBalance();
        }}
        currentBalance={balance}
        initialAmount={missingAmount > 500 ? missingAmount : 5000}
        onSuccess={() => {
          setIsTopUpOpen(false);
          fetchBalance();
        }}
      />
    </>,
    document.body
  );
};
