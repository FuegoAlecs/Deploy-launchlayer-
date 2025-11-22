import { create } from 'zustand';
import { loadFilesFromDB, saveFileToDB, deleteFileFromDB } from '../utils/db';

export interface FileEntry {
  path: string;
  content: string;
  type: 'file' | 'directory';
  updatedAt: number;
}

interface FileSystemState {
  files: Record<string, FileEntry>;
  activeFile: string | null;
  isLoading: boolean;

  initialize: () => Promise<void>;
  createFile: (path: string, content?: string, type?: 'file' | 'directory') => Promise<void>;
  updateFileContent: (path: string, content: string) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  selectFile: (path: string) => void;
  renameFile: (oldPath: string, newPath: string) => Promise<void>;
}

export const useFileSystem = create<FileSystemState>((set, get) => ({
  files: {},
  activeFile: null,
  isLoading: true,

  initialize: async () => {
    set({ isLoading: true });
    try {
      const fileList = await loadFilesFromDB();
      const filesMap: Record<string, FileEntry> = {};
      let hasFiles = false;

      fileList.forEach((file) => {
        filesMap[file.path] = file;
        hasFiles = true;
      });

      // If no files (first run might have missed the upgrade callback if component mounted too fast?),
      // check if we need to seed manually. But db.ts upgrade() handles seeding.

      set({ files: filesMap, isLoading: false });

      // Auto-select the first file if available
      if (!get().activeFile && hasFiles) {
         const firstFile = Object.values(filesMap).find(f => f.type === 'file');
         if (firstFile) {
             set({ activeFile: firstFile.path });
         }
      }

    } catch (error) {
      console.error('Failed to initialize file system:', error);
      set({ isLoading: false });
    }
  },

  createFile: async (path, content = '', type = 'file') => {
    const newFile: FileEntry = {
      path,
      content,
      type,
      updatedAt: Date.now(),
    };

    // Optimistic update
    set((state) => ({
      files: { ...state.files, [path]: newFile },
      activeFile: type === 'file' ? path : state.activeFile
    }));

    await saveFileToDB(path, content, type);
  },

  updateFileContent: async (path, content) => {
    set((state) => {
        const file = state.files[path];
        if (!file) return state;
        return {
            files: {
                ...state.files,
                [path]: { ...file, content, updatedAt: Date.now() }
            }
        };
    });

    // Debounce save to DB? For now, direct save.
    const file = get().files[path];
    if (file) {
        await saveFileToDB(path, content, file.type);
    }
  },

  deleteFile: async (path) => {
    set((state) => {
      const newFiles = { ...state.files };
      delete newFiles[path];

      // If active file is deleted, unselect it
      const newActiveFile = state.activeFile === path ? null : state.activeFile;

      return { files: newFiles, activeFile: newActiveFile };
    });

    await deleteFileFromDB(path);
  },

  selectFile: (path) => {
    set({ activeFile: path });
  },

  renameFile: async (oldPath, newPath) => {
      const state = get();
      const file = state.files[oldPath];
      if (!file) return;

      const newFile = { ...file, path: newPath, updatedAt: Date.now() };

      set((state) => {
          const newFiles = { ...state.files };
          delete newFiles[oldPath];
          newFiles[newPath] = newFile;
          return {
              files: newFiles,
              activeFile: state.activeFile === oldPath ? newPath : state.activeFile
            };
      });

      await deleteFileFromDB(oldPath);
      await saveFileToDB(newPath, newFile.content, newFile.type);
  }
}));
