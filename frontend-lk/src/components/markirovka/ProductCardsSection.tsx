import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  RefreshCw,
  Send,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Eye,
  X,
  Building2,
  Tag,
  Scale,
  FileCheck,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { CreateProductCardModal } from './CreateProductCardModal';

export const ProductCardsSection: React.FC = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [counts, setCounts] = useState<Record<string, number>>({
    ALL: 0,
    DRAFT: 0,
    PENDING_MODERATION: 0,
    APPROVED: 0,
    REJECTED: 0,
  });
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [accountFilter, setAccountFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<any | null>(null);
  const [cardToView, setCardToView] = useState<any | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [copiedGtin, setCopiedGtin] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load filter options (accounts & categories)
  useEffect(() => {
    Promise.all([
      apiClient.get('/markirovka/accounts').catch(() => ({ data: { accounts: [] } })),
      apiClient.get('/markirovka/cards/categories').catch(() => ({ data: { categories: [] } })),
    ]).then(([accRes, catRes]) => {
      setAccounts(accRes.data?.accounts || []);
      setCategories(catRes.data?.categories || []);
    });
  }, []);

  const fetchCards = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (accountFilter !== 'ALL') params.accountId = accountFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await apiClient.get('/markirovka/cards', { params });
      setCards(res.data?.cards || []);
      if (res.data?.counts) {
        setCounts(res.data.counts);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Ошибка загрузки карточек товаров', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, accountFilter, searchQuery]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleSubmitNkt = async (cardId: string) => {
    try {
      setActionLoadingId(cardId);
      const res = await apiClient.post(`/markirovka/cards/${cardId}/submit-nkt`);
      showToast(res.data?.message || 'Заявка отправлена в Национальный каталог', 'success');
      fetchCards();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Ошибка отправки в НКТ', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCheckStatus = async (cardId: string) => {
    try {
      setActionLoadingId(cardId);
      const res = await apiClient.get(`/markirovka/cards/${cardId}/check-status`);
      const status = res.data?.card?.status;
      if (status === 'APPROVED') {
        showToast(`Карточка одобрена в НКТ! Присвоен GTIN: ${res.data?.card?.gtin}`, 'success');
      } else if (status === 'REJECTED') {
        showToast(
          `Карточка отклонена: ${res.data?.card?.moderationComment || 'Требуется исправление'}`,
          'error'
        );
      } else {
        showToast('Карточка находится на рассмотрении модератором НКТ', 'success');
      }
      fetchCards();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Ошибка проверки статуса', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (cardId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту карточку товара?')) return;
    try {
      setActionLoadingId(cardId);
      await apiClient.delete(`/markirovka/cards/${cardId}`);
      showToast('Карточка успешно удалена', 'success');
      fetchCards();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Ошибка удаления карточки', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const copyGtin = (gtin: string) => {
    navigator.clipboard.writeText(gtin);
    setCopiedGtin(gtin);
    setTimeout(() => setCopiedGtin(null), 2000);
  };

  const getStatusBadge = (card: any) => {
    switch (card.status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Одобрен (GTIN получен)</span>
          </span>
        );
      case 'PENDING_MODERATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            <span>На модерации в НКТ</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Отклонен модератором</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            <span>Черновик</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Top Action Header */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0082FB] flex items-center justify-center border border-blue-100 shrink-0">
              <Package className="w-5 h-5 text-[#0082FB]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Реестр карточек товаров (НКТ / Маркировка)</h2>
              <p className="text-xs text-gray-500">
                Создание описаний товаров для получения официальных GTIN и заказа DataMatrix
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchCards()}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-[#0082FB] hover:bg-blue-50 border border-gray-200 rounded-xl transition-colors cursor-pointer"
              title="Обновить список"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0082FB]' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => {
                setCardToEdit(null);
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#0082FB] hover:bg-[#0070D8] text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer shadow-md shadow-blue-500/10"
            >
              <Plus className="w-4 h-4" />
              <span>Создать карточку товара</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row: Account + Category + Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">
              Аккаунт маркировки
            </label>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0082FB] focus:ring-1 focus:ring-[#0082FB] transition-all"
            >
              <option value="ALL">Все аккаунты клиентов</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.login})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">
              Товарная группа
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0082FB] focus:ring-1 focus:ring-[#0082FB] transition-all"
            >
              <option value="ALL">Все товарные категории</option>
              {categories.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.nameRu}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">
              Поиск
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию, GTIN, ТН ВЭД..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0082FB] focus:ring-1 focus:ring-[#0082FB] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-gray-100 pt-3">
          {[
            { id: 'ALL', label: 'Все карточки', count: counts.ALL },
            { id: 'DRAFT', label: 'Черновики', count: counts.DRAFT },
            { id: 'PENDING_MODERATION', label: 'На модерации', count: counts.PENDING_MODERATION },
            { id: 'APPROVED', label: 'Одобренные', count: counts.APPROVED },
            { id: 'REJECTED', label: 'Отклоненные', count: counts.REJECTED },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-[#0082FB] text-white shadow-2xs'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200/70 text-gray-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Cards List / Table */}
      {cards.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0082FB] flex items-center justify-center mx-auto border border-blue-100">
            <Package className="w-6 h-6 text-[#0082FB]" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">
            {searchQuery || categoryFilter !== 'ALL' || accountFilter !== 'ALL'
              ? 'Ничего не найдено по выбранным фильтрам'
              : 'У вас пока нет созданных карточек товаров'}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Создайте описание товара прямо в TANBOX, чтобы автоматически получить официальный GTIN в Национальном каталоге товаров РК
          </p>
          <button
            type="button"
            onClick={() => {
              setCardToEdit(null);
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0082FB] hover:bg-[#0070D8] text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer shadow-2xs mt-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Создать карточку</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <div
              key={card.id}
              className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Header row: category + status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-blue-50 text-[#0082FB] border border-blue-100 tracking-wide uppercase">
                      {card.category}
                    </span>
                    {card.account && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{card.account.name}</span>
                      </span>
                    )}
                  </div>
                  <div>{getStatusBadge(card)}</div>
                </div>

                {/* Name & Brand */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">
                    {card.name}
                  </h4>
                  {card.nameKk && (
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 italic">
                      {card.nameKk}
                    </p>
                  )}
                  {(card.brand || card.article || card.model) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {card.brand && <span className="font-semibold text-gray-700">{card.brand}</span>}
                      {card.brand && card.article && ' · '}
                      {card.article && <span>Арт: {card.article}</span>}
                      {card.model && <span> ({card.model})</span>}
                    </p>
                  )}
                </div>

                {/* Attributes Pills */}
                <div className="flex flex-wrap gap-1.5 text-xs text-gray-600">
                  {card.tnved && (
                    <span className="px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200/70 font-mono text-[11px]">
                      ТНВЭД: {card.tnved}
                    </span>
                  )}
                  {card.size && (
                    <span className="px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200/70 text-[11px]">
                      Размер: {card.size}
                    </span>
                  )}
                  {card.color && (
                    <span className="px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200/70 text-[11px]">
                      {card.color}
                    </span>
                  )}
                  {card.country && (
                    <span className="px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200/70 text-[11px]">
                      {card.country}
                    </span>
                  )}
                </div>

                {/* Approved GTIN section */}
                {card.gtin && (
                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Присвоенный GTIN</p>
                      <p className="text-xs font-mono font-bold text-emerald-950 mt-0.5">{card.gtin}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyGtin(card.gtin)}
                      className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                      title="Скопировать GTIN"
                    >
                      {copiedGtin === card.gtin ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                )}

                {/* Rejection comment */}
                {card.status === 'REJECTED' && card.moderationComment && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    <p className="font-bold flex items-center gap-1.5 text-rose-900">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      Замечание модератора НКТ:
                    </p>
                    <p className="mt-1 text-rose-700 text-[11px] leading-relaxed">{card.moderationComment}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCardToView(card)}
                    className="p-1.5 text-gray-500 hover:text-[#0082FB] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="Просмотреть все реквизиты"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {(card.status === 'DRAFT' || card.status === 'REJECTED') && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setCardToEdit(card);
                          setShowCreateModal(true);
                        }}
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        title="Редактировать"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(card.id)}
                        disabled={actionLoadingId === card.id}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Удалить черновик"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>

                <div>
                  {card.status === 'DRAFT' && (
                    <button
                      type="button"
                      onClick={() => handleSubmitNkt(card.id)}
                      disabled={actionLoadingId === card.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0082FB] hover:bg-[#0070D8] text-white shadow-2xs transition-colors cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>{actionLoadingId === card.id ? 'Отправка...' : 'Отправить в НКТ'}</span>
                    </button>
                  )}

                  {card.status === 'PENDING_MODERATION' && (
                    <button
                      type="button"
                      onClick={() => handleCheckStatus(card.id)}
                      disabled={actionLoadingId === card.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition-colors cursor-pointer"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${actionLoadingId === card.id ? 'animate-spin text-[#0082FB]' : ''}`}
                      />
                      <span>Проверить статус</span>
                    </button>
                  )}

                  {card.status === 'APPROVED' && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate('/orders/create', {
                          state: {
                            prefillCategory: card.category,
                            prefillGtin: card.gtin,
                            prefillName: card.name,
                            prefillArticle: card.article,
                          },
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Заказать этикетки</span>
                    </button>
                  )}

                  {card.status === 'REJECTED' && (
                    <button
                      type="button"
                      onClick={() => {
                        setCardToEdit(card);
                        setShowCreateModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Исправить</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Preview Modal */}
      {cardToView && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCardToView(null);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <Package className="w-5 h-5 text-[#0082FB]" />
                <h3 className="font-bold text-base text-gray-900">Реквизиты карточки товара</h3>
              </div>
              <button
                type="button"
                onClick={() => setCardToView(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Наименование (RU / KZ)</p>
                <p className="font-bold text-sm text-gray-900">{cardToView.name}</p>
                {cardToView.nameKk && (
                  <p className="text-gray-600 italic">Қазақша: {cardToView.nameKk}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Товарная группа</span>
                  <span className="font-semibold text-gray-900 text-xs">{cardToView.category}</span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Бренд / Артикул</span>
                  <span className="font-semibold text-gray-900 text-xs">
                    {cardToView.brand || '—'} {cardToView.article ? `(Арт: ${cardToView.article})` : ''}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">ТН ВЭД ЕАЭС</span>
                  <span className="font-mono font-semibold text-gray-900 text-xs">{cardToView.tnved || '—'}</span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">GTIN / EAN-13</span>
                  <span className="font-mono font-semibold text-gray-900 text-xs">{cardToView.gtin || 'Присваивается НКТ'}</span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Страна происхождения</span>
                  <span className="font-semibold text-gray-900 text-xs">{cardToView.country || 'Казахстан'}</span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Тип упаковки</span>
                  <span className="font-semibold text-gray-900 text-xs">{cardToView.packageType || 'UNIT'}</span>
                </div>
              </div>

              {/* Producer & Importer */}
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Изготовитель и Импортер</p>
                <div className="grid grid-cols-2 gap-2 text-gray-700">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Изготовитель:</span>
                    <span>{cardToView.producerName || '—'}</span>
                    {cardToView.producerAddress && (
                      <span className="block text-[10px] text-gray-500">{cardToView.producerAddress}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Импортер в РК (БИН):</span>
                    <span>{cardToView.importerName || '—'}</span>
                    {cardToView.importerBin && (
                      <span className="block text-[10px] font-mono text-gray-500">БИН: {cardToView.importerBin}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Certification & Standards */}
              {(cardToView.certificateType || cardToView.certificateNumber || cardToView.gostOrTu) && (
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Разрешительные документы</p>
                  <p className="text-gray-700">
                    <strong>{cardToView.certificateType || 'Документ'}:</strong> {cardToView.certificateNumber || '—'}
                  </p>
                  {cardToView.gostOrTu && (
                    <p className="text-gray-500 text-[11px]">Стандарт: {cardToView.gostOrTu}</p>
                  )}
                </div>
              )}

              {/* Dynamic Category Attributes */}
              {cardToView.attributes && Object.keys(cardToView.attributes).length > 0 && (
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Специфические атрибуты ({cardToView.category})
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(cardToView.attributes).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-gray-400 block text-[10px]">{key}:</span>
                        <span className="font-medium text-gray-800">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setCardToView(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-semibold text-xs transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal create/edit */}
      {showCreateModal && (
        <CreateProductCardModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            showToast(
              cardToEdit ? 'Карточка товара обновлена' : 'Карточка товара успешно сохранена',
              'success'
            );
            fetchCards();
          }}
          cardToEdit={cardToEdit}
        />
      )}
    </div>
  );
};
