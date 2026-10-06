import React, { useEffect } from 'react';
import { HeroSection } from '../components/landing/HeroSection';
import { CategoriesSection } from '../components/landing/CategoriesSection';
import { DataMatrixInfoSection } from '../components/landing/DataMatrixInfoSection';
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
      'Профессиональная маркировка товаров Data Matrix под ключ в Республике Казахстан. Эмиссия кодов в ИС Танба, заведение номенклатуры в НКТ (ГС1 Казахстан), термопечать стикеров, выездная оклейка на складе и агрегация SSCC по РК.'
    );
  }, []);
  const scrollToCalculator = () => {
    const el = document.getElementById('calculator');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="space-y-0 bg-[#F4F6F9]">
      <HeroSection onOpenCalculator={scrollToCalculator} onOpenAuth={onOpenAuth} />
      <CategoriesSection />
      <DataMatrixInfoSection />
      <CalculatorSection onOrderQuick={onOrderQuick} />
      <HowItWorksSection />
      <FaqSection />
      <ContactsSection />
    </main>
  );
};


