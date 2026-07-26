import { useLocation, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export const ConfirmationPage = () => {
  const location = useLocation();
  const order = location.state?.order;

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-8">
      
      <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto shadow-md">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900">Rental Order Confirmed!</h1>
        <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
          Thank you for choosing RentEase. Your item lease has been registered and scheduled for doorstep delivery.
        </p>
      </div>

      {order && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 text-left space-y-4 shadow-sm text-xs">
          <div className="flex justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Rental Order Code</span>
              <strong className="text-sm font-black text-slate-900">{order.rentalCode || 'RE-2026-981245'}</strong>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Scheduled Delivery</span>
              <strong className="text-sm font-black text-emerald-600">{order.deliveryDate || 'Within 72 Hours'}</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-slate-600 font-semibold pt-1">
            <div><strong>Item:</strong> {order.productTitle || 'Rental Subscription'}</div>
            <div><strong>Monthly Rent:</strong> ₹{order.monthlyRent}/mo</div>
            <div><strong>Deposit:</strong> ₹{order.deposit}</div>
            <div><strong>Payment Status:</strong> Paid ({order.paymentMethod || 'UPI'})</div>
          </div>
        </div>
      )}

      <div className="flex justify-center gap-4 pt-4">
        <Link
          to="/dashboard"
          className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-6 py-3.5 rounded-full shadow-md flex items-center gap-2"
        >
          <span>Go to Customer Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
};

export default ConfirmationPage;
