import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RestaurantPage from './pages/RestaurantPage';
import FruitPage from './pages/FruitPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CheckoutPage from './pages/CheckoutPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import Cart from './components/Cart';
import { useToast } from './context/ToastContext';

// Lazy load admin pages and favorites (code splitting)
const DeliveryAdminPage = lazy(() => import('./pages/DeliveryAdminPage'));
const SuperAdminPage = lazy(() => import('./pages/SuperAdminPage'));
const EditRestaurantPage = lazy(() => import('./pages/EditRestaurantPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

function AppContent() {
  const { showWarning } = useToast();

  useEffect(() => {
    // Listen for inactivity logout event from AuthContext
    const handleInactivity = (event) => {
      showWarning(event.detail.message);
    };

    window.addEventListener('userInactivity', handleInactivity);
    return () => window.removeEventListener('userInactivity', handleInactivity);
  }, [showWarning]);

  return (
    <>
      <Cart />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/restaurants" element={<RestaurantPage />} />
        <Route path="/fruits" element={<FruitPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/resetpassword/:resettoken" element={<ResetPasswordPage />} />
        <Route 
          path="/favorites"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <FavoritesPage />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/deliveryadmin"
          element={
            <AdminRoute roles={['admin', 'deliveryadmin']}>
              <Suspense fallback={<PageLoader />}>
                <DeliveryAdminPage />
              </Suspense>
            </AdminRoute>
          } 
        />
        <Route 
          path="/superadmin"
          element={
            <AdminRoute roles={['admin']}>
              <Suspense fallback={<PageLoader />}>
                <SuperAdminPage />
              </Suspense>
            </AdminRoute>
          } 
        />
        <Route 
          path="/superadmin/restaurant/:id"
          element={
            <AdminRoute roles={['admin']}>
              <Suspense fallback={<PageLoader />}>
                <EditRestaurantPage />
              </Suspense>
            </AdminRoute>
          } 
        />
      </Routes>
    </>
  );
}

function App() {
  return <AppContent />;
}

export default App;
