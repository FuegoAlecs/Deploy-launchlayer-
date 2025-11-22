
import { create } from 'zustand';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface EchoState {
  isOpen: boolean;
  messages: Message[];
  isLoading: boolean;

  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  setLoading: (loading: boolean) => void;
  clearHistory: () => void;
}

export const useEcho = create<EchoState>((set) => ({
  isOpen: false,
  messages: [
    {
        id: 'welcome',
        role: 'assistant',
        content: "Hello! I'm Echo, your Solidity AI assistant. I can review your code, explain concepts, or help you debug. How can I help you today?",
        timestamp: Date.now()
    }
  ],
  isLoading: false,

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpen: (open) => set({ isOpen: open }),

  addMessage: (role, content) => set((state) => ({
    messages: [
        ...state.messages,
        {
            id: Math.random().toString(36).substring(7),
            role,
            content,
            timestamp: Date.now()
        }
    ]
  })),

  setLoading: (loading) => set({ isLoading: loading }),
  clearHistory: () => set({ messages: [] })
}));
