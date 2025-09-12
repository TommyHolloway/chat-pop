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
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    console.log('AuthProvider: Setting up auth state listener');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state changed', { event, hasSession: !!session, hasUser: !!session?.user });
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Set loading to false for all events
        setLoading(false);
        setInitializing(false);
        
        // Handle post-authentication actions
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('AuthProvider: User signed in successfully');
        }
        
        if (event === 'SIGNED_OUT') {
          console.log('AuthProvider: User signed out');
        }
      }
    );

    // THEN check for existing session
    console.log('AuthProvider: Checking for existing session');
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      
      console.log('AuthProvider: Initial session check', { hasSession: !!session, error, userId: session?.user?.id });
      
      if (error) {
        console.error('AuthProvider: Error getting session:', error);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setInitializing(false);
    }).catch((error) => {
      if (!mounted) return;
      
      console.error('AuthProvider: Failed to get session:', error);
      setLoading(false);
      setInitializing(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    
    try {
      await supabase.auth.signOut({ scope: 'global' });
      
      // Use window.location for navigation in context
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      // Still navigate to home on error
      window.location.href = '/';
    } finally {
      setLoading(false);
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