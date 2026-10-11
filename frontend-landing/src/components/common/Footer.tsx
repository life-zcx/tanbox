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
              <img src="/tanbox-white.svg" alt="tanbox.kz" className="h-6 w-auto" />
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
              <Link to={getLocalizedPath('/contacts')} className="hover:text-white transition-colors">
                {lang === 'kz' ? 'Байланыс және деректемелер' : lang === 'en' ? 'Contacts & Details' : 'Контакты и Реквизиты'}
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
        </div>
      </div>

      <div className="max-w-[1700px] w-full mx-auto px-6 sm:px-10 lg:px-16 mt-12 pt-8 border-t border-gray-900 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 gap-4">
        <p>
          © 2026 TANBOX.KZ —{' '}
          {lang === 'kz'
            ? 'Барлық құқықтар қорғалған. Қазақстандағы цифрлық таңбалау сервисі.'
            : lang === 'en'
            ? 'All rights reserved. Digital product marking service in Kazakhstan.'
            : 'Все права защищены. Сервис цифровой маркировки в Казахстане.'}
        </p>
        <div className="flex flex-wrap gap-6">
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
