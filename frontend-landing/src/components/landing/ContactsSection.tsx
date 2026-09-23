import React from 'react';
import { Send, Mail } from 'lucide-react';

interface ContactsSectionProps {
  showTitle?: boolean;
}

export const ContactsSection: React.FC<ContactsSectionProps> = ({ showTitle = true }) => {
  return (
    <section className={showTitle ? "py-12 sm:py-16 bg-[#F4F6F9]" : "w-full"}>
      <div className={showTitle ? "max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8" : "w-full"}>
        
        {/* Section Header */}
        {showTitle && (
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
              Контакты
            </h2>
          </div>
        )}

        {/* 2 Contact Cards matching Image 1 from tanba.telecom.kz */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Telegram Card */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 min-h-[200px] flex flex-col justify-between group">
            
            {/* Background Perfect Isometric Grid Pattern SVG */}
            <svg 
              className="absolute right-0 top-0 bottom-0 h-full w-[55%] opacity-20 pointer-events-none transition-opacity duration-300 group-hover:opacity-35" 
              viewBox="0 0 300 200" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="telegram-grid-pattern" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(35 0 0)">
                  <line x1="0" y1="0" x2="0" y2="24" stroke="#0082FB" strokeWidth="1" />
                  <line x1="0" y1="0" x2="24" y2="0" stroke="#0082FB" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="300" height="200" fill="url(#telegram-grid-pattern)" />
            </svg>

            {/* Left Content */}
            <div className="relative z-10 max-w-[60%] sm:max-w-[65%] space-y-2">
              <h3 className="text-lg sm:text-xl font-bold text-[#111827]">
                Telegram
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed font-normal">
                Подписывайтесь на наш Telegram-канал, чтобы быть в курсе всех новостей и обновлений.
              </p>
            </div>

            {/* Link at Bottom Left */}
            <div className="relative z-10 pt-4 mt-2">
              <a 
                href="https://t.me/tanbox_kz" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-semibold text-[#0082FB] hover:text-[#0060C7] transition-colors inline-flex items-center gap-1"
              >
                Подробнее
              </a>
            </div>

            {/* Right Large Blue Circle Icon */}
            <div className="absolute right-6 sm:right-10 top-1/2 -translate-y-1/2 z-10">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#0082FB] text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Send className="w-7 h-7 sm:w-9 sm:h-9 -ml-0.5 mt-0.5 stroke-[1.75]" />
              </div>
            </div>

          </div>

          {/* Email Card */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 min-h-[200px] flex flex-col justify-between group">
            
            {/* Background Perfect Isometric Grid Pattern SVG */}
            <svg 
              className="absolute right-0 top-0 bottom-0 h-full w-[55%] opacity-20 pointer-events-none transition-opacity duration-300 group-hover:opacity-35" 
              viewBox="0 0 300 200" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="email-grid-pattern" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(35 0 0)">
                  <line x1="0" y1="0" x2="0" y2="24" stroke="#0082FB" strokeWidth="1" />
                  <line x1="0" y1="0" x2="24" y2="0" stroke="#0082FB" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="300" height="200" fill="url(#email-grid-pattern)" />
            </svg>

            {/* Left Content */}
            <div className="relative z-10 max-w-[60%] sm:max-w-[65%] space-y-2">
              <h3 className="text-lg sm:text-xl font-bold text-[#111827]">
                Электронная почта
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed font-normal">
                Свяжитесь с нами по адресу: <br className="hidden sm:inline"/>
                <span className="font-semibold text-[#111827]">info@tanbox.kz</span>
              </p>
            </div>

            {/* Link at Bottom Left */}
            <div className="relative z-10 pt-4 mt-2">
              <a 
                href="mailto:info@tanbox.kz" 
                className="text-sm font-semibold text-[#0082FB] hover:text-[#0060C7] transition-colors inline-flex items-center gap-1"
              >
                Подробнее
              </a>
            </div>

            {/* Right Large Blue Circle Icon */}
            <div className="absolute right-6 sm:right-10 top-1/2 -translate-y-1/2 z-10">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#0082FB] text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Mail className="w-7 h-7 sm:w-9 sm:h-9 stroke-[1.75]" />
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
