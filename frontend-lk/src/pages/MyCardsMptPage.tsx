import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import {
  RefreshCw,
  Search,
  PackagePlus,
  Barcode,
  Copy,
  Check,
  Eye,
  X,
  ExternalLink,
  Layers,
  LayoutGrid,
  List,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Package,
  Building2,
  FileCheck2,
  Boxes,
  Tag,
  Info,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast, useModalBehavior } from '@shared';
import { OperationModal } from '../components/markirovka/OperationModal';
import { MarkirovkaOpChoice } from '../components/markirovka/MarkirovkaOperationsButton';

export interface MptCatalogCard {
  id: string;
  category: string;
  name: string;
  nameKk?: string;
  brand?: string;
  article?: string;
  model?: string;
  tnved?: string;
  country?: string;
  size?: string;
  color?: string;
  gtin: string;
  status: string;
  photos?: string[];
  attributes?: Record<string, any>;
  account?: {
    id: string;
    name: string;
    login: string;
    status: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const CATEGORY_LABELS: Record<string, { label: string; color: string; badgeBg: string }> = {
  SHOES: { label: 'Обувь', color: 'text-amber-700', badgeBg: 'bg-amber-50 border-amber-200' },
  TEXTILE: { label: 'Одежда и текстиль', color: 'text-blue-700', badgeBg: 'bg-blue-50 border-blue-200' },
  MEDICINE: { label: 'Лекарственные средства', color: 'text-rose-700', badgeBg: 'bg-rose-50 border-rose-200' },
  WATER: { label: 'Упакованная вода', color: 'text-cyan-700', badgeBg: 'bg-cyan-50 border-cyan-200' },
  OILS: { label: 'Моторные масла', color: 'text-purple-700', badgeBg: 'bg-purple-50 border-purple-200' },
  TOBACCO: { label: 'Табачная продукция', color: 'text-stone-700', badgeBg: 'bg-stone-50 border-stone-200' },
  BEER: { label: 'Пиво и напитки', color: 'text-yellow-700', badgeBg: 'bg-yellow-50 border-yellow-200' },
  DIETARY_SUPPLEMENTS: { label: 'БАД', color: 'text-emerald-700', badgeBg: 'bg-emerald-50 border-emerald-200' },
};

export const MyCardsMptPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [cards, setCards] = useState<MptCatalogCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [categoriesStats, setCategoriesStats] = useState<Record<string, number>>({});
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [copiedGtin, setCopiedGtin] = useState<string | null>(null);

  // Pagination state for handling hundreds / thousands of cards
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(24);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const activeCategories = useMemo(() => {
    return Object.entries(categoriesStats).filter(([_, count]) => count > 0);
  }, [categoriesStats]);

  // Modals state
  const [selectedDetailCard, setSelectedDetailCard] = useState<MptCatalogCard | null>(null);
  const [mptOperationType, setMptOperationType] = useState<MarkirovkaOpChoice | null>(null);
  const [mptOperationCard, setMptOperationCard] = useState<MptCatalogCard | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);

