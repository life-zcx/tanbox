import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Wallet,
  FileText,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ArrowRight,
  PlusCircle,
  Building2,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { TopUpBalanceModal } from './TopUpBalanceModal';
import { useModalBehavior } from '@shared';
import { useNavigate } from 'react-router-dom';

export interface PaymentChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  itemTitle: string; // e.g. "Счет № СЧ-0004"
  itemSubtitle?: string; // e.g. "Печатный тариф • 25 шт."
  amount: number;
  onPayBalance: () => Promise<void>;
  onPayCard?: () => Promise<void>;
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
  onPaymentSuccess,
}) => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState<boolean>(true);
  const [selectedMethod, setSelectedMethod] = useState<'BALANCE' | 'INVOICE'>('BALANCE');
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
        if (bal >= amount) {
          setSelectedMethod('BALANCE');
        } else {
          setSelectedMethod('BALANCE');
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
          setErrorMessage('Недостаточно средств на балансе. Пополните лицевой счет.');
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
      } else if (selectedMethod === 'INVOICE') {
        onClose();
        navigate('/invoices');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Ошибка обработки платежа';
      setErrorMessage(msg);
      setProcessing(false);
    }
  };

  return createPortal(
    <>
      <div
        {...backdropProps}
        className="fixed inset-0 z-[99990] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      >
        <div
          {...dialogProps}
          className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-150 relative max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 shrink-0">
            <div>
              <h3 className="text-base font-extrabold text-[#111827]">{title}</h3>
              <p className="text-xs text-[#64748B] mt-0.5">{itemTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Amount Card */}
          <div className="bg-[#F8FAFC] border border-gray-200/80 rounded-2xl p-4 flex items-center justify-between shrink-0">
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Сумма к оплате
              </span>
              <span className="text-xl font-black text-[#111827]">
                {amount.toLocaleString('ru-RU')} ₸
              </span>
              {itemSubtitle && (
                <span className="text-[11px] text-[#64748B] block mt-0.5 truncate max-w-[240px]">
                  {itemSubtitle}
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 text-[#0082FB] uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3" />
                Без НДС
              </span>
            </div>
          </div>

          {/* Error display */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Payment Methods Selection */}
          <div className="space-y-3 overflow-y-auto pr-1">
            <label className="text-xs font-bold text-[#111827] uppercase tracking-wider block">
              Выберите способ оплаты
            </label>

            <div className="space-y-2.5">
              {/* METHOD 1: Balance */}
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

              {/* METHOD 2: Wire Transfer / Invoice (Kaspi Pay & Bank) */}
              <div
                onClick={() => setSelectedMethod('INVOICE')}
                className={`relative rounded-2xl border p-4 cursor-pointer transition-all ${
                  selectedMethod === 'INVOICE'
                    ? 'border-[#0082FB] bg-blue-50/30 shadow-xs ring-1 ring-[#0082FB]'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        selectedMethod === 'INVOICE'
                          ? 'bg-[#0082FB] text-white'
                          : 'bg-gray-100 text-[#475569]'
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-[#111827]">
                        По счету на оплату (Kaspi Pay / Безнал)
                      </span>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Скачать официальный счет для бухгалтерии и Kaspi
                      </p>
                    </div>
                  </div>

                  {/* Radio indicator */}
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      selectedMethod === 'INVOICE'
                        ? 'border-[#0082FB] bg-[#0082FB]'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {selectedMethod === 'INVOICE' && (
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
              ) : selectedMethod === 'BALANCE' ? (
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={processing}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-extrabold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-60"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Списание средств с баланса...</span>
                    </>
                  ) : (
                    <>
                      <span>Оплатить с баланса • {amount.toLocaleString('ru-RU')} ₸</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  className="w-full py-3.5 px-4 bg-[#0082FB] hover:bg-[#0070DA] text-white rounded-xl text-sm font-extrabold shadow-md shadow-[#0082FB]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <FileText className="w-4 h-4" />
                  <span>Перейти к разделу «Счета на оплату»</span>
                </button>
              )}
            </div>

            {/* Agreement Notice */}
            <p className="text-[11px] text-gray-500 text-center leading-relaxed">
              Оплачивая услуги, вы соглашаетесь с{' '}
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
                Правилами расчетов
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
        initialAmount={missingAmount > 500 ? missingAmount : 25000}
        onSuccess={() => {
          setIsTopUpOpen(false);
          fetchBalance();
        }}
      />
    </>,
    document.body
  );
};
