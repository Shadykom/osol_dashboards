# Fix Schema Errors - Instructions

## Problem
You're still seeing errors about `relation "public.collection_officers" does not exist` because the browser is running old compiled code from the `dist` folder.

## Solution

### Option 1: Development Mode (Recommended for Testing)
Run the development server which will use the updated source code:

```bash
npm run dev
```

Then access your application at `http://localhost:5173` (or whatever port Vite shows).

### Option 2: Production Build (For Deployment)
If you need to deploy or test the production build:

1. **Clean the old build:**
   ```bash
   rm -rf dist
   ```

2. **Build with updated code:**
   ```bash
   npm run build
   ```

3. **Serve the new build:**
   ```bash
   npm run preview
   ```

### Option 3: If Using Vercel or Other Hosting
If your application is deployed on Vercel or another platform:

1. **Commit the changes:**
   ```bash
   git add -A
   git commit -m "Fix: Update all database queries to use kastle_banking schema"
   git push
   ```

2. **Trigger a new deployment:**
   - Vercel will automatically rebuild when you push
   - Or manually trigger a rebuild in your hosting platform

## What Was Fixed

All database queries have been updated to use the `kastle_banking` schema instead of the `public` schema:

1. **Updated imports:** Changed from `import { supabase }` to `import { supabaseBanking }`
2. **Fixed queries:** All `.from()` calls now use the correct client
3. **Fixed files:**
   - `/src/utils/fixDashboardAuth.js`
   - `/src/pages/DiagnosticPage.jsx`
   - `/src/services/mockCustomerService.js`
   - `/src/services/mockDashboardService.js`
   - And several others

## Verification

After rebuilding and running the new code:
1. The errors about missing tables should be gone
2. Data should load properly from the `kastle_banking` schema
3. Check the browser console - you should not see any "relation does not exist" errors

## Important Notes

- The error messages you're seeing are from the OLD compiled code in `dist/assets/index-BddPKr7D.js`
- The source code has been fixed, but you need to rebuild for the changes to take effect
- Always restart your dev server or rebuild after making schema changes