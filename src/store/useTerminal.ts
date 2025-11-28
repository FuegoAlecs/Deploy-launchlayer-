import { create } from 'zustand';

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  source?: string;
}

interface TerminalState {
  logs: LogEntry[];
  isOpen: boolean;
  height: number;

  addLog: (message: string, type?: LogEntry['type'], source?: string) => void;
  clearLogs: () => void;
  toggleTerminal: (open?: boolean) => void;
  setHeight: (height: number) => void;
}

export const useTerminal = create<TerminalState>((set) => ({
  logs: [
    {
      id: 'init',
      timestamp: Date.now(),
      type: 'info',
      message: 'Welcome to Launchlets Terminal.',
      source: 'System'
    }
  ],
  isOpen: true,
  height: 192, // 12rem = 192px default

  addLog: (message, type = 'info', source = 'System') => {
    set((state) => ({
      logs: [
        ...state.logs,
        {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          type,
          message,
          source
        }
      ]
    }));
  },

  clearLogs: () => set({ logs: [] }),

  toggleTerminal: (open) => set((state) => ({
    isOpen: open !== undefined ? open : !state.isOpen
  })),

  setHeight: (height) => set({ height })
}));
