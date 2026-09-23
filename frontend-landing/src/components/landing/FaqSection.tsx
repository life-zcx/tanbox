import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Что такое ИС Танба и почему маркировка обязательна?',
      a: 'ИС Танба — это Единая информационная система маркировки и прослеживаемости товаров в Республике Казахстан. Согласно закону РК, продажа неоклеенных Data Matrix товарами из списков обязательной маркировки запрещена.',
    },
    {
      q: 'Как вы гарантируете читаемость кодов сканерами?',
      a: 'Мы используем высокоразрешающую термотрансферную печать на риббонах класса Wax/Resin и проводим 100% контроль валидности кодов перед передачей партий клиенту.',
    },
    {
      q: 'Можете ли вы приехать к нам на склад в Алматы или Астане?',
      a: 'Да! По тарифу «Стандарт» и «PRO» наши выездные мобильные бригады стикеровщиков приезжают на ваш склад в любой точке Казахстана со своим оборудованием.',
    },
    {
      q: 'Что такое агрегационный код SSCC?',
      a: 'SSCC (Serial Shipping Container Code) — это уникальный штрихкод короба или паллеты. Он объединяет десятки Data Matrix кодов внутри короба, позволяя производить приемку на таможне или складе 1 сканированием вместо вскрытия всех пачек.',
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-[#F4F6F9]">
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            Часто задаваемые вопросы
          </h2>
        </div>

        <div className="space-y-3 max-w-4xl">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl shadow-sm overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-5 sm:p-6 text-left font-bold text-base text-[#111827] flex justify-between items-center gap-4 hover:bg-[#F8FAFC] transition-colors"
                >
                  <span className={isOpen ? 'text-[#0082FB]' : ''}>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-[#0082FB]' : 'text-[#64748B]'
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 text-sm text-[#64748B] leading-relaxed border-t border-gray-100 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
