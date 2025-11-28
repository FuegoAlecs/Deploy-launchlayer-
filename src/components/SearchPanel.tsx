import React from 'react';
import { useFileSystem } from '../store/useFileSystem';
import { Search, FileCode } from 'lucide-react';

export function SearchPanel() {
  const { files, selectFile } = useFileSystem();
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<{ path: string; line: number; content: string }[]>([]);

  React.useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const newResults: { path: string; line: number; content: string }[] = [];

    Object.values(files).forEach((file) => {
      if (file.type === 'file') {
        const lines = file.content.split('\n');
        lines.forEach((lineContent, index) => {
          if (lineContent.toLowerCase().includes(query.toLowerCase())) {
            newResults.push({
              path: file.path,
              line: index + 1,
              content: lineContent.trim()
            });
          }
        });
      }
    });

    setResults(newResults);
  }, [query, files]);

  return (
    <div className="flex flex-col h-full text-slate-300">
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <span className="font-medium text-sm tracking-wide text-slate-400 uppercase block mb-3">Search</span>
        <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
            <input
                autoFocus
                type="text"
                placeholder="Search in files..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {query && results.length === 0 && (
            <div className="text-center text-slate-500 text-sm mt-10">No results found.</div>
        )}

        {results.map((result, idx) => (
            <div
                key={idx}
                onClick={() => selectFile(result.path)}
                className="group p-2 rounded hover:bg-slate-800/50 cursor-pointer transition-colors border border-transparent hover:border-slate-700"
            >
                <div className="flex items-center gap-2 mb-1">
                    <FileCode size={12} className="text-blue-400" />
                    <span className="text-xs font-medium text-slate-300">{result.path}</span>
                    <span className="text-xs text-slate-600 bg-slate-900 px-1 rounded ml-auto">:{result.line}</span>
                </div>
                <div className="text-xs text-slate-500 font-mono pl-4 truncate border-l border-slate-700 ml-1">
                    {result.content}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}
