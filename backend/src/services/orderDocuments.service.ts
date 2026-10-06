import { renderHtmlToPdf } from './pdfRenderer.service';

export function escapeHtml(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const numberToWordsTenge = (num: number): string => {
  if (num === 0) return 'ноль теңге 00 тиын';

  const ones = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
  const onesFemale = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
  const teens = [
    'десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать',
    'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'
  ];
  const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
  const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];

  const convertGroup = (n: number, isFemale = false): string => {
    let result = '';
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const o = n % 10;

    if (h > 0) result += hundreds[h] + ' ';
    if (t === 1) {
      result += teens[o] + ' ';
    } else {
      if (t > 1) result += tens[t] + ' ';
      if (o > 0) result += (isFemale ? onesFemale[o] : ones[o]) + ' ';
    }
    return result.trim();
  };

  const integerPart = Math.floor(Math.abs(num));
  const millions = Math.floor(integerPart / 1_000_000) % 1000;
  const thousands = Math.floor(integerPart / 1000) % 1000;
  const units = integerPart % 1000;

  let words = '';

  if (millions > 0) {
    words += convertGroup(millions) + ' ';
    const last = millions % 10;
    const last2 = millions % 100;
    if (last2 >= 11 && last2 <= 19) words += 'миллионов ';
    else if (last === 1) words += 'миллион ';
    else if (last >= 2 && last <= 4) words += 'миллиона ';
    else words += 'миллионов ';
  }

  if (thousands > 0) {
    words += convertGroup(thousands, true) + ' ';
    const last = thousands % 10;
    const last2 = thousands % 100;
    if (last2 >= 11 && last2 <= 19) words += 'тысяч ';
    else if (last === 1) words += 'тысяча ';
    else if (last >= 2 && last <= 4) words += 'тысячи ';
    else words += 'тысяч ';
  }

  if (units > 0) {
    words += convertGroup(units) + ' ';
  }

  const trimmed = words.trim();
  if (!trimmed) return 'ноль теңге 00 тиын';
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return `${capitalized} теңге 00 тиын`;
};

export function parseStickeringEstimateFromNotes(notes?: string | null) {
  if (!notes) return null;
  const match = notes.match(/=== УТВЕРЖДЕННАЯ СМЕТА ВЫЕЗДНОЙ ОКЛЕЙКИ ===([\s\S]*?)(?:={20,}|$)/i);
  if (!match) return null;

  const content = match[1];
  const dateMatch = content.match(/Дата расчета:\s*([^\n\r]+)/i);
  const workersMatch = content.match(/Бригада:\s*(\d+)\s*чел/i);
  const daysMatch = content.match(/Срок выполнения:\s*([\d.]+)\s*раб/i);
  const priceMatch = content.match(/Тариф оклейки:\s*([\d.]+)/i);
  const totalMatch = content.match(/Итоговая стоимость:\s*([^\n\r]+)/i);
  const condMatch = content.match(/Условия склада:\s*([^\n\r]+)/i);

  return {
    date: dateMatch ? dateMatch[1].trim() : '',
    workersCount: workersMatch ? parseInt(workersMatch[1], 10) : 1,
    daysNeeded: daysMatch ? parseFloat(daysMatch[1]) : 1,
    pricePerUnit: priceMatch ? parseFloat(priceMatch[1]) : 0,
    totalPrice: totalMatch ? parseFloat(totalMatch[1].replace(/[^\d.]/g, '')) : 0,
    warehouseCondition: condMatch ? condMatch[1].trim() : '',
  };
}

const catMap: Record<string, string> = {
  SHOES: 'Обувные товары',
  TEXTILE: 'Товары легкой промышленности (текстиль)',
  MEDICINE: 'Лекарственные препараты',
  WATER: 'Упакованная вода и напитки',
  TOBACCO: 'Табачные изделия',
  BEER: 'Пиво и пивные напитки',
  OILS: 'Моторные масла',
  DIETARY_SUPPLEMENTS: 'Биологически активные добавки (БАД)',
  JEWELRY: 'Ювелирные изделия',
  SAIGA: 'Дериваты рогов сайгака',
  OTHER: 'Потребительские товары',
};

