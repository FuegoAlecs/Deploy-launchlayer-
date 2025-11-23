
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ShieldCheck, Loader2, AlertCircle, Terminal } from 'lucide-react';

export function BetaEntry() {
  const { user, checkBetaAccess, signOut } = useAuth();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !user) return;

    setIsVerifying(true);
    setError(null);

    try {
      // 1. Check if code exists and is unclaimed
      const { data: codeData, error: fetchError } = await supabase
        .from('beta_codes')
        .select('id, is_claimed')
        .eq('code', code.trim())
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!codeData) {
        setError('Invalid beta code. Please check and try again.');
        setIsVerifying(false);
        return;
      }

      if (codeData.is_claimed) {
        setError('This beta code has already been claimed.');
        setIsVerifying(false);
        return;
      }

      // 2. Claim the code
      const { error: updateError } = await supabase
        .from('beta_codes')
        .update({
          is_claimed: true,
          claimed_by: user.id,
          claimed_at: new Date().toISOString(),
        })
        .eq('id', codeData.id);

      if (updateError) throw updateError;

      // 3. Refresh auth context
      await checkBetaAccess();
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to verify code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
        <div className="text-center mb-8">
            <div className="bg-blue-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                <Terminal className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Launchlets Beta</h1>
            <p className="text-slate-400">Enter your access code to unlock the IDE.</p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label htmlFor="beta-code" className="block text-sm font-medium text-slate-400 mb-2">
              Access Code
            </label>
            <input
              id="beta-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="BETA-XXXX-XXXX"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono text-center tracking-wider uppercase"
              disabled={isVerifying}
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isVerifying || !code}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.2)]"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                Verify Access
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800/50 text-center">
             <p className="text-sm text-slate-500 mb-4">Signed in as {user?.email}</p>
             <button
                onClick={signOut}
                className="text-sm text-slate-400 hover:text-white transition-colors"
             >
                Sign Out
             </button>
        </div>
      </div>
    </div>
  );
}
