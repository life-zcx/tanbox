import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { AdminSidebar } from './components/common/AdminSidebar';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminOrdersPage } from './pages/AdminOrdersPage';
import { AdminLeadsPage } from './pages/AdminLeadsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminTariffsPage } from './pages/AdminTariffsPage';
import { AdminLabelDesignerPage } from './pages/AdminLabelDesignerPage';
import { AdminLabelsRegistryPage } from './pages/AdminLabelsRegistryPage';
import { AdminOrderDetailPage } from './pages/AdminOrderDetailPage';
import { AdminUserDetailPage } from './pages/AdminUserDetailPage';
import { AdminStickeringCalcPage } from './pages/AdminStickeringCalcPage';
import { AdminSystemPage } from './pages/AdminSystemPage';
import { AdminPdfQueuePage } from './pages/AdminPdfQueuePage';
import { AdminMarkirovkaAccountsPage } from './pages/AdminMarkirovkaAccountsPage';
import { AdminMarkirovkaOrdersPage } from './pages/AdminMarkirovkaOrdersPage';
import { AdminMarkirovkaUtilisationPage } from './pages/AdminMarkirovkaUtilisationPage';
import { AdminMarkirovkaActivityPage } from './pages/AdminMarkirovkaActivityPage';

const AdminOrderLabelsRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? `/orders/${id}` : '/orders'} replace />;
};

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
    <div className="flex flex-col items-center space-y-4">
      <img src="/tanbox-dark.svg" alt="tanbox" className="h-8 w-auto animate-pulse" />
      <div className="w-5 h-5 border-2 border-[#0082FB] border-t-transparent rounded-full animate-spin"></div>
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
    <div className="min-h-screen flex bg-[#F4F6F9]">
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
            path="/labels"
            element={
              <ProtectedAdminLayout>
                <AdminLabelsRegistryPage />
              </ProtectedAdminLayout>
            }
          />

          <Route
            path="/label-designer"
            element={
              <ProtectedAdminLayout>
                <AdminLabelDesignerPage />
              </ProtectedAdminLayout>
            }
          />

          <Route
            path="/leads"
            element={
              <ProtectedAdminLayout>
                <AdminLeadsPage />
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
            path="/stickering-calc"
            element={
              <ProtectedAdminLayout>
                <AdminStickeringCalcPage />
              </ProtectedAdminLayout>
            }
          />

          <Route
            path="/orders/:id"
            element={
              <ProtectedAdminLayout>
                <AdminOrderDetailPage />
              </ProtectedAdminLayout>
            }
          />

          <Route
            path="/orders/:id/labels"
            element={
              <ProtectedAdminLayout>
                <AdminOrderLabelsRedirect />
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
            path="/users/:id"
            element={
              <ProtectedAdminLayout>
                <AdminUserDetailPage />
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

          <Route
            path="/system"
            element={
              <ProtectedAdminLayout>
                <AdminSystemPage />
              </ProtectedAdminLayout>
            }
          />

          <Route
            path="/pdf-queue"
            element={
              <ProtectedAdminLayout>
                <AdminPdfQueuePage />
              </ProtectedAdminLayout>
            }
          />

          <Route
            path="/markirovka"
            element={<Navigate to="/markirovka/accounts" replace />}
          />
          <Route
            path="/markirovka/accounts"
            element={
              <ProtectedAdminLayout>
                <AdminMarkirovkaAccountsPage />
              </ProtectedAdminLayout>
            }
          />
          <Route
            path="/markirovka/orders"
            element={
              <ProtectedAdminLayout>
                <AdminMarkirovkaOrdersPage />
              </ProtectedAdminLayout>
            }
          />
          <Route
            path="/markirovka/utilisation"
            element={
              <ProtectedAdminLayout>
                <AdminMarkirovkaUtilisationPage />
              </ProtectedAdminLayout>
            }
          />
          <Route
            path="/markirovka/activity"
            element={
              <ProtectedAdminLayout>
                <AdminMarkirovkaActivityPage />
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
