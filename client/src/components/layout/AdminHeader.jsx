import { Link, useNavigate } from 'react-router-dom';
import { Eye, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminHeader = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  return (
    <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="flex items-center gap-2 text-left">
            <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <div className="flex flex-col leading-none">
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-white">rent<span className="text-red-500">ease</span></span>
                <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">ADMIN CONSOLE</span>
              </div>
              <span className="text-[9px] font-bold text-slate-400 tracking-[0.16em] uppercase mt-0.5">Platform Operations Suite</span>
            </div>
          </Link>
          <div className="hidden lg:flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-full border border-slate-800 text-[10px] font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>System Status: Live &amp; Synced</span>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        {setActiveTab && (
          <div className="flex items-center gap-1 bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-xs font-bold overflow-x-auto">
            {[
              { id: 'orders', label: 'Subscriptions & Orders' },
              { id: 'users', label: 'User Directory' },
              { id: 'approvals', label: 'Vendor Approvals' },
              { id: 'tickets', label: 'Service Desk' },
              { id: 'claims', label: 'Damage Claims' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all text-[11px] whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-red-400" />
            <span>Storefront Preview</span>
          </button>
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-200">
            <Shield className="w-4 h-4 text-red-400" />
            <span>{currentUser?.name || 'RentEase Admin'}</span>
          </div>
          <button
            onClick={logout}
            className="text-xs font-bold text-slate-400 hover:text-red-400 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
