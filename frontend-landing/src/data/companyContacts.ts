/**
 * =======================================================================
 * ЕДИНАЯ КОНФИГУРАЦИЯ РЕКВИЗИТОВ И КОНТАКТОВ TANBOX (LANDING)
 * =======================================================================
 * 
 * В данном файле централизованно задаются:
 * 1. Юридические и банковские реквизиты компании (ИП INTERSENSE, Kaspi Bank)
 * 2. Контакты лендинга (отдел продаж, консультации, телефоны, email)
 * 3. Контакты службы клиентской поддержки в Личном Кабинете (ЛК)
 * 4. Контакты для бухгалтерских документов
 */

export const COMPANY_CONFIG = {
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
    hotline: '+7 (700) 304-85-32',
    hotlineRaw: '+77003048532',

    // Мобильный / WhatsApp отдела продаж
    mobile: '+7 (700) 304-85-32',
    mobileRaw: '+77003048532',
    mobileNote: '(WhatsApp / Telegram)',

    // Ссылка на WhatsApp
    whatsapp: '+7 (700) 304-85-32',
    whatsappUrl: 'https://wa.me/77003048532',

    // Телеграм-канал сервиса
    telegramChannel: 'https://t.me/tanboxkz',

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
    phone: '+7 (700) 304-85-32',
    phoneRaw: '+77003048532',

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
    phone: '+7 (700) 304-85-32',
  },
};

/**
 * Объект COMPANY_CONTACTS для обратной совместимости компонентов лендинга
 */
export const COMPANY_CONTACTS = {
  officeTitle: COMPANY_CONFIG.landing.officeTitle,

  address: {
    full: COMPANY_CONFIG.landing.addressFull,
    display: COMPANY_CONFIG.landing.addressFull,
    short: COMPANY_CONFIG.landing.addressShort,
    city: COMPANY_CONFIG.landing.city,
  },

  phones: {
    hotline: COMPANY_CONFIG.landing.hotline,
    hotlineRaw: COMPANY_CONFIG.landing.hotlineRaw,
    mobile: COMPANY_CONFIG.landing.mobile,
    mobileRaw: COMPANY_CONFIG.landing.mobileRaw,
    mobileNote: COMPANY_CONFIG.landing.mobileNote,
  },

  emails: {
    info: COMPANY_CONFIG.landing.emailInfo,
    sales: COMPANY_CONFIG.landing.emailSales,
    displayCombined: COMPANY_CONFIG.landing.displayCombinedEmails,
  },

  links: {
    telegramChannel: COMPANY_CONFIG.landing.telegramChannel,
    whatsapp: COMPANY_CONFIG.landing.whatsappUrl,
  },

  workingHours: {
    main: COMPANY_CONFIG.landing.workingHoursMain,
    additional: COMPANY_CONFIG.landing.workingHoursAdditional,
    full: COMPANY_CONFIG.landing.workingHoursFull,
  },

  legal: {
    companyName: COMPANY_CONFIG.legal.companyName,
    address: COMPANY_CONFIG.legal.address,
    iin: COMPANY_CONFIG.legal.iinBin,
    bin: COMPANY_CONFIG.legal.iinBin,
    iik: COMPANY_CONFIG.legal.iik,
    kbe: COMPANY_CONFIG.legal.kbe,
    bik: COMPANY_CONFIG.legal.bik,
    bank: COMPANY_CONFIG.legal.bank,
  },
};

export const getLocalizedCompanyContacts = (lang: string) => {
  if (lang === 'kz') {
    return {
      officeTitle: 'TANBOX қызмет көрсету орталығы',
      addressFull: 'Қазақстан бойынша онлайн',
      addressShort: 'ҚР бойынша онлайн',
      city: 'Онлайн',
      workingHoursMain: 'Дс – Сб: 08:00 – 22:00',
      workingHoursAdditional: '(Қоймаларға келісім бойынша 24/7 шығу)',
      workingHoursFull: 'Дс – Сб: 08:00 – 22:00 (Қоймаларға келісім бойынша 24/7 шығу)',
    };
  }
  if (lang === 'en') {
    return {
      officeTitle: 'TANBOX Customer Service Center',
      addressFull: 'Online across Kazakhstan',
      addressShort: 'Online across KZ',
      city: 'Online',
      workingHoursMain: 'Mon – Sat: 08:00 – 22:00',
      workingHoursAdditional: '(24/7 warehouse dispatch upon agreement)',
      workingHoursFull: 'Mon – Sat: 08:00 – 22:00 (24/7 warehouse dispatch upon agreement)',
    };
  }
  return {
    officeTitle: COMPANY_CONFIG.landing.officeTitle,
    addressFull: COMPANY_CONFIG.landing.addressFull,
    addressShort: COMPANY_CONFIG.landing.addressShort,
    city: COMPANY_CONFIG.landing.city,
    workingHoursMain: COMPANY_CONFIG.landing.workingHoursMain,
    workingHoursAdditional: COMPANY_CONFIG.landing.workingHoursAdditional,
    workingHoursFull: COMPANY_CONFIG.landing.workingHoursFull,
  };
};

export default COMPANY_CONTACTS;
