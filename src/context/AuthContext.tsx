
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  hasBetaAccess: boolean;
  isLoading: boolean;
  verifyBetaCode: (code: string) => Promise<{ success: boolean; message?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [hasBetaAccess, setHasBetaAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkBetaAccess(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkBetaAccess(session.user.id);
      } else {
        setHasBetaAccess(false);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkBetaAccess = async (userId: string) => {
    try {
      // Check if user has claimed a code (claimed_by maps to user_id requirement)
      const { data, error } = await supabase
        .from('beta_codes')
        .select('*')
        .eq('claimed_by', userId)
        .limit(1);

      if (error) {
          console.error('Error checking beta access:', error);
          setHasBetaAccess(false);
      } else {
          setHasBetaAccess(data && data.length > 0);
      }
    } catch (err) {
      console.error('Beta check failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyBetaCode = async (code: string): Promise<{ success: boolean; message?: string }> => {
    if (!user) return { success: false, message: 'User not authenticated' };

    try {
      // 1. Check if code exists and is unclaimed
      const { data: codeData, error: fetchError } = await supabase
        .from('beta_codes')
        .select('*')
        .eq('code', code)
        .single();

      if (fetchError || !codeData) {
        return { success: false, message: 'Invalid beta code' };
      }

      if (codeData.is_claimed) {
        return { success: false, message: 'This code has already been used' };
      }

      // 2. Claim the code
      const { error: updateError } = await supabase
        .from('beta_codes')
        .update({
            claimed_by: user.id,
            is_claimed: true,
            claimed_at: new Date().toISOString()
        })
        .eq('id', codeData.id);

      if (updateError) {
        console.error('Update error:', updateError);
        return { success: false, message: 'Failed to activate code. Please try again.' };
      }

      setHasBetaAccess(true);
      return { success: true };

    } catch (err) {
      console.error('Verification error:', err);
      return { success: false, message: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setHasBetaAccess(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, hasBetaAccess, isLoading, verifyBetaCode, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
