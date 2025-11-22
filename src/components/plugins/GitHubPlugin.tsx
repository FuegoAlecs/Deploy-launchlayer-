import React from 'react';
import { Github, Download, Loader2, AlertCircle } from 'lucide-react';
import { useFileSystem } from '../../store/useFileSystem';

export function GitHubPlugin() {
  const { createFile } = useFileSystem();
  const [url, setUrl] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const handleImport = async () => {
      if (!url) return;
      setIsLoading(true);
      setError(null);
      setSuccessMsg(null);

      try {
          // Basic URL parsing to convert blob URLs to raw
          // e.g., https://github.com/user/repo/blob/main/file.sol -> https://raw.githubusercontent.com/user/repo/main/file.sol

          let fetchUrl = url;
          if (url.includes('github.com') && url.includes('/blob/')) {
              fetchUrl = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
          }

          const response = await fetch(fetchUrl);
          if (!response.ok) throw new Error('Failed to fetch file');

          const content = await response.text();

          // Extract filename from URL
          const fileName = url.split('/').pop() || 'Imported.sol';
          const path = `/github/${fileName}`;

          await createFile(path, content, 'file');
          setSuccessMsg(`Imported to ${path}`);
          setUrl('');
      } catch (err: any) {
          setError(err.message || 'Failed to import');
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="h-full flex flex-col text-slate-300 p-4">
        <h2 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
            <Github size={16} />
            GitHub Import
        </h2>

        <div className="space-y-4">
            <p className="text-xs text-slate-500">
                Import a file directly from GitHub. Paste the full URL to the file.
            </p>

            <div>
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://github.com/user/repo/blob/main/Contract.sol"
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm focus:border-blue-500 outline-none"
                />
            </div>

            <button
                onClick={handleImport}
                disabled={isLoading || !url}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white p-2 rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                <span>Import</span>
            </button>

            {error && (
                <div className="p-3 bg-red-900/20 border border-red-900/50 rounded flex items-start gap-2 text-xs text-red-400">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {successMsg && (
                <div className="p-3 bg-green-900/20 border border-green-900/50 rounded text-xs text-green-400">
                    {successMsg}
                </div>
            )}
        </div>
    </div>
  );
}
