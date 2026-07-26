import { Link } from 'react-router-dom';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <h1 className="text-6xl font-black text-slate-900 font-mono">404</h1>
      <h2 className="text-2xl font-black text-slate-800">Page Not Found</h2>
      <p className="text-sm text-slate-500 max-w-md">
        The rental listing or page you requested could not be found or may have been moved.
      </p>
      <Link
        to="/"
        className="bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs px-6 py-3 rounded-full shadow-md transition-all"
      >
        Return to Storefront
      </Link>
    </div>
  );
};

export default NotFoundPage;
