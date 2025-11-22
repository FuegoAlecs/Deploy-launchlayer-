import React from 'react';
import { ActivityBar } from './ActivityBar';
import { FileExplorer } from '../FileExplorer';
import { CompilerPanel } from '../CompilerPanel';
import { DeployPanel } from '../deploy/DeployPanel';
import { clsx } from 'clsx';
import { Menu, X } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [activeView, setActiveView] = React.useState('explorer');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const renderSidePanel = () => {
      switch (activeView) {
          case 'explorer': return <FileExplorer />;
          case 'compiler': return <CompilerPanel />;
          case 'deploy': return <DeployPanel />;
          default: return (
            <div className="p-4 text-slate-500 text-sm text-center mt-10">
                {activeView.charAt(0).toUpperCase() + activeView.slice(1)} Panel Placeholder
            </div>
          );
      }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Activity Bar - Sidebar */}
      <div className="hidden md:block h-full">
        <ActivityBar activeView={activeView} onViewChange={setActiveView} />
      </div>

      {/* Side Panel - Desktop */}
      <div className={clsx(
        "hidden md:flex flex-col w-80 h-full border-r border-slate-800 bg-slate-900/40 glass-panel transition-all duration-300",
        activeView ? "opacity-100 translate-x-0" : "w-0 opacity-0 -translate-x-full overflow-hidden"
      )}>
        {renderSidePanel()}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">

        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-400">
                {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
            <span className="font-bold text-blue-400">Launchlets</span>
            <div className="w-8" />
        </div>

        {/* Mobile Drawer */}
        {isMobileMenuOpen && (
            <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-xl md:hidden flex flex-col">
                <div className="flex h-full">
                    <ActivityBar activeView={activeView} onViewChange={setActiveView} />
                    <div className="flex-1 border-l border-slate-800 p-2 overflow-auto">
                         {renderSidePanel()}
                    </div>
                </div>
            </div>
        )}

        {/* Editor Area */}
        <main className="flex-1 relative bg-slate-950/50">
            {children}
        </main>

        {/* Bottom Panel (Terminal) */}
        <div className="h-48 border-t border-slate-800 bg-slate-900/90 glass-panel hidden md:block">
            <div className="flex items-center gap-4 px-4 py-2 border-b border-slate-800/50 text-xs font-medium text-slate-400">
                <button className="hover:text-blue-400 transition-colors">Terminal</button>
                <button className="hover:text-blue-400 transition-colors">Output</button>
            </div>
            <div className="p-4 font-mono text-sm text-slate-400 h-full overflow-auto">
                <p className="text-green-400">➜  Ready.</p>
                <p className="text-slate-500 mt-2">Welcome to Launchlets. Select a file to start editing.</p>
            </div>
        </div>
      </div>
    </div>
  );
}
