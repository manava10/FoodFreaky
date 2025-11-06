import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RestaurantPage from './pages/RestaurantPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CheckoutPage from './pages/CheckoutPage';
import DeliveryAdminPage from './pages/DeliveryAdminPage';
import SuperAdminPage from './pages/SuperAdminPage';
import EditRestaurantPage from './pages/EditRestaurantPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import Cart from './components/Cart';
import { useToast } from './context/ToastContext';

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
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/resetpassword/:resettoken" element={<ResetPasswordPage />} />
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
              <DeliveryAdminPage />
            </AdminRoute>
          } 
        />
        <Route 
          path="/superadmin"
          element={
            <AdminRoute roles={['admin']}>
              <SuperAdminPage />
            </AdminRoute>
          } 
        />
        <Route 
          path="/superadmin/restaurant/:id"
          element={
            <AdminRoute roles={['admin']}>
              <EditRestaurantPage />
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
