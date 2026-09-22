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
    <section className="py-20 bg-gray-50 border-b border-gray-200">
      <div className="max-w-[1200px] w-full mx-auto px-6 sm:px-10 lg:px-16">
        <div className="text-center mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
            <HelpCircle className="w-3.5 h-3.5" /> FAQ
          </div>
          <h2 className="text-3xl font-extrabold text-black tracking-tight">Часто задаваемые вопросы</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-6 text-left font-bold text-base text-black flex justify-between items-center gap-4 hover:bg-gray-50"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      isOpen ? 'rotate-180 text-black' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
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
