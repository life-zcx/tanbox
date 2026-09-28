import React from 'react';
import { Calendar, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { COMPANY_CONTACTS } from '../data/companyContacts';

export const TermsPage: React.FC = () => {
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
            Пользовательское соглашение и условия предоставления услуг
          </h1>

          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <Calendar className="w-3.5 h-3.5" />
            <span>Действует с: 1 января 2026 г. • Республика Казахстан</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-gray-100 prose prose-slate max-w-none space-y-8 text-sm text-[#334155] leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#111827]">1. Предмет соглашения</h2>
            <p>
              Настоящее Соглашение регулирует отношения между <strong>{COMPANY_CONTACTS.legal.companyName}</strong> (далее — «Исполнитель» или «TANBOX») и юридическим лицом или индивидуальным предпринимателем (далее — «Заказчик»), использующим сервис tanbox.kz и Личный кабинет.
            </p>
            <p>
              Исполнитель оказывает комплексные услуги по обязательной цифровой маркировке товаров средствами идентификации Data Matrix, агрегации кодов (SSCC), заведению номенклатуры в Национальный каталог товаров (НКТ) и интеграции с информационными системами РК.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#111827]">2. Порядок оформления и исполнения заказов</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Заказ формируется через онлайн-калькулятор на сайте, форму обратной связи или Личный кабинет lk.tanbox.kz.</li>
              <li>Стоимость услуг рассчитывается на основании действующих тарифов и объема партии товаров в национальной валюте РК (тенге, ₸).</li>
              <li>Для выполнения оклейки мобильными бригадами Заказчик обеспечивает доступ к складским помещениям и надлежащие условия для работы персонала Исполнителя.</li>
              <li>Исполнитель гарантирует 100% валидность и считываемость нанесенных кодов Data Matrix промышленными 2D-сканерами и ТСД.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#111827]">3. Права и обязанности сторон</h2>
            <p><strong>Исполнитель обязуется:</strong></p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Оказывать услуги качественно и в согласованные сроки (от 1 рабочего дня);</li>
              <li>Обеспечивать конфиденциальность коммерческой тайны и персональных данных Заказчика;</li>
              <li>Предоставлять акты выполненных работ (АВР) и электронные счета-фактуры (ЭСФ) в ИС ЭСФ в установленные законодательством РК сроки.</li>
            </ul>
            <p><strong>Заказчик обязуется:</strong></p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Предоставлять достоверные регистрационные данные (БИН/ИИН, реквизиты, сертификаты/декларации соответствия на товар);</li>
              <li>Своевременно производить оплату оказанных услуг в соответствии с выставленными счетами.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#111827]">4. Разрешение споров и применимое право</h2>
            <p>
              Все споры и разногласия разрешаются путем переговоров. При недостижении согласия спор подлежит рассмотрению в судах города Алматы в соответствии с действующим материальным и процессуальным правом Республики Казахстан.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#111827]">5. Реквизиты Исполнителя</h2>
            <div className="bg-[#F4F6F9] p-4 rounded-2xl border border-gray-200/80 font-mono text-xs space-y-1">
              <p><strong>{COMPANY_CONTACTS.legal.companyName}</strong></p>
              <p>БИН: {COMPANY_CONTACTS.legal.bin}</p>
              <p>ИИК: {COMPANY_CONTACTS.legal.iik} в {COMPANY_CONTACTS.legal.bank}</p>
              <p>Адрес: {COMPANY_CONTACTS.address.full}</p>
              <p>Тел: {COMPANY_CONTACTS.phones.hotline}</p>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
};
