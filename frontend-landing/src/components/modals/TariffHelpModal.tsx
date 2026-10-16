import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, ShieldCheck, Cpu, Printer, Users, Layers, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { TariffItem } from '../../types';

interface TariffHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTariff?: (tariffCode: 'DIGITAL' | 'PRINT' | 'STANDARD' | 'PRO') => void;
  dbTariffs?: TariffItem[];
}

export const TariffHelpModal: React.FC<TariffHelpModalProps> = ({
  isOpen,
  onClose,
  onSelectTariff,
  dbTariffs,
}) => {
  const { lang } = useLanguage();

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
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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

  const content = {
    ru: {
      title: 'Справка по тарифам маркировки TANBOX',
      subtitle: 'Подробное описание: что входит в каждый тариф, для кого подходит и разграничение зон ответственности.',
      close: 'Закрыть',
      choose: 'Выбрать тариф',
      tariffs: [
        {
          code: 'DIGITAL' as const,
          badge: 'Только коды',
          price: getTariffPrice('DIGITAL', 10),
          name: 'Тариф «Цифровой»',
          target: 'Для кого: У вас есть собственный промышленный термотрансферный принтер, качественные расходники и штатные сотрудники для нанесения.',
          weDoTitle: 'Что делает TANBOX:',
          weDo: [
            'Заказ и получение пулов кодов Data Matrix в ИС Танба / ИС МПТ',
            'Генерация готовых макетов этикеток (PDF, CSV, Excel)',
            'Проверка структуры криптозащиты и валидности GTIN',
          ],
          clientDoTitle: 'Что делает клиент:',
          clientDo: [
            'Самостоятельная печать стикеров на своем принтере',
            'Поштучное наклеивание этикеток на товар своими силами',
          ],
        },
        {
          code: 'PRINT' as const,
          badge: 'Печать рулонов',
          price: getTariffPrice('PRINT', 25),
          name: 'Тариф «Печатный»',
          target: 'Для кого: Есть сотрудники на складе для оклейки, но нет промышленного принтера высокого разрешения и верификатора считываемости.',
          weDoTitle: 'Что делает TANBOX:',
          weDo: [
            'Эмиссия кодов Data Matrix в государственной системе ИС Танба',
            'Промышленная термотрансферная печать рулонов стикеров (resin/wax-resin)',
            '100% верификация каждого кода аппаратным 2D-сканером',
            'Быстрая доставка готовых рулонов по Алматы и всем регионам РК',
          ],
          clientDoTitle: 'Что делает клиент:',
          clientDo: [
            'Получает готовые рулоны и наклеивает стикеры на складе своими силами',
          ],
        },
        {
          code: 'STANDARD' as const,
          badge: 'Под ключ без вскрытия',
          price: getTariffPrice('STANDARD', 50),
          name: 'Тариф «Стандарт»',
          target: 'Для кого: Импортеры и производители моно-партий в стандартных заводских коробках, которым нужно быстро замаркировать партию без отвлечения своих сотрудников.',
          weDoTitle: 'Что делает TANBOX:',
          weDo: [
            'Эмиссия кодов в ИС Танба + промышленная печать рулонов стикеров',
            'Выезд мобильной бригады со станциями маркировки на ваш склад или СВХ',
            'Потоковое нанесение стикеров без вскрытия индивидуальной тары',
            'Контрольное сканирование и акт выполненных работ',
          ],
          clientDoTitle: 'Что делает клиент:',
          clientDo: [
            'Предоставляет доступ к партии товара на складе и принимает результат',
          ],
        },
        {
          code: 'PRO' as const,
          badge: 'Полный цикл + SSCC',
          price: getTariffPrice('PRO', 90),
          name: 'Тариф «PRO Склад»',
          target: 'Для кого: Сборные грузы (разные размеры, цвета, артикулы), одежда, обувь, поставки для торговых сетей и дистрибьюторов с агрегацией.',
          weDoTitle: 'Что делает TANBOX:',
          weDo: [
            'Всё, что входит в «Стандарт» (эмиссия + печать + выездная оклейка)',
            'Вскрытие транспортных коробок и сверка номенклатуры по артикулам и размерам',
            'Поштучная оклейка каждой единицы с обратной укладкой в коробку',
            'Формирование транспортной агрегации SSCC (штука → коробка → паллета)',
            'Отправка отчета о нанесении в ИС Танба, ввод в оборот и предоставление ЭСФ',
          ],
          clientDoTitle: 'Что делает клиент:',
          clientDo: [
            'Только передает партию и получает товар, 100% готовый к легальной продаже',
          ],
        },
      ],
    },
    kz: {
      title: 'TANBOX таңбалау тарифтері бойынша анықтамалық',
      subtitle: 'Толық сипаттама: әр тарифке не кіреді, кімге арналған және жауапкершілік аймақтарының бөлінісі.',
      close: 'Жабу',
      choose: 'Тарифті таңдау',
      tariffs: [
        {
          code: 'DIGITAL' as const,
          badge: 'Тек кодтар',
          price: getTariffPrice('DIGITAL', 10),
          name: '«Сандық» тарифі',
          target: 'Кімге арналған: Жеке термотрансферлік принтеріңіз, сапалы риббондарыңыз және жапсыратын штаттағы қызметкерлеріңіз бар кезде.',
          weDoTitle: 'TANBOX не істейді:',
          weDo: [
            '«Таңба» АЖ / ТМБ АЖ жүйесінен Data Matrix кодтарын шығару',
            'Дайын жапсырма макеттерін қалыптастыру (PDF, CSV, Excel)',
            'Криптоқорғау құрылымы мен GTIN дұрыстығын тексеру',
          ],
          clientDoTitle: 'Тапсырыс беруші не істейді:',
          clientDo: [
            'Жеке принтерде стикерлерді өз бетінше басып шығару',
            'Қоймада тауарға өз күшімен жекелей жапсыру',
          ],
        },
        {
          code: 'PRINT' as const,
          badge: 'Рулондарды басу',
          price: getTariffPrice('PRINT', 25),
          name: '«Баспа» тарифі',
          target: 'Кімге арналған: Қоймада жапсыратын қызметкерлер бар, бірақ өндірістік жоғары сапалы принтер мен сканер-верификатор жоқ болғанда.',
          weDoTitle: 'TANBOX не істейді:',
          weDo: [
            '«Таңба» АЖ жүйесінде Data Matrix кодтарын эмиссиялау',
            'Төзімді стикерлерді өндірістік термотрансферлік басып шығару (resin/wax-resin)',
            'Әрбір кодтың 100% оқылуын аппараттық 2D сканермен верификациялау',
            'Дайын рулондарды Алматы және ҚР барлық аймақтарына жылдам жеткізу',
          ],
          clientDoTitle: 'Тапсырыс беруші не істейді:',
          clientDo: [
            'Дайын орамдарды қабылдап алып, қоймасында өз күшімен жапсырады',
          ],
        },
        {
          code: 'STANDARD' as const,
          badge: 'Ашпай кілтке дейін',
          price: getTariffPrice('STANDARD', 50),
          name: '«Стандарт» тарифі',
          target: 'Кімге арналған: Стандартты зауыттық қораптардағы моно-партиялары бар импорттаушыларға өз қызметкерлерін бөлмей жылдам оклейка жасау қажет болғанда.',
          weDoTitle: 'TANBOX не істейді:',
          weDo: [
            'Кодтарды эмиссиялау + стикерлерді өндірістік басып шығару',
            'Мобильді станциялармен оклейка бригадасының қоймаңызға немесе УСҚ-ға шығуы',
            'Жеке қаптамаларды ашпай ағынды жапсыру жасау',
            'Бақылау сканерлеуі және орындалған жұмыстар актісі',
          ],
          clientDoTitle: 'Тапсырыс беруші не істейді:',
          clientDo: [
            'Қоймадағы тауарға қолжетімділік береді және дайын нәтижені қабылдайды',
          ],
        },
        {
          code: 'PRO' as const,
          badge: 'Толық цикл + SSCC',
          price: getTariffPrice('PRO', 90),
          name: '«PRO Қойма» тарифі',
          target: 'Кімге арналған: Құрама жүктер (әр түрлі өлшемдер, түстер, артикулдар), киім, аяқ киім, сауда желілері мен дистрибьюторларға арналған күрделі партиялар.',
          weDoTitle: 'TANBOX не істейді:',
          weDo: [
            '«Стандарт» тарифіне кіретін барлық қызметтер (эмиссия + баспа + оклейка)',
            'Көліктік қораптарды ашу және артикулдар мен өлшемдер бойынша сәйкестігін тексеру',
            'Әр өнімді жекелей жапсырып, қорапқа қайта реттеп салу',
            'Көліктік SSCC агрегациясын қалыптастыру (дана → қорап → паллета)',
            '«Таңба» АЖ-ге есеп жіберу, заңды айналымға енгізу және ЭШФ беру',
          ],
          clientDoTitle: 'Тапсырыс беруші не істейді:',
          clientDo: [
            'Тек партияны тапсырады және сатуға 100% заңды дайын тауарды қабылдап алады',
          ],
        },
      ],
    },
    en: {
      title: 'TANBOX Serialization Tariff Guide',
      subtitle: 'Clear, transparent breakdown of what each tier covers, who it is designed for, and responsibilities.',
      close: 'Close',
      choose: 'Select Tariff',
      tariffs: [
        {
          code: 'DIGITAL' as const,
          badge: 'Codes Only',
          price: getTariffPrice('DIGITAL', 10),
          name: 'Digital Tariff',
          target: 'Best for: Importers who own high-volume thermal transfer printers and have warehouse personnel to apply labels.',
          weDoTitle: 'What TANBOX delivers:',
          weDo: [
            'Issuance and export of Data Matrix code pools from IS Tanba / IS MPT',
            'Exporting print-ready sticker layouts in PDF, CSV, and Excel',
            'Cryptographic structure and GTIN catalog validation',
          ],
          clientDoTitle: 'What the client handles:',
          clientDo: [
            'In-house label printing on internal industrial printers',
            'Manual stickering of products on their warehouse floor',
          ],
        },
        {
          code: 'PRINT' as const,
          badge: 'Roll Printing',
          price: getTariffPrice('PRINT', 25),
          name: 'Print Tariff',
          target: 'Best for: Businesses with warehouse hands available for stickering, but lacking industrial 300/600 dpi printers and grading scanners.',
          weDoTitle: 'What TANBOX delivers:',
          weDo: [
            'Data Matrix code issuance in the national IS Tanba system',
            'Industrial roll printing with durable resin/wax-resin ribbons',
            '100% code scan grading with automated barcode verifiers',
            'Express delivery of finished label rolls across Almaty and Kazakhstan',
          ],
          clientDoTitle: 'What the client handles:',
          clientDo: [
            'Receiving ready-to-use rolls and applying labels with warehouse crew',
          ],
        },
        {
          code: 'STANDARD' as const,
          badge: 'Turnkey Without Unboxing',
          price: getTariffPrice('STANDARD', 50),
          name: 'Standard Tariff',
          target: 'Best for: Importers with uniform mono-batches in standard factory cartons needing fast turnaround without diverting staff.',
          weDoTitle: 'What TANBOX delivers:',
          weDo: [
            'Code issuance + roll printing + dispatched traveling stickering crew',
            'Mobile crews dispatched to your warehouse or customs terminal (TSW)',
            'High-speed labeling of exterior packaging without unpacking inner items',
            'Full quality verification and formal completion documentation',
          ],
          clientDoTitle: 'What the client handles:',
          clientDo: [
            'Providing warehouse batch access and signing completion handover',
          ],
        },
        {
          code: 'PRO' as const,
          badge: 'Full Cycle + SSCC',
          price: getTariffPrice('PRO', 90),
          name: 'PRO Warehouse Tariff',
          target: 'Best for: Mixed multi-SKU freight (varied sizes, colors, brands), apparel, footwear, and shipments for retail chains or distributors.',
          weDoTitle: 'What TANBOX delivers:',
          weDo: [
            'Everything included in Standard (issuance + printing + onsite crew)',
            'Master carton unboxing, SKU count, and size cross-checking',
            'Piece-by-piece labeling of each individual unit and repacking',
            'SSCC aggregation hierarchy generation (piece → carton → pallet)',
            'Turnover release reporting to IS Tanba, legal activation, and ESF handover',
          ],
          clientDoTitle: 'What the client handles:',
          clientDo: [
            'Hands over the batch and receives merchandise 100% cleared and compliant',
          ],
        },
      ],
    },
  };

  const current = content[lang] || content.ru;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-3xl w-full max-w-5xl my-8 overflow-hidden shadow-2xl border border-gray-200 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 sm:p-7 border-b border-gray-100 flex items-start justify-between gap-4 bg-gradient-to-r from-blue-50/50 to-white">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
              {current.title}
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              {current.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-all cursor-pointer shrink-0"
            aria-label={current.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {current.tariffs.map((t) => (
              <div
                key={t.code}
                className="rounded-2xl border border-gray-200/90 p-5 sm:p-6 space-y-4 hover:border-[#0082FB] transition-all bg-[#F8FAFC]/50 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-lg bg-blue-50 text-[#0082FB] border border-blue-200/60">
                      {t.badge}
                    </span>
                    <span className="text-sm font-black text-[#111827]">
                      {t.price}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#111827]">
                    {t.name}
                  </h3>

                  <p className="text-xs text-[#475569] bg-white p-3 rounded-xl border border-gray-200/70 leading-relaxed font-medium">
                    {t.target}
                  </p>

                  {/* We Do */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#0082FB] block">
                      {t.weDoTitle}
                    </span>
                    <ul className="space-y-1.5">
                      {t.weDo.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-[#334155] leading-relaxed">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Client Does */}
                  <div className="space-y-1.5 pt-2 border-t border-gray-200/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      {t.clientDoTitle}
                    </span>
                    <ul className="space-y-1">
                      {t.clientDo.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[11px] text-[#64748B]">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-1.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
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
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl transition-all active:scale-95 shadow-sm cursor-pointer"
                    >
                      <span>{current.choose}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-[#111827] hover:bg-gray-100 transition-colors cursor-pointer"
          >
            {current.close}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
