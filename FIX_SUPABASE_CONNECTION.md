# Fix Supabase Connection Error

## Problem
The application is showing "Invalid API key" error when trying to connect to Supabase. This happens because the Supabase client needs proper API keys to authenticate requests.

## Quick Solution

### Step 1: Get Your Supabase API Keys

1. Go to your Supabase dashboard:
   ```
   https://supabase.com/dashboard/project/bzlenegoilnswsbanxgb/settings/api
   ```

2. Sign in with your Supabase account

3. Find the "Project API keys" section

4. Copy the **anon (public)** key - it looks like:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Step 2: Configure Your Environment

1. Create a `.env` file in your project root:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your keys:
   ```env
   VITE_SUPABASE_URL=https://bzlenegoilnswsbanxgb.supabase.co
   VITE_SUPABASE_ANON_KEY=<paste-your-anon-key-here>
   ```

3. Restart your development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

## Alternative: Using the Helper Script

Run the provided helper script:
```bash
./get_supabase_keys.sh
```

This will guide you through the process of getting and setting up your API keys.

## Understanding the Error

The error occurs because:
1. Supabase requires API keys for authentication
2. The application is trying to use placeholder keys
3. The anon key is needed for client-side operations

## Security Notes

- **anon (public) key**: Safe to use in frontend code
- **service_role key**: NEVER expose in client-side code
- Keep your `.env` file in `.gitignore`

## Troubleshooting

If you still see errors after adding the keys:

1. Make sure the `.env` file is in the project root
2. Check that the key is copied correctly (no extra spaces)
3. Restart the development server
4. Clear browser cache and reload

## Database Information

Your Supabase project details:
- Project ID: `bzlenegoilnswsbanxgb`
- Database URL: `postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres`
- API URL: `https://bzlenegoilnswsbanxgb.supabase.co`