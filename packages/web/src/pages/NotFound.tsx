import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <h1 className="text-9xl font-black text-slate-200">404</h1>
      <h2 className="mt-4 text-2xl font-bold text-slate-900">Page not found</h2>
      <p className="mt-2 text-slate-500">Sorry, we couldn't find the page you're looking for.</p>
      <Link to="/" className="btn-primary mt-8">
        <Home size={18} className="mr-2" />
        Back to Dashboard
      </Link>
    </div>
  );
}
