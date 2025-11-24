import React from 'react';
import { useFileSystem, FileEntry } from '../store/useFileSystem';
import { FileCode, Folder, Trash2, FilePlus, FolderPlus, Download } from 'lucide-react';
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

  const handleFlatten = async (filePath: string) => {
    // 1. Get file content
    const rootContent = files[filePath]?.content || '';

    // 2. Simple regex based flattening (MVP)
    // In a real implementation, this needs AST parsing to handle imports correctly
    // and deduplicate them. For now, we will just look for 'import "..."'
    // and try to replace it with the content of that file if it exists in our store.

    const importRegex = /import\s+["']([^"']+)["'];/g;
    let flatContent = rootContent;
    let match;

    // Naive one-level flattening for MVP
    // A robust solution needs recursion and cycle detection
    while ((match = importRegex.exec(rootContent)) !== null) {
        const importStatement = match[0];
        const importPath = match[1];

        // Try to find the file in our store
        // Imports might be relative or absolute. This is a simplified check.
        // We assume flat structure or exact match for now.
        const fileKey = Object.keys(files).find(key => key.includes(importPath));

        if (fileKey && files[fileKey]) {
            const importedContent = files[fileKey].content;
            // Remove pragmas from imported content to avoid duplicates
            const cleanedContent = importedContent.replace(/pragma solidity .?.*;/g, '// pragma solidity ... (flattened)');
            flatContent = flatContent.replace(importStatement, `// Source: ${importPath}\n${cleanedContent}`);
        } else {
            flatContent = flatContent.replace(importStatement, `// Error: Could not resolve ${importPath}`);
        }
    }

    // Create new file
    const newPath = filePath.replace('.sol', '_flat.sol');
    await createFile(newPath, flatContent, 'file');
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

            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                {file.type === 'file' && file.path.endsWith('.sol') && (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleFlatten(file.path); }}
                        className="p-1 hover:bg-blue-500/20 hover:text-blue-400 rounded mr-1"
                        title="Flatten"
                    >
                        <Download size={12} />
                    </button>
                )}
                <button
                    onClick={(e) => { e.stopPropagation(); deleteFile(file.path); }}
                    className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded"
                    title="Delete"
                >
                    <Trash2 size={12} />
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
