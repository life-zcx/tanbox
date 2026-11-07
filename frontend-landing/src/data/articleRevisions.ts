import type { ArticleData, ArticleSection } from './articlesData';
import type { SiteLanguage } from '../utils/seoPaths';

type Revision = Partial<ArticleData>;
const water: Record<SiteLanguage, Revision> = {
  ru: {
    title: 'Маркировка воды в Казахстане: статус по перечню и экспортные требования', shortTitle: 'Вода: статус маркировки и экспорт',
    summary: 'Как отличить обычную упакованную воду от отдельных категорий напитков и проверить требования перед поставкой.',
    metaDescription: 'Статус Data Matrix для упакованной воды по коду 2201 в Казахстане. Перечень № 199-НҚ, отдельные позиции 2202, экспортные этикетки и подготовка партии.',
    contentSections: [
      { id: 'water-status', title: '1. Что указано в действующем перечне', content: 'В проверенной редакции перечня по приказу № 199-НҚ обычная упакованная питьевая и минеральная вода по коду 2201 не указана. Нельзя объявлять её обязательную цифровую маркировку с 1 июля 2024 года. При этом отдельные позиции 2202 в перечне относятся к пиву и зарегистрированным БАД: совпадение первых цифр кода не означает одинаковые требования ко всем напиткам.' },
      { id: 'destination-market', title: '2. Для экспорта проверяется рынок назначения', content: 'Перед подготовкой партии уточняют страну продажи, точный код ТН ВЭД, наименование и назначение продукта. Требования страны назначения к этикетке и цифровой идентификации проверяются отдельно. Этикетка с потребительской информацией и код Data Matrix решают разные задачи.' },
      { id: 'water-services', title: '3. Чем помогает TANBOX', content: 'Помогаем определить задачу поставки, подготовить макет, напечатать влагостойкие этикетки и организовать идентификацию партии. Регистрация карточек и операции с кодами включаются в проект только при применимости выбранной схемы. Стоимость печати и нанесения можно предварительно оценить в калькуляторе.' },
    ],
    faq: [
      { q: 'Вся ли вода в Казахстане требует Data Matrix?', a: 'Обычная вода по коду 2201 не указана в проверенном перечне № 199-НҚ. Классификацию конкретного продукта и рынок поставки проверяют отдельно.' },
      { q: 'Можно ли заказать только печать экспортных этикеток?', a: 'Да. Состав работ определяется требованиями к конкретной поставке: макет, печать, нанесение и при необходимости операции с идентификаторами.' },
    ],
  },
  kz: {
    title: 'Қазақстанда суды таңбалау: тізімдегі мәртебе және экспорт талаптары', shortTitle: 'Су: таңбалау мәртебесі және экспорт',
    summary: 'Кәдімгі қапталған суды сусындардың жекелеген санаттарынан ажыратып, жеткізу алдындағы талаптарды тексеру.',
    metaDescription: 'Қазақстандағы 2201 коды бойынша қапталған суға Data Matrix қолдану мәртебесі. № 199-НҚ тізімі, 2202 позициялары, экспорттық жапсырмалар мен партияны дайындау.',
    contentSections: [
      { id: 'water-status', title: '1. Қолданыстағы тізімде не көрсетілген', content: '№ 199-НҚ бұйрығы тізімінің тексерілген редакциясында 2201 коды бойынша кәдімгі қапталған ауыз су мен минералды су көрсетілмеген. Оны 2024 жылғы 1 шілдеден бастап міндетті цифрлық таңбалау енгізілген тауар деп көрсетуге болмайды. Тізімдегі 2202-нің жекелеген позициялары сыра мен тіркелген ББҚ-ға қатысты. Кодтың алғашқы цифрларының сәйкестігі барлық сусынға бірдей талап қолданылатынын білдірмейді.' },
      { id: 'destination-market', title: '2. Экспорт үшін тағайындалған нарық тексеріледі', content: 'Партияны дайындамас бұрын сату елі, нақты ТН ВЭД коды, өнімнің атауы мен мақсаты анықталады. Тағайындалған елдің жапсырма мен цифрлық сәйкестендіру талаптары бөлек тексеріледі. Тұтынушыға арналған ақпараттық жапсырма мен Data Matrix коды әртүрлі міндет атқарады.' },
      { id: 'water-services', title: '3. TANBOX қалай көмектеседі', content: 'Жеткізу міндетін анықтауға, макетті дайындауға, ылғалға төзімді жапсырмаларды басуға және партияны сәйкестендіруге көмектесеміз. Карточкаларды тіркеу мен кодтармен жұмыс таңдалған схемаға қажет болса ғана жобаға енгізіледі. Басу және жапсыру құнын калькуляторда алдын ала есептеуге болады.' },
    ],
    faq: [
      { q: 'Қазақстандағы барлық суға Data Matrix қажет пе?', a: '2201 коды бойынша кәдімгі су № 199-НҚ тізімінің тексерілген редакциясында көрсетілмеген. Нақты өнімнің жіктелуі мен жеткізу нарығы жеке тексеріледі.' },
      { q: 'Тек экспорттық жапсырмаларды басуға тапсырыс беруге бола ма?', a: 'Иә. Жұмыс құрамы нақты жеткізу талабына қарай анықталады: макет, басу, жапсыру және қажет болса сәйкестендіргіштермен жұмыс.' },
    ],
  },
  en: {
    title: 'Water Marking in Kazakhstan: Official List and Export Requirements', shortTitle: 'Water marking status and export',
    summary: 'Distinguish ordinary bottled water from specific beverage categories and check requirements before shipment.',
    metaDescription: 'Data Matrix status for bottled water under HS 2201 in Kazakhstan. Order No. 199-НҚ, specific HS 2202 entries, export labels and shipment preparation.',
    contentSections: [
      { id: 'water-status', title: '1. What the current list specifies', content: 'The reviewed version of Order No. 199-НҚ does not list ordinary bottled drinking or mineral water under HS 2201. It should not be described as subject to mandatory digital marking from July 1, 2024. Specific HS 2202 entries cover products such as beer and registered dietary supplements. Matching the first digits of an HS code does not establish identical requirements for every beverage.' },
      { id: 'destination-market', title: '2. Check the destination market for exports', content: 'Before preparing a shipment, identify the country of sale, exact HS code, product identity and intended use. Destination-market labeling and digital identification requirements must be checked separately. A consumer-information label and a Data Matrix identifier serve different purposes.' },
      { id: 'water-services', title: '3. How TANBOX can help', content: 'We help define shipment requirements, prepare artwork, print moisture-resistant labels and organize batch identification. Product-card registration and code operations are included only where applicable to the chosen process. Printing and labeling costs can be estimated in the calculator.' },
    ],
    faq: [
      { q: 'Does all water in Kazakhstan require Data Matrix?', a: 'Ordinary water under HS 2201 is not listed in the reviewed version of Order No. 199-НҚ. Check the specific product classification and destination market separately.' },
      { q: 'Can I order export-label printing only?', a: 'Yes. The scope depends on the shipment: artwork, printing, application and identifier operations where required.' },
    ],
  },
};

