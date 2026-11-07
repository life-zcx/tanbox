import React, { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const BusinessValueSection: React.FC = () => {
  const { lang } = useLanguage();
  const [risksExpanded, setRisksExpanded] = useState(false);
  const risksId = useId();

  // 1. 6 Steps of Marking Process (Clean numbering, no AI pastel icon boxes)
  const steps = [
    {
      num: '01',
      title: lang === 'kz' ? 'Товарлық деректер' : lang === 'en' ? 'Product Master Data' : 'Товарные данные',
      desc: lang === 'kz' 
        ? 'Тауарлардың сипаттамаларын, ТН ВЭД кодтарын жинақтау және тексеру.' 
        : lang === 'en' 
        ? 'Preparing specifications, HS codes, and product batch attributes.' 
        : 'Формирование перечня номенклатуры, проверка кодов ТН ВЭД и атрибутов партии.',
    },
    {
      num: '02',
      title: lang === 'kz' ? 'Каталог НКТ / GS1 РК' : lang === 'en' ? 'NKT & GS1 KZ Catalog' : 'Каталог НКТ и GS1 РК',
      desc: lang === 'kz' 
        ? 'Ұлттық каталогта карточкаларды тіркеу және бірегей GTIN кодтарын алу.' 
        : lang === 'en' 
        ? 'Registering SKU cards in the National Catalog and generating official GTINs.' 
        : 'Регистрация карточек товара в Национальном каталоге и генерация кодов GTIN.',
    },
    {
      num: '03',
      title: lang === 'kz' ? '«Таңба» АЖ кодтары' : lang === 'en' ? 'IS Tanba Data Matrix' : 'Эмиссия в ИС Танба',
      desc: lang === 'kz' 
        ? '«Қазақтелеком» АҚ операторынан қорғалған Data Matrix криптокодтарын алу.' 
        : lang === 'en' 
        ? 'Ordering official Data Matrix crypto-code pools from Kazakhtelecom operator.' 
        : 'Заказ и получение пулов криптозащищенных кодов Data Matrix у оператора.',
    },
    {
      num: '04',
      title: lang === 'kz' ? 'Өндірістік баспа' : lang === 'en' ? 'Industrial Roll Print' : 'Промышленная печать',
      desc: lang === 'kz' 
        ? 'Термотрансферлік баспа, сапаны сканермен 100% тексеру.' 
        : lang === 'en' 
        ? 'High-speed roll printing with 100% 2D-scanner readability verification.' 
        : 'Печать рулонов стикеров любых размеров со 100% контролем считываемости.',
    },
    {
      num: '05',
      title: lang === 'kz' ? 'Қоймада оклейка' : lang === 'en' ? 'Warehouse Application' : 'Оклейка на складе',
      desc: lang === 'kz' 
        ? 'Мобильді бригадалардың қоймаңызға немесе УСҚ-ға келіп оклейка жасауы (кез келген көлемдегі партиялар).' 
        : lang === 'en' 
        ? 'Mobile stickering crews dispatched to your warehouse or terminal (batches of any volume).' 
        : 'Выезд мобильных бригад со станциями на ваш склад или СВХ (партии любого объема).',
    },
    {
      num: '06',
      title: lang === 'kz' ? 'Айналымға енгізу және есептілік' : lang === 'en' ? 'Turnover Release & Reporting' : 'Ввод в оборот и отчетность',
      desc: lang === 'kz' 
        ? 'SSCC-агрегация (қораптар/паллеттер), «Таңба» АЖ-ға таңбалау есебін жіберу, тауарды заңды айналымға енгізу және жабу құжаттарын тапсыру.' 
        : lang === 'en' 
        ? 'SSCC aggregation (cartons/pallets), submission of application reports to IS Tanba, legal turnover release, and handover of closing documentation.' 
        : 'SSCC-агрегация (короба/паллеты), отправка отчета о нанесении в ИС Танба, ввод товара в легальный оборот и передача закрывающих документов.',
    },
  ];

  // 2. Challenges of In-House Process
  const risks = [
    {
      title: lang === 'kz' ? 'Қатаң мемлекеттік стандарттар' : lang === 'en' ? 'Strict Regulatory Requirements' : 'Строгие требования законодательства',
      stat: lang === 'kz' ? '«Таңба» АЖ талаптары' : lang === 'en' ? 'State Compliance' : 'Стандарты ИС Танба',
      desc: lang === 'kz' 
        ? 'ҚР заңнамасы Data Matrix кодтарының 100% дәлдігін талап етеді. Қате мәліметтер немесе сапасыз басылым тексерулер мен өнімнің кешігуіне әкеледі.' 
        : lang === 'en' 
        ? 'Kazakhstan regulations demand absolute Data Matrix accuracy. Data mismatches or unreadable labels lead to compliance audits and shipment delays.' 
        : 'Законодательство РК требует абсолютной точности кодов Data Matrix. Ошибки в структуре или нечитаемые стикеры ведут к проверкам и задержкам партий.',
    },
    {
      title: lang === 'kz' ? 'Кеденде және УСҚ-да кешігу қаупі' : lang === 'en' ? 'Customs & Terminal Logistics Delays' : 'Риски задержек на таможне и СВХ',
      stat: lang === 'kz' ? 'Сақтау шығындары' : lang === 'en' ? 'Demurrage Risk' : 'Сроки выпуска',
      desc: lang === 'kz' 
        ? 'Мемлекеттік жүйеде жұмыс істеу тәжірибесі болмаса, рәсімдеу ұзаққа созылып, жүкті терминалда ақылы сақтау шығындары артады.' 
        : lang === 'en' 
        ? 'Navigating unfamiliar state portal procedures without dedicated workflows causes clearance bottlenecks and paid terminal storage costs.' 
        : 'При отсутствии отработанных регламентов оформление в системе оператора может затягиваться, приводя к расходам на платное хранение груза.',
    },
    {
      title: lang === 'kz' ? 'Персоналға түсетін ауыр жүктеме' : lang === 'en' ? 'Staff Overhead & Operational Errors' : 'Трудозатраты и человеческий фактор',
      stat: lang === 'kz' ? 'Қызметкерлер уақыты' : lang === 'en' ? 'Team Resources' : 'Ресурсы команды',
      desc: lang === 'kz' 
        ? 'Мыңдаған өнімді қолмен оклейка жасау қызметкерлерді негізгі жұмыстан алшақтатады. Артикулдардың шатасуы бүкіл партияны қайта таңбалауға әкеледі.' 
        : lang === 'en' 
        ? 'Manual piece-by-piece stickering diverts core employees from sales and logistics. SKU errors require costly and tedious batch re-marking.' 
        : 'Поштучная оклейка тысяч товаров отвлекает штатных сотрудников от прямых обязанностей. Ошибки в артикулах, размерах или пересортица требуют повторной перемаркировки всей партии.',
    },
    {
      title: lang === 'kz' ? 'Сауда желілері мен қоймалар талаптары' : lang === 'en' ? 'Retail & Warehouse Acceptance Demands' : 'Требования торговых сетей и складов',
      stat: lang === 'kz' ? 'Қабылдау бақылауы' : lang === 'en' ? 'Quality Grading' : 'Контроль приемки',
      desc: lang === 'kz' 
        ? 'Ірі дистрибьюторлар мен маркетплейстер Data Matrix оқылу сапасын қатаң тексереді. Стикер бүлінген немесе артикул шатасқан жағдайда тауар қабылданбай, кері қайтарылады.' 
        : lang === 'en' 
        ? 'Retail chains and marketplaces enforce strict Data Matrix barcode readability standards. Damaged stickers or SKU mismatches result in batch rejection.' 
        : 'Крупные сети, дистрибьюторы и маркетплейсы строго проверяют считываемость Data Matrix 2D-сканерами. При браке стикера или пересортице партию возвращают поставщику.',
    },
  ];

  // 3. Turnkey TANBOX Advantages
  const turnkeyFeatures = [
    {
      title: lang === 'kz' 
        ? 'Қазақстан бойынша қойма тоқтаусыз жедел оклейка' 
        : lang === 'en' 
        ? 'Fast On-Site Labeling Without Warehouse Downtime Across KZ' 
        : 'Быстрая оклейка без простоя склада по всему Казахстану',
      desc: lang === 'kz' 
        ? 'ҚР кез келген нүктесінде кілтке дейін таңбалау ұйымдастырамыз. Тауар дәл уақытында сатылымға шығуы үшін команданы партияңыздың көлеміне қарай кеңейтеміз.' 
        : lang === 'en' 
        ? 'Turnkey serialization anywhere in Kazakhstan. We scale our crew to match your batch size so your goods hit shelves on schedule.' 
        : 'Организуем маркировку под ключ в любой точке РК. Масштабируем команду под вашу партию, чтобы товар вышел в продажу день в день.',
    },
    {
      title: lang === 'kz' ? 'ҰТК каталогы және эмиссия кілтке дейін' : lang === 'en' ? 'Cataloging & Automated Emission' : 'Каталог НКТ и эмиссия без вашего участия',
      desc: lang === 'kz' 
        ? 'Номенклатураны ҰТК-ға өзіміз тіркейміз, GTIN аламыз және «Таңба» АЖ-дан кодтар пулын шығарамыз.' 
        : lang === 'en' 
        ? 'We register cards in the National Catalog, obtain GTINs, and manage the full code issuance cycle in IS Tanba.' 
        : 'Сами заводим номенклатуру в НКТ, получаем GTIN и заказываем официальные пулы кодов в системе ИС Танба.',
    },
    {
      title: lang === 'kz' ? 'Өзіндік өндіріс және жылдам баспа' : lang === 'en' ? 'Industrial Roll Production & Verification' : 'Собственное производство и печать рулонов',
      desc: lang === 'kz' 
        ? 'Кез келген стандарттағы төзімді стикерлерді 2D сканермен 100% тексеру арқылы басып шығарамыз.' 
        : lang === 'en' 
        ? 'High-speed roll printing in any standard dimensions with mandatory 100% 2D-scanner readability grading.' 
        : 'Печатаем рулоны любых форматов на износостойких материалах со 100% контролем считываемости сканерами.',
    },
    {
      title: lang === 'kz' ? 'SSCC қорап/паллета агрегациясы' : lang === 'en' ? 'SSCC Aggregation & Turnover Release' : 'SSCC-агрегация и ввод в оборот',
      desc: lang === 'kz' 
        ? 'Өнімдерді қораптар мен паллеттерге біріктіріп, айналымға енгізу есебін мемлекеттік жүйеге жібереміз.' 
        : lang === 'en' 
        ? 'Full carton-to-pallet hierarchy aggregation and automatic submission of turnover release reports to state operator.' 
        : 'Формируем иерархию (штука → коробка → паллета), отправляем отчет о нанесении и вводим продукцию в легальный оборот.',
    },
  ];

  return (
    <div id="business-value">
      <section className="bg-white py-10 sm:py-16">
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ========================================================================= */}
        {/* BLOCK 1: What is Marking & Complete Process Flow in Kazakhstan            */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111827] tracking-tight">
              {lang === 'kz' 
                ? 'Таңбалаудың алты кезеңі'
                : lang === 'en' 
                ? 'Six stages of product marking'
                : 'Шесть этапов маркировки товара'}
            </h2>
            <p className="text-sm sm:text-base text-[#475569] max-w-3xl">
              {lang === 'kz'
                ? 'Тауар деректерін дайындаудан бастап айналымға енгізуге дейінгі жұмыстарды атқарамыз.'
                : lang === 'en'
                ? 'We handle the work from preparing product data to releasing goods into circulation.'
                : 'Берём на себя работы от подготовки товарных данных до ввода продукции в оборот.'}
            </p>
            </div>
          </div>

          {/* Open process layout with numbered steps. */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((st) => (
              <div
                key={st.num}
                className="border-t border-slate-200 pt-5 flex items-start gap-4"
              >
                <span aria-hidden="true" className="w-8 shrink-0 text-2xl font-bold leading-none text-[#0082FB]/50 select-none">
                  {st.num}
                </span>

                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-[#111827] leading-snug">
                    {st.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#475569] mt-2 leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
      </section>

      <section className="bg-[#F4F6F9] py-10 sm:py-16">
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111827] tracking-tight">
              {lang === 'kz' 
                ? 'Өз бетінше таңбалау кезіндегі қиындықтар'
                : lang === 'en' 
                ? 'Challenges of In-House Track & Trace' 
                : 'Сложности самостоятельной маркировки'}
            </h2>
            <p className="text-sm sm:text-base text-[#475569] max-w-3xl">
              {lang === 'kz'
                ? 'Деректерді, баспа сапасын және есептілікті бақылау қажет.'
                : lang === 'en'
                ? 'Product data, print quality and reporting all need careful checks.'
                : 'Нужно контролировать данные, качество печати и отчётность.'}
            </p>
          </div>

          {/* 4 Clean Challenge Cards */}
          <button type="button" aria-expanded={risksExpanded} aria-controls={risksId} onClick={() => setRisksExpanded(expanded => !expanded)} className="sm:hidden inline-flex items-center gap-2 py-2 text-sm font-semibold text-[#0070DA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0082FB]">
            {risksExpanded
              ? (lang === 'kz' ? 'Толығырақ ақпаратты жасыру' : lang === 'en' ? 'Hide details' : 'Скрыть подробности')
              : (lang === 'kz' ? 'Қандай қиындықтар туындайды' : lang === 'en' ? 'Explore the challenges' : 'Какие сложности возникают')}
            <ChevronDown className={`h-4 w-4 transition-transform motion-reduce:transition-none ${risksExpanded ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          <div id={risksId} className={`${risksExpanded ? 'grid' : 'hidden'} sm:grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6`}>
            {risks.map((risk, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-base sm:text-lg font-bold text-[#111827] leading-snug">
                    {risk.title}
                  </h3>

                  <span className="text-[11px] font-bold text-slate-700 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg shrink-0">
                    {risk.stat}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed pt-1">
                  {risk.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
      </section>

      <section className="bg-[#0B132B] py-12 sm:py-16 text-white">
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              {lang === 'kz' 
                ? 'TANBOX шешімі: 100% міндетті кілтке дейін аламыз' 
                : lang === 'en' 
                ? 'Turnkey Execution: Why Leading Importers Choose TANBOX' 
                : 'Почему бизнесу выгодно передать маркировку TANBOX'}
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-3xl">
              {lang === 'kz'
                ? 'Қойманы күрделі күнделікті рутинадан босатып, таңбалауды мамандарға тапсырыңыз. Толық циклді кепілдікпен орындаймыз:'
                : lang === 'en'
                ? 'Relieve your warehouse from operational bottlenecks. We handle the entire serialization cycle with guaranteed compliance:'
                : 'Берем на себя полный цикл цифровой маркировки — от заведения номенклатуры в НКТ до скоростной оклейки на складе и ввода в оборот:'}
            </p>
          </div>

          {/* 4 Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {turnkeyFeatures.map((feat, idx) => (
              <div
                key={idx}
                className="bg-white/[0.04] rounded-2xl p-6 sm:p-8 border border-white/10"
              >
                <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                  {feat.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>

        </div>

      </div>
      </section>
    </div>
  );
};

export default BusinessValueSection;
