import React from 'react';
import { useFileSystem, FileEntry } from '../store/useFileSystem';
import { FileCode, Folder, Trash2, FilePlus, FolderPlus } from 'lucide-react';
import { clsx } from 'clsx';

export function FileExplorer() {
  const { files, activeFile, selectFile, createFile, deleteFile } = useFileSystem();

  const [newItemName, setNewItemName] = React.useState('');
  const [isCreating, setIsCreating] = React.useState<'file' | 'directory' | null>(null);

  const sortedFiles = React.useMemo(() => {
    return Object.values(files).sort((a: FileEntry, b: FileEntry) => {
        // Directories first
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.path.localeCompare(b.path);
    });
  }, [files]);

  const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newItemName) return;

      const path = newItemName.startsWith('/') ? newItemName : `/${newItemName}`;
      await createFile(path, '', isCreating || 'file');
      setIsCreating(null);
      setNewItemName('');
  };

  return (
    <div className="flex flex-col h-full text-slate-300">
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <span className="font-medium text-sm tracking-wide text-slate-400 uppercase">Workspace</span>
        <div className="flex gap-1">
            <button
                onClick={() => setIsCreating('file')}
                className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                title="New File"
            >
                <FilePlus size={16} />
            </button>
            <button
                onClick={() => setIsCreating('directory')}
                className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                title="New Folder"
            >
                <FolderPlus size={16} />
            </button>
        </div>
      </div>

      {isCreating && (
          <form onSubmit={handleCreate} className="p-2 border-b border-slate-800 bg-slate-800/30">
              <input
                autoFocus
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={isCreating === 'file' ? "Filename.sol" : "Folder Name"}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                onBlur={() => !newItemName && setIsCreating(null)}
              />
          </form>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        {sortedFiles.map((file: FileEntry) => (
          <div
            key={file.path}
            className={clsx(
              "group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-all duration-150",
              activeFile === file.path
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"
            )}
            onClick={() => {
                if (file.type === 'file') {
                    selectFile(file.path);
                    // Close mobile drawer if open - need access to parent state or dispatch event
                    // For simplicity, we can dispatch a custom event that MainLayout listens to
                    window.dispatchEvent(new CustomEvent('file-selected'));
                }
            }}
          >
            {file.type === 'directory' ? (
                <Folder size={16} className="text-amber-500/80" />
            ) : (
                <FileCode size={16} className="text-blue-400/80" />
            )}

            <span className="truncate flex-1">{file.path}</span>

            <button
                onClick={(e) => { e.stopPropagation(); deleteFile(file.path); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-all"
            >
                <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
