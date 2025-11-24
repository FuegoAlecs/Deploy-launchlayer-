
import { createClient } from '@supabase/supabase-js';

// Use environment variables if available, otherwise fallback to provided values (e.g. for testing/sandbox)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xqugncgzcuduswusxneg.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxdWduY2d6Y3VkdXN3dXN4bmVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTAyMzIsImV4cCI6MjA3NjEyNjIzMn0.RyvW9XHEJlNvJeOYX3AwqLnlykDgrNpScjrxrsGXHoc';

// Custom storage adapter to share session via cookies across subdomains
const cookieStorage = {
  getItem: (key: string): string | null => {
    const match = document.cookie.match(new RegExp(`(^| )${key}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
  },
  setItem: (key: string, value: string): void => {
    // Set cookie for the root domain so it is shared
    const isProd = window.location.hostname.includes('launchlayer.xyz');
    const domain = isProd ? '.launchlayer.xyz' : undefined;
    const domainPart = domain ? `; domain=${domain}` : '';

    // Using a simpler cookie string construction
    document.cookie = `${key}=${encodeURIComponent(value)}${domainPart}; path=/; max-age=31536000; SameSite=Lax; Secure`;
  },
  removeItem: (key: string): void => {
    const isProd = window.location.hostname.includes('launchlayer.xyz');
    const domain = isProd ? '.launchlayer.xyz' : undefined;
    const domainPart = domain ? `; domain=${domain}` : '';

    document.cookie = `${key}=${domainPart}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure`;
  },
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'sb-auth-token', // Consistent key for cookie name
    storage: cookieStorage, // Use our custom cookie storage
  }
});
