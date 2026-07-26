import { Link } from 'react-router-dom';
import { CITIES, useCity } from '../../context/CityContext';

export const Footer = ({ onOpenVendorAuth }) => {
  const { setSelectedCity } = useCity();

  return (
    <footer className="bg-slate-900 text-slate-400 py-14 border-t border-slate-800 mt-20 text-xs">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div className="space-y-3">
          <h4 className="font-black text-white text-base">RentEase Engine</h4>
          <p className="text-slate-400 text-xs leading-relaxed">
            India's leading furniture and appliance rental platform. Flexible monthly subscriptions for living made easy.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-black text-white text-sm">Categories</h4>
          <ul className="space-y-1.5 text-slate-400">
            <li><Link to="/catalog?category=furniture" className="hover:text-white">Furniture Rentals</Link></li>
            <li><Link to="/catalog?category=appliances" className="hover:text-white">Appliance Rentals</Link></li>
            <li><Link to="/catalog?category=packages" className="hover:text-white">Room Packages</Link></li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-black text-white text-sm">Service Cities</h4>
          <ul className="space-y-1.5 text-slate-400">
            {CITIES.map((c) => (
              <li key={c.name}>
                <button onClick={() => setSelectedCity(c.name)} className="hover:text-white">
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-black text-white text-sm">Partners</h4>
          <ul className="space-y-1.5 text-slate-400">
            {onOpenVendorAuth && (
              <li>
                <button onClick={onOpenVendorAuth} className="hover:text-white">
                  Become a Vendor Partner
                </button>
              </li>
            )}
            {onOpenVendorAuth && (
              <li>
                <button onClick={onOpenVendorAuth} className="hover:text-white">
                  Partner Login
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-center">
        <div className="flex items-center gap-2">
          <span className="font-black text-white text-sm">rentease</span>
          <span className="text-slate-600 text-xs">·</span>
          <p className="text-slate-500 text-xs">© 2026 RentEase Technologies Pvt. Ltd. All rights reserved.</p>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <span className="hover:text-white cursor-pointer">Privacy Policy</span>
          <span className="hover:text-white cursor-pointer">Terms of Service</span>
          <span className="hover:text-white cursor-pointer">Refund Policy</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
