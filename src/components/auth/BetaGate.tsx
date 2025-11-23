
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BetaEntry } from './BetaEntry';
import { LogIn } from 'lucide-react';

interface BetaGateProps {
  children: React.ReactNode;
}

export function BetaGate({ children }: BetaGateProps) {
  const { user, isLoading, hasBetaAccess } = useAuth();

  const handleLogin = () => {
      const finalRedirect = window.location.origin; // Dynamically use current origin (localhost or prod)
      window.location.href = `https://launchlayer.xyz/auth?redirectTo=${finalRedirect}`;
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-blue-500">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-sm tracking-wider">LOADING ENVIRONMENT...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
        <div className="h-screen w-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl text-center">
                <div className="mb-6 flex justify-center">
                    <div className="h-16 w-16 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                         <LogIn className="w-8 h-8 text-blue-400" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Welcome to Launchlets</h1>
                <p className="text-slate-400 mb-8">Please sign in via LaunchLayer to access the IDE.</p>

                <button
                    onClick={handleLogin}
                    className="w-full bg-white text-slate-950 hover:bg-slate-200 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                    Sign in with LaunchLayer
                </button>
            </div>
        </div>
    );
  }

  if (!hasBetaAccess) {
    return <BetaEntry />;
  }

  return <>{children}</>;
}
