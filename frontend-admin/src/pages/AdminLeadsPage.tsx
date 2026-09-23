import React, { useState } from 'react';
import { useAdminLeads, ServiceLeadItem } from '../hooks/useAdminLeads';
import { Search, Filter, ChevronDown, Phone, Mail, Building2, Calendar, FileText, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { PageHeader } from '@shared';

const STATUS_CONFIG: Record<string, { label: string; badgeStyle: string }> = {
  NEW: { label: 'Новая', badgeStyle: 'bg-blue-50 text-[#0082FB] border-blue-200/80' },
  IN_PROGRESS: { label: 'В работе', badgeStyle: 'bg-amber-50 text-amber-800 border-amber-200/80' },
  COMPLETED: { label: 'Завершена', badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200/80' },
  REJECTED: { label: 'Отклонена', badgeStyle: 'bg-red-50 text-red-700 border-red-200/80' },
};

export const AdminLeadsPage: React.FC = () => {
  const { leads, loading, updateLeadStatus } = useAdminLeads();
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredLeads = leads.filter((l) => {
    const matchStatus = selectedStatus === 'ALL' || l.status === selectedStatus;
    const matchSearch =
      l.serviceTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.phone.includes(searchQuery) ||
      (l.binIin || '').includes(searchQuery);
    return matchStatus && matchSearch;
  });

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setUpdatingId(leadId);
    try {
      await updateLeadStatus(leadId, newStatus);
    } catch (err) {
      alert('Ошибка обновления статуса заявки');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Заявки на услуги"
        description="Реестр обращений с главной страницы и карточек услуг для обработки менеджерами"
      />

      {/* Filter Bar */}
      <div className="bg-white border border-gray-100 rounded-3xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
        
        {/* Status Dropdown Filter */}
        <div className="relative w-full md:w-64">
          <div className="absolute left-3.5 top-3 pointer-events-none text-[#64748B] flex items-center gap-1.5 text-xs font-bold">
            <Filter className="w-3.5 h-3.5 text-[#0082FB]" />
            <span className="text-[#64748B]">Статус:</span>
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-[#F4F6F9] border border-gray-200/80 rounded-xl pl-20 pr-8 py-2.5 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0082FB] appearance-none cursor-pointer"
          >
            <option value="ALL">Все заявки ({leads.length})</option>
            <option value="NEW">Новые</option>
            <option value="IN_PROGRESS">В работе</option>
            <option value="COMPLETED">Завершены</option>
            <option value="REJECTED">Отклонены</option>
          </select>
          <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-3 top-3 pointer-events-none" />
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Поиск по компании, телефону, услуге..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F4F6F9] border border-gray-200/80 rounded-xl pl-10 pr-3 py-2.5 text-xs font-medium text-[#111827] focus:outline-none focus:border-[#0082FB]"
          />
        </div>

      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-12 text-[#64748B] text-sm">Загрузка заявок...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-12 text-[#64748B] text-sm font-normal">Заявки не найдены.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F4F6F9]/60 border-b border-gray-100 text-xs font-extrabold text-[#64748B] uppercase tracking-wider">
                  <th className="py-4 px-5">Дата и Услуга</th>
                  <th className="py-4 px-5">Компания / Клиент</th>
                  <th className="py-4 px-5">Контакты</th>
                  <th className="py-4 px-5">Примечание</th>
                  <th className="py-4 px-5">Статус</th>
                  <th className="py-4 px-5 text-right">Управление статусом</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm font-semibold">
                {filteredLeads.map((lead) => {
                  const stConfig = STATUS_CONFIG[lead.status] || {
                    label: lead.status,
                    badgeStyle: 'bg-gray-100 text-gray-700',
                  };

                  return (
                    <tr key={lead.id} className="hover:bg-[#F4F6F9]/50 transition-colors">
                      
                      {/* Date & Service */}
                      <td className="py-4 px-5">
                        <div className="text-xs text-[#64748B] flex items-center gap-1 font-normal mb-1">
                          <Calendar className="w-3.5 h-3.5 text-[#0082FB]" />
                          {new Date(lead.createdAt).toLocaleDateString('ru-RU')} в {new Date(lead.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-sm font-extrabold text-[#111827]">
                          {lead.serviceTitle}
                        </div>
                      </td>

                      {/* Company & BIN */}
                      <td className="py-4 px-5">
                        <div className="text-sm font-extrabold text-[#111827] flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-[#0082FB] shrink-0" />
                          <span>{lead.companyName}</span>
                        </div>
                        {lead.binIin && (
                          <div className="text-xs font-mono text-[#64748B] mt-0.5">
                            БИН/ИИН: {lead.binIin}
                          </div>
                        )}
                      </td>

                      {/* Contacts */}
                      <td className="py-4 px-5">
                        <a href={`tel:${lead.phone}`} className="text-xs font-bold text-[#0082FB] hover:underline flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" />
                          {lead.phone}
                        </a>
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} className="text-xs font-medium text-[#64748B] hover:underline flex items-center gap-1.5 mt-1">
                            <Mail className="w-3.5 h-3.5" />
                            {lead.email}
                          </a>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="py-4 px-5">
                        {lead.notes ? (
                          <p className="text-xs text-[#475569] max-w-xs leading-relaxed bg-[#F4F6F9] p-2.5 rounded-xl border border-gray-100">
                            {lead.notes}
                          </p>
                        ) : (
                          <span className="text-xs text-[#64748B] font-normal italic">Без комментария</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center text-[11px] font-extrabold px-3 py-1 rounded-full border ${stConfig.badgeStyle}`}>
                          {stConfig.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <select
                          disabled={updatingId === lead.id}
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          className="bg-[#F4F6F9] border border-gray-200/80 rounded-xl text-xs font-bold text-[#111827] px-3 py-1.5 focus:outline-none focus:border-[#0082FB] cursor-pointer"
                        >
                          <option value="NEW">Новая</option>
                          <option value="IN_PROGRESS">В работе</option>
                          <option value="COMPLETED">Завершена</option>
                          <option value="REJECTED">Отклонена</option>
                        </select>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
