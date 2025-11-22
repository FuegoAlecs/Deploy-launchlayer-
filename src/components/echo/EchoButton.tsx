
import { Bot, Sparkles } from 'lucide-react';
import { useEcho } from '../../store/useEcho';
import { clsx } from 'clsx';

export function EchoButton() {
  const { toggleOpen, isOpen } = useEcho();

  return (
    <button
      onClick={toggleOpen}
      className={clsx(
        "fixed bottom-6 right-6 z-40 p-0 rounded-full shadow-2xl transition-all duration-300 group",
        isOpen ? "rotate-90 scale-0 opacity-0" : "scale-100 opacity-100"
      )}
      title="Ask Echo"
    >
      <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full border border-blue-400/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)]">
        {/* Pulse Effect */}
        <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-20 animate-ping"></span>

        <Bot size={28} className="text-white group-hover:scale-110 transition-transform" />

        <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-1 border-2 border-slate-950">
            <Sparkles size={10} className="text-slate-900" />
        </div>
      </div>
    </button>
  );
}
