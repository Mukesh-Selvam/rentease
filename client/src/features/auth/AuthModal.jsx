import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Mail, ShieldCheck, User as UserIcon, Phone, Building } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import authService from '../../services/authService';

export const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { triggerToast } = useToast();

  const [authMode, setAuthMode] = useState(initialMode); // 'login' | 'register_customer' | 'register_vendor' | 'forgot'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setForgotMessage(null);

    try {
      if (authMode === 'forgot') {
        const res = await authService.forgotPassword(email);
        setForgotMessage(res.message || 'Password reset link sent to your email.');
        triggerToast(res.message || 'Password reset link sent.');
        setLoading(false);
        return;
      }

      if (authMode === 'login') {
        const res = await login({ email, password });
        const user = res.user;

        if (!user) {
          throw new Error('Sign-in did not return an account. Please try again.');
        }

        if (user.status === 'INACTIVE' || user.status === 'SUSPENDED') {
          triggerToast('Account is suspended or inactive. Please contact support.', 'error');
          setLoading(false);
          return;
        }

        if (user.role === 'VENDOR' && !user.isVendorApproved) {
          triggerToast('Your vendor application is currently pending admin approval.', 'warning');
          setLoading(false);
          return;
        }

        triggerToast(`Welcome back, ${user.name}!`);
        onClose();

        // Role-based automatic redirect
        if (user.role === 'ADMIN') {
          navigate('/admin');
        } else if (user.role === 'VENDOR') {
          navigate('/vendor');
        } else {
          navigate('/dashboard');
        }
      } else if (authMode === 'register_customer') {
        await authService.register({
          name,
          email,
          password,
          phone,
          role: 'CUSTOMER'
        });
        triggerToast('Customer account created successfully!');
        onClose();
        navigate('/dashboard');
      } else if (authMode === 'register_vendor') {
        await authService.register({
          name: companyName || name,
          email,
          password,
          phone,
          role: 'VENDOR'
        });
        triggerToast('Vendor partner application submitted for admin review!', 'info');
        onClose();
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Authentication failed. Please check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative border border-slate-200">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-black text-2xl text-slate-900">
              {authMode === 'forgot'
                ? 'Reset Password'
                : authMode === 'login'
                ? 'Sign In to RentEase'
                : authMode === 'register_vendor'
                ? 'Vendor Partner Application'
                : 'Create Customer Account'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {authMode === 'forgot'
                ? 'Enter email to receive password reset link'
                : authMode === 'login'
                ? 'Enter your account credentials to access your dashboard'
                : authMode === 'register_vendor'
                ? 'Apply to list your furniture & appliances on RentEase'
                : 'Join RentEase to subscribe to premium home items'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {authMode === 'register_customer' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
                  />
                </div>
              </div>
            </>
          )}

          {authMode === 'register_vendor' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Company / Partner Name</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Urban Decor Logistics Pvt Ltd"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Business Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="+91 98765 00002"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
              />
            </div>
          </div>

          {authMode !== 'forgot' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Password</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
                />
              </div>
              {authMode === 'login' && (
                <p className="text-right">
                  <button
                    type="button"
                    onClick={() => setAuthMode('forgot')}
                    className="text-[11px] text-red-500 font-semibold hover:underline"
                  >
                    Forgot password?
                  </button>
                </p>
              )}
            </div>
          )}

          {forgotMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium">
              {forgotMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-extrabold text-sm tracking-wide shadow-lg transition-all hover:scale-[1.01] active:scale-100"
          >
            {loading ? 'Processing...' : authMode === 'forgot' ? 'Send Reset Link' : authMode === 'login' ? 'Sign In to RentEase' : authMode === 'register_vendor' ? 'Submit Vendor Application' : 'Create Customer Account'}
          </button>

          <div className="text-center pt-2 text-xs font-medium text-slate-500 space-y-2">
            {authMode === 'login' ? (
              <>
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('register_customer')}
                    className="text-red-500 font-extrabold hover:underline"
                  >
                    Create Customer Account
                  </button>
                </p>
                <p className="text-[11px] text-slate-400">
                  Are you a vendor?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('register_vendor')}
                    className="text-slate-700 font-bold hover:underline"
                  >
                    Apply as Partner
                  </button>
                </p>
              </>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-red-500 font-extrabold hover:underline"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};

export default AuthModal;
