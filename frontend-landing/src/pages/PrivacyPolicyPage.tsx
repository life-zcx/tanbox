import React from 'react';
import { Calendar, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { COMPANY_CONTACTS } from '../data/companyContacts';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="bg-[#F4F6F9] min-h-screen py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#64748B] hover:text-[#0082FB] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> На главную
        </Link>

        {/* Header */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-gray-100 space-y-3">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#111827] tracking-tight leading-tight">
            Политика сбора и обработки персональных данных
          </h1>

          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <Calendar className="w-3.5 h-3.5" />
            <span>Действует с: 1 января 2026 г. • Редакция 2.1</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-gray-100 prose prose-slate max-w-none space-y-8 text-sm text-[#334155] leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#111827]">1. Общие положения</h2>
            <p>
              Настоящая Политика сбора и обработки персональных данных (далее — «Политика») составлена в строгом соответствии с <strong>Законом Республики Казахстан от 21 мая 2013 года № 94-V «О персональных данных и их защите»</strong> (с изменениями и дополнениями), а также Законом РК «Об информатизации».
            </p>
            <p>
              Оператором сбора и обработки персональных данных является <strong>{COMPANY_CONTACTS.legal.companyName}</strong> (БИН: {COMPANY_CONTACTS.legal.bin}, адрес: {COMPANY_CONTACTS.address.full}) (далее — «Оператор» или «TANBOX»).
            </p>
            <p>
              Использование сайта tanbox.kz, оформление заявок на маркировку, регистрация в Личном кабинете lk.tanbox.kz означает безоговорочное согласие Пользователя с настоящей Политикой и указанными в ней условиями обработки его персональных данных.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#111827]">2. Категории собираемых персональных данных</h2>
            <p>Оператор обрабатывает следующие персональные данные Пользователей:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Фамилия, имя, отчество представителя или уполномоченного лица Заказчика;</li>
              <li>Индивидуальный идентификационный номер (ИИН) или Бизнес-идентификационный номер (БИН) организации;</li>
              <li>Контактный номер телефона (в коде Республики Казахстан +7);</li>
              <li>Адрес корпоративной или личной электронной почты (e-mail);</li>
              <li>Наименование юридического лица или индивидуального предпринимателя;</li>
              <li>Адрес склада или места фактического проведения маркировки/оклейки товаров;</li>
              <li>Технические данные: IP-адрес, данные файлов cookie, сведения об используемом браузере и устройстве.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#111827]">3. Цели сбора и обработки персональных данных</h2>
            <p>Обработка персональных данных осуществляется исключительно в целях:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Предоставления услуг по заказу кодов маркировки Data Matrix в ИС «Танба» (Единый оператор АО «Казахтелеком»);</li>
              <li>Заведения карточек товаров в Национальный каталог товаров (НКТ) и интеграции с системами учета 1С;</li>
              <li>Выезда мобильных бригад маркировщиков на склад заказчика и выполнения оклейки/агрегации;</li>
              <li>Выставления коммерческих предложений, счетов на оплату и актов выполненных работ по законодательству РК;</li>
              <li>Обеспечения обратной связи, консультаций службы технической поддержки и уведомлений о статусах партий.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#111827]">4. Порядок хранения и локализация данных в Республике Казахстан</h2>
            <p>
              В соответствии с пунктом 2 статьи 12 Закона РК «О персональных данных и их защите», базы данных, содержащие персональные данные граждан Республики Казахстан, <strong>физически размещены на серверах и в дата-центрах на территории Республики Казахстан</strong>.
            </p>
            <p>
              Оператор применяет комплекс организационных, правовых и технических мер по защите персональных данных от несанкционированного или случайного доступа, уничтожения, изменения, блокирования, копирования и распространения.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#111827]">5. Передача данных третьим лицам</h2>
            <p>
              Оператор обязуется не раскрывать персональные данные третьим лицам и не распространять их без согласия субъекта, за исключением случаев, предусмотренных законодательством Республики Казахстан:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Передача сведений в государственную информационную систему маркировки и прослеживаемости товаров (ИС МПТ / ИС Танба);</li>
              <li>Передача по официальным запросам уполномоченных органов государственной власти Республики Казахстан (суд, налоговые органы КГД МФ РК, правоохранительные органы) в строгом соответствии с законодательством РК.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#111827]">6. Права субъекта персональных данных</h2>
            <p>Субъект персональных данных имеет право:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Знать о наличии у Оператора своих персональных данных и получать информацию о порядке их обработки;</li>
              <li>Требовать изменения, уточнения своих персональных данных при наличии подтверждающих документов;</li>
              <li>Отозвать свое согласие на сбор и обработку персональных данных, направив письменное заявление по адресу электронной почты {COMPANY_CONTACTS.emails.info};</li>
              <li>Требовать блокирования или уничтожения своих данных в случаях нарушения условий сбора, установленных законодательством РК.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#111827]">7. Контакты и реквизиты Оператора</h2>
            <div className="bg-[#F4F6F9] p-4 rounded-2xl border border-gray-200/80 font-mono text-xs space-y-1">
              <p><strong>Наименование:</strong> {COMPANY_CONTACTS.legal.companyName}</p>
              <p><strong>БИН:</strong> {COMPANY_CONTACTS.legal.bin}</p>
              <p><strong>ИИК:</strong> {COMPANY_CONTACTS.legal.iik} в {COMPANY_CONTACTS.legal.bank}</p>
              <p><strong>Адрес:</strong> {COMPANY_CONTACTS.address.full}</p>
              <p><strong>E-mail службы безопасности:</strong> {COMPANY_CONTACTS.emails.info}</p>
              <p><strong>Телефон:</strong> {COMPANY_CONTACTS.phones.hotline}</p>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
};
