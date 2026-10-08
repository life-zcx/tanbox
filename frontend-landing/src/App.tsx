import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import axios from 'axios';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { CookieBanner } from './components/common/CookieBanner';
import { ScrollToTopButton } from './components/common/ScrollToTopButton';
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
  const [maintenance, setMaintenance] = useState<{ active: boolean; message: string } | null>(null);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await axios.get('/api/health');
        if (res.data?.maintenance) {
          setMaintenance({
            active: true,
            message: res.data.maintenanceMessage || '',
          });
        } else {
          setMaintenance(null);
        }
      } catch (err: any) {
        if (err.response?.status === 503 && err.response?.data?.maintenance) {
          setMaintenance({
            active: true,
            message: err.response.data.message || '',
          });
        }
      }
    };

    checkMaintenance();
    const timer = setInterval(checkMaintenance, 20000);
    return () => clearInterval(timer);
  }, []);

  const handleOpenAuth = () => {
    window.open('http://127.0.0.1:3001/dashboard', '_blank', 'noopener,noreferrer');
  };

  const handleOpenQuickOrder = (tariffType: TariffCode, itemsCount: number, totalPrice: number) => {
    if (maintenance?.active) {
      alert('На платформе проводятся регламентные технические работы. Оформление заказов временно приостановлено на 10–15 минут.');
      return;
    }
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
        <Header onOpenAuth={handleOpenAuth} maintenance={maintenance?.active} />

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
        <ScrollToTopButton duration={1000} />
      </div>
    </BrowserRouter>
  );
};
export default App;

