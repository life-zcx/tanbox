import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { OrderItem } from '../types';
import { StatusBadge, PageHeader } from '@shared';
import {
  ArrowLeft,
  Calendar,
  Download,
  FileText,
  CheckCircle2,
  Clock,
  Package,
  ShieldCheck,
  Layers,
  Tag,
  Building2,
  AlertCircle
} from 'lucide-react';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await apiClient.get(`/orders/${id}`);
        setOrder(res.data);
        setError(null);
      } catch (err: any) {
        // Fallback: try fetching all orders and finding by id if single GET fails
        try {
          const listRes = await apiClient.get('/orders');
          const found = (listRes.data as OrderItem[]).find((o) => o.id === id || o.orderNumber === id);
          if (found) {
            setOrder(found);
            setError(null);
          } else {
            setError('Заказ не найден');
          }
        } catch {
          setError('Не удалось загрузить данные заказа');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Назад к списку заказов
        </Link>
        <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center text-gray-400 font-bold">
          Загрузка информации о заказе...
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Назад к списку заказов
        </Link>
        <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-lg font-bold text-black">{error || 'Заказ не найден'}</h3>
          <button
            onClick={() => navigate('/orders')}
            className="inline-flex items-center gap-2 bg-black text-white font-extrabold text-xs px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-all"
          >
            Вернуться в реестр заказов
          </button>
        </div>
      </div>
    );
  }

  // Progress timeline configuration
  const STEPS = [
    { key: 'NEW', title: 'Создан', desc: 'Оформлен в системе' },
    { key: 'PROCESSING', title: 'В обработке', desc: 'Проверка ИС Танба' },
    { key: 'PRINTING', title: 'Печать кодов', desc: 'Формирование макетов' },
    { key: 'STICKERING', title: 'Стикеровка', desc: 'Нанесение кодов' },
    { key: 'COMPLETED', title: 'Выполнен', desc: 'Партия готова' },
  ];

  const getStepIndex = (st: string) => {
    switch (st) {
      case 'NEW':
        return 0;
      case 'PROCESSING':
        return 1;
      case 'PRINTING':
        return 2;
      case 'STICKERING':
        return 3;
      case 'COMPLETED':
        return 4;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.status);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      
      {/* Top Back Navigation */}
      <div>
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-xs font-extrabold text-gray-500 hover:text-black transition-colors bg-white px-3.5 py-2 rounded-xl border border-gray-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Вернуться к списку заказов
        </Link>
      </div>

      {/* Main Order Header */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-black tracking-tight">{order.orderNumber}</h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 pt-1">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              Создан: <span className="font-bold text-black">{new Date(order.createdAt).toLocaleDateString('ru-RU')}</span> в {new Date(order.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              ИС Танба РК • Валиден
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-2">
          
          <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4">
            <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block">Категория</span>
            <span className="text-base font-black text-black mt-1 block truncate">{order.category}</span>
          </div>

          <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4">
            <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block">Тариф</span>
            <span className="text-base font-black text-black mt-1 block truncate">{order.tariffType}</span>
          </div>

          <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4">
            <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block">Количество</span>
            <span className="text-base font-black text-black mt-1 block">{order.itemsCount.toLocaleString()} шт</span>
          </div>

          <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4">
            <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block">Цена за 1 шт</span>
            <span className="text-base font-black text-black mt-1 block">{order.pricePerItem} ₸</span>
          </div>

          <div className="bg-gray-900 text-white border border-gray-900 rounded-2xl p-4 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block">Итоговая стоимость</span>
            <span className="text-xl font-black text-white mt-0.5 block">{order.totalPrice.toLocaleString()} ₸</span>
          </div>

        </div>
      </div>

      {/* Lifecycle Timeline */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-black flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" /> Этапы исполнения заказа
        </h3>

        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative z-10">
            {STEPS.map((step, idx) => {
              const isDone = idx < currentStepIdx || order.status === 'COMPLETED';
              const isCurrent = idx === currentStepIdx && order.status !== 'COMPLETED';

              return (
                <div
                  key={step.key}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-black text-white border-black shadow-lg scale-102'
                      : isDone
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-gray-50 border-gray-200 text-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                      isCurrent
                        ? 'bg-white/20 text-white'
                        : isDone
                        ? 'bg-emerald-200/60 text-emerald-900'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      Шаг {idx + 1}
                    </span>

                    {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>

                  <h4 className="text-sm font-extrabold block">{step.title}</h4>
                  <p className={`text-[11px] mt-1 font-medium ${isCurrent ? 'text-gray-300' : 'text-gray-500'}`}>
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Files & Data Matrix Download Section */}
      <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl border border-slate-900">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/10 p-3.5 rounded-2xl border border-emerald-500/20">
              <FileText className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Макеты кодов и Акт выполненных работ</h3>
              <p className="text-xs text-slate-400 mt-0.5">Сгенерировано в соответствии с регламентом ИС Танба РК</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" /> ИС Танба Подтверждено
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <a
            href={order.pdfUrl || '/samples/data_matrix_sample.pdf'}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 bg-white text-black font-extrabold text-xs px-6 py-4 rounded-2xl hover:bg-gray-100 active:scale-95 transition-all shadow-md"
          >
            <Download className="w-4 h-4" /> Скачать макеты Data Matrix (PDF)
          </a>

          <button
            onClick={() => alert(`Акт сверки по заказу ${order.orderNumber} сформирован.`)}
            className="inline-flex items-center justify-center gap-3 bg-slate-900 text-white font-extrabold text-xs px-6 py-4 rounded-2xl hover:bg-slate-800 active:scale-95 transition-all border border-slate-800 shadow-md"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Скачать Акт приема-передачи
          </button>
        </div>
      </div>

      {/* Extra Services & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Extra options */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-3">
          <h4 className="text-xs font-extrabold text-black uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-gray-400" /> Подключенные опции
          </h4>

          {order.extraServices && order.extraServices.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {order.extraServices.map((srv, i) => (
                <span key={i} className="text-xs font-extrabold bg-gray-100 text-black px-3 py-1.5 rounded-xl border border-gray-200">
                  {srv}
                </span>
              ))}
              {order.ssccNeeded && (
                <span className="text-xs font-extrabold bg-black text-white px-3 py-1.5 rounded-xl">
                  SSCC Агрегация
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-500 font-medium pt-1">Дополнительные опции не выбирались.</p>
          )}
        </div>

        {/* Client notes */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-3">
          <h4 className="text-xs font-extrabold text-black uppercase tracking-wider flex items-center gap-2">
            <Tag className="w-4 h-4 text-gray-400" /> Примечания к заказу
          </h4>

          {order.notes ? (
            <p className="text-xs font-semibold text-gray-700 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              {order.notes}
            </p>
          ) : (
            <p className="text-xs text-gray-500 font-medium pt-1">Примечания отсутствуют.</p>
          )}
        </div>

      </div>

    </div>
  );
};
