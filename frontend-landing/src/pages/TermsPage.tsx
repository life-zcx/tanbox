import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { COMPANY_CONTACTS, getLocalizedCompanyContacts } from '../data/companyContacts';
import { setPageSeo } from '../utils/seo';
import { useLanguage } from '../context/LanguageContext';

export const TermsPage: React.FC = () => {
  const { lang, getLocalizedPath } = useLanguage();
  const localizedContacts = getLocalizedCompanyContacts(lang);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (lang === 'kz') {
      setPageSeo(
        `Жария оферта шарты | ${COMPANY_CONTACTS.legal.companyName} — TANBOX.KZ`,
        `Қазақстан Республикасында Data Matrix цифрлық таңбалау және агрегация қызметтерін көрсетуге арналған жария оферта шарты. Орындаушы: ${COMPANY_CONTACTS.legal.companyName}.`
      );
    } else if (lang === 'en') {
      setPageSeo(
        `Public Offer Agreement | ${COMPANY_CONTACTS.legal.companyName} — TANBOX.KZ`,
        `Public offer agreement for digital product marking (Data Matrix) and aggregation services in Kazakhstan. Contractor: ${COMPANY_CONTACTS.legal.companyName}.`
      );
    } else {
      setPageSeo(
        `Публичная оферта | ${COMPANY_CONTACTS.legal.companyName} — TANBOX.KZ`,
        `Договор публичной оферты на оказание услуг по цифровой маркировке товаров Data Matrix и агрегации в Республике Казахстан. Исполнитель: ${COMPANY_CONTACTS.legal.companyName}.`
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
                  Жария шарт-оферта
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-gray-700">
                  тауарларды цифрлық таңбалау қызметтерін ақылы көрсетуге
                </p>
                <div className="flex justify-between items-center text-xs text-gray-500 pt-3">
                  <span>Алматы қ.</span>
                  <span>2026 жылғы 03 тамыздағы редакция</span>
                </div>
              </div>

              {/* Preamble KZ */}
              <p>
                Қазақстан Республикасының заңнамасы негізінде әрекет ететін {COMPANY_CONTACTS.legal.companyName}, ЖСН {COMPANY_CONTACTS.legal.iin}, бұдан әрі <strong>«Орындаушы»</strong> деп аталатын, бір тараптан, Қазақстан Республикасы Азаматтық кодексінің 395 және 396-баптарына сәйкес жария оферта болып табылатын осы ұсынысты кез келген заңды тұлғаға немесе жеке кәсіпкерге (бұдан әрі — <strong>«Тапсырыс беруші»</strong>) осы Шарттың талаптарын толық және сөзсіз акцепттеу арқылы жариялайды.
              </p>

              {/* Section 1 KZ */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">1. Терминдер мен анықтамалар</h2>
                <p>1.1. <strong>Оферта</strong> — <code>tanbox.kz</code> сайтында еркін қолжетімділікте жарияланған осы құжат.</p>
                <p>1.2. <strong>Офертаны акцепттеу</strong> — <code>lk.tanbox.kz</code> Жеке кабинетінде тіркелу, Тапсырысты ресімдеу немесе қызметтер үшін толық немесе ішінара төлем жасау арқылы Тапсырыс берушінің Оферта талаптарын толық және сөзсіз қабылдауы.</p>
                <p>1.3. <strong>«Таңба» АЖ (ТМБ АЖ)</strong> — Қазақстан Республикасындағы тауарларды таңбалау мен қадағалаудың ақпараттық жүйесі (Бірыңғай оператор «Қазақтелеком» АҚ).</p>
                <p>1.4. <strong>Data Matrix коды</strong> — Қазақстан Республикасының мемлекеттік үлгідегі екі өлшемді цифрлық сәйкестендіру коды.</p>
                <p>1.5. <strong>Орындалған жұмыстар актісі</strong> — Қазақстан Республикасының бастапқы бухгалтерлік құжаты (ҚР Қаржы министрлігінің 20.12.2012 жылғы № 562 бұйрығымен бекітілген Р-1 нысаны).</p>
              </div>

              {/* Section 2 KZ */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">2. Шарттың мәні</h2>
                <p>2.1. Орындаушы Тапсырыс берушінің тапсырмасы бойынша тауарларды цифрлық таңбалауға байланысты қызметтер кешенін көрсетуге, ал Тапсырыс беруші осы Шартта белгіленген тәртіппен және шарттармен қызметтерді қабылдауға және ақысын төлеуге міндеттенеді.</p>
                <p>2.2. Қызметтердің нақты тізімі, көлемі, тарифі, мерзімдері мен құны Тапсырыс беруші Жеке кабинетте Тапсырысты қалыптастырған кезде анықталады және Төлем шотында және Орындалған жұмыстар актісінде көрсетіледі.</p>
                <p>2.3. Қызметтер кешеніне мыналар кіруі мүмкін: «Таңба» АЖ-де кодтарға тапсырыс беру және эмиссиялау, жапсырма макеттерін әзірлеу, өнеркәсіптік термотрансферлік басып шығару, Тапсырыс берушінің қоймасында тауарларды оклейка жасау, көліктік қаптама кодтарын (SSCC) қалыптастыру және ҚР бойынша курьерлік жеткізу.</p>
              </div>

              {/* Section 3 KZ */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">3. Жапсырма макеттерін келісу тәртібі</h2>
                <p>3.1. Жапсырма макетін әзірлеу қызметтеріне тапсырыс берген кезде Орындаушы Тапсырыс беруші ұсынған параметрлерге және Кеден одағының / ЕАЭО техникалық регламенттерінің талаптарына сәйкес макет дайындайды.</p>
                <p>3.2. Жеке кабинет интерфейсінде «Макетті келісу» батырмасын басу макеттің түпкілікті бекітілгенін растайтын заңды мәні бар әрекет болып табылады.</p>
                <p>3.3. Макет келісілген сәттен бастап Тапсырыс беруші тауар атауының, артикулдың, құрамының, EAN-13 штрихкодтарының және сәйкестік белгілерінің дұрыстығына жеке жауапты болады. Басып шығару басталғаннан кейін бекітілген макеттің мазмұны бойынша шағымдар қабылданбайды.</p>
              </div>

              {/* Section 4 KZ */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">4. Қызметтердің құны және есеп айырысу тәртібі</h2>
                <p>4.1. Қызметтердің құны Орындаушының қолданыстағы тарифтері негізінде анықталады және Қазақстан Республикасының ұлттық валютасында — теңгемен (₸) бекітіледі.</p>
                <p>4.2. ҚР Салық кодексінің 367-бабы 1-тармағының 1-тармақшасына сәйкес Орындаушының қызметтеріне <strong>ҚҚС салынбайды</strong> (Орындаушы оңайлатылған декларация негізінде арнайы салық режимін қолданады).</p>
                <p>4.3. Төлем Тапсырыс беруші тарапынан Төлем шоты негізінде Орындаушының банктік шотына қолма-қол ақшасыз аудару арқылы, немесе Freedom Pay қорғалған шлюзі арқылы VISA және MasterCard карталарымен онлайн-төлем жасау арқылы, сондай-ақ Kaspi Pay төлем сервистері арқылы жүзеге асырылады.</p>
                <p>4.4. Банктік карталармен төлеу тәртібі, қаражатты қайтару және жеткізу ережелері Сайттағы <code>tanbox.kz/payment-procedure</code> мекенжайында жарияланған «Төлем тәртібі, жеткізу және қайтару ережелері» құжатымен реттеледі. Картамен төленген қаражатты қайтару тек төлем жасалған сол банктік картаға жүргізіледі.</p>
              </div>

              {/* Section 5 KZ */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">5. Қызметтерді тапсыру-қабылдау тәртібі</h2>
                <p>5.1. Көрсетілген қызметтерді тапсыру-қабылдау қағаз жеткізгіште немесе электронды түрде (ЭШФ АЖ-де ЭАВР) Р-1 нысаны бойынша Орындалған жұмыстар актісімен рәсімделеді.</p>
                <p>5.2. Тапсырыс беруші кодтар ұсынылғаннан / тираж жөнелтілгеннен бастап 3 (үш) жұмыс күні ішінде Актіні қарап, қол қоюға немесе жазбаша дәлелді бас тартуды жіберуге міндетті.</p>
                <p>5.3. Егер белгіленген 3 күндік мерзімде қол қойылған Акт немесе жазбаша бас тарту жіберілмесе, қызметтер толық көлемде, тиісті сапада көрсетілген және сөзсіз қабылданған болып есептеледі.</p>
              </div>

              {/* Section 6 KZ */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">6. Қызметтерден бас тарту және ақшалай қаражатты қайтару тәртібі</h2>
                <p>6.1. Тапсырыс беруші «Тұтынушылардың құқықтарын қорғау туралы» ҚР Заңында және ҚР Азаматтық кодексінде көзделген тәртіппен және талаптармен қызметтерден бас тартуға құқылы.</p>
                <p>6.2. Тапсырыс беруші тиісті сапада толық орындалған (көрсетілген) қызметтерден бас тартуға құқылы емес.</p>
                <p>6.3. Тапсырыс беруші орындау басталғанға дейін бас тартқан кезде, Орындаушы Тапсырыс беруші төлеген соманы Орындаушының нақты шеккен шығыстарын шегергенде қайтарады.</p>
                <p>6.4. Freedom Pay шлюзі арқылы банктік картамен төлеу кезінде ақшалай қаражатты қайтару қолма-қол ақшасыз тәртіппен тек төлем жасалған сол банктік картаға жүргізіледі (өтініш қаралғаннан кейін 10 жұмыс күніне дейін, банктердің есеп айырысуы 3-тен 21 жұмыс күніне дейін). Қолма-қол ақшамен қайтару жүргізілмейді.</p>
                <p>6.5. Қайтару рәсімі туралы толық мәліметтер Сайттағы <code>tanbox.kz/payment-procedure</code> мекенжайындағы «Төлем тәртібі, жеткізу және қайтару ережелері» құжатында көрсетілген.</p>
              </div>

              {/* Section 7 KZ */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">7. Тараптардың жауапкершілігі және дауларды шешу</h2>
                <p>7.1. Міндеттемелерді орындамағаны немесе тиісінше орындамағаны үшін тараптар Қазақстан Республикасының заңнамасына сәйкес жауапты болады.</p>
                <p>7.2. Орындаушы жағылған Data Matrix кодтарының стандартты 2D сканерлерімен 100% өнеркәсіптік оқылуына кепілдік береді.</p>
                <p>7.3. Тапсырыс беруші таңбаланған тауарларды Қазақстан Республикасы аумағында заңды айналымға енгізу үшін дербес жауапты болады.</p>
                <p>7.4. Даулар жауап беру мерзімі 10 (он) күнтізбелік күн болатын талап қою тәртібімен шешіледі. Келісімге қол жеткізілмеген жағдайда даулар Орындаушының орналасқан жері бойынша сотқа беріледі.</p>
              </div>

              {/* Section 8 KZ */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">8. Шарттың қолданылу мерзімі</h2>
                <p>8.1. Осы Шарт Тапсырыс беруші Офертаны акцепттеген сәттен бастап күшіне енеді және тараптар қабылданған міндеттемелерді толық орындағанға дейін қолданылады.</p>
              </div>

              {/* Requisites Table KZ */}
              <div className="pt-6 border-t border-gray-200 space-y-3">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">9. Орындаушының деректемелері</h2>
                <table className="w-full border-collapse border border-gray-300 text-xs">
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-2.5 font-bold w-1/3 bg-gray-50">Орындаушы</td>
                      <td className="border border-gray-300 p-2.5 font-semibold">{COMPANY_CONTACTS.legal.companyName}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2.5 font-bold bg-gray-50">ЖСН</td>
                      <td className="border border-gray-300 p-2.5">{COMPANY_CONTACTS.legal.iin}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2.5 font-bold bg-gray-50">Банктік деректемелер</td>
                      <td className="border border-gray-300 p-2.5">{COMPANY_CONTACTS.legal.bank}, шот: {COMPANY_CONTACTS.legal.iik}</td>
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
                  Public Offer Agreement
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-gray-700">
                  for the Provision of Digital Product Marking Services
                </p>
                <div className="flex justify-between items-center text-xs text-gray-500 pt-3">
                  <span>Almaty, Kazakhstan</span>
                  <span>Effective August 03, 2026</span>
                </div>
              </div>

              {/* Preamble EN */}
              <p>
                {COMPANY_CONTACTS.legal.companyName}, acting in accordance with the legislation of the Republic of Kazakhstan, IIN {COMPANY_CONTACTS.legal.iin}, hereinafter referred to as the <strong>"Contractor"</strong>, publishes this public offer pursuant to Articles 395 and 396 of the Civil Code of the Republic of Kazakhstan, addressed to any legal entity or individual entrepreneur (hereinafter <strong>"Customer"</strong>), accepting the terms hereof.
              </p>

              {/* Section 1 EN */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">1. Terms & Definitions</h2>
                <p>1.1. <strong>Offer</strong> — this document publicly available online at <code>tanbox.kz</code>.</p>
                <p>1.2. <strong>Acceptance</strong> — the Customer's unconditional assent to the Offer terms via registering in the Client Portal <code>lk.tanbox.kz</code>, placing an order, or transferring payment.</p>
                <p>1.3. <strong>IS Tanba (IS MPT)</strong> — the National Track & Trace System of Kazakhstan (operated by Kazakhtelecom JSC).</p>
                <p>1.4. <strong>Data Matrix Code</strong> — 2D digital cryptographic identification code compliant with Kazakhstan state specifications.</p>
                <p>1.5. <strong>Certificate of Completion</strong> — statutory primary accounting document (Form R-1 approved by the Ministry of Finance of RK).</p>
              </div>

              {/* Section 2 EN */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">2. Subject Matter</h2>
                <p>2.1. The Contractor agrees to provide digital product serialization and marking services, and the Customer agrees to accept and pay for such services pursuant to this Agreement.</p>
                <p>2.2. Batch volume, tariff tier, turnaround schedule, and pricing are configured by the Customer via the Portal order form and finalized in the Proforma Invoice and Completion Act.</p>
                <p>2.3. Services include: code issuance in IS Tanba, label layout formatting, industrial roll printing, onsite labeling crews at Customer warehouses, SSCC aggregation, and nationwide dispatch.</p>
              </div>

              {/* Section 3 EN */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">3. Label Layout Approval</h2>
                <p>3.1. When ordering label design, the Contractor generates layouts meeting Customs Union / EAEU technical standards based on Customer specifications.</p>
                <p>3.2. Clicking "Approve Layout" within the Client Portal constitutes a legally binding affirmation of the label specifications.</p>
                <p>3.3. Once approved, the Customer bears sole responsibility for SKU descriptions, composition text, EAN-13 barcodes, and certification marks. No post-print layout claims are admitted.</p>
              </div>

              {/* Section 4 EN */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">4. Pricing & Payments</h2>
                <p>4.1. Pricing is pegged to Contractor tariff sheets and invoiced in Kazakhstan Tenge (₸).</p>
                <p>4.2. Pursuant to the Tax Code of RK, the Contractor operates under a simplified tax regime; services are <strong>exempt from VAT</strong>.</p>
                <p>4.3. Payment is made via bank wire transfer or online via VISA/MasterCard through the secured Freedom Pay payment gateway (with 3D-Secure support).</p>
                <p>4.4. Payment and refund details are governed by the "Payment, Delivery & Refund Policy" published at <code>tanbox.kz/payment-procedure</code>.</p>
              </div>

              {/* Section 5 EN */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">5. Handover & Acceptance</h2>
                <p>5.1. Service completion is formalized via Form R-1 Completion Acts in physical or electronic format (ESF portal).</p>
                <p>5.2. The Customer shall sign or submit reasoned written objections within 3 (three) business days of code or batch delivery.</p>
                <p>5.3. In the absence of written objections within 3 business days, services are deemed fully and properly rendered.</p>
              </div>

              {/* Section 6 EN */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">6. Order Cancellation & Refund Policy</h2>
                <p>6.1. The Customer may cancel services subject to the Law of RK "On Consumer Rights Protection" and the Civil Code of RK.</p>
                <p>6.2. The Customer may not cancel services that have already been properly and fully rendered.</p>
                <p>6.3. If canceled prior to production kickoff, the Contractor refunds paid amounts less direct expenses actually incurred.</p>
                <p>6.4. Online card payments are refunded strictly in non-cash format to the same bank card used for payment. Cash refunds for card transactions are strictly prohibited.</p>
              </div>

              {/* Section 7 EN */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">7. Liability & Dispute Resolution</h2>
                <p>7.1. Parties bear statutory liability in accordance with Kazakhstan law.</p>
                <p>7.2. The Contractor guarantees 100% industrial readability of printed Data Matrix codes by certified 2D optical scanners.</p>
                <p>7.3. Disputes are addressed via claim notices within 10 calendar days. Unresolved disputes are submitted to courts at the Contractor's legal seat.</p>
              </div>

              {/* Section 8 EN */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">8. Term</h2>
                <p>8.1. This Agreement enters into force upon Offer acceptance and remains valid until all obligations are fulfilled.</p>
              </div>

              {/* Requisites Table EN */}
              <div className="pt-6 border-t border-gray-200 space-y-3">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">9. Contractor Details</h2>
                <table className="w-full border-collapse border border-gray-300 text-xs">
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-2.5 font-bold w-1/3 bg-gray-50">Contractor</td>
                      <td className="border border-gray-300 p-2.5 font-semibold">{COMPANY_CONTACTS.legal.companyName}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2.5 font-bold bg-gray-50">IIN</td>
                      <td className="border border-gray-300 p-2.5">{COMPANY_CONTACTS.legal.iin}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2.5 font-bold bg-gray-50">Bank Details</td>
                      <td className="border border-gray-300 p-2.5">{COMPANY_CONTACTS.legal.bank}, Account: {COMPANY_CONTACTS.legal.iik}</td>
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
                  Публичный договор-оферта
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-gray-700">
                  на возмездное оказание услуг цифровой маркировки товаров
                </p>
                <div className="flex justify-between items-center text-xs text-gray-500 pt-3">
                  <span>г. Алматы</span>
                  <span>Редакция от 03 августа 2026 года</span>
                </div>
              </div>

              {/* Preamble RU */}
              <p>
                {COMPANY_CONTACTS.legal.companyName}, действующий на основании Законодательства Республики Казахстан, ИИН {COMPANY_CONTACTS.legal.iin}, именуемый в дальнейшем <strong>«Исполнитель»</strong>, с одной стороны, публикует настоящее предложение, являющееся публичной офертой в соответствии со статьями 395 и 396 Гражданского кодекса Республики Казахстан (далее — ГК РК), адресованное любому юридическому лицу или индивидуальному предпринимателю, именуемому в дальнейшем <strong>«Заказчик»</strong>, принявшему условия настоящего Договора путем его полного и безоговорочного акцепта.
              </p>

              {/* Section 1 RU */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">1. Термины и определения</h2>
                <p>1.1. <strong>Оферта</strong> — настоящий документ, опубликованный в свободном доступе в сети Интернет на сайте <code>tanbox.kz</code>.</p>
                <p>1.2. <strong>Акцепт оферты</strong> — полное и безоговорочное принятие Заказчиком условий Оферты путем прохождения регистрации в Личном кабинете <code>lk.tanbox.kz</code>, оформления Заказа либо осуществления полной или частичной оплаты услуг.</p>
                <p>1.3. <strong>ИС Танба (ИС МПТ)</strong> — Информационная система маркировки и прослеживаемости товаров Республики Казахстан (Единый оператор АО «Казахтелеком»).</p>
                <p>1.4. <strong>Код Data Matrix</strong> — двухмерный цифровой код идентификации государственного образца Республики Казахстан.</p>
                <p>1.5. <strong>Акт выполненных работ</strong> — первичный документ бухгалтерского учета Республики Казахстан (Форма Р-1, утвержденная Приказом Минфина РК от 20.12.2012 № 562).</p>
              </div>

              {/* Section 2 RU */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">2. Предмет договора</h2>
                <p>2.1. Исполнитель обязуется по поручению Заказчика оказать комплекс услуг, связанных с цифровой маркировкой товаров, а Заказчик обязуется принять и оплатить услуги в порядке и на условиях, установленных настоящим Договором.</p>
                <p>2.2. Конкретный перечень, объем, тариф, сроки и стоимость услуг определяются Заказчиком при формировании Заказа в Личном кабинете и отражаются в выставленном Счете на оплату и Акте выполненных работ.</p>
                <p>2.3. В комплекс услуг могут входить: заказ и эмиссия кодов в ИС Танба, разработка макетов этикеток, промышленная термотрансферная печать, оклейка товаров на складе Заказчика, формирование кодов транспортной упаковки (SSCC) и курьерская доставка по РК.</p>
              </div>

              {/* Section 3 RU */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">3. Порядок согласования макетов этикеток</h2>
                <p>3.1. При заказе услуг разработки дизайна макета этикетки Исполнитель готовит макет в соответствии с предоставленными Заказчиком параметрами и требованиями технических регламентов Таможенного союза / ЕАЭС.</p>
                <p>3.2. Нажатие Заказчиком кнопки «Согласовать макет» в интерфейсе Личного кабинета является юридически значимым действием, подтверждающим окончательное утверждение макета.</p>
                <p>3.3. С момента согласования макета Заказчик несет единоличную ответственность за правильность наименования товара, артикула, состава, штрихкодов EAN-13 и знаков обращения. Претензии по содержанию утвержденного макета после запуска печати не принимаются.</p>
              </div>

              {/* Section 4 RU */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">4. Стоимость услуг и порядок расчетов</h2>
                <p>4.1. Стоимость услуг определяется на основании действующих тарифов Исполнителя и фиксируется в национальной валюте Республики Казахстан — тенге (₸).</p>
                <p>4.2. В соответствии с подпунктом 1 пункта 1 статьи 367 Налогового кодекса РК, услуги Исполнителя <strong>НДС не облагаются</strong> (Исполнитель применяет специальный налоговый режим на основе упрощенной декларации).</p>
                <p>4.3. Оплата осуществляется Заказчиком в безналичном порядке путем банковского перевода на расчетный счет Исполнителя на основании Счета на оплату, либо онлайн-оплатой банковскими картами VISA и MasterCard через защищенный платежный шлюз Freedom Pay (с поддержкой технологии 3D-Secure), либо через платежные сервисы Kaspi Pay / банковский эквайринг.</p>
                <p>4.4. Все комиссии банков и платежных систем, связанные с переводом денежных средств, оплачиваются Заказчиком самостоятельно.</p>
                <p>4.5. Порядок оплаты банковскими картами, правила возврата денежных средств и доставка регламентируются документом «Порядок оплаты, доставки и правила возврата», размещенным на Сайте по адресу <code>tanbox.kz/payment-procedure</code>. При оплате картами возврат денежных средств осуществляется исключительно на ту банковскую карту, с которой была совершена исходная оплата.</p>
              </div>

              {/* Section 5 RU */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">5. Порядок сдачи-приемки услуг</h2>
                <p>5.1. Сдача-приемка оказанных услуг оформляется Актом выполненных работ (оказанных услуг) по форме Р-1 на бумажном носителе либо в электронном виде (ЭАВР в ИС ЭСФ).</p>
                <p>5.2. Заказчик обязан в течение 3 (трех) рабочих дней с момента предоставления кодов / отгрузки тиража рассмотреть и подписать Акт выполненных работ либо направить Исполнителю мотивированный письменный отказ.</p>
                <p>5.3. В случае ненаправления Заказчиком подписанного Акта или письменного мотивированного отказа в установленный 3-дневный срок, услуги считаются оказанными в полном объеме, надлежащего качества и безоговорочно принятыми Заказчиком.</p>
              </div>

              {/* Section 6 RU */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">6. Отказ от услуг и порядок возврата денежных средств</h2>
                <p>6.1. Заказчик вправе отказаться от услуг в порядке и на условиях, предусмотренных Законом РК «О защите прав потребителей» и Гражданским кодексом Республики Казахстан.</p>
                <p>6.2. Заказчик не вправе отказаться от услуг, выполненных (оказанных) надлежащим образом в полном объеме.</p>
                <p>6.3. При отказе Заказчика от услуг до момента начала фактического исполнения (до запуска печати тиража этикеток либо заказа кодов в ИС Танба), Исполнитель возвращает Заказчику уплаченную сумму за вычетом фактически понесенных расходов Исполнителя.</p>
                <p>6.4. При оплате банковскими картами VISA или MasterCard через процессинговый шлюз Freedom Pay возврат денежных средств осуществляется исключительно в безналичном порядке на ту же банковскую карту, с которой был совершен первоначальный платеж. Выплата возврата наличными денежными средствами категорически не допускается правилами МПС Visa / MasterCard.</p>
                <p>6.5. Срок рассмотрения заявления на возврат составляет до 10 (десяти) рабочих дней. Зачисление средств банком-эмитентом карты Заказчика осуществляется в течение от 3 до 21 рабочего дня в зависимости от регламентов обслуживающего банка.</p>
                <p>6.6. Подробные условия, форма заявления и контактные данные для подачи запроса на возврат опубликованы на Сайте по адресу <code>tanbox.kz/payment-procedure</code>.</p>
              </div>

              {/* Section 7 RU */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">7. Ответственность сторон и разрешение споров</h2>
                <p>7.1. За неисполнение или ненадлежащее исполнение обязательств стороны несут ответственность в соответствии с законодательством Республики Казахстан.</p>
                <p>7.2. Исполнитель гарантирует 100% промышленную считываемость нанесенных кодов Data Matrix стандартными оптическими сканерами и ТСД.</p>
                <p>7.3. Заказчик самостоятельно несет ответственность за законность ввода маркируемых товаров в гражданский оборот на территории Республики Казахстан.</p>
                <p>7.4. Споры и разногласия разрешаются в претензионном порядке со сроком ответа 10 (десять) календарных дней. При недостижении согласия споры передаются на рассмотрение в суд по месту нахождения Исполнителя.</p>
              </div>

              {/* Section 8 RU */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">8. Срок действия договора</h2>
                <p>8.1. Настоящий Договор вступает в силу с момента акцепта Оферты Заказчиком и действует до полного исполнения сторонами принятых обязательств.</p>
              </div>

              {/* Requisites Table RU */}
              <div className="pt-6 border-t border-gray-200 space-y-3">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">9. Адрес и реквизиты Исполнителя</h2>
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
            </>
          )}

        </div>

      </div>
    </div>
  );
};

export default TermsPage;
