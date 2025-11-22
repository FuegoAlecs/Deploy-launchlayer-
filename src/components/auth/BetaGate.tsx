
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

export function BetaGate({ children }: { children: React.ReactNode }) {
  const { user, hasBetaAccess, isLoading, verifyBetaCode } = useAuth();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-blue-500">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin" />
          <span className="font-mono text-sm tracking-wider animate-pulse">VERIFYING ACCESS...</span>
        </div>
      </div>
    );
  }

  // If user is not logged in, we assume the wrapper app might handle login,
  // OR if integrated with existing auth, they might already be redirected.
  // Requirement says: "User visits Launchlets -> Check if authenticated".
  // If not authenticated, we usually show login.
  // However, prompts says "Users who are already logged into my other platform should have automatic access...".
  // If they are NOT logged in, we probably shouldn't show the Beta Gate yet, or show a "Please Login" state.
  // For this component, I'll assume if !user, we render children (or redirect to login?
  // Actually, if they aren't logged in, they can't check beta access.
  // Let's assume if !user, we show a "Connecting to session..." or simple Login prompt.

  if (!user) {
      return (
          <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-slate-400 p-4 text-center">
              <h1 className="text-2xl font-bold text-white mb-2">Launchlets</h1>
              <p className="mb-8">Please log in to your account to access the IDE.</p>
              {/* Since auth is external, we might just wait or show a generic message */}
              <div className="text-xs text-slate-600">Waiting for authentication session...</div>
          </div>
      );
  }

  if (hasBetaAccess) {
    return <>{children}</>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsVerifying(true);
    setError(null);

    const result = await verifyBetaCode(code.trim());

    if (!result.success) {
      setError(result.message || 'Verification failed');
    }

    setIsVerifying(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Launchlets</h1>
          <p className="text-slate-400">Early Access Preview</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-slate-800/50 rounded-full border border-slate-700/50">
              <Lock className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <h2 className="text-xl font-semibold text-white text-center mb-2">
            Enter Beta Code
          </h2>
          <p className="text-sm text-slate-400 text-center mb-8">
            Access to Launchlets is currently limited. Please enter your beta invitation code to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="BETA-XXXX-XXXX"
                className={clsx(
                  "w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono uppercase text-center tracking-widest",
                  error && "border-red-500/50 focus:ring-red-500/50"
                )}
                disabled={isVerifying}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs justify-center bg-red-500/10 p-2 rounded">
                <AlertCircle size={12} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying || !code}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isVerifying ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  Verify Access
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Logged in as <span className="text-slate-300">{user.email}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
