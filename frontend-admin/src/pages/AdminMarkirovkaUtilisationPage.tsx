import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  Send,
  Download,
  Package,
  ShieldCheck,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
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

export const AdminMarkirovkaUtilisationPage: React.FC = () => {
  const location = useLocation();

  const [accounts, setAccounts] = useState<MarkirovkaAccount[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  // Form State
  const [reportAccountId, setReportAccountId] = useState('');
  const [reportCategory, setReportCategory] = useState('OILS');
  const [reportGtin, setReportGtin] = useState('');
  const [reportCodesText, setReportCodesText] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Result State
  const [reportResult, setReportResult] = useState<{
    success: boolean;
    reportId?: string;
    message: string;
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
        const [accRes, actRes] = await Promise.all([
          apiClient.get('/markirovka/accounts'),
          apiClient.get('/markirovka/activity'),
        ]);

        const accList = accRes.data.accounts || [];
        setAccounts(accList);
        setCategories(accRes.data.categories || []);
        setRecentOrders(actRes.data.orders || []);

        if (accList.length > 0 && !reportAccountId) {
          setReportAccountId(accList[0].id);
        }
      } catch (err: any) {
        showToast(err.response?.data?.message || 'Ошибка загрузки данных', 'error');
      }
    };
    fetchData();
  }, []);

  // Listen to navigation state from Orders page or Activity page
  useEffect(() => {
    if (location.state) {
      const s = location.state as any;
      if (s.accountId) setReportAccountId(s.accountId);
      if (s.category) setReportCategory(s.category);
      if (s.gtin) setReportGtin(s.gtin);
      if (s.codes && Array.isArray(s.codes)) {
        setReportCodesText(s.codes.join('\n'));
        showToast(`Загружено ${s.codes.length} кодов из заказа!`, 'success');
      }
    }
  }, [location.state]);

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    const ord = recentOrders.find((o) => o.id === orderId);
    if (!ord) return;

    if (ord.accountId) setReportAccountId(ord.accountId);
    if (ord.category) setReportCategory(ord.category);
    if (ord.gtin) setReportGtin(ord.gtin);
    const codesList = Array.isArray(ord.codes) ? ord.codes : [];
    setReportCodesText(codesList.join('\n'));
    showToast(`Загружено ${codesList.length} кодов из заказа ${ord.externalOrderId || ord.id.slice(0, 8)}`, 'success');
  };

  const handleSubmitUtilisation = async () => {
    const codes = reportCodesText
      .split('\n')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (codes.length === 0) {
      showToast('Вставьте хотя бы один код маркировки', 'error');
      return;
    }
    if (!reportAccountId) {
      showToast('Выберите аккаунт', 'error');
      return;
    }

    try {
      setIsSubmittingReport(true);
      setReportResult(null);

      const res = await apiClient.post('/markirovka/sandbox/utilisation', {
        accountId: reportAccountId,
        category: reportCategory,
        gtin: reportGtin || undefined,
        codes,
        format: 'api',
      });

      setReportResult(res.data);
      showToast(res.data.message || 'Отчет успешно принят ИС МПТ', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Ошибка отправки отчета о нанесении';
      setReportResult({ success: false, message: msg });
      showToast(msg, 'error');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleDownloadUtilisationCsv = async () => {
    const codes = reportCodesText
      .split('\n')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (codes.length === 0) {
      showToast('Вставьте хотя бы один код маркировки', 'error');
      return;
    }

    try {
      const res = await apiClient.post(
        '/markirovka/sandbox/utilisation',
        {
          category: reportCategory,
          gtin: reportGtin || undefined,
          codes,
          format: 'csv',
        },
        { responseType: 'blob' }
      );

      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `utilisation_report_${reportCategory}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('CSV-отчет успешно скачан', 'success');
    } catch (err: any) {
      showToast('Ошибка выгрузки CSV', 'error');
    }
  };

  const ordersWithCodes = recentOrders.filter((o) => o.codes && o.codes.length > 0);

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
        title="Отчет о нанесении кодов маркировки (Утилизация)"
        description="Регистрация факта нанесения кодов в ИС МПТ (перевод кодов из статуса «Эмитирован» в «Нанесен»)"
      />

      {/* Navigation Tabs */}
      <MarkirovkaNav />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Column */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5 border-b border-gray-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-black">Параметры отчета о нанесении</h3>
              <p className="text-xs text-gray-500">Метод utilisation шлюза ИС МПТ</p>
            </div>
          </div>

          {/* Quick Order Selection Card */}
          <div className="bg-gradient-to-r from-emerald-50/80 to-blue-50/60 border border-emerald-200 p-3.5 rounded-xl mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-black text-emerald-950 uppercase flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-emerald-600" />
                Быстрый выбор из готового заказа:
              </label>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded-full">
                {ordersWithCodes.length} заказов с кодами
              </span>
            </div>
            <select
              value={selectedOrderId}
              onChange={(e) => handleSelectOrder(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-emerald-300 text-xs font-bold text-gray-900 bg-white focus:outline-none focus:border-emerald-600 shadow-sm"
            >
              <option value="">-- Выберите заказ для мгновенной подстановки всех данных --</option>
              {ordersWithCodes.map((o: any) => (
                <option key={o.id} value={o.id}>
                  {new Date(o.createdAt).toLocaleDateString('ru-RU')} — {o.account?.name || 'Аккаунт'} — {o.category} — {o.codes.length} кодов (GTIN: {o.gtin})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Учетная запись (Аккаунт) *
              </label>
              <select
                value={reportAccountId}
                onChange={(e) => setReportAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-900 bg-white focus:outline-none focus:border-[#0082FB]"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.environment} — {acc.login})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  Товарная группа *
                </label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
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
                  GTIN (опционально)
                </label>
                <input
                  type="text"
                  value={reportGtin}
                  onChange={(e) => setReportGtin(e.target.value)}
                  placeholder="05055107433614"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold font-mono text-gray-900 focus:outline-none focus:border-[#0082FB]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase">
                  Нанесенные коды DataMatrix (по одному на строку) *
                </label>
                <span className="text-[10px] text-gray-400 font-bold">
                  Кодов: {reportCodesText.split('\n').filter((c) => c.trim()).length}
                </span>
              </div>
              <textarea
                rows={8}
                value={reportCodesText}
                onChange={(e) => setReportCodesText(e.target.value)}
                placeholder="010505510743361421...&#10;010505510743361421..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-mono text-gray-900 focus:outline-none focus:border-[#0082FB]"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleSubmitUtilisation}
                disabled={isSubmittingReport}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
              >
                <Send className={`w-4 h-4 ${isSubmittingReport ? 'animate-pulse' : ''}`} />
                {isSubmittingReport ? 'Отправка в ИС МПТ...' : 'Отправить отчет в API'}
              </button>

              <button
                type="button"
                onClick={handleDownloadUtilisationCsv}
                className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all active:scale-95"
              >
                <Download className="w-4 h-4 text-gray-500" />
                Скачать CSV-файл
              </button>
            </div>
          </div>
        </div>

        {/* Right Info & Status Column */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-black mb-4">Статус обработки отчета о нанесении</h3>

            {!reportResult ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gray-200 rounded-xl">
                <FileCheck2 className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-xs text-gray-400 font-medium max-w-xs">
                  После отправки отчета здесь отобразится официальный номер документа и статус из ИС МПТ
                </p>
              </div>
            ) : (
              <div
                className={`p-4 rounded-xl border text-xs ${
                  reportResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <div className="font-extrabold mb-1">
                  {reportResult.success ? 'Отчет успешно принят ИС МПТ:' : 'Ошибка при отправке отчета:'}
                </div>
                <div className="text-[11px] break-all">{reportResult.message}</div>
                {reportResult.reportId && (
                  <div className="mt-2 text-[11px] font-mono font-bold">
                    ID документа в ИС МПТ: {reportResult.reportId}
                  </div>
                )}
              </div>
            )}

            {/* Informative Help Box */}
            <div className="mt-6 p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0082FB]" />
                Как работает отчет о нанесении в Казахстане:
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                1. Коды маркировки после печати наносятся на товар на складе Tanbox или клиентом.
                <br />
                2. Отчет <b>UTILISATION</b> регистрирует в СУЗ перечень только качественных (нанесенных) кодов, переводя
                их из статуса «Эмитирован» в статус «Нанесен».
                <br />
                3. Документ сразу отображается во вкладке «Операции с кодами» на портале markirovka.kz со статусом «Обработано успешно».
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
