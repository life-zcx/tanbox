import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { COMPANY_CONTACTS } from '../data/companyContacts';
import { setPageSeo } from '../utils/seo';

export const CookiePolicyPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    setPageSeo(
      'Политика использования файлов cookie | TANBOX.KZ',
      'Политика и правила использования файлов cookie и веб-аналитики на веб-сайте сервиса цифровой маркировки TANBOX.KZ.'
    );
  }, []);
  return (
    <div className="bg-[#f8fafc] min-h-screen py-8 sm:py-12 text-[#1e293b]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Navigation Bar */}
        <div className="pb-6 mb-6 border-b border-gray-200">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Вернуться на главную</span>
          </Link>
        </div>

        {/* Document Sheet */}
        <div className="bg-white border border-gray-300 p-8 sm:p-14 shadow-xs text-justify leading-relaxed font-sans text-xs sm:text-[13px] text-gray-800 space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2 pb-6 border-b border-gray-200">
            <h1 className="text-base sm:text-lg font-bold uppercase tracking-wide text-black">
              Политика использования файлов cookie
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-700">
              в веб-сервисе TANBOX (tanbox.kz)
            </p>
            <div className="flex justify-between items-center text-xs text-gray-500 pt-3">
              <span>г. Алматы</span>
              <span>Редакция от 01 января 2026 года</span>
            </div>
          </div>

          {/* Section 1 */}
          <div className="space-y-2">
            <h2 className="text-xs sm:text-sm font-bold uppercase text-black">1. Общие положения</h2>
            <p>1.1. Настоящая Политика использования файлов cookie (далее — «Политика») разъясняет, каким образом Индивидуальный предприниматель «TORMAG.KZ» (ИИН 990601301525, далее — «Оператор») использует файлы cookie и аналогичные технологии отслеживания при посещении сайта <code>tanbox.kz</code> и Личного кабинета <code>lk.tanbox.kz</code>.</p>
            <p>1.2. Файлы cookie представляют собой небольшие текстовые файлы, сохраняемые браузером на устройстве пользователя для обеспечения технической функциональности и безопасности сервиса.</p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h2 className="text-xs sm:text-sm font-bold uppercase text-black">2. Классификация используемых файлов cookie</h2>
            <p>2.1. <strong>Технические (строго обязательные) cookie:</strong> необходимы для обеспечения базового функционирования платформы, авторизации пользователя, поддержки защищенного соединения HTTPS и предотвращения несанкционированного доступа (CSRF-атак). Отключение данных файлов технически невозможно для продолжения работы с Личным кабинетом.</p>
            <p>2.2. <strong>Сессионные cookie:</strong> обеспечивают сохранение состояния оформления заказа, выбранных параметров тарифа и макета стикера в пределах одной сессии работы браузера.</p>
            <p>2.3. <strong>Аналитические cookie:</strong> применяются в обобщенном деперсонализированном виде для оценки производительности сайта, выявления ошибок и оптимизации скорости взаимодействия.</p>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h2 className="text-xs sm:text-sm font-bold uppercase text-black">3. Порядок управления файлами cookie</h2>
            <p>3.1. Пользователь вправе в любой момент ограничить или полностью отключить сохранение файлов cookie в настройках используемого веб-браузера, а также удалить ранее сохраненные файлы.</p>
            <p>3.2. Оператор обращает внимание, что полный запрет файлов cookie может привести к некорректной работе авторизации в Личном кабинете и невозможности оформления заказов.</p>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <h2 className="text-xs sm:text-sm font-bold uppercase text-black">4. Контактная информация</h2>
            <p>4.1. По вопросам применения настоящей Политики и защиты информации пользователи могут обращаться по электронной почте: <code>{COMPANY_CONTACTS.emails.info}</code> либо по адресу местонахождения Оператора: {COMPANY_CONTACTS.address.full}.</p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default CookiePolicyPage;