const formatMoney = (n: number) => {
  const parts = n.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${parts[0]},${parts[1]}`;
};

const formatQty = (n: number) => {
  const parts = n.toFixed(3).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${parts[0]},${parts[1]}`;
};

const monthsGenitive = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];

export function generateOrderActHtml(existing: any): string {
  const createdDateObj = new Date(existing.createdAt);
  const orderDateFull = `${createdDateObj.getDate()} ${monthsGenitive[createdDateObj.getMonth()]} ${createdDateObj.getFullYear()}`;
  const nowDateObj = new Date();
  const actDateFull = `${nowDateObj.getDate()} ${monthsGenitive[nowDateObj.getMonth()]} ${nowDateObj.getFullYear()}`;
  const actNumber = existing.orderNumber.replace(/^[^\d]*-?/, '') || existing.orderNumber;

  const categoryName = catMap[existing.category] || existing.category;
  const stickeringEst = existing.stickeringEstimate || parseStickeringEstimateFromNotes(existing.notes);
  const isOnSite = existing.tariffType === 'STANDARD' || existing.tariffType === 'PRO' || existing.extraServices?.includes('ON_SITE_STICKERING') || Boolean(stickeringEst);

  let baseServiceName = `Услуги по цифровой маркировке и подготовке партии кодов Data Matrix (ИС Танба РК) [Категория: ${categoryName}, Тариф: ${existing.tariffType}]`;
  if (stickeringEst) {
    baseServiceName = `Услуги по выездной оклейке и маркировке партии товаров на складе Заказчика под ключ [Категория: ${categoryName}, бригада: ${stickeringEst.workersCount || 1} чел., срок: ${stickeringEst.daysNeeded || 1} дн., расходные материалы включены]`;
  } else if (isOnSite) {
    baseServiceName = `Услуги по выездной оклейке и маркировке партии товаров на складе Заказчика под ключ [Категория: ${categoryName}, Тариф: ${existing.tariffType}]`;
  }

  interface ActLineItem {
    name: string;
    unit: string;
    qty: number;
    price: number;
    sum: number;
  }

  const lines: ActLineItem[] = [];

  const hasSeparateSscc = Boolean(existing.ssccNeeded && existing.tariffType !== 'PRO');
  const ssccPricePerItem = 5;
  const baseUnitPrice = hasSeparateSscc
    ? Math.max(0, existing.pricePerItem - ssccPricePerItem)
    : existing.pricePerItem;
  const baseSum = existing.itemsCount * baseUnitPrice;

  lines.push({
    name: baseServiceName,
    unit: 'шт.',
    qty: existing.itemsCount,
    price: baseUnitPrice,
    sum: baseSum,
  });

  if (existing.extraServices?.includes('STICKER_LAYOUT_DESIGN')) {
    lines.push({
      name: 'Разработка индивидуального дизайна макета термоэтикетки по ТЗ Заказчика (в соответствии с требованиями СТ РК / ГОСТ)',
      unit: 'усл.',
      qty: 1,
      price: 5000,
      sum: 5000,
    });
  }

  if (existing.ssccNeeded) {
    const isPro = existing.tariffType === 'PRO';
    const ssccPrice = isPro ? 0 : ssccPricePerItem;
    const ssccSum = isPro ? 0 : existing.itemsCount * ssccPrice;
    lines.push({
      name: 'Услуги агрегации в групповые короба и паллеты (формирование кодов транспортной тары SSCC)',
      unit: 'шт.',
      qty: existing.itemsCount,
      price: ssccPrice,
      sum: ssccSum,
    });
  }

  if (existing.extraServices?.includes('URGENT_PROCESSING')) {
    const productionBatch = existing.itemsCount * existing.pricePerItem;
    const urgentSum = Math.round(productionBatch * 0.2);
    lines.push({
      name: 'Срочное приоритетное исполнение заказа (обработка и выпуск партии в течение 24 часов) (+20%)',
      unit: 'усл.',
      qty: 1,
      price: urgentSum,
      sum: urgentSum,
    });
  }

  if (existing.extraServices?.includes('EXPRESS_DELIVERY')) {
    lines.push({
      name: 'Курьерская доставка партии готовых стикеров на склад Заказчика по РК',
      unit: 'усл.',
      qty: 1,
      price: 15000,
      sum: 15000,
    });
  }

  const calculatedSum = lines.reduce((acc, it) => acc + it.sum, 0);
  const finalTotal = existing.totalPrice || calculatedSum;
  if (lines.length > 0 && calculatedSum !== finalTotal) {
    const otherSums = lines.slice(1).reduce((acc, it) => acc + it.sum, 0);
    lines[0].sum = Math.max(0, finalTotal - otherSums);
    lines[0].price = lines[0].qty > 0 ? Math.round((lines[0].sum / lines[0].qty) * 100) / 100 : lines[0].price;
  }
  const amountInWords = numberToWordsTenge(finalTotal);

  let customerAddress = existing.warehouseAddress || 'Республика Казахстан';
  if (!existing.warehouseAddress && existing.notes) {
    const addrMatch = existing.notes.match(/Адрес склада(?: в РК)?:?\s*([^\n;]+)/i);
    if (addrMatch && addrMatch[1]?.trim()) {
      customerAddress = addrMatch[1].trim();
    }
  }

  const totalQty = lines.reduce((acc, it) => acc + it.qty, 0);
  const orderDateShort = new Date(existing.createdAt).toLocaleDateString('ru-RU');
  const actDateShort = new Date().toLocaleDateString('ru-RU');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Акт выполненных работ № ${escapeHtml(actNumber)} (Форма Р-1)</title>
<style>
  @page {
    size: A4 landscape;
    margin: 8mm 12mm 8mm 12mm;
  }
  body {
    font-family: Arial, "Times New Roman", serif;
    margin: 8px 15px;
    color: #000;
    font-size: 8.5pt;
    line-height: 1.25;
    background-color: #fff;
  }
  .app-header {
    text-align: right;
    font-size: 7.5pt;
    line-height: 1.2;
    margin-bottom: 8px;
    color: #000;
    font-style: italic;
  }
  .app-header strong {
    font-style: normal;
  }
  .meta-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 4px;
    font-size: 8pt;
  }
  .meta-table td {
    vertical-align: top;
    padding: 1px 0;
  }
  .underline-val {
    border-bottom: 1px solid #000;
    font-weight: bold;
    padding-bottom: 1px;
    line-height: 1.2;
  }
  .sub-note {
    font-size: 6.5pt;
    text-align: center;
    color: #444;
    font-style: italic;
    line-height: 1.1;
  }
  .bin-box {
    border: 1px solid #000;
    padding: 2px 6px;
    font-weight: bold;
    font-size: 8.5pt;
    text-align: center;
    letter-spacing: 0.5px;
  }
  .title-block {
    text-align: center;
    font-weight: bold;
    font-size: 10pt;
    margin: 8px 0 6px 0;
    letter-spacing: 0.3px;
  }
  .items-table {
    width: 100%;
    border-collapse: collapse;
    border: 2px solid #000;
    margin-bottom: 4px;
    font-size: 7.5pt;
  }
  .items-table th, .items-table td {
    border: 1px solid #000;
    padding: 3px 4px;
  }
  .items-table th {
    background-color: #fff;
    font-weight: bold;
    text-align: center;
    line-height: 1.15;
  }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .text-left { text-align: left; }
  .font-bold { font-weight: bold; }
  .notes-block {
    font-size: 8pt;
    margin-top: 6px;
    line-height: 1.3;
  }
  .signatures-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
    font-size: 8pt;
  }
  .mp-box {
    width: 36px;
    height: 22px;
    border: 1px solid #000;
    text-align: center;
    line-height: 22px;
    font-weight: bold;
    font-size: 7.5pt;
    margin-top: 6px;
  }
