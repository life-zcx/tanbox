import { getHomeFaq } from '../../data/homeFaq';
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const FaqSection: React.FC = () => {
  const { lang } = useLanguage();

  const faqs = getHomeFaq(lang);

  return (
    <section className="py-8 sm:py-16 bg-white">
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4 sm:mb-8 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            <span className="sm:hidden">{lang === 'kz' ? 'Сұрақтар мен жауаптар' : lang === 'en' ? 'Questions & answers' : 'Вопросы и ответы'}</span>
            <span className="hidden sm:inline">{lang === 'kz'
              ? 'Жиі қойылатын сұрақтар'
              : lang === 'en'
              ? 'Frequently Asked Questions'
              : 'Часто задаваемые вопросы'}</span>
          </h2>
          <p className="sm:hidden text-xs text-[#475569]">
            {lang === 'kz' ? 'Кодтар, баспа және қоймадағы жұмыс туралы.' : lang === 'en' ? 'Codes, printing and warehouse work.' : 'О кодах, печати и работе на складе.'}
          </p>
          <p className="hidden sm:block text-sm sm:text-base text-[#475569]">
            {lang === 'kz'
              ? 'ТМБ АЖ интеграциясы, кодтарды алу, басып шығару және таңбалау мерзімдері бойынша жауаптар.'
              : lang === 'en'
              ? 'Key answers regarding IS MPT integration, code generation, printing, and turnaround times.'
              : 'Ответы на главные вопросы по интеграции с ИС МПТ, выпуску кодов, печати и процедуре маркировки товаров.'}
          </p>
        </div>

        <div className="sm:space-y-3 w-full border-t border-slate-200 sm:border-0">
          {faqs.map((faq, idx) => (
            <details key={idx} className="group bg-white sm:rounded-2xl sm:shadow-sm border-b border-slate-200 sm:border-0 overflow-hidden">
              <summary className="list-none min-h-12 py-3 sm:p-6 font-semibold sm:font-bold text-sm sm:text-base text-[#111827] leading-relaxed flex justify-between items-center gap-3 sm:gap-4 hover:bg-[#F8FAFC] cursor-pointer [&::-webkit-details-marker]:hidden">
                <span className="group-open:text-[#0082FB]">
                  <span className="sm:hidden">{idx === 4 ? (lang === 'kz' ? 'Басқа қалалармен жұмыс істейсіздер ме?' : lang === 'en' ? 'Do you work in other cities?' : 'Работаете в других городах?') : faq.q}</span>
                  <span className="hidden sm:inline">{faq.q}</span>
                </span>
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-[#64748B] group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="pb-4 pt-1 sm:px-6 sm:pb-6 sm:pt-4 text-sm text-[#334155] leading-relaxed sm:border-t sm:border-gray-100">{faq.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
