import React, { useState } from 'react';
import { AlertTriangle, HardDrive, FileText, CheckCircle2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { SystemOutletContext } from '../AdminSystemLayout';

export const AdminSystemStoragePage: React.FC = () => {
  const { storage, refreshSystem, showToast } = useOutletContext<SystemOutletContext>();
  const [cleaningCache, setCleaningCache] = useState(false);

  const handleCleanPdfCache = async () => {
    if (!window.confirm('Очистить сгенерированные кэш-файлы PDF на сервере? Исходные коды в базе данных останутся нетронутыми.')) {
      return;
    }
    setCleaningCache(true);
    try {
      const res = await apiClient.post('/system/storage/clean-cache');
      showToast(res.data.message || 'Кэш успешно очищен');
      if (refreshSystem) {
        await refreshSystem();
      }
    } catch (err) {
      showToast('Ошибка очистки кэша', 'error');
    } finally {
      setCleaningCache(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
      <div>
        <h2 className="text-sm font-extrabold text-[#111827]">Управление дисковым пространством и кэшем</h2>
        <p className="text-xs text-[#64748B] mt-0.5">
          Очистка временных сгенерированных PDF-файлов освобождает место на SSD сервере
        </p>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-extrabold text-amber-900">Безопасная очистка кэша PDF этикеток</h4>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              Удалит сгенерированные файлы <code>labels.pdf</code> из папки заказов. Сами коды маркировки в базе данных останутся в безопасности и при повторном скачивании PDF сгенерируется заново.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCleanPdfCache}
          disabled={cleaningCache}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer disabled:opacity-50"
        >
          {cleaningCache ? 'Очищается...' : 'Очистить кэш PDF'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0082FB]" />
            <span className="font-bold text-[#111827]">Файлы кодов клиентов (.csv, .txt):</span>
          </div>
          <div className="text-xl font-extrabold text-[#0082FB] mt-2">
            {storage?.uploads?.totalCsvCount || 0} шт
          </div>
          <div className="text-xs text-[#64748B] mt-0.5">
            Общий размер: {storage?.uploads?.totalCsvSizeFormatted || '0 МБ'}
          </div>
        </div>

        <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-purple-600" />
            <span className="font-bold text-[#111827]">Сгенерированные файлы PDF:</span>
          </div>
          <div className="text-xl font-extrabold text-purple-600 mt-2">
            {storage?.uploads?.totalPdfCount || 0} шт
          </div>
          <div className="text-xs text-[#64748B] mt-0.5">
            Общий размер: {storage?.uploads?.totalPdfSizeFormatted || '0 МБ'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSystemStoragePage;
