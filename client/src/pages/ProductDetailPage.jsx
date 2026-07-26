import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ShieldCheck, Truck, ShoppingBag } from 'lucide-react';
import productService from '../services/productService';
import { useCart } from '../context/CartContext';
import { useCity } from '../context/CityContext';
import { useToast } from '../context/ToastContext';

export const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { selectedCity } = useCity();
  const { triggerToast } = useToast();

  const [product, setProduct] = useState(null);
  const [selectedTenure, setSelectedTenure] = useState(12);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productService.getProductById(id)
      .then((res) => setProduct(res))
      .catch(() => triggerToast('Failed to load product details.', 'error'))
      .finally(() => setLoading(false));
  }, [id, triggerToast]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-black text-slate-900">Product Not Found</h2>
        <button onClick={() => navigate('/catalog')} className="bg-red-500 text-white font-bold text-xs px-6 py-3 rounded-full">
          Back to Catalog
        </button>
      </div>
    );
  }

  const tenurePricesMap = product.tenurePrices instanceof Map
    ? Object.fromEntries(product.tenurePrices)
    : product.tenurePrices || { 3: Math.round(product.monthlyRent * 1.2), 6: Math.round(product.monthlyRent * 1.1), 12: product.monthlyRent };

  const currentMonthlyRent = tenurePricesMap[String(selectedTenure)] || product.monthlyRent;
  const images = product.images && product.images.length > 0 ? product.images : ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-4/3 rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-md">
            <img src={images[activeImage] || images[0]} alt={product.title} className="w-full h-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all ${
                    activeImage === idx ? 'border-red-500 scale-105' : 'border-slate-200'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Pricing & Options */}
        <div className="lg:col-span-5 space-y-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-red-50 text-red-600 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-red-100">
                {product.category}
              </span>
              <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{product.rating || 4.8}</span>
              </div>
            </div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight">{product.title}</h1>
            <p className="text-xs text-slate-500 mt-1">Vendor Partner: <strong>{product.vendorName || 'RentEase Assured'}</strong></p>
          </div>

          {/* Tenure Pricing Picker */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block">
              Choose Rental Tenure:
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[3, 6, 12].map((m) => {
                const rent = tenurePricesMap[String(m)] || Math.round(product.monthlyRent * (m === 3 ? 1.2 : m === 6 ? 1.1 : 1));
                return (
                  <button
                    key={m}
                    onClick={() => setSelectedTenure(m)}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      selectedTenure === m
                        ? 'bg-slate-900 text-white border-slate-900 font-black shadow-md scale-105'
                        : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 font-bold'
                    }`}
                  >
                    <span className="text-xs block leading-none font-bold">{m} Months</span>
                    <span className="text-sm font-black mt-1 block">₹{rent}/mo</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Deposit & Price Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between font-bold text-slate-700">
              <span>Monthly Rent ({selectedTenure} mo)</span>
              <span className="font-black text-slate-900">₹{currentMonthlyRent}/mo</span>
            </div>
            <div className="flex justify-between font-bold text-slate-700">
              <span>Refundable Security Deposit</span>
              <span className="font-black text-emerald-600">₹{product.deposit}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => {
                addToCart(product, selectedTenure);
                triggerToast(`Added "${product.title}" to cart!`);
                navigate('/cart');
              }}
              className="w-full py-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs shadow-lg transition-transform hover:scale-[1.01] flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Rent Now • ₹{currentMonthlyRent}/mo</span>
            </button>
          </div>

          {/* Service Guarantees */}
          <div className="border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-medium">
              <Truck className="w-4 h-4 text-red-500 shrink-0" />
              <span>Free Delivery &amp; Setup in <strong>{selectedCity}</strong></span>
            </div>
            <div className="flex items-center gap-2 font-medium">
              <ShieldCheck className="w-4 h-4 text-red-500 shrink-0" />
              <span>Annual Servicing Included</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default ProductDetailPage;
