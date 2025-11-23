
import { createClient } from '@supabase/supabase-js';

// Use environment variables if available, otherwise fallback to provided values (e.g. for testing/sandbox)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xqugncgzcuduswusxneg.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxdWduY2d6Y3VkdXN3dXN4bmVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTAyMzIsImV4cCI6MjA3NjEyNjIzMn0.RyvW9XHEJlNvJeOYX3AwqLnlykDgrNpScjrxrsGXHoc';

export const supabase = createClient(supabaseUrl, supabaseKey);