</style>
</head>
<body>

<div class="app-header">
  Приложение 50<br>
  к приказу Министра финансов<br>
  Республики Казахстан<br>
  от 20 декабря 2012 года № 562<br><br>
  <strong>Форма Р-1</strong>
</div>

<table class="meta-table">
  <tr>
    <td style="width: 85px; padding-top: 2px;">Заказчик</td>
    <td style="padding-right: 20px;">
      <div class="underline-val">
        ${escapeHtml(existing.user?.companyName) || 'Заказчик'}, ${escapeHtml(customerAddress)}${existing.user?.phone ? `, тел.: ${escapeHtml(existing.user.phone)}` : ''}
      </div>
      <div class="sub-note">полное наименование, адрес, данные о средствах связи</div>
    </td>
    <td style="width: 140px; text-align: center; vertical-align: top;">
      <div style="font-size: 7pt; margin-bottom: 1px;">ИИН/БИН</div>
      <div class="bin-box">
        ${escapeHtml(existing.user?.binIin) || '&nbsp;'}
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding-top: 4px;">Исполнитель</td>
    <td style="padding-right: 20px; padding-top: 4px;">
      <div class="underline-val">
        Индивидуальный предприниматель "TORMAG.KZ", Республика Казахстан, г. Алматы, тел.: +7 (707) 711-16-53
      </div>
      <div class="sub-note">полное наименование, адрес, данные о средствах связи</div>
    </td>
    <td style="vertical-align: bottom; padding-bottom: 10px; text-align: center;">
      <div class="bin-box">
        990601301525
      </div>
    </td>
  </tr>
