# Vercel Deployment Instructions - Schema Fix

## Current Situation
- Your schema fixes are on branch: `cursor/resolve-ethereum-conflict-and-update-schema-references-554f`
- Vercel is deploying from: `main` branch
- The `main` branch does NOT have the schema fixes yet

## Option 1: Merge to Main (Recommended)

### Via GitHub Web Interface:
1. Go to: https://github.com/Shadykom/osol_dashboards
2. Click "Pull requests" → "New pull request"
3. Set:
   - base: `main`
   - compare: `cursor/resolve-ethereum-conflict-and-update-schema-references-554f`
4. Create pull request with title: "Fix: Update all database queries to use kastle_banking schema"
5. Merge the pull request
6. Vercel will automatically rebuild and deploy

### Via Command Line:
```bash
# Switch to main branch
git checkout main

# Pull latest changes
git pull origin main

# Merge your fix branch
git merge cursor/resolve-ethereum-conflict-and-update-schema-references-554f

# Push to trigger Vercel deployment
git push origin main
```

## Option 2: Deploy Feature Branch on Vercel

1. Go to your Vercel dashboard
2. Go to Project Settings → Git
3. Change "Production Branch" from `main` to `cursor/resolve-ethereum-conflict-and-update-schema-references-554f`
4. Save changes
5. Trigger a new deployment

## Option 3: Preview Deployment

Vercel automatically creates preview deployments for all branches:
1. Check your Vercel dashboard for a preview URL for this branch
2. The URL will be something like: `osol-dashboards-<hash>-shadykom.vercel.app`

## What Was Fixed

The following changes were made to use the `kastle_banking` schema:

### Files Updated:
- `/src/utils/fixDashboardAuth.js` - Fixed undefined supabase reference
- `/src/pages/DiagnosticPage.jsx` - Updated to use supabaseBanking
- `/src/services/mockCustomerService.js` - Fixed import issues
- `/src/services/mockDashboardService.js` - Fixed import issues
- `/src/lib/supabase.js` - Updated test query
- Multiple other files updated via comprehensive fix script

### Key Changes:
1. All `import { supabase }` → `import { supabaseBanking }`
2. All `supabase.from()` → `supabaseBanking.from()`
3. All queries now use `kastle_banking` schema instead of `public`

## Verification After Deployment

Once deployed, verify:
1. No more errors about `relation "public.collection_officers" does not exist`
2. Data loads properly from all tables
3. Check browser console - should be clean of schema errors

## Environment Variables

Make sure your Vercel project has these environment variables:
```
VITE_SUPABASE_URL=https://bzlenegoilnswsbanxgb.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```