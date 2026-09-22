import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { AdminSidebar } from './components/common/AdminSidebar';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminOrdersPage } from './pages/AdminOrdersPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminTariffsPage } from './pages/AdminTariffsPage';

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
    <div className="flex flex-col items-center space-y-4">
      <img src="/tanbox-dark.svg" alt="tanbox" className="h-8 w-auto animate-pulse" />
      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
    </div>
  </div>
);

const ProtectedAdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { adminUser, loading, logoutAdmin } = useAdminAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!adminUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <AdminSidebar user={adminUser} onLogout={logoutAdmin} />
      <main className="flex-1 p-8 overflow-y-auto min-h-screen">
        {children}
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AdminLoginPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedAdminLayout>
                <AdminDashboardPage />
              </ProtectedAdminLayout>
            }
          />

          <Route
            path="/orders"
            element={
              <ProtectedAdminLayout>
                <AdminOrdersPage />
              </ProtectedAdminLayout>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedAdminLayout>
                <AdminUsersPage />
              </ProtectedAdminLayout>
            }
          />

          <Route
            path="/tariffs"
            element={
              <ProtectedAdminLayout>
                <AdminTariffsPage />
              </ProtectedAdminLayout>
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  );
};

export default App;
