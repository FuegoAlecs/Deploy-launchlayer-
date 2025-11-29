import { clsx } from 'clsx';
import { Files, Search, Box, PlayCircle, Github, ShieldAlert, Settings, ArrowLeftCircle, Terminal, Wrench } from 'lucide-react';
import { useTerminal } from '../../store/useTerminal';

interface ActivityBarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function ActivityBar({ activeView, onViewChange }: ActivityBarProps) {
  const { toggleTerminal, isOpen } = useTerminal();

  const items = [
    { id: 'explorer', icon: Files, label: 'Explorer' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'compiler', icon: Box, label: 'Compiler' },
    { id: 'deploy', icon: PlayCircle, label: 'Deploy & Run' },
    { id: 'tools', icon: Wrench, label: 'DevTools' }, // Added DevTools
    { id: 'github', icon: Github, label: 'GitHub' },
    { id: 'analysis', icon: ShieldAlert, label: 'Static Analysis' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="w-12 md:w-16 flex flex-col items-center py-4 bg-slate-950 border-r border-slate-800 z-20 h-full">
      <div className="flex-1 flex flex-col items-center w-full">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={clsx(
                "p-3 mb-2 rounded-xl transition-all duration-200 group relative",
                activeView === item.id
                  ? "bg-blue-600/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
              )}
              title={item.label}
            >
              <item.icon size={24} strokeWidth={1.5} />
              <span className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 hidden md:block border border-slate-700">
                {item.label}
              </span>
            </button>
          ))}
      </div>

      <div className="pb-4 flex flex-col items-center gap-2">
          {/* Toggle Terminal Button */}
          <button
            onClick={() => toggleTerminal()}
            className={clsx(
                "p-3 rounded-xl transition-all duration-200 group relative",
                isOpen ? "text-blue-400 bg-blue-600/10" : "text-slate-500 hover:text-white hover:bg-slate-800/50"
            )}
            title="Toggle Terminal"
          >
            <Terminal size={24} strokeWidth={1.5} />
            <span className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 hidden md:block border border-slate-700">
                Toggle Terminal
            </span>
          </button>

          <a
            href="https://launchlayer.xyz"
            className="p-3 rounded-xl transition-all duration-200 group relative text-slate-500 hover:text-white hover:bg-slate-800/50 block"
            title="Back to LaunchLayer"
          >
            <ArrowLeftCircle size={24} strokeWidth={1.5} />
            <span className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 hidden md:block border border-slate-700">
                Back to LaunchLayer
            </span>
          </a>
      </div>
    </div>
  );
}
