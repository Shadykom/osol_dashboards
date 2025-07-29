# Vite + Vercel Deployment Guide

## Updated Configuration

### 1. Vite Configuration (`vite.config.js`)
✅ Now includes:
- `loadEnv` to properly load environment variables
- `define` section to explicitly expose env vars during build
- Fallback values for production builds

### 2. Environment Variables Setup

#### For Vercel Dashboard (Recommended)
1. Go to: https://vercel.com/dashboard
2. Select your project
3. Navigate to: **Settings** → **Environment Variables**
4. Add these variables:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://bzlenegoilnswsbanxgb.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bGVuZWdvaWxuc3dzYmFueGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyODU3ODIsImV4cCI6MjA2ODg2MTc4Mn0.DtVNndVsrUZtTtVRpEWiQb5QtbhPAErSQ88wWYVWeBE` |

5. Select **"All Environments"** (Production, Preview, Development)
6. Save the variables

#### Alternative: Using vercel.json
The environment variables are already in `vercel.json`, but Vercel Dashboard is more secure.

### 3. Build Process

The Vite build will now:
1. Load environment variables from Vercel's environment
2. Use the `define` config to inject them into the build
3. Fall back to hardcoded values if not found

### 4. Deployment Steps

```bash
# 1. Commit all changes
git add .
git commit -m "Fix Vite config for Vercel deployment"
git push

# 2. Vercel will auto-deploy on push
# Or manually trigger:
vercel --prod
```

### 5. Verification

After deployment, check:

1. **Browser Console**
   ```javascript
   // Should see:
   🔍 Supabase Configuration Debug:
   VITE_SUPABASE_URL: https://bzlenegoilnswsbanxgb.supabase.co
   VITE_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIs...88wWYVWeBE
   ```

2. **Diagnostic Page**
   - Visit: `https://your-app.vercel.app/diagnostic`
   - Click "Run Diagnostics"
   - Check all tests pass

3. **Manual Check**
   ```javascript
   // In browser console:
   window.checkSupabaseConfig()
   ```

## Troubleshooting

### Issue: Environment variables not loading
**Solution**: 
- Clear Vercel cache: Settings → Functions → Clear Cache
- Redeploy

### Issue: Still getting 401 errors
**Solution**:
- Verify variables in Vercel Dashboard
- Check build logs for any warnings
- Ensure variables have `VITE_` prefix

### Issue: Works locally but not on Vercel
**Solution**:
- Environment variables must be set in Vercel Dashboard
- Local `.env` files are not deployed

## Build Output

Check Vercel build logs for:
```
vite v5.x.x building for production...
✓ xxx modules transformed.
```

No warnings about missing environment variables.

## Security Notes

- `VITE_` prefixed variables are exposed to the browser (this is intentional)
- The anon key is safe to expose (it's designed for public access)
- Never expose service role keys or database passwords

## Final Checklist

- [ ] Updated `vite.config.js` with `loadEnv` and `define`
- [ ] Environment variables set in Vercel Dashboard
- [ ] Committed and pushed all changes
- [ ] Cleared browser cache after deployment
- [ ] Verified with diagnostic page
- [ ] No 401 errors in console

## Quick Test

```javascript
// Run in browser console on deployed site:
console.log('URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
```

Both should return valid values, not undefined.