import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const faqs = [
    {
      q: 'В каком формате передавать коды маркировки?',
      a: 'Обычный файл выгрузки из ИС Танба — CSV или TXT. Вы просто загружаете его в личном кабинете при оформлении заказа.',
    },
    {
      q: 'Что делать, если кодов ещё нет?',
      a: 'Поможем зарегистрировать товары в каталоге (НКТ / GS1) и получить коды в системе оператора под ключ.',
    },
    {
      q: 'В каком виде вы отдаете готовые этикетки?',
      a: 'В виде готовых рулонов для термопринтера, PDF-файлов для самостоятельной печати или уже оклеенного товара на вашем складе.',
    },
    {
      q: 'Вы находитесь в г. Алматы. Как происходит работа с другими городами Казахстана?',
      a: 'Наше производство базируется в г. Алматы. Если вам нужны только готовые этикетки — мы оперативно изготавливаем их и отправляем курьерской службой в любой город. Если заказана услуга оклейки — отправляем партию стикеров в ваш регион, и наши сотрудники на месте производят оклейку на вашем складе.',
    },
    {
      q: 'Выезжаете ли на склад для оклейки?',
      a: 'Да. В Алматы выезжаем напрямую со своим оборудованием. В других городах РК мы отправляем изготовленные стикеры, и наши специалисты на месте выполняют оклейку на вашем складе.',
    },
    {
      q: 'Подходят ли этикетки для торговых сетей и маркетплейсов?',
      a: 'Да, этикетки содержат Data Matrix, штрихкод, знак EAC и все обязательные реквизиты по стандарту.',
    },
    {
      q: 'Предоставляются ли закрывающие документы?',
      a: 'Да, выставляем официальный счёт на оплату и акт выполненных работ через ЭСФ или в личном кабинете.',
    },
    {
      q: 'Сколько времени занимает маркировка?',
      a: 'Цифровые файлы формируются за пару минут, печать партии — от 1 рабочего дня. Есть срочная печать за 24 часа.',
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-[#F4F6F9]">
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            Часто задаваемые вопросы
          </h2>
          <p className="text-sm sm:text-base text-[#64748B]">
            Ответы на главные вопросы по подготовке кодов, срокам и процедуре маркировки товаров.
          </p>
        </div>

        <div className="space-y-3 w-full">
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
