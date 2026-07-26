import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const CartPage = ({ onOpenAuthModal }) => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateTenure, subtotalRent, subtotalDeposit, deliveryFee, taxes, totalDueToday } = useCart();
  const { currentUser } = useAuth();

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Explore our wide collection of home furniture, smart appliances, and curated room packages.
        </p>
        <Link to="/catalog" className="inline-block bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs px-6 py-3 rounded-full shadow-md">
          Explore Catalog
        </Link>
      </div>
    );
  }

  const handleCheckoutClick = () => {
    if (!currentUser) {
      if (onOpenAuthModal) onOpenAuthModal();
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <h1 className="text-3xl font-black text-slate-900">Your Rental Order Summary</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {cart.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="flex items-center gap-4">
                <img src={item.imageUrl} alt="" className="w-20 h-20 object-cover rounded-2xl border border-slate-100 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{item.brand}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs font-black text-red-500">₹{item.monthlyRent}/mo</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-xs font-bold text-emerald-600">Deposit: ₹{item.deposit}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-center">
                <select
                  value={item.tenureMonths}
                  onChange={(e) => updateTenure(item.id, Number(e.target.value))}
                  className="bg-slate-100 text-slate-800 font-extrabold text-xs px-3 py-2 rounded-xl outline-none border border-slate-200"
                >
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>12 Months</option>
                </select>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Price Breakdown Sidebar */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 self-start">
          <h2 className="font-black text-slate-900 text-lg">Upfront Price Summary</h2>

          <div className="space-y-3 text-xs text-slate-600 font-semibold border-b border-slate-100 pb-4">
            <div className="flex justify-between">
              <span>First Month Rent</span>
              <span className="font-bold text-slate-900">₹{subtotalRent}</span>
            </div>
            <div className="flex justify-between">
              <span>Refundable Security Deposit</span>
              <span className="font-bold text-emerald-600">₹{subtotalDeposit}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery &amp; Installation Fee</span>
              <span className="font-bold text-slate-900">₹{deliveryFee}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated GST (18%)</span>
              <span className="font-bold text-slate-900">₹{taxes}</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-1">
            <span>Total Due Today</span>
            <span className="text-xl text-red-500 font-black">₹{totalDueToday}</span>
          </div>

          <button
            onClick={handleCheckoutClick}
            className="w-full py-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs shadow-lg transition-transform hover:scale-[1.01] flex items-center justify-center gap-2"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};

export default CartPage;
