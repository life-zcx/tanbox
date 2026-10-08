import React, { useState } from 'react';
import { RefreshCw, Phone, Send, Mail, AlertTriangle, ArrowRight } from 'lucide-react';
import { apiClient } from '../../api/client';

interface MaintenanceScreenProps {
  message?: string;
  onCheckStatus?: () => void;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({ message, onCheckStatus }) => {
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCheck = async () => {
    setChecking(true);
    setFeedback(null);
    try {
      const res = await apiClient.get('/health');
      if (!res.data.maintenance) {
        window.location.reload();
        return;
      }
      setFeedback('Обновление серверов еще выполняется. Пожалуйста, обновите через несколько минут.');
    } catch {
      setFeedback('Сервер пока не отвечает. Работы продолжаются.');
    } finally {
      if (onCheckStatus) {
        onCheckStatus();
      }
      setTimeout(() => setChecking(false), 700);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center text-[#1E293B]">
      {/* Main Full-Page Content */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col justify-center">
        <div className="space-y-8">
          {/* Main Title & Description */}
          <div className="space-y-4 max-w-2xl">
            <h1 className="text-3xl sm:text-5xl font-black text-[#0F172A] tracking-tight leading-tight">
              Сервис временно недоступен
            </h1>

            <p className="text-base sm:text-lg text-[#64748B] leading-relaxed">
              {message || 'Мы проводим техническое обслуживание серверов и обновление базы данных. Личный кабинет и операции по маркировке возобновят работу в течение 10–15 минут.'}
            </p>
          </div>

          {/* Action Button & Live Status */}
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              onClick={handleCheck}
              disabled={checking}
              className="px-6 py-3.5 bg-[#0082FB] hover:bg-[#0070D8] text-white font-bold rounded-xl text-sm flex items-center gap-2.5 shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Проверка связи...' : 'Проверить доступность сайта'}
            </button>

            {feedback && (
              <span className="text-xs text-amber-800 font-medium bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                {feedback}
              </span>
            )}
          </div>

          {/* Contact & Support Section (2 Clean Cards) */}
          <div className="pt-8 border-t border-gray-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-4">
              Срочные вопросы и отгрузки
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a
                href="https://t.me/tanboxkzbot"
                target="_blank"
                rel="noopener noreferrer"
                className="p-5 border border-gray-200 rounded-2xl hover:border-[#0082FB] hover:shadow-sm transition-all group flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="text-xs text-[#64748B]">Telegram бот и дежурный специалист</div>
                  <div className="text-sm font-bold text-[#0F172A] group-hover:text-[#0082FB] flex items-center gap-1.5">
                    @tanboxkzbot
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </a>

              <a
                href="tel:+77000000000"
                className="p-5 border border-gray-200 rounded-2xl hover:border-[#0082FB] hover:shadow-sm transition-all group flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="text-xs text-[#64748B]">Телефон горячей линии</div>
                  <div className="text-sm font-bold text-[#0F172A] group-hover:text-[#0082FB] flex items-center gap-1.5">
                    +7 (700) 000-00-00
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
