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

interface HomePageProps {
  onOpenAuth: () => void;
  onOrderQuick: (tariff: TariffCode, count: number, price: number) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenAuth, onOrderQuick }) => {
  useEffect(() => {
    setPageSeo(
      'Маркировка товаров в Казахстане под ключ | Эмиссия кодов Data Matrix в ИС Танба — TANBOX.KZ',
      'Профессиональная цифровая маркировка товаров Data Matrix под ключ в Республике Казахстан. Эмиссия кодов в ИС Танба, заведение номенклатуры в НКТ (GS1 Казахстан), термопечать стикеров, выездная оклейка на складе и агрегация SSCC по РК.'
    );
  }, []);

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
