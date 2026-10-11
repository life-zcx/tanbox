import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Filter, 
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
  Cpu, 
  PackageCheck,
  Calendar,
  Layers
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
        ? 'Бүкіл жеңіл өнеркәсіпті кезең-кезеңімен қамту: былғары және үлбір киімдер, іш киім, сыртқы киім, костюмдер, шалбарлар, блузкалар. Негізгі ережелер 2026 жылғы 14 қарашадан бастап күшіне енеді.'
        : lang === 'en'
        ? 'Phased coverage across all apparel: leather and fur goods, underwear, outerwear, suits, pants, blouses. Base rules take effect November 14, 2026.'
        : 'Поэтапный охват всей легкой промышленности: одежда из кожи и меха, белье, верхняя одежда, костюмы, брюки, блузки. Базовые правила вступают в силу с 14 ноября 2026 г.',
      stages: lang === 'kz'
        ? [
            { date: '2026 ж. 1 желтоқсаннан', title: 'Табиғи/композициялық былғарыдан тігілген киім, жасанды үлбір, шаңғы костюмдері, төсек, үстел және асүй жаймалары (ережелер 14.11.2026 бастап)' },
            { date: '2027 ж. 1 наурыздан', title: 'Сыртқы киім (пальто, күртеше, плащ, желбегей), блузкалар, пуловерлер, кардигандар, шарфтар мен галстуктер' },
            { date: '2027 ж. 1 қазаннан', title: 'Ерлер мен әйелдер костюмдері, пиджактар, көйлектер, белдемшелер, шалбарлар, комбинезондар, трикотаж көйлектер және спорттық костюмдер' },
            { date: '2028 ж. 1 қаңтарға дейін', title: 'Міндетті таңбалау басталғанға дейін әкелінген сатылмаған тауар қалдықтарын таңбалаудың соңғы мерзімі' },
          ]
        : lang === 'en'
        ? [
            { date: 'From Dec 1, 2026', title: 'Leather garments, faux fur, ski suits, bed/table/kitchen linen' },
            { date: 'From Mar 1, 2027', title: 'Outerwear (coats, jackets, raincoats), blouses, pullovers, cardigans, scarves' },
            { date: 'From Oct 1, 2027', title: 'Suits, blazers, dresses, skirts, trousers, jumpsuits, tracksuits' },
            { date: 'Until Jan 1, 2028', title: 'Deadline for labeling unsold stock imported prior to enforcement' },
          ]
        : [
            { date: 'С 1 декабря 2026 г.', title: 'Одежда из натуральной/композиционной кожи, искусственный мех, лыжные костюмы, постельное, столовое и кухонное белье (правила с 14.11.2026)' },
            { date: 'С 1 марта 2027 г.', title: 'Верхняя одежда (пальто, куртки, плащи, ветровки), блузки, пуловеры, кардиганы, шарфы и галстуки' },
            { date: 'С 1 октября 2027 г.', title: 'Мужские и женские костюмы, пиджаки, платья, юбки, брюки, комбинезоны, трикотажные рубашки и спортивные костюмы' },
            { date: 'До 1 января 2028 г.', title: 'Крайний срок маркировки нераспроданных остатков товаров, ввезенных до старта обязательной маркировки' },
          ],
      details: lang === 'kz'
        ? [
            'Ярлықтарды, тігілген затбелгілерді және қаптаманы басу және стикерлеу',
            '2028 жылғы 1 қаңтарға дейін сатылмаған қоймалық қалдықтарды таңбалау',
            'Импорттаушылардың қоймаларында жапсыру үшін TANBOX мобильді көшпелі бригадалары',
          ]
        : lang === 'en'
        ? [
            'Printing and stickering of hang tags, sewn-in textile labels, and polybags',
            'Turnkey labeling of unsold warehouse inventory until January 1, 2028',
            'Dispatched mobile TANBOX crews for on-site labeling at importer warehouses',
          ]
        : [
            'Печать и стикерование ярлыков, вшивных этикеток и упаковки',
            'Маркировка нераспроданных складских остатков до 1 января 2028 г.',
            'Мобильные выездные бригады TANBOX для оклейки на складах импортеров',
          ],
      link: '/calculator?category=TEXTILE',
    },

    // --- 10. JEWELRY ---
    {
      id: 'jewelry',
      title: lang === 'kz' ? 'Зергерлік бұйымдар және бағалы металдар' : lang === 'en' ? 'Jewelry and Precious Metals' : 'Ювелирные изделия и драгметаллы',
      status: 'UPCOMING',
      statusText: lang === 'kz' ? '2026 жылы енгізіледі' : lang === 'en' ? 'Upcoming in 2026' : 'Внедряется в 2026 году',
      date: lang === 'kz' ? '2026 жылғы 1 желтоқсаннан бастап' : lang === 'en' ? 'From December 1, 2026' : 'С 1 декабря 2026 года',
      tnved: '7113, 7114',
      icon: Gem,
      description: lang === 'kz'
        ? 'Бағалы металдардан (алтын, күміс, платина) және асыл тастардан жасалған зергерлік бұйымдар мен олардың бөліктері.'
        : lang === 'en'
        ? 'Jewelry pieces and components made from precious metals (gold, silver, platinum) and gemstones.'
        : 'Ювелирные изделия и их части из драгоценных металлов (золото, серебро, платина) и драгоценных камней.',
      details: lang === 'kz'
        ? [
            'Зергерлік биркалар мен пломбаларды DataMatrix кодтарымен микро-таңбалау',
            'Өндірістен витринаға дейін әрбір бұйымды даналап есепке алу',
          ]
        : lang === 'en'
        ? [
            'Micro-marking of jewelry hang tags and security seals with DataMatrix codes',
            'Item-level serialization from factory production to retail boutique display',
          ]
        : [
            'Микро-маркировка ювелирных бирков и пломб кодами DataMatrix',
            'Поштучный учет каждого изделия от производства до витрины',
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

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCategories.map((item) => {
            const isActive = item.status === 'ACTIVE';

            return (
              <div
                key={item.id}
                id={item.id}
                onClick={() => navigate(getLocalizedPath(`/categories/${item.id}`))}
                className="bg-white rounded-2xl p-6 sm:p-7 border border-gray-200/90 hover:border-[#0082FB] hover:shadow-lg transition-all duration-200 flex flex-col justify-between group space-y-5 cursor-pointer"
              >
                <div className="space-y-4">
                  {/* Top Badge & TNVED */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                          : 'bg-blue-50 text-[#0082FB] border-blue-200/80'
                      }`}
                    >
                      {isActive 
                        ? (lang === 'kz' ? '✓ Міндетті таңбалау' : lang === 'en' ? '✓ Mandatory' : '✓ Обязательная маркировка')
                        : item.statusText}
                    </span>

                    <span className="text-[11px] font-mono font-bold text-[#475569] bg-gray-50 border border-gray-200/80 px-2.5 py-1 rounded-lg">
                      {lang === 'kz' ? 'ТН ВЭД' : lang === 'en' ? 'HS Code' : 'ТН ВЭД'}: {item.tnved}
                    </span>
                  </div>

                  {/* Title & Date */}
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-[#111827] group-hover:text-[#0082FB] transition-colors tracking-tight leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#64748B] mt-1.5 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {lang === 'kz' ? 'Енгізу мерзімі:' : lang === 'en' ? 'Effective Date:' : 'Срок введения:'}{' '}
                      <strong className="text-[#111827]">{item.date}</strong>
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                    {item.description}
                  </p>

                  {/* Key Features List - Strict & Clean without nested gray boxes */}
                  <ul className="space-y-2 pt-3 border-t border-gray-100">
                    {item.details.map((detail, idx) => (
                      <li key={idx} className="text-xs text-[#334155] flex items-start gap-2 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-[#0082FB] shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom Action Bar */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(getLocalizedPath(item.link));
                    }}
                    className="inline-flex items-center gap-1.5 bg-[#0082FB] hover:bg-[#0070DA] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all active:scale-95 shadow-sm cursor-pointer"
                  >
                    {lang === 'kz' ? 'Партияны есептеу' : lang === 'en' ? 'Calculate Batch' : 'Рассчитать партию'} <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <span className="text-xs font-bold text-[#64748B] group-hover:text-[#0082FB] flex items-center gap-1 transition-colors">
                    {lang === 'kz' ? 'Ережелер туралы толығырақ' : lang === 'en' ? 'Read Regulations' : 'Регламент ТР ТС'} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
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