</table>

<table style="width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 8pt;">
  <tr>
    <td style="width: 115px; vertical-align: middle;">Договор (контракт)</td>
    <td style="vertical-align: middle; padding-right: 20px;">
      <span style="font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 1px; display: inline-block;">
        Публичный договор-оферта № ${escapeHtml(existing.orderNumber)} от ${escapeHtml(orderDateFull)} г.
      </span>
    </td>
    <td style="width: 160px; vertical-align: middle;">
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; text-align: center; font-size: 7pt;">
        <tr>
          <td style="border: 1px solid #000; padding: 2px 6px;">Номер документа</td>
          <td style="border: 1px solid #000; padding: 2px 6px;">Дата составления</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 3px 6px; font-weight: bold; font-size: 8pt;">${escapeHtml(actNumber)}</td>
          <td style="border: 1px solid #000; padding: 3px 6px; font-weight: bold; font-size: 8pt;">${escapeHtml(actDateShort)}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<div class="title-block">
  АКТ ВЫПОЛНЕННЫХ РАБОТ (ОКАЗАННЫХ УСЛУГ)
</div>

<table class="items-table">
  <thead>
    <tr>
      <th style="width: 25px;">№<br>п/п</th>
      <th>Наименование работ (услуг)<br><span style="font-weight: normal; font-size: 6.5pt;">(в разрезе их подвидов в соответствии с технической спецификацией, заданием, графиком выполнения работ (услуг) при их наличии)</span></th>
      <th style="width: 65px;">Дата<br>выполнения<br>работ (услуг)</th>
      <th style="width: 50px;">Единица<br>измерения</th>
      <th style="width: 60px;">Количество</th>
      <th style="width: 70px;">Цена за единицу,<br>тенге</th>
      <th style="width: 85px;">Стоимость,<br>тенге</th>
    </tr>
    <tr style="font-size: 6pt; color: #444; background-color: #fafafa;">
      <th>1</th>
      <th>2</th>
      <th>3</th>
      <th>4</th>
      <th>5</th>
      <th>6</th>
      <th>7</th>
    </tr>
  </thead>
  <tbody>
    ${lines
      .map(
        (it, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td class="text-left">${escapeHtml(it.name)}</td>
      <td class="text-center">${actDateShort}</td>
      <td class="text-center">${escapeHtml(it.unit)}</td>
      <td class="text-right">${formatQty(it.qty)}</td>
      <td class="text-right">${formatMoney(it.price)}</td>
      <td class="text-right font-bold">${formatMoney(it.sum)}</td>
    </tr>`
      )
      .join('')}
    <tr style="font-weight: bold;">
      <td colspan="4" class="text-right" style="padding-right: 8px;">Итого:</td>
      <td class="text-right">${formatQty(totalQty)}</td>
      <td class="text-center">X</td>
      <td class="text-right">${formatMoney(finalTotal)}</td>
    </tr>
  </tbody>
</table>

<div class="notes-block">
  <div style="margin-bottom: 3px;">
    Сведения об использовании запасов, полученных от заказчика: <span style="border-bottom: 1px solid #000; min-width: 430px; display: inline-block; font-weight: bold;">не использовались</span>
    <div style="font-size: 5.5pt; text-align: center; width: 430px; color: #444; font-style: italic;">наименование, количество, стоимость</div>
  </div>
  <div style="margin-bottom: 3px;">
    Приложение: Перечень документации, в том числе отчет(ы) о маркетинговых, научных исследованиях, консультационных и прочих услугах (обязательны при его (их) наличии) на <span style="border-bottom: 1px solid #000; min-width: 35px; display: inline-block; text-align: center; font-weight: bold;">1</span> страниц
  </div>
  <div style="margin-bottom: 8px;">
    Вышеперечисленные услуги выполнены полностью и в срок. Заказчик претензий по объему, качеству и сроку не имеет.
  </div>
</div>

<table class="signatures-table">
  <tr>
    <td style="width: 48%; vertical-align: top;">
      <div style="margin-bottom: 2px; font-weight: bold;">Сдал (Исполнитель)</div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 45%; border-bottom: 1px solid #000; height: 20px;"></td>
          <td style="width: 10%; text-align: center; vertical-align: bottom;">/</td>
          <td style="width: 45%; border-bottom: 1px solid #000; text-align: center; font-weight: bold; vertical-align: bottom; font-size: 7.5pt;">ИП «TORMAG.KZ»</td>
        </tr>
        <tr style="font-size: 5.5pt; color: #555; text-align: center; font-style: italic;">
          <td>подпись</td>
          <td></td>
          <td>расшифровка подписи</td>
        </tr>
      </table>
      <div class="mp-box">МП</div>
    </td>
    <td style="width: 4%;"></td>
    <td style="width: 48%; vertical-align: top;">
      <div style="display: flex; justify-content: flex-end; margin-bottom: 2px;">
        <span style="font-size: 6.5pt; font-weight: bold;">Руководитель / Представитель</span>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 25%; font-weight: bold; vertical-align: bottom;">Принял (Заказчик)</td>
          <td style="width: 28%; border-bottom: 1px solid #000; height: 20px;"></td>
          <td style="width: 6%; text-align: center; vertical-align: bottom;">/</td>
          <td style="width: 41%; border-bottom: 1px solid #000; height: 20px;"></td>
        </tr>
        <tr style="font-size: 5.5pt; color: #555; text-align: center; font-style: italic;">
          <td></td>
          <td>подпись</td>
          <td></td>
          <td>расшифровка подписи</td>
        </tr>
      </table>
      <div class="mp-box">МП</div>
    </td>
  </tr>
</table>

</body>
</html>`;
}

export function generateOrderInvoiceHtml(existing: any): string {
  const categoryName = catMap[existing.category] || existing.category;
  const stickeringEst = existing.stickeringEstimate || parseStickeringEstimateFromNotes(existing.notes);
  const isOnSite = existing.tariffType === 'STANDARD' || existing.tariffType === 'PRO' || existing.extraServices?.includes('ON_SITE_STICKERING') || Boolean(stickeringEst);

  let baseServiceName = `Услуги по цифровой маркировке и подготовке партии кодов Data Matrix (ИС Танба РК) [Категория: ${categoryName}, Тариф: ${existing.tariffType}]`;
  if (stickeringEst) {
    baseServiceName = `Услуги по выездной оклейке и маркировке партии товаров на складе Заказчика под ключ [Категория: ${categoryName}, бригада: ${stickeringEst.workersCount || 1} чел., срок: ${stickeringEst.daysNeeded || 1} дн., расходные материалы включены]`;
  } else if (isOnSite) {
    baseServiceName = `Услуги по выездной оклейке и маркировке партии товаров на складе Заказчика под ключ [Категория: ${categoryName}, Тариф: ${existing.tariffType}]`;
  }

  interface InvoiceLineItem {
    name: string;
    unit: string;
    qty: number;
    price: number;
    sum: number;
  }

  const lines: InvoiceLineItem[] = [];

  const hasSeparateSscc = Boolean(existing.ssccNeeded && existing.tariffType !== 'PRO');
  const ssccPricePerItem = 5;
  const baseUnitPrice = hasSeparateSscc
    ? Math.max(0, existing.pricePerItem - ssccPricePerItem)
    : existing.pricePerItem;
  const baseSum = existing.itemsCount * baseUnitPrice;

  lines.push({
    name: baseServiceName,
    unit: 'шт.',
    qty: existing.itemsCount,
    price: baseUnitPrice,
    sum: baseSum,
  });

  if (existing.extraServices?.includes('STICKER_LAYOUT_DESIGN')) {
    lines.push({
      name: 'Разработка индивидуального дизайна макета термоэтикетки по ТЗ Заказчика (СТ РК / ГОСТ)',
      unit: 'усл.',
      qty: 1,
      price: 5000,
      sum: 5000,
    });
  }

  if (existing.ssccNeeded) {
    const isPro = existing.tariffType === 'PRO';
    const ssccPrice = isPro ? 0 : ssccPricePerItem;
    const ssccSum = isPro ? 0 : existing.itemsCount * ssccPrice;
    lines.push({
      name: 'Услуги агрегации в групповые короба и паллеты (коды SSCC)',
      unit: 'шт.',
      qty: existing.itemsCount,
      price: ssccPrice,
      sum: ssccSum,
    });
  }

  if (existing.extraServices?.includes('URGENT_PROCESSING')) {
    const productionBatch = existing.itemsCount * existing.pricePerItem;
    const urgentSum = Math.round(productionBatch * 0.2);
    lines.push({
      name: 'Срочное приоритетное исполнение партии кодов (24 часа) (+20%)',
      unit: 'усл.',
      qty: 1,
      price: urgentSum,
      sum: urgentSum,
    });
  }

  if (existing.extraServices?.includes('EXPRESS_DELIVERY')) {
    lines.push({
      name: 'Курьерская доставка партии готовых стикеров на склад Заказчика по РК',
      unit: 'усл.',
      qty: 1,
      price: 15000,
      sum: 15000,
    });
  }

  const calculatedSum = lines.reduce((acc, it) => acc + it.sum, 0);
  const finalTotal = existing.totalPrice || calculatedSum;
  if (lines.length > 0 && calculatedSum !== finalTotal) {
    const otherSums = lines.slice(1).reduce((acc, it) => acc + it.sum, 0);
    lines[0].sum = Math.max(0, finalTotal - otherSums);
    lines[0].price = lines[0].qty > 0 ? Math.round((lines[0].sum / lines[0].qty) * 100) / 100 : lines[0].price;
  }
  const amountInWords = numberToWordsTenge(finalTotal);

  let customerAddress = existing.warehouseAddress || 'Республика Казахстан';
  if (!existing.warehouseAddress && existing.notes) {
    const addrMatch = existing.notes.match(/Адрес склада(?: в РК)?:?\s*([^\n;]+)/i);
    if (addrMatch && addrMatch[1]?.trim()) {
      customerAddress = addrMatch[1].trim();
    }
  }

  const createdDateObj = new Date(existing.createdAt);
  const orderDateFull = `${createdDateObj.getDate()} ${monthsGenitive[createdDateObj.getMonth()]} ${createdDateObj.getFullYear()}`;
  const invoiceNumber = existing.orderNumber.replace(/^[^\d]*-?/, '') || existing.orderNumber;

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Счёт на оплату № ${escapeHtml(invoiceNumber)}</title>
<style>
  @page {
    size: A4 portrait;
    margin: 10mm 15mm 10mm 15mm;
  }
  body {
    font-family: Arial, "Times New Roman", sans-serif;
    margin: 10px 15px;
    color: #000;
    font-size: 8.5pt;
    line-height: 1.3;
    background-color: #fff;
  }
  .warning-box {
    border: 1px solid #777;
    font-size: 7.5pt;
    padding: 6px 10px;
    margin-bottom: 12px;
    line-height: 1.25;
  }
  .bank-table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #000;
    margin-bottom: 14px;
    font-size: 8pt;
  }
  .bank-table td {
    border: 1px solid #000;
    padding: 4px 6px;
    vertical-align: top;
  }
  .doc-title {
    font-size: 13pt;
    font-weight: bold;
    border-bottom: 2px solid #000;
    padding-bottom: 6px;
    margin-bottom: 12px;
  }
  .parties-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
    font-size: 8.5pt;
  }
  .parties-table td {
    padding: 2px 0;
    vertical-align: top;
  }
  .items-table {
    width: 100%;
    border-collapse: collapse;
    border: 2px solid #000;
    margin-bottom: 8px;
    font-size: 8pt;
  }
  .items-table th, .items-table td {
    border: 1px solid #000;
    padding: 4px 5px;
  }
  .items-table th {
    background-color: #f2f2f2;
    font-weight: bold;
    text-align: center;
  }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .text-left { text-align: left; }
  .totals-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
    font-size: 8.5pt;
  }
  .totals-table td {
    padding: 2px 4px;
  }
  .summary-text {
    font-size: 8.5pt;
    margin-bottom: 14px;
    line-height: 1.4;
  }
  .divider-line {
    border-top: 2px solid #000;
    margin-bottom: 16px;
  }
  .signatures-row {
    display: flex;
    justify-content: space-between;
    font-size: 9pt;
    font-weight: bold;
    margin-top: 15px;
  }
