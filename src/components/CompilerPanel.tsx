import React from 'react';
import { Play } from 'lucide-react';
import { useFileSystem, FileEntry } from '../store/useFileSystem';
import { useCompiler } from '../store/useCompiler';

export function CompilerPanel() {
  const { files, activeFile } = useFileSystem();
  const { compiledContracts, errors, isCompiling, setCompiling, setCompilationResult, setErrors } = useCompiler();
  const [worker, setWorker] = React.useState<Worker | null>(null);

  React.useEffect(() => {
      // Initialize worker
      // Removing { type: 'module' } to allow importScripts in the worker
      const w = new Worker(new URL('../workers/solc.worker.ts', import.meta.url));

      w.onmessage = (e) => {
          const { type, payload } = e.data;
          if (type === 'version-loaded') {
              console.log('Compiler loaded:', payload.version);
          } else if (type === 'compile-result') {
              setCompiling(false);
              setCompilationResult(activeFile || 'unknown', payload);
          } else if (type === 'error') {
              setCompiling(false);
              setErrors([{ severity: 'error', formattedMessage: payload }]);
          }
      };

      // Load default version
      w.postMessage({
          id: 1,
          type: 'load-version',
          payload: { url: 'https://binaries.soliditylang.org/bin/soljson-v0.8.24+commit.e11b9ed9.js', version: '0.8.24' }
      });

      setWorker(w);
      return () => w.terminate();
  }, [setCompiling, setCompilationResult, setErrors]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCompile = () => {
      if (!worker || !activeFile) return;

      setCompiling(true);
      const sources: Record<string, { content: string }> = {};

      // Gather sources
      Object.values(files).forEach((f: FileEntry) => {
          if (f.type === 'file') {
              sources[f.path.replace(/^\//, '')] = { content: f.content };
          }
      });

      worker.postMessage({
          id: Date.now(),
          type: 'compile',
          payload: { sources }
      });
  };

  return (
    <div className="h-full flex flex-col text-slate-300">
        <div className="p-4 border-b border-slate-800">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-4">Solidity Compiler</h2>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs text-slate-500 mb-1">Compiler Version</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-300 focus:border-blue-500 outline-none">
                        <option>0.8.24+commit.e11b9ed9</option>
                    </select>
                </div>

                <button
                    onClick={handleCompile}
                    disabled={isCompiling}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white p-2 rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   {isCompiling ? (
                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   ) : (
                       <Play size={16} />
                   )}
                   <span>Compile</span>
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
             <div className="space-y-4">
                {errors && errors.length > 0 && (
                    <div className="space-y-2">
                        {errors.map((err: any, idx: number) => (
                            <div key={idx} className={`p-2 rounded text-xs border ${err.severity === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'}`}>
                                <pre className="whitespace-pre-wrap font-mono">{err.formattedMessage}</pre>
                            </div>
                        ))}
                    </div>
                )}

                {Object.keys(compiledContracts).length > 0 && errors.length === 0 && (
                     <div className="p-3 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-sm">
                         Compilation Successful!
                     </div>
                )}

                {/* Contract List */}
                {Object.entries(compiledContracts).map(([id, contract]) => (
                     <div key={id} className="p-3 bg-slate-900 border border-slate-800 rounded mb-2">
                        <div className="font-bold text-slate-200 mb-2">{contract.name}</div>
                        <div className="grid grid-cols-2 gap-2">
                            <button className="text-xs bg-slate-800 p-2 rounded hover:bg-slate-700 text-left">
                                Bytecode
                            </button>
                            <button className="text-xs bg-slate-800 p-2 rounded hover:bg-slate-700 text-left">
                                ABI
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}
