
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useFileSystem } from '../store/useFileSystem';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function useEcho() {
  const { user } = useAuth();
  const { activeFile, files } = useFileSystem();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!user) {
      setError('You must be logged in to use Echo.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);

    // Prepare context: Get active file content if available
    let fileContext = '';
    if (activeFile && files[activeFile]) {
        fileContext = `\n\nCurrent File (${activeFile}):\n\`\`\`\n${files[activeFile].content}\n\`\`\``;
    }

    try {
      // Use 'ide-debug-contract' as discovered via API inspection
      // It returns a stream (text/event-stream)
      const response = await supabase.functions.invoke('ide-debug-contract', {
        body: {
            messages: [...messages, userMessage],
            code: fileContext ? files[activeFile!]?.content : undefined // Send code separately if the function expects it
        },
        responseType: 'stream' // Important for streaming
      });

      if (response.error) {
          throw new Error(response.error.message || 'Failed to contact Echo.');
      }

      // Initialize assistant message
      const assistantMessage: Message = { role: 'assistant', content: '' };
      setMessages(prev => [...prev, assistantMessage]);

      const reader = response.data.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedContent = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });

        // The stream format depends on how the Edge Function sends it.
        // It might be raw text or SSE (data: ...).
        // Common generic stream: just append text.
        // SSE: Parse "data: " prefix.

        // Assuming raw text or basic SSE structure. Let's try simple append first.
        // If it looks like SSE, we might need parsing.

        // Simple heuristic: If it's pure text, append.
        accumulatedContent += chunkValue;

        // Update state progressively
        setMessages(prev => {
            const newHistory = [...prev];
            const lastMsg = newHistory[newHistory.length - 1];
            if (lastMsg.role === 'assistant') {
                lastMsg.content = accumulatedContent;
            }
            return newHistory;
        });
      }

      // Log interaction
      if (user) {
          supabase.from('echo_interactions').insert({
              user_id: user.id,
              messages: [...messages, userMessage, { role: 'assistant', content: accumulatedContent }],
              response: accumulatedContent
          }).then(({ error }) => {
              if (error) console.warn('Failed to log Echo interaction:', error);
          });
      }

    } catch (err: any) {
      console.error('Echo Error:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [user, messages, activeFile, files]);

  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage,
    isLoading,
    error,
    clearHistory
  };
}
