import React, { useState, useEffect, useMemo } from 'react';
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
import { setPageSeo } from '../utils/seo';

export interface ServiceItem {
  id: string;
  title: string;
  badge: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
}

import { useLanguage } from '../context/LanguageContext';

export const ServicesPage: React.FC = () => {
  const { lang } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (lang === 'kz') {
      setPageSeo(
        'Қазақстанда тауарларды «кілтке дейін» таңбалау қызметтері (ҰТК, Қойма, Оклейка) | TANBOX.KZ',
        'ҚР-да цифрлық таңбалау бойынша кешенді қызметтер: кедендік қоймаларда таңбалау (ИМ-70), Ұлттық тауарлар каталогында (ҰТК) номенклатураны тіркеу, Data Matrix кодтарын генерациялау, стикерлерді басып шығару және 1С-пен интеграция.',
        { lang: 'kz', keywords: 'таңбалау қызметтері Қазақстан, ҰТК тіркеу, кеденнен таңбалау, Data Matrix басу' }
      );
    } else if (lang === 'en') {
      setPageSeo(
        'Turnkey Product Serialization & NKT Registration in Kazakhstan | TANBOX.KZ',
        'Full-scope digital product serialization in Kazakhstan: customs warehouse marking (IM-70), National Product Catalog (NKT) registration, Data Matrix issuance, industrial sticker printing, and 1C ERP sync.',
        { lang: 'en', keywords: 'serialization services Kazakhstan, customs warehouse labeling, NKT catalog' }
      );
    } else {
      setPageSeo(
        'Услуги цифровой маркировки товаров «под ключ» в Казахстане (НКТ, СВХ, Оклейка) | TANBOX.KZ',
        'Комплексные услуги цифровой маркировки в РК: маркировка на таможенных складах (ИМ-70), регистрация номенклатуры в Национальном каталоге товаров (НКТ), генерация кодов Data Matrix, печать стикеров и интеграция с 1С.',
        { lang: 'ru', keywords: 'услуги маркировки Казахстан, маркировка под ключ, НКТ СВХ 1С' }
      );
    }
  }, [lang]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServiceTitle, setSelectedServiceTitle] = useState('');

  const handleOpenModal = (title: string) => {
    setSelectedServiceTitle(title);
    setIsModalOpen(true);
  };

  const services: ServiceItem[] = useMemo(() => {
    if (lang === 'kz') {
      return [
        {
          id: 'customs',
          title: 'Тауарларды кедендік қоймаларда таңбалау (ИМ-70)',
          badge: 'Қойма және Логистика',
          desc: 'Еркін айналымға шығарылғанға дейін кедендік қоймаларда (ИМ-70 режимінде) Data Matrix кодтарын басу және жапсыру бойынша толық қызметтер кешені.',
          icon: Truck,
          features: [
            'Кедендік қойма (ИМ-70) және АЭА рәсімдерінде таңбалау',
            '31-бағанға енгізу үшін таңбалау кодтары туралы деректерді дайындау',
            'Кеден одағының техникалық регламенттеріне сай макеттер әзірлеу',
            'Жылдам тексеру үшін қораптар мен паллеттерді агрегациялау (SSCC)',
          ],
        },
        {
          id: 'nkt',
          title: 'Тауарларды ҰТК каталогына енгізу (Ұлттық каталог)',
          badge: 'Тіркеу және Каталогтау',
          desc: 'ҚР Бірыңғай ұлттық тауарлар каталогына (ҰТК) номенклатураны енгізу және GTIN / NTIN кодтарын алу. Атрибуттарды толтыру және модерациядан өткізу.',
          icon: FileSpreadsheet,
          features: [
            'GTIN / NTIN кодтарын тіркеу және тағайындау',
            '1С / Excel файлдарынан спецификацияларды жаппай жүктеу',
            'ҰТК модерациясынан қатесіз өту',
            'ТН ВЭД және ТСБК кодтарын дұрыс байланыстыру',
          ],
        },
        {
          id: 'datamatrix',
          title: 'Data Matrix кодтарын эмиссиялау және жапсыру',
          badge: 'ҚР Таңбалауы',
          desc: '«Таңба» АЖ-де кодтарға тапсырыс беру, төзімді стикерлерді жоғары жылдамдықта басу және қаптаманың кез келген түріне жапсыру.',
          icon: QrCode,
          features: [
            'Ұлттық оператордың API арқылы 2D-кодтарды алу',
            'Өнеркәсіптік және фармацевтикалық термо-стикерлерді басу',
            'Аяқ киім, жеңіл өнеркәсіп, сусындар мен дәрілерді таңбалау',
            '2D сканерлермен оқылу сапасын 100% бақылау',
          ],
        },
        {
          id: 'aggregation',
          title: 'Қораптар мен паллеттерге агрегациялау (SSCC)',
          badge: 'Логистикалық агрегация',
          desc: 'Қораптар мен паллеттер үшін көліктік SSCC кодтарын қалыптастыру және басып шығару. Қоймада қабылдауды және кедендік тексеруден өтуді жеңілдету.',
          icon: Layers,
          features: [
            'GS1 халықаралық стандарттары бойынша SSCC кодтары',
            'Data Matrix кодтарын топтық қаптамаға жекелеп бекіту',
            'Паллеттік және қораптық A5 / A6 белгілерін басу',
            'Қоймалық қабылдауды 10 есе жылдамдату',
          ],
        },
        {
          id: 'mobile-teams',
          title: 'Көшпелі мобильді стикерлеушілер тобы (24/7)',
          badge: 'Қоймаға шығу',
          desc: 'Қазақстанның кез келген аймағындағы қоймаңызға өз жабдықтарымен және шығын материалдарымен кәсіби таңбалаушылар тобының шығуы.',
          icon: Users,
          features: [
            'Алматы, Астана және ҚР аймақтарындағы қоймаларға 24/7 шығу',
            'Жеке өндірістік принтерлер мен аппликаторлар',
            'Жоғары жылдамдық: ауысымына 50 000 данаға дейін',
            'Орындалған жұмыс актілерін орнында рәсімдеу',
          ],
        },
        {
          id: 'integration',
          title: '«Таңба» АЖ жүйесін 1С / ERP-мен интеграциялау',
          badge: 'АТ және Аудит',
          desc: 'Есеп жүйеңізде толық прослеживаемостьты баптау, қызметкерлерді оқыту, мемлекеттік органдардың тексерулеріне дайындық.',
          icon: Cpu,
          features: [
            '«Таңба» АЖ мен 1С:Кәсіпорын / ERP / WMS дерек алмасуын баптау',
            'Қоймашылар мен операторларды 2D сканерлермен жұмыс істеуге үйрету',
            'Тексерулер алдында таңбалау процестеріне аудит жүргізу',
            'Тәулік бойы 24/7 техникалық қолдау',
          ],
        },
      ];
    }

    if (lang === 'en') {
      return [
        {
          id: 'customs',
          title: 'Customs Warehouse Serialization (IM-70)',
          badge: 'Warehouse & Logistics',
          desc: 'Full-scope Data Matrix printing and stickering services at customs bonded warehouses (IM-70 regime) prior to release into free circulation.',
          icon: Truck,
          features: [
            'Labeling under customs warehouse (IM-70) and SEZ procedures',
            'Preparing serialization code data for entry into declaration box 31',
            'Label layout design compliant with technical regulations',
            'Box and pallet aggregation (SSCC) for rapid inspection',
          ],
        },
        {
          id: 'nkt',
          title: 'Product Cataloging in NKT (GS1 KZ)',
          badge: 'Registration & Cataloging',
          desc: 'Submitting SKU master data to the National Product Catalog of Kazakhstan to obtain official GTIN/NTIN codes with full attribute approval.',
          icon: FileSpreadsheet,
          features: [
            'Registration and issuance of GTIN / NTIN codes',
            'Bulk specification upload from 1C / Excel',
            'Guaranteed moderation approval in NKT portal',
            'Accurate HS Code and product category mapping',
          ],
        },
        {
          id: 'datamatrix',
          title: 'Data Matrix Code Emission & Stickering',
          badge: 'Kazakhstan Serialization',
          desc: 'Ordering official Data Matrix pools from IS Tanba, high-speed thermal label printing, and applying stickers onto any product packaging.',
          icon: QrCode,
          features: [
            '2D code emission via National Operator API',
            'Industrial and pharma-grade thermal transfer labels',
            'Serialization for footwear, apparel, water, and pharma',
            '100% 2D barcode scanner readability verification',
          ],
        },
        {
          id: 'aggregation',
          title: 'Carton & Pallet Aggregation (SSCC)',
          badge: 'Logistics Aggregation',
          desc: 'Generating and printing SSCC transport barcodes for cartons and pallets. Accelerating terminal intake and customs verification.',
          icon: Layers,
          features: [
            'GS1 compliant SSCC code generation',
            'Item Data Matrix association to carton hierarchy',
            'Printing pallet and carton transport labels (A5 / A6)',
            '10x faster warehouse receiving and customs control',
          ],
        },
        {
          id: 'mobile-teams',
          title: 'Onsite Mobile Stickering Crews (24/7)',
          badge: 'Warehouse Dispatch',
          desc: 'Deploying professional stickering crews equipped with mobile thermal printers directly to your warehouse across Kazakhstan.',
          icon: Users,
          features: [
            '24/7 dispatch across Almaty, Astana, and regions',
            'Proprietary industrial roll printers & applicators',
            'High throughput: up to 50,000 units per shift',
            'Onsite handover documentation completion',
          ],
        },
        {
          id: 'integration',
          title: '1C / ERP & IS Tanba System Integration',
          badge: 'IT & Audit',
          desc: 'Configuring automated track & trace exchange in your ERP, training personnel, and conducting regulatory compliance audits.',
          icon: Cpu,
          features: [
            'Configuring IS Tanba data exchange with 1C / WMS',
            'Training warehouse staff on 2D barcode scanners',
            'Pre-inspection regulatory compliance audits',
            '24/7 dedicated enterprise technical support',
          ],
        },
      ];
    }

    return [
      {
        id: 'customs',
        title: 'Маркировка на таможенных складах (ИМ-70)',
        badge: 'Склады и Логистика',
        desc: 'Комплекс услуг по нанесению кодов Data Matrix и оклейке партий на таможенных складах (режим ИМ-70) до выпуска товаров в свободное обращение.',
        icon: Truck,
        features: [
          'Маркировка товаров в таможенной процедуре ИМ-70 и СЭЗ',
          'Подготовка сведений о кодах маркировки для внесения в графу 31 декларации',
          'Разработка макетов этикеток по техническим регламентам ЕАЭС',
          'Агрегация кодов в короба и паллеты (SSCC) для ускоренного досмотра',
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
  }, [lang]);

  return (
    <div className="bg-[#F4F6F9] min-h-screen pb-20 space-y-6 sm:space-y-12">
      
      {/* Header Banner */}
      <section className="relative py-4 sm:py-8 lg:py-9 bg-white border-b border-gray-200/80 overflow-hidden">
        {/* Subtle grid pattern & ambient tint */}
        <div className="absolute inset-0 bg-[radial-gradient(#0082FB_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.07] pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0082FB]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-100/30 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 lg:gap-8">
          <div className="space-y-1.5 sm:space-y-4 max-w-3xl">
            <h1 className="text-xl sm:text-4xl lg:text-5xl font-extrabold text-[#111827] tracking-tight leading-tight">
              {lang === 'kz'
                ? 'Таңбалау, ҰТК және қоймалық оклейка бойынша кешенді қызметтер'
                : lang === 'en'
                ? 'Turnkey Product Serialization, Warehouse Labeling & NKT Services'
                : 'Комплексные услуги по маркировке, заведению в НКТ и оклейке на складах'}
            </h1>
            <p className="text-xs sm:text-base lg:text-lg text-[#64748B] font-normal leading-relaxed">
              {lang === 'kz'
                ? 'Кез келген сұрақ бойынша кәсіби қолдау: ҰТК-ға тауарларды енгізуден бастап кедендік қоймаларда таңбалауға дейін.'
                : lang === 'en'
                ? 'End-to-end expertise: from NKT catalog registration to onsite and bonded warehouse serialization.'
                : 'Экспертное сопровождение: от заведения товаров в Национальный каталог (НКТ) до выездной маркировки на вашем или таможенном складе.'}
            </p>
          </div>

          <div className="hidden md:flex shrink-0 items-center justify-end">
            <img
              src="/banners/services.svg"
              alt="Услуги маркировки Танбокс"
              className="w-40 sm:w-52 md:w-60 lg:w-72 h-auto max-h-36 sm:max-h-44 md:max-h-52 lg:max-h-56 object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-300 hover:scale-105"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((srv) => {
            return (
              <div
                key={srv.id}
                onClick={() => handleOpenModal(srv.title)}
                className="bg-white rounded-3xl p-7 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-6 group relative overflow-hidden cursor-pointer"
              >
                <div className="space-y-4">
                  {/* Title & Desc */}
                  <div>
                    <h3 className="text-xl font-bold text-[#111827] leading-snug group-hover:text-[#0082FB] transition-colors">
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
                    {lang === 'kz' ? 'Қызметке тапсырыс беру' : lang === 'en' ? 'Order service' : 'Заказать услугу'} <ArrowRight className="w-3.5 h-3.5" />
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
              {lang === 'kz'
                ? 'Таңбалау немесе ҰТК карточкаларын енгізу бойынша жеке есептеу қажет пе?'
                : lang === 'en'
                ? 'Need a custom quote for batch serialization or NKT catalog registration?'
                : 'Нужен индивидуальный расчет маркировки партии или заведения карточек в НКТ?'}
            </h3>
            <p className="text-sm text-slate-300">
              {lang === 'kz'
                ? 'Біздің мамандармен хабарласыңыз. Номенклатураңызға тегін аудит жүргізіп, 15 минутта коммерциялық ұсыныс дайындаймыз.'
                : lang === 'en'
                ? 'Contact our specialists. We will conduct a free SKU audit and deliver a customized commercial offer in 15 minutes.'
                : 'Свяжитесь с нашими специалистами. Проведем бесплатный аудит вашей номенклатуры и подготовим коммерческое предложение за 15 минут.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleOpenModal(lang === 'kz' ? 'Кешенді аудит / Басқа сұрақ' : lang === 'en' ? 'Turnkey Audit / Inquiries' : 'Другой вопрос / Комплексный аудит')}
            className="inline-flex items-center gap-2 bg-[#0082FB] text-white font-extrabold text-sm px-8 py-4 rounded-2xl hover:bg-[#0070DA] transition-all shrink-0 active:scale-95 shadow-md cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            {lang === 'kz' ? 'Кеңес алу' : lang === 'en' ? 'Get Consultation' : 'Получить консультацию'}
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
