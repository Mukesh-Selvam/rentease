import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, Wrench, RotateCcw } from 'lucide-react';
import productService from '../services/productService';
import ProductCard from '../features/catalog/ProductCard';
import { useCity } from '../context/CityContext';

export const HomePage = ({ onOpenAuthModal }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { selectedCity } = useCity();

  useEffect(() => {
    productService.getProducts({ featured: 'true', limit: 8, city: selectedCity })
      .then((res) => {
        setProducts(res.products || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedCity]);

  return (
    <div className="space-y-16 py-8">
      
      {/* Hero Banner Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-950 text-white rounded-3xl p-8 sm:p-14 overflow-hidden relative shadow-2xl flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="space-y-6 max-w-xl z-10">
            <span className="bg-red-500/20 text-red-400 border border-red-500/40 font-black text-[10px] px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              No Long-Term Lock-in
            </span>
            <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight">
              Live Better, <span className="text-red-500">Pay Monthly.</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium">
              Premium furniture &amp; home appliances delivered to your doorstep in 72 hours. Upgrade, downgrade, or return anytime with zero hassle.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/catalog"
                className="bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs px-7 py-4 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
              >
                <span>Browse Rental Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => onOpenAuthModal && onOpenAuthModal('VENDOR')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs px-6 py-4 rounded-full border border-slate-700 transition-all"
              >
                Partner with RentEase
              </button>
            </div>
          </div>

          <div className="w-full md:w-1/2 aspect-4/3 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 shrink-0">
            <img
              src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&auto=format&fit=crop&q=80"
              alt="RentEase Modern Home"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Truck, title: 'Free Delivery', desc: 'Doorstep setup in 72h' },
            { icon: Wrench, title: 'Free Maintenance', desc: 'Annual servicing included' },
            { icon: RotateCcw, title: 'Easy Returns', desc: 'Pickup on request' },
            { icon: ShieldCheck, title: '100% Refundable', desc: 'Security deposit safety' },
          ].map((b, i) => {
            const IconComponent = b.icon;
            return (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-1">
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">{b.title}</h3>
                <p className="text-xs text-slate-400 font-medium">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex justify-between items-end border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Curated Collections</span>
            <h2 className="text-2xl font-black text-slate-900 mt-1">Popular Rental Items in {selectedCity}</h2>
          </div>
          <Link to="/catalog" className="text-xs font-extrabold text-red-500 hover:underline flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="bg-white rounded-3xl h-80 border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard key={product.id || product._id} product={product} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
};

export default HomePage;
