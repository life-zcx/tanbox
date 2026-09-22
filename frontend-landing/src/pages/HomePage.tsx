import React from 'react';
import { HeroSection } from '../components/landing/HeroSection';
import { CategoriesSection } from '../components/landing/CategoriesSection';
import { CalculatorSection } from '../components/landing/CalculatorSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { FaqSection } from '../components/landing/FaqSection';
import { TariffCode } from '../types';

interface HomePageProps {
  onOpenAuth: () => void;
  onOrderQuick: (tariff: TariffCode, count: number, price: number) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenAuth, onOrderQuick }) => {
  const scrollToCalculator = () => {
    const el = document.getElementById('calculator');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="space-y-0">
      <HeroSection onOpenCalculator={scrollToCalculator} onOpenAuth={onOpenAuth} />
      <CategoriesSection />
      <CalculatorSection onOrderQuick={onOrderQuick} />
      <HowItWorksSection />
      <FaqSection />
    </main>
  );
};


