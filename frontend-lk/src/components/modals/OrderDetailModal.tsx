import React from 'react';
import { X, Download, Calendar, Layers, FileText, CheckCircle2, Building2 } from 'lucide-react';
import { OrderItem } from '../../types';
import { StatusBadge } from '@shared';

interface OrderDetailModalProps {
  order: OrderItem | null;
  onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-2xl w-full p-8 relative space-y-6 max-h-[90vh] overflow-y-auto">
        
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors"
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

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:col-span-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase block">Итоговая стоимость</span>
            <span className="text-xl font-black text-black mt-1 block">{order.totalPrice.toLocaleString()} ₸</span>
          </div>
        </div>

        {/* Extra options */}
        {order.extraServices && order.extraServices.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-black uppercase tracking-wider">Подключенные опции</h4>
            <div className="flex flex-wrap gap-2">
              {order.extraServices.map((srv, i) => (
                <span key={i} className="text-xs font-bold bg-gray-100 text-black px-3 py-1 rounded-lg border border-gray-200">
                  {srv}
                </span>
              ))}
              {order.ssccNeeded && (
                <span className="text-xs font-bold bg-black text-white px-3 py-1 rounded-lg">
                  SSCC Агрегация
                </span>
              )}
            </div>
          </div>
        )}

        {/* PDF Download section if generated */}
        <div className="bg-gray-900 text-white rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-emerald-400" />
              <div>
                <h4 className="text-sm font-bold text-white">Макеты кодов и Акт выполненных работ</h4>
                <p className="text-xs text-gray-400">Сгенерировано в соответствии с ИС Танба РК</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href={order.pdfUrl || '/samples/data_matrix_sample.pdf'}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white text-black font-extrabold text-xs px-5 py-3 rounded-xl hover:bg-gray-100 transition-all"
            >
              <Download className="w-4 h-4" /> Скачать макеты Data Matrix (PDF)
            </a>

            <button
              onClick={() => alert(`Акт сверки по заказу ${order.orderNumber} сформирован.`)}
              className="inline-flex items-center justify-center gap-2 bg-gray-800 text-white font-bold text-xs px-5 py-3 rounded-xl hover:bg-gray-700 transition-all border border-gray-700"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Скачать Акт приема-передачи
            </button>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="border-t border-gray-100 pt-4 space-y-1">
            <span className="text-xs font-bold text-black uppercase">Примечание клиента:</span>
            <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-200">{order.notes}</p>
          </div>
        )}

      </div>
    </div>
  );
};
