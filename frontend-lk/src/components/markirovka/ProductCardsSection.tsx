import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  Globe,
  LayoutGrid,
  List,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { CreateProductCardModal } from './CreateProductCardModal';
import { useModalBehavior, useToast } from '@shared';

interface ProductCardsSectionProps {
  createModalTrigger?: number;
}

export const ProductCardsSection: React.FC<ProductCardsSectionProps> = ({ createModalTrigger }) => {
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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<any | null>(null);
  const [cardToView, setCardToView] = useState<any | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [copiedGtin, setCopiedGtin] = useState<string | null>(null);

  const { showToast } = useToast();

  useEffect(() => {
    if (createModalTrigger) {
      setCardToEdit(null);
      setShowCreateModal(true);
    }
  }, [createModalTrigger]);

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

  const handlePublishNkt = async (cardId: string) => {
    try {
      setActionLoadingId(cardId);
      const res = await apiClient.post(`/markirovka/cards/${cardId}/publish-nkt`);
      showToast(res.data?.message || 'Карточка успешно опубликована в НКТ', 'success');
      fetchCards();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Ошибка публикации в НКТ', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCheckStatus = async (cardId: string) => {
    try {
      setActionLoadingId(cardId);
      const res = await apiClient.get(`/markirovka/cards/${cardId}/check-status`);
      const card = res.data?.card;
      const status = card?.status;

      if (status === 'APPROVED') {
        showToast(`Карточка одобрена в НКТ! Присвоен GTIN: ${card?.gtin}`, 'success');
      } else if (status === 'REJECTED') {
        showToast(
          `Карточка требует доработки: ${card?.moderationComment || 'Замечания модератора НКТ'}`,
          'error'
        );
      } else if (status === 'PENDING_MODERATION') {
        showToast(
          `Заявка №${card?.nktRequestId || ''} находится на рассмотрении модератором НКТ`,
          'success'
        );
      } else if (status === 'DRAFT') {
        showToast(
          card?.moderationComment || `Заявка №${card?.nktRequestId || ''} в статусе черновика в НКТ`,
          card?.moderationComment ? 'error' : 'success'
        );
      } else {
        showToast(`Статус заявки в НКТ: ${status || 'Обрабатывается'}`, 'success');
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

  const getStatusBadge = (card: any, fixedSize: boolean = false) => {
    const baseClasses = fixedSize
      ? 'w-full h-9 flex items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap'
      : 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap';

    switch (card.status) {
      case 'APPROVED':
        const isPub = Boolean(
          card.attributes?.isPublished ||
          card.attributes?.productUrl ||
          (card.mptCardId && String(card.mptCardId).startsWith('http'))
        );
        return (
          <span className={`${baseClasses} bg-emerald-50 text-emerald-700 border border-emerald-200`}>
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{isPub ? 'Опубликован в НКТ' : 'Одобрен (GTIN)'}</span>
          </span>
        );
      case 'PENDING_MODERATION':
        return (
          <span className={`${baseClasses} bg-amber-50 text-amber-700 border border-amber-200`}>
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>На модерации в НКТ</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className={`${baseClasses} bg-rose-50 text-rose-700 border border-rose-200`}>
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Требует доработки</span>
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-700 border border-gray-200`}>
            <span>Черновик</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">

      {/* Filter and Status Controls Card (Analogous to IS MPT operations) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden space-y-0">
        {/* Status Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto px-4 pt-2">
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
              className={`pb-3 px-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'border-[#0082FB] text-[#0082FB]'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  statusFilter === tab.id ? 'bg-blue-100 text-[#0082FB]' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filter Controls Row: Category + Search + View Mode */}
        <div className="p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-gray-50/40">
          <div className="sm:col-span-5">
            <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">
              Товарная группа
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-1 focus:ring-[#0082FB] transition-all"
            >
              <option value="ALL">Все товарные категории</option>
              {categories.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.nameRu}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-5">
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
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:border-[#0082FB] focus:ring-1 focus:ring-[#0082FB] transition-all"
              />
            </div>
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <div className="flex items-center bg-gray-200/70 p-0.5 rounded-xl border border-gray-200 w-full sm:w-auto justify-center">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Отображение списком"
              >
                <List className="w-3.5 h-3.5" />
                <span>Список</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Отображение сеткой карточек"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Сетка</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cards List / Table */}
      {cards.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0082FB] flex items-center justify-center mx-auto border border-blue-100">
            <Package className="w-6 h-6 text-[#0082FB]" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">
            {searchQuery || categoryFilter !== 'ALL'
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
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs hover:shadow-md transition-all p-4 sm:px-5 sm:py-4 flex flex-col gap-3"
            >
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
                {/* Left: badges, name, brand, attributes */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 text-[#0082FB] border border-blue-100 uppercase tracking-wide">
                      {card.category}
                    </span>
                    {card.nktRequestId && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200" title="Номер заявки в НКТ">
                        № {card.nktRequestId}
                      </span>
                    )}
                    {card.account && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-gray-400" />
                        <span className="truncate max-w-[140px]">{card.account.name}</span>
                      </span>
                    )}
                    <div className="xl:hidden ml-auto">{getStatusBadge(card, false)}</div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-gray-900 leading-snug">
                      {card.name}
                    </h4>
                    {card.nameKk && (
                      <p className="text-xs text-gray-400 italic">{card.nameKk}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    {(card.brand || card.article || card.model) && (
                      <span className="text-gray-700 font-medium">
                        {card.brand && <span className="font-semibold text-gray-900">{card.brand}</span>}
                        {card.brand && card.article && ' · '}
                        {card.article && <span>Арт: {card.article}</span>}
                        {card.model && <span> ({card.model})</span>}
                      </span>
                    )}
                    {card.gtin && (
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono text-[11px] font-semibold border border-emerald-200"
                        title="Присвоенный код GTIN (штрихкод)"
                      >
                        <span>GTIN: {card.gtin}</span>
                        <button
                          type="button"
                          onClick={() => copyGtin(card.gtin)}
                          className="p-0.5 text-emerald-700 hover:text-emerald-950 hover:bg-emerald-100 rounded transition-colors cursor-pointer"
                          title="Скопировать GTIN"
                        >
                          {copiedGtin === card.gtin ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </span>
                    )}
                    {card.attributes?.oktru && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[#0082FB] font-mono text-[11px] font-medium border border-blue-100">
                        ОКТРУ: {card.attributes.oktru}
                      </span>
                    )}
                    {card.tnved && (
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-mono text-[11px] border border-gray-200">
                        ТНВЭД: {card.tnved}
                      </span>
                    )}
                    {card.country && (
                      <span className="text-gray-500 text-[11px]">{card.country}</span>
                    )}
                  </div>
                </div>

                {/* Right: Status + Actions with strict fixed sizes and vertical alignment */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
                  {/* Status Column - fixed width w-[170px] and height h-9 */}
                  <div className="w-[170px] h-9 shrink-0 hidden xl:flex items-center justify-center">
                    {getStatusBadge(card, true)}
                  </div>

                  {/* 3. Actions Column - standard h-9 height */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setCardToView(card)}
                      className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-[#0082FB] hover:bg-blue-50 border border-gray-200 rounded-xl transition-colors cursor-pointer shrink-0"
                      title="Просмотреть все реквизиты"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {card.status !== 'APPROVED' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setCardToEdit(card);
                            setShowCreateModal(true);
                          }}
                          className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors cursor-pointer shrink-0"
                          title="Редактировать"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(card.id)}
                          disabled={actionLoadingId === card.id}
                          className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 border border-gray-200 rounded-xl transition-colors cursor-pointer shrink-0"
                          title="Удалить карточку"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {card.status === 'DRAFT' && (
                      <button
                        type="button"
                        onClick={() => handleSubmitNkt(card.id)}
                        disabled={actionLoadingId === card.id}
                        className="h-9 px-3.5 rounded-xl text-xs font-semibold bg-[#0082FB] hover:bg-[#0070D8] text-white shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{actionLoadingId === card.id ? 'Отправка...' : 'Отправить в НКТ'}</span>
                      </button>
                    )}

                    {card.status === 'PENDING_MODERATION' && (
                      <button
                        type="button"
                        onClick={() => handleCheckStatus(card.id)}
                        disabled={actionLoadingId === card.id}
                        className="h-9 px-3 rounded-xl text-xs font-semibold bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5 shrink-0"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${actionLoadingId === card.id ? 'animate-spin text-[#0082FB]' : ''}`}
                        />
                        <span>Проверить статус</span>
                      </button>
                    )}

                    {card.status === 'APPROVED' && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {(card.attributes?.productUrl || (card.mptCardId && String(card.mptCardId).startsWith('http'))) ? (
                          <a
                            href={card.attributes?.productUrl || card.mptCardId}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-9 px-3 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-[#0082FB] border border-blue-200 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                            title="Открыть карточку в каталоге nationalcatalog.kz"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>В каталоге</span>
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handlePublishNkt(card.id)}
                            disabled={actionLoadingId === card.id}
                            className="h-9 px-3 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                            title="Опубликовать в Национальном каталоге товаров"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{actionLoadingId === card.id ? 'Публикация...' : 'Опубликовать'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            navigate('/orders/new', {
                              state: {
                                prefillCategory: card.category,
                                prefillGtin: card.gtin,
                                prefillName: card.name,
                                prefillArticle: card.article,
                                prefillBrand: card.brand,
                              },
                            })
                          }
                          className="h-9 px-3.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Заказать этикетки</span>
                        </button>
                      </div>
                    )}

                    {card.status === 'REJECTED' && (
                      <button
                        type="button"
                        onClick={() => {
                          setCardToEdit(card);
                          setShowCreateModal(true);
                        }}
                        className="h-9 px-3.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Исправить</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Detailed moderation comment banner */}
              {card.moderationComment && (card.status === 'REJECTED' || card.status === 'DRAFT') && (
                <div
                  className={`p-3 rounded-xl border text-xs leading-relaxed ${
                    card.status === 'REJECTED'
                      ? 'bg-rose-50/90 border-rose-200 text-rose-800'
                      : 'bg-amber-50/90 border-amber-200 text-amber-800'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 mb-1.5 text-gray-900">
                    <AlertCircle className={`w-4 h-4 shrink-0 ${card.status === 'REJECTED' ? 'text-rose-600' : 'text-amber-600'}`} />
                    <span>{card.status === 'REJECTED' ? 'Замечание модератора НКТ' : 'Информация НКТ'}</span>
                  </div>
                  <div className="text-[11px] leading-relaxed font-mono whitespace-pre-wrap bg-white/70 p-2.5 rounded-lg border border-black/5">
                    {card.moderationComment}
                  </div>
                </div>
              )}
            </div>
          ))}
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
                    {card.nktRequestId && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-semibold bg-amber-50/90 text-amber-800 border border-amber-200" title="Номер заявки в НКТ">
                        № {card.nktRequestId}
                      </span>
                    )}
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
                  {card.attributes?.oktru && (
                    <span
                      className="px-2 py-0.5 rounded-md bg-blue-50/80 border border-blue-200/70 font-mono text-[11px] text-[#0082FB] font-medium"
                      title="Код ОКТРУ в Национальном каталоге"
                    >
                      ОКТРУ: {card.attributes.oktru}
                    </span>
                  )}
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
                    <p className="font-bold flex items-center gap-1.5 text-rose-900 mb-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      Замечание модератора НКТ:
                    </p>
                    <p className="mt-1 text-rose-700 text-[11px] leading-relaxed whitespace-pre-wrap font-mono bg-white/70 p-2 rounded border border-rose-100">{card.moderationComment}</p>
                  </div>
                )}
                {card.status === 'DRAFT' && card.moderationComment && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    <p className="font-bold flex items-center gap-1.5 text-amber-900 mb-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      Информация НКТ:
                    </p>
                    <p className="mt-1 text-amber-700 text-[11px] leading-relaxed whitespace-pre-wrap font-mono bg-white/70 p-2 rounded border border-amber-100">{card.moderationComment}</p>
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

                  {card.status !== 'APPROVED' && (
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
                        title="Удалить карточку"
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
                    <div className="flex items-center gap-1.5">
                      {(card.attributes?.productUrl || (card.mptCardId && String(card.mptCardId).startsWith('http'))) ? (
                        <a
                          href={card.attributes?.productUrl || card.mptCardId}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-[#0082FB] border border-blue-200 transition-colors cursor-pointer"
                          title="Открыть карточку в каталоге nationalcatalog.kz"
                        >
                          <Globe className="w-3 h-3" />
                          <span>В каталоге</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePublishNkt(card.id)}
                          disabled={actionLoadingId === card.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-2xs transition-colors cursor-pointer"
                          title="Опубликовать в Национальном каталоге товаров"
                        >
                          <Send className="w-3 h-3" />
                          <span>{actionLoadingId === card.id ? 'Публикация...' : 'Опубликовать'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          navigate('/orders/new', {
                            state: {
                              prefillCategory: card.category,
                              prefillGtin: card.gtin,
                              prefillName: card.name,
                              prefillArticle: card.article,
                              prefillBrand: card.brand,
                            },
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Заказать этикетки</span>
                      </button>
                    </div>
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
        <CardDetailModal card={cardToView} onClose={() => setCardToView(null)} />
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

const CardDetailModal: React.FC<{ card: any; onClose: () => void }> = ({ card, onClose }) => {
  const { backdropProps, dialogProps } = useModalBehavior({ onClose, isOpen: true });

  return createPortal(
    <div
      {...backdropProps}
      className="fixed inset-0 w-screen h-screen z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        {...dialogProps}
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-[#0082FB]" />
            <h3 className="font-bold text-base text-gray-900">Реквизиты карточки товара</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Наименование (RU / KZ)</p>
            <p className="font-bold text-sm text-gray-900">{card.name}</p>
            {card.nameKk && (
              <p className="text-gray-600 italic">Қазақша: {card.nameKk}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Товарная группа</span>
              <span className="font-semibold text-gray-900 text-xs">{card.category}</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Бренд / Артикул</span>
              <span className="font-semibold text-gray-900 text-xs">
                {card.brand || '—'} {card.article ? `(Арт: ${card.article})` : ''}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">ТН ВЭД ЕАЭС</span>
              <span className="font-mono font-semibold text-gray-900 text-xs">{card.tnved || '—'}</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">GTIN / EAN-13</span>
              <span className="font-mono font-semibold text-gray-900 text-xs">{card.gtin || 'Присваивается НКТ'}</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Страна происхождения</span>
              <span className="font-semibold text-gray-900 text-xs">{card.country || 'Казахстан'}</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Тип упаковки</span>
              <span className="font-semibold text-gray-900 text-xs">{card.packageType || 'UNIT'}</span>
            </div>
          </div>

          {/* Producer & Importer */}
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Изготовитель и Импортер</p>
            <div className="grid grid-cols-2 gap-2 text-gray-700">
              <div>
                <span className="text-gray-400 block text-[10px]">Изготовитель:</span>
                <span>{card.producerName || '—'}</span>
                {card.producerAddress && (
                  <span className="block text-[10px] text-gray-500">{card.producerAddress}</span>
                )}
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Импортер в РК (БИН):</span>
                <span>{card.importerName || '—'}</span>
                {card.importerBin && (
                  <span className="block text-[10px] font-mono text-gray-500">БИН: {card.importerBin}</span>
                )}
              </div>
            </div>
          </div>

          {/* Certification & Standards */}
          {(card.certificateType || card.certificateNumber || card.gostOrTu) && (
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Разрешительные документы</p>
              <p className="text-gray-700">
                <strong>{card.certificateType || 'Документ'}:</strong> {card.certificateNumber || '—'}
              </p>
              {card.gostOrTu && (
                <p className="text-gray-500 text-[11px]">Стандарт: {card.gostOrTu}</p>
              )}
            </div>
          )}

          {/* Dynamic Category Attributes */}
          {card.attributes && Object.keys(card.attributes).length > 0 && (
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Специфические атрибуты ({card.category})
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(card.attributes).map(([key, value]) => (
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
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
