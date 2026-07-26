import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute, RoleGuard } from '../../features/auth/ProtectedRoute';

import HomePage from '../../pages/HomePage';
import CatalogPage from '../../pages/CatalogPage';
import ProductDetailPage from '../../pages/ProductDetailPage';
import CartPage from '../../pages/CartPage';
import CheckoutPage from '../../pages/CheckoutPage';
import ConfirmationPage from '../../pages/ConfirmationPage';
import CustomerDashboardPage from '../../pages/CustomerDashboardPage';
import VendorDashboardPage from '../../pages/VendorDashboardPage';
import AdminDashboardPage from '../../pages/AdminDashboardPage';
import ResetPasswordPage from '../../pages/ResetPasswordPage';
import NotFoundPage from '../../pages/NotFoundPage';

export const AppRouter = ({ onOpenAuthModal }) => {
  return (
    <Routes>
      <Route path="/" element={<HomePage onOpenAuthModal={onOpenAuthModal} />} />
      <Route path="/catalog" element={<CatalogPage onOpenAuthModal={onOpenAuthModal} />} />
      <Route path="/product/:id" element={<ProductDetailPage onOpenAuthModal={onOpenAuthModal} />} />
      <Route path="/cart" element={<CartPage onOpenAuthModal={onOpenAuthModal} />} />
      
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/confirmation"
        element={
          <ProtectedRoute>
            <ConfirmationPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <CustomerDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/vendor"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['VENDOR', 'ADMIN']}>
              <VendorDashboardPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['ADMIN']}>
              <AdminDashboardPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRouter;
