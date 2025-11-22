
const https = require('https');

const projectRef = 'xqugncgzcuduswusxneg';
const token = 'sbp_33416a49ea9f915392e31fad59adc77827984c73';

const sql = `
-- Create echo_interactions
CREATE TABLE IF NOT EXISTS public.echo_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT,
  response TEXT,
  model TEXT DEFAULT 'echo-v1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tokens_used INTEGER DEFAULT 0
);

ALTER TABLE public.echo_interactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'echo_interactions' AND policyname = 'Users can view own Echo history'
    ) THEN
        CREATE POLICY "Users can view own Echo history" ON public.echo_interactions
          FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'echo_interactions' AND policyname = 'Users can create Echo interactions'
    ) THEN
        CREATE POLICY "Users can create Echo interactions" ON public.echo_interactions
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Create user_echo_limits
CREATE TABLE IF NOT EXISTS public.user_echo_limits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  requests_used INTEGER DEFAULT 0,
  requests_limit INTEGER DEFAULT 100,
  reset_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  subscription_tier TEXT DEFAULT 'beta' CHECK (subscription_tier IN ('beta', 'free', 'pro', 'enterprise'))
);

ALTER TABLE public.user_echo_limits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'user_echo_limits' AND policyname = 'Users can view own Echo limits'
    ) THEN
        CREATE POLICY "Users can view own Echo limits" ON public.user_echo_limits
          FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;
`;

const options = {
  hostname: 'api.supabase.com',
  path: `/v1/projects/${projectRef}/query`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error('Error:', e);
});

req.write(JSON.stringify({ query: sql }));
req.end();
