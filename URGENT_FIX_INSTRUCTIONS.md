# URGENT: Fix Supabase Connection Issues

## The Issue
You're still getting 401 errors because the browser hasn't loaded the updated environment variables.

## Immediate Steps to Fix

### 1. Stop the Development Server
Press `Ctrl+C` in the terminal where `pnpm dev` is running.

### 2. Clear Vite Cache
```bash
rm -rf node_modules/.vite
```

### 3. Restart the Development Server
```bash
pnpm dev
```

### 4. Clear Browser Cache
1. Open Chrome DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### 5. Test the Diagnostic Page
Navigate to: http://localhost:5173/diagnostic

Click "Run Diagnostics" to see:
- What environment variables are loaded
- If the API key is correct
- Which connections work/fail

### 6. If Still Not Working
Try the "Clear Local Storage & Reload" button on the diagnostic page.

## Alternative: Force Reload Everything

```bash
# Stop the server (Ctrl+C)
# Then run:
rm -rf node_modules/.vite
rm -rf dist
pnpm install
pnpm dev
```

## What We've Fixed
1. ✅ Updated all .env files with correct API key
2. ✅ Fixed duplicate client creation
3. ✅ Removed .schema() calls
4. ✅ Fixed auth configuration

The issue now is just that the browser is caching old values.

## Check the Console
When the page loads, look for:
```
🔍 Supabase Configuration Debug:
VITE_SUPABASE_URL: https://bzlenegoilnswsbanxgb.supabase.co
VITE_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIs...88wWYVWeBE
Key length: 211
URL valid: true
Key looks valid: true
```

If you see "NOT SET" or wrong values, the environment variables aren't loading correctly.