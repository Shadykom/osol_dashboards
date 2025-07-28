# Instructions to Disable All RLS on Your PostgreSQL Database

Due to network connectivity limitations in this environment, I've created SQL scripts that you can run directly. Here are your options:

## Option 1: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor section
3. Copy and paste the contents of `disable_rls_all_schemas.sql`
4. Click "Run" to execute the script

## Option 2: Using psql Command Line

If you have `psql` installed locally, run:

```bash
psql "postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres" -f disable_rls_all_schemas.sql
```

## Option 3: Using Any PostgreSQL Client

You can use any PostgreSQL client tool such as:
- pgAdmin
- DBeaver
- TablePlus
- DataGrip

Simply connect using these credentials:
- **Host**: db.bzlenegoilnswsbanxgb.supabase.co
- **Port**: 5432
- **Database**: postgres
- **Username**: postgres
- **Password**: OSOL1a15975311
- **SSL Mode**: Require

Then execute the SQL script `disable_rls_all_schemas.sql`.

## What the Script Does

The script will:

1. **Disable RLS on all tables** in all schemas (except system schemas)
2. **Drop all RLS policies** to ensure complete removal
3. **Grant full permissions** to anon, authenticated, and service_role users
4. **Handle the auth schema** specially if it exists
5. **Verify the results** and show you which tables (if any) still have RLS enabled

## Verification

After running the script, it will show:
- Count of tables with RLS still enabled (should be 0)
- List of any tables that still have RLS (if any)
- Schema access summary for all roles

## Important Notes

- This script will disable ALL security on your database tables
- Make sure this is what you want before running it
- Consider backing up your database first
- You may want to re-enable RLS selectively later for production use