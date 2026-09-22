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
    <section className="py-20 bg-white border-b border-gray-200">
      <div className="max-w-[1700px] w-full mx-auto px-6 sm:px-10 lg:px-16">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">
            Пошаговый процесс маркировки
          </h2>
          <p className="text-base text-gray-600">
            Всего 4 простых шага от подачи заявки до полной готовности товара к продаже.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={idx} className="bg-gray-50 border border-gray-200 rounded-2xl p-6 relative">
                <span className="text-4xl font-black text-gray-200 absolute top-4 right-6">
                  {s.num}
                </span>
                <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-black mb-2">{s.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
