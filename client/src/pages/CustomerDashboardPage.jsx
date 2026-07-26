import { useState, useEffect } from 'react';
import { Package, UserCheck, ShieldCheck, MapPin } from 'lucide-react';
import orderService from '../services/orderService';
import paymentService from '../services/paymentService';
import authService from '../services/authService';
import CustomerHeader from '../components/layout/CustomerHeader';
import ProfileModal from '../features/customer/ProfileModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const CustomerDashboardPage = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const { triggerToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rentals'); // 'rentals' | 'invoices' | 'profile'
  const [refreshKey, setRefreshKey] = useState(0);

  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      orderService.getOrders(),
      paymentService.getInvoices()
    ])
      .then(([orderRes, invoiceRes]) => {
        if (!isMounted) return;
        setOrders(orderRes || []);
        setInvoices(invoiceRes || []);
      })
      .catch(() => {
        if (isMounted) triggerToast('Failed to load active subscription data.', 'error');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [triggerToast, refreshKey]);

  const handleReturnRequest = async (orderId) => {
    try {
      await orderService.returnOrder(orderId, { reason: 'End of Lease' });
      triggerToast('Return pickup requested successfully.');
      setRefreshKey((k) => k + 1);
    } catch {
      triggerToast('Failed to request return pickup.', 'error');
    }
  };

  const handleExtendRequest = async (orderId) => {
    try {
      await orderService.extendOrder(orderId, 3);
      triggerToast('Lease extended by 3 months successfully!');
      setRefreshKey((k) => k + 1);
    } catch {
      triggerToast('Failed to extend tenure.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <CustomerHeader onOpenProfileModal={() => setShowProfileModal(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome Section */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-red-500 shadow-md shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-red-500 text-white font-black text-2xl flex items-center justify-center shrink-0">
                {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block">Active Subscriber</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                  currentUser?.kycStatus === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                }`}>
                  KYC: {currentUser?.kycStatus || 'NOT_SUBMITTED'}
                </span>
              </div>
              <h1 className="text-2xl font-black mt-0.5">Welcome back, {currentUser?.name}!</h1>
              <p className="text-xs text-slate-400 mt-1">{currentUser?.email} • {currentUser?.city || 'Bengaluru'}</p>
            </div>
          </div>

          <div className="flex bg-slate-800 p-1 rounded-2xl text-xs font-bold border border-slate-700">
            <button
              onClick={() => setActiveTab('rentals')}
              className={`px-4 py-2 rounded-xl transition-all ${activeTab === 'rentals' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Active Rentals ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 rounded-xl transition-all ${activeTab === 'invoices' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Bills &amp; Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              My Profile &amp; KYC
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : activeTab === 'rentals' ? (
          orders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-extrabold text-slate-900 text-base">No Active Rentals</h3>
              <p className="text-xs text-slate-500">You currently have no active rental items under subscription.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {orders.map((order) => (
                <div key={order.id || order._id} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-xs">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block">{order.rentalCode}</span>
                      <h3 className="font-black text-base text-slate-900 mt-0.5">{order.productTitle}</h3>
                      <span className="text-xs font-bold text-red-500 mt-1 block">₹{order.monthlyRent}/mo</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      order.status === 'ACTIVE' || order.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 font-semibold bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div><strong>Tenure:</strong> {order.tenureMonths} Months</div>
                    <div><strong>Delivery:</strong> {order.deliveryDate}</div>
                    <div><strong>Deposit Paid:</strong> ₹{order.deposit}</div>
                    <div><strong>Next Bill:</strong> {order.nextPaymentDate || 'Monthly'}</div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleExtendRequest(order.id || order._id)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors"
                    >
                      Extend Lease (+3 Mo)
                    </button>
                    <button
                      onClick={() => handleReturnRequest(order.id || order._id)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs border border-slate-200 transition-colors"
                    >
                      Request Return
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'invoices' ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h3 className="font-black text-slate-900 text-base">Invoices &amp; Transaction Receipts</h3>
            {invoices.length === 0 ? (
              <p className="text-xs text-slate-500">No payment invoices found.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <div key={inv.id || inv._id} className="py-3 flex justify-between items-center text-xs font-semibold">
                    <div>
                      <strong className="text-slate-900 block font-mono">{inv.invoiceNumber}</strong>
                      <span className="text-slate-400">{inv.createdAt?.split('T')[0]} • {inv.paymentMethod}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 block">₹{inv.amount}</span>
                      <span className="text-emerald-600 font-extrabold uppercase text-[10px]">{inv.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Profile & KYC Dashboard Tab */
          <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6 shadow-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Customer Profile &amp; Verification Details</h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage your personal information, KYC identity proof, and saved delivery addresses.</p>
              </div>
              <button
                onClick={() => setShowProfileModal(true)}
                className="bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span>Edit Profile Settings</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Profile Card */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">Account Details</h3>
                <div className="space-y-2 text-xs text-slate-700">
                  <div><strong>Full Name:</strong> {currentUser?.name}</div>
                  <div><strong>Email Address:</strong> {currentUser?.email}</div>
                  <div><strong>Phone Number:</strong> {currentUser?.phone || '+91 98765 00003'}</div>
                  <div><strong>Service City:</strong> {currentUser?.city || 'Bengaluru'}</div>
                </div>
              </div>

              {/* Verification Status Card */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-red-500" />
                  <span>KYC Identity Status</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase ${
                    currentUser?.kycStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {currentUser?.kycStatus || 'NOT_SUBMITTED'}
                  </span>
                  <p className="text-slate-500 text-[11px] font-medium leading-relaxed">
                    {currentUser?.kycStatus === 'VERIFIED'
                      ? 'Identity document verified for high-value furniture & appliance subscriptions.'
                      : 'Upload Aadhaar, Passport, or Driving License for instant rental approval.'}
                  </p>
                </div>
              </div>

              {/* Address Book Card */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span>Saved Addresses</span>
                </h3>
                <div className="space-y-2 text-xs">
                  {(currentUser?.addresses || []).length === 0 ? (
                    <p className="text-slate-400">Flat 402, Sunshine Heights, HSR Layout Sector 1, Bengaluru - 560102</p>
                  ) : (
                    currentUser.addresses.map((a, i) => (
                      <div key={i} className="text-slate-700 font-medium">
                        <strong>{a.label}:</strong> {a.street}, {a.city} - {a.pincode}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onProfileUpdated={() => {
          authService.getCurrentUser().then((user) => setCurrentUser(user));
        }}
      />
    </div>
  );
};

export default CustomerDashboardPage;
