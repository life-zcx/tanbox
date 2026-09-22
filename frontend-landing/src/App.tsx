import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { HomePage } from './pages/HomePage';
import { CalculatorPage } from './pages/CalculatorPage';
import { TariffsPage } from './pages/TariffsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CategoryDetailPage } from './pages/CategoryDetailPage';
import { ContactsPage } from './pages/ContactsPage';
import { OrderQuickModal } from './components/modals/OrderQuickModal';
import { TariffCode } from './types';

export const App: React.FC = () => {
  const handleOpenAuth = () => {
    window.open('http://127.0.0.1:3001/dashboard', '_blank', 'noopener,noreferrer');
  };

  const [quickOrderState, setQuickOrderState] = useState<{
    isOpen: boolean;
    tariffType: TariffCode;
    itemsCount: number;
    totalPrice: number;
  }>({
    isOpen: false,
    tariffType: 'STANDARD',
    itemsCount: 10000,
    totalPrice: 550000,
  });

  const handleOpenQuickOrder = (tariffType: TariffCode, itemsCount: number, totalPrice: number) => {
    setQuickOrderState({
      isOpen: true,
      tariffType,
      itemsCount,
      totalPrice,
    });
  };

  return (
    <BrowserRouter>
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
          <Route path="/tariffs" element={<TariffsPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
        </Routes>

        <Footer />

        {/* Modals */}

        <OrderQuickModal
          isOpen={quickOrderState.isOpen}
          onClose={() => setQuickOrderState({ ...quickOrderState, isOpen: false })}
          tariffType={quickOrderState.tariffType}
          itemsCount={quickOrderState.itemsCount}
          totalPrice={quickOrderState.totalPrice}
        />
      </div>
    </BrowserRouter>
  );
};
export default App;
