import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Wallet,
  MessageCircle,
  Copy,
  Check,
  Building2,
  FileText,
  Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useModalBehavior } from '@shared';
import { useAuth } from '../../context/AuthContext';

interface TopUpBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance?: number;
  initialAmount?: number;
  initialTab?: 'topup' | 'history';
  onSuccess?: () => void;
}

const PRESET_AMOUNTS = [5000, 10000, 25000, 50000, 100000, 250000];

export const TopUpBalanceModal: React.FC<TopUpBalanceModalProps> = ({
  isOpen,
  onClose,
  currentBalance = 0,
  initialAmount,
  initialTab = 'topup',
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [amountInput, setAmountInput] = useState<string>(
    initialAmount ? initialAmount.toLocaleString('ru-RU') : '25 000'
  );
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { backdropProps, dialogProps } = useModalBehavior({ onClose, isOpen });

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
        setAmountInput('25 000');
      }
    }
  }, [isOpen, initialTab, initialAmount, navigate, onClose]);

  if (!isOpen) return null;

  const effectiveAmount = parseInt(amountInput.replace(/\s/g, ''), 10) || 0;

  const handleSelectPreset = (amount: number) => {
    setAmountInput(amount.toLocaleString('ru-RU'));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setAmountInput('');
      return;
    }
    const num = parseInt(raw, 10);
    if (num > 50000000) return;
    setAmountInput(num.toLocaleString('ru-RU'));
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const companyTitle = user?.companyName || user?.email || 'Клиент TANBOX';
  const binIin = user?.binIin ? ` (БИН/ИИН: ${user.binIin})` : '';
  const formattedAmount = effectiveAmount > 0 ? `${effectiveAmount.toLocaleString('ru-RU')} ₸` : 'аванс';

  const waText = encodeURIComponent(
    `Здравствуйте! Прошу выставить счет на пополнение баланса Личного кабинета TANBOX.\n\nКомпания: ${companyTitle}${binIin}\nСумма: ${formattedAmount}`
  );
  const waUrl = `https://wa.me/77003048532?text=${waText}`;

  return createPortal(
    <div
      {...backdropProps}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        {...dialogProps}
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-150 relative max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0082FB] flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#111827]">Пополнение лицевого счета</h3>
              <p className="text-xs text-[#64748B]">Безналичный расчет для юридических лиц и ИП</p>
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
              Сумма к пополнению
            </span>
            <span className="text-xl font-black text-[#0082FB]">
              {effectiveAmount > 0 ? `${effectiveAmount.toLocaleString('ru-RU')} ₸` : '0 ₸'}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-4 overflow-y-auto pr-1">
          {/* Amount input & quick presets */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-[#111827] uppercase tracking-wider block">
              Желаемая сумма аванса
            </label>

            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={amountInput}
                onChange={handleAmountChange}
                placeholder="25 000"
                className="w-full text-xl font-black text-[#111827] bg-white border border-gray-300 focus:border-[#0082FB] rounded-2xl py-2.5 px-4 pr-12 transition-all outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400 pointer-events-none">
                ₸
              </span>
            </div>

            {/* Presets grid */}
            <div className="grid grid-cols-3 gap-2">
              {PRESET_AMOUNTS.map((amt) => {
                const isActive = effectiveAmount === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleSelectPreset(amt)}
                    className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      isActive
                        ? 'bg-[#0082FB] text-white border-[#0082FB] shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'
                    }`}
                  >
                    {amt.toLocaleString('ru-RU')} ₸
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Action: Request invoice in WhatsApp */}
          <div className="pt-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl font-extrabold text-sm shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
            >
              <MessageCircle className="w-5 h-5 shrink-0" />
              <span>Запросить счет на оплату в WhatsApp</span>
            </a>
          </div>

          {/* Direct Bank Requisites */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs text-[#1e293b]">
            <div className="flex items-center gap-2 font-bold text-[#111827]">
              <Building2 className="w-4 h-4 text-[#0082FB]" />
              <span>Реквизиты для оплаты со счета компании:</span>
            </div>

            <div className="space-y-1.5 text-[11px] leading-relaxed">
              <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                <span className="text-gray-500">Получатель:</span>
                <span className="font-semibold text-right">ИП INTERSENSE (ИИН 990601301525)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                <span className="text-gray-500">Банк:</span>
                <span className="font-semibold text-right">АО «Kaspi Bank» (БИК CASPKZKA, КБЕ 19)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                <span className="text-gray-500">IBAN (счет):</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-[#0082FB]">KZ58722S000055787378</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('KZ58722S000055787378', 'iban')}
                    className="p-1 hover:bg-white rounded text-gray-500 hover:text-black transition-colors cursor-pointer"
                    title="Скопировать IBAN"
                  >
                    {copiedField === 'iban' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="py-1">
                <span className="text-gray-500 block mb-0.5">Назначение платежа:</span>
                <span className="font-medium text-gray-700 bg-white border border-gray-200 rounded-lg p-2 block text-[10px]">
                  Авансовый платеж за полиграфические услуги маркировки (клиент: {companyTitle})
                </span>
              </div>
            </div>
          </div>

          {/* Process explanation note */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-blue-900 text-xs">
            <Clock className="w-4 h-4 text-[#0082FB] shrink-0 mt-0.5" />
            <p className="leading-snug">
              После отправки платежки или подтверждения оплаты менеджер зачисляет средства на ваш баланс в течение <strong>5–15 минут</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
