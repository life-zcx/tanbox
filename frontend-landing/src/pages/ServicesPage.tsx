import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Truck, 
  FileSpreadsheet, 
  QrCode, 
  Layers, 
  Users, 
  Cpu, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  PhoneCall 
} from 'lucide-react';
import { ServiceOrderModal } from '../components/modals/ServiceOrderModal';

export interface ServiceItem {
  id: string;
  title: string;
  badge: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
}

export const ServicesPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServiceTitle, setSelectedServiceTitle] = useState('');

  const handleOpenModal = (title: string) => {
    setSelectedServiceTitle(title);
    setIsModalOpen(true);
  };

  const services: ServiceItem[] = [
    {
      id: 'customs',
      title: 'Таможенное оформление и растаможка грузов',
      badge: 'ВЭД и Логистика',
      desc: 'Полный комплекс услуг по очистке и таможенному декларированию грузов на границах РК. Работаем с поставками из Китая, Турции, Европы и стран ЕАЭС.',
      icon: Truck,
      features: [
        'Таможенное декларирование (ГТД / ДТ)',
        'Классификация и аудит кодов ТН ВЭД РК',
        'Получение сертификатов и деклараций соответствия',
        'Расчет и оптимизация таможенных пошлин и НДС',
      ],
    },
    {
      id: 'nkt',
      title: 'Заведение товаров в НКТ (Каталог товаров)',
      badge: 'Регистрация и Каталогизация',
      desc: 'Внесение номенклатуры продукции и получение кодов GTIN / NTIN в Едином национальном каталоге товаров РК. Заполнение аттрибутов и прохождение модерации.',
      icon: FileSpreadsheet,
      features: [
        'Регистрация и присвоение кодов GTIN / NTIN',
        'Массовая загрузка спецификаций из 1С / Excel',
        'Безошибочное прохождение модерации в НКТ',
        'Корректная привязка кодов ТН ВЭД и ГСВС',
      ],
    },
    {
      id: 'datamatrix',
      title: 'Эмиссия и нанесение кодов Data Matrix',
      badge: 'Маркировка РК',
      desc: 'Заказ кодов в ИС Танба, высокоскоростная печать устойчивых стикеров и их нанесение на любые виды потребительской упаковки товаров.',
      icon: QrCode,
      features: [
        'Эмиссия 2D-кодов через API Национального Оператора',
        'Печать уличных и фармацевтических термо-стикеров',
        'Маркировка обуви, легпрома, напитков и лекарств',
        'Контроль 100% считываемости сканерами 2D',
      ],
    },
    {
      id: 'aggregation',
      title: 'Агрегация в короба и паллеты (SSCC)',
      badge: 'Логистическая агрегация',
      desc: 'Формирование и печать транспортных кодов SSCC для коробов и паллет. Упрощение приемки грузов на складах и прохождения таможенного контроля.',
      icon: Layers,
      features: [
        'Генерация кодов SSCC по международным стандартам GS1',
        'Поштучная привязка Data Matrix к групповой упаковке',
        'Печать паллетных и коробочных ярлыков A5 / A6',
        'Ускорение складской приемки в 10 раз',
      ],
    },
    {
      id: 'mobile-teams',
      title: 'Выездные мобильные бригады оклейщиков (24/7)',
      badge: 'Выезд на склад',
      desc: 'Выезд квалифицированных бригад маркировщиков со своим оборудованием и риббонами непосредственно на ваш склад в любом регионе Казахстана.',
      icon: Users,
      features: [
        'Выезд на склады Алматы, Астаны и регионов РК 24/7',
        'Собственные промышленные принтеры и аппликаторы',
        'Высокая скорость: до 50 000 оклеенных единиц в смену',
        'Подписание актов выполненных работ на месте',
      ],
    },
    {
      id: 'integration',
      title: 'Интеграция ИС Танба с 1С / ERP и Консалтинг',
      badge: 'ИТ и Аудит',
      desc: 'Полный настрой прослеживаемости в вашей учетной системе, обучение персонала, подготовка к проверочным мероприятиям государственных органов.',
      icon: Cpu,
      features: [
        'Настройка обмена ИС Танба с 1С:Предприятие / ERP / WMS',
        'Обучение кладовщиков и операторов работе с 2D-сканерами',
        'Аудит процессов маркировки перед проверками',
        'Круглосуточная техническая поддержка 24/7',
      ],
    },
  ];

  return (
    <div className="bg-[#F4F6F9] min-h-screen pb-20 space-y-12">
      
      {/* Header Banner */}
      <section className="py-10 sm:py-16 bg-white border-b border-gray-200/80">
        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#111827] tracking-tight leading-tight max-w-4xl">
            Комплексные услуги по маркировке, растаможке и НКТ
          </h1>
          <p className="text-base sm:text-lg text-[#64748B] max-w-3xl font-normal leading-relaxed">
            Предоставляем экспертное сопровождение по любым вопросам: от растаможки грузов на границе и заведения товаров в Национальный каталог (НКТ) до выездной маркировки на вашем складе.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((srv) => {
            const IconComponent = srv.icon;
            return (
              <div
                key={srv.id}
                onClick={() => handleOpenModal(srv.title)}
                className="bg-white rounded-3xl p-7 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-6 group relative overflow-hidden cursor-pointer"
              >
                <div className="space-y-4">
                  
                  {/* Icon */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#EBF5FF] text-[#0082FB] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <IconComponent className="w-6 h-6 stroke-[2]" />
                    </div>
                  </div>

                  {/* Title & Desc */}
                  <div>
                    <h3 className="text-xl font-bold text-[#111827] leading-snug">
                      {srv.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed mt-2 font-normal">
                      {srv.desc}
                    </p>
                  </div>

                  {/* Feature Checklist */}
                  <div className="pt-2 space-y-2 border-t border-gray-100">
                    {srv.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2.5 text-xs text-[#111827] font-medium">
                        <CheckCircle2 className="w-4 h-4 text-[#0082FB] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                </div>

                {/* Action Link / Button */}
                <div className="pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleOpenModal(srv.title)}
                    className="inline-flex items-center gap-2 text-xs font-extrabold text-[#0082FB] hover:text-[#0070DA] transition-colors cursor-pointer"
                  >
                    Заказать услугу <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0F172A] text-white rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-2 max-w-2xl text-center md:text-left">
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Нужен индивидуальный расчет растаможки или заведения карточек в НКТ?
            </h3>
            <p className="text-sm text-slate-300">
              Свяжитесь с нашими специалистами. Проведем бесплатный аудит вашей номенклатуры и подготовим коммерческое предложение за 15 минут.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleOpenModal('Другой вопрос / Комплексный аудит')}
            className="inline-flex items-center gap-2 bg-[#0082FB] text-white font-extrabold text-sm px-8 py-4 rounded-2xl hover:bg-[#0070DA] transition-all shrink-0 active:scale-95 shadow-md cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            Получить консультацию
          </button>
        </div>
      </section>

      {/* Service Order Modal */}
      <ServiceOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialServiceTitle={selectedServiceTitle}
      />

    </div>
  );
};
