import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export const RoleGuard = ({ allowedRoles = [], children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) return null;

  if (!currentUser || (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role))) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-black text-2xl">
          !
        </div>
        <h2 className="text-2xl font-black text-slate-900">Access Restricted</h2>
        <p className="text-sm text-slate-500 max-w-md">
          You do not have permission to view this portal. Required role: {allowedRoles.join(' or ')}.
        </p>
        <a href="/" className="bg-slate-900 text-white font-bold text-xs px-6 py-3 rounded-full">
          Return to Storefront
        </a>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
