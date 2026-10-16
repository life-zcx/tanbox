import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
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
import { getLkUrl } from './utils/navigation';
import { trackGoogleConversion } from './utils/analytics';
import { LanguageProvider } from './context/LanguageContext';

const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();
  const prevCleanPath = React.useRef<string>('');

  useEffect(() => {
    // Normalize path by stripping /kz or /en prefix so switching language on the same page doesn't reset scroll
    const cleanPath = pathname.replace(/^\/(kz|en)(\/|$)/, '/').replace(/\/$/, '') || '/';
    if (!hash && prevCleanPath.current !== cleanPath) {
      window.scrollTo(0, 0);
    }
    prevCleanPath.current = cleanPath;
  }, [pathname, hash]);

  return null;
};

const AppContent: React.FC = () => {
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
    window.open(getLkUrl('/dashboard'), '_blank', 'noopener,noreferrer');
  };

  const handleOpenQuickOrder = (tariffType: TariffCode, itemsCount: number, totalPrice: number) => {
    if (maintenance?.active) {
      alert('На платформе проводятся регламентные технические работы. Оформление заказов временно приостановлено на 10–15 минут.');
      return;
    }
    try {
      trackGoogleConversion({ value: totalPrice || 1.0, currency: 'KZT' });
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
    window.location.href = getLkUrl(`/register?tariff=${tariffType}&count=${itemsCount}&price=${totalPrice}`);
  };

  const renderRoutes = (prefix = '') => (
    <>
      <Route
        path={prefix ? prefix : '/'}
        element={
          <HomePage
            onOpenAuth={handleOpenAuth}
            onOrderQuick={handleOpenQuickOrder}
          />
        }
      />
      <Route
        path={`${prefix}/calculator`}
        element={<CalculatorPage onOrderQuick={handleOpenQuickOrder} />}
      />
      <Route path={`${prefix}/categories`} element={<CategoriesPage />} />
      <Route
        path={`${prefix}/categories/:categoryId`}
        element={<CategoryDetailPage onOrderQuick={handleOpenQuickOrder} />}
      />
      <Route path={`${prefix}/services`} element={<ServicesPage />} />
      <Route path={`${prefix}/tariffs`} element={<ServicesPage />} />
      <Route path={`${prefix}/contacts`} element={<ContactsPage />} />
      <Route path={`${prefix}/privacy`} element={<PrivacyPolicyPage />} />
      <Route path={`${prefix}/terms`} element={<TermsPage />} />
      <Route path={`${prefix}/cookies`} element={<CookiePolicyPage />} />
      <Route path={`${prefix}/cookie-policy`} element={<CookiePolicyPage />} />
    </>
  );

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F4F6F9] text-[#111827]">
      <Header onOpenAuth={handleOpenAuth} maintenance={maintenance?.active} />

      <main className="flex-1">
        <Routes>
          {/* Default (Russian) */}
          {renderRoutes('')}

          {/* Kazakh (/kz) */}
          {renderRoutes('/kz')}

          {/* English (/en) */}
          {renderRoutes('/en')}
        </Routes>
      </main>

      <Footer />
      <CookieBanner />
      <ScrollToTopButton duration={1000} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <LanguageProvider>
        <ScrollToTop />
        <AppContent />
      </LanguageProvider>
    </BrowserRouter>
  );
};

export default App;
