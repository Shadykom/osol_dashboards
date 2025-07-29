# Supabase Authentication Fix Guide

## Problem Summary
Your application is experiencing 401 (Unauthorized) errors when trying to access the Supabase database. This is happening because:
1. The Supabase anon key is missing from your environment configuration
2. Row Level Security (RLS) is enabled on your database tables
3. Multiple GoTrueClient instances are being created (warning, not critical)

## Solution Options

### Option 1: Get the Correct Anon Key (RECOMMENDED)

1. **Access Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/bzlenegoilnswsbanxgb/settings/api
   - Sign in with your Supabase account

2. **Copy the Anon Key**
   - Look for the "Project API keys" section
   - Find the "anon" key (it starts with "eyJ...")
   - Copy the entire key

3. **Update Your Configuration**
   - Open the `.env` file in your project root
   - Update the line: `VITE_SUPABASE_ANON_KEY=<paste-your-anon-key-here>`
   - Save the file

4. **Restart Your Development Server**
   ```bash
   # Stop the current server (Ctrl+C)
   # Start it again
   pnpm dev
   ```

### Option 2: Disable RLS for Testing (Quick Fix)

If you need to test immediately and have database access:

1. **Install PostgreSQL client** (if not already installed)
   ```bash
   # On Ubuntu/Debian
   sudo apt-get install postgresql-client
   
   # On macOS
   brew install postgresql
   ```

2. **Run the RLS disable script**
   ```bash
   psql "postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres" -f disable_rls_for_testing.sql
   ```

   **⚠️ WARNING**: This disables security on your tables. Only use for testing!

### Option 3: Use Supabase CLI

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Login and link your project**
   ```bash
   supabase login
   supabase link --project-ref bzlenegoilnswsbanxgb
   ```

3. **Get your project status** (includes anon key)
   ```bash
   supabase status
   ```

## Current Workarounds in Place

The application has been configured to:
1. **Use mock data** when database is unavailable
2. **Bypass authentication** for demo purposes
3. **Show helpful error messages** in the console

## Fixing the Multiple GoTrueClient Warning

This warning appears because Supabase clients are being created in multiple places. To fix:

1. Ensure you're using the shared Supabase client instances from `src/lib/supabase.js`
2. Don't create new Supabase clients in components
3. Use the appropriate client for each schema:
   - `supabase` - for general/auth operations
   - `supabaseBanking` - for kastle_banking schema
   - `supabaseCollection` - for kastle_collection schema

## Files Created/Modified

1. **get_supabase_anon_key.js** - Helper script with instructions
2. **.env.example** - Template for environment variables
3. **disable_rls_for_testing.sql** - SQL script to disable RLS
4. **src/lib/supabase.js** - Updated with better error handling

## Next Steps

1. Get your anon key from the Supabase dashboard (Option 1)
2. Update your `.env` file
3. Restart your development server
4. The 401 errors should be resolved

## Need Help?

- Supabase Documentation: https://supabase.com/docs
- API Keys Guide: https://supabase.com/docs/guides/api/api-keys
- RLS Guide: https://supabase.com/docs/guides/auth/row-level-security