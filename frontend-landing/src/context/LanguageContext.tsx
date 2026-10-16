import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export type Language = 'kz' | 'ru' | 'en';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  getLocalizedPath: (path: string) => string;
  isSwitchingLang: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const translations: Record<Language, Record<string, string>> = {
  ru: {
    // Nav
    'nav.home': 'Главная',
    'nav.calc': 'Калькулятор цен',
    'nav.categories': 'Категории товаров',
    'nav.services': 'Услуги маркировки',
    'nav.how_it_works': 'Как мы работаем',
    'nav.contacts': 'Контакты',
    'nav.cabinet': 'Перейти в кабинет',

    // Side nav dots
    'dot.01': '01. Главная',
    'dot.02': '02. О маркировке и риски',
    'dot.03': '03. Категории РК',
    'dot.04': '04. Калькулятор',
    'dot.05': '05. Как работаем',
    'dot.06': '06. Контакты',

    // Hero
    'hero.title_line1': 'Цифровая маркировка товаров',
    'hero.title_line2_prefix': 'под ключ:',
    'hero.title_start': 'Цифровая маркировка товаров',
    'hero.title_highlight': 'под ключ',
    'hero.subtitle': 'Берем на себя печать Data Matrix и качественную маркировку партий любого масштаба. Также можем отдельно зарегистрировать карточки в НКТ или помочь с таможенным оформлением груза.',
    'hero.btn_calc': 'Рассчитать стоимость (₸)',
    'hero.btn_order': 'Оформить заявку',

    // Business Value
    'bv.badge': 'ГОСУДАРСТВЕННЫЙ РЕГЛАМЕНТ РК',
    'bv.title': 'Цифровая маркировка ИС Танба в РК',
    'bv.subtitle': 'Почему самостоятельный ручной процесс ведет к штрафам и простоям, и как TANBOX решает задачу под ключ',
    'bv.tab1': '1. Что такое маркировка и зачем она',
    'bv.tab2': '2. Что теряет бизнес при ручном процессе',
    'bv.tab3': '3. Что делает TANBOX под ключ',

    // Tab 1 content
    'bv.t1.header': 'Цифровой паспорт каждой единицы товара в Республике Казахстан',
    'bv.t1.desc': 'Маркировка — это не просто наклейка. Это защищенный криптокод Data Matrix ECC200, привязанный к государственной системе ИС Танба (оператор АО «Казахтелеком») и Национальному каталогу товаров (НКТ / GS1 Kazakhstan).',
    'bv.t1.item1_title': '100% Легальность оборота',
    'bv.t1.item1_desc': 'Зеленый коридор на таможне РК и складах СВХ. Никаких арестов партий, внеплановых проверок ДГД и блокировок отгрузок.',
    'bv.t1.item2_title': 'Беспрепятственный сбыт по РК',
    'bv.t1.item2_desc': 'Легальная поставка в любые оптовые базы, торговые центры и розничные сети Казахстана без юридических барьеров.',
    'bv.t1.item3_title': 'Точный складской учет',
    'bv.t1.item3_desc': 'Поштучный учет каждой единицы продукции, коробов и паллет с привязкой кодов в ИС Танба.',

    // Tab 2 content
    'bv.t2.header': 'Цена ошибок: что бизнес теряет при попытке маркировать своими силами',
    'bv.t2.desc': 'Попытка наладить процесс силами штатных кладовщиков без специализированного софта и промышленных принтеров оборачивается прямыми убытками:',
    'bv.t2.item1_title': 'Штрафы до 500 МРП и конфискация',
    'bv.t2.item1_desc': 'Статья 283 КоАП РК: оборот товаров без маркировки или с некорректными кодами влечет штраф от 50 до 500 МРП с прямой конфискацией партии.',
    'bv.t2.item2_title': 'Простой на СВХ ($100–$300/сутки)',
    'bv.t2.item2_desc': 'Контейнеры и фуры зависают на таможне неделями, пока сотрудники пытаются разобраться с техническими регламентами ИС Танба.',
    'bv.t2.item3_title': 'Заморозка средств в спецтехнику',
    'bv.t2.item3_desc': 'Покупка промышленных принтеров, риббонов и оплата интеграторов ради разовых или сезонных поставок.',
    'bv.t2.item4_title': 'Человеческий фактор и пересортица',
    'bv.t2.item4_desc': 'Пересортица размеров, наклеивание кодов невпопад, смазанная термопечать — риск отказа приемки контрагентами.',

    // Tab 3 content
    'bv.t3.header': 'Мощность TANBOX: забираем весь процесс от таможни до полки',
    'bv.t3.desc': 'Берем на себя полный цикл цифровой маркировки — от заведения номенклатуры в НКТ до скоростной оклейки и ввода в оборот:',
    'bv.t3.item1_title': 'Эмиссия и каталог НКТ',
    'bv.t3.item1_desc': 'Регистрируем карточки в НКТ РК и GS1 Kazakhstan, генерируем GTIN, заказываем и выгружаем пулы кодов в ИС Танба.',
    'bv.t3.item2_title': 'Промышленная термопечать',
    'bv.t3.item2_desc': 'Высокоскоростная печать рулонов любого формата с верификацией считываемости сканерами 100% кодов.',
    'bv.t3.item3_title': 'Быстрая оклейка без простоя склада по всему Казахстану',
    'bv.t3.item3_desc': 'Организуем маркировку под ключ в любой точке РК. Масштабируем команду под вашу партию, чтобы товар вышел в продажу день в день.',
    'bv.t3.item4_title': 'SSCC-агрегация и ввод в оборот',
    'bv.t3.item4_desc': 'Агрегируем штуки в короба и паллеты, вводим коды в оборот в ИС Танба, предоставляем полный комплект закрывающих документов.',

    // Categories
    'cat.badge': 'РЕГЛАМЕНТИРОВАННЫЕ ОТРАСЛИ',
    'cat.title': 'Категории товаров обязательной маркировки в РК',
    'cat.subtitle': 'В Казахстане перечень товаров, подлежащих обязательной цифровой идентификации Data Matrix, расширяется государством:',
    'cat.btn_more': 'Подробнее',

    // How it works
    'hiw.badge': 'БЫСТРЫЙ СТАРТ',
    'hiw.title': 'Порядок работы под ключ за 4 шага',
    'hiw.step1_title': '1. Заявка и расчет',
    'hiw.step1_desc': 'Оставляете заявку или рассчитываете партию в онлайн-калькуляторе. Мы согласуем сроки и фиксируем стоимость.',
    'hiw.step2_title': '2. Эмиссия кодов',
    'hiw.step2_desc': 'Заводим номенклатуру в НКТ / GS1 РК и заказываем официальный пул кодов Data Matrix в системе ИС Танба.',
    'hiw.step3_title': '3. Печать и оклейка',
    'hiw.step3_desc': 'Печатаем рулоны на производстве либо мобильная бригада выезжает на ваш склад со станциями для нанесения стикеров.',
    'hiw.step4_title': '4. Ввод в оборот и документы',
    'hiw.step4_desc': 'Формируем SSCC короба/паллеты, отправляем отчет о нанесении в ИС Танба, вводим товар в легальный оборот и передаем закрывающие документы.',

    // Contacts & Footer
    'contacts.title': 'Свяжитесь с нами для запуска партии',
    'contacts.subtitle': 'Проконсультируем по требованиям ИС Танба, рассчитаем точную смету и подготовим договор.',
    'contacts.address_title': 'Адрес в Алматы',
    'contacts.phone_title': 'Телефон / WhatsApp',
    'contacts.work_hours': 'Пн–Пт: 09:00 – 19:00',
    'contacts.btn_whatsapp': 'Написать в WhatsApp',
    'contacts.requisites_title': 'Официальные реквизиты',
  },

  kz: {
    // Nav
    'nav.home': 'Басты бет',
    'nav.calc': 'Баға калькуляторы',
    'nav.categories': 'Тауар санаттары',
    'nav.services': 'Таңбалау қызметтері',
    'nav.how_it_works': 'Жұмыс реті',
    'nav.contacts': 'Байланыс',
    'nav.cabinet': 'Кабинетке кіру',

    // Side nav dots
    'dot.01': '01. Басты бет',
    'dot.02': '02. Таңбалау және қауіптер',
    'dot.03': '03. ҚР санаттары',
    'dot.04': '04. Калькулятор',
    'dot.05': '05. Жұмыс реті',
    'dot.06': '06. Байланыс',

    // Hero
    'hero.title_line1': 'Тауарларды цифрлық таңбалау',
    'hero.title_line2_prefix': 'кілтке дейін:',
    'hero.title_start': 'Тауарларды цифрлық таңбалау',
    'hero.title_highlight': 'кілтке дейін',
    'hero.subtitle': 'Кез келген көлемдегі партияларды Data Matrix бойынша сапалы таңбалау мен басып шығаруды өз мойнымызға аламыз. Сондай-ақ карточкаларды ТҰК-де жеке тіркеп немесе жүкті кедендік ресімдеуге көмектесе аламыз.',
    'hero.btn_calc': 'Құнын есептеу (₸)',
    'hero.btn_order': 'Өтінім беру',

    // Business Value
    'bv.badge': 'ҚР МЕМЛЕКЕТТІК РЕГЛАМЕНТІ',
    'bv.title': 'ҚР «Таңба» АЖ сандық таңбалау',
    'bv.subtitle': 'Неліктен қолмен таңбалау айыппұлдар мен тоқтап қалуға әкеледі және TANBOX мәселені кілтке дейін қалай шешеді',
    'bv.tab1': '1. Таңбалау деген не және не үшін керек',
    'bv.tab2': '2. Қолмен таңбалаудың қауіптері мен шығыны',
    'bv.tab3': '3. TANBOX кілтке дейін не істейді',

    // Tab 1 content
    'bv.t1.header': 'Қазақстан Республикасындағы әрбір тауар бірлігінің сандық төлқұжаты',
    'bv.t1.desc': 'Таңбалау — бұл жай ғана жапсырма емес. Бұл «Таңба» АЖ мемлекеттік жүйесіне («Қазақтелеком» АҚ операторы) және Тауарлардың ұлттық каталогына (ТҰК / GS1 Kazakhstan) бекітілген қорғалған Data Matrix ECC200 криптокоды.',
    'bv.t1.item1_title': '100% Заңды айналым',
    'bv.t1.item1_desc': 'ҚР кеденінде және УСҚ (СВХ) қоймаларында жасыл дәліз. Тауарды тәркілеу, МКД тексерулері мен бұғаттауларсыз.',
    'bv.t1.item2_title': 'ҚР бойынша кедергісіз сату',
    'bv.t1.item2_desc': 'Қазақстанның кез келген көтерме базаларына, сауда орталықтары мен бөлшек сауда желілеріне заңды түрде жеткізу.',
    'bv.t1.item3_title': 'Дәл қоймалық есеп',
    'bv.t1.item3_desc': '«Таңба» АЖ жүйесімен байланыстыра отырып, әрбір өнім, қорап және паллет бірлігін нақты есепке алу.',

    // Tab 2 content
    'bv.t2.header': 'Қателіктер бағасы: тауарды өз бетінше қолмен таңбалаудың нақты қауіптері',
    'bv.t2.desc': 'Арнайы бағдарламалық құралсыз және өндірістік принтерлерсіз штаттық жұмысшылармен таңбалау тікелей қаржылық шығындарға соқтырады:',
    'bv.t2.item1_title': '500 АЕК-ке дейін айыппұл және тәркілеу',
    'bv.t2.item1_desc': 'ҚР ӘҚБтК-нің 283-бабы: таңбалаусыз немесе дұрыс емес кодтармен тауар айналымы 50-ден 500 АЕК-ке дейін айыппұл мен партияны тәркілеуге әкеледі.',
    'bv.t2.item2_title': 'УСҚ-да бос тұрып қалу ($100–$300/тәулік)',
    'bv.t2.item2_desc': 'Қызметкерлер «Таңба» АЖ техникалық талаптарын түсінемін дегенше, жүк көліктері мен контейнерлер кеденде апталап тұрып қалады.',
    'bv.t2.item3_title': 'Арнайы техникаға қаражатты байлау',
    'bv.t2.item3_desc': 'Өнеркәсіптік термопринтерлерді, шығын материалдарын сатып алу және мамандарды жалдау шығындары.',
    'bv.t2.item4_title': 'Адами фактор және қателіктер',
    'bv.t2.item4_desc': 'Өлшемдердің ауысып кетуі, кодтардың қате жапсырылуы, сапасыз басылым — серіктестердің тауарды қабылдаудан бас тарту қаупі.',

    // Tab 3 content
    'bv.t3.header': 'TANBOX қуаты: кеденнен бастап дүкен сөресіне дейінгі процесті өз мойнымызға аламыз',
    'bv.t3.desc': 'Таңбалаудың толық циклін өз мойнымызға аламыз — номенклатураны НКТ-ға тіркеуден бастап, жедел оклейка мен айналымға енгізуге дейін:',
    'bv.t3.item1_title': 'Эмиссия және ТҰК каталогы',
    'bv.t3.item1_desc': 'ТҰК мен GS1 Kazakhstan жүйесінде карточкаларды тіркейміз, GTIN қалыптастырамыз, «Таңба» АЖ жүйесінде кодтарды шығарамыз.',
    'bv.t3.item2_title': 'Өндірістік термобаспа',
    'bv.t3.item2_desc': 'Кез келген пішімдегі орамдарды сканерлермен 100% оқылу кепілдігімен жоғары жылдамдықта басып шығару.',
    'bv.t3.item3_title': 'Қазақстан бойынша қойма тоқтаусыз жедел оклейка',
    'bv.t3.item3_desc': 'ҚР кез келген нүктесінде кілтке дейін таңбалау ұйымдастырамыз. Тауар дәл уақытында сатылымға шығуы үшін команданы партияңыздың көлеміне қарай кеңейтеміз.',
    'bv.t3.item4_title': 'SSCC агрегациясы және айналымға енгізу',
    'bv.t3.item4_desc': 'Тауарларды қораптар мен паллеттерге біріктіреміз, айналымға енгіземіз және барлық ресми жабылатын құжаттарды ұсынамыз.',

    // Categories
    'cat.badge': 'МІНДЕТТІ САЛАЛАР',
    'cat.title': 'Қазақстанда міндетті таңбаланатын тауар санаттары',
    'cat.subtitle': 'Қазақстанда Data Matrix сандық сәйкестендіруіне жататын тауарлар тізімі мемлекет тарапынан кеңейтілуде:',
    'cat.btn_more': 'Толығырақ',

    // How it works
    'hiw.badge': 'ЖЫЛДАМ БАСТАУ',
    'hiw.title': '4 қадамда кілтке дейін жұмыс реті',
    'hiw.step1_title': '1. Өтінім және есептеу',
    'hiw.step1_desc': 'Өтінім қалдырасыз немесе онлайн калькуляторда есептейсіз. Біз мерзімдер мен бағаны бекітеміз.',
    'hiw.step2_title': '2. Кодтарды шығару',
    'hiw.step2_desc': 'ТҰК / GS1 ҚР жүйесіне номенклатураны енгіземіз және «Таңба» АЖ жүйесінен ресми кодтар пулын аламыз.',
    'hiw.step3_title': '3. Басып шығару және жапсыру',
    'hiw.step3_desc': 'Өндірісте орамдарды басып шығарамыз немесе мобильді бригада қоймаңызға келіп жапсырады.',
    'hiw.step4_title': '4. Айналымға енгізу және құжаттар',
    'hiw.step4_desc': 'SSCC кодтарын қалыптастырып, айналымға енгізу есебін жібереміз, тауарды айналымға енгізіп, толық жабу құжаттарын береміз.',

    // Contacts & Footer
    'contacts.title': 'Партияны бастау үшін бізбен хабарласыңыз',
    'contacts.subtitle': '«Таңба» АЖ талаптары бойынша кеңес береміз, нақты сметаны есептеп, шарт дайындаймыз.',
    'contacts.address_title': 'Алматыдағы мекенжай',
    'contacts.phone_title': 'Телефон / WhatsApp',
    'contacts.work_hours': 'Дс–Жм: 09:00 – 19:00',
    'contacts.btn_whatsapp': 'WhatsApp-қа жазу',
    'contacts.requisites_title': 'Ресми деректемелер',
  },

  en: {
    // Nav
    'nav.home': 'Home',
    'nav.calc': 'Pricing Calculator',
    'nav.categories': 'Product Categories',
    'nav.services': 'Services',
    'nav.how_it_works': 'How It Works',
    'nav.contacts': 'Contacts',
    'nav.cabinet': 'Client Portal',

    // Side nav dots
    'dot.01': '01. Home',
    'dot.02': '02. About Marking & Risks',
    'dot.03': '03. KZ Categories',
    'dot.04': '04. Calculator',
    'dot.05': '05. How It Works',
    'dot.06': '06. Contacts',

    // Hero
    'hero.title_line1': 'Digital Product Serialization',
    'hero.title_line2_prefix': 'Turnkey:',
    'hero.title_start': 'Digital Product Serialization',
    'hero.title_highlight': 'Turnkey',
    'hero.subtitle': 'We take care of Data Matrix label printing and high-grade batch serialization at any scale. We can also independently register catalog cards in NKT or assist with freight customs clearance.',
    'hero.btn_calc': 'Calculate Cost (₸)',
    'hero.btn_order': 'Submit Request',

    // Business Value
    'bv.badge': 'REPUBLIC OF KAZAKHSTAN STATE COMPLIANCE',
    'bv.title': 'IS Tanba Digital Track & Trace in KZ',
    'bv.subtitle': 'Why in-house manual processes lead to heavy fines and delays, and how TANBOX delivers full turnkey compliance',
    'bv.tab1': '1. What is serialization & Why it matters',
    'bv.tab2': '2. Financial risks of manual handling',
    'bv.tab3': '3. Turnkey TANBOX capabilities',

    // Tab 1 content
    'bv.t1.header': 'Digital Passport for Every Unit of Merchandise in Kazakhstan',
    'bv.t1.desc': 'Serialization is more than a barcode. It is a cryptographic 2D Data Matrix ECC200 code registered in the state information system IS Tanba (operated by Kazakhtelecom JSC) and the National Product Catalog (NKT / GS1 Kazakhstan).',
    'bv.t1.item1_title': '100% Legal Clearance',
    'bv.t1.item1_desc': 'Green customs lane and fast clearance at bonded warehouses (TSW). Zero risk of seizure, state audits, or impoundment.',
    'bv.t1.item2_title': 'Unrestricted Distribution in KZ',
    'bv.t1.item2_desc': 'Legally supply all retail chains, distributors, and wholesale hubs across Kazakhstan with zero administrative roadblocks.',
    'bv.t1.item3_title': 'Precise Item-Level Inventory',
    'bv.t1.item3_desc': 'Item-level, carton, and pallet visibility synchronized directly with the IS Tanba state system.',

    // Tab 2 content
    'bv.t2.header': 'The Real Cost of Mistakes: What Businesses Lose Doing It In-House',
    'bv.t2.desc': 'Attempting serialization with warehouse staff lacking industrial applicators and specialized software leads to direct financial damage:',
    'bv.t2.item1_title': 'Fines up to 500 MCI & Seizure',
    'bv.t2.item1_desc': 'Article 283 of the Administrative Code of KZ: unverified circulation carries fines from 50 to 500 MCI with mandatory cargo confiscation.',
    'bv.t2.item2_title': 'Demurrage at TSW ($100–$300/day)',
    'bv.t2.item2_desc': 'Containers and trucks stand idle at customs for weeks while in-house accountants navigate complex IS Tanba portals.',
    'bv.t2.item3_title': 'Capital Tied Up in Machinery',
    'bv.t2.item3_desc': 'Purchasing industrial thermal printers, consumables, and software engineers for sporadic batches.',
    'bv.t2.item4_title': 'Human Error & Rejections',
    'bv.t2.item4_desc': 'Size mix-ups, misplaced labels, substandard unreadable thermal prints resulting in supplier rejections.',

    // Tab 3 content
    'bv.t3.header': 'TANBOX Capabilities: Complete Execution from Customs to Shelf',
    'bv.t3.desc': 'We handle the entire serialization cycle — from National Catalog registration to high-speed on-site labeling and turnover release:',
    'bv.t3.item1_title': 'Emission & National Catalog',
    'bv.t3.item1_desc': 'We register SKUs in NKT and GS1 Kazakhstan, generate GTINs, and order official Data Matrix code pools in IS Tanba.',
    'bv.t3.item2_title': 'Industrial Thermal Printing',
    'bv.t3.item2_desc': 'High-speed roll printing in any dimension with 100% scanner grade readability verification.',
    'bv.t3.item3_title': 'Fast On-Site Labeling Without Warehouse Downtime Across KZ',
    'bv.t3.item3_desc': 'Turnkey serialization anywhere in Kazakhstan. We scale our crew to match your batch size so your goods hit shelves on schedule.',
    'bv.t3.item4_title': 'SSCC Aggregation & Turnover Release',
    'bv.t3.item4_desc': 'We aggregate items into cartons and pallets, register turnover release in IS Tanba, and issue official closing accounting documents.',

    // Categories
    'cat.badge': 'REGULATED INDUSTRIES',
    'cat.title': 'Mandatory Product Categories in Kazakhstan',
    'cat.subtitle': 'The list of regulated consumer goods requiring Data Matrix identification is actively enforced by Kazakhstan law:',
    'cat.btn_more': 'Learn More',

    // How it works
    'hiw.badge': 'STREAMLINED PROCESS',
    'hiw.title': 'Turnkey Workflow in 4 Simple Steps',
    'hiw.step1_title': '1. Request & Quote',
    'hiw.step1_desc': 'Submit your cargo details or calculate your batch in our online calculator. We freeze the price and timeline.',
    'hiw.step2_title': '2. Code Emission',
    'hiw.step2_desc': 'We register SKUs in the National Catalog / GS1 KZ and order official Data Matrix code pools from IS Tanba.',
    'hiw.step3_title': '3. Printing & Application',
    'hiw.step3_desc': 'We print rolls at our industrial facility or dispatch mobile teams directly to your warehouse/terminal.',
    'hiw.step4_title': '4. Turnover Release & Documents',
    'hiw.step4_desc': 'We create SSCC codes, submit application reports to IS Tanba, release goods into legal turnover, and deliver complete closing documentation.',

    // Contacts & Footer
    'contacts.title': 'Contact Our Operations Team',
    'contacts.subtitle': 'Get expert guidance on IS Tanba compliance, transparent itemized pricing, and customized SLAs.',
    'contacts.address_title': 'Almaty Address',
    'contacts.phone_title': 'Phone / WhatsApp',
    'contacts.work_hours': 'Mon–Fri: 09:00 – 19:00',
    'contacts.btn_whatsapp': 'Chat via WhatsApp',
    'contacts.requisites_title': 'Official Legal Entity',
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSwitchingLang, setIsSwitchingLang] = useState(false);

  const getLangFromPath = useCallback((pathname: string): Language => {
    if (pathname === '/kz' || pathname.startsWith('/kz/')) return 'kz';
    if (pathname === '/en' || pathname.startsWith('/en/')) return 'en';
    return 'ru';
  }, []);

  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const fromPath = getLangFromPath(window.location.pathname);
      if (fromPath !== 'ru') return fromPath;
    }
    const saved = localStorage.getItem('tanbox_lang') as Language;
    if (saved && ['kz', 'ru', 'en'].includes(saved)) {
      return saved;
    }
    return 'ru';
  });

  // Sync language when React Router location.pathname changes (e.g. back/forward or direct link)
  useEffect(() => {
    const fromPath = getLangFromPath(location.pathname);
    setLangState(fromPath);
    localStorage.setItem('tanbox_lang', fromPath);
    document.documentElement.lang = fromPath === 'kz' ? 'kk' : fromPath;
  }, [location.pathname, getLangFromPath]);

  const setLang = (newLang: Language) => {
    if (newLang === lang) return;

    // Show loading screen with logo (exactly as in LK)
    setIsSwitchingLang(true);

    setLangState(newLang);
    localStorage.setItem('tanbox_lang', newLang);
    document.documentElement.lang = newLang === 'kz' ? 'kk' : newLang;

    // Calculate clean path without old language prefix
    let cleanPath = location.pathname;
    if (cleanPath === '/kz' || cleanPath === '/en') cleanPath = '/';
    else if (cleanPath.startsWith('/kz/')) cleanPath = cleanPath.slice(3);
    else if (cleanPath.startsWith('/en/')) cleanPath = cleanPath.slice(3);
    if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;

    let targetPath = cleanPath;
    if (newLang === 'kz') {
      targetPath = cleanPath === '/' ? '/kz' : `/kz${cleanPath}`;
    } else if (newLang === 'en') {
      targetPath = cleanPath === '/' ? '/en' : `/en${cleanPath}`;
    }

    if (targetPath !== location.pathname) {
      navigate(targetPath + location.search + location.hash);
    }

    // Hide loading screen after transition completes
    setTimeout(() => {
      setIsSwitchingLang(false);
    }, 350);
  };

  const getLocalizedPath = useCallback(
    (path: string): string => {
      let clean = path;
      if (clean === '/kz' || clean === '/en') clean = '/';
      else if (clean.startsWith('/kz/')) clean = clean.slice(3);
      else if (clean.startsWith('/en/')) clean = clean.slice(3);
      if (!clean.startsWith('/')) clean = '/' + clean;

      if (lang === 'kz') return clean === '/' ? '/kz' : `/kz${clean}`;
      if (lang === 'en') return clean === '/' ? '/en' : `/en${clean}`;
      return clean;
    },
    [lang]
  );

  useEffect(() => {
    document.documentElement.lang = lang === 'kz' ? 'kk' : lang;
  }, [lang]);

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations.ru[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, getLocalizedPath, isSwitchingLang }}>
      {isSwitchingLang && (
        <div className="fixed inset-0 z-[99999] bg-white flex flex-col items-center justify-center p-4">
          <div className="flex flex-col items-center space-y-4">
            <img src="/tanbox-dark.svg" alt="tanbox" className="h-8 w-auto animate-pulse" />
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      )}
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
