import React from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Calendar, Layers, FileText, CheckCircle2, Building2, MapPin } from 'lucide-react';
import { OrderItem } from '../../types';
import { apiClient } from '../../api/client';
import { StatusBadge, parseOrderNotes } from '@shared';

interface OrderDetailModalProps {
  order: OrderItem | null;
  onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-2xl w-full p-8 relative space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
        
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-black text-black">{order.orderNumber}</h3>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Создан: {new Date(order.createdAt).toLocaleDateString('ru-RU')}
            </p>
          </div>
        </div>

        {/* Main Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <span className="text-[11px] font-bold text-gray-500 uppercase block">Категория</span>
            <span className="text-sm font-extrabold text-black mt-1 block">{order.category}</span>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <span className="text-[11px] font-bold text-gray-500 uppercase block">Тариф</span>
            <span className="text-sm font-extrabold text-black mt-1 block">{order.tariffType}</span>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <span className="text-[11px] font-bold text-gray-500 uppercase block">Количество</span>
            <span className="text-sm font-extrabold text-black mt-1 block">{order.itemsCount.toLocaleString()} шт</span>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <span className="text-[11px] font-bold text-gray-500 uppercase block">Цена за 1 шт</span>
            <span className="text-sm font-extrabold text-black mt-1 block">{order.pricePerItem} ₸</span>
          </div>

          <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-4 sm:col-span-2">
            <span className="text-[11px] font-bold text-[#0082FB] uppercase block">Итоговая стоимость</span>
            <span className="text-xl font-black text-[#0082FB] mt-1 block">{order.totalPrice.toLocaleString()} ₸</span>
          </div>
        </div>

        {/* Extra options */}
        {order.extraServices && order.extraServices.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider">Подключенные опции</h4>
            <div className="flex flex-wrap gap-2">
              {order.extraServices.map((srv, i) => {
                const SERVICE_NAMES: Record<string, string> = {
                  ON_SITE_STICKERING: 'Стикеровка на складе',
                  STICKER_LAYOUT_DESIGN: 'Разработка макета стикера',
                  URGENT_PROCESSING: 'Срочное исполнение (24ч)',
                  EXPRESS_DELIVERY: 'Экспресс-доставка рулонов',
                  SSCC_AGGREGATION: 'SSCC Агрегация коробов',
                };
                return (
                  <span key={i} className="text-xs font-bold bg-gray-50 text-[#111827] px-3 py-1 rounded-lg border border-gray-200/80">
                    {SERVICE_NAMES[srv] || srv}
                  </span>
                );
              })}
              {order.ssccNeeded && (
                <span className="text-xs font-bold bg-blue-50 text-[#0082FB] border border-blue-200 px-3 py-1 rounded-lg">
                  SSCC Агрегация
                </span>
              )}
            </div>
          </div>
        )}

        {/* PDF Download section if generated */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-lg text-[#0082FB]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#111827]">Макеты кодов и Акт выполненных работ</h4>
                <p className="text-xs text-[#64748B]">Сгенерировано в соответствии с ИС Танба РК</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await apiClient.get(`/orders/${order.id}/pdf`, {
                    responseType: 'blob',
                    timeout: 300000,
                  });
                  const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                  const link = document.createElement('a');
                  link.href = blobUrl;
                  link.setAttribute('download', `Labels_${order.orderNumber}.pdf`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(blobUrl);
                } catch (err: any) {
                  alert(err.response?.data?.message || 'Ошибка при скачивании PDF макетов');
                }
              }}
              className="inline-flex items-center justify-center gap-2 bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" /> Скачать макеты Data Matrix (PDF)
            </button>

            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await apiClient.get(`/orders/${order.id}/act`, {
                    responseType: 'blob',
                  });
                  const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'text/html;charset=utf-8' }));
                  window.open(blobUrl, '_blank');
                } catch (err: any) {
                  alert(err.response?.data?.message || 'Ошибка при открытии акта');
                }
              }}
              className="inline-flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-[#111827] font-bold text-xs px-5 py-2.5 rounded-xl border border-gray-200/80 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Открыть Акт приема-передачи
            </button>
          </div>
        </div>

        {/* Separated Address and Notes */}
        {order.notes && (() => {
          const parsed = parseOrderNotes(order.notes);
          if (!parsed.address && !parsed.clientNote && !parsed.stickerDesign) return null;

          return (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              {parsed.address && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#111827] uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5 text-[#0082FB]" />
                    <span>Адрес склада в РК:</span>
                  </div>
                  <div className="text-xs font-semibold text-[#111827] bg-[#F8FAFC] p-3 rounded-xl border border-gray-200 leading-relaxed">
                    {parsed.address}
                  </div>
                </div>
              )}

              {parsed.clientNote && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#111827] uppercase tracking-wider">
                    <FileText className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>Примечание клиента:</span>
                  </div>
                  <div className="text-xs text-[#334155] bg-[#F8FAFC] p-3 rounded-xl border border-gray-200 leading-relaxed whitespace-pre-wrap">
                    {parsed.clientNote}
                  </div>
                </div>
              )}

              {parsed.stickerDesign && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#111827] uppercase tracking-wider block">
                    Параметры макета стикера:
                  </span>
                  <pre className="text-[11px] font-mono text-[#334155] bg-[#F8FAFC] p-3 rounded-xl border border-gray-200 whitespace-pre-wrap leading-relaxed">
                    {parsed.stickerDesign}
                  </pre>
                </div>
              )}
            </div>
          );
        })()}

      </div>
    </div>,
    document.body
  );
};
