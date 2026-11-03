import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { ToastProvider } from '@shared';
import { AdminSidebar } from './components/common/AdminSidebar';
import { AdminLoginPage } from './pages/AdminLoginPage';
const AdminDashboardPage = React.lazy(() => import('./pages/AdminDashboardPage').then(module => ({ default: module.AdminDashboardPage })));
const AdminOrdersPage = React.lazy(() => import('./pages/AdminOrdersPage').then(module => ({ default: module.AdminOrdersPage })));
const AdminLeadsPage = React.lazy(() => import('./pages/AdminLeadsPage').then(module => ({ default: module.AdminLeadsPage })));
const AdminBugReportsPage = React.lazy(() => import('./pages/AdminBugReportsPage').then(module => ({ default: module.AdminBugReportsPage })));
const AdminUsersPage = React.lazy(() => import('./pages/AdminUsersPage').then(module => ({ default: module.AdminUsersPage })));
const AdminTariffsPage = React.lazy(() => import('./pages/AdminTariffsPage').then(module => ({ default: module.AdminTariffsPage })));
const AdminPriceBuilderPage = React.lazy(() => import('./pages/AdminPriceBuilderPage').then(module => ({ default: module.AdminPriceBuilderPage })));
const AdminInvoicesPage = React.lazy(() => import('./pages/AdminInvoicesPage').then(module => ({ default: module.AdminInvoicesPage })));
const AdminLabelDesignerPage = React.lazy(() => import('./pages/AdminLabelDesignerPage').then(module => ({ default: module.AdminLabelDesignerPage })));
const AdminLabelsRegistryPage = React.lazy(() => import('./pages/AdminLabelsRegistryPage').then(module => ({ default: module.AdminLabelsRegistryPage })));
const AdminOrderDetailPage = React.lazy(() => import('./pages/AdminOrderDetailPage').then(module => ({ default: module.AdminOrderDetailPage })));
const AdminUserDetailPage = React.lazy(() => import('./pages/AdminUserDetailPage').then(module => ({ default: module.AdminUserDetailPage })));
const AdminStickeringCalcPage = React.lazy(() => import('./pages/AdminStickeringCalcPage').then(module => ({ default: module.AdminStickeringCalcPage })));
const AdminSystemLayout = React.lazy(() => import('./pages/AdminSystemLayout').then(module => ({ default: module.AdminSystemLayout })));
const AdminSystemLogsPage = React.lazy(() => import('./pages/system/AdminSystemLogsPage').then(module => ({ default: module.AdminSystemLogsPage })));
const AdminSystemBackupsPage = React.lazy(() => import('./pages/system/AdminSystemBackupsPage').then(module => ({ default: module.AdminSystemBackupsPage })));
const AdminSystemTelegramPage = React.lazy(() => import('./pages/system/AdminSystemTelegramPage').then(module => ({ default: module.AdminSystemTelegramPage })));
const AdminSystemStoragePage = React.lazy(() => import('./pages/system/AdminSystemStoragePage').then(module => ({ default: module.AdminSystemStoragePage })));
const AdminSystemPdfQueuePage = React.lazy(() => import('./pages/system/AdminSystemPdfQueuePage').then(module => ({ default: module.AdminSystemPdfQueuePage })));
const AdminMarkirovkaAccountsPage = React.lazy(() => import('./pages/AdminMarkirovkaAccountsPage').then(module => ({ default: module.AdminMarkirovkaAccountsPage })));
const AdminMarkirovkaNktPage = React.lazy(() => import('./pages/AdminMarkirovkaNktPage').then(module => ({ default: module.AdminMarkirovkaNktPage })));
const AdminMarkirovkaOrdersPage = React.lazy(() => import('./pages/AdminMarkirovkaOrdersPage').then(module => ({ default: module.AdminMarkirovkaOrdersPage })));
const AdminMarkirovkaUtilisationPage = React.lazy(() => import('./pages/AdminMarkirovkaUtilisationPage').then(module => ({ default: module.AdminMarkirovkaUtilisationPage })));
const AdminMarkirovkaActivityPage = React.lazy(() => import('./pages/AdminMarkirovkaActivityPage').then(module => ({ default: module.AdminMarkirovkaActivityPage })));

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
      <ToastProvider>
        <BrowserRouter>
          <React.Suspense fallback={<LoadingScreen />}><Routes>
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
              path="/bug-reports"
              element={
                <ProtectedAdminLayout>
                  <AdminBugReportsPage />
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
              path="/price-builder"
              element={
                <ProtectedAdminLayout>
                  <AdminPriceBuilderPage />
                </ProtectedAdminLayout>
              }
            />
            <Route path="/price-lists" element={<Navigate to="/price-builder" replace />} />
            <Route path="/prices" element={<Navigate to="/price-builder" replace />} />

            <Route
              path="/invoices"
              element={
                <ProtectedAdminLayout>
                  <AdminInvoicesPage />
                </ProtectedAdminLayout>
              }
            />
            <Route path="/invoice" element={<Navigate to="/invoices" replace />} />

            <Route
              path="/system"
              element={
                <ProtectedAdminLayout>
                  <AdminSystemLayout />
                </ProtectedAdminLayout>
              }
            >
              <Route index element={<Navigate to="/system/logs" replace />} />
              <Route path="logs" element={<AdminSystemLogsPage />} />
              <Route path="backups" element={<AdminSystemBackupsPage />} />
              <Route path="telegram" element={<AdminSystemTelegramPage />} />
              <Route path="storage" element={<AdminSystemStoragePage />} />
              <Route path="pdf-queue" element={<AdminSystemPdfQueuePage />} />
            </Route>

            <Route
              path="/pdf-queue"
              element={<Navigate to="/system/pdf-queue" replace />}
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
              path="/markirovka/nkt"
              element={
                <ProtectedAdminLayout>
                  <AdminMarkirovkaNktPage />
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
          </Routes></React.Suspense>
        </BrowserRouter>
      </ToastProvider>
    </AdminAuthProvider>
  );
};

export default App;
