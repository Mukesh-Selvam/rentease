import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const VendorHeader = ({ activeTab, setActiveTab, onAddListingClick }) => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 border-t-4 border-t-emerald-500 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/vendor" className="flex items-center gap-2 text-left">
            <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <div className="flex flex-col leading-none">
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-white">rent<span className="text-emerald-400">ease</span></span>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">VENDOR PORTAL</span>
              </div>
              <span className="text-[9px] font-bold text-emerald-400/80 tracking-[0.16em] uppercase mt-0.5">{currentUser?.name || 'Urban Decor Logistics'}</span>
            </div>
          </Link>
        </div>

        {/* Vendor Navigation Tabs */}
        {setActiveTab && (
          <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-bold overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Overview Dashboard' },
              { id: 'listings', label: 'My Listings' },
              { id: 'orders', label: 'Rental Orders' },
              { id: 'claims', label: 'Claims & Support' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all text-[11px] whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          {onAddListingClick && (
            <button
              onClick={onAddListingClick}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black px-3.5 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Product Listing</span>
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 transition-all flex items-center gap-1"
          >
            <span>View Storefront</span>
          </button>
          <button
            onClick={logout}
            className="text-xs font-bold text-slate-400 hover:text-emerald-400 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default VendorHeader;