  // Fetch cards with server-side pagination & filtering
  const fetchCards = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
      };
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (search.trim()) params.search = search.trim();

      const [res, accRes] = await Promise.all([
        apiClient.get('/markirovka/catalog', { params }),
        apiClient.get('/markirovka/accounts').catch(() => ({ data: { accounts: [] } })),
      ]);

      setCards(res.data?.cards || []);
      setTotalCount(res.data?.pagination?.total || 0);
      setTotalPages(res.data?.pagination?.totalPages || 1);
      setCategoriesStats(res.data?.categoriesStats || {});
      setLastSyncedAt(res.data?.lastSyncedAt || null);
      setAccounts(accRes.data?.accounts || []);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Ошибка загрузки карточек ИС МПТ', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, selectedCategory, search]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // Handle Sync
  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await apiClient.post('/markirovka/catalog/sync');
      showToast(res.data?.message || 'Карточки ИС МПТ успешно синхронизированы', 'success');
      await fetchCards();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Ошибка синхронизации с ИС МПТ', 'error');
    } finally {
      setSyncing(false);
    }
  };

  // Copy GTIN
  const handleCopyGtin = (gtin: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(gtin);
    setCopiedGtin(gtin);
    setTimeout(() => setCopiedGtin(null), 2000);
  };

  // Quick order navigation
  const handleQuickOrder = (card: MptCatalogCard, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigate('/orders/new', {
      state: {
        prefillCategory: card.category,
        prefillGtin: card.gtin,
        prefillName: card.name,
        prefillArticle: card.article || '',
        prefillBrand: card.brand || '',
      },
    });
  };

  // Open IS MPT operation modal
  const handleOpenEmission = (card: MptCatalogCard, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setMptOperationCard(card);
    setMptOperationType('UTILISATION');
  };

  // Filtered in-memory if user types rapidly
  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      if (selectedCategory !== 'ALL' && c.category !== selectedCategory) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.gtin && c.gtin.includes(q)) ||
        (c.brand && c.brand.toLowerCase().includes(q)) ||
        (c.article && c.article.toLowerCase().includes(q)) ||
        (c.tnved && c.tnved.includes(q))
      );
    });
  }, [cards, selectedCategory, search]);

  const totalCardsCount = Object.values(categoriesStats).reduce((a, b) => a + b, 0) || cards.length;

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Controls Bar: Search, Sync Button, Total Counter & View Mode Switcher */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по GTIN, наименованию, бренду, артикулу..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0082FB] focus:outline-none transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Controls: Sync Button, Total, View Mode Switcher */}
          <div className="flex items-center gap-2.5 sm:gap-3 self-end sm:self-auto shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-[#0082FB] hover:bg-[#0072de] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Синхронизация...' : 'Синхронизировать с ИС МПТ'}</span>
            </button>

            <span className="text-[11px] text-gray-400 hidden sm:inline">
              Всего: <strong>{totalCardsCount}</strong>
            </span>

            {/* View Switcher: Table first, Grid second */}
            <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200/60">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-[#0082FB] shadow-xs' : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Таблица"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-[#0082FB] shadow-xs' : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Сетка карточек"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills - ONLY shown if organization has more than 1 active product group */}
        {activeCategories.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-0.5 text-xs no-scrollbar border-t border-gray-100">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-[#0082FB] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Все категории ({totalCardsCount})
            </button>

            {activeCategories.map(([catKey, count]) => {
              const catInfo = CATEGORY_LABELS[catKey] || { label: catKey };
              const isSelected = selectedCategory === catKey;
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setSelectedCategory(catKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#0082FB] text-white shadow-xs'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200/80'
                  }`}
                >
                  <span>{catInfo.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-7 h-7 text-[#0082FB] animate-spin mx-auto" />
          <p className="text-xs font-bold text-gray-500">Загрузка карточек товаров ИС МПТ...</p>
        </div>
      ) : filteredCards.length === 0 ? (
        /* Empty state - cleanly centered without frame */
        <div className="py-20 sm:py-28 text-center space-y-4 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0082FB] flex items-center justify-center mx-auto">
            <Barcode className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-gray-900">
              {search
                ? 'Карточки по выбранным фильтрам не найдены'
                : 'В вашем реестре пока нет карточек ИС МПТ'}
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              {search
                ? 'Попробуйте изменить поисковый запрос.'
                : 'Автоматически подтягиваются все позиции вашей организации из государственной системы маркировки.'}
            </p>
          </div>

          {search && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setSearch('')}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Сбросить поиск
              </button>
            </div>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredCards.map((card) => {
            const cat = CATEGORY_LABELS[card.category] || {
              label: card.category,
              color: 'text-gray-700',
              badgeBg: 'bg-gray-100 border-gray-200',
            };
            const photoUrl = card.photos && card.photos.length > 0 ? card.photos[0] : null;

            return (
              <div
                key={card.id}
                onClick={() => setSelectedDetailCard(card)}
                className="bg-white rounded-3xl border border-gray-200/80 hover:border-blue-300 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group cursor-pointer"
              >
                {/* Card Top: Photo or Icon & Badges */}
                <div className="p-4 space-y-3">
                  <div className="relative aspect-4/3 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={card.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-blue-50/80 text-[#0082FB] flex items-center justify-center border border-blue-100/60">
                        <Package className="w-6 h-6" />
                      </div>
                    )}

                    {/* Category pill */}
                    <span
                      className={`absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-bold border backdrop-blur-xs shadow-2xs ${cat.badgeBg} ${cat.color}`}
                    >
                      {cat.label}
                    </span>

                    {/* Active IS MPT indicator */}
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-emerald-500 text-white shadow-2xs">
                      ИС МПТ
                    </span>
                  </div>

                  {/* GTIN Pill with fast copy */}
                  <div className="flex items-center justify-between gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Barcode className="w-3.5 h-3.5 text-[#0082FB] shrink-0" />
                      <span className="font-mono text-xs font-bold text-gray-900 truncate">
                        {card.gtin}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleCopyGtin(card.gtin, e)}
                      title="Скопировать GTIN"
                      className="p-1 rounded-md hover:bg-gray-200 text-gray-500 transition-colors shrink-0"
                    >
                      {copiedGtin === card.gtin ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Title & Brand */}
                  <div>
                    {card.brand && (
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#0082FB] truncate">
                        {card.brand}
                      </p>
                    )}
                    <h3 className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-[#0082FB] transition-colors">
                      {card.name}
                    </h3>
                  </div>

                  {/* Key specs */}
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] text-gray-600 pt-1 border-t border-gray-50">
                    {card.article && (
                      <div className="truncate">
                        <span className="text-gray-400">Арт: </span>
                        <span className="font-medium">{card.article}</span>
                      </div>
                    )}
                    {card.size && (
                      <div className="truncate">
                        <span className="text-gray-400">Разм: </span>
                        <span className="font-medium">{card.size}</span>
                      </div>
                    )}
                    {card.color && (
                      <div className="truncate">
                        <span className="text-gray-400">Цвет: </span>
                        <span className="font-medium">{card.color}</span>
                      </div>
                    )}
                    {card.tnved && (
                      <div className="truncate">
                        <span className="text-gray-400">ТН ВЭД: </span>
                        <span className="font-mono font-medium">{card.tnved}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Bottom Bar */}
                <div className="p-3 bg-gray-50/70 border-t border-gray-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleQuickOrder(card, e)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#0082FB] hover:bg-[#0072de] text-white text-xs font-extrabold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <PackagePlus className="w-3.5 h-3.5" />
                    <span>Оформить заказ</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleOpenEmission(card, e)}
                    title="Заказать коды маркировки в ИС МПТ"
                    className="p-2 rounded-xl bg-white hover:bg-blue-50 text-gray-700 hover:text-[#0082FB] border border-gray-200 transition-colors cursor-pointer"
                  >
                    <FileCheck2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDetailCard(card);
                    }}
                    title="Подробная информация"
                    className="p-2 rounded-xl bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 uppercase text-[10px] font-extrabold tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Товар</th>
                  <th className="py-3 px-4">GTIN & Артикул</th>
                  <th className="py-3 px-4">Категория</th>
                  <th className="py-3 px-4">ТН ВЭД / Страна</th>
                  <th className="py-3 px-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCards.map((card) => {
                  const cat = CATEGORY_LABELS[card.category] || {
                    label: card.category,
                    color: 'text-gray-700',
                    badgeBg: 'bg-gray-100 border-gray-200',
                  };
                  return (
                    <tr
                      key={card.id}
                      onClick={() => setSelectedDetailCard(card)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                            {card.photos && card.photos.length > 0 ? (
                              <img src={card.photos[0]} alt={card.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs sm:max-w-md">
                            {card.brand && (
                              <span className="text-[10px] font-extrabold uppercase text-[#0082FB]">
                                {card.brand}
                              </span>
                            )}
                            <p className="font-bold text-gray-900 truncate">{card.name}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-gray-900">{card.gtin}</span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyGtin(card.gtin, e)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {copiedGtin === card.gtin ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          {card.article && (
                            <span className="text-[11px] text-gray-500">Арт: {card.article}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${cat.badgeBg} ${cat.color}`}
                        >
                          {cat.label}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5 text-[11px]">
                          <span className="font-mono font-semibold text-gray-700">{card.tnved || '—'}</span>
                          <p className="text-gray-400">{card.country || 'Казахстан'}</p>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleQuickOrder(card, e)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0082FB] hover:bg-[#0072de] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                          >
                            <PackagePlus className="w-3.5 h-3.5" />
                            <span>Заказ</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleOpenEmission(card, e)}
                            title="Заказать коды в ИС МПТ"
                            className="p-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-[#0082FB] transition-colors cursor-pointer"
                          >
                            <FileCheck2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PAGINATION BAR FOR LARGE CATALOGS */}
      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="text-xs text-gray-500 font-medium">
            Показано{' '}
            <span className="font-bold text-gray-900">
              {Math.min((page - 1) * limit + 1, totalCount)}–{Math.min(page * limit, totalCount)}
            </span>{' '}
            из <span className="font-bold text-gray-900">{totalCount}</span> товаров
          </div>

          <div className="flex items-center gap-2">
            {/* Limit selector */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mr-2">
              <span>На странице:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold text-gray-700 outline-none focus:border-[#0082FB] cursor-pointer"
              >
                <option value={24}>24</option>
                <option value={48}>48</option>
                <option value={96}>96</option>
              </select>
            </div>

            {/* Previous button */}
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600 cursor-pointer"
              title="Предыдущая страница"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page indicator */}
            <div className="text-xs font-bold text-gray-700 px-2 select-none">
              {page} / {totalPages || 1}
            </div>

            {/* Next button */}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600 cursor-pointer"
              title="Следующая страница"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedDetailCard && (
        <DetailModal
          card={selectedDetailCard}
          onClose={() => setSelectedDetailCard(null)}
          onOrderClick={() => handleQuickOrder(selectedDetailCard)}
          onEmissionClick={() => handleOpenEmission(selectedDetailCard)}
        />
      )}

      {/* IS MPT OPERATION MODAL (Order codes / Emission / Aggregation) */}
      {mptOperationType && (
        <OperationModal
          operationType={mptOperationType}
          accounts={accounts}
          initialCodes={mptOperationCard ? [mptOperationCard.gtin] : []}
          initialCategory={mptOperationCard?.category}
          onClose={() => {
            setMptOperationType(null);
            setMptOperationCard(null);
          }}
          onSuccess={() => {
            showToast('Операция в ИС МПТ успешно сформирована', 'success');
            fetchCards();
          }}
        />
      )}
    </div>
  );
};

