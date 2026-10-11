import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { COMPANY_CONTACTS, getLocalizedCompanyContacts } from '../data/companyContacts';
import { setPageSeo } from '../utils/seo';
import { useLanguage } from '../context/LanguageContext';

export const CookiePolicyPage: React.FC = () => {
  const { lang, getLocalizedPath } = useLanguage();
  const localizedContacts = getLocalizedCompanyContacts(lang);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (lang === 'kz') {
      setPageSeo(
        'Cookie файлдарын пайдалану саясаты | TANBOX.KZ',
        'TANBOX.KZ веб-сервисінде cookie файлдары мен веб-аналитиканы пайдалану ережелері мен саясаты.'
      );
    } else if (lang === 'en') {
      setPageSeo(
        'Cookie Policy | TANBOX.KZ',
        'Cookie and web analytics policy for the TANBOX.KZ digital product marking platform.'
      );
    } else {
      setPageSeo(
        'Политика использования файлов cookie | TANBOX.KZ',
        'Политика и правила использования файлов cookie и веб-аналитики на веб-сайте сервиса цифровой маркировки TANBOX.KZ.'
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
                  Cookie файлдарын пайдалану саясаты
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-gray-700">
                  TANBOX веб-сервисінде (tanbox.kz)
                </p>
                <div className="flex justify-between items-center text-xs text-gray-500 pt-3">
                  <span>Алматы қ.</span>
                  <span>2026 жылғы 01 қаңтардағы редакция</span>
                </div>
              </div>

              {/* Section 1 KZ */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">1. Жалпы ережелер</h2>
                <p>1.1. Осы Cookie файлдарын пайдалану саясаты (бұдан әрі — «Саясат») {COMPANY_CONTACTS.legal.companyName} (ЖСН {COMPANY_CONTACTS.legal.iin}, бұдан әрі — «Оператор») <code>tanbox.kz</code> веб-сайтына және <code>lk.tanbox.kz</code> Жеке кабинетіне кіру кезінде cookie файлдары мен ұқсас бақылау технологияларын қалай пайдаланатынын түсіндіреді.</p>
                <p>1.2. Cookie файлдары — бұл сервистің техникалық функционалдылығы мен қауіпсіздігін қамтамасыз ету үшін браузер арқылы пайдаланушының құрылғысында сақталатын шағын мәтіндік файлдар.</p>
              </div>

              {/* Section 2 KZ */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">2. Пайдаланылатын cookie файлдарының жіктелуі</h2>
                <p>2.1. <strong>Техникалық (қатаң міндетті) cookie:</strong> платформаның негізгі жұмысын, пайдаланушының жүйеге кіруін, қауіпсіз HTTPS байланысын қолдауды және рұқсатсыз кіруден (CSRF-шабуылдардан) қорғауды қамтамасыз ету үшін қажет. Бұл файлдарды өшіру Жеке кабинетпен жұмыс істеуді техникалық тұрғыдан мүмкін емес етеді.</p>
                <p>2.2. <strong>Сессиялық cookie:</strong> браузердің бір сессиясы шегінде тапсырысты ресімдеу күйін, таңдалған тариф параметрлері мен жапсырма макетін сақтауды қамтамасыз етеді.</p>
                <p>2.3. <strong>Аналитикалық cookie:</strong> сайттың өнімділігін бағалау, қателерді анықтау және өзара әрекеттесу жылдамдығын оңтайландыру үшін жиынтық дербестендірілмеген түрде қолданылады.</p>
              </div>

              {/* Section 3 KZ */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">3. Cookie файлдарын басқару тәртібі</h2>
                <p>3.1. Пайдаланушы кез келген уақытта қолданылатын веб-браузердің баптауларында cookie файлдарын сақтауды шектеуге немесе толық өшіруге, сондай-ақ бұрын сақталған файлдарды жоюға құқылы.</p>
                <p>3.2. Оператор cookie файлдарына толық тыйым салу Жеке кабинеттегі авторизацияның дұрыс жұмыс істемеуіне және тапсырыстарды рәсімдеудің мүмкін болмауына әкелуі мүмкін екенін ескертеді.</p>
              </div>

              {/* Section 4 KZ */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">4. Байланыс ақпараты</h2>
                <p>4.1. Осы Саясатты қолдану және ақпаратты қорғау мәселелері бойынша пайдаланушылар электрондық пошта арқылы жүгіне алады: <code>{COMPANY_CONTACTS.emails.info}</code> немесе Оператордың орналасқан мекенжайы бойынша: {localizedContacts.addressFull}.</p>
              </div>
            </>
          ) : lang === 'en' ? (
            <>
              {/* Header EN */}
              <div className="text-center space-y-2 pb-6 border-b border-gray-200">
                <h1 className="text-base sm:text-lg font-bold uppercase tracking-wide text-black">
                  Cookie Policy
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-gray-700">
                  for the TANBOX Web Service (tanbox.kz)
                </p>
                <div className="flex justify-between items-center text-xs text-gray-500 pt-3">
                  <span>Almaty, Kazakhstan</span>
                  <span>Effective January 01, 2026</span>
                </div>
              </div>

              {/* Section 1 EN */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">1. General Provisions</h2>
                <p>1.1. This Cookie Policy (hereinafter "Policy") explains how {COMPANY_CONTACTS.legal.companyName} (IIN {COMPANY_CONTACTS.legal.iin}, hereinafter "Operator") uses cookies and related tracking technologies when visiting <code>tanbox.kz</code> and the Client Portal <code>lk.tanbox.kz</code>.</p>
                <p>1.2. Cookies are small text files stored by your browser on your device to ensure core technical functionality, performance, and security.</p>
              </div>

              {/* Section 2 EN */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">2. Classification of Cookies Used</h2>
                <p>2.1. <strong>Strictly Necessary Cookies:</strong> essential for basic platform operations, user authentication, HTTPS session integrity, and protection against unauthorized requests (CSRF mitigation). Disabling these cookies prevents normal interaction with the Client Portal.</p>
                <p>2.2. <strong>Session Cookies:</strong> preserve your checkout progress, chosen tariff configuration, and label layouts across a single browser session.</p>
                <p>2.3. <strong>Analytical Cookies:</strong> aggregated and anonymized measurements used to gauge site speed, locate script errors, and optimize overall responsiveness.</p>
              </div>

              {/* Section 3 EN */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">3. Managing Cookie Preferences</h2>
                <p>3.1. Users may at any time restrict, delete, or completely block cookies via their browser settings.</p>
                <p>3.2. The Operator notes that completely blocking cookies will disable login authentication and prevent submitting service orders.</p>
              </div>

              {/* Section 4 EN */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">4. Contact Information</h2>
                <p>4.1. For inquiries regarding this Policy or data security, please contact us via email: <code>{COMPANY_CONTACTS.emails.info}</code> or at our official address: {localizedContacts.addressFull}.</p>
              </div>
            </>
          ) : (
            <>
              {/* Header RU */}
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

              {/* Section 1 RU */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">1. Общие положения</h2>
                <p>1.1. Настоящая Политика использования файлов cookie (далее — «Политика») разъясняет, каким образом {COMPANY_CONTACTS.legal.companyName} (ИИН {COMPANY_CONTACTS.legal.iin}, далее — «Оператор») использует файлы cookie и аналогичные технологии отслеживания при посещении сайта <code>tanbox.kz</code> и Личного кабинета <code>lk.tanbox.kz</code>.</p>
                <p>1.2. Файлы cookie представляют собой небольшие текстовые файлы, сохраняемые браузером на устройстве пользователя для обеспечения технической функциональности и безопасности сервиса.</p>
              </div>

              {/* Section 2 RU */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">2. Классификация используемых файлов cookie</h2>
                <p>2.1. <strong>Технические (строго обязательные) cookie:</strong> необходимы для обеспечения базового функционирования платформы, авторизации пользователя, поддержки защищенного соединения HTTPS и предотвращения несанкционированного доступа (CSRF-атак). Отключение данных файлов технически невозможно для продолжения работы с Личным кабинетом.</p>
                <p>2.2. <strong>Сессионные cookie:</strong> обеспечивают сохранение состояния оформления заказа, выбранных параметров тарифа и макета стикера в пределах одной сессии работы браузера.</p>
                <p>2.3. <strong>Аналитические cookie:</strong> применяются в обобщенном деперсонализированном виде для оценки производительности сайта, выявления ошибок и оптимизации скорости взаимодействия.</p>
              </div>

              {/* Section 3 RU */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">3. Порядок управления файлами cookie</h2>
                <p>3.1. Пользователь вправе в любой момент ограничить или полностью отключить сохранение файлов cookie в настройках используемого веб-браузера, а также удалить ранее сохраненные файлы.</p>
                <p>3.2. Оператор обращает внимание, что полный запрет файлов cookie может привести к некорректной работе авторизации в Личном кабинете и невозможности оформления заказов.</p>
              </div>

              {/* Section 4 RU */}
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase text-black">4. Контактная информация</h2>
                <p>4.1. По вопросам применения настоящей Политики и защиты информации пользователи могут обращаться по электронной почте: <code>{COMPANY_CONTACTS.emails.info}</code> либо по адресу местонахождения Оператора: {COMPANY_CONTACTS.address.full}.</p>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
};

export default CookiePolicyPage;
