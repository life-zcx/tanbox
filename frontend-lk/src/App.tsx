import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Plus, Tag, User, Menu } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/common/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { OrdersPage } from './pages/OrdersPage';
import { CreateOrderPage } from './pages/CreateOrderPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { LabelsRegistryPage } from './pages/LabelsRegistryPage';
import { ProfilePage } from './pages/ProfilePage';
import { MaintenanceScreen } from './components/common/MaintenanceScreen';
import { apiClient } from './api/client';

const OrderLabelsRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? `/orders/${id}` : '/orders'} replace />;
};

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
    <div className="flex flex-col items-center space-y-4">
      <img src="/tanbox-dark.svg" alt="tanbox" className="h-8 w-auto animate-pulse" />
      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
    </div>
  </div>
);

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      <Sidebar
        user={user}
        onLogout={logout}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Top Header */}
        <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-4 h-14 flex items-center justify-between shrink-0 shadow-xs">
          <Link to="/dashboard" className="flex items-center">
            <img src="/tanbox-dark.svg" alt="tanbox" className="h-6 w-auto" />
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/profile"
              title="Профиль"
              className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[#475569] transition-colors"
            >
              <User className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[#475569] transition-colors cursor-pointer"
              aria-label="Открыть меню"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-28 md:pb-8 overflow-y-auto max-w-full">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <Link
            to="/dashboard"
            className={`flex flex-col items-center justify-center py-1 px-2 min-w-[56px] rounded-xl transition-colors ${
              location.pathname === '/dashboard' ? 'text-[#0082FB] font-extrabold' : 'text-[#64748B] hover:text-[#111827]'
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 ${location.pathname === '/dashboard' ? 'text-[#0082FB] stroke-[2.5]' : 'text-[#64748B]'}`} />
            <span className="text-[10px] mt-1 font-bold">Главная</span>
          </Link>

          <Link
            to="/orders"
            className={`flex flex-col items-center justify-center py-1 px-2 min-w-[56px] rounded-xl transition-colors ${
              location.pathname.startsWith('/orders') && location.pathname !== '/orders/new' ? 'text-[#0082FB] font-extrabold' : 'text-[#64748B] hover:text-[#111827]'
            }`}
          >
            <FileText className={`w-5 h-5 ${location.pathname.startsWith('/orders') && location.pathname !== '/orders/new' ? 'text-[#0082FB] stroke-[2.5]' : 'text-[#64748B]'}`} />
            <span className="text-[10px] mt-1 font-bold">Заказы</span>
          </Link>

          <Link
            to="/orders/new"
            className="flex flex-col items-center justify-center -mt-5"
          >
            <div className="w-12 h-12 rounded-full bg-[#0082FB] text-white flex items-center justify-center shadow-lg shadow-[#0082FB]/35 active:scale-95 transition-transform">
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-extrabold text-[#0082FB] mt-0.5">Создать</span>
          </Link>

          <Link
            to="/labels"
            className={`flex flex-col items-center justify-center py-1 px-2 min-w-[56px] rounded-xl transition-colors ${
              location.pathname.startsWith('/labels') ? 'text-[#0082FB] font-extrabold' : 'text-[#64748B] hover:text-[#111827]'
            }`}
          >
            <Tag className={`w-5 h-5 ${location.pathname.startsWith('/labels') ? 'text-[#0082FB] stroke-[2.5]' : 'text-[#64748B]'}`} />
            <span className="text-[10px] mt-1 font-bold">Этикетки</span>
          </Link>

          <Link
            to="/profile"
            className={`flex flex-col items-center justify-center py-1 px-2 min-w-[56px] rounded-xl transition-colors ${
              location.pathname.startsWith('/profile') ? 'text-[#0082FB] font-extrabold' : 'text-[#64748B] hover:text-[#111827]'
            }`}
          >
            <User className={`w-5 h-5 ${location.pathname.startsWith('/profile') ? 'text-[#0082FB] stroke-[2.5]' : 'text-[#64748B]'}`} />
            <span className="text-[10px] mt-1 font-bold">Профиль</span>
          </Link>
        </nav>
      </div>
    </div>
  );
};

const LkRouter: React.FC = () => {
  const { user } = useAuth();
  const [maintenance, setMaintenance] = useState<{ active: boolean; message: string } | null>(null);

  useEffect(() => {
    const handleMaintenanceEvent = (e: any) => {
      setMaintenance({
        active: true,
        message: e.detail?.message || '',
      });
    };

    window.addEventListener('tanbox:maintenance', handleMaintenanceEvent);

    const checkHealth = async () => {
      try {
        const res = await apiClient.get('/health');
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

    checkHealth();
    const timer = setInterval(checkHealth, 20000);

    return () => {
      window.removeEventListener('tanbox:maintenance', handleMaintenanceEvent);
      clearInterval(timer);
    };
  }, []);

  if (maintenance?.active && user?.role !== 'ADMIN') {
    return <MaintenanceScreen message={maintenance.message} onCheckStatus={() => setMaintenance(null)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedLayout>
              <DashboardPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedLayout>
              <OrdersPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/orders/new"
          element={
            <ProtectedLayout>
              <CreateOrderPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/orders/:id"
          element={
            <ProtectedLayout>
              <OrderDetailPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/orders/:id/labels"
          element={
            <ProtectedLayout>
              <OrderLabelsRedirect />
            </ProtectedLayout>
          }
        />

        <Route
          path="/labels"
          element={
            <ProtectedLayout>
              <LabelsRegistryPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedLayout>
              <ProfilePage />
            </ProtectedLayout>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <LkRouter />
    </AuthProvider>
  );
};

export default App;
