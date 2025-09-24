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
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        // Validate session is not expired
        if (session && session.expires_at) {
          const now = Math.floor(Date.now() / 1000);
          const expiresAt = session.expires_at;
          
          if (now >= expiresAt) {
            setSession(null);
            setUser(null);
            setLoading(false);
            setInitializing(false);
            return;
          }
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Set loading to false for all events
        setLoading(false);
        setInitializing(false);
      }
    );

    // THEN check for existing session with retry logic
    const checkSession = async (retries = 3) => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          if (retries > 1) {
            setTimeout(() => checkSession(retries - 1), 1000);
            return;
          }
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        setInitializing(false);
      } catch (error) {
        if (!mounted) return;
        
        if (retries > 1) {
          setTimeout(() => checkSession(retries - 1), 1000);
        } else {
          setLoading(false);
          setInitializing(false);
        }
      }
    };

    checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (error) {
      console.error('Error signing out:', error);
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