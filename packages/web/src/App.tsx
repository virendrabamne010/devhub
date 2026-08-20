import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { useAuthStore } from '@/store/auth';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout/Layout';
import { ToastProvider } from '@/components/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Teams = lazy(() => import('@/pages/Teams'));
const Projects = lazy(() => import('@/pages/Projects'));
const Deployments = lazy(() => import('@/pages/Deployments'));
const Monitoring = lazy(() => import('@/pages/Monitoring'));
const Users = lazy(() => import('@/pages/Users'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail'));

const PageLoader = () => (
  <div className="flex h-[50vh] w-full items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600"></div>
  </div>
);

export default function App() {
  const restore = useAuthStore((s) => s.restore);

  useEffect(() => {
    restore();
  }, [restore]);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
              <Route path="teams" element={<ErrorBoundary><Teams /></ErrorBoundary>} />
              <Route path="projects" element={<ErrorBoundary><Projects /></ErrorBoundary>} />
              <Route path="deployments" element={<ErrorBoundary><Deployments /></ErrorBoundary>} />
              <Route path="monitoring" element={<ErrorBoundary><Monitoring /></ErrorBoundary>} />
              <Route path="users" element={<ProtectedRoute roles={['ADMIN', 'MANAGER']}><ErrorBoundary><Users /></ErrorBoundary></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    </ErrorBoundary>
  );
}
