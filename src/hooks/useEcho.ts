
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function useEcho() {
  const { user } = useAuth();
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

    // Add user message to state immediately
    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);

    try {
      // 1. Call the Edge Function
      // The prompt mentions: function for the ai agent is stored in that Supabase Edge Functions as ai-review-deployment
      // Assuming the function expects { messages: [...] } in the body

      const { data, error: fnError } = await supabase.functions.invoke('ai-review-deployment', {
        body: { messages: [...messages, userMessage] } // Send full history? Or just last? Usually full history for context.
      });

      if (fnError) {
        console.error('Echo Function Error:', fnError);
        throw new Error('Failed to contact Echo. Please try again.');
      }

      // Assuming the function returns { content: "AI Response", ... } or similar
      // If it returns a stream, we need to handle that. For now assuming JSON response.
      // Note: The prompt says "The function handles the call via groq...".
      // Let's assume the response structure is standard: { response: "text" } or { message: { content: "text" } }

      // I will assume data.response or data.content or data.choices[0].message.content
      // Let's start with a safe extraction
      const aiContent = data?.response || data?.content || data?.message?.content || JSON.stringify(data);

      const assistantMessage: Message = { role: 'assistant', content: aiContent };
      setMessages(prev => [...prev, assistantMessage]);

      // 2. Log the interaction (Fire and forget)
      if (user) {
          supabase.from('echo_interactions').insert({
              user_id: user.id,
              messages: [...messages, userMessage, assistantMessage],
              response: aiContent
          }).then(({ error }) => {
              if (error) console.warn('Failed to log Echo interaction:', error);
          });
      }

    } catch (err: any) {
      console.error('Echo Error:', err);
      setError(err.message || 'An unexpected error occurred.');
      // Remove the user message if failed? Or keep it and show error?
      // Keeping it is better UX, just show error toast/state.
    } finally {
      setIsLoading(false);
    }
  }, [user, messages]);

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
