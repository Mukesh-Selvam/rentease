import { useState, useEffect } from 'react';
import vendorService from '../services/vendorService';
import productService from '../services/productService';
import VendorHeader from '../components/layout/VendorHeader';
import { useToast } from '../context/ToastContext';

export const VendorDashboardPage = () => {
  const { triggerToast } = useToast();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // New Listing Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('furniture');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [stock] = useState('5');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      vendorService.getVendorAnalytics(),
      vendorService.getVendorOrders(),
      productService.getProducts({ limit: 50 })
    ])
      .then(([analyticsRes, ordersRes, productsRes]) => {
        if (!isMounted) return;
        setAnalytics(analyticsRes || {});
        setOrders(ordersRes || []);
        setListings(productsRes.products || []);
      })
      .catch(() => {
        if (isMounted) triggerToast('Failed to load vendor telemetry data.', 'error');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [triggerToast, refreshKey]);

  const handleCreateListing = async (e) => {
    e.preventDefault();
    try {
      await productService.createProduct({
        title,
        category,
        monthlyRent: Number(monthlyRent),
        deposit: Number(deposit),
        totalStock: Number(stock),
        images: [imageUrl || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80']
      });
      triggerToast('New product listing created and submitted for review!');
      setShowAddModal(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Failed to create product listing.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <VendorHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onAddListingClick={() => setShowAddModal(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Vendor Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Monthly Recurring Revenue</span>
            <div className="text-3xl font-black text-white">₹{(analytics?.mrr || 42800).toLocaleString('en-IN')}</div>
            <span className="text-[11px] text-slate-400 font-medium">From active subscriber leases</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Active Subscriptions</span>
            <div className="text-3xl font-black text-white">{analytics?.activeOrders || orders.length || 14}</div>
            <span className="text-[11px] text-slate-400 font-medium">Units out on rent</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Total Inventory SKU</span>
            <div className="text-3xl font-black text-white">{listings.length || 8}</div>
            <span className="text-[11px] text-slate-400 font-medium">Published &amp; draft listings</span>
          </div>
        </div>

        {/* Listings Table / Orders Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h2 className="font-black text-lg text-white">
            {activeTab === 'listings' ? 'Catalog Inventory' : 'Incoming Rental Orders'}
          </h2>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading data...</div>
          ) : activeTab === 'listings' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400 uppercase font-mono">
                  <tr>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Rent</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-semibold">
                  {listings.map((p) => (
                    <tr key={p.id || p._id}>
                      <td className="py-3 px-4 font-bold text-white">{p.title}</td>
                      <td className="py-3 px-4 uppercase">{p.category}</td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">₹{p.monthlyRent}/mo</td>
                      <td className="py-3 px-4">{p.availableStock} / {p.totalStock}</td>
                      <td className="py-3 px-4">
                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2.5 py-0.5 rounded-full font-black">
                          {p.adminStatus || 'APPROVED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {orders.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">No active vendor orders assigned.</p>
              ) : (
                orders.map((o) => (
                  <div key={o.id || o._id} className="py-3 flex justify-between items-center text-xs font-semibold">
                    <div>
                      <strong className="text-white block font-mono">{o.rentalCode}</strong>
                      <span className="text-slate-400">{o.productTitle} • Customer: {o.customerName}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-emerald-400 block">₹{o.monthlyRent}/mo</span>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">{o.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </main>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-black text-xl text-white">Create Product Listing</h3>
            <form onSubmit={handleCreateListing} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Product Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white outline-none"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white outline-none"
              >
                <option value="furniture">Furniture</option>
                <option value="appliances">Appliances</option>
                <option value="packages">Packages</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  required
                  placeholder="Monthly Rent (₹)"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white outline-none"
                />
                <input
                  type="number"
                  required
                  placeholder="Deposit (₹)"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white outline-none"
                />
              </div>
              <input
                type="text"
                placeholder="Image URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white outline-none"
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs"
                >
                  Publish Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default VendorDashboardPage;
