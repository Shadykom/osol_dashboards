# Quick Guide: Resolving Duplicate Tables

Based on your duplicate analysis, you have 8 tables that exist in multiple schemas:

## 📊 Duplicate Table Summary

| Table | Exists In | Action Needed |
|-------|-----------|---------------|
| **collection_officers** | ALL 3 schemas | Choose which version to keep |
| **promise_to_pay** | ALL 3 schemas | Choose which version to keep |
| **collection_cases** | kastle_banking, public | Drop from public or merge |
| **customers** | kastle_banking, public | Drop from public or merge |
| **collection_teams** | kastle_banking, kastle_collection | Drop from kastle_collection |
| **officer_performance_metrics** | kastle_banking, kastle_collection | Drop from kastle_collection |
| **collection_interactions** | kastle_collection, public | Move to kastle_banking |
| **officer_performance_summary** | kastle_collection, public | Move to kastle_banking |

## 🚀 Quick Resolution Steps

### Step 1: Analyze Data Distribution
First, check which version has the most/latest data:

```bash
psql "postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres" -f action_plan_for_duplicates.sql
```

### Step 2: Choose Your Strategy

#### Option A: If `kastle_banking` has all the data you need
Run these commands to drop duplicates and move remaining tables:

```sql
-- Drop duplicates from other schemas
DROP TABLE IF EXISTS public.collection_officers;
DROP TABLE IF EXISTS kastle_collection.collection_officers;
DROP TABLE IF EXISTS public.promise_to_pay;
DROP TABLE IF EXISTS kastle_collection.promise_to_pay;
DROP TABLE IF EXISTS public.collection_cases;
DROP TABLE IF EXISTS public.customers;
DROP TABLE IF EXISTS kastle_collection.collection_teams;
DROP TABLE IF EXISTS kastle_collection.officer_performance_metrics;

-- Move tables that aren't in kastle_banking yet
ALTER TABLE kastle_collection.collection_interactions SET SCHEMA kastle_banking;
ALTER TABLE kastle_collection.officer_performance_summary SET SCHEMA kastle_banking;

-- Drop their duplicates
DROP TABLE IF EXISTS public.collection_interactions;
DROP TABLE IF EXISTS public.officer_performance_summary;
```

#### Option B: If you need to preserve data from multiple schemas
First backup, then merge:

```sql
-- 1. Rename duplicates to preserve them
ALTER TABLE public.collection_officers RENAME TO collection_officers_backup_public;
ALTER TABLE kastle_collection.collection_officers RENAME TO collection_officers_backup_kc;
-- (repeat for other duplicates)

-- 2. Move unique tables
ALTER TABLE kastle_collection.collection_interactions SET SCHEMA kastle_banking;
ALTER TABLE kastle_collection.officer_performance_summary SET SCHEMA kastle_banking;

-- 3. Merge data from backups into kastle_banking tables
-- (requires custom INSERT queries based on your data)
```

### Step 3: Complete the Migration
After resolving duplicates, run the safe migration to move any remaining tables:

```bash
psql "postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres" -f safe_migration.sql
```

### Step 4: Verify
Check that everything is in `kastle_banking`:

```sql
SELECT table_schema, COUNT(*) as tables
FROM information_schema.tables
WHERE table_schema IN ('public', 'kastle_collection', 'kastle_banking')
  AND table_type = 'BASE TABLE'
GROUP BY table_schema;
```

## ⚠️ Important Notes

1. **Tables in 3 schemas** (`collection_officers`, `promise_to_pay`): These need careful attention as they exist everywhere
2. **Tables only in 2 schemas**: Easier to handle - usually just drop from the non-kastle_banking schema
3. **Always check row counts** before dropping to ensure you're not losing data
4. **Consider foreign key relationships** - dropping tables might fail if other tables reference them

## 💡 Recommended Approach

1. Start with `action_plan_for_duplicates.sql` to see row counts
2. If `kastle_banking` versions have the most data, use Option A (drop duplicates)
3. If data is distributed, use Option B (backup and merge)
4. Test with one table first before doing all of them