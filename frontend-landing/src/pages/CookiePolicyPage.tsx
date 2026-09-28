import React from 'react';
import { Calendar, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { COMPANY_CONTACTS } from '../data/companyContacts';

export const CookiePolicyPage: React.FC = () => {
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
            Политика использования файлов cookie (Cookies)
          </h1>

          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <Calendar className="w-3.5 h-3.5" />
            <span>Действует с: 1 января 2026 г. • Республика Казахстан</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-gray-100 prose prose-slate max-w-none space-y-8 text-sm text-[#334155] leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#111827]">1. Что такое файлы cookie?</h2>
            <p>
              Файлы cookie (куки) — это небольшие текстовые фрагменты данных, отправляемые веб-сервером и сохраняемые на вашем компьютере, смартфоне или ином устройстве при посещении сайта tanbox.kz.
            </p>
            <p>
              Они помогают сайту запоминать ваши предпочтения (например, выбранный тариф в калькуляторе или статус авторизации), обеспечивая корректную и быструю работу всех функций веб-ресурса.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#111827]">2. Какие типы cookie мы используем</h2>
            <div className="space-y-3">
              <div className="p-4 bg-[#F4F6F9] rounded-2xl border border-gray-200/80">
                <h4 className="font-bold text-[#111827] text-sm">Обязательные (технические) cookie</h4>
                <p className="text-xs text-[#64748B] mt-1">
                  Необходимы для функционирования сайта, авторизации в Личном кабинете, защиты от спама и сохранения состояния калькулятора. Без них работа сервиса невозможна.
                </p>
              </div>

              <div className="p-4 bg-[#F4F6F9] rounded-2xl border border-gray-200/80">
                <h4 className="font-bold text-[#111827] text-sm">Функциональные cookie</h4>
                <p className="text-xs text-[#64748B] mt-1">
                  Позволяют запоминать ваш выбор (язык интерфейса, согласие с правилами, статус сессии) для более удобного повторного использования.
                </p>
              </div>

              <div className="p-4 bg-[#F4F6F9] rounded-2xl border border-gray-200/80">
                <h4 className="font-bold text-[#111827] text-sm">Аналитические cookie</h4>
                <p className="text-xs text-[#64748B] mt-1">
                  Помогают нам понимать, как пользователи взаимодействуют со страницами сайта, оптимизировать скорость загрузки и устранять ошибки в соответствии с Законом РК «Об информатизации».
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#111827]">3. Управление файлами cookie</h2>
            <p>
              Вы можете в любой момент изменить настройки cookie в настройках вашего браузера (отключить сохранение cookie или удалить уже сохраненные файлы). Обратите внимание: отключение обязательных файлов cookie может привести к ограничению доступа к Личному кабинету и оформлению заказов.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#111827]">4. Контакты Оператора</h2>
            <p>
              По вопросам использования файлов cookie и защиты информации вы можете обратиться по адресу: <a href={`mailto:${COMPANY_CONTACTS.emails.info}`} className="text-[#0082FB] font-bold hover:underline">{COMPANY_CONTACTS.emails.info}</a> или по телефону <span className="font-bold text-[#111827]">{COMPANY_CONTACTS.phones.hotline}</span>.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
};