</style>
</head>
<body>

<div class="warning-box">
  Внимание! Оплата данного счета означает согласие с условиями поставки товара и оказания услуг маркировки.<br>
  Уведомление об оплате обязательно, в противном случае не гарантируется сохранение сроков и условий выполнения заказа.
</div>

<table class="bank-table">
  <tr>
    <td colspan="2" style="width: 65%;">
      АО "KASPI BANK", г. Алматы<br>
      <span style="font-size: 7pt; color: #555;">Банк получателя</span>
    </td>
    <td style="width: 15%;">БИК</td>
    <td style="width: 20%; font-weight: bold;">CASPKZKA</td>
  </tr>
  <tr>
    <td colspan="2"></td>
    <td>ИИК</td>
    <td style="font-weight: bold;">KZ314652185496321458</td>
  </tr>
  <tr>
    <td style="width: 15%;">ИИН / БИН</td>
    <td style="width: 50%; font-weight: bold;">990601301525</td>
    <td>КБе</td>
    <td style="font-weight: bold;">19</td>
  </tr>
  <tr>
    <td colspan="2">
      ИП "TORMAG.KZ"<br>
      <span style="font-size: 7pt; color: #555;">Получатель</span>
    </td>
    <td colspan="2"></td>
  </tr>
</table>

