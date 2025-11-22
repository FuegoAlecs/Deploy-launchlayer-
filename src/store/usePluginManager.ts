import { create } from 'zustand';
import { ReactNode } from 'react';

export interface Plugin {
  id: string;
  name: string;
  icon: ReactNode;
  component: ReactNode;
  description?: string;
}

interface PluginState {
  activePlugin: string | null;
  plugins: Record<string, Plugin>;

  registerPlugin: (plugin: Plugin) => void;
  activatePlugin: (id: string) => void;
  deactivatePlugin: () => void;
}

export const usePluginManager = create<PluginState>((set) => ({
  activePlugin: null,
  plugins: {},

  registerPlugin: (plugin) => set((state) => ({
    plugins: { ...state.plugins, [plugin.id]: plugin }
  })),

  activatePlugin: (id) => set({ activePlugin: id }),
  deactivatePlugin: () => set({ activePlugin: null }),
}));
