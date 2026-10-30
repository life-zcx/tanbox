import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { COMPANY_CONTACTS } from '../data/companyContacts';
import { setPageSeo } from '../utils/seo';
import { useLanguage } from '../context/LanguageContext';

export const PaymentProcedurePage: React.FC = () => {
  const { lang, getLocalizedPath } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (lang === 'kz') {
      setPageSeo(
        'Есеп айырысу, жеткізу және қайтару тәртібі | TANBOX.KZ',
        'TANBOX.KZ сервисінде қолма-қол ақшасыз есеп айырысу, Kaspi Pay арқылы төлеу, жеткізу және қаражатты қайтару ережелері.'
      );
    } else if (lang === 'en') {
      setPageSeo(
        'Payment Procedure, Delivery & Refund Policy | TANBOX.KZ',
        'B2B payment terms, bank wire transfer, Kaspi Pay, delivery and refund procedure on TANBOX.KZ.'
      );
    } else {
      setPageSeo(
        'Порядок расчетов, доставки и правила возврата | TANBOX.KZ',
        'Порядок безналичной оплаты по счету, Kaspi Pay, авансового баланса, условия доставки этикеток и правила возврата на TANBOX.KZ.'
      );
    }
  }, [lang]);

  return (
    <div className="bg-[#f8fafc] min-h-screen py-8 sm:py-12 text-[#1e293b]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Navigation Bar */}
        <div className="pb-6 mb-6 border-b border-gray-200">
          <Link
            to={getLocalizedPath('/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>
              {lang === 'kz' ? 'Басты бетке оралу' : lang === 'en' ? 'Back to home' : 'Вернуться на главную'}
            </span>
          </Link>
        </div>

        {/* Document Sheet */}
        <div className="bg-white border border-gray-300 p-8 sm:p-14 shadow-xs text-justify leading-relaxed font-sans text-xs sm:text-[13px] text-gray-800 space-y-6">
          
          {lang === 'kz' ? (
            <>
              {/* Header KZ */}
              <div className="text-center space-y-2 pb-6 border-b border-gray-200">
                <h1 className="text-base sm:text-lg font-bold uppercase tracking-wide text-black">
                  Есеп айырысу, жеткізу және қайтару тәртібі
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-gray-700">
                  TANBOX сервисінде қолма-қол ақшасыз төлем жасау және қызмет көрсету шарттары
                </p>
                <div className="flex justify-between items-center text-xs text-gray-500 pt-3">
                  <span>Алматы қ.</span>
                  <span>2026 жылғы редакция</span>
                </div>
              </div>

              {/* Section 1 KZ */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">
                  1. Есеп айырысу және төлем жасау тәртібі
                </h2>
                <p>
                  1.1. TANBOX.KZ сервисінде тауарларды таңбалауға арналған полиграфиялық қызметтер мен шығыс материалдарына ақы төлеу заңды тұлғалар мен жеке кәсіпкерлер үшін келесі қолма-қол ақшасыз тәсілдермен жүзеге асырылады:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Төлем шоты бойынша банктік аударым:</strong> Тапсырыс берушінің банктік шотынан Орындаушының банктік реквизиттеріне (АО «Kaspi Bank») төлем шоты негізінде аудару;</li>
                  <li><strong>Kaspi Pay төлем сервистері:</strong> Kaspi Pay бизнес-қосымшасы немесе QR арқылы шотқа жылдам төлем жасау;</li>
                  <li><strong>Жеке кабинеттегі аванстық дербес шот (ішкі теңгерім):</strong> <code>lk.tanbox.kz</code> Жеке кабинетіндегі алдын ала енгізілген аванстық қаражат есебінен тапсырыстар мен шоттарды төлеу.</li>
                </ul>
                <p>
                  1.2. Барлық есеп айырысулар Қазақстан Республикасының ұлттық валютасында — теңгемен (₸) жүргізіледі. Орындаушы арнайы салық режимін (оңайлатылған декларация) қолданатындықтан, қызметтерге ҚҚС салынбайды.
                </p>
              </div>

              {/* Section 2 KZ */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">
                  2. Ішкі теңгерімді (аванстық шотты) пайдалану талаптары
                </h2>
                <p>
                  2.1. Тапсырыс берушінің Жеке кабинетіндегі ішкі теңгерім тек Орындаушының полиграфиялық өнімдері (жапсырмалар, стикерлер басып шығару) мен оклейка қызметтері үшін аванстық төлем (алдын ала төлем) жасауға арналған.
                </p>
                <p>
                  2.2. Теңгерімдегі қаражат электрондық ақша, банк салымы немесе әмбебап төлем құралы болып табылмайды.
                </p>
                <p>
                  2.3. Ішкі теңгерімді үшінші тұлғалардың тауарлары мен қызметтеріне ақы төлеуге, басқа пайдаланушыларға аударуға (P2P) немесе қолма-қол ақша түрінде шешуге қатаң тыйым салынады және жүйеде мұндай функциялар қарастырылмаған.
                </p>
              </div>

              {/* Section 3 KZ */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">
                  3. Қаражатты қайтару тәртібі мен ережелері
                </h2>
                <p>
                  3.1. Қолма-қол ақшалай қаражат қайтару жүргізілмейді. Барлық қайтару операциялары Қазақстан Республикасының Азаматтық кодексіне сәйкес тек қолма-қол ақшасыз банктік аударым арқылы жүзеге асырылады.
                </p>
                <p>
                  3.2. Тапсырыс беруші өнімді басып шығару процесі нақты басталғанға дейін тапсырыстан бас тартуға құқылы. Бұл ретте төленген қаражат Орындаушының нақты шеккен шығыстарын шегергенде толық қайтарылады.
                </p>
                <p>
                  3.3. Пайдаланылмаған аванстық қаражатты қайтару үшін Тапсырыс беруші ресми хат/өтінішті ресімдеп, банктік реквизиттерін көрсете отырып, <strong>{COMPANY_CONTACTS.emails.info}</strong> электрондық мекенжайына жолдайды.
                </p>
                <p>
                  3.4. Қайтару туралы өтініш 10 (он) жұмыс күні ішінде қаралып, қаражат Тапсырыс берушінің ресми банктік шотына аударылады.
                </p>
              </div>

              {/* Section 4 KZ */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">
                  4. Өнімді дайындау, жеткізу және қабылдау тәртібі
                </h2>
                <p>
                  4.1. <strong>Басып шығарылған жапсырмаларды дайындау мерзімі:</strong> Макет келісілген және тапсырыс расталған сәттен бастап 1–3 жұмыс күнін құрайды.
                </p>
                <p>
                  4.2. <strong>Жеткізу тәсілдері:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Алматы қаласындағы өндірістік қоймадан өздігінен алып кету (самовывоз);</li>
                  <li>Курьерлік жеткізу (Яндекс Доставка, CDEK, Avis Logistics) бойынша Алматы қаласы және ҚР-ның барлық аймақтарына жөнелту.</li>
                </ul>
                <p>
                  4.3. <strong>Көшпелі оклейка қызметтері:</strong> Бригаданың шығу мерзімі мен кестесі өтінім ресімделген кезде жеке келісіледі.
                </p>
                <p>
                  4.4. Қызметтер нәтижесі ЭШФ АЖ (ИС ЭСФ) жүйесінде электрондық Р-1 нысанындағы Орындалған жұмыстар актісімен (ЭАВР) ресімделеді.
                </p>
              </div>

              {/* Contacts Note KZ */}
              <div className="pt-6 border-t border-gray-200 text-xs text-gray-600 space-y-1">
                <p>
                  Есеп айырысу, жеткізу және құжаттама мәселелері бойынша байланыс: тел. <strong>{COMPANY_CONTACTS.phones.hotline}</strong>, email: <strong>{COMPANY_CONTACTS.emails.info}</strong>.
                </p>
                <p>
                  Орындаушының толық заңды және банктік деректемелері{' '}
                  <Link to={getLocalizedPath('/terms')} className="text-blue-600 underline hover:text-black">
                    Жария офертада
                  </Link>{' '}
                  көрсетілген.
                </p>
              </div>
            </>
          ) : lang === 'en' ? (
            <>
              {/* Header EN */}
              <div className="text-center space-y-2 pb-6 border-b border-gray-200">
                <h1 className="text-base sm:text-lg font-bold uppercase tracking-wide text-black">
                  Payment, Delivery & Refund Policy
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-gray-700">
                  Non-Cash B2B Settlement and Service Fulfillment Terms on TANBOX
                </p>
                <div className="flex justify-between items-center text-xs text-gray-500 pt-3">
                  <span>Almaty, Kazakhstan</span>
                  <span>Effective 2026</span>
                </div>
              </div>

              {/* Section 1 EN */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">
                  1. Payment & Settlement Methods
                </h2>
                <p>
                  1.1. Payment for industrial printing services and labeling materials on TANBOX.KZ is accepted in non-cash form via:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Bank wire transfer against Proforma Invoice:</strong> Direct bank transfer from the Customer's corporate bank account to the Contractor's account at JSC Kaspi Bank;</li>
                  <li><strong>Kaspi Pay business services:</strong> Rapid corporate settlement via Kaspi Pay invoicing and QR payment;</li>
                  <li><strong>Internal advance portal balance:</strong> Direct settlement from pre-funded client advance balance in <code>lk.tanbox.kz</code>.</li>
                </ul>
                <p>
                  1.2. All settlements are executed in the national currency of Kazakhstan — Tenge (₸). Under RK simplified taxation, services are VAT exempt.
                </p>
              </div>

              {/* Section 2 EN */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">
                  2. Advance Balance Terms
                </h2>
                <p>
                  2.1. The internal balance in the Customer Portal constitutes an advance deposit (prepayment) exclusively designated for the Contractor's own printing and labeling services.
                </p>
                <p>
                  2.2. Balance funds do not constitute bank deposits, electronic money, or transferable financial instruments.
                </p>
                <p>
                  2.3. Settlement for third-party products/services, peer-to-peer (P2P) transfers between users, and direct cash withdrawals are strictly prohibited and technically unavailable.
                </p>
              </div>

              {/* Section 3 EN */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">
                  3. Refund Policy
                </h2>
                <p>
                  3.1. Cash refunds are not provided. All refunds are processed exclusively via non-cash bank wire transfer pursuant to the Civil Code of RK.
                </p>
                <p>
                  3.2. Customers may cancel orders prior to actual commencement of print production, in which case amounts paid are refunded less direct expenses incurred.
                </p>
                <p>
                  3.3. To request an advance balance refund, the Customer submits an official application with corporate banking details to <strong>{COMPANY_CONTACTS.emails.info}</strong>.
                </p>
                <p>
                  3.4. Refund requests are processed within 10 (ten) business days via wire transfer to the Customer's corporate bank account.
                </p>
              </div>

              {/* Section 4 EN */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">
                  4. Production, Delivery & Acceptance
                </h2>
                <p>
                  4.1. <strong>Print Production Turnaround:</strong> Standard manufacturing turnaround is 1 to 3 business days following final layout approval.
                </p>
                <p>
                  4.2. <strong>Delivery Options:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Self-pickup from our production warehouse in Almaty;</li>
                  <li>Courier shipping across Almaty and all regions of Kazakhstan (CDEK, Avis Logistics, Yandex Delivery).</li>
                </ul>
                <p>
                  4.3. <strong>Onsite Labeling:</strong> Field crew schedules are coordinated individually upon order confirmation.
                </p>
                <p>
                  4.4. Deliverables are formalized via electronic Completion Acts (Form R-1) through the national IS ESF portal.
                </p>
              </div>

              {/* Contacts Note EN */}
              <div className="pt-6 border-t border-gray-200 text-xs text-gray-600 space-y-1">
                <p>
                  Billing and delivery support: <strong>{COMPANY_CONTACTS.phones.hotline}</strong>, email: <strong>{COMPANY_CONTACTS.emails.info}</strong>.
                </p>
                <p>
                  Full legal and corporate banking details are available in the{' '}
                  <Link to={getLocalizedPath('/terms')} className="text-blue-600 underline hover:text-black">
                    Public Offer Agreement
                  </Link>.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Header RU */}
              <div className="text-center space-y-2 pb-6 border-b border-gray-200">
                <h1 className="text-base sm:text-lg font-bold uppercase tracking-wide text-black">
                  Порядок расчетов, доставки и правила возврата
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-gray-700">
                  Условия безналичных расчетов для юридических лиц и индивидуальных предпринимателей в сервисе TANBOX
                </p>
                <div className="flex justify-between items-center text-xs text-gray-500 pt-3">
                  <span>г. Алматы</span>
                  <span>Редакция 2026 года</span>
                </div>
              </div>

              {/* Section 1 RU */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">
                  1. Способы оплаты и порядок расчетов
                </h2>
                <p>
                  1.1. Оплата полиграфических услуг печати этикеток, услуг оклейки и расходных материалов на сайте <code>tanbox.kz</code> осуществляется юридическими лицами и индивидуальными предпринимателями в безналичном порядке следующими способами:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Банковский перевод по Счету на оплату:</strong> Безналичное перечисление с расчетного счета Заказчика на расчетный счет Исполнителя в АО «Kaspi Bank» на основании сформированного Счета на оплату;</li>
                  <li><strong>Платежные сервисы Kaspi Pay:</strong> Быстрая оплата выставленных счетов через приложение Kaspi Pay для бизнеса либо по QR-коду;</li>
                  <li><strong>Авансовый лицевой счет (баланс) в Личном кабинете:</strong> Оплата сформированных заказов и счетов с персонального авансового баланса в <code>lk.tanbox.kz</code>.</li>
                </ul>
                <p>
                  1.2. Все расчеты производятся в национальной валюте Республики Казахстан — тенге (₸). В соответствии с налоговым законодательством РК услуги Исполнителя НДС не облагаются (специальный налоговый режим на основе упрощенной декларации).
                </p>
              </div>

              {/* Section 2 RU */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">
                  2. Условия использования авансового баланса Личного кабинета
                </h2>
                <p>
                  2.1. Внутренний баланс в Личном кабинете <code>lk.tanbox.kz</code> является исключительно авансовым платежом (предоплатой) Заказчика за собственные услуги Исполнителя по печати маркировочных этикеток и услугам оклейки.
                </p>
                <p>
                  2.2. Денежные средства на балансе не являются банковским вкладом, электронными деньгами или платежным средством.
                </p>
                <p>
                  2.3. Использование средств баланса для оплаты услуг сторонних организаций, осуществление переводов между пользователями (P2P) или снятие наличных средств категорически запрещены и технически не предусмотрены функционалом сервиса.
                </p>
              </div>

              {/* Section 3 RU */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">
                  3. Правила и порядок возврата денежных средств
                </h2>
                <p>
                  3.1. Выплата возврата наличными денежными средствами <strong>не осуществляется</strong>. Все возвраты производятся исключительно в безналичном порядке на расчетный счет Заказчика в соответствии с Гражданским кодексом Республики Казахстан.
                </p>
                <p>
                  3.2. Заказчик вправе отказаться от оплаченных услуг до момента фактического запуска печати тиража этикеток в производство. В этом случае уплаченная сумма возвращается за вычетом фактически понесенных расходов Исполнителя.
                </p>
                <p>
                  3.3. Для возврата неиспользованного остатка авансового баланса Заказчик направляет официальное письменное заявление с указанием банковских реквизитов организации на электронный адрес: <strong>{COMPANY_CONTACTS.emails.info}</strong>.
                </p>
                <p>
                  3.4. Срок рассмотрения заявления и перечисления средств на расчетный счет Заказчика составляет до 10 (десяти) рабочих дней.
                </p>
              </div>

              {/* Section 4 RU */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">
                  4. Правила изготовления, доставки и приемки продукции
                </h2>
                <p>
                  4.1. <strong>Сроки печати полиграфической продукции:</strong> Изготовление рулонов самоклеящихся этикеток составляет от 1 до 3 рабочих дней с момента утверждения макета Заказчиком в Личном кабинете.
                </p>
                <p>
                  4.2. <strong>Способы получения готовой продукции:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Самовывоз со склада готовой продукции в г. Алматы (по предварительному согласованию);</li>
                  <li>Курьерская доставка до склада или офиса клиента (Яндекс Доставка, CDEK, Avis Logistics) по Алматы и всем регионам Республики Казахстан.</li>
                </ul>
                <p>
                  4.3. <strong>Выездные услуги (оклейка на складе Заказчика):</strong> Дата, время и адрес выезда мобильной бригады согласуются индивидуально при оформлении заказа.
                </p>
                <p>
                  4.4. Сдача-приемка оказанных услуг оформляется электронным Актом выполненных работ (форма Р-1, ЭАВР) в государственной системе ИС ЭСФ.
                </p>
              </div>

              {/* Contacts Note RU */}
              <div className="pt-6 border-t border-gray-200 text-xs text-gray-600 space-y-1">
                <p>
                  Служба клиентской поддержки по вопросам расчетов и доставки: тел. <strong>{COMPANY_CONTACTS.phones.hotline}</strong>, email: <strong>{COMPANY_CONTACTS.emails.info}</strong>.
                </p>
                <p>
                  Полные юридические и банковские реквизиты Исполнителя указаны в{' '}
                  <Link to={getLocalizedPath('/terms')} className="text-blue-600 underline hover:text-black">
                    Публичной оферте
                  </Link>.
                </p>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default PaymentProcedurePage;
