import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import authService from '../services/authService';
import { useToast } from '../context/ToastContext';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { triggerToast } = useToast();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      triggerToast('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({ email, token, newPassword });
      triggerToast('Password reset successfully! You can now log in.');
      navigate('/');
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Password reset failed. Token may be expired.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 max-w-md w-full space-y-6 shadow-xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto font-black text-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Set New Password</h2>
          <p className="text-xs text-slate-500">
            For account: <strong>{email || 'Your Account'}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase">New Password</label>
            <input
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-red-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase">Confirm Password</label>
            <input
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-red-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-extrabold text-sm shadow-md transition-transform hover:scale-[1.01]"
          >
            {loading ? 'Resetting Password...' : 'Reset Password & Login'}
          </button>
        </form>

        <div className="text-center">
          <Link to="/" className="text-xs font-bold text-slate-500 hover:text-slate-900">
            ← Back to Storefront
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
