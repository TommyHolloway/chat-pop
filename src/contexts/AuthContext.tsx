import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Check subscription status when user signs in
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            await supabase.functions.invoke('check-subscription');
          } catch (error) {
            console.error('Error checking subscription on sign in:', error);
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      console.log('Starting logout process...');
      
      // Clean up auth state more thoroughly
      const cleanupAuthState = () => {
        // Clear localStorage
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
            console.log('Removing localStorage key:', key);
            localStorage.removeItem(key);
          }
        });
        
        // Clear sessionStorage as well
        Object.keys(sessionStorage || {}).forEach((key) => {
          if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
            console.log('Removing sessionStorage key:', key);
            sessionStorage.removeItem(key);
          }
        });
      };

      // Clean up state first
      cleanupAuthState();
      
      // Clear local state immediately
      setUser(null);
      setSession(null);
      
      // Attempt Supabase signOut
      console.log('Calling supabase.auth.signOut...');
      await supabase.auth.signOut({ scope: 'global' });
      
      console.log('Logout successful, redirecting...');
      // Force page reload for clean state
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      
      // Clear local state even on error
      setUser(null);
      setSession(null);
      
      // Force redirect even on error
      window.location.href = '/';
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};