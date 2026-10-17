import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { COMPANY_CONTACTS, getLocalizedCompanyContacts } from '../data/companyContacts';
import { setPageSeo } from '../utils/seo';
import { useLanguage } from '../context/LanguageContext';

export const PrivacyPolicyPage: React.FC = () => {
  const { lang, getLocalizedPath } = useLanguage();
  const localizedContacts = getLocalizedCompanyContacts(lang);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (lang === 'kz') {
      setPageSeo(
        'Құпиялылық және дербес деректерді өңдеу саясаты | TANBOX.KZ',
        'ҚР № 94-V «Дербес деректер және оларды қорғау туралы» Заңына сәйкес TANBOX.KZ сервисінің құпиялылық саясаты.'
      );
    } else if (lang === 'en') {
      setPageSeo(
        'Privacy Policy & Personal Data Processing | TANBOX.KZ',
        'Privacy and personal data protection policy of TANBOX.KZ in compliance with the Republic of Kazakhstan Law No. 94-V.'
      );
    } else {
      setPageSeo(
        'Политика конфиденциальности и обработки персональных данных | TANBOX.KZ',
        'Политика конфиденциальности и защиты персональных данных пользователей сервиса TANBOX.KZ в соответствии с Законом Республики Казахстан № 94-V.'
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
                  Құпиялылық саясаты
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-gray-700">
                  және TANBOX сервисінде дербес деректерді өңдеу тәртібі
                </p>
                <div className="flex justify-between items-center text-xs text-gray-500 pt-3">
                  <span>Алматы қ.</span>
                  <span>2026 жылғы 03 тамыздағы редакция</span>
                </div>
              </div>

              {/* Section 1 KZ */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">1. Жалпы ережелер</h2>
                <p>1.1. Осы Құпиялылық саясаты (бұдан әрі — «Саясат») Қазақстан Республикасының 2013 жылғы 21 мамырдағы № 94-V «Дербес деректер және оларды қорғау туралы» Заңына сәйкес TANBOX сервисі пайдаланушыларының дербес деректерін жинау, өңдеу, сақтау, тарату және жою тәртібін белгілейді.</p>
                <p>1.2. Дербес деректерді қамтитын дерекқордың Операторы — {COMPANY_CONTACTS.legal.companyName} (ЖСН {COMPANY_CONTACTS.legal.iin}, мекенжайы: {localizedContacts.addressFull}) (бұдан әрі — «Оператор»).</p>
                <p>1.3. <code>lk.tanbox.kz</code> Жеке кабинетіне тіркелу, таңбалауға өтінім беру немесе <code>tanbox.kz</code> сайтының кез келген функционалын пайдалану Пайдаланушының осы Саясатпен толық және сөзсіз келісімін білдіреді.</p>
              </div>

              {/* Section 2 KZ */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">2. Жиналатын дербес деректердің құрамы</h2>
                <p>2.1. Қызмет көрсету аясында Оператор келесі деректерді жинайды және өңдейді:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Басшының, жеке кәсіпкердің немесе уәкілетті тұлғаның тегі, аты, әкесінің аты;</li>
                  <li>Ұйымның Жеке сәйкестендіру нөмірі (ЖСН) немесе Бизнес-сәйкестендіру нөмірі (БСН);</li>
                  <li>Байланыс ұялы және қалалық телефон нөмірі;</li>
                  <li>Электрондық пошта мекенжайы (e-mail);</li>
                  <li>Кәсіпкерлік субъектісінің атауы (ЖШС, ЖК);</li>
                  <li>Тауарларды таңбалау / оклейка жасау жүргізілетін қойманың немесе объектінің нақты мекенжайы;</li>
                  <li>Желілік қосылудың техникалық деректері: IP-мекенжай, браузер түрі, cookie файлдары.</li>
                </ul>
              </div>

              {/* Section 3 KZ */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">3. Деректерді жинау мен өңдеудің мақсаттары</h2>
                <p>3.1. Дербес деректер Оператор тарапынан тек келесі мақсаттар үшін өңделеді:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Оператормен шарттар мен келісімдер шеңберінде тарапты сәйкестендіру;</li>
                  <li>«Таңба» АЖ жүйесінде (ҚР таңбалаудың бірыңғай операторы) Data Matrix кодтарын шығаруды, дайындауды және жапсыруды қамтамасыз ету;</li>
                  <li>Ұлттық тауарлар каталогына (ҰТК) тауар карточкаларын енгізу;</li>
                  <li>Тапсырыс берушінің қоймасына мобильді оклейка бригадаларының шығуын ұйымдастыру;</li>
                  <li>Шот-фактураларды, орындалған жұмыс актілерін (Р-1) және бастапқы құжаттарды ҚР заңнамасына сай ресімдеу;</li>
                  <li>Клиенттік және техникалық қолдау көрсету.</li>
                </ul>
              </div>

              {/* Section 4 KZ */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">4. Деректерді сақтау және оқшаулау тәртібі</h2>
                <p>4.1. ҚР «Дербес деректер және оларды қорғау туралы» Заңының 12-бабы 2-тармағының талаптарына сәйкес, Қазақстан Республикасының жеке және заңды тұлғаларының дербес деректерін қамтитын дерекқорлар Қазақстан Республикасының аумағында физикалық түрде орналасқан серверлерде сақталады.</p>
                <p>4.2. Дербес деректерді сақтау өңдеу мақсаттарына қол жеткізу мерзімі ішінде немесе дербес деректер субъектісі келісімін кері қайтарып алғанға дейін жүзеге асырылады.</p>
              </div>

              {/* Section 5 KZ */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">5. Құпиялылық және үшінші тұлғаларға беру</h2>
                <p>5.1. Оператор дербес деректерді субъектінің келісімінсіз үшінші тұлғаларға жария етпеуге және бермеуге міндеттенеді, тек ҚР заңдарында көзделген негіздер бойынша мемлекеттік органдарға (ҚР ҚМ МКК, сот органдары) беру жағдайлары бұған жатпайды.</p>
                <p>5.2. Тауар номенклатурасы мен кодтары туралы мәліметтерді ҚР Таңбалаудың бірыңғай жүйесіне («Таңба» АЖ) беру қызметтерді көрсету мақсатында Тапсырыс берушінің тікелей тапсырмасы бойынша орындалады.</p>
                <p>5.3. Freedom Pay төлем шлюзі арқылы банктік карталармен төлем жасау кезінде құпия карта деректері (нөмірі, мерзімі, CVC/CVV) Пайдаланушы тарапынан тек Freedom Pay қорғалған бетінде енгізіледі. Төлемдер PCI DSS стандарттарына сәйкес өңделеді және Оператордың (TANBOX.KZ) серверлерінде сақталмайды.</p>
              </div>

              {/* Section 6 KZ */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">6. Дербес деректер субъектісінің құқықтары</h2>
                <p>6.1. Субъект өзінің дербес деректерін өңдеуге қатысты ақпарат алуға, егер деректер толық емес, ескірген немесе заңсыз алынған болса, оларды нақтылауды, бұғаттауды немесе жоюды талап етуге құқылы.</p>
                <p>6.2. Келісімді кері қайтарып алу келесі электрондық мекенжайға жазбаша хабарлама жіберу арқылы жүзеге асырылады: <code>{COMPANY_CONTACTS.emails.info}</code>.</p>
              </div>

              {/* Requisites Table KZ */}
              <div className="pt-6 border-t border-gray-200 space-y-3">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">7. Оператор туралы мәліметтер</h2>
                <table className="w-full border-collapse border border-gray-300 text-xs">
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-2.5 font-bold w-1/3 bg-gray-50">Оператор</td>
                      <td className="border border-gray-300 p-2.5 font-semibold">{COMPANY_CONTACTS.legal.companyName}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2.5 font-bold bg-gray-50">ЖСН</td>
                      <td className="border border-gray-300 p-2.5">{COMPANY_CONTACTS.legal.iin}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2.5 font-bold bg-gray-50">Мекенжай</td>
                      <td className="border border-gray-300 p-2.5">{localizedContacts.addressFull}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2.5 font-bold bg-gray-50">Байланыс</td>
                      <td className="border border-gray-300 p-2.5">Тел.: {COMPANY_CONTACTS.phones.hotline} • Email: {COMPANY_CONTACTS.emails.info}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          ) : lang === 'en' ? (
            <>
              {/* Header EN */}
              <div className="text-center space-y-2 pb-6 border-b border-gray-200">
                <h1 className="text-base sm:text-lg font-bold uppercase tracking-wide text-black">
                  Privacy Policy
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-gray-700">
                  and Personal Data Processing in the TANBOX Service
                </p>
                <div className="flex justify-between items-center text-xs text-gray-500 pt-3">
                  <span>Almaty, Kazakhstan</span>
                  <span>Effective August 03, 2026</span>
                </div>
              </div>

              {/* Section 1 EN */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">1. General Provisions</h2>
                <p>1.1. This Privacy Policy (hereinafter "Policy") governs the collection, processing, storage, and protection of personal data in strict compliance with the Law of the Republic of Kazakhstan No. 94-V dated May 21, 2013 "On Personal Data and Their Protection".</p>
                <p>1.2. The Personal Data Database Operator is {COMPANY_CONTACTS.legal.companyName} (IIN {COMPANY_CONTACTS.legal.iin}, Address: {localizedContacts.addressFull}) (hereinafter "Operator").</p>
                <p>1.3. Registering in the Client Portal <code>lk.tanbox.kz</code>, placing a serialization order, or using the <code>tanbox.kz</code> website constitutes full acceptance of this Policy.</p>
              </div>

              {/* Section 2 EN */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">2. Scope of Collected Personal Data</h2>
                <p>2.1. In providing marking services, the Operator processes the following data:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Full name of company executive, sole proprietor, or authorized representative;</li>
                  <li>Business Identification Number (BIN) or Individual Identification Number (IIN);</li>
                  <li>Contact telephone numbers (mobile and landline);</li>
                  <li>Corporate and personal email addresses;</li>
                  <li>Company legal entity name (LLP, Sole Proprietorship);</li>
                  <li>Warehouse address designated for sticker application;</li>
                  <li>Network connectivity metadata: IP address, browser user-agent, cookies.</li>
                </ul>
              </div>

              {/* Section 3 EN */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">3. Purpose of Data Processing</h2>
                <p>3.1. Personal data is collected solely for the following business objectives:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Contractual counterparty identification and execution;</li>
                  <li>Managing Data Matrix code issuance and verification in IS Tanba (National Operator of KZ);</li>
                  <li>Registering product master data in the National Product Catalog (NKT);</li>
                  <li>Scheduling mobile labeling crews to client terminals;</li>
                  <li>Generating formal accounting invoices, completion certificates, and electronic invoices (ESF);</li>
                  <li>Providing operational and technical support.</li>
                </ul>
              </div>

              {/* Section 4 EN */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">4. Data Localization and Storage</h2>
                <p>4.1. Pursuant to paragraph 2 of Article 12 of RK Law No. 94-V, databases containing personal data of Kazakhstan entities are physically localized and hosted on certified server infrastructure within the Republic of Kazakhstan.</p>
                <p>4.2. Data is retained for the duration required to achieve business purposes or until consent is revoked by the data subject, subject to tax and statutory accounting recordkeeping requirements.</p>
              </div>

              {/* Section 5 EN */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">5. Confidentiality & Third-Party Disclosure</h2>
                <p>5.1. The Operator maintains strict confidentiality and does not disclose personal data to third parties without consent, except as legally required by Kazakhstan state authorities (State Revenue Committee, judicial subpoenas).</p>
                <p>5.2. Transmission of SKU specifications and serialization codes to the state track & trace operator (IS Tanba) occurs pursuant to client authorization for service fulfillment.</p>
              </div>

              {/* Section 6 EN */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">6. Data Subject Rights</h2>
                <p>6.1. Subjects have the right to request access to, correction of, or deletion of their personal records if data is inaccurate or incomplete.</p>
                <p>6.2. Consent revocation requests may be submitted electronically to: <code>{COMPANY_CONTACTS.emails.info}</code>.</p>
              </div>

              {/* Requisites Table EN */}
              <div className="pt-6 border-t border-gray-200 space-y-3">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">7. Operator Information</h2>
                <table className="w-full border-collapse border border-gray-300 text-xs">
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-2.5 font-bold w-1/3 bg-gray-50">Operator</td>
                      <td className="border border-gray-300 p-2.5 font-semibold">{COMPANY_CONTACTS.legal.companyName}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2.5 font-bold bg-gray-50">IIN</td>
                      <td className="border border-gray-300 p-2.5">{COMPANY_CONTACTS.legal.iin}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2.5 font-bold bg-gray-50">Address</td>
                      <td className="border border-gray-300 p-2.5">{localizedContacts.addressFull}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2.5 font-bold bg-gray-50">Contacts</td>
                      <td className="border border-gray-300 p-2.5">Tel: {COMPANY_CONTACTS.phones.hotline} • Email: {COMPANY_CONTACTS.emails.info}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              {/* Header RU */}
              <div className="text-center space-y-2 pb-6 border-b border-gray-200">
                <h1 className="text-base sm:text-lg font-bold uppercase tracking-wide text-black">
                  Политика конфиденциальности
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-gray-700">
                  и обработки персональных данных в сервисе TANBOX
                </p>
                <div className="flex justify-between items-center text-xs text-gray-500 pt-3">
                  <span>г. Алматы</span>
                  <span>Редакция от 03 августа 2026 года</span>
                </div>
              </div>

              {/* Section 1 RU */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">1. Общие положения</h2>
                <p>1.1. Настоящая Политика конфиденциальности (далее — «Политика») определяет порядок сбора, систематизации, накопления, хранения, уточнения, использования, передачи и уничтожения персональных данных пользователей сервиса TANBOX в строгом соответствии с Законом Республики Казахстан от 21 мая 2013 года № 94-V «О персональных данных и их защите».</p>
                <p>1.2. Оператором базы данных, содержащей персональные данные, является {COMPANY_CONTACTS.legal.companyName} (ИИН {COMPANY_CONTACTS.legal.iin}, адрес: {COMPANY_CONTACTS.address.full}) (далее — «Оператор»).</p>
                <p>1.3. Регистрация в Личном кабинете <code>lk.tanbox.kz</code>, оформление заявки на маркировку либо использование любых функциональных возможностей сайта <code>tanbox.kz</code> означает полное и безоговорочное согласие Пользователя с настоящей Политикой.</p>
              </div>

              {/* Section 2 RU */}
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

              {/* Section 3 RU */}
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

              {/* Section 4 RU */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">4. Локализация и порядок хранения данных</h2>
                <p>4.1. В соответствии с требованиями пункта 2 статьи 12 Закона РК «О персональных данных и их защите», базы данных, содержащие персональные данные физических и юридических лиц Республики Казахстан, физически размещаются на серверах, расположенных на территории Республики Казахстан.</p>
                <p>4.2. Хранение персональных данных осуществляется в течение срока, необходимого для достижения целей обработки, либо до момента отзыва согласия субъектом персональных данных, если более длительный срок хранения не предусмотрен законодательством РК о бухгалтерском и налоговом учете.</p>
              </div>

              {/* Section 5 RU */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">5. Конфиденциальность и передача третьим лицам</h2>
                <p>5.1. Оператор обязуется не разглашать и не передавать персональные данные третьим лицам без согласия субъекта, за исключением передачи государственным органам (КГД МФ РК, судебные органы, правоохранительные органы) по основаниям и в порядке, установленным законами Республики Казахстан.</p>
                <p>5.2. Передача сведений о товарной номенклатуре и кодах в Единую систему маркировки РК (ИС Танба) осуществляется в рамках прямого поручения Заказчика для исполнения услуг маркировки.</p>
                <p>5.3. При проведении оплаты банковскими картами через шлюз интернет-эквайринга Freedom Pay, конфиденциальные данные карты (номер, срок действия, CVV2/CVC2) вводятся Пользователем исключительно на защищенной платежной странице Freedom Pay по зашифрованному протоколу TLS/SSL и обрабатываются в строгом соответствии со стандартами безопасности данных индустрии платежных карт PCI DSS. Оператор не сохраняет и не обрабатывает на своих веб-серверах данные банковских карт Пользователей.</p>
              </div>

              {/* Section 6 RU */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">6. Права субъекта персональных данных</h2>
                <p>6.1. Субъект имеет право на получение информации, касающейся обработки его персональных данных, требование их уточнения, блокирования или уничтожения в случае, если данные являются неполными, устаревшими или незаконно полученными.</p>
                <p>6.2. Отзыв согласия на обработку данных осуществляется путем направления письменного уведомления на электронный адрес: <code>{COMPANY_CONTACTS.emails.info}</code>.</p>
              </div>

              {/* Requisites Table RU */}
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
            </>
          )}

        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
