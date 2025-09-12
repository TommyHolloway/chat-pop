import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, session } = useAuth();

  console.log('ProtectedRoute: Check', { hasUser: !!user, hasSession: !!session, loading });

  if (loading) {
    console.log('ProtectedRoute: Still loading, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !session) {
    console.log('ProtectedRoute: No user or session, redirecting to login');
    return <Navigate to="/auth/login" replace />;
  }

  console.log('ProtectedRoute: User authenticated, rendering children');
  return <>{children}</>;
};