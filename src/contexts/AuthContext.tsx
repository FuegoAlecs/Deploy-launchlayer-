
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  hasBetaAccess: boolean;
  checkBetaAccess: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasBetaAccess, setHasBetaAccess] = useState(false);

  const checkBetaAccess = async (userId: string, userEmail?: string) => {
    // Admin bypass
    if (userEmail?.toLowerCase() === 'fuegoalecs@gmail.com') {
      setHasBetaAccess(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('beta_codes')
        .select('id')
        .eq('claimed_by', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking beta access:', error);
        // In case of error, we deny access by default
        setHasBetaAccess(false);
      } else {
        setHasBetaAccess(!!data);
      }
    } catch (err) {
      console.error('Unexpected error checking beta access:', err);
      setHasBetaAccess(false);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkBetaAccess(session.user.id, session.user.email).then(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkBetaAccess(session.user.id, session.user.email);
      } else {
        setHasBetaAccess(false);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setHasBetaAccess(false);
  };

  // Wrapper for manual re-check (e.g. after entering code)
  const manualCheckBetaAccess = async () => {
    if (user) {
        await checkBetaAccess(user.id, user.email);
    }
  }

  const value = {
    user,
    session,
    isLoading,
    hasBetaAccess,
    checkBetaAccess: manualCheckBetaAccess,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
