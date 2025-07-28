# Fix Database Connection Issues

## Problem Summary

You're experiencing two main issues:

1. **Browser Extension Conflicts**: Multiple browser extensions (MetaMask, Polkadot, etc.) are conflicting with each other
2. **Supabase Invalid API Key Error**: The application cannot connect to the database due to missing API credentials

## Solution Steps

### 1. Fix Supabase Connection (Priority)

The error `AuthApiError: Invalid API key` indicates that the Supabase anon key is not properly configured.

#### Step 1: Get Your Supabase Anon Key

1. Open your browser and go to: https://supabase.com/dashboard/project/bzlenegoilnswsbanxgb/settings/api
2. Sign in with your Supabase account credentials
3. In the "Project API keys" section, find the **anon (public)** key
4. Copy this key (it should start with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

#### Step 2: Update Your Environment File

1. Open the `.env` file in your project root (already created)
2. Replace `your-anon-key-here` with the actual anon key you copied
3. Save the file

Your `.env` file should look like:
```
VITE_SUPABASE_URL=https://bzlenegoilnswsbanxgb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Step 3: Restart Your Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
# or
pnpm dev
```

### 2. Fix Browser Extension Conflicts (Optional)

The browser extension errors are not critical but can be annoying. To fix them:

#### Option A: Disable Conflicting Extensions
1. Open Chrome/Edge extension settings
2. Temporarily disable MetaMask, Polkadot, and other Web3 extensions
3. Reload the page

#### Option B: Use a Different Browser Profile
1. Create a new browser profile for development
2. Only install necessary extensions
3. Use this profile for testing

### 3. Verify Database Connection

After updating the `.env` file, you can verify the connection:

```javascript
// In your browser console, you should see:
// "Supabase configuration status: Configured" (instead of "Missing credentials")
```

### 4. Database Connection Details

Your database connection string breakdown:
- **Host**: `db.bzlenegoilnswsbanxgb.supabase.co`
- **Port**: `5432`
- **Database**: `postgres`
- **User**: `postgres`
- **Password**: `OSOL1a15975311`
- **Supabase URL**: `https://bzlenegoilnswsbanxgb.supabase.co`

### 5. Temporary Workaround (If Needed)

If you need to test the application immediately without the proper API key, I've created a mock Supabase client at `src/lib/supabase-temp.js`. To use it:

1. In your import statements, temporarily change:
   ```javascript
   // Change from:
   import { supabase } from '@/lib/supabase';
   // To:
   import { supabase } from '@/lib/supabase-temp';
   ```

2. This will use mock data instead of real database queries

**Note**: This is only for testing. You must configure the real API key for production use.

### 6. Troubleshooting

If you still see errors after configuration:

1. **Clear browser cache and localStorage**:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

2. **Check if the anon key is correct**:
   - It should be a long JWT token
   - It should start with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`

3. **Verify RLS (Row Level Security) policies**:
   - The error might be due to RLS policies blocking access
   - Check if RLS is enabled on your tables
   - You may need to run the SQL scripts to disable RLS temporarily

### 7. Next Steps

Once the API key is configured:

1. The dashboard should load without errors
2. You should be able to log in with your credentials
3. Data should load from the actual database

If you continue to have issues, check:
- The Supabase dashboard for any service outages
- Your project's RLS policies
- The browser console for more specific error messages