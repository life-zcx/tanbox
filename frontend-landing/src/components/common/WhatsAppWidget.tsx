import React, { useState, useEffect } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { trackWhatsAppClick, getWhatsAppConsultationUrl } from '../../utils/analytics';
import { COMPANY_CONTACTS } from '../../data/companyContacts';

export const WhatsAppWidget: React.FC = () => {
  const { lang } = useLanguage();
  const [cookieBannerVisible, setCookieBannerVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Monitor cookie banner presence so widget offsets properly on mobile
  useEffect(() => {
    const checkBanner = () => {
      setCookieBannerVisible(!!document.getElementById('cookie-banner'));
    };
    checkBanner();
    const interval = setInterval(checkBanner, 400);
    return () => clearInterval(interval);
  }, []);

  // Show tooltip after 2.5 seconds if user has not dismissed it in this session
  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem('tanbox_wa_dismissed');
      if (dismissed === 'true') {
        setIsDismissed(true);
        return;
      }
    } catch {}

    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleDismissTooltip = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowTooltip(false);
    setIsDismissed(true);
    try {
      sessionStorage.setItem('tanbox_wa_dismissed', 'true');
    } catch {}
  };

  const whatsappUrl = getWhatsAppConsultationUrl(lang, COMPANY_CONTACTS.phones.hotlineRaw.replace(/\D/g, ''));

  const handleClick = () => {
    trackWhatsAppClick();
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const tooltipTitle =
    lang === 'kz'
      ? 'Желідегі менеджер (24/7)'
      : lang === 'en'
      ? 'Manager Online (24/7)'
      : 'Менеджер онлайн (24/7)';

  const tooltipText =
    lang === 'kz'
      ? 'Таңбалау бойынша сұрағыңыз бар ма? WhatsApp-қа жазыңыз — 5 минутта жауап береміз'
      : lang === 'en'
      ? 'Questions about serialization? Message us on WhatsApp — we reply in 5 min'
      : 'Есть вопрос по маркировке? Напишите нам в WhatsApp — ответим за 5 минут';

  const buttonAria =
    lang === 'kz'
      ? 'WhatsApp арқылы кеңес алу'
      : lang === 'en'
      ? 'Chat on WhatsApp'
      : 'Написать в WhatsApp';

  return (
    <div
      className={`fixed right-4 sm:right-6 z-[1001] transition-all duration-300 select-none ${
        cookieBannerVisible ? 'bottom-[136px] sm:bottom-6' : 'bottom-4 sm:bottom-6'
      }`}
    >
      {/* Speech Bubble Tooltip - desktop only to avoid covering mobile screens */}
      {showTooltip && !isDismissed && (
        <div
          onClick={handleClick}
          className="hidden sm:block absolute bottom-16 sm:bottom-18 right-0 mb-1 w-64 sm:w-72 bg-white rounded-2xl p-3.5 shadow-2xl border border-gray-100 cursor-pointer animate-fade-in group hover:shadow-xl transition-all"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-bold text-gray-700 tracking-wide">
                {tooltipTitle}
              </span>
            </div>
            <button
              type="button"
              onClick={handleDismissTooltip}
              aria-label="Close"
              className="w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Body */}
          <p className="pt-2 text-xs text-gray-600 leading-relaxed font-normal">
            {tooltipText}
          </p>

          {/* Quick CTA */}
          <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-[#25D366] group-hover:text-[#1EBE5D] transition-colors">
            <span>{buttonAria}</span>
            <span className="text-xs transition-transform group-hover:translate-x-0.5">→</span>
          </div>

          {/* Tooltip triangle tail pointing down to WhatsApp button */}
          <div className="absolute -bottom-2 right-6 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[8px] border-t-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.06)]" />
        </div>
      )}

      {/* Main WhatsApp Round Button */}
      <button
        type="button"
        onClick={handleClick}
        aria-label={buttonAria}
        title={buttonAria}
        className="group relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer focus:outline-none ring-2 sm:ring-4 ring-emerald-400/25"
      >
        {/* Soft ripple pulse wave */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20 pointer-events-none" />

        {/* Official WhatsApp SVG Icon */}
        <svg
          className="w-6 h-6 sm:w-7 sm:h-7 fill-white transition-transform duration-300 group-hover:scale-110"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </button>
    </div>
  );
};

export default WhatsAppWidget;
