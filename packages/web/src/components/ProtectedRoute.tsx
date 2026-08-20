import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import type { PropsWithChildren } from 'react';
import type { UserRole } from '@/types';

interface Props extends PropsWithChildren {
  roles?: UserRole[];
}

export default function ProtectedRoute({ children, roles }: Props) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasRole = useAuthStore((s) => s.hasRole);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (roles && !hasRole(roles)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
