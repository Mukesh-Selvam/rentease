import { useAuth } from '../../context/AuthContext';

export const AnnouncementBar = ({ onBecomePartnerClick }) => {
  const { currentUser } = useAuth();

  return (
    <div className="bg-[#0f1111] text-white text-[11px] py-2.5 px-4 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="bg-red-500 text-white font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider">
            Assurance
          </span>
          <span className="text-slate-300 font-medium">
            ⚡ 72-Hour Free Delivery &amp; Installation · Zero Hidden Charges
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-slate-300 font-semibold">
          <span className="hover:text-white transition-colors cursor-pointer">Toll-Free: 1800-208-4000</span>
          <span className="text-slate-600">|</span>
          {!currentUser && (
            <button
              onClick={onBecomePartnerClick}
              className="hover:text-white transition-colors text-slate-300"
            >
              Become a Partner
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBar;