const caseSections: Record<'kz' | 'en', ArticleSection[]> = {
  en: [
    { id: 'scale-and-specifics', title: '1. Scale and distribution requirements', content: 'At a major national distributor, marking is more than placing a barcode on a package. Thousands of SKUs, large volumes and intensive regional distribution require coordinated product data, durable labels and reliable warehouse procedures. This project covered the full cycle, from GTIN registration in the national catalogue to training warehouse operators to use scanners and mobile terminals.' },
    { id: 'nkt-pitfalls', title: '2. National catalogue moderation', content: 'The first challenge was inconsistent product data. Differences between customs declarations and catalogue attributes prevented code orders. Package dimensions, weight and packaging levels also needed consistent descriptions. A validation matrix and batch import from the accounting system replaced manual entry. In this project, moderation time decreased from 7–10 working days to 24–48 hours.' },
    { id: 'label-durability', title: '3. Labels that survive transport', content: 'Ordinary direct-thermal labels did not withstand the logistics of oils and automotive products. Canisters rubbed against one another, while dust and oil reduced code readability. The project switched to thermal-transfer printing on durable coated stock and polypropylene using Resin/Wax-Resin ribbons. The case reported readable codes after 2,000 km of regional transport and storage in unheated warehouses.' },
    { id: 'sscc-logistics', title: '4. Carton and pallet aggregation', content: 'Scanning every item in a 10,000-unit batch would slow a distribution centre. The solution linked individual Data Matrix codes to carton identifiers and then linked cartons to an SSCC pallet label. Scanning the pallet identifier retrieved the associated item data. The case reported a tenfold reduction in batch-handling time.' },
    { id: 'sync-1c-personnel', title: '5. Accounting integration and staff procedures', content: 'The workflow required integration with the company’s 1C system, mobile terminals that detect duplicate scans, and short operating instructions. Staff were trained to handle damaged codes, returns and document transfers. Equipment alone could not provide a reliable result without clear responsibilities and consistent warehouse routines.' },
    { id: 'tanbox-foundation', title: '6. How the experience informed TANBOX', content: 'The project’s validation rules, printing methods, aggregation processes and training procedures informed the TANBOX service. The calculator helps estimate a batch, mobile teams handle printing and application, and catalogue support addresses common moderation errors. The scope and schedule for each customer are agreed against their product data and logistics.' },
  ],
  kz: [
    { id: 'scale-and-specifics', title: '1. Жоба ауқымы және дистрибуция талаптары', content: 'Ірі ұлттық дистрибьюторда таңбалау қаптамаға штрихкод жапсырумен шектелмейді. Мыңдаған артикул, үлкен көлем және өңірлік жеткізу қарқыны келісілген тауар деректерін, төзімді жапсырмаларды және сенімді қойма рәсімдерін талап етеді. Жоба ұлттық каталогта GTIN тіркеуден бастап қойма операторларын сканерлер мен мобильді терминалдарға үйретуге дейінгі толық циклді қамтыды.' },
    { id: 'nkt-pitfalls', title: '2. Ұлттық каталогтағы модерация', content: 'Алғашқы мәселе тауар деректерінің сәйкессіздігі болды. Кеден декларациясы мен каталог атрибуттарының айырмашылығы кодтарға тапсырыс беруге кедергі келтірді. Өлшем, салмақ және қаптама деңгейлері де бірізді сипатталуға тиіс еді. Валидация матрицасы мен есеп жүйесінен пакеттік импорт қолмен енгізуді алмастырды. Осы жобада модерация уақыты 7–10 жұмыс күнінен 24–48 сағатқа қысқарды.' },
    { id: 'label-durability', title: '3. Тасымалдауға төзімді жапсырмалар', content: 'Кәдімгі терможапсырмалар майлар мен автотауарлардың логистикасына шыдамады: канистрлер бір-біріне үйкеліп, шаң мен май кодтың оқылуын нашарлатты. Жоба Resin/Wax-Resin таспаларын қолданып, төзімді жартылай жылтыр материал мен полипропиленге термотрансферлік басуға көшті. Кейсте кодтар өңірлерге 2 000 км тасымалданғаннан және жылытылмайтын қоймаларда сақталғаннан кейін де оқылғаны көрсетілген.' },
    { id: 'sscc-logistics', title: '4. Қораптар мен паллеттерді агрегациялау', content: '10 000 даналық партияның әр тауарын жеке сканерлеу тарату орталығының жұмысын баяулатар еді. Шешім жеке Data Matrix кодтарын қорап сәйкестендіргіштерімен, ал қораптарды SSCC паллет жапсырмасымен байланыстырды. Паллет кодын оқу байланысты тауар деректерін алуға мүмкіндік берді. Кейсте партияны өңдеу уақыты он есе қысқарғаны көрсетілген.' },
    { id: 'sync-1c-personnel', title: '5. Есеп жүйесімен интеграция және қызметкерлер рәсімдері', content: 'Жұмыс тәртібі компанияның 1С жүйесімен интеграцияны, қайталанатын сканерлеуді анықтайтын мобильді терминалдарды және қысқа нұсқаулықтарды талап етті. Қызметкерлер зақымдалған кодтармен, қайтарымдармен және құжат алмасумен жұмыс істеуге үйретілді. Міндеттер мен қойма тәртібі айқын болмаса, жабдықтың өзі сенімді нәтиже бермейді.' },
    { id: 'tanbox-foundation', title: '6. Бұл тәжірибе TANBOX қызметіне қалай қолданылды', content: 'Жобаның тексеру ережелері, басу әдістері, агрегация процестері мен оқыту рәсімдері TANBOX қызметінің негізіне енгізілді. Калькулятор партия құнын алдын ала есептеуге көмектеседі, көшпелі топтар басу мен жапсыруды орындайды, ал каталог бойынша қолдау модерацияның жиі қателерін шешеді. Әр тапсырыс берушінің жұмыс көлемі мен мерзімі тауар деректері және логистикасына қарай келісіледі.' },
  ],
};

