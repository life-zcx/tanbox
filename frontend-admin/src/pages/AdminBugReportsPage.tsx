import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  Phone,
  Mail,
  Building2,
  Calendar,
  ExternalLink,
  Laptop,
  Image as ImageIcon,
  X,
  Copy,
  Check,
  RefreshCw,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { PageHeader, Modal } from '@shared';
import { apiClient } from '../api/client';

export interface ServiceLeadItem {
  id: string;
  serviceTitle: string;
  companyName: string;
  phone: string;
  email?: string;
  binIin?: string;
  notes?: string;
  status: 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export interface BugPayload {
  type: string;
  category?: string;
  categoryTitle?: string;
  description?: string;
  pageUrl?: string;
  screenResolution?: string;
  userAgent?: string;
  screenshotFileName?: string;
  screenshotPath?: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeStyle: string; selectStyle: string }
> = {
  NEW: {
    label: 'Новый',
    badgeStyle: 'bg-red-50 text-red-700 border-red-200',
    selectStyle: 'bg-red-50 text-red-700 border-red-200',
  },
  IN_PROGRESS: {
    label: 'В работе',
    badgeStyle: 'bg-amber-50 text-amber-800 border-amber-200',
    selectStyle: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  COMPLETED: {
    label: 'Исправлен',
    badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    selectStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  REJECTED: {
    label: 'Отклонен',
    badgeStyle: 'bg-gray-100 text-gray-700 border-gray-200',
    selectStyle: 'bg-gray-100 text-gray-700 border-gray-200',
  },
};

const parseBugPayload = (notes?: string | null): BugPayload => {
  if (!notes) return { type: 'BUG_REPORT' };
  try {
    const data = JSON.parse(notes);
    if (typeof data === 'object' && data !== null) {
      return data;
    }
  } catch {}
  return { type: 'BUG_REPORT', description: notes };
};

/**
 * Resolves screenshot URL with JWT authentication token for both local dev (localhost:5050) and production
 */
const resolveAttachmentUrl = (path?: string) => {
  if (!path) return '';
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('tanbox_admin_token') || localStorage.getItem('tanbox_token')
      : null;

  let cleanPath = path;
  if (cleanPath.includes('/uploads/bug-reports/')) {
    const filename = cleanPath.split('/uploads/bug-reports/').pop();
    cleanPath = `/api/support/bug-reports/attachment/${filename}`;
  }

  const isLocalDev =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  let fullUrl = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  if (isLocalDev && !fullUrl.startsWith('http')) {
    fullUrl = `http://localhost:5050${fullUrl}`;
  }

  if (token) {
    const sep = fullUrl.includes('?') ? '&' : '?';
    fullUrl = `${fullUrl}${sep}token=${encodeURIComponent(token)}`;
  }

  return fullUrl;
};

export const AdminBugReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ServiceLeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeModalReport, setActiveModalReport] = useState<{
    lead: ServiceLeadItem;
    bug: BugPayload;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/leads/admin', {
        params: { type: 'BUGS' },
      });
      const list: ServiceLeadItem[] = Array.isArray(res.data) ? res.data : [];
      setReports(list);
    } catch (err: any) {
      console.error('Failed to fetch bug reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setUpdatingId(leadId);
    try {
      await apiClient.patch(`/leads/admin/${leadId}`, { status: newStatus });
      setReports((prev) =>
        prev.map((r) => (r.id === leadId ? { ...r, status: newStatus as any } : r))
      );
      if (activeModalReport && activeModalReport.lead.id === leadId) {
        setActiveModalReport({
          ...activeModalReport,
          lead: { ...activeModalReport.lead, status: newStatus as any },
        });
      }
    } catch (err: any) {
      alert('Ошибка при обновлении статуса баг-репорта');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Distinct categories from reports
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      const bug = parseBugPayload(r.notes);
      if (bug.categoryTitle) set.add(bug.categoryTitle);
      else if (bug.category) set.add(bug.category);
    });
    return Array.from(set);
  }, [reports]);

  // Filter reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const bug = parseBugPayload(r.notes);
      const matchStatus = selectedStatus === 'ALL' || r.status === selectedStatus;
      const cat = bug.categoryTitle || bug.category || 'Другое';
      const matchCategory = selectedCategory === 'ALL' || cat === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        r.companyName.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.binIin && r.binIin.includes(q)) ||
        (bug.description && bug.description.toLowerCase().includes(q)) ||
        (bug.pageUrl && bug.pageUrl.toLowerCase().includes(q)) ||
        (bug.categoryTitle && bug.categoryTitle.toLowerCase().includes(q));

      return matchStatus && matchCategory && matchSearch;
    });
  }, [reports, selectedStatus, selectedCategory, searchQuery]);

  const newCount = reports.filter((r) => r.status === 'NEW').length;
  const inProgressCount = reports.filter((r) => r.status === 'IN_PROGRESS').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <PageHeader
            title="Баг-репорты"
            description="Реестр сообщений об ошибках и технические сбои от пользователей"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
              Всего: <strong>{reports.length}</strong>
            </span>
            {newCount > 0 && (
              <span className="text-xs font-bold text-red-700 bg-red-50 px-3 py-1.5 rounded-xl border border-red-200">
                Новых: <strong>{newCount}</strong>
              </span>
            )}
            {inProgressCount > 0 && (
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                В работе: <strong>{inProgressCount}</strong>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={fetchReports}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Обновить</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по ошибке, клиенту, телефону, ссылке..."
            className="w-full text-xs font-bold pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:border-black focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <SlidersHorizontal className="w-4 h-4 text-gray-400 shrink-0 hidden sm:block" />

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs font-bold bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 focus:border-black focus:outline-none cursor-pointer"
          >
            <option value="ALL">Все статусы ({reports.length})</option>
            <option value="NEW">Новые ({newCount})</option>
            <option value="IN_PROGRESS">В работе ({inProgressCount})</option>
            <option value="COMPLETED">Исправлены</option>
            <option value="REJECTED">Отклонены</option>
          </select>

          {/* Category Filter */}
          {categoriesList.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs font-bold bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 focus:border-black focus:outline-none cursor-pointer"
            >
              <option value="ALL">Все категории</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="text-center py-12 text-gray-500 text-xs font-semibold flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
            <span>Загрузка данных...</span>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs font-semibold">
            Баг-репорты не найдены.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-44">Категория / Дата</th>
                  <th className="py-3.5 px-4 w-52">Клиент</th>
                  <th className="py-3.5 px-4">Описание проблемы</th>
                  <th className="py-3.5 px-4 w-48">Страница</th>
                  <th className="py-3.5 px-4 w-28 text-center">Скриншот</th>
                  <th className="py-3.5 px-4 w-36">Статус</th>
                  <th className="py-3.5 px-4 w-24 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-semibold">
                {filteredReports.map((report) => {
                  const bug = parseBugPayload(report.notes);
                  const stConfig = STATUS_CONFIG[report.status] || {
                    label: report.status,
                    badgeStyle: 'bg-gray-100 text-gray-700 border-gray-200',
                    selectStyle: 'bg-gray-50 text-gray-700 border-gray-300',
                  };
                  const categoryLabel = bug.categoryTitle || bug.category || 'Общая ошибка';
                  const screenshotUrl = resolveAttachmentUrl(bug.screenshotPath);
                  const isUpdating = updatingId === report.id;

                  return (
                    <tr key={report.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Category & Date */}
                      <td className="py-3.5 px-4 align-top">
                        <span className="inline-block text-[11px] font-extrabold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200 mb-1">
                          {categoryLabel}
                        </span>
                        <div className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                          <span>
                            {new Date(report.createdAt).toLocaleDateString('ru-RU')},{' '}
                            {new Date(report.createdAt).toLocaleTimeString('ru-RU', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </td>

                      {/* User & Company */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5 break-words">
                          <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{report.companyName}</span>
                        </div>
                        <div className="mt-1 space-y-0.5 text-[11px]">
                          <a
                            href={`tel:${report.phone}`}
                            className="font-bold text-[#0082FB] hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3 shrink-0" />
                            <span>{report.phone}</span>
                          </a>
                          {report.email && (
                            <a
                              href={`mailto:${report.email}`}
                              className="font-medium text-gray-500 hover:underline flex items-center gap-1"
                            >
                              <Mail className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[170px]">{report.email}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Error Description */}
                      <td className="py-3.5 px-4 align-top">
                        <div
                          onClick={() => setActiveModalReport({ lead: report, bug })}
                          className="text-xs text-gray-800 line-clamp-2 leading-relaxed cursor-pointer hover:text-black font-normal"
                          title="Нажмите, чтобы открыть подробности"
                        >
                          {bug.description || report.notes || '—'}
                        </div>
                      </td>

                      {/* Page URL & Screen Resolution */}
                      <td className="py-3.5 px-4 align-top text-xs">
                        {bug.pageUrl ? (
                          <div
                            className="text-gray-600 font-mono text-[11px] truncate max-w-[180px] hover:text-black"
                            title={bug.pageUrl}
                          >
                            {bug.pageUrl.replace(/^https?:\/\/[^/]+/, '') || bug.pageUrl}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">—</span>
                        )}

                        {bug.screenResolution && (
                          <div className="flex items-center gap-1 text-gray-400 text-[10px] mt-0.5 font-medium">
                            <Laptop className="w-3 h-3" />
                            <span>{bug.screenResolution}</span>
                          </div>
                        )}
                      </td>

                      {/* Screenshot */}
                      <td className="py-3.5 px-4 align-top text-center whitespace-nowrap">
                        {screenshotUrl ? (
                          <button
                            type="button"
                            onClick={() => setActiveModalReport({ lead: report, bug })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#0082FB] border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Скриншот</span>
                          </button>
                        ) : (
                          <span className="text-gray-300 font-bold">—</span>
                        )}
                      </td>

                      {/* Status (Single interactive dropdown) */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <select
                          disabled={isUpdating}
                          value={report.status}
                          onChange={(e) => handleStatusChange(report.id, e.target.value)}
                          className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none transition-all ${stConfig.selectStyle} ${
                            isUpdating ? 'opacity-50' : ''
                          }`}
                        >
                          <option value="NEW">Новый</option>
                          <option value="IN_PROGRESS">В работе</option>
                          <option value="COMPLETED">Исправлен</option>
                          <option value="REJECTED">Отклонен</option>
                        </select>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setActiveModalReport({ lead: report, bug })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-500" />
                          <span>Детали</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {activeModalReport && (
        <Modal
          isOpen={Boolean(activeModalReport)}
          onClose={() => setActiveModalReport(null)}
          className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold text-gray-800 bg-white px-2.5 py-0.5 rounded-md border border-gray-200">
                  {activeModalReport.bug.categoryTitle || activeModalReport.bug.category || 'Инцидент'}
                </span>
                <span
                  className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border ${
                    STATUS_CONFIG[activeModalReport.lead.status]?.badgeStyle || 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {STATUS_CONFIG[activeModalReport.lead.status]?.label || activeModalReport.lead.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                Отправлен {new Date(activeModalReport.lead.createdAt).toLocaleString('ru-RU')}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveModalReport(null)}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* Client info card */}
            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-400 block text-[11px] font-medium">Компания:</span>
                <span className="font-extrabold text-gray-900">{activeModalReport.lead.companyName}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px] font-medium">Телефон:</span>
                <a
                  href={`tel:${activeModalReport.lead.phone}`}
                  className="font-bold text-[#0082FB] hover:underline"
                >
                  {activeModalReport.lead.phone}
                </a>
              </div>
              {activeModalReport.lead.email && (
                <div>
                  <span className="text-gray-400 block text-[11px] font-medium">Email:</span>
                  <a
                    href={`mailto:${activeModalReport.lead.email}`}
                    className="font-bold text-gray-900 hover:underline"
                  >
                    {activeModalReport.lead.email}
                  </a>
                </div>
              )}
              {activeModalReport.lead.binIin && (
                <div>
                  <span className="text-gray-400 block text-[11px] font-medium">БИН/ИИН:</span>
                  <span className="font-mono font-bold text-gray-900">{activeModalReport.lead.binIin}</span>
                </div>
              )}
            </div>

            {/* Error Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                  Описание ошибки:
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(activeModalReport.bug.description || activeModalReport.lead.notes || '')
                  }
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-black cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Скопировано' : 'Копировать'}</span>
                </button>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-3.5 text-xs text-gray-900 leading-relaxed whitespace-pre-wrap font-sans select-text">
                {activeModalReport.bug.description || activeModalReport.lead.notes || 'Без описания'}
              </div>
            </div>

            {/* Technical Context */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2 text-xs">
              <span className="font-extrabold text-slate-800 uppercase tracking-wider block text-[11px]">
                Окружение и экран:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-slate-400">Страница:</span>{' '}
                  <span className="font-mono font-bold text-slate-900 break-all">
                    {activeModalReport.bug.pageUrl || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Разрешение:</span>{' '}
                  <span className="font-mono font-bold text-slate-900">
                    {activeModalReport.bug.screenResolution || '—'}
                  </span>
                </div>
              </div>
              {activeModalReport.bug.userAgent && (
                <div className="text-[11px] text-slate-500 break-all font-mono pt-1.5 border-t border-slate-200">
                  <span className="text-slate-400">User-Agent:</span> {activeModalReport.bug.userAgent}
                </div>
              )}
            </div>

            {/* Attached Screenshot */}
            {activeModalReport.bug.screenshotPath && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                    Скриншот пользователя:
                  </span>
                  <a
                    href={resolveAttachmentUrl(activeModalReport.bug.screenshotPath)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#0082FB] font-bold hover:underline"
                  >
                    <span>Открыть оригинал</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center p-2">
                  <img
                    src={resolveAttachmentUrl(activeModalReport.bug.screenshotPath)}
                    alt="Скриншот ошибки"
                    className="max-h-[350px] w-auto object-contain rounded-lg shadow-xs"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.dataset.triedFallback && activeModalReport.bug.screenshotPath) {
                        target.dataset.triedFallback = 'true';
                        target.src = activeModalReport.bug.screenshotPath;
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-600">Статус:</span>
              <select
                disabled={updatingId === activeModalReport.lead.id}
                value={activeModalReport.lead.status}
                onChange={(e) => handleStatusChange(activeModalReport.lead.id, e.target.value)}
                className="bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-900 px-3 py-1.5 focus:border-black focus:outline-none cursor-pointer"
              >
                <option value="NEW">Новый</option>
                <option value="IN_PROGRESS">В работе</option>
                <option value="COMPLETED">Исправлен</option>
                <option value="REJECTED">Отклонен</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setActiveModalReport(null)}
              className="px-4 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Закрыть
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminBugReportsPage;
