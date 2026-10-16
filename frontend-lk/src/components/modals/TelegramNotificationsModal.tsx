import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiClient } from '../../api/client';
import { X, Send, CheckCircle2, Copy, Check, ExternalLink, Unlink, Bell, RefreshCw } from 'lucide-react';

interface TelegramNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (isLinked: boolean) => void;
}

export const TelegramNotificationsModal: React.FC<TelegramNotificationsModalProps> = ({
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [isLinked, setIsLinked] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState<string>('tanboxnotificationsbot');
  const [authLink, setAuthLink] = useState<string>('');
  const [generatingLink, setGeneratingLink] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [unlinking, setUnlinking] = useState<boolean>(false);

  // Загрузка статуса привязки
  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/auth/me/telegram-status');
      const data = res.data;
      setIsLinked(Boolean(data.isLinked));
      setUsername(data.username || null);
      if (data.botUsername) setBotUsername(data.botUsername);
      if (onStatusChange) onStatusChange(Boolean(data.isLinked));
    } catch (err) {
      console.error('Failed to fetch telegram status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Генерация ссылки
  const generateLink = async () => {
    try {
      setGeneratingLink(true);
      const res = await apiClient.post('/auth/me/telegram-link');
      if (res.data?.link) {
        setAuthLink(res.data.link);
      }
    } catch (err) {
      console.error('Failed to generate telegram auth link:', err);
    } finally {
      setGeneratingLink(false);
    }
  };

  // Отвязка аккаунта
  const handleUnlink = async () => {
    if (!window.confirm('Вы уверены, что хотите отключить уведомления в Telegram?')) return;
    try {
      setUnlinking(true);
      await apiClient.post('/auth/me/telegram-unlink');
      setIsLinked(false);
      setUsername(null);
      setAuthLink('');
      if (onStatusChange) onStatusChange(false);
    } catch (err) {
      console.error('Failed to unlink telegram:', err);
    } finally {
      setUnlinking(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  // Автоматический опрос статуса, пока пользователь открыл модалку и не привязан
  useEffect(() => {
    if (!isOpen || isLinked) return;

    const interval = setInterval(async () => {
      try {
        const res = await apiClient.get('/auth/me/telegram-status');
        if (res.data?.isLinked) {
          setIsLinked(true);
          setUsername(res.data.username || null);
          if (onStatusChange) onStatusChange(true);
        }
      } catch {}
    }, 3500);

    return () => clearInterval(interval);
  }, [isOpen, isLinked]);

  // Блокировка прокрутки страницы при открытой модалке
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Копирование ссылки
  const handleCopyLink = () => {
    if (!authLink) return;
    navigator.clipboard.writeText(authLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto">
      {/* Полный оверлей на весь экран с блюром */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity -z-10"
        onClick={onClose}
      />

      <div
        className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative overflow-hidden text-[#111827] z-10 my-auto animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Шапка */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#0088cc]/10 flex items-center justify-center text-[#0088cc] shadow-sm">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-extrabold text-[#111827]">
              Уведомления о заказах в Telegram
            </h3>
            <p className="text-xs text-[#64748B]">
              Мгновенные статусы готовности, печати и оплат по вашим партиям
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-[#64748B] flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#0088cc]" />
            Загрузка статуса...
          </div>
        ) : isLinked ? (
          /* СТАТУС: ПРИВЯЗАНО */
          <div className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-3.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-sm font-bold text-emerald-900">
                  Telegram успешно подключен!
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Все обновления по вашим заказам автоматически поступают в чат бота{' '}
                  <span className="font-semibold text-emerald-900">@{botUsername}</span>.
                  {username && <span> (ваш профиль: <b>@{username}</b>)</span>}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={`https://t.me/${botUsername}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#0088cc] hover:bg-[#0077b5] text-white py-3 px-5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Открыть чат с ботом</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              <button
                onClick={handleUnlink}
                disabled={unlinking}
                className="inline-flex items-center justify-center gap-1.5 border border-red-200 hover:bg-red-50 text-red-600 py-3 px-4 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>{unlinking ? 'Отключение...' : 'Отключить'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* СТАТУС: НЕ ПРИВЯЗАНО */
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-900 leading-relaxed">
              Подключите Telegram, чтобы не заходить каждый раз на сайт. Бот моментально пришлет уведомление, как только начнется печать вашей партии или поступит оплата.
            </div>

            {!authLink ? (
              <div className="text-center py-4">
                <button
                  onClick={generateLink}
                  disabled={generatingLink}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#0088cc] hover:bg-[#0077b5] text-white py-3.5 px-6 rounded-2xl text-sm font-extrabold transition-all shadow-lg shadow-blue-500/25 active:scale-95 disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  <span>{generatingLink ? 'Создание ссылки...' : 'Подключить бота @tanboxnotificationsbot'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 space-y-3">
                  <div className="text-xs font-bold text-gray-700">
                    Шаг 1: Нажмите кнопку для перехода в Telegram
                  </div>
                  <a
                    href={authLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#0088cc] hover:bg-[#0077b5] text-white py-3.5 px-6 rounded-xl text-xs font-extrabold transition-all shadow-md active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    <span>Перейти в Telegram-бота</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>

                  <div className="text-xs font-bold text-gray-700 pt-2">
                    Шаг 2: В Telegram нажмите кнопку «START» (или «Запустить»)
                  </div>
                  <p className="text-[11px] text-[#64748B]">
                    После нажатия кнопки «Запустить» бот автоматически привяжется к вашей компании, а это окно обновится само.
                  </p>
                </div>

                {/* Возможность скопировать ссылку */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                    Или скопируйте прямую ссылку:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={authLink}
                      className="flex-1 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono text-gray-700 select-all"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Скопировано</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Скопировать</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-center">
                  <div className="inline-flex items-center gap-2 text-xs text-blue-600 animate-pulse font-medium">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Ожидание нажатия START в боте...
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
