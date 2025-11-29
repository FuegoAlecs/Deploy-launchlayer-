
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User, ShieldCheck, ExternalLink } from 'lucide-react';

export function SettingsPanel() {
  const { user, signOut } = useAuth();

  return (
    <div className="h-full p-6 overflow-auto">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        Settings
      </h2>

      <div className="space-y-6">
        {/* User Profile Section */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Account</h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-xl">
              {user?.email?.charAt(0).toUpperCase() || <User />}
            </div>
            <div>
              <p className="text-white font-medium">{user?.email}</p>
              <p className="text-slate-500 text-sm">User ID: {user?.id.slice(0, 8)}...</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-3 py-2 rounded-lg w-fit mb-4">
             <ShieldCheck size={16} />
             <span className="text-sm font-medium">Early Access Member</span>
          </div>

          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 px-4 py-2 rounded-lg transition-colors w-full sm:w-auto justify-center sm:justify-start"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </section>

        {/* Navigation Section */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
           <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">LaunchLayer</h3>
           <p className="text-slate-400 text-sm mb-4">
             Return to the main platform to manage your account, billing, and other services.
           </p>
           <a
             href="https://launchlayer.xyz"
             className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors w-full"
           >
             <ExternalLink size={18} />
             Back to LaunchLayer
           </a>
        </section>
      </div>
    </div>
  );
}
