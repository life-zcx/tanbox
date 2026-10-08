import React, { useState, useEffect } from 'react';
import {
  Package,
  AlertCircle,
  CheckCircle2,
  Send,
  Copy,
  ArrowRight,
  ShieldCheck,
  Printer,
  Download,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@shared';
import { apiClient } from '../api/client';
import { MarkirovkaNav } from '../components/markirovka/MarkirovkaNav';

interface MarkirovkaAccount {
  id: string;
  name: string;
  environment: 'TEST' | 'PROD';
  login: string;
}

interface CategoryOption {
  key: string;
  label: string;
  extension: string;
}

export const AdminMarkirovkaOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<MarkirovkaAccount[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [orderAccountId, setOrderAccountId] = useState('');
  const [orderCategory, setOrderCategory] = useState('OILS');
  const [orderGtin, setOrderGtin] = useState('05055107433614');
  const [orderQuantity, setOrderQuantity] = useState(5);
  const [orderSerialType, setOrderSerialType] = useState<'OPERATOR' | 'SELF_MADE'>('OPERATOR');
  const [isOrdering, setIsOrdering] = useState(false);

  // Result State
  const [orderResult, setOrderResult] = useState<{
    success: boolean;
    orderId?: string;
    message: string;
    codes?: string[];
  } | null>(null);

  // Toast
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/markirovka/accounts');
        setAccounts(res.data.accounts || []);
        setCategories(res.data.categories || []);
        if (res.data.accounts?.length > 0) {
          setOrderAccountId(res.data.accounts[0].id);
        }
      } catch (err: any) {
        showToast(err.response?.data?.message || 'Ошибка загрузки данных', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderAccountId) {
      showToast('Выберите подключенный аккаунт', 'error');
      return;
    }
    if (!orderGtin || orderGtin.trim().length < 8) {
      showToast('Укажите корректный GTIN товара', 'error');
      return;
    }
    if (orderQuantity < 1 || orderQuantity > 150000) {
      showToast('Количество кодов должно быть от 1 до 150 000', 'error');
      return;
    }

    try {
      setIsOrdering(true);
      setOrderResult(null);

      const res = await apiClient.post('/markirovka/sandbox/order-codes', {
        accountId: orderAccountId,
        category: orderCategory,
        gtin: orderGtin.trim(),
        quantity: Number(orderQuantity),
        serialNumberType: orderSerialType,
      });

      setOrderResult(res.data);
      showToast(res.data.message || 'Заказ успешно отправлен в ИС МПТ', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Ошибка создания заказа кодов';
      setOrderResult({ success: false, message: msg });
      showToast(msg, 'error');
    } finally {
      setIsOrdering(false);
    }
  };

  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);

  const handleDownloadPdf = async () => {
    if (!orderResult?.codes || orderResult.codes.length === 0) return;
    setDownloadingPdf(true);
    try {
      const res = await apiClient.post(
        '/markirovka/generate-labels-pdf',
        {
          codes: orderResult.codes,
          gtin: orderGtin,
          templateType: '58x40',
        },
        { responseType: 'blob' }
      );
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tanbox-labels-58x40-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('PDF этикеток успешно сгенерирован и скачан', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Ошибка генерации PDF этикеток', 'error');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleGoToUtilisation = () => {
    if (!orderResult?.codes) return;
    navigate('/markirovka/utilisation', {
      state: {
        accountId: orderAccountId,
        category: orderCategory,
        gtin: orderGtin,
        codes: orderResult.codes,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold transition-all animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Заказ кодов маркировки (Эмиссия)"
        description="Формирование и отправка заказов на генерацию кодов DataMatrix в систему маркировки Казахстана"
      />

      {/* Navigation Tabs */}
      <MarkirovkaNav />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Column */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5 border-b border-gray-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0082FB] flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-black">Параметры эмиссии кодов</h3>
              <p className="text-xs text-gray-500">Заказ отправляется в шлюз СУЗ ИС МПТ</p>
            </div>
          </div>

          <form onSubmit={handleCreateOrder} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Аккаунт Markirovka.kz *
              </label>
              <select
                value={orderAccountId}
                onChange={(e) => setOrderAccountId(e.target.value)}
                disabled={accounts.length === 0}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-900 bg-white focus:outline-none focus:border-[#0082FB]"
              >
                {accounts.length === 0 ? (
                  <option value="">Нет подключенных аккаунтов (добавьте на вкладке Аккаунты)</option>
                ) : (
                  accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.environment} — {acc.login})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  Товарная группа *
                </label>
                <select
                  value={orderCategory}
                  onChange={(e) => setOrderCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-900 bg-white focus:outline-none focus:border-[#0082FB]"
                >
                  {categories.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  GTIN товара (штрихкод) *
                </label>
                <input
                  type="text"
                  required
                  value={orderGtin}
                  onChange={(e) => setOrderGtin(e.target.value)}
                  placeholder="05055107433614"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold font-mono text-gray-900 focus:outline-none focus:border-[#0082FB]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  Количество кодов *
                </label>
                <input
                  type="number"
                  min="1"
                  max="150000"
                  required
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#0082FB]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  Генерация серийных номеров
                </label>
                <select
                  value={orderSerialType}
                  onChange={(e) => setOrderSerialType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-900 bg-white focus:outline-none focus:border-[#0082FB]"
                >
                  <option value="OPERATOR">Оператор ИС МПТ (автоматически)</option>
                  <option value="SELF_MADE">Собственная генерация</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isOrdering || accounts.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0082FB] hover:bg-[#0072DD] text-white text-xs font-extrabold shadow-md shadow-[#0082FB]/20 transition-all active:scale-95 disabled:opacity-50"
              >
                <Send className={`w-4 h-4 ${isOrdering ? 'animate-pulse' : ''}`} />
                {isOrdering ? 'Отправка заказа в СУЗ ИС МПТ...' : 'Заказать коды маркировки'}
              </button>
            </div>
          </form>
        </div>

        {/* Result Column */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-black mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0082FB]" />
              Результат заказа и пул кодов
            </h3>

            {!orderResult ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gray-200 rounded-xl">
                <Package className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-xs text-gray-400 font-medium max-w-xs">
                  Заполните форму слева и нажмите «Заказать коды», чтобы получить коды маркировки
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-xl border text-xs ${
                    orderResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <div className="font-extrabold mb-1">
                    {orderResult.success ? 'Успешный ответ ИС МПТ:' : 'Ошибка при заказе:'}
                  </div>
                  <div className="text-[11px] break-all">{orderResult.message}</div>
                  {orderResult.orderId && (
                    <div className="mt-2 text-[11px] font-mono font-bold">
                      ID заказа в СУЗ: {orderResult.orderId}
                    </div>
                  )}
                </div>

                {orderResult.codes && orderResult.codes.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-2">
                      <span>Полученные коды DataMatrix ({orderResult.codes.length} шт):</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(orderResult.codes?.join('\n') || '');
                          showToast('Коды скопированы в буфер', 'success');
                        }}
                        className="flex items-center gap-1 text-[#0082FB] hover:underline cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Копировать все
                      </button>
                    </div>

                    <div className="bg-gray-900 text-emerald-400 p-4 rounded-xl font-mono text-[11px] max-h-56 overflow-y-auto space-y-1 select-all border border-gray-800">
                      {orderResult.codes.map((code, idx) => (
                        <div key={idx} className="truncate">
                          <span className="text-gray-500 mr-2">{idx + 1}.</span>
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {orderResult?.codes && orderResult.codes.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-extrabold shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {downloadingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Генерация PDF...
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4 text-[#0082FB]" />
                    Скачать этикетки PDF (58×40 мм)
                  </>
                )}
              </button>

              <button
                onClick={handleGoToUtilisation}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
              >
                В отчет о нанесении
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
