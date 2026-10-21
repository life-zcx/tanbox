import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Cigarette, 
  Footprints, 
  Pill, 
  Droplets, 
  Award, 
  Car, 
  Beer, 
  HeartPulse, 
  Shirt, 
  Gem, 
  Trees,
  Flame,
  Cpu
} from 'lucide-react';
import { ServiceOrderModal } from '../components/modals/ServiceOrderModal';
import { setPageSeo } from '../utils/seo';
import { useLanguage } from '../context/LanguageContext';

export interface CategoryDetailItem {
  id: string;
  title: string;
  status: 'ACTIVE' | 'UPCOMING';
  statusText: string;
  date: string;
  tnved: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  stages?: { date: string; title: string }[];
  details: string[];
  equipmentNote?: string;
  link: string;
}

export const CategoriesPage: React.FC = () => {
  const { lang, getLocalizedPath } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'UPCOMING'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServiceTitle, setSelectedServiceTitle] = useState(
    lang === 'kz' 
      ? 'ТН ВЭД аудиті және 2026–2027 жылдардағы таңбалауға дайындық' 
      : lang === 'en' 
      ? 'HS Code Audit and Preparation for 2026–2027 Serialization' 
      : 'Аудит ТН ВЭД и подготовка к маркировке 2026–2027'
  );
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (lang === 'kz') {
      setPageSeo(
        'Қазақстанда таңбалауға жататын тауар санаттарының каталогы | TANBOX.KZ',
        'Қазақстан Республикасында ТМБ АЖ жүйесінде міндетті цифрлық Data Matrix таңбалауына жататын тауар топтарының толық тізімі: аяқ киім, темекі, дәрі-дәрмек, су, жеңіл өнеркәсіп, мотор майлары.',
        { lang: 'kz', keywords: 'тауар санаттары таңбалау, таңбалау тізімі Қазақстан, аяқ киім таңбалау мерзімі' }
      );
    } else if (lang === 'en') {
      setPageSeo(
        'Catalog of Product Categories for Serialization in Kazakhstan | TANBOX.KZ',
        'Complete list of product categories subject to mandatory Data Matrix serialization in Kazakhstan: footwear, tobacco, pharmaceuticals, bottled water, apparel, and motor oils.',
        { lang: 'en', keywords: 'product serialization categories Kazakhstan, mandatory marking list' }
      );
    } else {
      setPageSeo(
        'Каталог категорий товаров для маркировки в Казахстане | TANBOX.KZ',
        'Полный перечень товарных групп, подлежащих обязательной цифровой маркировке Data Matrix в ИС Танба по Республике Казахстан: обувь, табак, лекарства, вода, текстиль, масла.',
        { lang: 'ru', keywords: 'категории товаров маркировка Казахстан, перечень маркировки, обувь лекарства табак' }
      );
    }
    if (location.hash) {
      const elementId = location.hash.replace('#', '');
      const el = document.getElementById(elementId);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [location, lang]);

  const categories: CategoryDetailItem[] = [
    // --- 1. TABACCO ---
    {
      id: 'tobacco',
      title: lang === 'kz' ? 'Темекі өнімдері және құрамында никотин бар бұйымдар' : lang === 'en' ? 'Tobacco & Nicotine Products' : 'Табачная продукция и никотиносодержащие изделия',
      status: 'ACTIVE',
      statusText: lang === 'kz' ? 'Міндетті таңбалау' : lang === 'en' ? 'Mandatory' : 'Обязательная маркировка',
      date: lang === 'kz' ? '2020 жылғы 1 қазаннан бастап' : lang === 'en' ? 'From October 1, 2020' : 'С 1 октября 2020 года',
      tnved: '2402, 2403, 2404',
      icon: Cigarette,
      description: lang === 'kz'
        ? 'Сүзгілі сигареттер, папиростар, сигариллалар, кальян темекісі, қыздырылатын темекі стиктері (IQOS, glo) және электронды сигареттер (вейптер, сұйықтықтар).'
        : lang === 'en'
        ? 'Filtered cigarettes, cigarillos, hookah tobacco, heated tobacco sticks (IQOS, glo), and e-cigarettes (vapes, e-liquids).'
        : 'Сигареты с фильтром, папиросы, сигариллы, кальянный табак, стики для систем нагревания табака (IQOS, glo) и электронные сигареты (вейпы, жидкости).',
      details: lang === 'kz'
        ? [
            'Әрбір қорап пен құтыға GS1 DataMatrix кодын жекелей жағу',
            'Блоктарды көліктік қораптар мен паллеттерге агрегациялау (SSCC)',
            'Импорттан немесе өндірушіден бөлшек сауда чегіне дейінгі толық бақылау',
          ]
        : lang === 'en'
        ? [
            'Item-level GS1 DataMatrix code printing on every pack and container',
            'Aggregation of cartons into transport shippers and pallets (SSCC)',
            'End-to-end traceability from import to retail receipt checkout',
          ]
        : [
            'Поштучное нанесение кодов DataMatrix GS1 на каждую пачку и флакон',
            'Агрегация блоков в транспортные короба и паллеты (SSCC)',
            'Сквозная прослеживаемость от импорта/производителя до розничного чека',
          ],
      link: '/calculator?category=TOBACCO',
    },

    // --- 2. SHOES ---
    {
      id: 'shoes',
      title: lang === 'kz' ? 'Аяқ киім өнімдері' : lang === 'en' ? 'Footwear and Shoes' : 'Обувные товары',
      status: 'ACTIVE',
      statusText: lang === 'kz' ? 'Міндетті таңбалау' : lang === 'en' ? 'Mandatory' : 'Обязательная маркировка',
      date: lang === 'kz' ? '2021 жылғы 1 қарашадан бастап' : lang === 'en' ? 'From November 1, 2021' : 'С 1 ноября 2021 года',
      tnved: '6401 - 6405',
      icon: Footprints,
      description: lang === 'kz'
        ? 'Аяқ киімнің барлық түрлері (ерлер, әйелдер, балалар, былғары, резеңке, тоқыма, спорттық, үй және арнайы жұмыс аяқ киімдері). Таңбаланбаған қалдықтарды сатуға тыйым салынған.'
        : lang === 'en'
        ? 'All types of footwear (men’s, women’s, children’s, leather, rubber, textile, athletic, and safety shoes). Unmarked circulation is prohibited.'
        : 'Абсолютно все виды обуви (мужская, женская, детская, кожаная, резиновая, текстильная, спортивная, домашняя и специальная обувь). Продажа немаркированных остатков запрещена.',
      details: lang === 'kz'
        ? [
            'Тұтынушылық қаптаманы немесе тігілген ярлықты таңбалау',
            'Қораптар мен паллеттердің агрегациялық кодтарын қалыптастыру',
            '«Таңба» АЖ ұлттық жүйесіне GTIN кодтарын жылдам енгізу және шығару',
          ]
        : lang === 'en'
        ? [
            'Labeling on consumer shoe box or stitched tongue label',
            'Generating master aggregation barcodes for cartons and pallets',
            'Fast GTIN commissioning in the national IS Tanba system',
          ]
        : [
            'Маркировка потребительской упаковки или вшивного ярлыка',
            'Формирование агрегационных кодов коробов и паллет',
            'Быстрый ввод и выгрузка GTIN в национальную систему ИС Танба',
          ],
      link: '/calculator?category=SHOES',
    },

    // --- 3. PHARMA ---
    {
      id: 'pharma',
      title: lang === 'kz' ? 'Дәрілік заттар және фармпрепараттар' : lang === 'en' ? 'Medicines & Pharmaceuticals' : 'Лекарственные средства и фармпрепараты',
      status: 'ACTIVE',
      statusText: lang === 'kz' ? 'Міндетті таңбалау' : lang === 'en' ? 'Mandatory' : 'Обязательная маркировка',
      date: lang === 'kz' ? '2024 жылғы 1 шілдеден бастап' : lang === 'en' ? 'From July 1, 2024' : 'С 1 июля 2024 года',
      tnved: '3004',
      icon: Pill,
      description: lang === 'kz'
        ? 'ҚР-да тіркелген мөлшерленген түрдегі және бөлшек қаптамадағы барлық дәрілік препараттар (ветеринариялық препараттарды қоспағанда).'
        : lang === 'en'
        ? 'All dosage-form medicinal drugs in retail packaging registered in Kazakhstan (excluding veterinary medications).'
        : 'Все лекарственные препараты в дозированных формах и розничных упаковках, зарегистрированные в РК (кроме ветеринарных препаратов).',
      details: lang === 'kz'
        ? [
            'Сериялық нөмірлерді, жарамдылық мерзімдерін және партияларды қатаң есепке алу',
            'A/B класты верификатормен тексерілетін стикерлерді жоғары дәлдікте басып шығару',
            'ҚР Денсаулық сақтау министрлігінің Бірыңғай фармацевтикалық жүйесімен синхрондау',
          ]
        : lang === 'en'
        ? [
            'Strict serial number, expiration date, and batch lot tracking',
            'High-precision verified printing (grade A/B readability standard)',
            'Synchronization with the Ministry of Healthcare pharmaceutical system',
          ]
        : [
            'Строгий учет серийных номеров, сроков годности и партий',
            'Высокоточная печать стикеров с проверкой верификатором класс A/B',
            'Синхронизация с Единой фармацевтической системой Минздрава РК',
          ],
      link: '/calculator?category=MEDICINE',
    },

    // --- 4. WATER ---
    {
      id: 'water',
      title: lang === 'kz' ? 'Қапталған су және шырын сусындары' : lang === 'en' ? 'Bottled Water & Juices' : 'Упакованная вода и сокосодержащие напитки',
      status: 'ACTIVE',
      statusText: lang === 'kz' ? 'Міндетті таңбалау' : lang === 'en' ? 'Mandatory' : 'Обязательная маркировка',
      date: lang === 'kz' ? '2024 жылғы 1 шілдеден бастап' : lang === 'en' ? 'From July 1, 2024' : 'С 1 июля 2024 года',
      tnved: '2201, 2202',
      icon: Droplets,
      description: lang === 'kz'
        ? 'Табиғи және минералды қапталған су, газдалған ауыз су, қантты сусындар, шырындар және шырын өнімдері.'
        : lang === 'en'
        ? 'Natural and mineral bottled water, carbonated water, sugar-sweetened drinks, juices, and nectars.'
        : 'Природная и минеральная упакованная вода, газированная питьевая вода, сахаросодержащие напитки, соки и сокосодержащая продукция.',
      details: lang === 'kz'
        ? [
            'ПЭТ, шыны, қақпақтар мен затбелгілерге кодтарды ағынды жағу',
            'Құю желісінде және қоймаларда жоғары жылдамдықта автоматтандырылған этикеткалау',
            'Топтық қаптамалар мен паллеттік ярлықтарды қалыптастыру',
          ]
        : lang === 'en'
        ? [
            'Flow application on PET bottles, glass, caps, and label ribbons',
            'High-speed automated labeling at bottling line speeds',
            'Creating grouped bundles and master shipping pallet labels',
          ]
        : [
            'Потоковое нанесение кодов на ПЭТ, стекло, колпачки и этикетки',
            'Высокоскоростное автоматизированное этикетирование на розливе и складах',
            'Формирование групповых упаковок и паллетных ярлыков',
          ],
      link: '/calculator?category=WATER',
    },

    // --- 5. SAIGA ---
    {
      id: 'saiga',
      title: lang === 'kz' ? 'Киік дериваттары (мүйіздер)' : lang === 'en' ? 'Saiga Horns & Derivatives' : 'Дериваты сайгака (рога)',
      status: 'ACTIVE',
      statusText: lang === 'kz' ? 'Міндетті таңбалау' : lang === 'en' ? 'Mandatory' : 'Обязательная маркировка',
      date: lang === 'kz' ? '2025 жылғы 1 желтоқсаннан бастап' : lang === 'en' ? 'From December 1, 2025' : 'С 1 декабря 2025 года',
      tnved: '0507 90 000 0',
      icon: Award,
      description: lang === 'kz'
        ? 'Киік дериваттары (кез келген түрдегі мүйіздер). Таңбалау биологиялық ресурстардың заңсыз айналымының жолын кесу үшін енгізілген.'
        : lang === 'en'
        ? 'Saiga antelope biological derivatives (horns in any condition) to regulate conservation and eliminate illicit traffic.'
        : 'Дериваты сайгака (рога в любом виде). Маркировка введена для контроля учета и пресечения незаконного оборота биологических ресурсов.',
      details: lang === 'kz'
        ? [
            'Дериваттарды жекелей микро-таңбалау және биркалау',
            'DataMatrix GS1 арқылы айналым тізілімдерін толық қорғау',
          ]
        : lang === 'en'
        ? [
            'Item-level micro-marking and tamper-evident tagging of derivatives',
            'Protected biological resource tracking via official GS1 DataMatrix',
          ]
        : [
            'Поштучная микро-маркировка и биркирование дериватов',
            'Полная защита реестров оборота через DataMatrix GS1',
          ],
      link: '/calculator?category=OTHER',
    },

    // --- 6. MOTOR OILS ---
    {
      id: 'oils',
      title: lang === 'kz' ? 'Мотор майлары және автохимия' : lang === 'en' ? 'Motor Oils and Automotive Fluids' : 'Моторные масла и автохимия',
      status: 'UPCOMING',
      statusText: lang === 'kz' ? '2026 жылы енгізіледі' : lang === 'en' ? 'Upcoming in 2026' : 'Внедряется в 2026 году',
      date: lang === 'kz' ? '2026 жыл (Кезең-кезеңімен іске қосу)' : lang === 'en' ? '2026 (Phased Rollout)' : '2026 год (Поэтапный старт)',
      tnved: '2710, 3402, 3819, 3820',
      icon: Car,
      description: lang === 'kz'
        ? 'Майлағыш материалдар, мотор, компрессор, турбина және трансмиссия майлары, тежегіш сұйықтықтары, антифриздер және автохимия.'
        : lang === 'en'
        ? 'Lubricating oils, engine, compressor, turbine, transmission oils, brake fluids, coolants, and car care chemicals.'
        : 'Смазочные материалы, моторные, компрессорные, турбинные и трансмиссионные масла, тормозные жидкости, антифризы и автохимия.',
      stages: lang === 'kz'
        ? [
            { date: '2026 ж. 1 ақпаннан бастап', title: 'Мұнай өнімдері бар мотор, компрессор, турбина майлары мен майлағыштар' },
            { date: '2026 ж. 1 қыркүйектен бастап', title: 'Трансмиссия майлары, гидравликалық және тежегіш сұйықтықтары, антифриздер, автохимия' },
          ]
        : lang === 'en'
        ? [
            { date: 'From Feb 1, 2026', title: 'Motor, compressor, turbine oils and petroleum-based lubricants' },
            { date: 'From Sep 1, 2026', title: 'Transmission oils, hydraulic fluids, brake fluids, antifreezes, car care' },
          ]
        : [
            { date: 'С 1 февраля 2026 г.', title: 'Моторные, компрессорные, турбинные масла и смазки с нефтепродуктами' },
            { date: 'С 1 сентября 2026 г.', title: 'Трансмиссионные масла, гидравлические и тормозные жидкости, антифризы, автохимия' },
          ],
      details: lang === 'kz'
        ? [
            'Бөшкелерді, канистрлерді және көліктік қораптарды жекелей және агрегацияланған сканерлеу',
            'ҚР нарығындағы ірі авто-брендтерді контрафактіден қорғау',
          ]
        : lang === 'en'
        ? [
            'Piece-level and aggregated scanning of steel drums, plastic canisters, and shipping cartons',
            'Shielding leading automotive brands against counterfeit distribution',
          ]
        : [
            'Поштучное и агрегированное сканирование бочек, канистр и транспортных коробов',
            'Защита крупнейших авто-брендов от подделок на рынке РК',
          ],
      link: '/calculator?category=OTHER',
    },

    // --- 7. BEER ---
    {
      id: 'beer',
      title: lang === 'kz' ? 'Сыра және сыра сусындары (алкогольсізді қоса алғанда)' : lang === 'en' ? 'Beer & Malt Beverages (Including Non-Alcoholic)' : 'Пиво и пивные напитки (включая безалкогольные)',
      status: 'UPCOMING',
      statusText: lang === 'kz' ? '2026–2027 жылдары енгізіледі' : lang === 'en' ? 'Upcoming in 2026–2027' : 'Внедряется в 2026–2027 гг.',
      date: lang === 'kz' ? '2026–2027 жылдар' : lang === 'en' ? '2026–2027' : '2026–2027 годы',
      tnved: '2203 00, 2202 91 000 0',
      icon: Beer,
      description: lang === 'kz'
        ? 'Тұтынушылық және көліктік ыдыстың барлық түрлеріндегі сыра қайнату өнімдері, сыра сусындары және алкогольсіз сыра.'
        : lang === 'en'
        ? 'Brewed beer, beer-based beverages, and non-alcoholic beer across all consumer and transport packaging formats.'
        : 'Пивоваренная продукция, пивные напитки и безалкогольное пиво во всех типах потребительской и транспортной тары.',
      stages: lang === 'kz'
        ? [
            { date: '2026 ж. 1 ақпаннан бастап', title: 'Кегтерге құйылған өнімдер' },
            { date: '2026 ж. 1 қыркүйектен бастап', title: 'Бөтелкелерге құйылған өнімдер (шыны / ПЭТ)' },
            { date: '2027 ж. 1 қаңтардан бастап', title: 'Алюминий банкаларға құйылған өнімдер' },
          ]
        : lang === 'en'
        ? [
            { date: 'From Feb 1, 2026', title: 'Products packaged in commercial kegs' },
            { date: 'From Sep 1, 2026', title: 'Products bottled in glass or PET bottles' },
            { date: 'From Jan 1, 2027', title: 'Products canned in aluminum beverage cans' },
          ]
        : [
            { date: 'С 1 февраля 2026 г.', title: 'Продукция, разлитая в кеги' },
            { date: 'С 1 сентября 2026 г.', title: 'Продукция, разлитая в бутылки (стекло / ПЭТ)' },
            { date: 'С 1 января 2027 г.', title: 'Продукция, разлитая в алюминиевые банки' },
          ],
      details: lang === 'kz'
        ? [
            'Кег қақпақтарына, тығындар мен банкаларға кодтарды тікелей жағу',
            'Сыра зауыттары мен дистрибьюторлардың есеп жүйелерімен интеграциялау',
          ]
        : lang === 'en'
        ? [
            'Direct application to keg caps, bottle crowns, and aluminum tops',
            'Full data integration with brewery and distributor ERP systems',
          ]
        : [
            'Прямое нанесение кодов на крышки кегов, пробки и банки',
            'Интеграция с учетными системами пивоварен и дистрибьюторов',
          ],
      link: '/calculator?category=OTHER',
    },

    // --- 8. BAD ---
    {
      id: 'bad',
      title: lang === 'kz' ? 'Биологиялық белсенді қоспалар (ББҚ)' : lang === 'en' ? 'Dietary Supplements (Supplements)' : 'Биологически активные добавки (БАД)',
      status: 'UPCOMING',
      statusText: lang === 'kz' ? '2026 жылы енгізіледі' : lang === 'en' ? 'Upcoming in 2026' : 'Внедряется в 2026 году',
      date: lang === 'kz' ? '2026 жылғы 1 қыркүйектен бастап' : lang === 'en' ? 'From September 1, 2026' : 'С 1 сентября 2026 года',
      tnved: '2106 90',
      icon: HeartPulse,
      description: lang === 'kz'
        ? 'Қолданыстағы мемлекеттік тіркеу туралы куәлігі (МТК) бар тағамға барлық биологиялық белсенді қоспалар.'
        : lang === 'en'
        ? 'All nutritional food supplements carrying a valid State Registration Certificate (SGR).'
        : 'Все биологически активные добавки к пище, имеющие действующее свидетельство о государственной регистрации (СГР).',
      details: lang === 'kz'
        ? [
            'ББҚ құтыларына, блистерлеріне және қораптарына кодтарды жағу',
            'МТК түпнұсқалығын және импорт партияларын бақылау',
          ]
        : lang === 'en'
        ? [
            'Labeling on supplement bottles, blisters, and retail cartons',
            'Strict validation of SGR certificate authenticity and import batches',
          ]
        : [
            'Нанесение кодов на флаконы, блистеры и коробочки БАД',
            'Контроль подлинности СГР и партий импорта',
          ],
      link: '/calculator?category=OTHER',
    },

    // --- 9. TEXTILE ---
    {
      id: 'textile',
      title: lang === 'kz' ? 'Жеңіл өнеркәсіп және тоқыма тауарлары' : lang === 'en' ? 'Apparel & Light Industry Textiles' : 'Товары легкой промышленности и текстиль',
      status: 'UPCOMING',
      statusText: lang === 'kz' ? '2026–2027 жылдары енгізіледі' : lang === 'en' ? 'Upcoming in 2026–2027' : 'Внедряется в 2026–2027 гг.',
      date: lang === 'kz' ? '2026–2027 жж. (Қалдықтар 2028 жылға дейін)' : lang === 'en' ? '2026–2027 (Remaining stock until 2028)' : '2026–2027 гг. (Остатки до 2028)',
      tnved: '4203, 4304, 6101-6115, 6201-6217, 6302',
      icon: Shirt,
      description: lang === 'kz'
        ? 'ҚР Сауда министрінің № 199-НҚ бұйрығымен енгізіледі. КИЗ тарифі Минпромстрой № 381 бұйрығымен реттеледі. Ресейге экспорт үшін АО «Қазахтелеком» арқылы «Честный знак» КИЗ алу жүйесі жұмыс істейді. Кедендік қоймаларда (ИМ-70) таңбалау жүргізіледі (УСҚ-да жүргізілмейді).'
        : lang === 'en'
        ? 'Enacted under Order MTI № 199-NҚ. Maximum code cost is regulated by Order Minpromstroy № 381. Export to Russia via Chestny Znak marks through JSC Kazakhtelecom. Foreign goods marked in Customs Warehouse (IM-70) or SEZ (not permitted on basic temporary storage TSW).'
        : 'Вводится приказом МТИ РК № 199-НҚ. Тариф КИЗ регулируется Приказом Минпромстроя № 381. Для экспорта в РФ действует сервис КИЗ Честного знака через АО «Казахтелеком». Иностранные товары маркируются в режимах «Таможенный склад» или СЭЗ (на обычном СВХ маркировка не проводится).',
      stages: lang === 'kz'
        ? [
            { date: '2026 ж. 1 желтоқсаннан', title: 'Өндірілген және импортталған жеңіл өнеркәсіп тауарларын міндетті таңбалау' },
            { date: '2027 ж. 1 қазанға дейін', title: 'Қабылдап алу-тапсыру актілері бойынша тауарлардың толық қадағалануын қамтамасыз ету' },
            { date: '2028 ж. 1 қаңтарға дейін', title: 'Міндетті таңбалауға дейін әкелінген таңбаланбаған қалдықтарды сатуға рұқсат етіледі' },
          ]
        : lang === 'en'
        ? [
            { date: 'From Dec 1, 2026', title: 'Mandatory serialization of manufactured and imported light industry goods' },
            { date: 'Until Oct 1, 2027', title: 'Full batch and item traceability via transfer and acceptance acts' },
            { date: 'Until Jan 1, 2028', title: 'Allowed sale of non-serialized inventory imported or made before Dec 1, 2026' },
          ]
        : [
            { date: 'С 1 декабря 2026 г.', title: 'Введение поэтапной обязательной маркировки произведенных и импортированных ТЛП' },
            { date: 'До 1 октября 2027 г.', title: 'Прослеживаемость маркированных ТЛП (передача по актам приема-передачи)' },
            { date: 'До 1 января 2028 г.', title: 'Разрешена продажа немаркированных остатков, ввезенных до 1 декабря 2026 г.' },
          ],
      details: lang === 'kz'
        ? [
            'Тауар бірлігінің Data Matrix кодын басу және ярлықтарға/қаптамаға жағу',
            'Ресейлік маркетплейстерге экспорттау үшін «Честный знак» КИЗ алу',
            'Кедендік қоймаларда (ИМ-70 режимі) және СЭЗ аумағында импортты рәсімдеу',
            '2028 жылғы 1 қаңтарға дейін ескі қоймалық қалдықтарды реттеу',
          ]
        : lang === 'en'
        ? [
            'Printing and application of Data Matrix codes to hang tags, ribbons, and packaging',
            'Chestny Znak export marks for selling on Russian marketplaces (Wildberries, Ozon)',
            'Bonded customs warehouse (IM-70) and SEZ marking prior to domestic release',
            'Grace period for selling unmarked inventory until January 1, 2028',
          ]
        : [
            'Печать и нанесение Data Matrix на ярлыки, вшивные ленты и упаковку',
            'Получение КИЗ РФ (Честный знак) через АО «Казахтелеком» для экспорта на Wildberries, OZON',
            'Маркировка импорта в процедурах «Таможенный склад» (ИМ-70) и СЭЗ (на СВХ не проводится)',
            'Продажа немаркированных остатков разрешена до 1 января 2028 года',
          ],
      link: '/calculator?category=TEXTILE',
    },

    // --- 10. JEWELRY ---
    {
      id: 'jewelry',
      title: lang === 'kz' ? 'Зергерлік бұйымдар және бағалы металдар' : lang === 'en' ? 'Jewelry and Precious Metals' : 'Ювелирные изделия и драгметаллы',
      status: 'UPCOMING',
      statusText: lang === 'kz' ? '2026 жылғы 1 желтоқсаннан енгізіледі' : lang === 'en' ? 'Upcoming from Dec 1, 2026' : 'Внедряется с 1 декабря 2026 г.',
      date: lang === 'kz' ? '2026 жылғы 1 желтоқсаннан бастап' : lang === 'en' ? 'From December 1, 2026' : 'С 1 декабря 2026 года',
      tnved: '7113 11 000 0, 7113 19 000 0, 7114 11 000 0, 7114 19 000 0, 9111 10 000 0, 9113 10 100 0',
      icon: Gem,
      description: lang === 'kz'
        ? 'ҚР Сауда және интеграция министрінің № 199-НҚ бұйрығына сәйкес бағалы металдардан жасалған зергерлік бұйымдарды, сағат корпустары мен білезіктерін міндетті таңбалау. 2022-2023 жылдардағы сынақ жобасы аяқталды.'
        : lang === 'en'
        ? 'Mandatory serialization of precious metal jewelry, watch cases, and watch straps under MTI Order № 199-NҚ. The pilot testing (2022-2023) has officially concluded.'
        : 'Обязательная маркировка ювелирных изделий, изделий мастеров, корпусов и браслетов для часов из драгметаллов (Приказ МТИ РК № 199-НҚ). Пилотный проект 2022-2023 гг. успешно завершен.',
      stages: lang === 'kz'
        ? [
            { date: '2022 ж. 1 наурыз', title: 'Зергерлік бұйымдарды таңбалау бойынша сынақ жобасының басталуы' },
            { date: '2023 ж. 15 маусым', title: 'Сынақ жобасының сәтті аяқталуы' },
            { date: '2026 ж. 1 желтоқсан', title: 'ҚР-да міндетті таңбалауды енгізу (№ 199-НҚ бұйрығы)' },
          ]
        : lang === 'en'
        ? [
            { date: 'Mar 1, 2022', title: 'Launch of jewelry serialization pilot in Kazakhstan' },
            { date: 'Jun 15, 2023', title: 'Official completion of pilot testing' },
            { date: 'Dec 1, 2026', title: 'Enactment of mandatory serialization (Order № 199-NҚ)' },
          ]
        : [
            { date: '1 марта 2022 г.', title: 'Старт пилотного проекта по маркировке ювелирных изделий' },
            { date: '15 июня 2023 г.', title: 'Завершение пилотного проекта' },
            { date: '1 декабря 2026 г.', title: 'Введение обязательной маркировки (Приказ МТИ РК № 199-НҚ)' },
          ],
      details: lang === 'kz'
        ? [
            'Күміс, алтын, платина бұйымдарына және сағат бөлшектеріне DataMatrix микро-кодтарын жағу',
            'Зергерлік биркалар мен қорғаныс пломбалары арқылы өнімді бұзбай даналап есепке алу',
            'Ұлттық прослеживаемость жүйесіне бұйымдардың сынамалары мен салмағын тіркеу',
          ]
        : lang === 'en'
        ? [
            'Micro DataMatrix codes applied to silver, gold, platinum jewelry, and watch cases',
            'Tamper-evident seals and hang tags protecting the visual aesthetics of the items',
            'Itemized registration of fineness, gemstones, and net weight in the national registry',
          ]
        : [
            'Микро-маркировка Data Matrix на бирках и защитных ювелирных пломбах',
            'Охват изделий из серебра, золота, платины, а также корпусов (9111 10) и ремешков (9113 10)',
            'Поштучный учет от завода/импорта до кассового чека в ювелирном бутике',
          ],
      link: '/calculator?category=OTHER',
    },

    // --- 11. TIMBER ---
    {
      id: 'timber',
      title: lang === 'kz' ? 'Сүрек және домалақ ағаш' : lang === 'en' ? 'Timber & Roundwood' : 'Древесина и круглый лес',
      status: 'UPCOMING',
      statusText: lang === 'kz' ? '2026 жылғы 1 желтоқсаннан енгізіледі' : lang === 'en' ? 'Upcoming from Dec 1, 2026' : 'Внедряется с 1 декабря 2026 г.',
      date: lang === 'kz' ? '2026 жылғы 1 желтоқсаннан бастап' : lang === 'en' ? 'From December 1, 2026' : 'С 1 декабря 2026 года',
      tnved: '4401, 4403',
      icon: Trees,
      description: lang === 'kz'
        ? '«Семей Орманы» резерватындағы пилоттық жоба аяқталды. Орман кесу билеті бар барлық тұлғаларға арналған домалақ ағашты (іскерлік және отындық) міндетті таңбалау. Тақтайлар мен араланған ағаш таңбаланбайды.'
        : lang === 'en'
        ? 'Pilot in "Semey Ormany" reserve concluded. Mandatory roundwood (industrial & fuelwood) serialization for all logging permit holders. Processed boards and sawn timber are exempt.'
        : 'Обязательная маркировка круглого леса (делового и дровяного) для всех обладателей лесорубочного билета. Пилот в резервате «Семей Орманы» завершен. Доски и пиломатериалы НЕ маркируются.',
      stages: lang === 'kz'
        ? [
            { date: '2025 ж. 1 тамыз', title: '«Семей Орманы» резерватында сынақ жобасының басталуы' },
            { date: '2025 ж. 20 қазан', title: 'Сынақ жобасының сәтті аяқталуы' },
            { date: '2026 ж. 1 желтоқсан', title: 'Домалақ ағашты міндетті таңбалауды енгізу' },
          ]
        : lang === 'en'
        ? [
            { date: 'Aug 1, 2025', title: 'Pilot launch in "Semey Ormany" state forest reserve' },
            { date: 'Oct 20, 2025', title: 'Successful completion of pilot testing' },
            { date: 'Dec 1, 2026', title: 'Enactment of mandatory roundwood serialization' },
          ]
        : [
            { date: '1 августа 2025 г.', title: 'Начало пилотного проекта в ГЛПР «Семей Орманы»' },
            { date: '20 октября 2025 г.', title: 'Завершение пилотного проекта' },
            { date: '1 декабря 2026 г.', title: 'Введение обязательной маркировки круглого леса' },
          ],
      details: lang === 'kz'
        ? [
            'Орман кесу билетінің нөмірі, орманшылық, тоқсан, бөлініс және көлем деректерімен таңбалау',
            'Бөренеге (іскерлік) немесе отын бумасына бірегей QR/штрих-кодты пластикалық пломба-бирка бекіту',
            'Тақтайлар, брустар және араланған өнімдер таңбаланбайды (тек домалақ ағаш)',
          ]
        : lang === 'en'
        ? [
            'Encoding logging permit #, forest district, compartment, lot, species, and volume',
            'Affixing plastic seal tags with QR/barcode to logs or firewood bundles',
            'Strict exemption for processed lumber and boards (only roundwood is tracked)',
          ]
        : [
            'Учет номера лесорубочного билета, лесничества, квартала, выдела, породы и объема',
            'Крепление пластиковой пломбы-бирки со штрихкодом или QR на бревно или пачку дров',
            'Маркируется только круглый лес; доски и пиломатериалы маркировке НЕ подлежат',
          ],
      link: '/calculator?category=OTHER',
    },

    // --- 12. LPG ---
    {
      id: 'lpg',
      title: lang === 'kz' ? 'Тұрмыстық баллондардағы сұйытылған газ (СМГ)' : lang === 'en' ? 'LPG in Domestic Cylinders' : 'Сжиженный нефтяной газ в бытовых баллонах',
      status: 'UPCOMING',
      statusText: lang === 'kz' ? '2027 жылы енгізіледі' : lang === 'en' ? 'Upcoming in 2027' : 'Внедряется в 2027 году',
      date: lang === 'kz' ? '2027 жыл' : lang === 'en' ? '2027' : '2027 год',
      tnved: '2711 12 9400, 2711 12 9700, 2711 13 9700',
      icon: Flame,
      description: lang === 'kz'
        ? 'ҚР Энергетика министрлігінің сынақ жобасы (2025 ж.) аяқталды. Тұрмыстық баллондар мен газ көлемін цифрлық есепке алу, жарамсыз ыдысты айналымнан шығару және ГНС-те таңбалау.'
        : lang === 'en'
        ? 'Ministry of Energy pilot completed in 2025. Mandatory digital tracking of domestic cylinders, gas volume control, and safe filling at gas filling stations (GNS).'
        : 'Пилот Минэнерго РК завершен 31 декабря 2025 г. Цифровой учет бытовых баллонов и объемов газа на ГНС и ГНП, пресечение нелегальных заправок и изъятие аварийной тары.',
      stages: lang === 'kz'
        ? [
            { date: '2025 ж. 1 шілде', title: 'ҚР Энергетика министрлігінің сынақ жобасын іске қосу' },
            { date: '2025 ж. 31 желтоқсан', title: 'Газ толтыру станцияларында сынақ жұмыстарын аяқтау' },
            { date: '2027 жыл', title: 'Қазақстан бойынша міндетті таңбалауды енгізу' },
          ]
        : lang === 'en'
        ? [
            { date: 'Jul 1, 2025', title: 'Launch of Ministry of Energy LPG pilot' },
            { date: 'Dec 31, 2025', title: 'Completion of pilot at gas filling stations' },
            { date: '2027', title: 'Mandatory nationwide track & trace enforcement' },
          ]
        : [
            { date: '1 июля 2025 г.', title: 'Запуск пилотного проекта Минэнерго РК' },
            { date: '31 декабря 2025 г.', title: 'Завершение пилотного проекта' },
            { date: '2027 год', title: 'Введение обязательной маркировки газа в бытовых баллонах' },
          ],
      details: lang === 'kz'
        ? [
            'Пропан, бутан және олардың қоспаларын қамтитын баллондарды цифрлық сәйкестендіру',
            'ГНС және ГНП-де толтыру алдында баллонның қауіпсіздік мерзімін тексеру',
            'Мобильді қосымша арқылы баллонды және газдың заңдылығын растау',
          ]
        : lang === 'en'
        ? [
            'Digital tracking of propane, butane, and propane-butane mixture cylinders',
            'Pre-filling inspection of cylinder safety certificates at gas filling stations (GNS)',
            'Mobile app verification of cylinder safety and genuine authorized refill',
          ]
        : [
            'Цифровой учет баллонов с пропаном, бутаном и смесью (ТН ВЭД 2711)',
            'Нанесение идентификационных меток на газонаполнительных станциях (ГНС)',
            'Отбраковка аварийных баллонов и проверка потребителем через мобильное приложение',
          ],
      link: '/calculator?category=OTHER',
    },
  ];

  const filteredCategories = categories.filter((c) => {
    if (activeFilter === 'ACTIVE') return c.status === 'ACTIVE';
    if (activeFilter === 'UPCOMING') return c.status === 'UPCOMING';
    return true;
  });

  return (
    <div className="bg-[#F4F6F9] min-h-screen pb-16 space-y-8">
      
      {/* Header Banner */}
      <section className="relative py-12 sm:py-16 bg-white border-b border-gray-200/80 overflow-hidden">
        {/* Subtle grid pattern & ambient tint */}
        <div className="absolute inset-0 bg-[radial-gradient(#0082FB_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.07] pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0082FB]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-100/30 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-4">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#111827] tracking-tight leading-tight max-w-4xl">
            {lang === 'kz' 
              ? 'Қазақстанда таңбалауға жататын тауар санаттарының тізілімі' 
              : lang === 'en' 
              ? 'Registry of Goods Subject to Serialization in Kazakhstan' 
              : 'Реестр подлежащих маркировке товаров в Казахстане'}
          </h1>
          <p className="text-base sm:text-lg text-[#64748B] max-w-3xl font-normal leading-relaxed">
            {lang === 'kz'
              ? 'ҚР заңнамасына (GS1 DataMatrix) сәйкес қолданыстағы міндетті таңбалаудың толық тізімі және жаңа тауар топтарын енгізудің күнтізбелік кестесі.'
              : lang === 'en'
              ? 'Complete list of active mandatory labeling and timeline for introducing new product categories under Kazakhstan regulations (GS1 DataMatrix).'
              : 'Полный перечень действующей обязательной маркировки и календарный график введения новых групп товаров согласно законодательству РК (DataMatrix GS1).'}
          </p>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-[#0082FB] text-white shadow-xs'
                : 'bg-white text-[#111827] hover:bg-gray-100 border border-gray-200/80'
            }`}
          >
            {lang === 'kz' ? `Барлық санаттар (${categories.length})` : lang === 'en' ? `All Categories (${categories.length})` : `Все категории (${categories.length})`}
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('ACTIVE')}
            className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeFilter === 'ACTIVE'
                ? 'bg-[#0082FB] text-white shadow-xs'
                : 'bg-white text-[#111827] hover:bg-gray-100 border border-gray-200/80'
            }`}
          >
            {lang === 'kz' ? 'Міндетті таңбалау' : lang === 'en' ? 'Mandatory Serialization' : 'Обязательная маркировка'}
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('UPCOMING')}
            className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeFilter === 'UPCOMING'
                ? 'bg-[#0082FB] text-white shadow-xs'
                : 'bg-white text-[#111827] hover:bg-gray-100 border border-gray-200/80'
            }`}
          >
            {lang === 'kz' ? '2026–2027 жылдары енгізу' : lang === 'en' ? 'Upcoming 2026–2027' : 'Внедрение 2026–2027'}
          </button>
        </div>

        {/* Categories List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredCategories.map((item) => {
            const isActive = item.status === 'ACTIVE';
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                id={item.id}
                onClick={() => navigate(getLocalizedPath(`/categories/${item.id}`))}
                className="bg-white rounded-2xl px-5 py-4 border border-gray-200/80 hover:border-[#0082FB]/40 hover:shadow-sm transition-all duration-150 flex items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="flex flex-col gap-2 min-w-0">
                  <span className="text-[15px] font-semibold text-[#111827] group-hover:text-[#0082FB] transition-colors leading-snug truncate">
                    {item.title}
                  </span>
                  <span
                    className={`inline-flex w-fit text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-blue-50 text-[#0082FB]'
                    }`}
                  >
                    {lang === 'kz' ? 'Толығырақ' : lang === 'en' ? 'Details' : 'Подробнее'}
                  </span>
                </div>
                <Icon className="w-8 h-8 text-[#0082FB] shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" />
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
                ? '2026–2027 жылдары таңбалауға дайындалып жатырсыз ба?'
                : lang === 'en'
                ? 'Preparing for Serialization in 2026–2027?'
                : 'Готовитесь к маркировке в 2026–2027 годах?'}
            </h3>
            <p className="text-sm text-slate-300">
              {lang === 'kz'
                ? 'Біздің «Таңба» АЖ бойынша мамандарымыз ТН ВЭД-ке тегін аудит жүргізеді, номенклатураны тексереді және DataMatrix жекелей сканерлеу үшін интеграцияны баптайды.'
                : lang === 'en'
                ? 'Our IS Tanba specialists will conduct a free HS code audit, cross-check your product SKUs, and configure integration for piece-by-piece DataMatrix scanning.'
                : 'Наши специалисты по ИС Танба проведут бесплатный аудит ТН ВЭД, проверят номенклатуру и настроят интеграцию для поштучного сканирования DataMatrix.'}
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedServiceTitle(
                lang === 'kz'
                  ? 'ТН ВЭД тегін аудиті және 2026–2027 жылдардағы таңбалауға дайындық'
                  : lang === 'en'
                  ? 'Free HS Code Audit and Preparation for 2026–2027 Serialization'
                  : 'Бесплатный аудит ТН ВЭД и подготовка к маркировке 2026–2027'
              );
              setIsModalOpen(true);
            }}
            className="bg-[#0082FB] text-white font-extrabold text-sm px-8 py-3.5 rounded-2xl hover:bg-[#0070DA] transition-all shrink-0 active:scale-95 shadow-md cursor-pointer"
          >
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
