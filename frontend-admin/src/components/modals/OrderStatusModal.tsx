import React, { useState } from 'react';
import { X, CheckCircle2, FileText, AlertCircle } from 'lucide-react';
import { OrderAdminItem, OrderStatus } from '../../types';

interface OrderStatusModalProps {
  order: OrderAdminItem | null;
  onClose: () => void;
  onSave: (orderId: string, status: OrderStatus, pdfUrl?: string) => Promise<void>;
}

export const OrderStatusModal: React.FC<OrderStatusModalProps> = ({
  order,
  onClose,
  onSave,
}) => {
  const [status, setStatus] = useState<OrderStatus>(order?.status || 'NEW');
  const [pdfUrl, setPdfUrl] = useState<string>(order?.pdfUrl || '/samples/data_matrix_sample.pdf');
  const [saving, setSaving] = useState(false);

  if (!order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(order.id, status, pdfUrl);
      onClose();
    } catch (err) {
      alert('Ошибка при обновлении статуса');
    } finally {
      setSaving(false);
    }
  };

  const statusesList: { value: OrderStatus; label: string }[] = [
    { value: 'NEW', label: 'Новый заказ' },
    { value: 'PROCESSING', label: 'В обработке' },
    { value: 'PRINTING', label: 'Печать кодов' },
    { value: 'STICKERING', label: 'Оклейка на складе' },
    { value: 'COMPLETED', label: 'Завершён' },
    { value: 'CANCELLED', label: 'Отменён' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-lg w-full p-8 relative space-y-6">
        
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Управление заказом</span>
          <h3 className="text-2xl font-black text-black">Заказ {order.orderNumber}</h3>
          <p className="text-xs text-gray-600 font-semibold">
            Клиент: {order.user?.companyName} (БИН: {order.user?.binIin})
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-black uppercase mb-2 block">Выберите статус выполнения</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm font-bold text-black focus:outline-none focus:border-black"
            >
              {statusesList.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label} ({st.value})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-black uppercase mb-1 block">Ссылка на файл кодов (PDF/Zip)</label>
            <div className="relative">
              <FileText className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
                placeholder="/samples/data_matrix_sample.pdf"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono font-semibold text-black focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs space-y-1">
            <span className="font-extrabold text-black uppercase block">Детали закупки:</span>
            <p className="text-gray-600">Объем: <span className="font-bold text-black">{order.itemsCount.toLocaleString()} шт</span></p>
            <p className="text-gray-600">Сумма: <span className="font-bold text-black">{order.totalPrice.toLocaleString()} ₸</span></p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-black text-white font-extrabold text-sm py-3.5 rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-md disabled:opacity-50"
          >
            {saving ? 'Сохранение...' : 'Обновить статус заказа'}
          </button>
        </form>

      </div>
    </div>
  );
};
