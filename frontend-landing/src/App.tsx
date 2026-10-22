import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { CookieBanner } from './components/common/CookieBanner';
import { ScrollToTopButton } from './components/common/ScrollToTopButton';
import { WhatsAppWidget } from './components/common/WhatsAppWidget';
import { HomePage } from './pages/HomePage';
import { TariffCode } from './types';

// Code-split secondary pages so initial bundle only loads HomePage
const CalculatorPage = React.lazy(() => import('./pages/CalculatorPage').then(m => ({ default: m.CalculatorPage })));
const ServicesPage = React.lazy(() => import('./pages/ServicesPage').then(m => ({ default: m.ServicesPage })));
const CategoriesPage = React.lazy(() => import('./pages/CategoriesPage').then(m => ({ default: m.CategoriesPage })));
const CategoryDetailPage = React.lazy(() => import('./pages/CategoryDetailPage').then(m => ({ default: m.CategoryDetailPage })));
const ContactsPage = React.lazy(() => import('./pages/ContactsPage').then(m => ({ default: m.ContactsPage })));
const ArticlesPage = React.lazy(() => import('./pages/ArticlesPage').then(m => ({ default: m.ArticlesPage })));
const ArticleDetailPage = React.lazy(() => import('./pages/ArticleDetailPage').then(m => ({ default: m.ArticleDetailPage })));
const PrivacyPolicyPage = React.lazy(() => import('./pages/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsPage = React.lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const CookiePolicyPage = React.lazy(() => import('./pages/CookiePolicyPage').then(m => ({ default: m.CookiePolicyPage })));
const PaymentProcedurePage = React.lazy(() => import('./pages/PaymentProcedurePage').then(m => ({ default: m.PaymentProcedurePage })));
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
      <Route path={`${prefix}/articles`} element={<ArticlesPage />} />
      <Route path={`${prefix}/articles/:articleId`} element={<ArticleDetailPage />} />
      <Route path={`${prefix}/blog`} element={<ArticlesPage />} />
      <Route path={`${prefix}/blog/:articleId`} element={<ArticleDetailPage />} />
      <Route path={`${prefix}/contacts`} element={<ContactsPage />} />
      <Route path={`${prefix}/privacy`} element={<PrivacyPolicyPage />} />
      <Route path={`${prefix}/terms`} element={<TermsPage />} />
      <Route path={`${prefix}/payment-procedure`} element={<PaymentProcedurePage />} />
      <Route path={`${prefix}/payments`} element={<PaymentProcedurePage />} />
      <Route path={`${prefix}/payment`} element={<PaymentProcedurePage />} />
      <Route path={`${prefix}/cookies`} element={<CookiePolicyPage />} />
      <Route path={`${prefix}/cookie-policy`} element={<CookiePolicyPage />} />
    </>
  );

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F4F6F9] text-[#111827]">
      <Header onOpenAuth={handleOpenAuth} maintenance={maintenance?.active} />

      <main className="flex-1">
        <React.Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#165DFB] border-t-transparent rounded-full animate-spin" /></div>}>
          <Routes>
            {/* Default (Russian) */}
            {renderRoutes('')}

            {/* Kazakh (/kz) */}
            {renderRoutes('/kz')}

            {/* English (/en) */}
            {renderRoutes('/en')}
          </Routes>
        </React.Suspense>
      </main>

      <Footer />
      <CookieBanner />
      <WhatsAppWidget />
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
