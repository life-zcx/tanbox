import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { COMPANY_CONTACTS } from '../data/companyContacts';
import { setPageSeo } from '../utils/seo';

export const TermsPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    setPageSeo(
      'Публичная оферта | ИП TORMAG.KZ — TANBOX.KZ',
      'Договор публичной оферты на оказание услуг по цифровой маркировке товаров Data Matrix и агрегации в Республике Казахстан. Исполнитель: ИП TORMAG.KZ.'
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
              Публичный договор-оферта
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-700">
              на возмездное оказание услуг цифровой маркировки товаров
            </p>
            <div className="flex justify-between items-center text-xs text-gray-500 pt-3">
              <span>г. Алматы</span>
              <span>Редакция от 01 января 2026 года</span>
            </div>
          </div>

          {/* Preamble */}
          <p>
            Индивидуальный предприниматель «TORMAG.KZ», действующий на основании Законодательства Республики Казахстан, ИИН 990601301525, именуемый в дальнейшем <strong>«Исполнитель»</strong>, с одной стороны, публикует настоящее предложение, являющееся публичной офертой в соответствии со статьями 395 и 396 Гражданского кодекса Республики Казахстан (далее — ГК РК), адресованное любому юридическому лицу или индивидуальному предпринимателю, именуемому в дальнейшем <strong>«Заказчик»</strong>, принявшему условия настоящего Договора путем его полного и безоговорочного акцепта.
          </p>

          {/* Section 1 */}
          <div className="space-y-2">
            <h2 className="text-xs sm:text-sm font-bold uppercase text-black">1. Термины и определения</h2>
            <p>1.1. <strong>Оферта</strong> — настоящий документ, опубликованный в свободном доступе в сети Интернет на сайте <code>tanbox.kz</code>.</p>
            <p>1.2. <strong>Акцепт оферты</strong> — полное и безоговорочное принятие Заказчиком условий Оферты путем прохождения регистрации в Личном кабинете <code>lk.tanbox.kz</code>, оформления Заказа либо осуществления полной или частичной оплаты услуг.</p>
            <p>1.3. <strong>ИС Танба (ИС МПТ)</strong> — Информационная система маркировки и прослеживаемости товаров Республики Казахстан (Единый оператор АО «Казахтелеком»).</p>
            <p>1.4. <strong>Код Data Matrix</strong> — двухмерный цифровой код идентификации государственного образца Республики Казахстан.</p>
            <p>1.5. <strong>Акт выполненных работ</strong> — первичный документ бухгалтерского учета Республики Казахстан (Форма Р-1, утвержденная Приказом Минфина РК от 20.12.2012 № 562).</p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h2 className="text-xs sm:text-sm font-bold uppercase text-black">2. Предмет договора</h2>
            <p>2.1. Исполнитель обязуется по поручению Заказчика оказать комплекс услуг, связанных с цифровой маркировкой товаров, а Заказчик обязуется принять и оплатить услуги в порядке и на условиях, установленных настоящим Договором.</p>
            <p>2.2. Конкретный перечень, объем, тариф, сроки и стоимость услуг определяются Заказчиком при формировании Заказа в Личном кабинете и отражаются в выставленном Счете на оплату и Акте выполненных работ.</p>
            <p>2.3. В комплекс услуг могут входить: заказ и эмиссия кодов в ИС Танба, разработка макетов этикеток, промышленная термотрансферная печать, оклейка товаров на складе Заказчика, формирование кодов транспортной упаковки (SSCC) и курьерская доставка по РК.</p>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h2 className="text-xs sm:text-sm font-bold uppercase text-black">3. Порядок согласования макетов этикеток</h2>
            <p>3.1. При заказе услуг разработки дизайна макета этикетки Исполнитель готовит макет в соответствии с предоставленными Заказчиком параметрами и требованиями технических регламентов Таможенного союза / ЕАЭС.</p>
            <p>3.2. Нажатие Заказчиком кнопки «Согласовать макет» в интерфейсе Личного кабинета является юридически значимым действием, подтверждающим окончательное утверждение макета.</p>
            <p>3.3. С момента согласования макета Заказчик несет единоличную ответственность за правильность наименования товара, артикула, состава, штрихкодов EAN-13 и знаков обращения. Претензии по содержанию утвержденного макета после запуска печати не принимаются.</p>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <h2 className="text-xs sm:text-sm font-bold uppercase text-black">4. Стоимость услуг и порядок расчетов</h2>
            <p>4.1. Стоимость услуг определяется на основании действующих тарифов Исполнителя и фиксируется в национальной валюте Республики Казахстан — тенге (₸).</p>
            <p>4.2. В соответствии с подпунктом 1 пункта 1 статьи 367 Налогового кодекса РК, услуги Исполнителя <strong>НДС не облагаются</strong> (Исполнитель применяет специальный налоговый режим на основе упрощенной декларации).</p>
            <p>4.3. Оплата осуществляется Заказчиком в безналичном порядке путем банковского перевода на расчетный счет Исполнителя на основании Счета на оплату либо через платежные сервисы Kaspi Pay / эквайринг банков.</p>
            <p>4.4. Все комиссии банков и платежных систем, связанные с переводом денежных средств, оплачиваются Заказчиком самостоятельно.</p>
          </div>

          {/* Section 5 */}
          <div className="space-y-2">
            <h2 className="text-xs sm:text-sm font-bold uppercase text-black">5. Порядок сдачи-приемки услуг</h2>
            <p>5.1. Сдача-приемка оказанных услуг оформляется Актом выполненных работ (оказанных услуг) по форме Р-1 на бумажном носителе либо в электронном виде (ЭАВР в ИС ЭСФ).</p>
            <p>5.2. Заказчик обязан в течение 3 (трех) рабочих дней с момента предоставления кодов / отгрузки тиража рассмотреть и подписать Акт выполненных работ либо направить Исполнителю мотивированный письменный отказ.</p>
            <p>5.3. В случае ненаправления Заказчиком подписанного Акта или письменного мотивированного отказа в установленный 3-дневный срок, услуги считаются оказанными в полном объеме, надлежащего качества и безоговорочно принятыми Заказчиком.</p>
          </div>

          {/* Section 6 */}
          <div className="space-y-2">
            <h2 className="text-xs sm:text-sm font-bold uppercase text-black">6. Ответственность сторон и разрешение споров</h2>
            <p>6.1. За неисполнение или ненадлежащее исполнение обязательств стороны несут ответственность в соответствии с законодательством Республики Казахстан.</p>
            <p>6.2. Исполнитель гарантирует 100% промышленную считываемость нанесенных кодов Data Matrix стандартными оптическими сканерами и ТСД.</p>
            <p>6.3. Заказчик самостоятельно несет ответственность за законность ввода маркируемых товаров в гражданский оборот на территории Республики Казахстан.</p>
            <p>6.4. Споры и разногласия разрешаются в претензионном порядке со сроком ответа 10 (десять) календарных дней. При недостижении согласия споры передаются на рассмотрение в суд по месту нахождения Исполнителя.</p>
          </div>

          {/* Section 7 */}
          <div className="space-y-2">
            <h2 className="text-xs sm:text-sm font-bold uppercase text-black">7. Срок действия договора</h2>
            <p>7.1. Настоящий Договор вступает в силу с момента акцепта Оферты Заказчиком и действует до полного исполнения сторонами принятых обязательств.</p>
          </div>

          {/* Requisites Table */}
          <div className="pt-6 border-t border-gray-200 space-y-3">
            <h2 className="text-xs sm:text-sm font-bold uppercase text-black">8. Адрес и реквизиты Исполнителя</h2>
            <table className="w-full border-collapse border border-gray-300 text-xs">
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2.5 font-bold w-1/3 bg-gray-50">Исполнитель</td>
                  <td className="border border-gray-300 p-2.5 font-semibold">{COMPANY_CONTACTS.legal.companyName}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2.5 font-bold bg-gray-50">ИИН</td>
                  <td className="border border-gray-300 p-2.5">{COMPANY_CONTACTS.legal.iin}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2.5 font-bold bg-gray-50">Налоговый режим</td>
                  <td className="border border-gray-300 p-2.5">{COMPANY_CONTACTS.legal.taxStatus}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2.5 font-bold bg-gray-50">Банковские реквизиты</td>
                  <td className="border border-gray-300 p-2.5">{COMPANY_CONTACTS.legal.bank}, счет: {COMPANY_CONTACTS.legal.iik}</td>
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

export default TermsPage;
