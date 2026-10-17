import React, { useState, useEffect } from 'react';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Server,
  Sparkles,
  Link as LinkIcon,
  MessageSquare,
  History,
  Copy,
  ExternalLink,
  Shield,
  Layers,
  Check,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { SystemOutletContext } from '../AdminSystemLayout';

interface DispatchRecord {
  id: string;
  target: string;
  chatId: string;
  chatName: string;
  text: string;
  buttonText?: string;
  buttonUrl?: string;
  sender: string;
  date: string;
  success: boolean;
  error?: string;
}

function renderSafeTelegramPreview(text: string): string {
  if (!text || !text.trim()) {
    return '<i class="text-gray-400">Здесь появится текст вашего сообщения...</i>';
  }
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped
    .replace(/&lt;(\/?)(b|strong|i|em|u|s|strike|del|code|pre)&gt;/gi, '<$1$2>')
    .replace(/&lt;a\s+href=&quot;(https?:\/\/[^&"]+)&quot;&gt;/gi, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#0082FB] underline">')
    .replace(/&lt;\/a&gt;/gi, '</a>');
}

export const AdminSystemTelegramPage: React.FC = () => {
  const { showToast } = useOutletContext<SystemOutletContext>();

  // Config & State
  const [loading, setLoading] = useState<boolean>(true);
  const [config, setConfig] = useState<{
    botConfigured: boolean;
    leadsChatId: string;
    alertsChatId: string;
  }>({
    botConfigured: true,
    leadsChatId: '-5222464755',
    alertsChatId: '-5378607898',
  });
  const [history, setHistory] = useState<DispatchRecord[]>([]);

  // Form State
  const [target, setTarget] = useState<'leads' | 'alerts' | 'custom'>('leads');
  const [customChatId, setCustomChatId] = useState<string>('');
  const [messageText, setMessageText] = useState<string>(
    '📢 <b>Внимание команде Tanbox!</b>\n\nВ системе опубликовано обновление. Просьба проверить статус текущих заказов.'
  );

  // Button Attachment State
  const [hasButton, setHasButton] = useState<boolean>(true);
  const [buttonText, setButtonText] = useState<string>('Открыть панель управления');
  const [buttonUrl, setButtonUrl] = useState<string>('https://admin.tanbox.kz');

  // Loading States
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [sendingDailyReport, setSendingDailyReport] = useState<boolean>(false);
  const [sendingServerReport, setSendingServerReport] = useState<boolean>(false);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/system/telegram/overview');
      if (res.data?.config) setConfig(res.data.config);
      if (res.data?.history) setHistory(res.data.history);
    } catch (err: any) {
      console.warn('Could not fetch Telegram overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  // Presets
  const applyPreset = (type: 'announcement' | 'maintenance' | 'release' | 'custom') => {
    switch (type) {
      case 'announcement':
        setMessageText('📢 <b>ВАЖНОЕ ОБЪЯВЛЕНИЕ ДЛЯ КОМАНДЫ</b>\n\nУважаемые коллеги, обратите внимание на новые заявки и партии в очереди печати.');
        setHasButton(true);
        setButtonText('📦 Перейти к заказам');
        setButtonUrl('https://admin.tanbox.kz/orders');
        break;
      case 'maintenance':
        setMessageText('⚠️ <b>ПРЕДУПРЕЖДЕНИЕ О ТЕХРАБОТАХ</b>\n\nСегодня в 23:00 планируется кратковременное техническое обслуживание сервера (до 10 минут).');
        setHasButton(true);
        setButtonText('🛠 Статус сервисов');
        setButtonUrl('https://admin.tanbox.kz/system');
        break;
      case 'release':
        setMessageText('🚀 <b>ОБНОВЛЕНИЕ ПЛАТФОРМЫ TANBOX</b>\n\nУспешно развернута новая версия системы:\n• Оптимизация генерации PDF этикеток\n• Интеграция с Национальным Каталогом\n• Повышена скорость отклика API');
        setHasButton(true);
        setButtonText('🌐 Открыть сайт');
        setButtonUrl('https://tanbox.kz');
        break;
      case 'custom':
        setMessageText('');
        setHasButton(false);
        break;
    }
  };

  // Quick tag insertion
  const insertTag = (openTag: string, closeTag: string) => {
    setMessageText((prev) => `${prev}${openTag}текст${closeTag}`);
  };

  // Handle Send Custom Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) {
      showToast('Введите текст сообщения для отправки', 'error');
      return;
    }

    if (target === 'custom' && !customChatId.trim()) {
      showToast('Укажите ID целевого чата или имя канала', 'error');
      return;
    }

    setSendingMessage(true);
    try {
      const res = await apiClient.post('/system/telegram/send-message', {
        target,
        customChatId: target === 'custom' ? customChatId.trim() : undefined,
        text: messageText.trim(),
        buttonText: hasButton && buttonText.trim() ? buttonText.trim() : undefined,
        buttonUrl: hasButton && buttonUrl.trim() ? buttonUrl.trim() : undefined,
      });

      showToast(res.data?.message || 'Сообщение успешно доставлено в Telegram!', 'success');
      await fetchOverview();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Ошибка отправки сообщения в Telegram', 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle Send Daily Operations Report
  const handleSendDailyReport = async () => {
    setSendingDailyReport(true);
    try {
      const res = await apiClient.post('/system/telegram/send-daily-report', {
        target: 'leads',
      });
      showToast(res.data?.message || 'Суточная сводка отправлена в Чат 1!', 'success');
      await fetchOverview();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Ошибка отправки сводки', 'error');
    } finally {
      setSendingDailyReport(false);
    }
  };

  // Handle Send Server Health Report
  const handleSendServerReport = async () => {
    setSendingServerReport(true);
    try {
      const res = await apiClient.post('/system/telegram/send-server-report', {
        target: 'alerts',
      });
      showToast(res.data?.message || 'Отчет о сервере отправлен в Чат 2!', 'success');
      await fetchOverview();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Ошибка отправки отчета о сервере', 'error');
    } finally {
      setSendingServerReport(false);
    }
  };

  const selectedTargetLabel =
    target === 'leads'
      ? `Чат 1 (Заявки & Заказы: ${config.leadsChatId})`
      : target === 'alerts'
      ? `Чат 2 (DevOps & Алерты: ${config.alertsChatId})`
      : customChatId || 'Пользовательский чат';

  return (
    <div className="space-y-6 w-full">
      {/* Top Action Bar & Quick Reports */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
            <Send className="w-5 h-5 text-[#0082FB]" />
            Центр рассылки и сообщений Telegram
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Прямая отправка уведомлений, объявлений и автоотчетов в рабочие группы через бота <strong className="text-gray-800">@tanboxkzbot</strong>
          </p>
        </div>

        {/* Quick Report Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleSendDailyReport}
            disabled={sendingDailyReport || loading}
            title="Отправить свежие цифры продаж, заказов и лидов за сегодня в Чат 1"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-bold transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <BarChart3 className={`w-3.5 h-3.5 ${sendingDailyReport ? 'animate-spin' : ''}`} />
            {sendingDailyReport ? 'Отправка сводки...' : '📊 Отправить сводку за сегодня'}
          </button>

          <button
            type="button"
            onClick={handleSendServerReport}
            disabled={sendingServerReport || loading}
            title="Отправить отчет о нагрузке CPU, памяти и очереди печати в Чат 2 DevOps"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-[#0082FB] text-xs font-bold transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Server className={`w-3.5 h-3.5 ${sendingServerReport ? 'animate-spin' : ''}`} />
            {sendingServerReport ? 'Отправка статуса...' : '🖥️ Статус сервера в DevOps'}
          </button>
        </div>
      </div>

      {/* Main 2-Column: Composer & Live Telegram Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Composer Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5">
          <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#0082FB]" />
                Конструктор сообщения
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Заполните текст, выберите чат и настройте кнопку
              </p>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-gray-400 mr-1 hidden sm:inline">Пресеты:</span>
              <button
                type="button"
                onClick={() => applyPreset('announcement')}
                className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-[11px] font-bold text-gray-700 transition-all cursor-pointer"
              >
                Объявление
              </button>
              <button
                type="button"
                onClick={() => applyPreset('maintenance')}
                className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-[11px] font-bold text-gray-700 transition-all cursor-pointer"
              >
                Техработы
              </button>
              <button
                type="button"
                onClick={() => applyPreset('release')}
                className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-[11px] font-bold text-gray-700 transition-all cursor-pointer"
              >
                Релиз
              </button>
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="space-y-4">
            {/* Target Channel Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">Куда отправить</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTarget('leads')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    target === 'leads'
                      ? 'border-[#0082FB] bg-blue-50/50 ring-1 ring-[#0082FB]'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-gray-900">ЧАТ 1</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-[11px] font-bold text-[#0082FB] mt-0.5">Заявки & Заказы</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-1">{config.leadsChatId}</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTarget('alerts')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    target === 'alerts'
                      ? 'border-[#0082FB] bg-blue-50/50 ring-1 ring-[#0082FB]'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-gray-900">ЧАТ 2</span>
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                  <p className="text-[11px] font-bold text-[#0082FB] mt-0.5">DevOps & Алерты</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-1">{config.alertsChatId}</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTarget('custom')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    target === 'custom'
                      ? 'border-[#0082FB] bg-blue-50/50 ring-1 ring-[#0082FB]'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-gray-900">СВОЙ ЧАТ</span>
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                  </div>
                  <p className="text-[11px] font-bold text-gray-700 mt-0.5">ID или @канал</p>
                  <p className="text-[10px] text-gray-400 mt-1">Любая группа/канал</p>
                </button>
              </div>

              {target === 'custom' && (
                <div className="pt-2 animate-in fade-in">
                  <input
                    type="text"
                    value={customChatId}
                    onChange={(e) => setCustomChatId(e.target.value)}
                    placeholder="Например: -100123456789 или @my_channel_name"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0082FB]/20 focus:border-[#0082FB]"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Бот <code className="text-gray-600">@tanboxkzbot</code> должен быть добавлен администратором в целевой чат или канал.
                  </p>
                </div>
              )}
            </div>

            {/* Message Body Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700">
                  Текст сообщения (поддерживается HTML-разметка)
                </label>
                {/* HTML tags quick insert */}
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => insertTag('<b>', '</b>')}
                    className="px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 cursor-pointer"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTag('<i>', '</i>')}
                    className="px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200 italic font-serif text-gray-700 cursor-pointer"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTag('<code>', '</code>')}
                    className="px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200 font-mono text-[10px] text-gray-700 cursor-pointer"
                  >
                    code
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTag('<a href="https://...">', '</a>')}
                    className="px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                  >
                    link
                  </button>
                </div>
              </div>

              <textarea
                rows={6}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Введите текст сообщения..."
                className="w-full p-3.5 border border-gray-300 rounded-xl text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#0082FB]/20 focus:border-[#0082FB] font-sans"
              />
            </div>

            {/* Inline Button Configuration */}
            <div className="p-4 bg-gray-50/70 border border-gray-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-gray-800 flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasButton}
                    onChange={(e) => setHasButton(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0082FB] focus:ring-[#0082FB]"
                  />
                  <span>Прикрепить интерактивную кнопку со ссылкой (Inline Button)</span>
                </label>
              </div>

              {hasButton && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-in fade-in">
                  <div>
                    <label className="text-[11px] font-bold text-gray-600 block mb-1">
                      Текст на кнопке
                    </label>
                    <input
                      type="text"
                      value={buttonText}
                      onChange={(e) => setButtonText(e.target.value)}
                      placeholder="Например: Открыть заказ"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#0082FB]/20 focus:border-[#0082FB]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-600 block mb-1">
                      URL адрес перехода
                    </label>
                    <input
                      type="text"
                      value={buttonUrl}
                      onChange={(e) => setButtonUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0082FB]/20 focus:border-[#0082FB]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">
                Получатель: <strong className="text-gray-900">{selectedTargetLabel}</strong>
              </span>

              <button
                type="submit"
                disabled={sendingMessage || loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0082FB] hover:bg-[#0072DD] text-white text-xs font-extrabold rounded-xl shadow-md shadow-[#0082FB]/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Send className={`w-3.5 h-3.5 ${sendingMessage ? 'animate-spin' : ''}`} />
                {sendingMessage ? 'Отправка...' : 'Отправить в Telegram'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Telegram Preview & Details (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Telegram Phone / Bubble Mockup */}
          <div className="bg-[#54759E]/10 border border-[#54759E]/20 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#54759E]/20 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#0082FB]" />
                <span className="text-xs font-black uppercase text-gray-700 tracking-wider">
                  Предпросмотр сообщения
                </span>
              </div>
              <span className="text-[10px] font-bold text-gray-400">Telegram Client</span>
            </div>

            {/* Bubble */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200/80 space-y-2.5 relative">
              {/* Sender Header */}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#0082FB] text-white flex items-center justify-center text-[10px] font-bold">
                  TB
                </div>
                <div>
                  <span className="text-xs font-extrabold text-[#0082FB]">Tanbox Bot</span>
                  <span className="text-[10px] text-gray-400 ml-1.5">bot</span>
                </div>
              </div>

              {/* Rendered HTML Message */}
              <div
                className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap font-sans"
                dangerouslySetInnerHTML={{
                  __html: renderSafeTelegramPreview(messageText),
                }}
              />

              {/* Time stamp */}
              <div className="text-right text-[10px] text-gray-400 font-mono">
                {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </div>

              {/* Attached Inline Button */}
              {hasButton && buttonText.trim() && (
                <div className="pt-1 border-t border-gray-100">
                  <div className="w-full py-2 bg-[#0082FB]/10 hover:bg-[#0082FB]/20 text-[#0082FB] rounded-xl text-center text-xs font-bold transition-colors flex items-center justify-center gap-1.5">
                    <ExternalLink className="w-3 h-3" />
                    <span>{buttonText}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active Channels Reference Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#0082FB]" />
              Статус Telegram-инфраструктуры
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                <div>
                  <span className="font-bold text-gray-800 block">Чат 1 (Заявки & Заказы)</span>
                  <span className="text-[11px] text-gray-500 font-mono">{config.leadsChatId}</span>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  АКТИВЕН
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                <div>
                  <span className="font-bold text-gray-800 block">Чат 2 (DevOps & Алерты)</span>
                  <span className="text-[11px] text-gray-500 font-mono">{config.alertsChatId}</span>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  АКТИВЕН
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Card: Dispatch History */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#0082FB]" />
            <h3 className="text-sm font-extrabold text-gray-900">
              История недавних отправок из панели управления
            </h3>
          </div>
          <button
            type="button"
            onClick={fetchOverview}
            className="text-xs text-[#0082FB] hover:underline font-bold inline-flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Обновить журнал
          </button>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs font-medium">
            Журнал отправки пуст. Отправьте первое сообщение или суточную сводку выше.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200/80">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Дата и время</th>
                  <th className="py-2.5 px-3">Получатель</th>
                  <th className="py-2.5 px-3">Отправитель</th>
                  <th className="py-2.5 px-3">Текст / Кнопка</th>
                  <th className="py-2.5 px-3 text-right">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50/50">
                    <td className="py-2 px-3 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(rec.date).toLocaleString('ru-RU')}
                    </td>
                    <td className="py-2 px-3 font-semibold text-gray-900 whitespace-nowrap">
                      {rec.chatName}
                    </td>
                    <td className="py-2 px-3 text-gray-600 font-medium whitespace-nowrap">
                      {rec.sender}
                    </td>
                    <td className="py-2 px-3 text-gray-700 max-w-md truncate">
                      <span>{rec.text}</span>
                      {rec.buttonText && (
                        <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-[#0082FB] text-[10px] font-bold">
                          🔘 {rec.buttonText}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          rec.success
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {rec.success ? '✓ Доставлено' : 'Ошибка'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSystemTelegramPage;
