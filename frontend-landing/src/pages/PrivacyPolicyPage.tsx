import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { COMPANY_CONTACTS } from '../data/companyContacts';
import { setPageSeo } from '../utils/seo';

export const PrivacyPolicyPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    setPageSeo(
      'Политика конфиденциальности и обработки персональных данных | TANBOX.KZ',
      'Политика конфиденциальности и защиты персональных данных пользователей сервиса TANBOX.KZ в соответствии с Законом Республики Казахстан № 94-V.'
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
              Политика конфиденциальности
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-700">
              и обработки персональных данных в сервисе TANBOX
            </p>
            <div className="flex justify-between items-center text-xs text-gray-500 pt-3">
              <span>г. Алматы</span>
              <span>Редакция от 01 января 2026 года</span>
            </div>
          </div>

          {/* Section 1 */}
          <div className="space-y-2">
            <h2 className="text-xs sm:text-sm font-bold uppercase text-black">1. Общие положения</h2>
            <p>1.1. Настоящая Политика конфиденциальности (далее — «Политика») определяет порядок сбора, систематизации, накопления, хранения, уточнения, использования, передачи и уничтожения персональных данных пользователей сервиса TANBOX в строгом соответствии с Законом Республики Казахстан от 21 мая 2013 года № 94-V «О персональных данных и их защите».</p>
            <p>1.2. Оператором базы данных, содержащей персональные данные, является Индивидуальный предприниматель «TORMAG.KZ» (ИИН 990601301525, адрес: {COMPANY_CONTACTS.address.full}) (далее — «Оператор»).</p>
            <p>1.3. Регистрация в Личном кабинете <code>lk.tanbox.kz</code>, оформление заявки на маркировку либо использование любых функциональных возможностей сайта <code>tanbox.kz</code> означает полное и безоговорочное согласие Пользователя с настоящей Политикой.</p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h2 className="text-xs sm:text-sm font-bold uppercase text-black">2. Состав собираемых персональных данных</h2>
            <p>2.1. В рамках оказания услуг Оператор осуществляет сбор и обработку следующих данных:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Фамилия, имя, отчество руководителя, индивидуального предпринимателя или уполномоченного представителя;</li>
              <li>Индивидуальный идентификационный номер (ИИН) либо Бизнес-идентификационный номер (БИН) организации;</li>
              <li>Контактный номер мобильного и стационарного телефона;</li>
              <li>Адрес электронной почты (e-mail);</li>
              <li>Наименование субъекта предпринимательства (ТОО, ИП);</li>
              <li>Фактический адрес склада либо объекта для проведения маркировки / оклейки товаров;</li>
              <li>Технические данные сетевого подключения: IP-адрес, тип браузера, файлы cookie.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h2 className="text-xs sm:text-sm font-bold uppercase text-black">3. Цели сбора и обработки данных</h2>
            <p>3.1. Персональные данные обрабатываются Оператором исключительно для следующих целей:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Идентификация стороны в рамках договоров и соглашений с Оператором;</li>
              <li>Обеспечение выпуска, подготовки и нанесения кодов Data Matrix в ИС «Танба» (Единый оператор маркировки РК);</li>
              <li>Заведение карточек товаров в Национальный каталог товаров (НКТ);</li>
              <li>Организация выезда мобильных бригад маркировщиков на склад Заказчика;</li>
              <li>Выставление бухгалтерских счетов, актов выполненных работ и оформление первичных документов по законодательству РК;</li>
              <li>Предоставление клиентской и технической поддержки.</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <h2 className="text-xs sm:text-sm font-bold uppercase text-black">4. Локализация и порядок хранения данных</h2>
            <p>4.1. В соответствии с требованиями пункта 2 статьи 12 Закона РК «О персональных данных и их защите», базы данных, содержащие персональные данные физических и юридических лиц Республики Казахстан, физически размещаются на серверах, расположенных на территории Республики Казахстан.</p>
            <p>4.2. Хранение персональных данных осуществляется в течение срока, необходимого для достижения целей обработки, либо до момента отзыва согласия субъектом персональных данных, если более длительный срок хранения не предусмотрен законодательством РК о бухгалтерском и налоговом учете.</p>
          </div>

          {/* Section 5 */}
          <div className="space-y-2">
            <h2 className="text-xs sm:text-sm font-bold uppercase text-black">5. Конфиденциальность и передача третьим лицам</h2>
            <p>5.1. Оператор обязуется не разглашать и не передавать персональные данные третьим лицам без согласия субъекта, за исключением передачи государственным органам (КГД МФ РК, судебные органы, правоохранительные органы) по основаниям и в порядке, установленным законами Республики Казахстан.</p>
            <p>5.2. Передача сведений о товарной номенклатуре и кодах в Единую систему маркировки РК (ИС Танба) осуществляется в рамках прямого поручения Заказчика для исполнения услуг маркировки.</p>
          </div>

          {/* Section 6 */}
          <div className="space-y-2">
            <h2 className="text-xs sm:text-sm font-bold uppercase text-black">6. Права субъекта персональных данных</h2>
            <p>6.1. Субъект имеет право на получение информации, касающейся обработки его персональных данных, требование их уточнения, блокирования или уничтожения в случае, если данные являются неполными, устаревшими или незаконно полученными.</p>
            <p>6.2. Отзыв согласия на обработку данных осуществляется путем направления письменного уведомления на электронный адрес: <code>{COMPANY_CONTACTS.emails.info}</code>.</p>
          </div>

          {/* Requisites Table */}
          <div className="pt-6 border-t border-gray-200 space-y-3">
            <h2 className="text-xs sm:text-sm font-bold uppercase text-black">7. Сведения об Операторе</h2>
            <table className="w-full border-collapse border border-gray-300 text-xs">
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2.5 font-bold w-1/3 bg-gray-50">Оператор</td>
                  <td className="border border-gray-300 p-2.5 font-semibold">{COMPANY_CONTACTS.legal.companyName}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2.5 font-bold bg-gray-50">ИИН</td>
                  <td className="border border-gray-300 p-2.5">{COMPANY_CONTACTS.legal.iin}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2.5 font-bold bg-gray-50">Адрес</td>
                  <td className="border border-gray-300 p-2.5">{COMPANY_CONTACTS.address.full}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2.5 font-bold bg-gray-50">Контакты</td>
                  <td className="border border-gray-300 p-2.5">Тел.: {COMPANY_CONTACTS.phones.hotline} • Email: {COMPANY_CONTACTS.emails.info}</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
