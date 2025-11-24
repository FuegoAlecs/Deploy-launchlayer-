# Session Sharing Configuration

To enable session sharing between `launchlayer.xyz` and its subdomains (like `Launchlets.launchlayer.xyz`), both applications must use the same Supabase client configuration.

## Client Configuration

Use the following configuration when initializing your Supabase client. This ensures that the authentication token is stored in a cookie accessible to all subdomains, and handles large session tokens by chunking them.

```typescript
import { createClient } from '@supabase/supabase-js'

function getCookieDomain() {
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isLaunchLayer = hostname.includes('launchlayer.xyz');
  return isLaunchLayer && !isLocalhost ? '; domain=.launchlayer.xyz' : '';
}

function getSecureFlag() {
  if (typeof window === 'undefined') return '';
  return window.location.protocol === 'https:' ? '; Secure' : '';
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storageKey: 'sb-auth-token', // MUST match the main site
    storage: {
      getItem: (key) => {
        if (typeof document === 'undefined') return null;

        // Try reading as a single cookie first
        const match = document.cookie.match(new RegExp(`(^| )${key}=([^;]+)`));
        if (match) return decodeURIComponent(match[2]);

        // If not found, try reading chunks
        let value = '';
        let i = 0;
        while (true) {
          const chunkMatch = document.cookie.match(new RegExp(`(^| )${key}.${i}=([^;]+)`));
          if (!chunkMatch) break;
          value += decodeURIComponent(chunkMatch[2]);
          i++;
        }

        return value || null;
      },
      setItem: (key, value) => {
        if (typeof document === 'undefined') return;

        const domainStr = getCookieDomain();
        const secureStr = getSecureFlag();
        const encodedValue = encodeURIComponent(value);
        const maxChunkSize = 3000; // Safe size below 4KB limit

        if (encodedValue.length <= maxChunkSize) {
          document.cookie = `${key}=${encodedValue}${domainStr}; path=/; max-age=31536000; SameSite=Lax${secureStr}`;
        } else {
          // Clear any existing single cookie to avoid conflicts
          document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT${domainStr}${secureStr}`;

          // Split into chunks
          let i = 0;
          for (let offset = 0; offset < encodedValue.length; offset += maxChunkSize) {
            const chunk = encodedValue.slice(offset, offset + maxChunkSize);
            document.cookie = `${key}.${i}=${chunk}${domainStr}; path=/; max-age=31536000; SameSite=Lax${secureStr}`;
            i++;
          }
        }
      },
      removeItem: (key) => {
        if (typeof document === 'undefined') return;

        const domainStr = getCookieDomain();
        const secureStr = getSecureFlag();

        // Remove single cookie
        document.cookie = `${key}=${domainStr}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureStr}`;

        // Remove chunks (checking a reasonable number)
        for (let i = 0; i < 20; i++) {
          if (!document.cookie.match(new RegExp(`(^| )${key}.${i}=`))) break;
          document.cookie = `${key}.${i}=${domainStr}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureStr}`;
        }
      },
    },
    persistSession: true,
    autoRefreshToken: true,
  }
})
```

## Requirements

1.  **Same Project**: Ensure `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are the same across all apps.
2.  **Redirect URLs**: Add `https://Launchlets.launchlayer.xyz` (and other subdomains) to the **Redirect URLs** allowlist in your Supabase Dashboard -> Authentication -> URL Configuration.
3.  **Localhost**: When running on `localhost`, cookies will be stored as host-only (no domain attribute) and without the `Secure` flag if running on HTTP. This ensures local development works without issues.
