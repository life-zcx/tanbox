import React, { useEffect } from 'react';
import { HeroSection } from '../components/landing/HeroSection';
import { BusinessValueSection } from '../components/landing/BusinessValueSection';
import { CategoriesSection } from '../components/landing/CategoriesSection';
import { CalculatorSection } from '../components/landing/CalculatorSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { FaqSection } from '../components/landing/FaqSection';
import { ContactsSection } from '../components/landing/ContactsSection';
import { TariffCode } from '../types';
import { setPageSeo } from '../utils/seo';

import { useLanguage } from '../context/LanguageContext';

interface HomePageProps {
  onOpenAuth: () => void;
  onOrderQuick: (tariff: TariffCode, count: number, price: number) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenAuth, onOrderQuick }) => {
  const { lang } = useLanguage();

  useEffect(() => {
    if (lang === 'kz') {
      setPageSeo(
        'Қазақстанда тауарларды таңбалау | Data Matrix кодтарын эмиссиялау және ТМБ АЖ интеграциясы — TANBOX.KZ',
        'Қазақстанда тауарларды цифрлық таңбалау қызметі. ТМБ АЖ (Таңба) интеграциясы, ҰТК (GS1 Kazakhstan) каталогы, Data Matrix басып шығару және қоймада оклейка. Кедендік ресімдеуден 1С-ке дейін.',
        { lang: 'kz', keywords: 'тауарларды таңбалау Қазақстан, Data Matrix коды, ТМБ АЖ, таңбалау Алматы, ҰТК тауарлар каталогы, аяқ киім таңбалау, дәрі-дәрмек таңбалау' }
      );
    } else if (lang === 'en') {
      setPageSeo(
        'Digital Product Serialization & Marking in Kazakhstan | IS Tanba & IS MPT — TANBOX.KZ',
        'End-to-end Data Matrix product serialization in Kazakhstan. Direct IS MPT / IS Tanba connectivity, NKT catalog setup, sticker printing, and warehouse stickering.',
        { lang: 'en', keywords: 'product serialization Kazakhstan, Data Matrix codes, IS Tanba, IS MPT, digital labeling Kazakhstan' }
      );
    } else {
      setPageSeo(
        'Маркировка товаров в Казахстане под ключ | Эмиссия кодов Data Matrix в ИС Танба — TANBOX.KZ',
        'Профессиональная цифровая маркировка товаров Data Matrix под ключ в Республике Казахстан. Эмиссия кодов в ИС Танба, заведение номенклатуры в НКТ (GS1 Казахстан), термопечать стикеров, выездная оклейка на складе и агрегация SSCC по РК.',
        { lang: 'ru', keywords: 'маркировка товаров Казахстан, Data Matrix коды, ИС Танба, ИС МПТ, оклейка товара Алматы, НКТ GS1 Казахстан' }
      );
    }
  }, [lang]);

  const scrollToCalculator = () => {
    const el = document.getElementById('calculator');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToBusinessValue = () => {
    const el = document.getElementById('business-value');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full bg-[#F4F6F9]">
      {/* 1. Hero Block */}
      <HeroSection
        onOpenCalculator={scrollToCalculator}
        onOpenAuth={onOpenAuth}
        onScrollNext={scrollToBusinessValue}
      />

      {/* 2. Business Value, Risks & TANBOX Capabilities */}
      <BusinessValueSection
        onScrollToCalculator={scrollToCalculator}
      />

      {/* 3. Regulated Categories */}
      <CategoriesSection />

      {/* 4. Calculator */}
      <CalculatorSection
        onOrderQuick={onOrderQuick}
      />

      {/* 5. How It Works (4 Steps) */}
      <HowItWorksSection />

      {/* 6. FAQ */}
      <FaqSection />

      {/* 7. Contacts */}
      <ContactsSection />
    </div>
  );
};

export default HomePage;
