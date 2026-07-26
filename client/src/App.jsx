import { useState } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { CityProvider } from './context/CityContext';
import { ToastProvider } from './context/ToastContext';

import StorefrontHeader from './components/layout/StorefrontHeader';
import AnnouncementBar from './components/layout/AnnouncementBar';
import Footer from './components/layout/Footer';
import AuthModal from './features/auth/AuthModal';
import AppRouter from './app/router/AppRouter';

const AppContent = () => {
  const location = useLocation();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authRole, setAuthRole] = useState('CUSTOMER');

  const isPortal = location.pathname.startsWith('/admin') || location.pathname.startsWith('/vendor') || location.pathname.startsWith('/dashboard');

  const openAuth = (role = 'CUSTOMER') => {
    setAuthRole(role);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 antialiased selection:bg-red-500 selection:text-white">
      
      {!isPortal && (
        <>
          <AnnouncementBar onBecomePartnerClick={() => openAuth('VENDOR')} />
          <StorefrontHeader onOpenAuthModal={() => openAuth('CUSTOMER')} />
        </>
      )}

      <main className="flex-1">
        <AppRouter onOpenAuthModal={openAuth} />
      </main>

      {!isPortal && (
        <Footer onOpenVendorAuth={() => openAuth('VENDOR')} />
      )}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialRole={authRole}
      />

    </div>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <CityProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </CityProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
