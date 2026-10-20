import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Standalone callback for non-React contexts if needed
let globalShowToast: ((message: string, type?: ToastType, duration?: number) => void) | null = null;

export const showGlobalToast = (message: string, type: ToastType = 'info', duration = 3800) => {
  if (globalShowToast) {
    globalShowToast(message, type, duration);
  } else if (typeof window !== 'undefined') {
    console.warn(`[Toast ${type}]`, message);
  }
};

/**
 * Universal global toast object - can be called from anywhere:
 * toast.success('Сохранено')
 * toast.error('Ошибка')
 * toast.info('Инфо')
 * toast.warning('Внимание')
 */
export const toast = {
  success: (message: string, duration?: number) => showGlobalToast(message, 'success', duration),
  error: (message: string, duration?: number) => showGlobalToast(message, 'error', duration),
  info: (message: string, duration?: number) => showGlobalToast(message, 'info', duration),
  warning: (message: string, duration?: number) => showGlobalToast(message, 'warning', duration),
};

const SuccessIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const ErrorIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);

const WarningIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" x2="12" y1="9" y2="13" />
    <line x1="12" x2="12.01" y1="17" y2="17" />
  </svg>
);

const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="16" y2="12" />
    <line x1="12" x2="12.01" y1="8" y2="8" />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = toastTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimers.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 3800) => {
      if (!message || !message.trim()) return;

      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = { id, message, type, duration };

      setToasts((prev) => {
        // Limit to max 4 stacked toasts to prevent screen clutter
        const next = [...prev, newToast];
        return next.slice(-4);
      });

      if (duration > 0) {
        const timer = setTimeout(() => {
          removeToast(id);
        }, duration);
        toastTimers.current.set(id, timer);
      }
    },
    [removeToast]
  );

  const success = useCallback((msg: string, dur?: number) => showToast(msg, 'success', dur), [showToast]);
  const error = useCallback((msg: string, dur?: number) => showToast(msg, 'error', dur), [showToast]);
  const info = useCallback((msg: string, dur?: number) => showToast(msg, 'info', dur), [showToast]);
  const warning = useCallback((msg: string, dur?: number) => showToast(msg, 'warning', dur), [showToast]);

  globalShowToast = showToast;

  // Intercept window.alert so even legacy or third-party alerts become styled toasts
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const origAlert = window.alert;
    window.alert = (msg?: any) => {
      const text = String(msg ?? '');
      if (
        text.toLowerCase().includes('ошиб') ||
        text.toLowerCase().includes('не удалось') ||
        text.toLowerCase().includes('заблокирован') ||
        text.toLowerCase().includes('не найден') ||
        text.toLowerCase().includes('запрещен')
      ) {
        error(text);
      } else if (
        text.toLowerCase().includes('успеш') ||
        text.toLowerCase().includes('сохранен') ||
        text.toLowerCase().includes('принят') ||
        text.toLowerCase().includes('актуальн')
      ) {
        success(text);
      } else {
        info(text);
      }
    };
    return () => {
      window.alert = origAlert;
    };
  }, [error, success, info]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning, removeToast }}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            aria-live="polite"
            className="fixed top-5 right-5 z-[999999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
          >
            {toasts.map((toastItem) => {
              const borderColors: Record<ToastType, string> = {
                success: 'border-emerald-200/90 bg-white/95 text-emerald-950',
                error: 'border-rose-200/90 bg-white/95 text-rose-950',
                warning: 'border-amber-200/90 bg-white/95 text-amber-950',
                info: 'border-blue-200/90 bg-white/95 text-blue-950',
              };

              const iconColors: Record<ToastType, string> = {
                success: 'text-emerald-600 bg-emerald-50',
                error: 'text-rose-600 bg-rose-50',
                warning: 'text-amber-600 bg-amber-50',
                info: 'text-[#0082FB] bg-blue-50',
              };

              const Icons: Record<ToastType, React.ReactNode> = {
                success: <SuccessIcon className="w-4 h-4 text-emerald-600 shrink-0" />,
                error: <ErrorIcon className="w-4 h-4 text-rose-600 shrink-0" />,
                warning: <WarningIcon className="w-4 h-4 text-amber-600 shrink-0" />,
                info: <InfoIcon className="w-4 h-4 text-[#0082FB] shrink-0" />,
              };

              return (
                <div
                  key={toastItem.id}
                  className={`pointer-events-auto rounded-2xl border shadow-xl backdrop-blur-md p-3.5 flex items-start gap-3 transition-all duration-200 animate-in fade-in slide-in-from-top-2 ${borderColors[toastItem.type]}`}
                >
                  <div className={`p-1.5 rounded-xl shrink-0 ${iconColors[toastItem.type]}`}>
                    {Icons[toastItem.type]}
                  </div>

                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-xs font-semibold text-[#111827] leading-snug break-words">
                      {toastItem.message}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeToast(toastItem.id)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
                    title="Закрыть"
                  >
                    <CloseIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
