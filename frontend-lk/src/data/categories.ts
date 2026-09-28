import { OrderCategory } from '../types';
import {
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
  LucideIcon,
} from 'lucide-react';

export interface CategoryInfo {
  type: OrderCategory;
  name: string;
  shortName: string;
  tnved: string;
  statusText: string;
  statusBadge: 'ACTIVE' | 'UPCOMING';
  description: string;
  icon: LucideIcon;
}

export const CATEGORIES_LIST: CategoryInfo[] = [
  {
    type: 'SHOES',
    name: 'Обувная продукция',
    shortName: 'Обувь',
    tnved: 'ТН ВЭД 6401–6405',
    statusText: 'Обязательная с 2021 г.',
    statusBadge: 'ACTIVE',
    description: 'Все виды обуви: мужская, женская, детская, кожа, текстиль, спецобувь',
    icon: Footprints,
  },
  {
    type: 'TEXTILE',
    name: 'Текстиль и одежда',
    shortName: 'Текстиль',
    tnved: 'ТН ВЭД 4203, 6101–6217, 6302',
    statusText: 'Внедрение 2026–2027 гг.',
    statusBadge: 'UPCOMING',
    description: 'Одежда, трикотаж, пальто, костюмы, белье постельное и столовое',
    icon: Shirt,
  },
  {
    type: 'WATER',
    name: 'Упакованная вода и напитки',
    shortName: 'Вода и напитки',
    tnved: 'ТН ВЭД 2201, 2202',
    statusText: 'Обязательная с 2024 г.',
    statusBadge: 'ACTIVE',
    description: 'Минеральная, питьевая вода, сокосодержащие напитки, соки в ПЭТ и стекле',
    icon: Droplets,
  },
  {
    type: 'MEDICINE',
    name: 'Лекарственные средства',
    shortName: 'Фарма / Препараты',
    tnved: 'ТН ВЭД 3004',
    statusText: 'Обязательная с 2024 г.',
    statusBadge: 'ACTIVE',
    description: 'Препараты в дозированных формах, вторичная и первичная упаковка',
    icon: Pill,
  },
  {
    type: 'TOBACCO',
    name: 'Табачные изделия и вейпы',
    shortName: 'Табачные изделия',
    tnved: 'ТН ВЭД 2402, 2403, 2404',
    statusText: 'Обязательная с 2020 г.',
    statusBadge: 'ACTIVE',
    description: 'Сигареты, нагреваемый табак (стики), вейпы, жидкости для эл. сигарет',
    icon: Cigarette,
  },
  {
    type: 'BEER',
    name: 'Пиво и пивоваренная продукция',
    shortName: 'Пиво и напитки',
    tnved: 'ТН ВЭД 2203 00, 2202 91',
    statusText: 'Внедрение 2026–2027 гг.',
    statusBadge: 'UPCOMING',
    description: 'Продукция в кегах, стеклянных и ПЭТ-бутылках, алюминиевых банках',
    icon: Beer,
  },
  {
    type: 'OILS',
    name: 'Моторные масла и автохимия',
    shortName: 'Масла и автохимия',
    tnved: 'ТН ВЭД 2710, 3402, 3819',
    statusText: 'Внедрение с 2026 г.',
    statusBadge: 'UPCOMING',
    description: 'Моторные, трансмиссионные масла, смазки, гидравлические жидкости',
    icon: Car,
  },
  {
    type: 'DIETARY_SUPPLEMENTS',
    name: 'Биодобавки (БАД)',
    shortName: 'БАД',
    tnved: 'ТН ВЭД 2106 90',
    statusText: 'Внедрение с 2026 г.',
    statusBadge: 'UPCOMING',
    description: 'Пищевые добавки со свидетельством государственной регистрации (СГР)',
    icon: HeartPulse,
  },
  {
    type: 'JEWELRY',
    name: 'Ювелирные изделия',
    shortName: 'Ювелирные изделия',
    tnved: 'ТН ВЭД 7113, 7114',
    statusText: 'Внедрение с 2026 г.',
    statusBadge: 'UPCOMING',
    description: 'Изделия из драгоценных металлов и камней, микро-маркировка на пломбах',
    icon: Gem,
  },
  {
    type: 'SAIGA',
    name: 'Дериваты сайгака (рога)',
    shortName: 'Дериваты сайгака',
    tnved: 'ТН ВЭД 0507 90',
    statusText: 'Обязательная с 2025 г.',
    statusBadge: 'ACTIVE',
    description: 'Поштучный государственный учет и опломбирование бирками DataMatrix',
    icon: Award,
  },
  {
    type: 'OTHER',
    name: 'Иные товары / Прочее',
    shortName: 'Прочие товары',
    tnved: 'По согласованию',
    statusText: 'Индивидуально',
    statusBadge: 'ACTIVE',
    description: 'Прочие категории продукции, индивидуальные проекты и пилоты ИС Танба',
    icon: PackagePlus,
  },
];

export const CATEGORY_MAP: Record<OrderCategory, CategoryInfo> = CATEGORIES_LIST.reduce(
  (acc, item) => {
    acc[item.type] = item;
    return acc;
  },
  {} as Record<OrderCategory, CategoryInfo>
);

export const getCategoryLabel = (cat: OrderCategory): string => {
  return CATEGORY_MAP[cat]?.name || cat;
};
