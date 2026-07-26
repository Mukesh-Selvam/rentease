/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const LEGACY_CART_KEY = 'rentease_cart';

function getStoredCart(storageKey) {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) return JSON.parse(saved);

    // One-time migration from the previous browser-wide cart. It becomes a guest
    // cart and is never shown in a signed-in account's cart.
    if (storageKey === 'rentease_guest_cart') {
      const legacyCart = localStorage.getItem(LEGACY_CART_KEY);
      if (legacyCart) {
        localStorage.setItem(storageKey, legacyCart);
        localStorage.removeItem(LEGACY_CART_KEY);
        return JSON.parse(legacyCart);
      }
    }
  } catch {
    // Invalid local storage data should not prevent the storefront from loading.
  }
  return [];
}

export const CartProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const userId = currentUser?.id || currentUser?._id;
  const storageKey = userId ? `rentease_cart_${userId}` : 'rentease_guest_cart';
  const [cart, setCart] = useState(() => getStoredCart('rentease_guest_cart'));
  const [activeStorageKey, setActiveStorageKey] = useState('rentease_guest_cart');

  useEffect(() => {
    let isMounted = true;
    // Deferring the state update keeps the cart synchronised with auth without
    // writing the outgoing account's items into the incoming account's key.
    Promise.resolve().then(() => {
      if (!isMounted) return;
      setCart(getStoredCart(storageKey));
      setActiveStorageKey(storageKey);
    });
    return () => { isMounted = false; };
  }, [storageKey]);

  useEffect(() => {
    if (activeStorageKey === storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(cart));
    }
  }, [cart, activeStorageKey, storageKey]);

  const addToCart = (product, tenure = 12) => {
    const tenurePricesMap = product.tenurePrices instanceof Map 
      ? Object.fromEntries(product.tenurePrices) 
      : product.tenurePrices || {};

    const monthlyPrice = tenurePricesMap[String(tenure)] || product.monthlyRent || product.price;
    const existingIndex = cart.findIndex((i) => i.id === (product.id || product._id));

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].tenureMonths = tenure;
      updated[existingIndex].monthlyRent = monthlyPrice;
      setCart(updated);
    } else {
      const newItem = {
        id: product.id || product._id,
        title: product.title,
        monthlyRent: monthlyPrice,
        deposit: product.deposit,
        tenureMonths: tenure,
        tenurePrices: tenurePricesMap,
        imageUrl: product.images && product.images.length > 0 ? product.images[0] : 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80',
        category: product.category,
        brand: product.vendorName || 'RentEase Partner'
      };
      setCart([...cart, newItem]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const updateTenure = (id, newTenure) => {
    setCart(
      cart.map((item) => {
        if (item.id === id) {
          const newRent = (item.tenurePrices && item.tenurePrices[String(newTenure)]) || item.monthlyRent;
          return { ...item, tenureMonths: newTenure, monthlyRent: newRent };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const subtotalRent = cart.reduce((acc, item) => acc + item.monthlyRent, 0);
  const subtotalDeposit = cart.reduce((acc, item) => acc + item.deposit, 0);
  const deliveryFee = cart.length > 0 ? 399 : 0;
  // Match the server pricing policy: GST applies to the first month's rental charge,
  // not to the refundable deposit or delivery fee.
  const taxes = Math.round(subtotalRent * 0.18);
  const totalDueToday = subtotalRent + subtotalDeposit + deliveryFee + taxes;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateTenure,
        clearCart,
        subtotalRent,
        subtotalDeposit,
        deliveryFee,
        taxes,
        totalDueToday
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
