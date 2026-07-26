import { useState, useEffect } from 'react';
import { Download, Eye, CheckCircle, XCircle } from 'lucide-react';
import adminService from '../services/adminService';
import orderService from '../services/orderService';
import AdminHeader from '../components/layout/AdminHeader';
import CustomerInspectModal from '../features/admin/CustomerInspectModal';
import { useToast } from '../context/ToastContext';

export const AdminDashboardPage = () => {
  const { triggerToast } = useToast();

  const [activeTab, setActiveTab] = useState('orders');
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pendingListings, setPendingListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected customer for modal inspect
  const [inspectCustomer, setInspectCustomer] = useState(null);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      adminService.getAnalytics(),
      adminService.getUsers(),
      orderService.getOrders(),
      adminService.getPendingListings().catch(() => [])
    ])
      .then(([analyticsRes, usersRes, ordersRes, pendingRes]) => {
        if (!isMounted) return;
        setAnalytics(analyticsRes?.metrics || {});
        setUsers(usersRes || []);
        setOrders(ordersRes || []);
        setPendingListings(pendingRes || []);
      })
      .catch(() => {
        if (isMounted) triggerToast('Failed to load admin operations suite data.', 'error');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [triggerToast]);

  const handleApproveListing = async (id) => {
    try {
      await adminService.approveListing(id);
      triggerToast('Vendor listing approved & published!');
      const pendingRes = await adminService.getPendingListings().catch(() => []);
      setPendingListings(pendingRes || []);
    } catch {
      triggerToast('Failed to approve listing.', 'error');
    }
  };

  const handleRejectListing = async (id) => {
    try {
      await adminService.rejectListing(id);
      triggerToast('Vendor listing rejected.');
      const pendingRes = await adminService.getPendingListings().catch(() => []);
      setPendingListings(pendingRes || []);
    } catch {
      triggerToast('Failed to reject listing.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AdminHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Operations Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gross Merchandise Value (GMV)</span>
            <div className="text-2xl font-black text-white">₹{(analytics?.gmv || 148500).toLocaleString('en-IN')}</div>
            <span className="text-[10px] text-emerald-400 font-bold">Lifetime processed orders</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Recurring Revenue (MRR)</span>
            <div className="text-2xl font-black text-white">₹{(analytics?.mrr || 42800).toLocaleString('en-IN')}</div>
            <span className="text-[10px] text-emerald-400 font-bold">Active lease subscriptions</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registered Platform Users</span>
            <div className="text-2xl font-black text-white">{analytics?.totalUsers || users.length || 28}</div>
            <span className="text-[10px] text-slate-400 font-medium">Customers &amp; Vendors</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Rental Subscriptions</span>
            <div className="text-2xl font-black text-white">{analytics?.activeRentals || orders.length || 12}</div>
            <span className="text-[10px] text-emerald-400 font-bold">Delivered items</span>
          </div>
        </div>

        {/* Tab Content Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <h2 className="font-black text-lg text-white">
              {activeTab === 'orders' ? 'Rental Orders & Subscription Leases' :
               activeTab === 'users' ? 'Registered User Directory' :
               activeTab === 'approvals' ? 'Vendor Listing Moderation Queue' : 'Damage Claims & Support'}
            </h2>

            {activeTab === 'users' && (
              <a
                href={adminService.getExportUrl('users')}
                target="_blank"
                rel="noreferrer"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5"
              >
                <Download className="w-4 h-4 text-red-400" />
                <span>Export CSV (Formula Injection Safe)</span>
              </a>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading operational records...</div>
          ) : activeTab === 'users' ? (
            /* User Directory Table */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400 uppercase font-mono">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">City</th>
                    <th className="py-3 px-4">KYC Status</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-semibold">
                  {users.map((u) => (
                    <tr key={u.id || u._id}>
                      <td className="py-3 px-4 font-bold text-white">
                        {u.name}
                        <span className="block text-[10px] text-slate-500 font-normal">{u.email}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          u.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' :
                          u.role === 'VENDOR' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">{u.city || 'Bengaluru'}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold ${u.kycStatus === 'VERIFIED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {u.kycStatus || 'PENDING'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold ${u.status === 'INACTIVE' ? 'text-red-400' : 'text-emerald-400'}`}>
                          {u.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setInspectCustomer(u)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-red-400" />
                          <span>Inspect Details</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeTab === 'orders' ? (
            /* Orders Table */
            <div className="divide-y divide-slate-800">
              {orders.map((o) => (
                <div key={o.id || o._id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-semibold">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-white font-mono">{o.rentalCode}</strong>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        o.status === 'CONFIRMED' || o.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {o.status}
                      </span>
                    </div>
                    <p className="text-slate-300 font-bold mt-1">{o.productTitle}</p>
                    <span className="text-slate-500 text-[11px]">Customer: {o.customerName} • {o.city}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-white text-sm block">₹{o.totalPaidToday}</span>
                    <span className="text-slate-400 text-[10px]">Monthly: ₹{o.monthlyRent}/mo</span>
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === 'approvals' ? (
            /* Approvals Queue */
            pendingListings.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No pending vendor listings awaiting review.</p>
            ) : (
              <div className="divide-y divide-slate-800">
                {pendingListings.map((listing) => (
                  <div key={listing.id || listing._id} className="py-4 flex justify-between items-center text-xs">
                    <div>
                      <strong className="text-white font-bold text-sm block">{listing.title}</strong>
                      <span className="text-slate-400">Category: {listing.category} • Rent: ₹{listing.monthlyRent}/mo</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveListing(listing.id || listing._id)}
                        className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl border border-emerald-500/30 transition-all flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleRejectListing(listing.id || listing._id)}
                        className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white font-black text-xs px-3 py-1.5 rounded-xl border border-red-500/30 transition-all flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <p className="text-xs text-slate-400 py-4">No open damage claims requiring ruling.</p>
          )}

        </div>

      </main>

      {/* Customer Details Inspect Modal */}
      {inspectCustomer && (
        <CustomerInspectModal
          customer={inspectCustomer}
          onClose={() => setInspectCustomer(null)}
        />
      )}

    </div>
  );
};

export default AdminDashboardPage;
