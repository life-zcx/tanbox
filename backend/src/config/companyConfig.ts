/**
 * =======================================================================
 * ЕДИНАЯ КОНФИГУРАЦИЯ РЕКВИЗИТОВ И КОНТАКТОВ TANBOX (BACKEND)
 * =======================================================================
 * 
 * В данном файле централизованно задаются:
 * 1. Юридические и банковские реквизиты (акты Р-1, счета на оплату, оферта)
 * 2. Контакты лендинга (отдел продаж, консультации, общие контакты)
 * 3. Контакты личного кабинета (служба клиентской техподдержки)
 * 4. Контакты для бухгалтерских документов (счета, акты)
 */

export interface CompanyConfig {
  legal: {
    companyName: string;
    address: string;
    iinBin: string;
    bank: string;
    bik: string;
    iik: string;
    kbe: string;
  };
  landing: {
    officeTitle: string;
    addressFull: string;
    addressShort: string;
    city: string;
    hotline: string;
    hotlineRaw: string;
    mobile: string;
    mobileRaw: string;
    mobileNote: string;
    whatsapp: string;
    whatsappUrl: string;
    telegramChannel: string;
    emailInfo: string;
    emailSales: string;
    displayCombinedEmails: string;
    workingHoursMain: string;
    workingHoursAdditional: string;
    workingHoursFull: string;
  };
  supportLk: {
    title: string;
    phone: string;
    phoneRaw: string;
    email: string;
    telegram: string;
    telegramUrl: string;
  };
  documents: {
    contractorTitle: string;
    phone: string;
  };
}

export const COMPANY_CONFIG: CompanyConfig = {
  // =========================================================================
  // 1. ЮРИДИЧЕСКИЕ И БАНКОВСКИЕ РЕКВИЗИТЫ
  // =========================================================================
  // Используются в счетах на оплату (PDF), актах выполненных работ Р-1 (PDF),
  // договоре-оферте (/terms) и на странице контактов.
  legal: {
    companyName: 'ИП INTERSENSE',
    address: 'Алматы, МИКРОРАЙОН АТЫРАУ, дом 8, кв/офис 16',
    iinBin: '990601301525',
    bank: 'АО «Kaspi Bank»',
    bik: 'CASPKZKA',
    iik: 'KZ58722S000055787378',
    kbe: '19',
  },

  // =========================================================================
  // 2. КОНТАКТЫ ЛЕНДИНГА (ОТДЕЛ ПРОДАЖ И КОНСУЛЬТАЦИИ)
  // =========================================================================
  // Отображаются на страницах сайта: шапка, подвал, /contacts, блок на главной
  landing: {
    officeTitle: 'Центр обслуживания TANBOX',
    addressFull: 'Онлайн по всему Казахстану',
    addressShort: 'Онлайн по всему РК',
    city: 'Онлайн',

    // Горячая линия лендинга (24/7)
    hotline: '+7 (707) 711-16-53',
    hotlineRaw: '+77077111653',

    // Мобильный / WhatsApp отдела продаж
    mobile: '+7 (707) 711-16-53',
    mobileRaw: '+77077111653',
    mobileNote: '(WhatsApp / Telegram)',

    // Ссылка на WhatsApp
    whatsapp: '+7 (707) 711-16-53',
    whatsappUrl: 'https://wa.me/77077111653',

    // Телеграм-канал сервиса
    telegramChannel: 'https://t.me/tanbox_kz',

    // Почта для общих вопросов
    emailInfo: 'info@tanbox.kz',

    // Почта отдела продаж
    emailSales: 'sales@tanbox.kz',

    // Строка для отображения
    displayCombinedEmails: 'info@tanbox.kz • sales@tanbox.kz',

    // График работы
    workingHoursMain: 'Пн – Сб: 08:00 – 22:00',
    workingHoursAdditional: '(Выезд на склады 24/7 по согласованию)',
    workingHoursFull: 'Пн – Сб: 08:00 – 22:00 (Выезд на склады 24/7 по согласованию)',
  },

  // =========================================================================
  // 3. КОНТАКТЫ ЛИЧНОГО КАБИНЕТА (СЛУЖБА ПОДДЕРЖКИ КЛИЕНТОВ)
  // =========================================================================
  // Отображаются в Личном кабинете: левый сайдбар (Sidebar), экран техработ
  supportLk: {
    title: 'Служба поддержки',

    // Телефон техподдержки ЛК
    phone: '+7 (727) 355-10-20',
    phoneRaw: '+77273551020',

    // Email техподдержки ЛК
    email: 'support@tanbox.kz',

    // Telegram техподдержки ЛК
    telegram: '@tanbox_support',
    telegramUrl: 'https://t.me/tanbox_support',
  },

  // =========================================================================
  // 4. КОНТАКТЫ ДЛЯ ДОКУМЕНТОВ (СЧЕТА И АКТЫ ВЫПОЛНЕННЫХ РАБОТ)
  // =========================================================================
  // Отображаются в шапке Поставщика/Исполнителя в генерируемых PDF
  documents: {
    contractorTitle: 'Индивидуальный предприниматель "INTERSENSE"',
    phone: '+7 (707) 711-16-53',
  },
};

export default COMPANY_CONFIG;
