
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { echoService } from '../../services/echo';
import { User, LogOut, Shield, Zap, CreditCard } from 'lucide-react';

export function SettingsPanel() {
  const { user, signOut } = useAuth();
  const [echoUsage, setEchoUsage] = useState<{ remaining: number; allowed: boolean }>({ remaining: 0, allowed: true });

  useEffect(() => {
    if (user) {
        echoService.checkLimits(user.id).then(setEchoUsage);
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="h-full flex flex-col text-slate-300">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-sm font-bold uppercase tracking-wider mb-1">Settings</h2>
        <p className="text-xs text-slate-500">Manage your account and preferences</p>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">

        {/* Account Section */}
        <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <User size={14} /> Account
            </h3>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                        {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="text-white font-medium">{user.email}</div>
                        <div className="text-xs text-slate-500">User ID: {user.id.slice(0, 8)}...</div>
                    </div>
                </div>

                <div className="flex items-center justify-between text-sm py-2 border-t border-slate-800">
                    <span className="text-slate-400">Subscription</span>
                    <span className="text-green-400 font-medium px-2 py-0.5 bg-green-500/10 rounded-full text-xs border border-green-500/20">
                        BETA ACCESS
                    </span>
                </div>
            </div>
        </section>

        {/* Echo AI Status */}
        <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Zap size={14} /> Echo AI Limits
            </h3>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="mb-2 flex justify-between text-sm">
                    <span className="text-slate-400">Monthly Usage</span>
                    <span className="text-white">{100 - echoUsage.remaining} / 100</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 mb-4 overflow-hidden">
                    <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, ((100 - echoUsage.remaining) / 100) * 100)}%` }}
                    />
                </div>
                <div className="text-xs text-slate-500">
                    Reset date: In 30 days
                </div>
            </div>
        </section>

        {/* Security / About */}
        <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Shield size={14} /> Security
            </h3>
            <div className="space-y-2">
                <button className="w-full text-left p-3 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 transition-colors text-sm flex justify-between items-center group">
                    <span>Beta Code License</span>
                    <CreditCard size={14} className="text-slate-500 group-hover:text-blue-400" />
                </button>
            </div>
        </section>

        <button
            onClick={signOut}
            className="w-full mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
        >
            <LogOut size={16} />
            Sign Out
        </button>

      </div>
    </div>
  );
}
