import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { CookieBanner } from './components/common/CookieBanner';
import { HomePage } from './pages/HomePage';
import { CalculatorPage } from './pages/CalculatorPage';
import { ServicesPage } from './pages/ServicesPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CategoryDetailPage } from './pages/CategoryDetailPage';
import { ContactsPage } from './pages/ContactsPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';
import { CookiePolicyPage } from './pages/CookiePolicyPage';
import { TariffCode } from './types';

const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
};

export const App: React.FC = () => {
  const handleOpenAuth = () => {
    window.open('http://127.0.0.1:3001/dashboard', '_blank', 'noopener,noreferrer');
  };

  const handleOpenQuickOrder = (tariffType: TariffCode, itemsCount: number, totalPrice: number) => {
    try {
      localStorage.setItem(
        'tanbox_pending_order',
        JSON.stringify({
          tariffType,
          itemsCount,
          totalPrice,
          createdAt: new Date().toISOString(),
        })
      );
    } catch {}
    window.location.href = `http://127.0.0.1:3001/register?tariff=${tariffType}&count=${itemsCount}&price=${totalPrice}`;
  };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col justify-between bg-white text-black">
        <Header onOpenAuth={handleOpenAuth} />

        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                onOpenAuth={handleOpenAuth}
                onOrderQuick={handleOpenQuickOrder}
              />
            }
          />
          <Route
            path="/calculator"
            element={<CalculatorPage onOrderQuick={handleOpenQuickOrder} />}
          />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/categories/:categoryId" element={<CategoryDetailPage onOrderQuick={handleOpenQuickOrder} />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/tariffs" element={<ServicesPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cookies" element={<CookiePolicyPage />} />
        </Routes>

        <Footer />
        <CookieBanner />
      </div>
    </BrowserRouter>
  );
};
export default App;

