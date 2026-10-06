import {
  LucideIcon,
  Footprints,
  Shirt,
  Droplets,
  Pill,
  Cigarette,
  Beer,
  Car,
  HeartPulse,
  Gem,
  Award,
  PackagePlus,
  Building2,
  ThermometerSnowflake,
  Sun,
  Truck,
} from 'lucide-react';

export interface CategoryPreset {
  id: string;
  name: string;
  shortName: string;
  icon: LucideIcon;
  description: string;
  defaultSpeed: number; // units/hour per worker
  defaultUnitsPerBox: number;
  defaultBoxesPerPallet: number;
  badge: string;
}

export const CATEGORY_PRESETS: CategoryPreset[] = [
  {
    id: 'SHOES',
    name: 'Обувная продукция',
    shortName: 'Обувь',
    icon: Footprints,
    description: 'Вскрыть коробку, наклеить стикер на обувь и коробку, закрыть, уложить в мастер-бокс',
    defaultSpeed: 200,
    defaultUnitsPerBox: 12,
    defaultBoxesPerPallet: 40,
    badge: 'Двойная оклейка',
  },
  {
    id: 'TEXTILE',
    name: 'Текстиль и одежда',
    shortName: 'Текстиль',
    icon: Shirt,
    description: 'Индивидуальный полиэтиленовый пакет / зип-пакет / навесной ярлык на одежду',
    defaultSpeed: 320,
    defaultUnitsPerBox: 35,
    defaultBoxesPerPallet: 36,
    badge: 'Пакеты / ярлыки',
  },
  {
    id: 'WATER',
    name: 'Упакованная вода и напитки',
    shortName: 'Вода / Соки',
    icon: Droplets,
    description: 'Бутылки в термоусадочных спайках / блоках, быстрый доступ к крышке или этикетке',
    defaultSpeed: 450,
    defaultUnitsPerBox: 18,
    defaultBoxesPerPallet: 48,
    badge: 'Термоспайки',
  },
  {
    id: 'MEDICINE',
    name: 'Лекарственные средства',
    shortName: 'Фарма',
    icon: Pill,
    description: 'Вторичная картонная пачка / флаконы. Повышенный контроль сохранности и читаемости кодов',
    defaultSpeed: 350,
    defaultUnitsPerBox: 60,
    defaultBoxesPerPallet: 50,
    badge: 'Строгий контроль',
  },
  {
    id: 'TOBACCO',
    name: 'Табачные изделия и вейпы',
    shortName: 'Табак / Стики',
    icon: Cigarette,
    description: 'Блоки сигарет, стиков и вейпов. Плотная промышленная укладка, высокая скорость потока',
    defaultSpeed: 500,
    defaultUnitsPerBox: 50,
    defaultBoxesPerPallet: 60,
    badge: 'Высокая скорость',
  },
  {
    id: 'BEER',
    name: 'Пиво и слабоалкогольные напитки',
    shortName: 'Пиво',
    icon: Beer,
    description: 'Алюминиевые банки, стеклянные бутылки в термопленке, кеги',
    defaultSpeed: 400,
    defaultUnitsPerBox: 20,
    defaultBoxesPerPallet: 45,
    badge: 'Банки / Стекло',
  },
  {
    id: 'OILS',
    name: 'Моторные масла и автохимия',
    shortName: 'Масла / Автохимия',
    icon: Car,
    description: 'Тяжёлые канистры 1л, 4л, 5л, бочки. Требуется усиленный армированный скотч',
    defaultSpeed: 260,
    defaultUnitsPerBox: 5,
    defaultBoxesPerPallet: 36,
    badge: 'Тяжёлая тара',
  },
  {
    id: 'DIETARY_SUPPLEMENTS',
    name: 'Биодобавки (БАД)',
    shortName: 'БАДы',
    icon: HeartPulse,
    description: 'Пластиковые баночки, блистерные коробки, мелкая фасовка',
    defaultSpeed: 350,
    defaultUnitsPerBox: 30,
    defaultBoxesPerPallet: 50,
    badge: 'Баночки / Блистеры',
  },
  {
    id: 'JEWELRY',
    name: 'Ювелирные изделия',
    shortName: 'Ювелирка',
    icon: Gem,
    description: 'Микро-маркировка, пломбирование нитью, ювелирная точность и поштучная проверка',
    defaultSpeed: 150,
    defaultUnitsPerBox: 100,
    defaultBoxesPerPallet: 80,
    badge: 'Пломбы / Ювелирная',
  },
  {
    id: 'SAIGA',
    name: 'Дериваты сайгака (рога)',
    shortName: 'Дериваты',
    icon: Award,
    description: 'Государственные бирки с пломбами, индивидуальное взвешивание и фиксация в журнале',
    defaultSpeed: 90,
    defaultUnitsPerBox: 15,
    defaultBoxesPerPallet: 20,
    badge: 'Спецучёт / Опломбирование',
  },
  {
    id: 'OTHER',
    name: 'Прочие товары / Индивидуально',
    shortName: 'Индивидуально',
    icon: PackagePlus,
    description: 'Произвольная категория, ручная настройка скорости и параметров упаковки',
    defaultSpeed: 250,
    defaultUnitsPerBox: 20,
    defaultBoxesPerPallet: 40,
    badge: 'Пользовательская',
  },
];

