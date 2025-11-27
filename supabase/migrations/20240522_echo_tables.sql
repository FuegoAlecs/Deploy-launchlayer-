-- Create Echo Interactions Table
CREATE TABLE IF NOT EXISTS public.echo_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    messages JSONB NOT NULL, -- Stores the array of messages for context
    response TEXT, -- The final AI response
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.echo_interactions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own interactions
CREATE POLICY "Users can view own Echo history" ON public.echo_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create Echo interactions" ON public.echo_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create User Echo Limits Table
CREATE TABLE IF NOT EXISTS public.user_echo_limits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  requests_used INTEGER DEFAULT 0,
  requests_limit INTEGER DEFAULT 100,
  reset_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  subscription_tier TEXT DEFAULT 'beta' CHECK (subscription_tier IN ('beta', 'free', 'pro', 'enterprise'))
);

-- Enable RLS
ALTER TABLE public.user_echo_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own Echo limits" ON public.user_echo_limits
  FOR SELECT USING (auth.uid() = user_id);

-- Note: Updates to limits typically happen via Edge Functions (trusted environment) or specific triggers.
-- If we need client-side updates (not recommended for limits), we'd need an update policy.
-- For now, assuming limits are managed by the AI function or admin.
