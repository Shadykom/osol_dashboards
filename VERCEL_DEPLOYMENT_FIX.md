# Vercel Deployment - Supabase Connection Fix

## The Issue
Your Supabase connection works locally but fails on Vercel because the environment variables aren't set in Vercel.

## Step-by-Step Fix

### 1. Add Environment Variables to Vercel

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

```
VITE_SUPABASE_URL = https://bzlenegoilnswsbanxgb.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bGVuZWdvaWxuc3dzYmFueGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyODU3ODIsImV4cCI6MjA2ODg2MTc4Mn0.DtVNndVsrUZtTtVRpEWiQb5QtbhPAErSQ88wWYVWeBE
```

**Important**: 
- Add these for all environments (Production, Preview, Development)
- Or select "All Environments" when adding

### 2. Redeploy Your Application

After adding the environment variables:

1. Go to the **Deployments** tab
2. Click on the three dots (...) next to your latest deployment
3. Select **Redeploy**
4. Or trigger a new deployment by pushing a commit

### 3. Verify Environment Variables are Loaded

You can check if variables are set correctly:

1. Go to your deployment URL
2. Open browser console (F12)
3. Navigate to `/diagnostic`
4. Click "Run Diagnostics"

### 4. Clear Vercel Build Cache (if needed)

If issues persist:

1. Go to **Settings** → **Functions**
2. Find "Clear Cache" button
3. Click to clear build cache
4. Redeploy

## Alternative: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Link your project
vercel link

# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy
vercel --prod
```

## Vercel-Specific Configuration

Make sure your `vercel.json` is correct:

```json
{
  "framework": "vite",
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "installCommand": "pnpm install"
}
```

## Common Issues

### Issue: Environment variables not available in build
**Solution**: Vite requires `VITE_` prefix for client-side variables

### Issue: 401 errors only on Vercel
**Solution**: 
1. Check environment variables are set for all environments
2. Ensure no typos in the values
3. Redeploy after setting variables

### Issue: Build fails on Vercel
**Solution**: Check build logs for specific errors

## Testing Deployment

1. **Check Build Logs**: Vercel Dashboard → Your Project → Functions tab
2. **Check Runtime Logs**: Vercel Dashboard → Your Project → Functions → Logs
3. **Use Diagnostic Page**: `https://your-app.vercel.app/diagnostic`

## Security Note

The `VITE_SUPABASE_ANON_KEY` is safe to expose in the browser as it's meant for public access. However, never expose:
- `SUPABASE_SERVICE_ROLE_KEY`
- Database passwords
- Admin keys

## Quick Checklist

- [ ] Environment variables added in Vercel Dashboard
- [ ] Variables have `VITE_` prefix
- [ ] Selected all environments or specific ones
- [ ] Redeployed after adding variables
- [ ] Cleared browser cache
- [ ] Checked `/diagnostic` page

## Need More Help?

1. Check Vercel build logs for errors
2. Verify environment variables in Vercel dashboard
3. Test with the diagnostic page
4. Check browser console for specific errors