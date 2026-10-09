import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { SystemOutletContext } from '../AdminSystemLayout';

export const AdminSystemTelegramPage: React.FC = () => {
  const { showToast } = useOutletContext<SystemOutletContext>();
  const [testingTelegram, setTestingTelegram] = useState<string | null>(null);

  const handleTestTelegram = async (channel: 'leads' | 'alerts') => {
    setTestingTelegram(channel);
    try {
      const res = await apiClient.post('/system/telegram/test', { channel });
      showToast(res.data.message || 'Тестовое уведомление успешно отправлено в Telegram!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Ошибка отправки тестового уведомления', 'error');
    } finally {
      setTestingTelegram(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
      <div>
        <h2 className="text-sm font-extrabold text-[#111827]">Подключенные Telegram Каналы и Боты</h2>
        <p className="text-xs text-[#64748B] mt-0.5">
          Система автоматически направляет уведомления о лидах в Чат 1, а системные сбои в Чат 2
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Channel 1 Card */}
        <div className="p-5 border border-gray-200 bg-white rounded-2xl space-y-3 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#111827] uppercase tracking-wider">ЧАТ 1: Заявки & Заказы</span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-extrabold">АКТИВЕН</span>
            </div>
            <div className="text-xs text-gray-700 space-y-1 font-medium mt-3">
              <div>ID Группы: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-900 font-mono">-5222464755</code></div>
              <div className="text-[#64748B] pt-1">Назначение: Заявки с лендинга, новые заказы из кабинета, утверждение макетов</div>
              <div className="text-[11px] text-emerald-700 pt-1 font-semibold">
                ✓ Уведомления поступают мгновенно без задержек
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleTestTelegram('leads')}
            disabled={testingTelegram === 'leads'}
            className="w-full mt-3 py-2 px-3 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <Send className="w-3.5 h-3.5 text-[#0082FB]" />
            {testingTelegram === 'leads' ? 'Отправка...' : 'Отправить тестовый лид в Чат 1'}
          </button>
        </div>

        {/* Channel 2 Card */}
        <div className="p-5 border border-gray-200 bg-white rounded-2xl space-y-3 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#111827] uppercase tracking-wider">ЧАТ 2: DevOps & Алерты</span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-extrabold">АКТИВЕН</span>
            </div>
            <div className="text-xs text-gray-700 space-y-1 font-medium mt-3">
              <div>ID Группы: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-900 font-mono">-5378607890</code></div>
              <div className="text-[#64748B] pt-1">Назначение: Ошибки 500 API, сбои базы данных, падение рендера PDF</div>
              <div className="text-[11px] text-[#64748B] pt-1">
                ✓ Авто-дедупликация повторов (не чаще 1 раза в 5 мин)
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleTestTelegram('alerts')}
            disabled={testingTelegram === 'alerts'}
            className="w-full mt-3 py-2 px-3 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <Send className="w-3.5 h-3.5 text-rose-600" />
            {testingTelegram === 'alerts' ? 'Отправка...' : 'Отправить тестовый алерт в Чат 2'}
          </button>
        </div>
      </div>

      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#64748B] flex items-start gap-3">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#111827]">Бот @tanboxkzbot верифицирован и готов к работе.</span>
          <p className="mt-0.5">Тестовые сообщения отправлены в обе группы. Любая новая заявка или сбой сервера моментально публикуется в соответствующую группу.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminSystemTelegramPage;