export function getArticleRevision(slug: string, lang: SiteLanguage): Revision {
  let revision: Revision | undefined;
  if (slug === 'markirovka-vody-i-napitkov-kazakhstan') revision = water[lang];
  if (slug === 'kejs-vnedreniya-markirovki-avtotovary-masla-kazakhstan' && lang !== 'ru') revision = { contentSections: caseSections[lang], faq: [
    { q: lang === 'kz' ? 'Бұл тәжірибе басқа тауар топтарына қолданыла ма?' : 'Does this experience apply to other product groups?', a: lang === 'kz' ? 'Деректерді тексеру, төзімді басу және агрегация әдістері басқа жобаларда да қолданылады. Нақты талаптар тауар тобына қарай тексеріледі.' : 'Data validation, durable printing and aggregation methods can support other projects. Check the specific requirements for each product group.' },
    { q: lang === 'kz' ? 'Кодтарды қай жерде жапсыру керек?' : 'Where should codes be applied?', a: lang === 'kz' ? 'Орны тауар тобына және кеден рәсіміне байланысты. Рұқсат етілетін схема жеткізуден бұрын оператор және кеден өкілімен келісіледі.' : 'The location depends on the product group and customs procedure. Confirm the permitted process with the operator and customs representative before shipment.' },
    { q: lang === 'kz' ? 'Тасымалдау кезінде кодтың өшуін қалай азайтуға болады?' : 'How can code wear during transport be reduced?', a: lang === 'kz' ? 'Қаптама мен сақтау жағдайына сай материал және Resin/Wax-Resin таспасы таңдалып, баспа сканермен тексеріледі.' : 'Select stock and Resin/Wax-Resin ribbons for the packaging and storage conditions, then verify the print with a scanner.' },
  ] };
  if (!revision) return {};
  const sections = revision.contentSections || [];
  return { ...revision, updatedAt: '2026-11-06',
    ...(sections.length ? { tableOfContents: sections.map(section => ({ id: section.id, title: section.title })) } : {}),
    ...(['markirovka-drevesiny-kazakhstan-2026', 'markirovka-szhizhennogo-gaza-ballonov-kazakhstan-2027'].includes(slug) ? { faq: [] } : {}),
  };
}
