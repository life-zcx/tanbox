import React from 'react';

export const DataMatrixInfoSection: React.FC = () => {
  return (
    <section className="py-8 sm:py-12 bg-[#F4F6F9]">
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Blue Banner Card matching tanba.telecom.kz screenshot */}
        <div className="bg-[#0082FB] rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
          
          {/* Subtle background glow effect */}
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            
            {/* Left Column: Text Content */}
            <div className="lg:col-span-8 space-y-5">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug">
                Что такое маркировка кодом Data Matrix?
              </h2>

              <p className="text-sm sm:text-base text-white/95 leading-relaxed font-normal">
                Это нанесение специального средства идентификации на товар — двумерного квадратного изображения в виде черных и белых полей. Код содержит информацию о производителе, серийный номер и защиту от взлома. Он помогает всем участникам товарного оборота (производителям, дистрибьюторам, поставщикам, розничным торговым точкам, потребителям) быстрее и надежнее взаимодействовать друг с другом.
              </p>

              <p className="text-sm sm:text-base text-white/95 leading-relaxed font-normal">
                Главная цель маркировки товаров — защита потребителей от контрафактной и фальсифицированной продукции. Маркировка подобна номеру посылки, который ставится на почте: по ней можно отследить весь путь пакета или коробки до получателя.
              </p>
            </div>

            {/* Right Column: Official TANBOX Data Matrix QR Logo directly on blue background */}
            <div className="lg:col-span-4 flex justify-center lg:justify-end">
              <svg 
                viewBox="0 0 21 22" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="w-44 h-44 sm:w-52 sm:h-52 lg:w-56 lg:h-56 text-white"
              >
                <path 
                  d="M19.1374 15H16.1145C15.58 15 15.0674 15.2107 14.6895 15.5858C14.3116 15.9609 14.0992 16.4696 14.0992 17V20M19.1374 20V20.01M10.0687 6V9C10.0687 9.53043 9.85638 10.0391 9.47844 10.4142C9.10051 10.7893 8.58792 11 8.05344 11H5.03053M1 11H1.01008M10.0687 2H10.0788M10.0687 15V15.01M14.0992 11H15.1069M19.1374 11V11.01M10.0687 20V19M2.00763 2H5.03053C5.58704 2 6.03817 2.44772 6.03817 3V6C6.03817 6.55228 5.58704 7 5.03053 7H2.00763C1.45113 7 1 6.55228 1 6V3C1 2.44772 1.45113 2 2.00763 2ZM15.1069 2H18.1298C18.6863 2 19.1374 2.44772 19.1374 3V6C19.1374 6.55228 18.6863 7 18.1298 7H15.1069C14.5504 7 14.0992 6.55228 14.0992 6V3C14.0992 2.44772 14.5504 2 15.1069 2ZM2.00763 15H5.03053C5.58704 15 6.03817 15.4477 6.03817 16V19C6.03817 19.5523 5.58704 20 5.03053 20H2.00763C1.45113 20 1 19.5523 1 19V16C1 15.4477 1.45113 15 2.00763 15Z" 
                  stroke="white" 
                  strokeWidth="1.8" 
                  strokeLinecap="round"
                />
              </svg>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