export type WarehouseCondition = 'WARM_HEATED' | 'COLD_WINTER' | 'HOT_SUMMER' | 'RAMP_UNPAVED';

export interface ConditionConfig {
  id: WarehouseCondition;
  title: string;
  icon: LucideIcon;
  badge: string;
  speedMultiplier: number; // e.g. 0.75 for cold winter (-25% speed)
  tapeStretchMultiplier: number; // e.g. 1.15 (+15% tape usage)
  dailyExtraCostPerWorker: number; // extra cost (warm tea/clothing/hazard pay or water)
  description: string;
}

export const WAREHOUSE_CONDITIONS: ConditionConfig[] = [
  {
    id: 'WARM_HEATED',
    title: 'Тёплый склад (Класс А/В)',
    icon: Building2,
    badge: 'Стандарт (100%)',
    speedMultiplier: 1.0,
    tapeStretchMultiplier: 1.0,
    dailyExtraCostPerWorker: 0,
    description: 'Отапливаемый чистый склад (+18...+22°C), ровный пол, освещение, стандартная скорость.',
  },
  {
    id: 'COLD_WINTER',
    title: 'Холодный склад / Зима',
    icon: ThermometerSnowflake,
    badge: '-25% скорости',
    speedMultiplier: 0.75,
    tapeStretchMultiplier: 1.2,
    dailyExtraCostPerWorker: 2500, // доплата за мороз + горячий чай
    description: 'Неотапливаемый ангар (-5...-25°C). Бригада в перчатках/куртках, скотч дубеет, перерывы на обогрев.',
  },
  {
    id: 'HOT_SUMMER',
    title: 'Жаркий склад / Лето',
    icon: Sun,
    badge: '-10% скорости',
    speedMultiplier: 0.9,
    tapeStretchMultiplier: 1.05,
    dailyExtraCostPerWorker: 1200, // питьевой режим, вода
    description: 'Жара (+32...+40°C), духота под крышей ангара, питьевой режим бригады, замедление во 2-й половине дня.',
  },
  {
    id: 'RAMP_UNPAVED',
    title: 'Таможенный СВХ / Пандус',
    icon: Truck,
    badge: '-15% скорости',
    speedMultiplier: 0.85,
    tapeStretchMultiplier: 1.15,
    dailyExtraCostPerWorker: 1500,
    description: 'Склад временного хранения, досмотры, пыль, задержки с автопогрузчиком, пропускной режим.',
  },
];

export type RiskBufferLevel = 'NONE' | 'LOW_5' | 'STANDARD_10' | 'HIGH_20';
