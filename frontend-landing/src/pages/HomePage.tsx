import React, { useState } from 'react';
import { HeroSection } from '../components/landing/HeroSection';
import { BusinessValueSection } from '../components/landing/BusinessValueSection';
import { CategoriesSection } from '../components/landing/CategoriesSection';
import { CalculatorSection } from '../components/landing/CalculatorSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { FaqSection } from '../components/landing/FaqSection';
import { ContactsSection } from '../components/landing/ContactsSection';
const ServiceOrderModal = React.lazy(() => import('../components/modals/ServiceOrderModal').then(m => ({ default: m.ServiceOrderModal })));
import { TariffCode } from '../types';

import { useLanguage } from '../context/LanguageContext';

interface HomePageProps {
  onOpenAuth: () => void;
  onOrderQuick: (tariff: TariffCode, count: number, price: number) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenAuth, onOrderQuick }) => {
  const { lang } = useLanguage();
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const scrollToCalculator = () => {
    const el = document.getElementById('calculator');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToBusinessValue = () => {
    const el = document.getElementById('business-value');
    if (el) {
      if (window.innerWidth < 768) {
        const headerHeight = document.querySelector('header')?.getBoundingClientRect().height ?? 0;
        window.scrollTo({
          top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - headerHeight - 12),
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        });
      } else {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="w-full bg-[#F4F6F9]">
      {/* 1. Hero Block */}
      <HeroSection
        onOpenCalculator={scrollToCalculator}
        onOpenAuth={onOpenAuth}
        onOpenOrderModal={() => setIsOrderModalOpen(true)}
        onScrollNext={scrollToBusinessValue}
      />

      {/* 2. Business Value, Risks & TANBOX Capabilities */}
      <BusinessValueSection />

      {/* 3. Calculator */}
      <CalculatorSection
        onOrderQuick={onOrderQuick}
      />

      {/* 4. Regulated Categories */}
      <CategoriesSection />

      {/* 5. How It Works (4 Steps) */}
      <HowItWorksSection />

      {/* 6. FAQ */}
      <FaqSection />

      {/* 7. Contacts */}
      <ContactsSection />

      {/* Quick Service Order Modal */}
      {isOrderModalOpen && (
        <React.Suspense fallback={null}>
          <ServiceOrderModal
            isOpen={isOrderModalOpen}
            onClose={() => setIsOrderModalOpen(false)}
            initialServiceTitle={
              lang === 'kz'
                ? 'Тауарларды цифрлық таңбалау (кілтке дейін)'
                : lang === 'en'
                ? 'Turnkey Product Serialization & Marking'
                : 'Цифровая маркировка товаров под ключ'
            }
          />
        </React.Suspense>
      )}
    </div>
  );
};

export default HomePage;
