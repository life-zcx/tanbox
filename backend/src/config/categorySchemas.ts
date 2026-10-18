import { OrderCategory } from '@prisma/client';

export interface CategoryFieldDefinition {
  id: string;
  name: string;
  required: boolean;
  type: 'select' | 'text' | 'number';
  options?: string[];
  placeholder?: string;
  hint?: string;
}

export interface CategorySchema {
  category: OrderCategory;
  nameRu: string;
  nameKk: string;
  code: string;
  tnvedExamples: string[];
  fields: CategoryFieldDefinition[];
}

export const CATEGORY_SCHEMAS: Record<OrderCategory, CategorySchema> = {
  SHOES: {
    category: OrderCategory.SHOES,
    nameRu: 'Обувные товары',
    nameKk: 'Аяқ киім тауарлары',
    code: 'shoes',
    tnvedExamples: ['6401', '6402', '6403', '6404', '6405'],
    fields: [
      {
        id: 'shoeType',
        name: 'Вид обуви',
        required: true,
        type: 'select',
        options: ['Туфли', 'Кроссовки', 'Ботинки', 'Полуботинки', 'Сапоги', 'Полусапоги', 'Сандалии', 'Босоножки', 'Мокасины', 'Слипоны', 'Сабо', 'Домашняя обувь'],
      },
      {
        id: 'targetGender',
        name: 'Целевой пол / Возраст',
        required: true,
        type: 'select',
        options: ['Мужской', 'Женский', 'Детский (мальчики)', 'Детский (девочки)', 'Унисекс'],
      },
      {
        id: 'upperMaterial',
        name: 'Материал верха',
        required: true,
        type: 'select',
        options: ['Натуральная кожа', 'Искусственная кожа', 'Композиционная кожа', 'Текстильные материалы', 'Резина', 'Полимерные материалы', 'Комбинированные материалы'],
      },
      {
        id: 'liningMaterial',
        name: 'Материал подкладки',
        required: true,
        type: 'select',
        options: ['Натуральная кожа', 'Искусственная кожа', 'Натуральный мех', 'Искусственный мех', 'Текстильные материалы', 'Шерсть', 'Без подкладки'],
      },
      {
        id: 'soleMaterial',
        name: 'Материал подошвы',
        required: true,
        type: 'select',
        options: ['Резина', 'Термоэластопласт (ТЭП)', 'Полиуретан (ПУ)', 'ЭВА (EVA)', 'Натуральная кожа', 'Тунит (кожволон)', 'ПВХ'],
      },
      {
        id: 'season',
        name: 'Сезон',
        required: false,
        type: 'select',
        options: ['Всесезонный', 'Лето', 'Зима', 'Демисезон (весна/осень)'],
      },
    ],
  },
  TEXTILE: {
    category: OrderCategory.TEXTILE,
    nameRu: 'Товары легпрома и текстиль',
    nameKk: 'Жеңіл өнеркәсіп және тоқыма тауарлары',
    code: 'clothes',
    tnvedExamples: ['6101', '6102', '6103', '6104', '6105', '6201', '6202', '6302'],
    fields: [
      {
        id: 'clothingType',
        name: 'Вид изделия',
        required: true,
        type: 'select',
        options: ['Куртки / Пальто / Ветровки', 'Брюки / Джинсы', 'Рубашки / Блузки', 'Платья / Юбки', 'Футболки / Поло', 'Свитера / Джемперы / Толстовки', 'Костюмы', 'Постельное белье', 'Полотенца'],
      },
      {
        id: 'targetGender',
        name: 'Целевой пол / Возраст',
        required: true,
        type: 'select',
        options: ['Мужской', 'Женский', 'Детский', 'Унисекс'],
      },
      {
        id: 'composition',
        name: 'Состав сырья / Материал (%)',
        required: true,
        type: 'text',
        placeholder: 'Например: 100% Хлопок или 70% Хлопок, 30% Полиэстер',
      },
      {
        id: 'model',
        name: 'Модель изделия',
        required: false,
        type: 'text',
      },
    ],
  },
  WATER: {
    category: OrderCategory.WATER,
    nameRu: 'Упакованная вода и напитки',
    nameKk: 'Қапталған су және сусындар',
    code: 'water',
    tnvedExamples: ['2201', '2202'],
    fields: [
      {
        id: 'waterType',
        name: 'Тип воды / напитка',
        required: true,
        type: 'select',
        options: ['Природная минеральная питьевая', 'Питьевая артезианская', 'Очищенная питьевая', 'Родниковая', 'Искусственно минерализованная', 'Безалкогольный напиток / Лимонад'],
      },
      {
        id: 'carbonation',
        name: 'Газация',
        required: true,
        type: 'select',
        options: ['Негазированная', 'Газированная', 'Слабогазированная'],
      },
      {
        id: 'volume',
        name: 'Объем тары',
        required: true,
        type: 'select',
        options: ['0.33 л', '0.5 л', '0.75 л', '1.0 л', '1.5 л', '2.0 л', '5.0 л', '18.9 л'],
      },
      {
        id: 'packagingMaterial',
        name: 'Материал тары',
        required: true,
        type: 'select',
        options: ['ПЭТ (пластик)', 'Стекло', 'Алюминиевая банка', 'Тетра-Пак'],
      },
    ],
  },
  MEDICINE: {
    category: OrderCategory.MEDICINE,
    nameRu: 'Лекарственные средства',
    nameKk: 'Дәрілік заттар',
    code: 'pharma',
    tnvedExamples: ['3004'],
    fields: [
      {
        id: 'inn',
        name: 'Международное непатентованное наименование (МНН)',
        required: true,
        type: 'text',
      },
      {
        id: 'dosageForm',
        name: 'Лекарственная форма',
        required: true,
        type: 'select',
        options: ['Таблетки', 'Капсулы', 'Раствор для инъекций', 'Мазь / Крем', 'Капли', 'Сироп', 'Суспензия', 'Спрей'],
      },
      {
        id: 'dosage',
        name: 'Дозировка',
        required: true,
        type: 'text',
        placeholder: 'Например: 500 мг, 10 мг/мл',
      },
      {
        id: 'registrationNumber',
        name: 'Номер регистрационного удостоверения в РК (РК-ЛС)',
        required: true,
        type: 'text',
        placeholder: 'РК-ЛС-...',
      },
    ],
  },
  TOBACCO: {
    category: OrderCategory.TOBACCO,
    nameRu: 'Табачная продукция',
    nameKk: 'Темекі өнімдері',
    code: 'tobacco',
    tnvedExamples: ['2402'],
    fields: [
      {
        id: 'tobaccoType',
        name: 'Вид продукции',
        required: true,
        type: 'select',
        options: ['Сигареты с фильтром', 'Стики для нагревания табака', 'Сигариллы', 'Сигары', 'Кальянный табак'],
      },
      {
        id: 'quantityInPack',
        name: 'Количество штук в пачке',
        required: true,
        type: 'number',
        placeholder: '20',
      },
      {
        id: 'mrc',
        name: 'МРЦ (Максимальная розничная цена, тенге)',
        required: false,
        type: 'number',
      },
    ],
  },
  BEER: {
    category: OrderCategory.BEER,
    nameRu: 'Пиво и пивные напитки',
    nameKk: 'Сыра және сыра сусындары',
    code: 'beer',
    tnvedExamples: ['2203'],
    fields: [
      {
        id: 'alcoholByVolume',
        name: 'Крепость (% об.)',
        required: true,
        type: 'text',
        placeholder: 'Например: 4.8%',
      },
      {
        id: 'volume',
        name: 'Объем тары',
        required: true,
        type: 'select',
        options: ['0.33 л', '0.45 л', '0.5 л', '1.0 л', '1.5 л', 'Кега 30 л', 'Кега 50 л'],
      },
      {
        id: 'packagingMaterial',
        name: 'Тип упаковки',
        required: true,
        type: 'select',
        options: ['Стеклянная бутылка', 'Алюминиевая банка', 'ПЭТ бутылка', 'Металлическая кега'],
      },
    ],
  },
  DIETARY_SUPPLEMENTS: {
    category: OrderCategory.DIETARY_SUPPLEMENTS,
    nameRu: 'Биологически активные добавки (БАД)',
    nameKk: 'Биологиялық белсенді қоспалар (ББҚ)',
    code: 'dietary_supplements',
    tnvedExamples: ['2106'],
    fields: [
      {
        id: 'form',
        name: 'Форма выпуска',
        required: true,
        type: 'select',
        options: ['Капсулы', 'Таблетки', 'Порошок / Саше', 'Капли / Жидкость', 'Пастилки'],
      },
      {
        id: 'sgrNumber',
        name: 'Номер свидетельства о госрегистрации (СГР)',
        required: true,
        type: 'text',
        placeholder: 'KZ...',
      },
    ],
  },
  OILS: {
    category: OrderCategory.OILS,
    nameRu: 'Моторные масла и спецжидкости',
    nameKk: 'Мотор майлары',
    code: 'autofluids',
    tnvedExamples: ['2710'],
    fields: [
      {
        id: 'sae',
        name: 'Вязкость по SAE',
        required: true,
        type: 'select',
        options: ['0W-20', '0W-30', '5W-30', '5W-40', '10W-40', '15W-40', '75W-90', '80W-90', 'ATF / Трансмиссионное', 'Другое'],
      },
      {
        id: 'volume',
        name: 'Объем тары',
        required: true,
        type: 'select',
        options: ['1 л', '4 л', '5 л', '20 л', '60 л', '208 л (бочка)'],
      },
    ],
  },
  JEWELRY: {
    category: OrderCategory.JEWELRY,
    nameRu: 'Ювелирные изделия',
    nameKk: 'Зергерлік бұйымдар',
    code: 'jewelry',
    tnvedExamples: ['7113'],
    fields: [
      {
        id: 'metal',
        name: 'Металл и проба',
        required: true,
        type: 'select',
        options: ['Золото 585', 'Золото 750', 'Серебро 925', 'Платина 950', 'Комбинированный'],
      },
      {
        id: 'weightGrams',
        name: 'Масса изделия (грамм)',
        required: true,
        type: 'number',
      },
    ],
  },
  SAIGA: {
    category: OrderCategory.SAIGA,
    nameRu: 'Дериваты сайгака',
    nameKk: 'Ақбөкен дериваттары',
    code: 'saiga',
    tnvedExamples: ['0507'],
    fields: [
      {
        id: 'derivativeType',
        name: 'Вид деривата',
        required: true,
        type: 'text',
      },
    ],
  },
  OTHER: {
    category: OrderCategory.OTHER,
    nameRu: 'Прочие товары',
    nameKk: 'Басқа тауарлар',
    code: 'other',
    tnvedExamples: [],
    fields: [
      {
        id: 'description',
        name: 'Дополнительное описание',
        required: false,
        type: 'text',
      },
    ],
  },
};
