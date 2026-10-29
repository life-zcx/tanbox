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
        'Төлем тәртібі, жеткізу және қайтару ережелері | TANBOX.KZ',
        'TANBOX.KZ сервисінде Freedom Pay арқылы VISA және MasterCard карталарымен төлеу тәртібі, қауіпсіздік және қаражатты қайтару ережелері.'
      );
    } else if (lang === 'en') {
      setPageSeo(
        'Payment Procedure, Delivery & Refund Policy | TANBOX.KZ',
        'Bank card payment terms via Freedom Pay (VISA, MasterCard), 3D-Secure protection, delivery and refund procedure on TANBOX.KZ.'
      );
    } else {
      setPageSeo(
        'Порядок оплаты, доставки и правила возврата | TANBOX.KZ',
        'Порядок оплаты банковскими картами VISA и MasterCard через платежный шлюз Freedom Pay, безопасность 3D-Secure, условия доставки и правила возврата на TANBOX.KZ.'
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
                  Төлем тәртібі, жеткізу және қайтару ережелері
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-gray-700">
                  TANBOX сервисінде банктік карталармен төлеу шарттары (Freedom Pay)
                </p>
                <div className="flex justify-between items-center text-xs text-gray-500 pt-3">
                  <span>Алматы қ.</span>
                  <span>2026 жылғы 03 тамыздағы редакция</span>
                </div>
              </div>

              {/* Section 1 KZ */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">
                  1. Банктік карталармен төлеу тәртібі
                </h2>
                <p>
                  1.1. TANBOX.KZ сервисінде цифрлық таңбалау қызметтері мен тауарларына ақы төлеу <strong>Freedom Pay</strong> (Freedom Finance) қорғалған төлем шлюзі арқылы <strong>VISA</strong> және <strong>MasterCard</strong> халықаралық банктік карталарымен жүзеге асырылады.
                </p>
                <p>
                  1.2. Интернет арқылы төлеу қызметі Visa және MasterCard халықаралық төлем жүйелерінің ережелеріне сәйкес құпиялылық пен төлем қауіпсіздігі қағидаттары негізінде жүзеге асырылады. Ол үшін деректерді қорғалған байланыс арналары арқылы тексерудің, шифрлаудың және берудің заманауи хаттамалары (TLS/SSL) қолданылады.
                </p>
                <p>
                  1.3. Банктік карта деректерін енгізу Freedom Pay арнайы қорғалған төлем бетінде орындалады. Төлемді жүргізу үшін келесі деректер талап етіледі:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Картаның 16 таңбалы нөмірі;</li>
                  <li>Карта иесінің аты мен тегі (латын әріптерімен);</li>
                  <li>Картаның қолданылу мерзімі (айы мен жылы);</li>
                  <li>Үш таңбалы қауіпсіздік коды (VISA үшін CVV2, MasterCard үшін CVC2 — картаның сыртқы жағында).</li>
                </ul>
                <p>
                  1.4. Деректер енгізілгеннен кейін Пайдаланушы 3D-Secure растау кодын енгізу үшін эмитент-банк парақшасына қайта бағытталады (SMS немесе мобильді қосымшаның Push-хабарламасы). Егер 3D-Secure коды келмесе, картаны шығарған банкке жүгіну қажет.
                </p>
                <p>
                  1.5. <strong>Құпиялылық кепілдігі:</strong> Пайдаланушы ұсынатын барлық ақпарат қатаң құпия болып табылады. Төлем картасының деректері тек шифрланған түрде өңделеді және <code>tanbox.kz</code> серверлерінде сақталмайды.
                </p>
              </div>

              {/* Section 2 KZ */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">
                  2. Төлем жүргізуден бас тартылуы мүмкін жағдайлар
                </h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Банктік карта интернет арқылы төлемдер жасауға арналмаған немесе интернет-транзакциялар лимиті жабық (бұл туралы банк арқылы білуге болады);</li>
                  <li>Банктік карта шотында төлемді жүргізу үшін қаражат жеткіліксіз;</li>
                  <li>Банктік карта деректері қате енгізілген (нөмірі, мерзімі немесе CVC/CVV коды);</li>
                  <li>Банктік картаның жарамдылық мерзімі өтіп кеткен;</li>
                  <li>Эмитент-банктің тәуліктік немесе операциялық шектеулері асып кеткен.</li>
                </ul>
              </div>

              {/* Section 3 KZ */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">
                  3. Қаражатты қайтару тәртібі мен ережелері
                </h2>
                <p>
                  3.1. Банктік карталармен төленген кезде қолма-қол ақшалай қайтаруға <strong>жол берілмейді</strong>. Қайтару тәртібі халықаралық төлем жүйелерінің ережелерімен және ҚР «Тұтынушылардың құқықтарын қорғау туралы» Заңымен реттеледі.
                </p>
                <p>
                  3.2. Қаражат тек төлем жасалған сол банктік картаға қайтарылады.
                </p>
                <p>
                  3.3. Тұтынушы қызмет көрсетілгенге немесе дайын өнім жіберілгенге дейін кез келген уақытта тапсырыстан бас тартуға құқылы. Қызмет тиісті деңгейде көрсетілмеген немесе техникалық қателіктер орын алған жағдайда, қаражат толық көлемде қайтарылады.
                </p>
                <p>
                  3.4. Қаражатты қайтару үшін Тапсырыс беруші еркін үлгідегі өтінішті ресімдеп, төлем растамасымен бірге <strong>{COMPANY_CONTACTS.emails.info}</strong> электрондық мекенжайына жолдайды.
                </p>
                <p>
                  3.5. Қайтару туралы өтініш түскен сәттен бастап 10 (он) жұмыс күні ішінде қаралады. Банк картасына ақша түсу мерзімі эмитент-банктің регламентіне байланысты 3-тен 21 жұмыс күніне дейінгі мерзімді құрайды.
                </p>
              </div>

              {/* Section 4 KZ */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">
                  4. Қызметтерді көрсету және жеткізу тәртібі
                </h2>
                <p>
                  4.1. <strong>Электрондық қызметтер (Data Matrix кодтарын эмиссиялау):</strong> Төлем расталғаннан кейін дайын таңбалау кодтары Жеке кабинетте (<code>lk.tanbox.kz</code>) жүйенің өңдеуіне қарай қолжетімді болады.
                </p>
                <p>
                  4.2. <strong>Физикалық өнімдерді жеткізу (басылған жапсырмалар, роликтер):</strong> Дайын басылған өнімдер тапсырыс келісілгеннен кейін 1–3 жұмыс күні ішінде Алматы қаласындағы қоймадан өздігінен алып кету (самовывоз) арқылы немесе курьерлік қызметтермен (CDEK, Avis Logistics, Яндекс Доставка) Қазақстанның кез келген өңіріне жеткізіледі.
                </p>
                <p>
                  4.3. <strong>Көшпелі таңбалау қызметтері:</strong> Бригаданың Тапсырыс берушінің қоймасына шығу мерзімі мен кестесі өтінім ресімделген кезде жеке келісіледі.
                </p>
                <p>
                  4.4. <strong>Таңбалау аутсорсингі және жүйелерді жүргізу:</strong> Абоненттік қызмет көрсету немесе біржолғы өтінімдер бойынша көрсетіледі. Орындаушы ИС МПТ, СУЗ/OMS және ҰТК жүйелеріндегі операцияларды жүргізеді. Есепті кезеңнің (күнтізбелік айдың) нәтижелері бойынша Тапсырыс берушіге келесі айдың 10-күніне дейін ЭСФ және Орындалған жұмыстар актісі (Р-1 нысаны) ұсынылады.
                </p>
                <p>
                  4.5. <strong>Тауар карточкаларын каталогтау:</strong> Тапсырыс беруші номенклатура спецификациясын толық ұсынған сәттен бастап карточкаларды ҰТК және ТМБ АЖ жүйелеріне толтыру және модерацияға жіберу 1–3 жұмыс күні ішінде орындалады. Оператор тарапынан модерация мерзімі мемлекеттік регламенттерге сәйкес 24-тен 48 сағатқа дейін созылады.
                </p>
                <p>
                  4.6. <strong>Корпоративтік оқыту қызметтері:</strong> Тараптар келіскен күндері Google Meet / Zoom арқылы онлайн-сессиялар форматында өтеді. Сабақтардың бейнежазбалары, регламенттер мен әдістемелік PDF-нұсқаулықтар Тапсырыс берушіге шектеусіз пайдалану құқығымен тұрақты беріледі.
                </p>
              </div>

              {/* Contacts Note KZ */}
              <div className="pt-6 border-t border-gray-200 text-xs text-gray-600 space-y-1">
                <p>
                  Төлем, жеткізу және қайтару мәселелері бойынша қолдау қызметі: тел. <strong>{COMPANY_CONTACTS.phones.hotline}</strong>, email: <strong>{COMPANY_CONTACTS.emails.info}</strong>.
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
                  Online Card Payment Terms via Freedom Pay on TANBOX
                </p>
                <div className="flex justify-between items-center text-xs text-gray-500 pt-3">
                  <span>Almaty, Kazakhstan</span>
                  <span>Effective August 03, 2026</span>
                </div>
              </div>

              {/* Section 1 EN */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">
                  1. Bank Card Payment Terms
                </h2>
                <p>
                  1.1. Payment for digital marking services on <code>tanbox.kz</code> is processed using <strong>VISA</strong> and <strong>MasterCard</strong> bank cards via the secured <strong>Freedom Pay</strong> payment gateway.
                </p>
                <p>
                  1.2. Transactions comply with Visa and MasterCard international rules, employing TLS/SSL encryption protocols and PCI DSS certification.
                </p>
                <p>
                  1.3. Card details are entered on Freedom Pay's encrypted payment page: 16-digit card number, cardholder name, expiry date, and CVV2/CVC2 security code.
                </p>
                <p>
                  1.4. The customer is redirected to the card-issuing bank for <strong>3D-Secure</strong> authentication (SMS code or mobile app push).
                </p>
                <p>
                  1.5. <strong>Security guarantee:</strong> Sensitive payment data is encrypted and transferred directly to the processing center; card credentials are never stored on <code>tanbox.kz</code> servers.
                </p>
              </div>

              {/* Section 2 EN */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">
                  2. Payment Rejection Cases
                </h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Card is not enabled for online transactions (check with your bank);</li>
                  <li>Insufficient funds in the card account;</li>
                  <li>Incorrect card credentials entered (number, expiration date, or CVV2/CVC2);</li>
                  <li>Expired card validity;</li>
                  <li>Daily transaction limits exceeded.</li>
                </ul>
              </div>

              {/* Section 3 EN */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">
                  3. Refund Terms & Conditions
                </h2>
                <p>
                  3.1. Cash refunds for card payments are <strong>strictly prohibited</strong> by international payment network rules and the Law of RK "On Consumer Rights Protection".
                </p>
                <p>
                  3.2. Refunds are transferred exclusively to the original card used for payment.
                </p>
                <p>
                  3.3. Customers may cancel orders before service execution begins. If services were not provided or technical failures occurred, charges are refunded in full.
                </p>
                <p>
                  3.4. Refund requests should be emailed to <strong>{COMPANY_CONTACTS.emails.info}</strong> with order reference and proof of payment.
                </p>
                <p>
                  3.5. Requests are reviewed within 10 business days. Bank settlement takes between 3 and 21 business days depending on the card issuer.
                </p>
              </div>

              {/* Section 4 EN */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">
                  4. Service Delivery
                </h2>
                <p>
                  4.1. <strong>Digital Services (Data Matrix Codes):</strong> Downloadable in the Client Portal (<code>lk.tanbox.kz</code>) in PDF, CSV, Excel formats upon processing.
                </p>
                <p>
                  4.2. <strong>Printed Labels:</strong> Pick-up from our Almaty warehouse or courier delivery across Kazakhstan (CDEK, Avis Logistics, Yandex Delivery) within 1–3 business days.
                </p>
                <p>
                  4.3. <strong>Onsite Marking:</strong> Mobile team schedules are arranged individually upon order placement.
                </p>
                <p>
                  4.4. <strong>Serialization Outsourcing & Account Management:</strong> Rendered on a recurring monthly retainer or per-project basis. The Contractor operates statutory systems (IS MPT, OMS/SUZ, NKT). Monthly deliverables are formalized via Electronic Tax Invoices (ESF) and Form R-1 Completion Acts submitted by the 10th day of the following calendar month.
                </p>
                <p>
                  4.5. <strong>Product SKU Card Registration:</strong> Data entry and submission to NKT and IS MPT registries are performed within 1–3 business days following receipt of complete specifications from the Customer. National registry moderation turnaround is subject to statutory operator timelines (24–48 hours).
                </p>
                <p>
                  4.6. <strong>Corporate Training Services:</strong> Conducted remotely via scheduled interactive Google Meet / Zoom sessions. Course video recordings, standard operating procedures, and PDF guidebooks are provided to the Customer for permanent retention upon session completion.
                </p>
              </div>

              {/* Contacts Note EN */}
              <div className="pt-6 border-t border-gray-200 text-xs text-gray-600 space-y-1">
                <p>
                  Support hotline: <strong>{COMPANY_CONTACTS.phones.hotline}</strong>, email: <strong>{COMPANY_CONTACTS.emails.info}</strong>.
                </p>
                <p>
                  Full legal and banking details are available in the{' '}
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
                  Порядок оплаты, доставки и правила возврата
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-gray-700">
                  Условия проведения онлайн-платежей банковскими картами (Freedom Pay) в сервисе TANBOX
                </p>
                <div className="flex justify-between items-center text-xs text-gray-500 pt-3">
                  <span>г. Алматы</span>
                  <span>Редакция от 03 августа 2026 года</span>
                </div>
              </div>

              {/* Section 1 RU */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">
                  1. Оплата банковскими картами через интернет
                </h2>
                <p>
                  1.1. Оплата услуг и товаров цифровой маркировки на сайте <code>tanbox.kz</code> осуществляется банковскими картами <strong>VISA</strong> и <strong>MasterCard</strong> через защищенный платежный шлюз <strong>Freedom Pay</strong> (Freedom Finance).
                </p>
                <p>
                  1.2. Услуга оплаты через интернет осуществляется в соответствии с Правилами международных платежных систем Visa и MasterCard на принципах соблюдения конфиденциальности и безопасности совершения платежа, для чего используются современные методы проверки, шифрования и передачи данных по закрытым каналам связи (протокол TLS/SSL).
                </p>
                <p>
                  1.3. Ввод данных банковской карты осуществляется на защищенной платежной странице <strong>Freedom Pay</strong>. На странице для ввода данных потребуется указать:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Номер банковской карты (16 цифр);</li>
                  <li>Имя и фамилию владельца карты (латинскими буквами так, как указано на карте);</li>
                  <li>Срок действия карты (месяц и год);</li>
                  <li>Трёхзначный код безопасности (CVV2 для VISA или CVC2 для MasterCard — три цифры на оборотной стороне карты).</li>
                </ul>
                <p>
                  1.4. Далее Покупатель перенаправляется на страницу банка-эмитента для ввода кода <strong>3D-Secure</strong>, который поступает в СМС-сообщении либо Push-уведомлении банковского приложения. Если код 3D-Secure не поступил, необходимо обратиться в банк, выпустивший карту.
                </p>
                <p>
                  1.5. <strong>Безопасность и конфиденциальность:</strong> Предоставляемая персональная информация является строго конфиденциальной. Данные банковской карты передаются только в зашифрованном виде напрямую в процессинговый центр и <strong>не сохраняются на веб-сервере tanbox.kz</strong>.
                </p>
              </div>

              {/* Section 2 RU */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">
                  2. Случаи возможного отказа в совершении платежа
                </h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Банковская карта не предназначена для совершения платежей через интернет либо закрыт лимит на интернет-покупки (можно узнать в банке-эмитенте);</li>
                  <li>Недостаточно средств для оплаты на счете банковской карты;</li>
                  <li>Данные банковской карты введены неверно (ошибка в номере карты, дате действия или CVV2/CVC2);</li>
                  <li>Истек срок действия банковской карты (месяц и год указаны на лицевой стороне карты);</li>
                  <li>Превышены суточные лимиты на проведение безналичных операций, установленные банком-эмитентом.</li>
                </ul>
              </div>

              {/* Section 3 RU */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">
                  3. Правила и порядок возврата денежных средств
                </h2>
                <p>
                  3.1. При оплате банковскими картами возврат наличными денежными средствами <strong>не допускается</strong>. Порядок возврата регулируется правилами международных платежных систем Visa и MasterCard, а также нормами Закона Республики Казахстан «О защите прав потребителей».
                </p>
                <p>
                  3.2. Возврат денежных средств осуществляется <strong>исключительно на ту банковскую карту</strong>, с которой была произведена исходная оплата заказа.
                </p>
                <p>
                  3.3. Потребитель вправе отказаться от услуги или товара до момента начала оказания услуг (эмиссии кодов, запуска тиража в печать). В случае неоказания услуги либо технических сбоев списание аннулируется, а средства возвращаются в полном объеме.
                </p>
                <p>
                  3.4. Для оформления возврата денежных средств Заказчик направляет заявление в свободной форме с указанием номера заказа, даты платежа и контактных данных на электронный адрес: <strong>{COMPANY_CONTACTS.emails.info}</strong>.
                </p>
                <p>
                  3.5. Срок рассмотрения заявления составляет до 10 (десяти) рабочих дней. Фактический срок зачисления денежных средств на банковскую карту Заказчика зависит от банка-эмитента и обычно составляет от 3 до 21 рабочего дня.
                </p>
              </div>

              {/* Section 4 RU */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">
                  4. Правила оказания услуг и доставки товара
                </h2>
                <p>
                  4.1. <strong>Электронные услуги (эмиссия и валидация кодов):</strong> Предоставление сформированных кодов маркировки Data Matrix осуществляется в цифровом виде в Личном кабинете <code>lk.tanbox.kz</code> (выгрузка в форматах PDF, CSV, Excel) сразу после успешной обработки запроса Единым оператором ИС МПТ (АО «Казахтелеком»).
                </p>
                <p>
                  4.2. <strong>Физическая продукция (печать этикеток на рулонах):</strong> Срок изготовления составляет от 1 до 3 рабочих дней с момента согласования макета. Получение готовой продукции осуществляется:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Самовывозом со склада в г. Алматы (по предварительному согласованию);</li>
                  <li>Курьерской доставкой до двери клиента (Яндекс Доставка, CDEK, Avis Logistics) по Алматы и всем регионам Республики Казахстан.</li>
                </ul>
                <p>
                  4.3. <strong>Выездные услуги (оклейка на складе Заказчика):</strong> Дата, время и адрес выезда мобильной бригады согласуются индивидуально при оформлении заказа.
                </p>
                <p>
                  4.4. <strong>Аутсорсинг процессов маркировки и регулярное обслуживание:</strong> Оказывается на абонентской ежемесячной основе либо в формате разового проекта. Исполнитель выполняет функции оператора в государственных системах ИС МПТ, СУЗ/OMS и НКТ. Результаты отчетного месяца оформляются Актом выполненных работ (форма Р-1) и ЭСФ, направляемыми Заказчику до 10 числа месяца, следующего за отчетным.
                </p>
                <p>
                  4.5. <strong>Регистрация карточек товаров в каталогах:</strong> Заполнение атрибутивного состава и передача на модерацию в каталоги НКТ и ИС МПТ выполняются в течение 1–3 рабочих дней с момента предоставления Заказчиком спецификаций. Сроки государственной модерации регулируются регламентами операторов (от 24 до 48 часов). Результат — статус одобренной карточки с возможностью заказа Data Matrix.
                </p>
                <p>
                  4.6. <strong>Корпоративное обучение персонала:</strong> Проводится по согласованному графику в онлайн-формате (интерактивные видеосессии в Google Meet / Zoom). Записи проведенных занятий, методические инструкции в формате PDF и шаблоны внутренних регламентов передаются Заказчику в бессрочный доступ по завершении курса.
                </p>
              </div>

              {/* Contacts Note RU */}
              <div className="pt-6 border-t border-gray-200 text-xs text-gray-600 space-y-1">
                <p>
                  Служба поддержки по вопросам оплаты, доставки и возврата: тел. <strong>{COMPANY_CONTACTS.phones.hotline}</strong>, email: <strong>{COMPANY_CONTACTS.emails.info}</strong>.
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
