import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';
import { COMPANY_CONTACTS, getLocalizedCompanyContacts } from '../../data/companyContacts';
import { CATEGORIES_DATA, getLocalizedCategory } from '../../data/categoriesData';
import { useLanguage } from '../../context/LanguageContext';

export const Footer: React.FC = () => {
  const { lang, getLocalizedPath } = useLanguage();
  const localizedContacts = getLocalizedCompanyContacts(lang);

  return (
    <footer className="bg-black text-white border-t border-gray-800 pt-16 pb-12">
      <div className="max-w-[1700px] w-full mx-auto px-6 sm:px-10 lg:px-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Col 1 */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Link to={getLocalizedPath('/')}>
              <img src="/tanbox-white.svg" alt="tanbox.kz" width={140} height={24} className="h-6 w-auto" />
            </Link>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            {lang === 'kz'
              ? 'Қазақстан Республикасындағы цифрлық таңбалаудың ұлттық сервисі. ТМБ АЖ-мен тікелей интеграция, кедендік ресімдеуден 1С-пен интеграцияға дейінгі толық цикл: кодтардың эмиссиясы, басып шығару және қоймада оклейка.'
              : lang === 'en'
              ? 'National digital product marking service in Kazakhstan with direct IS MPT connectivity. Full cycle from customs clearance to 1C integration: code issuance, printing, and onsite stickering.'
              : 'Национальный сервис цифровой маркировки товаров в Республике Казахстан с прямой интеграцией в ИС МПТ. Полный цикл — от растаможки до интеграции в 1С: заказ кодов, печать и оклейка на складе.'}
          </p>
        </div>

        {/* Col 2 */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-4">
            {lang === 'kz' ? 'Навигация' : lang === 'en' ? 'Navigation' : 'Навигация'}
          </h4>
          <ul className="space-y-2.5 text-sm text-gray-400">
            <li>
              <Link to={getLocalizedPath('/')} className="hover:text-white transition-colors">
                {lang === 'kz' ? 'Басты бет' : lang === 'en' ? 'Home' : 'Главная страница'}
              </Link>
            </li>
            <li>
              <Link to={getLocalizedPath('/calculator')} className="hover:text-white transition-colors">
                {lang === 'kz' ? 'Құнын есептеу' : lang === 'en' ? 'Calculator' : 'Калькулятор стоимости'}
              </Link>
            </li>
            <li>
              <Link to={getLocalizedPath('/categories')} className="hover:text-white transition-colors">
                {lang === 'kz' ? 'Тауар санаттары' : lang === 'en' ? 'Product Categories' : 'Категории товаров РК'}
              </Link>
            </li>
            <li>
              <Link to={getLocalizedPath('/services')} className="hover:text-white transition-colors">
                {lang === 'kz' ? 'Кілтке дейінгі қызметтер (СЭҚ, ҰТК)' : lang === 'en' ? 'Turnkey Services (FEA, NKT)' : 'Услуги под ключ (ВЭД, НКТ)'}
              </Link>
            </li>
            <li>
              <Link to={getLocalizedPath('/articles')} className="hover:text-white transition-colors">
                {lang === 'kz' ? 'Білім базасы және мақалалар' : lang === 'en' ? 'Knowledge Base & Guides' : 'База знаний и статьи'}
              </Link>
            </li>
            <li>
              <Link to={getLocalizedPath('/contacts')} className="hover:text-white transition-colors">
                {lang === 'kz' ? 'Байланыс' : lang === 'en' ? 'Contacts' : 'Контакты'}
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Все категории товаров */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-4">
            {lang === 'kz' ? 'Тауарларды таңбалау' : lang === 'en' ? 'Product Serialization' : 'Маркировка товаров'}
          </h4>
          <ul className="space-y-2 text-sm text-gray-400">
            {CATEGORIES_DATA.map((cat) => {
              const localizedCat = getLocalizedCategory(cat, lang);
              return (
                <li key={cat.id}>
                  <Link
                    to={getLocalizedPath(`/categories/${cat.id}`)}
                    className="hover:text-white transition-colors block py-0.5"
                  >
                    {localizedCat.shortTitle}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Col 4 */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-4">
            {lang === 'kz' ? 'Байланыс' : lang === 'en' ? 'Contacts' : 'Контакты'}
          </h4>
          <ul className="space-y-3 text-sm text-gray-400">
            <li className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-white" />
              <a href={`tel:${COMPANY_CONTACTS.phones.hotlineRaw}`} className="hover:text-white transition-colors">
                {COMPANY_CONTACTS.phones.hotline}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-white" />
              <a href={`mailto:${COMPANY_CONTACTS.emails.info}`} className="hover:text-white transition-colors">
                {COMPANY_CONTACTS.emails.info}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-white mt-1 shrink-0" />
              <span>{localizedContacts.addressShort}</span>
            </li>
          </ul>

          {/* Social Media */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <h5 className="text-xs font-semibold text-gray-400 mb-3 tracking-wide">
              {lang === 'kz' ? 'Біз әлеуметтік желілерде' : lang === 'en' ? 'Social media' : 'Мы в соцсетях'}
            </h5>
            <div className="flex items-center gap-2.5">
              {/* WhatsApp */}
              <a
                href={COMPANY_CONTACTS.links.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp"
                className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-[#25D366]/10 border border-white/10 hover:border-[#25D366]/40 text-gray-300 hover:text-[#25D366] flex items-center justify-center transition-all"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.04 14.69 2 12.04 2ZM12.05 20.15C10.57 20.15 9.12 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.05 20.15ZM16.57 14.39C16.32 14.27 15.1 13.67 14.87 13.58C14.65 13.5 14.48 13.46 14.32 13.71C14.15 13.96 13.68 14.51 13.53 14.68C13.39 14.84 13.24 14.86 12.99 14.74C12.74 14.62 11.94 14.36 10.99 13.51C10.25 12.85 9.75 12.04 9.61 11.79C9.46 11.54 9.59 11.41 9.72 11.28C9.83 11.17 9.97 10.99 10.09 10.84C10.22 10.7 10.26 10.6 10.34 10.43C10.42 10.26 10.38 10.12 10.32 10C10.26 9.88 9.77 8.67 9.56 8.18C9.37 7.7 9.17 7.76 9.02 7.76C8.88 7.75 8.71 7.75 8.55 7.75C8.38 7.75 8.12 7.81 7.89 8.06C7.66 8.31 7.02 8.91 7.02 10.13C7.02 11.35 7.91 12.53 8.03 12.69C8.16 12.86 9.77 15.34 12.24 16.41C12.83 16.66 13.29 16.81 13.64 16.93C14.23 17.11 14.77 17.09 15.2 17.02C15.67 16.95 16.66 16.43 16.86 15.85C17.07 15.28 17.07 14.79 17.01 14.68C16.95 14.58 16.82 14.52 16.57 14.39Z" />
                </svg>
              </a>

              {/* Telegram */}
              <a
                href={COMPANY_CONTACTS.links.telegramChannel}
                target="_blank"
                rel="noopener noreferrer"
                title="Telegram"
                className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-[#229ED9]/10 border border-white/10 hover:border-[#229ED9]/40 text-gray-300 hover:text-[#229ED9] flex items-center justify-center transition-all"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com/tanbox.kz"
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram"
                className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-[#E4405F]/10 border border-white/10 hover:border-[#E4405F]/40 text-gray-300 hover:text-[#E4405F] flex items-center justify-center transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Payment Logos & Footer Bottom Bar */}
      <div className="max-w-[1700px] w-full mx-auto px-6 sm:px-10 lg:px-16 mt-12 pt-8 border-t border-white/10 flex flex-col lg:flex-row items-center justify-between gap-6 text-xs text-gray-500">
        <p className="order-2 lg:order-1 text-center lg:text-left">
          © 2026 TANBOX.KZ —{' '}
          {lang === 'kz'
            ? 'Барлық құқықтар қорғалған. Қазақстандағы цифрлық таңбалау сервисі.'
            : lang === 'en'
            ? 'All rights reserved. Digital product marking service in Kazakhstan.'
            : 'Все права защищены. Сервис цифровой маркировки в Казахстане.'}
        </p>

        {/* Payment logos */}
        <Link
          to={getLocalizedPath('/payment-procedure')}
          title={lang === 'kz' ? 'Төлем әдістері және қауіпсіздік' : lang === 'en' ? 'Payment methods & security' : 'Способы оплаты и безопасность'}
          className="order-1 lg:order-2 flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <img
            src="/Visa.webp"
            alt="Visa"
            width={60}
            height={24}
            className="h-6 w-auto object-contain"
          />
          <img
            src="/Mastercard.webp"
            alt="Mastercard"
            width={40}
            height={24}
            className="h-6 w-auto object-contain"
          />
          <span className="h-4 w-px bg-white/20 mx-0.5" />
          <img
            src="/Logo_white.svg"
            alt="Freedom Pay"
            width={100}
            height={20}
            className="h-5 w-auto object-contain"
          />
        </Link>

        {/* Legal links */}
        <div className="order-3 flex flex-wrap justify-center lg:justify-end gap-5">
          <Link to={getLocalizedPath('/payment-procedure')} className="hover:text-white transition-colors">
            {lang === 'kz' ? 'Төлем және қайтару' : lang === 'en' ? 'Payment & Refund' : 'Оплата и возврат'}
          </Link>
          <Link to={getLocalizedPath('/terms')} className="hover:text-white transition-colors">
            {lang === 'kz' ? 'Жария оферта' : lang === 'en' ? 'Public Offer' : 'Публичная оферта'}
          </Link>
          <Link to={getLocalizedPath('/privacy')} className="hover:text-white transition-colors">
            {lang === 'kz' ? 'Құпиялылық саясаты' : lang === 'en' ? 'Privacy Policy' : 'Политика конфиденциальности'}
          </Link>
          <Link to={getLocalizedPath('/cookie-policy')} className="hover:text-white transition-colors">
            {lang === 'kz' ? 'Cookie саясаты' : lang === 'en' ? 'Cookie Policy' : 'Политика cookie'}
          </Link>
        </div>
      </div>
    </footer>
  );
};
