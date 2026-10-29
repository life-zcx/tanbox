import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { TariffItem } from '../../types';

interface TariffHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTariff?: (tariffCode: 'DIGITAL' | 'PRINT' | 'STANDARD' | 'PRO') => void;
  dbTariffs?: TariffItem[];
  initialTab?: 'batch' | 'outsourcing' | 'cards' | 'training';
}

export const TariffHelpModal: React.FC<TariffHelpModalProps> = ({
  isOpen,
  onClose,
  onSelectTariff,
  dbTariffs,
  initialTab = 'batch',
}) => {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<'batch' | 'outsourcing' | 'cards' | 'training'>(initialTab);

  const getTariffPrice = (code: string, fallback: number) => {
    const found = dbTariffs?.find((t) => t.code === code);
    const minPrice = found?.priceLargeWholesale ?? found?.priceMin ?? fallback;
    if (lang === 'kz') return `${minPrice} ₸ / данадан`;
    if (lang === 'en') return `from ${minPrice} ₸ / pcs`;
    return `от ${minPrice} ₸ / шт.`;
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (initialTab) {
        setActiveTab(initialTab);
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tabsList = [
    {
      id: 'batch',
      label: lang === 'kz' ? 'Партияны таңбалау' : lang === 'en' ? 'Batch Tariffs' : 'Партия под ключ',
    },
    {
      id: 'outsourcing',
      label: lang === 'kz' ? 'Толық аутсорсинг' : lang === 'en' ? 'Outsourcing' : 'Полный аутсорсинг',
    },
    {
      id: 'cards',
      label: lang === 'kz' ? 'Тауар карточкалары' : lang === 'en' ? 'Product Cards' : 'Карточки товаров',
    },
    {
      id: 'training',
      label: lang === 'kz' ? 'Оқыту' : lang === 'en' ? 'Training' : 'Обучение',
    },
  ];

  const batchTariffs = [
    {
      code: 'DIGITAL' as const,
      name: 'Цифровой',
      badge: 'Только коды',
      price: getTariffPrice('DIGITAL', 10),
      desc: 'Для компаний со своим термотрансферным принтером и персоналом для оклейки.',
      weDo: [
        'Эмиссия кодов Data Matrix в ИС Танба / ИС МПТ',
        'Выгрузка готовых файлов в PDF, CSV, Excel',
        'Проверка валидности структуры криптозащиты',
      ],
      clientDo: 'Печать этикеток и оклейка товаров силами заказчика.',
    },
    {
      code: 'PRINT' as const,
      name: 'Печать',
      badge: 'Печать рулонов',
      price: getTariffPrice('PRINT', 25),
      desc: 'Для компаний с персоналом для нанесения, но без промышленного печатного оборудования.',
      weDo: [
        'Эмиссия кодов Data Matrix в системе',
        'Термотрансферная печать рулонов стикеров (смола / воск)',
        '100% верификация считываемости 2D-сканером',
        'Доставка готовых рулонов по Казахстану',
      ],
      clientDo: 'Приемка рулонов и оклейка продукции на своем складе.',
    },
    {
      code: 'STANDARD' as const,
      name: 'Стандарт',
      badge: 'Печать и оклейка',
      price: getTariffPrice('STANDARD', 50),
      desc: 'Для моно-партий в стандартных коробках, когда требуется маркировка партии под ключ.',
      weDo: [
        'Эмиссия кодов и печать этикеток в рулонах',
        'Выезд мобильной бригады оклейщиков на склад или СВХ',
        'Поточная оклейка без вскрытия индивидуальных упаковок',
        'Контрольное сканирование и закрывающие акты',
      ],
      clientDo: 'Предоставление доступа к партии товара на складе.',
    },
    {
      code: 'PRO' as const,
      name: 'PRO Склад',
      badge: 'Полный цикл + SSCC',
      price: getTariffPrice('PRO', 90),
      desc: 'Для сборных грузов, обуви, одежды и поставок в маркетплейсы и ритейл с агрегацией.',
      weDo: [
        'Все этапы тарифа «Стандарт» (коды + печать + оклейка)',
        'Вскрытие коробов, сверка артикулов и пересчет',
        'Поштучная оклейка и переупаковка',
        'Формирование групповых кодов коробов (SSCC)',
        'Отчет о вводе в оборот и передача по ЭСФ',
      ],
      clientDo: 'Приемка готовой партии с закрывающими документами.',
    },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6 overflow-hidden bg-black/60 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-4xl my-auto overflow-hidden shadow-2xl border border-gray-200 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 sm:px-8 sm:py-5 border-b border-gray-200 flex items-center justify-between gap-4 bg-white shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#111827]">
              {lang === 'kz' ? 'Тарифтер мен қызметтер анықтамалығы' : lang === 'en' ? 'Pricing & Services Guide' : 'Справка по тарифам и услугам'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {lang === 'kz'
                ? 'Регламент, жұмыс құрамы және жауапкершілік шекаралары'
                : lang === 'en'
                ? 'Service breakdown, deliverables, and scope of work'
                : 'Регламент выполнения, состав работ и распределение ответственности'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clean Underline Tabs - Perfectly aligned, no pills, no overflow glitch */}
        <div className="flex border-b border-gray-200 px-6 sm:px-8 gap-6 sm:gap-8 bg-gray-50/70 shrink-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabsList.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap outline-none ${
                  isActive
                    ? 'border-[#0082FB] text-[#0082FB]'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable Body - Styled thin scrollbar without clunky native 17px track */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 [scrollbar-width:thin] [scrollbar-color:#CBD5E1_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* TAB 1: BATCH TARIFFS */}
          {activeTab === 'batch' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {batchTariffs.map((t) => (
                <div
                  key={t.code}
                  className="rounded-2xl border border-gray-200 p-5 space-y-3 bg-[#F8FAFC]/50 flex flex-col justify-between hover:border-gray-300 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-gray-600 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                        {t.badge}
                      </span>
                      <span className="text-sm font-bold text-[#111827]">
                        {t.price}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[#111827]">
                        Тариф «{t.name}»
                      </h3>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        {t.desc}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 space-y-1.5 text-xs">
                      <span className="font-semibold text-gray-900 block text-[11px]">Что выполняет TANBOX:</span>
                      <ul className="space-y-1 text-gray-600">
                        {t.weDo.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-gray-400 font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2.5 border-t border-gray-100 text-xs text-gray-500">
                      <span className="font-semibold text-gray-800 block text-[11px]">Действия клиента:</span>
                      <p className="mt-0.5">{t.clientDo}</p>
                    </div>
                  </div>

                  {onSelectTariff && (
                    <div className="pt-3 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTariff(t.code);
                          onClose();
                        }}
                        className="w-full inline-flex items-center justify-center gap-1.5 bg-[#0082FB] hover:bg-[#0070DA] text-white font-semibold text-xs py-2 px-3 rounded-xl transition-all active:scale-95 cursor-pointer"
                      >
                        <span>Выбрать {t.name}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: OUTSOURCING */}
          {activeTab === 'outsourcing' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  Полный аутсорсинг маркировки
                </h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed max-w-2xl">
                  Передача всех регулярных операций по маркировке выделенным специалистам TANBOX. Полноценная замена штатному оператору маркировки.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl border border-gray-200 bg-[#F8FAFC]/50 space-y-3">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Зона ответственности TANBOX
                  </span>
                  <ul className="space-y-2 text-xs text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-[#0082FB] font-bold">•</span>
                      <span>Ведение личных кабинетов в ИС МПТ, СУЗ/OMS, НКТ</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#0082FB] font-bold">•</span>
                      <span>Регулярный заказ кодов Data Matrix под поставки</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#0082FB] font-bold">•</span>
                      <span>Формирование групповых упаковок и кодов SSCC</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#0082FB] font-bold">•</span>
                      <span>Акты приема-передачи (АПП) и уведомления о ввозе</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#0082FB] font-bold">•</span>
                      <span>Контроль регламентных сроков подачи сведений</span>
                    </li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl border border-gray-200 bg-[#F8FAFC]/50 space-y-3">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Зона ответственности заказчика
                  </span>
                  <ul className="space-y-2 text-xs text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 font-bold">•</span>
                      <span>Предоставление списков артикулов и спецификаций</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 font-bold">•</span>
                      <span>Делегирование прав оператора в кабинете через ЭЦП</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 font-bold">•</span>
                      <span>Пополнение баланса лицевого счета Единого оператора</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 font-bold">•</span>
                      <span>Физическое нанесение этикеток на складе</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CARDS */}
          {activeTab === 'cards' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  Карточки товаров и реестры
                </h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed max-w-2xl">
                  Регистрация номенклатуры в государственных реестрах маркировки Республики Казахстан.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl border border-gray-200 bg-[#F8FAFC]/50 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h4 className="font-bold text-gray-900 text-sm">ИС МПТ</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Каталог маркированных товаров. Необходим для заказа кодов Data Matrix. Заполнение атрибутивного состава (бренд, состав, размер, страна).
                    </p>
                  </div>
                  <div className="pt-2 border-t border-gray-200/60 text-[11px] text-gray-400">
                    Срок модерации: 1–2 рабочих дня
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-gray-200 bg-[#F8FAFC]/50 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h4 className="font-bold text-gray-900 text-sm">НКТ</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Национальный каталог товаров РК. Внесение существующих штрихкодов EAN-13 в реестр и привязка кодов ТН ВЭД.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-gray-200/60 text-[11px] text-gray-400">
                    Срок модерации: до 24 часов
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-gray-200 bg-[#F8FAFC]/50 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h4 className="font-bold text-gray-900 text-sm">GS1 + МПТ + НКТ</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Комплексный пакет для импортеров без штрихкодов: получение кодов GTIN в GS1 Kazakhstan, регистрация в НКТ и перенос в ИС МПТ.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-gray-200/60 text-[11px] text-gray-400">
                    Под ключ с присвоением GTIN
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TRAINING */}
          {activeTab === 'training' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  Корпоративное обучение маркировке
                </h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed max-w-2xl">
                  Практический онлайн-курс для бухгалтеров, логистов и складского персонала на реальных процессах вашей компании.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl border border-gray-200 bg-[#F8FAFC]/50 space-y-2">
                  <span className="text-[11px] font-semibold text-gray-500 block">Занятие 1 • 90 мин</span>
                  <h4 className="font-bold text-gray-900 text-sm">Кабинеты и номенклатура</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Настройка ЭЦП, роли сотрудников, работа в ИС МПТ и НКТ, сопоставление кодов ТН ВЭД.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-gray-200 bg-[#F8FAFC]/50 space-y-2">
                  <span className="text-[11px] font-semibold text-gray-500 block">Занятие 2 • 90 мин</span>
                  <h4 className="font-bold text-gray-900 text-sm">Эмиссия и печать</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Заказ кодов в СУЗ, печать на термотрансферных принтерах, агрегация коробов (SSCC).
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-gray-200 bg-[#F8FAFC]/50 space-y-2">
                  <span className="text-[11px] font-semibold text-gray-500 block">Занятие 3 • 90 мин</span>
                  <h4 className="font-bold text-gray-900 text-sm">Документооборот</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Уведомления о ввозе из ЕАЭС и третьих стран, оформление актов приема-передачи (АПП), списание брака.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-600">
                <div className="space-y-0.5">
                  <span className="font-semibold text-gray-900 block text-xs">Формат и материалы</span>
                  <span>3 онлайн-сессии в Google Meet / Zoom с демонстрацией экрана. Записи сессий и регламенты в PDF передаются навсегда.</span>
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  <span className="text-xs font-semibold text-gray-700 block">до 5 сотрудников компании</span>
                  <span className="text-[11px] text-gray-400">Индивидуальный график сессий</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 sm:px-8 border-t border-gray-200 bg-gray-50/70 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

