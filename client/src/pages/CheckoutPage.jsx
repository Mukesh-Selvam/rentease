import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Tag, AlertTriangle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCity } from '../context/CityContext';
import { useToast } from '../context/ToastContext';
import orderService from '../services/orderService';
import paymentService from '../services/paymentService';
import apiClient from '../services/apiClient';

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { currentUser } = useAuth();
  const { selectedCity } = useCity();
  const { triggerToast } = useToast();

  const [deliveryDate, setDeliveryDate] = useState(() => {
    return new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  });
  const [deliverySlot, setDeliverySlot] = useState('Morning (9:00 AM – 12:00 PM)');
  const [streetAddress, setStreetAddress] = useState(() => {
    return currentUser?.addresses && currentUser.addresses.length > 0
      ? currentUser.addresses[0].street
      : 'Flat 402, Sunshine Heights, HSR Layout Sector 1';
  });
  const [pincode, setPincode] = useState('560102');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');

  const cartItem = cart.length > 0 ? cart[0] : null;

  // Server Quote State
  const [serverQuote, setServerQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);
  const [paymentsAvailable, setPaymentsAvailable] = useState(null);

  useEffect(() => {
    let isMounted = true;
    apiClient.get('/payment/config')
      .then(({ data }) => {
        if (!isMounted) return;
        setPaymentsAvailable(data.paymentsAvailable);
        setIsMockMode(data.mockPaymentsEnabled);
      })
      .catch(() => {
        if (isMounted) setPaymentsAvailable(false);
      });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!cartItem) return;

    let isMounted = true;
    apiClient.post('/orders/quote', {
      productId: cartItem.id,
      tenureMonths: cartItem.tenureMonths,
      city: selectedCity,
      couponCode: appliedCoupon
    })
      .then((res) => {
        if (!isMounted) return;
        setServerQuote(res.data.display);
        setQuoteError('');
      })
      .catch((err) => {
        if (!isMounted) return;
        setServerQuote(null);
        setQuoteError(err.response?.data?.message || 'Unable to calculate your order total. Please refresh and try again.');
      })
      .finally(() => {
        if (isMounted) setQuoteLoading(false);
      });

    return () => { isMounted = false; };
  }, [cartItem, selectedCity, appliedCoupon]);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    try {
      const res = await apiClient.post('/coupons/validate', {
        code: couponCode,
        orderTotal: cartItem ? cartItem.monthlyRent + cartItem.deposit : 1000
      });
      setAppliedCoupon(res.data.coupon.code);
      triggerToast(`Coupon ${res.data.coupon.code} applied successfully! Discount: ₹${res.data.coupon.discountValue}`);
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Invalid or expired coupon code.', 'error');
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!cartItem || !serverQuote || !paymentsAvailable) return;

    setIsProcessing(true);

    try {
      // 1. Create order on backend (returns order & Razorpay order details)
      const res = await orderService.createOrder({
        productId: cartItem.id,
        tenureMonths: cartItem.tenureMonths,
        deliveryDate,
        deliverySlot,
        deliveryAddress: `${streetAddress}, ${selectedCity} - ${pincode}`,
        city: selectedCity,
        pincode,
        paymentMethod,
        couponCode: appliedCoupon
      });

      const order = res.order;
      const razorpayKeyId = res.razorpayKeyId;
      const enableMockPayments = res.enableMockPayments;
      setIsMockMode(enableMockPayments);

      // 2. Launch Real Razorpay SDK if window.Razorpay exists and not in mock mode
      if (window.Razorpay && razorpayKeyId && !enableMockPayments) {
        const options = {
          key: razorpayKeyId,
          amount: res.amountPaise || Math.round((serverQuote?.totalPaidToday || order.totalPaidToday) * 100),
          currency: 'INR',
          name: 'RentEase Rentals',
          description: `Subscription: ${order.productTitle}`,
          order_id: res.razorpayOrderId,
          prefill: {
            name: currentUser?.name || '',
            email: currentUser?.email || '',
            contact: currentUser?.phone || ''
          },
          theme: { color: '#ef4444' },
          handler: async function (response) {
            try {
              const verifyRes = await paymentService.verifyPayment({
                orderId: order.id || order._id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });

              triggerToast('Payment verified & rental subscription activated!');
              clearCart();
              navigate('/confirmation', { state: { order: verifyRes.order, payment: verifyRes.payment } });
            } catch (err) {
              triggerToast(err.response?.data?.message || 'Payment verification failed.', 'error');
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: function () {
              triggerToast('Payment cancelled by user.', 'warning');
              setIsProcessing(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else if (enableMockPayments) {
        // Development Mock Payment Execution (when ENABLE_MOCK_PAYMENTS=true is set in server .env)
        const verifyRes = await paymentService.verifyPayment({
          // The backend explicitly enabled mock mode; do not fabricate Razorpay identifiers.
          orderId: order.id || order._id
        });

        triggerToast('Development mock payment verified!');
        clearCart();
        navigate('/confirmation', { state: { order: verifyRes.order, payment: verifyRes.payment } });
      } else {
        triggerToast('Payment service is currently unavailable. Please try again later.', 'error');
        setIsProcessing(false);
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Order creation failed. Please check details.', 'error');
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Checkout &amp; Service Verification</h1>
          <p className="text-xs text-slate-500 mt-1">Review delivery address, subscription terms, and final pricing.</p>
        </div>
        {isMockMode && (
          <div className="bg-amber-50 border border-amber-300 text-amber-900 text-xs font-black px-4 py-2 rounded-2xl flex items-center gap-2 shadow-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Development Mock Payment Mode Enabled</span>
          </div>
        )}
        {paymentsAvailable === false && (
          <div className="bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-2xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Online payments are not enabled yet. Ordering is temporarily unavailable.</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Form Column */}
        <div className="lg:col-span-8 space-y-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <form onSubmit={handlePlaceOrder} className="space-y-6">
            
            {/* Delivery Address */}
            <div className="space-y-4">
              <h2 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">1. Doorstep Delivery Address</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Street Address, Flat / House No."
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:border-red-400"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    disabled
                    value={selectedCity}
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Pincode (e.g. 560102)"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:border-red-400"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Date & Slot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
              <div className="space-y-2">
                <h2 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">2. Delivery Date</h2>
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:border-red-400"
                />
              </div>
              <div className="space-y-2">
                <h2 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">Delivery Time Slot</h2>
                <select
                  value={deliverySlot}
                  onChange={(e) => setDeliverySlot(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:border-red-400"
                >
                  <option value="Morning (9:00 AM – 12:00 PM)">Morning (9:00 AM – 12:00 PM)</option>
                  <option value="Afternoon (1:00 PM – 4:00 PM)">Afternoon (1:00 PM – 4:00 PM)</option>
                  <option value="Evening (5:00 PM – 8:00 PM)">Evening (5:00 PM – 8:00 PM)</option>
                </select>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-3 border-t border-slate-100 pt-6">
              <h2 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">3. Payment Method</h2>
              <div className="grid grid-cols-3 gap-3">
                {['UPI', 'CARD', 'NETBANKING'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`p-3 rounded-2xl border text-center text-xs font-black transition-all ${
                      paymentMethod === m ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isProcessing || !cartItem || !serverQuote || !paymentsAvailable || quoteLoading}
                className="w-full py-4 rounded-2xl bg-red-500 hover:bg-red-600 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-lg transition-transform hover:scale-[1.01]"
              >
                {isProcessing ? 'Processing Payment...' : `Pay & Confirm Order • ₹${serverQuote?.totalPaidToday || 0}`}
              </button>
            </div>

          </form>
        </div>

        {/* Sidebar Server Quote Summary */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Coupon Code Box */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5 uppercase tracking-wide">
              <Tag className="w-4 h-4 text-red-500" />
              <span>Apply Promo Code</span>
            </h3>
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                placeholder="FIRSTRENT10"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold uppercase outline-none"
              />
              <button type="submit" className="bg-slate-900 text-white font-extrabold text-xs px-4 py-2 rounded-xl">
                Apply
              </button>
            </form>
            {appliedCoupon && (
              <span className="text-xs text-emerald-600 font-extrabold block">
                ✓ Coupon '{appliedCoupon}' active!
              </span>
            )}
          </div>

          {/* Official Server-Calculated Price Summary */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-wide border-b border-slate-100 pb-3">
              Server-Calculated Quote
            </h3>

            {quoteLoading ? (
              <div className="text-center text-xs text-slate-400 py-4">Calculating pricing...</div>
            ) : quoteError ? (
              <div className="text-center text-xs text-red-600 py-4 font-semibold">{quoteError}</div>
            ) : serverQuote ? (
              <div className="space-y-2 text-xs text-slate-600 font-medium">
                <div className="flex justify-between">
                  <span>First Month Rent</span>
                  <span className="font-bold text-slate-900">₹{serverQuote.monthlyRent}</span>
                </div>
                <div className="flex justify-between">
                  <span>Security Deposit (Refundable)</span>
                  <span className="font-bold text-emerald-600">₹{serverQuote.deposit}</span>
                </div>
                <div className="flex justify-between">
                  <span>Doorstep Delivery &amp; Setup</span>
                  <span className="font-bold text-slate-900">₹{serverQuote.deliveryFee}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18%)</span>
                  <span className="font-bold text-slate-900">₹{serverQuote.taxes}</span>
                </div>
                {serverQuote.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Coupon Discount</span>
                    <span>-₹{serverQuote.discount}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-3 border-t border-slate-100">
                  <span>Total Payable Today</span>
                  <span className="text-xl text-red-500 font-black">₹{serverQuote.totalPaidToday}</span>
                </div>
              </div>
            ) : null}
          </div>

        </div>

      </div>

      {/* Verification Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <ShieldCheck className="w-10 h-10 text-red-500 mx-auto animate-bounce" />
            <h3 className="font-black text-slate-900 text-base">Verifying Payment</h3>
            <p className="text-slate-500 text-xs font-semibold">Contacting payment gateway &amp; confirming signature...</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default CheckoutPage;
