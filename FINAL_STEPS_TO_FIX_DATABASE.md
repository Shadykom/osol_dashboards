# Final Steps to Fix Database Issues

## Issues Fixed in Code ✅

1. **Missing Column Errors**
   - Fixed queries trying to access `branch_id` on `collection_officers` table
   - Changed to query through `collection_teams` table
   - Fixed `region` column reference (changed to `state`)
   - Fixed `product_category` reference (changed to `category_id`)

2. **Empty Array Handling**
   - Added checks to prevent empty arrays in `IN` clauses
   - Returns empty results when no IDs are found

3. **Multiple GoTrueClient Warning**
   - Modified Supabase clients to share a single auth instance

4. **Table References**
   - Updated all services to use TABLES constants
   - Fixed schema references

## Required Action: Enable Schemas in Supabase ⚠️

The main remaining issue is that the custom schemas are not exposed in Supabase. You need to:

### Step 1: Log into Supabase Dashboard
1. Go to https://app.supabase.com
2. Log in with your credentials
3. Select your project (bzlenegoilnswsbanxgb)

### Step 2: Enable Custom Schemas
1. Navigate to **Settings** (gear icon in sidebar)
2. Click on **API** in the settings menu
3. Find the **Exposed schemas** section
4. Add these schemas:
   - `kastle_banking`
   - `kastle_collection`
5. Click **Save**

### Step 3: Verify the Fix
1. Refresh your application
2. Check the browser console - the 400 errors should be gone
3. The dashboard should now load data correctly

## Alternative: If You Cannot Access Supabase Dashboard

If you don't have access to the Supabase dashboard, you can create views in the public schema:

```sql
-- Connect to your database
psql "postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres"

-- Create views for all tables in public schema
CREATE OR REPLACE VIEW public.kb_customers AS SELECT * FROM kastle_banking.customers;
CREATE OR REPLACE VIEW public.kb_accounts AS SELECT * FROM kastle_banking.accounts;
CREATE OR REPLACE VIEW public.kb_branches AS SELECT * FROM kastle_banking.branches;
CREATE OR REPLACE VIEW public.kb_products AS SELECT * FROM kastle_banking.products;
CREATE OR REPLACE VIEW public.kb_loan_accounts AS SELECT * FROM kastle_banking.loan_accounts;
CREATE OR REPLACE VIEW public.kb_transactions AS SELECT * FROM kastle_banking.transactions;
CREATE OR REPLACE VIEW public.kb_collection_cases AS SELECT * FROM kastle_banking.collection_cases;

CREATE OR REPLACE VIEW public.kc_collection_officers AS SELECT * FROM kastle_collection.collection_officers;
CREATE OR REPLACE VIEW public.kc_collection_teams AS SELECT * FROM kastle_collection.collection_teams;
CREATE OR REPLACE VIEW public.kc_officer_performance_metrics AS SELECT * FROM kastle_collection.officer_performance_metrics;
CREATE OR REPLACE VIEW public.kc_promise_to_pay AS SELECT * FROM kastle_collection.promise_to_pay;
CREATE OR REPLACE VIEW public.kc_collection_interactions AS SELECT * FROM kastle_collection.collection_interactions;

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
```

Then update the TABLES constant in `/workspace/src/lib/supabase.js` to use these view names.

## Testing the Application

Once schemas are enabled (or views created):

1. The dashboard should load without errors
2. KPIs should display real numbers
3. Charts should populate with data
4. All reports should work correctly

## Browser Extension Errors

The ethereum-related errors (`Cannot redefine property: ethereum`) are from browser extensions (likely MetaMask or similar crypto wallets) and are not related to your application. These can be safely ignored.