/**
 * SECURITY: Admin routes are now verified server-side via RPC call.
 * This prevents client-side manipulation and ensures only authorized admins can access.
 * Backend RLS policies provide an additional layer of security for all data operations.
 */
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const verifyAccess = async () => {
      if (!user) {
        setIsVerified(false);
        return;
      }

      try {
        // Server-side admin verification
        const { data, error } = await supabase.rpc('verify_admin_route_access');
        
        if (error) {
          console.error('Admin verification failed:', error);
          setIsVerified(false);
          return;
        }
        
        setIsVerified(data === true);
      } catch (error) {
        console.error('Admin verification error:', error);
        setIsVerified(false);
      }
    };

    verifyAccess();
  }, [user]);

  if (authLoading || isVerified === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isVerified) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};