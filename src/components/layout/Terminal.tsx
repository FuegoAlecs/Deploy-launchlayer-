import { useRef, useEffect } from 'react';
import { useTerminal } from '../../store/useTerminal';
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';

export function Terminal() {
  const { logs, isOpen, height, toggleTerminal, setHeight, clearLogs } = useTerminal();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isOpen]);

  // Resize Handlers
  const startResizing = () => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const newHeight = window.innerHeight - e.clientY;
    // Min height 32px (header), Max height 80% of screen
    if (newHeight > 32 && newHeight < window.innerHeight * 0.8) {
      setHeight(newHeight);
    }
  };

  const stopResizing = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  if (!isOpen) {
      return (
          <div
            className="border-t border-slate-800 bg-slate-900 px-4 py-1 flex justify-between items-center cursor-pointer hover:bg-slate-800 transition-colors h-8"
            onClick={() => toggleTerminal(true)}
          >
              <span className="text-xs text-slate-400 font-mono">Terminal</span>
              <ChevronUp size={14} className="text-slate-500" />
          </div>
      )
  }

  return (
    <div
        className="flex flex-col border-t border-slate-800 bg-slate-900/95 backdrop-blur shadow-xl relative transition-all duration-75"
        style={{ height: height }}
    >
        {/* Resize Handle */}
        <div
            className="h-1 w-full bg-slate-800 hover:bg-blue-500 cursor-row-resize absolute top-0 left-0 z-10 transition-colors"
            onMouseDown={startResizing}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/50 bg-slate-900 select-none">
            <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Terminal</span>
                <div className="flex gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500/50"></span>
                    <span className="w-2 h-2 rounded-full bg-yellow-500/50"></span>
                    <span className="w-2 h-2 rounded-full bg-green-500/50"></span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={clearLogs} className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-red-400" title="Clear">
                    <Trash2 size={14} />
                </button>
                <button onClick={() => toggleTerminal(false)} className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white" title="Minimize">
                    <ChevronDown size={14} />
                </button>
            </div>
        </div>

        {/* Logs */}
        <div ref={scrollRef} className="flex-1 overflow-auto p-4 font-mono text-sm space-y-1">
            {logs.map((log) => (
                <div key={log.id} className="flex gap-2 items-start opacity-90 hover:opacity-100">
                    <span className="text-slate-600 text-xs mt-[3px] select-none">
                        [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second:'2-digit' })}]
                    </span>
                    <span className={clsx("break-all", {
                        'text-slate-300': log.type === 'info',
                        'text-green-400': log.type === 'success',
                        'text-red-400': log.type === 'error',
                        'text-yellow-400': log.type === 'warning',
                    })}>
                        {log.source && <span className="text-slate-500 mr-2 font-bold text-xs uppercase">{log.source}:</span>}
                        {log.message}
                    </span>
                </div>
            ))}
        </div>
    </div>
  );
}
