import React from 'react';
import { FileText, Cpu, Printer, CheckCircle2, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const HowItWorksSection: React.FC = () => {
  const { t } = useLanguage();

  const steps = [
    {
      num: '01',
      title: t('hiw.step1_title'),
      desc: t('hiw.step1_desc'),
      icon: FileText,
    },
    {
      num: '02',
      title: t('hiw.step2_title'),
      desc: t('hiw.step2_desc'),
      icon: Cpu,
    },
    {
      num: '03',
      title: t('hiw.step3_title'),
      desc: t('hiw.step3_desc'),
      icon: Printer,
    },
    {
      num: '04',
      title: t('hiw.step4_title'),
      desc: t('hiw.step4_desc'),
      icon: CheckCircle2,
    },
  ];

  return (
    <section id="how-it-works" className="py-12 sm:py-16 bg-[#F4F6F9]">
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111827] tracking-tight">
            {t('hiw.title')}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div 
                key={idx} 
                className="bg-white rounded-2xl sm:rounded-3xl p-6 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group flex flex-col justify-between border border-gray-200/70 min-h-[170px]"
              >
                <span aria-hidden="true" className="text-3xl sm:text-4xl font-black text-slate-100 absolute top-4 right-5 group-hover:text-blue-50 transition-colors select-none pointer-events-none">
                  {s.num}
                </span>

                <div>
                  <div className="w-10 h-10 sm:w-11 sm:h-11 bg-blue-50 text-[#0082FB] rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5 stroke-[2]" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#111827] mb-1.5 leading-snug">{s.title}</h3>
                  <p className="text-xs text-[#475569] leading-relaxed">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
