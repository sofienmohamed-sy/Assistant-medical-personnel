import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div
        className="bg-background text-muted-foreground flex min-h-svh items-center justify-center"
        data-testid="auth-loading"
        role="status"
        aria-live="polite"
      >
        Chargement…
      </div>
    );
  }

  if (status === 'signed-out') {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
