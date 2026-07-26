import { Link, useNavigate } from 'react-router-dom';
import { MapPin, ChevronDown, Search, ShoppingBag, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useCity } from '../../context/CityContext';

export const StorefrontHeader = ({
  categoryFilter,
  setCategoryFilter,
  searchQuery,
  setSearchQuery,
  onOpenAuthModal
}) => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { cart } = useCart();
  const { selectedCity, setShowCityModal } = useCity();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        
        {/* Logo & City Selector */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 text-left group">
            <svg className="w-9 h-9 text-red-500 hover:rotate-6 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <div className="flex flex-col leading-none">
              <span className="font-black text-2xl tracking-tight text-slate-900" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.03em' }}>
                rent<span className="text-red-500">ease</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400 tracking-[0.16em] uppercase mt-0.5">Furniture &amp; Appliances</span>
            </div>
          </Link>

          <button
            onClick={() => setShowCityModal(true)}
            className="hidden sm:flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-full border border-slate-200 text-xs font-extrabold text-slate-800 transition-all shadow-sm"
          >
            <MapPin className="w-4 h-4 text-red-500" />
            <div className="text-left">
              <span className="text-[10px] text-slate-400 block font-bold leading-none">Deliver to</span>
              <span className="leading-tight block">{selectedCity}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl hidden md:block">
          <div className="flex items-center bg-slate-100 rounded-full overflow-hidden border border-slate-200 focus-within:border-red-400 focus-within:bg-white transition-all shadow-inner">
            <select
              value={categoryFilter || 'all'}
              onChange={(e) => {
                if (setCategoryFilter) setCategoryFilter(e.target.value);
                navigate(`/catalog?category=${e.target.value}`);
              }}
              className="bg-transparent text-slate-600 text-xs font-bold px-4 py-2.5 outline-none border-r border-slate-200 cursor-pointer hover:bg-slate-200/50 transition-colors"
            >
              <option value="all">All Categories</option>
              <option value="furniture">Furniture</option>
              <option value="appliances">Appliances</option>
              <option value="packages">Packages</option>
            </select>
            <input
              type="text"
              placeholder="Search premium beds, smart TVs, double-door refrigerators, lounge sofas..."
              value={searchQuery || ''}
              onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/catalog?search=${encodeURIComponent(searchQuery)}`); }}
              className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-xs px-4 py-2.5 outline-none"
            />
            <button
              onClick={() => navigate(`/catalog?search=${encodeURIComponent(searchQuery || '')}`)}
              className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full mx-1.5 transition-all flex items-center justify-center shadow-md"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cart & Auth Links */}
        <div className="flex items-center gap-4">
          <Link
            to="/cart"
            className="relative p-2 text-slate-700 hover:text-red-500 transition-colors flex items-center gap-1.5 font-extrabold text-xs"
          >
            <ShoppingBag className="w-5 h-5 text-slate-800" />
            <span className="hidden sm:inline">Cart</span>
            {cart.length > 0 && (
              <span className="bg-red-500 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                {cart.length}
              </span>
            )}
          </Link>

          {currentUser ? (
            <div className="flex items-center gap-3">
              <Link
                to={currentUser.role === 'ADMIN' ? '/admin' : currentUser.role === 'VENDOR' ? '/vendor' : '/dashboard'}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-full text-xs font-extrabold text-slate-900 border border-slate-200"
              >
                <UserIcon className="w-4 h-4 text-red-500" />
                <span>{currentUser.name.split(' ')[0]}</span>
              </Link>
              <button
                onClick={logout}
                className="text-xs font-bold text-slate-500 hover:text-red-500"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="bg-red-500 hover:bg-red-600 text-white text-xs font-extrabold px-6 py-2.5 rounded-full transition-all shadow-md hover:scale-105"
            >
              Login / Signup
            </button>
          )}
        </div>

      </div>

      {/* Category quick-links sub-bar */}
      <div className="hidden md:block border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 py-2 text-[11px] font-bold text-slate-500 overflow-x-auto">
            {[
              { label: 'Sofas & Seating', cat: 'furniture' },
              { label: 'Beds & Mattresses', cat: 'furniture' },
              { label: 'Refrigerators', cat: 'appliances' },
              { label: 'Washing Machines', cat: 'appliances' },
              { label: 'TVs & Displays', cat: 'appliances' },
              { label: 'WFH & Office', cat: 'furniture' },
              { label: 'Home Packages', cat: 'packages' },
            ].map((link) => (
              <button
                key={link.label}
                onClick={() => {
                  if (setCategoryFilter) setCategoryFilter(link.cat);
                  navigate(`/catalog?category=${link.cat}`);
                }}
                className="whitespace-nowrap hover:text-red-500 transition-colors py-1"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default StorefrontHeader;
