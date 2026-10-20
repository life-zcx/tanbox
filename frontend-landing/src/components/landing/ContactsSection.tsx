import React from 'react';
import { Send, Mail } from 'lucide-react';
import { COMPANY_CONTACTS } from '../../data/companyContacts';
import { useLanguage } from '../../context/LanguageContext';
import { trackWhatsAppClick, getWhatsAppConsultationUrl } from '../../utils/analytics';

interface ContactsSectionProps {
  showTitle?: boolean;
}

export const ContactsSection: React.FC<ContactsSectionProps> = ({ showTitle = true }) => {
  const { lang } = useLanguage();
  const whatsappUrl = getWhatsAppConsultationUrl(lang, COMPANY_CONTACTS.phones.hotlineRaw.replace(/\D/g, ''));

  return (
    <section className={showTitle ? "py-12 sm:py-16 bg-[#F4F6F9]" : "w-full"}>
      <div className={showTitle ? "max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8" : "w-full"}>
        
        {/* Section Header */}
        {showTitle && (
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
              {lang === 'kz' ? 'Байланыс' : lang === 'en' ? 'Contacts' : 'Контакты'}
            </h2>
          </div>
        )}

        {/* 3 Contact Cards: WhatsApp, Telegram, Email */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* WhatsApp Card */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 min-h-[200px] flex flex-col justify-between group">
            
            {/* Background Isometric Pattern */}
            <svg 
              className="absolute right-0 top-0 bottom-0 h-full w-[55%] opacity-15 pointer-events-none transition-opacity duration-300 group-hover:opacity-30" 
              viewBox="0 0 300 200" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="whatsapp-grid-pattern" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(35 0 0)">
                  <line x1="0" y1="0" x2="0" y2="24" stroke="#25D366" strokeWidth="1" />
                  <line x1="0" y1="0" x2="24" y2="0" stroke="#25D366" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="300" height="200" fill="url(#whatsapp-grid-pattern)" />
            </svg>

            {/* Content */}
            <div className="relative z-10 max-w-[62%] space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-[#111827]">
                  WhatsApp
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Онлайн
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed font-normal">
                {lang === 'kz' 
                  ? 'Таңбалау бойынша жедел кеңес алу және өтінімді 5 минутта жіберу.' 
                  : lang === 'en' 
                  ? 'Instant consultation on serialization and fast inquiry in 5 minutes.' 
                  : 'Оперативные консультации по маркировке и оформление заявки за 5 минут.'}
                <br />
                <span className="font-semibold text-[#111827]">{COMPANY_CONTACTS.phones.hotline}</span>
              </p>
            </div>

            {/* Link at Bottom Left */}
            <div className="relative z-10 pt-4 mt-2">
              <a 
                href={whatsappUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => trackWhatsAppClick()}
                className="text-sm font-semibold text-[#25D366] hover:text-[#1EBE5D] transition-colors inline-flex items-center gap-1 group/btn"
              >
                <span>{lang === 'kz' ? 'WhatsApp-қа жазу' : lang === 'en' ? 'Chat in WhatsApp' : 'Написать в WhatsApp'}</span>
                <span className="transition-transform group-hover/btn:translate-x-1">→</span>
              </a>
            </div>

            {/* Right Large Green Circle Icon */}
            <div className="absolute right-6 sm:right-8 top-1/2 -translate-y-1/2 z-10">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform">
                <svg className="w-8 h-8 fill-white" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </div>
            </div>

          </div>

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
            <div className="relative z-10 max-w-[62%] space-y-2">
              <h3 className="text-lg sm:text-xl font-bold text-[#111827]">
                Telegram
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed font-normal">
                {lang === 'kz' 
                  ? 'Барлық жаңалықтар мен заңнамалық жаңартулардан хабардар болу үшін Telegram-арнамызға жазылыңыз.' 
                  : lang === 'en' 
                  ? 'Subscribe to our official Telegram channel for regulatory news and platform updates.' 
                  : 'Подписывайтесь на наш Telegram-канал, чтобы быть в курсе всех новостей и обновлений.'}
              </p>
            </div>

            {/* Link at Bottom Left */}
            <div className="relative z-10 pt-4 mt-2">
              <a 
                href={COMPANY_CONTACTS.links.telegramChannel} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-semibold text-[#0082FB] hover:text-[#0060C7] transition-colors inline-flex items-center gap-1 group/btn"
              >
                <span>{lang === 'kz' ? 'Толығырақ' : lang === 'en' ? 'Learn more' : 'Подробнее'}</span>
                <span className="transition-transform group-hover/btn:translate-x-1">→</span>
              </a>
            </div>

            {/* Right Large Blue Circle Icon */}
            <div className="absolute right-6 sm:right-8 top-1/2 -translate-y-1/2 z-10">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#0082FB] text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Send className="w-7 h-7 sm:w-8 sm:h-8 -ml-0.5 mt-0.5 stroke-[1.75]" />
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
            <div className="relative z-10 max-w-[62%] space-y-2">
              <h3 className="text-lg sm:text-xl font-bold text-[#111827]">
                {lang === 'kz' ? 'Электрондық пошта' : lang === 'en' ? 'Email' : 'Электронная почта'}
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed font-normal">
                {lang === 'kz' ? 'Бізбен келесі мекенжай бойынша байланысыңыз:' : lang === 'en' ? 'Reach us directly via:' : 'Свяжитесь с нами по адресу:'} <br />
                <span className="font-semibold text-[#111827]">{COMPANY_CONTACTS.emails.info}</span>
              </p>
            </div>

            {/* Link at Bottom Left */}
            <div className="relative z-10 pt-4 mt-2">
              <a 
                href={`mailto:${COMPANY_CONTACTS.emails.info}`}
                className="text-sm font-semibold text-[#0082FB] hover:text-[#0060C7] transition-colors inline-flex items-center gap-1 group/btn"
              >
                <span>{lang === 'kz' ? 'Хат жазу' : lang === 'en' ? 'Send email' : 'Написать нам'}</span>
                <span className="transition-transform group-hover/btn:translate-x-1">→</span>
              </a>
            </div>

            {/* Right Large Blue Circle Icon */}
            <div className="absolute right-6 sm:right-8 top-1/2 -translate-y-1/2 z-10">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#0082FB] text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Mail className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.75]" />
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default ContactsSection;