/**
 * Full Specifications Detail Modal
 */
const DetailModal: React.FC<{
  card: MptCatalogCard;
  onClose: () => void;
  onOrderClick: () => void;
  onEmissionClick: () => void;
}> = ({ card, onClose, onOrderClick, onEmissionClick }) => {
  const { backdropProps, dialogProps } = useModalBehavior({ onClose, isOpen: true });
  const [copied, setCopied] = useState(false);

  const cat = CATEGORY_LABELS[card.category] || {
    label: card.category,
    color: 'text-gray-700',
    badgeBg: 'bg-gray-100 border-gray-200',
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(card.gtin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <div
      {...backdropProps}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150 select-auto"
    >
      <div
        {...dialogProps}
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0082FB] border border-blue-100 flex items-center justify-center font-bold shrink-0">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${cat.badgeBg} ${cat.color}`}>
                {cat.label}
              </span>
              <h3 className="text-base font-extrabold text-gray-900 line-clamp-1">{card.name}</h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Top highlight bar */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-extrabold">Код идентификации (GTIN)</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-base font-black text-gray-900">{card.gtin}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2 py-1 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-black flex items-center gap-1 font-semibold transition-colors cursor-pointer text-[11px]"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Скопировано' : 'Копировать'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-[11px] flex items-center gap-1">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                В обороте ИС МПТ
              </span>
            </div>
          </div>

          {/* Photos carousel or preview */}
          {card.photos && card.photos.length > 0 && (
            <div>
              <h4 className="text-[11px] font-extrabold uppercase text-gray-400 mb-2">Фотографии товара</h4>
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {card.photos.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt=""
                    className="w-24 h-24 rounded-2xl object-cover border border-gray-200 shrink-0"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Attributes Table */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-extrabold uppercase text-gray-400">Характеристики товара</h4>
            <div className="border border-gray-200/80 rounded-2xl overflow-hidden divide-y divide-gray-100">
              <div className="grid grid-cols-2 p-3 bg-gray-50/50">
                <span className="text-gray-500 font-medium">Наименование на русском:</span>
                <span className="font-bold text-gray-900">{card.name}</span>
              </div>
              {card.nameKk && (
                <div className="grid grid-cols-2 p-3">
                  <span className="text-gray-500 font-medium">Атауы (қазақша):</span>
                  <span className="font-medium text-gray-900">{card.nameKk}</span>
                </div>
              )}
              {card.brand && (
                <div className="grid grid-cols-2 p-3 bg-gray-50/50">
                  <span className="text-gray-500 font-medium">Торговая марка / Бренд:</span>
                  <span className="font-bold text-[#0082FB]">{card.brand}</span>
                </div>
              )}
              {card.article && (
                <div className="grid grid-cols-2 p-3">
                  <span className="text-gray-500 font-medium">Артикул / Модель:</span>
                  <span className="font-medium text-gray-900">{card.article}</span>
                </div>
              )}
              {card.size && (
                <div className="grid grid-cols-2 p-3 bg-gray-50/50">
                  <span className="text-gray-500 font-medium">Размер:</span>
                  <span className="font-medium text-gray-900">{card.size}</span>
                </div>
              )}
              {card.color && (
                <div className="grid grid-cols-2 p-3">
                  <span className="text-gray-500 font-medium">Цвет:</span>
                  <span className="font-medium text-gray-900">{card.color}</span>
                </div>
              )}
              {card.tnved && (
                <div className="grid grid-cols-2 p-3 bg-gray-50/50">
                  <span className="text-gray-500 font-medium">Код ТН ВЭД ЕАЭС:</span>
                  <span className="font-mono font-bold text-gray-900">{card.tnved}</span>
                </div>
              )}
              <div className="grid grid-cols-2 p-3">
                <span className="text-gray-500 font-medium">Страна производства:</span>
                <span className="font-medium text-gray-900">{card.country || 'Казахстан'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Закрыть
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onEmissionClick();
            }}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-blue-50 text-[#0082FB] border border-blue-200 text-xs font-extrabold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Заказать КМ в ИС МПТ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOrderClick();
            }}
            className="px-5 py-2.5 rounded-xl bg-[#0082FB] hover:bg-[#0072de] text-white text-xs font-extrabold shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Оформить заказ печати</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MyCardsMptPage;
