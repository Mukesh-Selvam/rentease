/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, triggerToast: showToast }}>
      {children}
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-950 text-white text-xs font-bold px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800 animate-bounce">
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
          {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
          {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
          <span>{toast.message}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
