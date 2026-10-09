import React, { useState, useEffect } from 'react';
import { Database, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { SystemOutletContext } from '../AdminSystemLayout';

export const AdminSystemBackupsPage: React.FC = () => {
  const { showToast } = useOutletContext<SystemOutletContext>();
  const [backups, setBackups] = useState<any[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [downloadingBackup, setDownloadingBackup] = useState<string | null>(null);

  const fetchBackups = async () => {
    setLoadingBackups(true);
    try {
      const res = await apiClient.get('/system/backups');
      setBackups(res.data.backups || []);
    } catch (err) {
      console.error('Ошибка загрузки бэкапов', err);
    } finally {
      setLoadingBackups(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const res = await apiClient.post('/system/backups');
      showToast(`Бэкап ${res.data.backup?.fileName} успешно создан!`);
      fetchBackups();
    } catch (err: any) {
      showToast('Ошибка создания бэкапа базы данных', 'error');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleDownloadBackup = async (fileName: string) => {
    setDownloadingBackup(fileName);
    try {
      const res = await apiClient.get(`/system/backups/${encodeURIComponent(fileName)}/download`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/sql' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast(`Бэкап ${fileName} успешно скачан!`);
    } catch (err: any) {
      showToast('Ошибка скачивания файла бэкапа', 'error');
    } finally {
      setDownloadingBackup(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-extrabold text-[#111827]">Резервные копии базы данных (PostgreSQL)</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Дампы содержат все таблицы: заказы, маркировочные коды, шаблоны и учетные записи пользователей
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateBackup}
          disabled={creatingBackup}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          <Database className="w-3.5 h-3.5" />
          {creatingBackup ? 'Создается дамп...' : 'Создать бэкап сейчас'}
        </button>
      </div>

      {/* Backups Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-[#64748B] font-extrabold uppercase text-[11px] tracking-wider border-b border-gray-200">
            <tr>
              <th className="p-3.5">Имя архива</th>
              <th className="p-3.5">Размер файла</th>
              <th className="p-3.5">Дата создания</th>
              <th className="p-3.5 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium">
            {backups.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-[#64748B]">
                  {loadingBackups ? 'Загрузка списка архивов...' : 'Архивов бэкапов пока нет. Нажмите «Создать бэкап сейчас» для создания первого дампа.'}
                </td>
              </tr>
            ) : (
              backups.map((b) => (
                <tr key={b.fileName} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3.5 font-bold text-[#111827] font-mono">{b.fileName}</td>
                  <td className="p-3.5 text-[#64748B]">{b.sizeFormatted}</td>
                  <td className="p-3.5 text-[#64748B]">{new Date(b.createdAt).toLocaleString('ru-RU')}</td>
                  <td className="p-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleDownloadBackup(b.fileName)}
                      disabled={downloadingBackup === b.fileName}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0082FB] border border-blue-200/60 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Download className={`w-3.5 h-3.5 ${downloadingBackup === b.fileName ? 'animate-bounce' : ''}`} />
                      {downloadingBackup === b.fileName ? 'Скачивание...' : 'Скачать .sql'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSystemBackupsPage;