<div class="doc-title">
  Счет на оплату № ${escapeHtml(invoiceNumber)} от ${escapeHtml(orderDateFull)} г.
</div>

<table class="parties-table">
  <tr>
    <td style="width: 90px; font-weight: bold;">Поставщик:</td>
    <td><strong>ИП "TORMAG.KZ", ИИН 990601301525</strong>, Республика Казахстан, г. Алматы, тел.: +7 (707) 711-16-53</td>
  </tr>
  <tr>
    <td style="font-weight: bold; padding-top: 5px;">Покупатель:</td>
    <td style="padding-top: 5px;"><strong>${escapeHtml(existing.user?.companyName || 'Заказчик')}, БИН/ИИН ${escapeHtml(existing.user?.binIin || '—')}</strong>, ${escapeHtml(customerAddress)}${existing.user?.phone ? `, тел.: ${escapeHtml(existing.user.phone)}` : ''}</td>
  </tr>
  <tr>
    <td style="font-weight: bold; padding-top: 5px;">Договор:</td>
    <td style="padding-top: 5px;">Публичный договор-оферта № ${escapeHtml(existing.orderNumber)} от ${escapeHtml(orderDateFull)} г.</td>
  </tr>
</table>

<table class="items-table">
  <thead>
    <tr>
      <th style="width: 25px;">№</th>
      <th>Товары (работы, услуги)</th>
      <th style="width: 50px;">Кол-во</th>
      <th style="width: 35px;">Ед.</th>
      <th style="width: 80px;">Цена</th>
      <th style="width: 95px;">Сумма</th>
    </tr>
  </thead>
  <tbody>
    ${lines
      .map(
        (it, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td class="text-left">${escapeHtml(it.name)}</td>
      <td class="text-right">${formatQty(it.qty)}</td>
      <td class="text-center">${escapeHtml(it.unit)}</td>
      <td class="text-right">${formatMoney(it.price)}</td>
      <td class="text-right" style="font-weight: bold;">${formatMoney(it.sum)}</td>
    </tr>`
      )
      .join('')}
  </tbody>
</table>

<table class="totals-table">
  <tr>
    <td style="text-align: right; font-weight: bold; width: 85%;">Итого:</td>
    <td style="text-align: right; font-weight: bold; width: 15%;">${formatMoney(finalTotal)}</td>
  </tr>
  <tr>
    <td style="text-align: right; font-weight: bold;">В том числе НДС:</td>
    <td style="text-align: right; font-weight: bold;">Без НДС</td>
  </tr>
</table>

<div class="summary-text">
  <div>Всего наименований ${lines.length}, на сумму ${formatMoney(finalTotal)} теңге</div>
  <div><strong>Всего к оплате: ${escapeHtml(amountInWords)}</strong></div>
</div>

<div class="divider-line"></div>

<div class="signatures-row">
  <div>Исполнитель</div>
  <div style="display: flex; align-items: flex-end; gap: 20px;">
    <div style="width: 180px; border-bottom: 1px solid #000;"></div>
    <div>/ИП «TORMAG.KZ»/</div>
  </div>
</div>

</body>
</html>`;
}

export async function renderOrderActPdf(existing: any): Promise<Buffer> {
  const html = generateOrderActHtml(existing);
  return renderHtmlToPdf(html, { landscape: true });
}

export async function renderOrderInvoicePdf(existing: any): Promise<Buffer> {
  const html = generateOrderInvoiceHtml(existing);
  return renderHtmlToPdf(html, { landscape: false });
}
