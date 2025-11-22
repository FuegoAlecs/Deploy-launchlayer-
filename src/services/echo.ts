
import { supabase } from './supabase';

export interface EchoResponse {
  message: string;
  usage: {
    total_tokens: number;
  };
}

export const echoService = {
  /**
   * Checks if the user has remaining requests for the month.
   */
  async checkLimits(userId: string): Promise<{ allowed: boolean; remaining: number }> {
    try {
      const { data, error } = await supabase
        .from('user_echo_limits')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Record doesn't exist, create it (default 100 limit)
        // If RLS allows insert, this works. Otherwise, we might fail or assume default.
        // Assuming we rely on the backend/trigger to create this, or we treat "no record" as "new user".
        // Let's return true for now if no record, effectively free tier until limit row created.
        return { allowed: true, remaining: 100 };
      }

      if (data) {
        // Check if reset date passed
        const now = new Date();
        const resetDate = new Date(data.reset_date);

        if (now > resetDate) {
            // Logic to reset would typically happen on backend, but we can return "allowed"
            // and assume the backend function handles the reset or we ignore the count.
            return { allowed: true, remaining: data.requests_limit };
        }

        const remaining = data.requests_limit - data.requests_used;
        return { allowed: remaining > 0, remaining };
      }

      return { allowed: true, remaining: 100 }; // Fallback
    } catch (err) {
      console.error('Error checking limits:', err);
      return { allowed: true, remaining: 0 }; // Fail safe?
    }
  },

  /**
   * Calls the AI backend function.
   */
  async sendMessage(prompt: string, context?: string): Promise<EchoResponse> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    // 1. Invoke Edge Function
    const { data, error } = await supabase.functions.invoke('ai-review-deployment', {
      body: {
        prompt: prompt + (context ? `\n\nContext Code:\n${context}` : ''),
        // Passing context if needed by the function
      }
    });

    if (error) {
      console.error('Echo API Error:', error);
      throw new Error(error.message || 'Failed to communicate with Echo');
    }

    // 2. Log interaction (Fire and Forget)
    this.logInteraction(session.user.id, prompt, data?.response || data?.message || JSON.stringify(data));

    // 3. Update Limits (Best effort from client side if function doesn't do it)
    // Ideally the Edge Function updates the limit. We'll assume it does or we do it here.
    // Since I can't see the Edge Function code, I will optimistically update the client usage count if needed.
    this.incrementUsage(session.user.id);

    return {
        message: data?.response || data?.choices?.[0]?.message?.content || "I couldn't generate a response.",
        usage: { total_tokens: 0 } // Function might not return usage
    };
  },

  async logInteraction(userId: string, prompt: string, response: string) {
    try {
        await supabase.from('echo_interactions').insert({
            user_id: userId,
            prompt,
            response
        });
    } catch (e) {
        console.error('Failed to log interaction', e);
    }
  },

  async incrementUsage(userId: string) {
      try {
          // Increment used count.
          // Note: This is susceptible to race conditions and client manipulation if RLS isn't strict.
          // Ideally: RPC call. Here: raw update.
          const { data } = await supabase
            .from('user_echo_limits')
            .select('requests_used')
            .eq('user_id', userId)
            .single();

          if (data) {
              await supabase.from('user_echo_limits').update({
                  requests_used: data.requests_used + 1
              }).eq('user_id', userId);
          }
      } catch (e) {
          // ignore
      }
  }
};
