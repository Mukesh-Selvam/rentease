import { X, MapPin } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import adminService from '../../services/adminService';

export const CustomerInspectModal = ({ customer, onClose, onRefresh }) => {
  const { triggerToast } = useToast();

  if (!customer) return null;

  const handleToggleStatus = async () => {
    try {
      const newStatus = customer.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
      await adminService.updateUserStatus(customer.id || customer._id, { status: newStatus });
      triggerToast(`Account status set to ${newStatus}`);
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Failed to update user status.', 'error');
    }
  };

  const handleToggleKyc = async () => {
    try {
      const newKyc = customer.kycStatus === 'VERIFIED' ? 'PENDING' : 'VERIFIED';
      await adminService.updateUserStatus(customer.id || customer._id, { kycStatus: newKyc });
      triggerToast(`KYC status set to ${newKyc}`);
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Failed to update KYC status.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
        
        {/* Modal Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white font-black text-xl flex items-center justify-center shadow-md">
              {customer.name ? customer.name.charAt(0) : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-xl text-slate-900">{customer.name}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  customer.role === 'VENDOR' ? 'bg-purple-100 text-purple-800' :
                  customer.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {customer.role}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  customer.status === 'INACTIVE' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {customer.status || 'ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{customer.email} • Registered {customer.date || customer.createdAt?.split('T')[0] || '2026-02-10'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">KYC Verification</span>
            <span className={`text-sm font-black mt-1 inline-block ${
              customer.kycStatus === 'VERIFIED' ? 'text-emerald-600' :
              customer.kycStatus === 'PENDING' ? 'text-amber-600' : 'text-slate-500'
            }`}>
              {customer.kycStatus || 'PENDING'}
            </span>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Primary City</span>
            <span className="text-sm font-black text-slate-900 mt-1 block">{customer.city || 'Bengaluru'}</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Lifetime Platform Spend</span>
            <span className="text-sm font-black text-red-500 mt-1 block">₹{(customer.totalSpend || 12450).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Customer Details Breakdown */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-red-500" />
              <span>Contact &amp; Delivery Address</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 font-medium pt-1">
              <div><strong>Phone:</strong> {customer.phone || '+91 98765 00003'}</div>
              <div><strong>Email:</strong> {customer.email}</div>
              <div className="sm:col-span-2">
                <strong>Primary Address:</strong> {customer.address || 'Flat 402, Sunshine Heights, HSR Layout Sector 1, Bengaluru - 560102'}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-wrap justify-between items-center border-t border-slate-100 pt-4 gap-3">
          <div className="flex gap-2">
            <button
              onClick={handleToggleKyc}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold px-4 py-2 rounded-xl transition-all"
            >
              {customer.kycStatus === 'VERIFIED' ? 'Revoke KYC' : 'Approve KYC Verification'}
            </button>
            <button
              onClick={handleToggleStatus}
              className={`text-xs font-extrabold px-4 py-2 rounded-xl transition-all ${
                customer.status === 'INACTIVE'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              {customer.status === 'INACTIVE' ? 'Activate Account' : 'Deactivate Account'}
            </button>
          </div>

          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black px-5 py-2 rounded-xl"
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );
};

export default CustomerInspectModal;
