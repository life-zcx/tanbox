import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface BusinessValueSectionProps {
  onScrollToCalculator?: () => void;
}

export const BusinessValueSection: React.FC<BusinessValueSectionProps> = ({
  onScrollToCalculator,
}) => {
  const { lang, t } = useLanguage();

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
    <section id="business-value" className="py-14 sm:py-20 bg-[#F4F6F9]">
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24">
        
        {/* ========================================================================= */}
        {/* BLOCK 1: What is Marking & Complete Process Flow in Kazakhstan            */}
        {/* ========================================================================= */}
        <div className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111827] tracking-tight">
              {lang === 'kz' 
                ? 'Қазақстанда цифрлық таңбалаудың толық процесі' 
                : lang === 'en' 
                ? 'Track & Trace Flow: 6 Steps to Complete Compliance' 
                : 'Как устроен процесс цифровой маркировки в Казахстане'}
            </h2>
            <p className="text-sm sm:text-base text-[#475569] max-w-3xl">
              {lang === 'kz'
                ? '«Таңба» АЖ жүйесіндегі Data Matrix коды — тауардың мемлекеттік сандық паспорты. Процесс 6 нақты кезеңнен тұрады:'
                : lang === 'en'
                ? 'Data Matrix serialization in IS Tanba is a mandatory state digital passport. The complete workflow spans 6 straightforward stages:'
                : 'Маркировка Data Matrix в системе «ИС Танба» (АО «Казахтелеком») — это государственный цифровой паспорт товара, обязательный для импорта и продажи в РК:'}
            </p>
          </div>

          {/* 6 Clean Minimal Cards (No AI icon boxes, no hover jumping, no awkward badges) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {steps.map((st) => (
              <div
                key={st.num}
                className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-xs relative overflow-hidden group flex flex-col justify-between"
              >
                <span aria-hidden="true" className="text-3xl sm:text-4xl font-black text-slate-100 absolute top-5 right-6 select-none pointer-events-none group-hover:text-blue-50 transition-colors">
                  {st.num}
                </span>

                <div className="relative z-10 pr-4">
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

        {/* ========================================================================= */}
        {/* BLOCK 2: Key Challenges & Considerations                                  */}
        {/* ========================================================================= */}
        <div className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111827] tracking-tight">
              {lang === 'kz' 
                ? 'Тауарды өз бетінше таңбалау кезінде туындайтын қиындықтар' 
                : lang === 'en' 
                ? 'Challenges of In-House Track & Trace' 
                : 'С какими сложностями сталкивается бизнес при самостоятельной маркировке'}
            </h2>
            <p className="text-sm sm:text-base text-[#475569] max-w-3xl">
              {lang === 'kz'
                ? 'Процесті компания ішінде ұйымдастыру қызметкерлердің көп уақытын, мемлекеттік жүйені терең түсінуді және деректерді тұрақты бақылауды талап етеді:'
                : lang === 'en'
                ? 'Handling track & trace internally requires significant staff hours, deep regulatory expertise, and continuous data validation:'
                : 'Самостоятельная маркировка требует отвлечения штатных сотрудников от основной работы, глубокого знания регламентов и постоянного контроля данных:'}
            </p>
          </div>

          {/* 4 Clean Challenge Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {risks.map((risk, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
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

        {/* ========================================================================= */}
        {/* BLOCK 3: TANBOX Turnkey Capabilities & Solution                           */}
        {/* ========================================================================= */}
        <div className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111827] tracking-tight">
              {lang === 'kz' 
                ? 'TANBOX шешімі: 100% міндетті кілтке дейін аламыз' 
                : lang === 'en' 
                ? 'Turnkey Execution: Why Leading Importers Choose TANBOX' 
                : 'Почему бизнесу выгодно передать маркировку TANBOX'}
            </h2>
            <p className="text-sm sm:text-base text-[#475569] max-w-3xl">
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
                className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs"
              >
                <h3 className="text-base sm:text-lg font-bold text-[#111827] leading-snug">
                  {feat.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#475569] mt-2 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};

export default BusinessValueSection;
