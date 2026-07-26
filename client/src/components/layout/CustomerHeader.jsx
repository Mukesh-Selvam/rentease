import { Link, useNavigate } from 'react-router-dom';
import { User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const CustomerHeader = ({ onOpenProfileModal }) => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const avatar = currentUser?.avatar || '';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-left">
            <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <div className="flex flex-col leading-none">
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-slate-900">rent<span className="text-red-500">ease</span></span>
                <span className="bg-red-50 text-red-600 border border-red-200 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">MY ACCOUNT</span>
              </div>
              <span className="text-[9px] font-bold text-slate-400 tracking-[0.16em] uppercase mt-0.5">Customer Rental Space</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold px-4 py-2 rounded-full border border-slate-200 transition-all flex items-center gap-1.5"
          >
            <span>← Back to Storefront</span>
          </button>

          <button
            onClick={onOpenProfileModal}
            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-800 transition-all shadow-xs"
            title="View Profile & KYC Settings"
          >
            {avatar ? (
              <img src={avatar} alt="" className="w-5 h-5 rounded-full object-cover border border-red-400" />
            ) : (
              <UserIcon className="w-4 h-4 text-red-500" />
            )}
            <span>{currentUser?.name || 'Customer'}</span>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
              currentUser?.kycStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {currentUser?.kycStatus === 'VERIFIED' ? 'Verified' : 'KYC Pending'}
            </span>
          </button>

          <button
            onClick={logout}
            className="text-xs font-bold text-slate-500 hover:text-red-500 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default CustomerHeader;
