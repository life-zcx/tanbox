import React from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Minus, HelpCircle, FileCode, Printer, Users, Box, ArrowRight } from 'lucide-react';
import { TariffType } from '../../types';

interface TariffHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTariff?: (tariff: TariffType) => void;
  currentTariff?: TariffType | null;
}

export const TariffHelpModal: React.FC<TariffHelpModalProps> = ({
  isOpen,
  onClose,
  onSelectTariff,
  currentTariff,
}) => {
  if (!isOpen) return null;

  const tariffs = [
    {
      type: 'DIGITAL' as TariffType,
      name: 'Цифровой',
      price: 'от 10 ₸ / шт.',
      badge: 'Электронный',
      icon: FileCode,
      target: 'Для тех, у кого есть свои принтеры этикеток и складские сотрудники.',
      included: [
        'Проверка кодов маркировки и криптохвостов на корректность',
        'Генерация готовых печатных файлов (векторный PDF под принтеры)',
        'Выгрузка макетов в личном кабинете сразу после готовности',
      ],
      clientDuty: 'Печать стикеров и оклейка товаров на своем складе.',
    },
    {
      type: 'PRINT' as TariffType,
      name: 'Печатный',
      price: 'от 25 ₸ / шт.',
      badge: 'Печать рулонов',
      icon: Printer,
      target: 'Для тех, кто клеит сам, но нет промышленного принтера и качественной ленты.',
      included: [
        'Проверка кодов и формирование печатных макетов',
        'Печать на промышленных рулонах (термотрансфер, resin-лента)',
        '100% оптический контроль считываемости сканером',
        'Упаковка рулонов и передача в курьерскую доставку или самовывоз',
      ],
      clientDuty: 'Оклейка товаров на складе полученными рулонами.',
    },
    {
      type: 'STANDARD' as TariffType,
      name: 'Стандарт',
      price: 'от 50 ₸ / шт.',
      badge: 'Под ключ',
      icon: Users,
      target: 'Импортерам и селлерам маркетплейсов для оклейки партии без отвлечения своих сотрудников.',
      included: [
        'Подготовка кодов и печать этикеток на производстве TANBOX',
        'Выезд бригады маркировщиков на ваш склад в Казахстане',
        'Сплошное нанесение стикеров на каждую единицу товара',
        'Акт выполненных работ и итоговый отчет с реестром кодов',
      ],
      clientDuty: 'Предоставить доступ к партии на складе.',
    },
    {
      type: 'PRO' as TariffType,
      name: 'PRO Склад',
      price: 'от 90 ₸ / шт.',
      badge: 'Полный цикл + SSCC',
      icon: Box,
      target: 'Крупным поставкам на склады Wildberries / Ozon и в торговые сети с агрегацией.',
      included: [
        'Все опции тарифа «Стандарт» (печать + выездная оклейка)',
        'Вскрытие коробов, поштучная сверка артикулов и отбраковка',
        'Маркировка единиц товара',
        'Формирование коробов и паллет с нанесением кодов агрегации (SSCC)',
        'Готовый агрегационный отчет для загрузки в ИС Танба / Честный Знак',
      ],
      clientDuty: 'Принять готовую партию с актом и отчетом.',
    },
  ];

  const comparisonRows = [
    { label: 'Проверка кодов на дубликаты', digital: true, print: true, standard: true, pro: true },
    { label: 'Генерация готовых макетов Data Matrix', digital: true, print: true, standard: true, pro: true },
    { label: 'Печать на термотрансферных рулонах', digital: false, print: true, standard: true, pro: true },
    { label: 'Выезд специалистов TANBOX на склад в РК', digital: false, print: false, standard: true, pro: true },
    { label: 'Оклейка единиц товара нашими силами', digital: false, print: false, standard: true, pro: true },
    { label: 'Вскрытие и сверка артикулов (брак-контроль)', digital: false, print: false, standard: false, pro: true },
    { label: 'SSCC агрегация коробов и паллет', digital: false, print: false, standard: false, pro: true },
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-4xl w-full p-6 sm:p-8 relative space-y-6 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="border-b border-gray-100 pb-4 pr-10">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0082FB] flex items-center justify-center shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-black text-[#111827]">Справка по тарифам маркировки</h2>
          </div>
          <p className="text-xs text-[#64748B] pl-10.5">
            Каждый тариф закрывает конкретную задачу: от файлов для самостоятельной печати до выездного оклеивания с агрегацией.
          </p>
        </div>

        {/* 4 Tariffs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tariffs.map((t) => {
            const Icon = t.icon;
            const isSelected = currentTariff === t.type;
            return (
              <div
                key={t.type}
                className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'border-[#0082FB] bg-blue-50/30 ring-2 ring-[#0082FB]/20 shadow-xs'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0082FB] flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-extrabold text-[#111827]">{t.name}</h3>
                          {isSelected && (
                            <span className="text-[10px] font-bold text-[#0082FB] bg-blue-100 px-2 py-0.5 rounded-md">
                              Выбран
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-black text-[#0082FB]">{t.price}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#475569] bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <strong className="text-[#111827]">Кому:</strong> {t.target}
                  </p>

                  <div className="space-y-1.5 text-xs text-[#334155]">
                    <span className="font-bold text-[#111827] text-[11px] uppercase tracking-wide block">
                      Что делаем мы:
                    </span>
                    {t.included.map((inc, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{inc}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-gray-100 text-[11px] text-[#64748B]">
                    <strong className="text-[#475569]">Что делает клиент:</strong> {t.clientDuty}
                  </div>
                </div>

                {onSelectTariff && (
                  <div className="pt-4 mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTariff(t.type);
                        onClose();
                      }}
                      className={`w-full py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#0082FB] text-white shadow-xs'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      }`}
                    >
                      <span>{isSelected ? 'Тариф выбран' : `Выбрать тариф «${t.name}»`}</span>
                      {!isSelected && <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
              Сводная таблица сравнения тарифов
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-white border-b border-gray-100 text-[11px] font-bold text-[#64748B]">
                  <th className="py-2.5 px-4">Услуга / этап</th>
                  <th className="py-2.5 px-3 text-center">Цифровой</th>
                  <th className="py-2.5 px-3 text-center">Печатный</th>
                  <th className="py-2.5 px-3 text-center">Стандарт</th>
                  <th className="py-2.5 px-3 text-center">PRO Склад</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {comparisonRows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/60">
                    <td className="py-2.5 px-4 font-medium text-[#111827]">{row.label}</td>
                    <td className="py-2.5 px-3 text-center">
                      {row.digital ? (
                        <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <Minus className="w-4 h-4 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.print ? (
                        <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <Minus className="w-4 h-4 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.standard ? (
                        <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <Minus className="w-4 h-4 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.pro ? (
                        <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <Minus className="w-4 h-4 text-gray-300 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Закрыть справку
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
