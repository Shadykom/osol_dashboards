# Add Environment Variables to Vercel Dashboard

## The Problem
Your Vercel project settings show empty environment variables. The `env` section in `vercel.json` doesn't automatically populate the dashboard.

## Step-by-Step Solution

### 1. Go to Vercel Dashboard
1. Open: https://vercel.com/dashboard
2. Click on your project

### 2. Navigate to Environment Variables
1. Click on **"Settings"** tab
2. Click on **"Environment Variables"** in the left sidebar

### 3. Add Each Variable

#### Variable 1: Supabase URL
- **Key**: `VITE_SUPABASE_URL`
- **Value**: `https://bzlenegoilnswsbanxgb.supabase.co`
- **Environment**: Select all (Production ✓, Preview ✓, Development ✓)
- Click **"Save"**

#### Variable 2: Supabase Anon Key
- **Key**: `VITE_SUPABASE_ANON_KEY`
- **Value**: 
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bGVuZWdvaWxuc3dzYmFueGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyODU3ODIsImV4cCI6MjA2ODg2MTc4Mn0.DtVNndVsrUZtTtVRpEWiQb5QtbhPAErSQ88wWYVWeBE
```
- **Environment**: Select all (Production ✓, Preview ✓, Development ✓)
- Click **"Save"**

### 4. Trigger a New Deployment
After adding the variables:

**Option A: From Dashboard**
1. Go to **"Deployments"** tab
2. Click the **"..."** menu on the latest deployment
3. Select **"Redeploy"**
4. Click **"Redeploy"** in the dialog

**Option B: Push a Commit**
```bash
git add .
git commit -m "Trigger rebuild with environment variables" --allow-empty
git push
```

### 5. Verify Variables Were Added
1. In Settings → Environment Variables, you should see:
   - `VITE_SUPABASE_URL` (hidden value)
   - `VITE_SUPABASE_ANON_KEY` (hidden value)

2. Both should show for all environments

## Important Notes

### Why Manual Addition is Required
- `vercel.json` env vars are for local development/preview
- Production environment variables must be set in the dashboard
- This is a security feature to prevent accidental exposure

### After Adding Variables
1. Wait for deployment to complete (2-3 minutes)
2. Clear browser cache
3. Visit your site
4. Check browser console - should see the debug messages
5. Visit `/diagnostic` page to verify

## Quick Copy-Paste Values

**VITE_SUPABASE_URL:**
```
https://bzlenegoilnswsbanxgb.supabase.co
```

**VITE_SUPABASE_ANON_KEY:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bGVuZWdvaWxuc3dzYmFueGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyODU3ODIsImV4cCI6MjA2ODg2MTc4Mn0.DtVNndVsrUZtTtVRpEWiQb5QtbhPAErSQ88wWYVWeBE
```

## Verification Checklist
- [ ] Added `VITE_SUPABASE_URL` in Vercel dashboard
- [ ] Added `VITE_SUPABASE_ANON_KEY` in Vercel dashboard
- [ ] Selected all environments for both
- [ ] Triggered new deployment
- [ ] Deployment completed successfully
- [ ] No more 401 errors in browser console