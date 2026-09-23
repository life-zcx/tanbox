import React from 'react';
import { FileText, Cpu, Printer, CheckCircle2 } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Заявка и Номенклатура',
      desc: 'Вы загружаете файл товаров (Excel/CSV) в личном кабинете lk.tanbox.kz или отправляете вашему менеджеру.',
      icon: FileText,
    },
    {
      num: '02',
      title: 'Эмиссия в ИС Танба',
      desc: 'Наши серверы автоматически формируют Data Matrix коды через API Национального Оператора РК.',
      icon: Cpu,
    },
    {
      num: '03',
      title: 'Печать и Оклейка',
      desc: 'Печатаем рулоны на промышленном оборудовании и производим оклейку упаковки на вашем складе.',
      icon: Printer,
    },
    {
      num: '04',
      title: 'Акты и Подписание',
      desc: 'Проверяем качество считываемости 2D-кодов и передаем акты сдачи клиенту.',
      icon: CheckCircle2,
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-[#F4F6F9]">
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            Пошаговый процесс маркировки
          </h2>
          <p className="text-sm sm:text-base text-[#64748B]">
            Всего 4 простых шага от подачи заявки до полной готовности товара к продаже.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div 
                key={idx} 
                className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group flex flex-col justify-between"
              >
                <span className="text-3xl sm:text-4xl font-extrabold text-[#E2E8F0] absolute top-5 right-6 group-hover:text-[#CBD5E1] transition-colors">
                  {s.num}
                </span>

                <div>
                  <div className="w-12 h-12 bg-[#EBF5FF] text-[#0082FB] rounded-full flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 stroke-[2]" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[#111827] mb-2">{s.title}</h3>
                  <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
