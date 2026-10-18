import React, { useState } from 'react';
import {
  Server,
  RefreshCw,
  Search,
  Plus,
  Edit2,
  Package,
  Barcode,
  Building2,
} from 'lucide-react';
import { NCALayerBadge } from './NCALayerBadge';
import {
  MarkirovkaOperationsButton,
  MarkirovkaOpChoice,
} from './MarkirovkaOperationsButton';
import { PartyAndCatalogModal } from './PartyAndCatalogModal';
import { ConnectMarkirovkaModal } from '../modals/ConnectMarkirovkaModal';

interface MarkirovkaHeaderBarProps {
  mode: 'MPT' | 'CARDS';
  accounts: any[];
  loading: boolean;
  onRefresh: () => void;
  onAccountSaved?: () => void;
  onSelectOperation?: (op: MarkirovkaOpChoice) => void;
  onCreateCard?: () => void;
}

export const MarkirovkaHeaderBar: React.FC<MarkirovkaHeaderBarProps> = ({
  mode,
  accounts,
  loading,
  onRefresh,
  onAccountSaved,
  onSelectOperation,
  onCreateCard,
}) => {
  const [showToolsModal, setShowToolsModal] = useState<boolean>(false);
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);
  const [accountToEdit, setAccountToEdit] = useState<any | null>(null);

  const isMpt = mode === 'MPT';
  const isNktTest = accounts[0]?.nktBaseUrl?.includes('test');

  return (
    <div className="space-y-3">
      {/* Unified Compact Bar: Fully Separated for ИС МПТ vs Описания товаров */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 sm:px-5 sm:py-3.5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Section Header with Title and Subtitle */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0082FB] flex items-center justify-center border border-blue-100 shrink-0">
            {isMpt ? <Server className="w-5 h-5" /> : <Package className="w-5 h-5" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">
                {isMpt ? 'ИС МПТ (Маркировка КЗ)' : 'Описания товаров (НКТ)'}
              </h1>
              {accounts.length > 0 && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    (isMpt ? accounts[0].status === 'ACTIVE' : Boolean(accounts[0].hasNktApiKey || accounts[0].nktStatus === 'ACTIVE'))
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      (isMpt ? accounts[0].status === 'ACTIVE' : Boolean(accounts[0].hasNktApiKey || accounts[0].nktStatus === 'ACTIVE'))
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                    }`}
                  />
                  {(isMpt ? accounts[0].status === 'ACTIVE' : Boolean(accounts[0].hasNktApiKey || accounts[0].nktStatus === 'ACTIVE'))
                    ? 'Подключено'
                    : 'Не настроено'}
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-gray-500 truncate">
              {isMpt
                ? 'Заказ кодов DataMatrix, нанесение, агрегация и документооборот'
                : 'Создание карточек товаров, заполнение атрибутов и получение GTIN'}
            </p>
          </div>
        </div>

        {/* Right: Actions specific to this page */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          {isMpt && <NCALayerBadge />}

          <button
            type="button"
            onClick={() => setShowToolsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
          >
            {isMpt ? (
              <>
                <Building2 className="w-3.5 h-3.5 text-gray-500" />
                <span>Поиск по БИН</span>
              </>
            ) : (
              <>
                <Barcode className="w-3.5 h-3.5 text-gray-500" />
                <span>Поиск по GTIN</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 text-gray-500 hover:text-[#0082FB] hover:bg-blue-50 border border-gray-200 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Обновить данные"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0082FB]' : ''}`} />
          </button>

          {accounts.length === 0 ? (
            <button
              type="button"
              onClick={() => {
                setAccountToEdit(null);
                setShowConnectModal(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#0082FB] hover:bg-blue-50 border border-blue-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isMpt ? 'Подключить ИС МПТ' : 'Настроить НКТ'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAccountToEdit(accounts[0]);
                setShowConnectModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#0082FB]" />
              <span>{isMpt ? 'Настроить ИС МПТ' : 'Настроить НКТ'}</span>
            </button>
          )}

          {isMpt && onSelectOperation && (
            <MarkirovkaOperationsButton
              onSelectOperation={onSelectOperation}
              disabled={loading}
            />
          )}

          {!isMpt && onCreateCard && (
            <button
              type="button"
              onClick={onCreateCard}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0082FB] hover:bg-[#0070D8] text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-md shadow-blue-500/10 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Создать карточку товара</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Modals for this bar */}
      {showToolsModal && (
        <PartyAndCatalogModal
          mode={isMpt ? 'PARTY' : 'GTIN'}
          onClose={() => setShowToolsModal(false)}
        />
      )}

      <ConnectMarkirovkaModal
        targetService={isMpt ? 'MPT' : 'NKT'}
        isOpen={showConnectModal}
        initialAccount={accountToEdit}
        onClose={() => setShowConnectModal(false)}
        onSuccess={() => {
          onRefresh();
          if (onAccountSaved) onAccountSaved();
        }}
      />
    </div>
  );
};
