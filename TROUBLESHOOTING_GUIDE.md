# Troubleshooting Guide - Specialist Report Errors

## Current Status
The errors indicate that the database schema fixes have NOT been applied yet. The same column mismatch errors are still occurring.

## Step-by-Step Fix Instructions

### 1. First, verify database connection
```bash
psql -d your_database -c "SELECT current_database(), current_user, version();"
```

### 2. Check current schema status
```bash
psql -d your_database -f diagnose_actual_schema.sql > schema_diagnosis.txt
cat schema_diagnosis.txt
```

### 3. Apply the comprehensive fix
```bash
# Make sure you're connected to the correct database
psql -d your_database -f fix_all_column_mismatches.sql
```

### 4. Verify the fix was applied
```sql
-- Run this query to check if columns were added
psql -d your_database -c "
SELECT 
    t.table_name,
    string_agg(c.column_name, ', ') as columns
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name 
    AND t.table_schema = c.table_schema
WHERE t.table_schema = 'kastle_banking' 
    AND t.table_name IN ('customers', 'loan_accounts', 'promise_to_pay')
    AND c.column_name IN ('customer_type', 'national_id', 'loan_amount', 
                          'outstanding_balance', 'loan_start_date', 
                          'actual_payment_date', 'actual_payment_amount')
GROUP BY t.table_name;"
```

### 5. Check if tables were created
```sql
psql -d your_database -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'kastle_banking' 
    AND table_name IN ('promise_to_pay', 'collection_teams', 
                       'collection_officers', 'officer_performance_metrics')
ORDER BY table_name;"
```

### 6. Restart PostgREST
```bash
# Option 1: Using systemd
sudo systemctl restart postgrest
sudo systemctl status postgrest

# Option 2: Using Docker
docker restart postgrest_container_name
docker logs postgrest_container_name --tail 50

# Option 3: If PostgREST is running locally
# Kill the process and restart it
ps aux | grep postgrest
kill -9 [PID]
# Then restart PostgREST with your configuration
```

### 7. Clear browser cache and reload
1. Open Developer Tools (F12)
2. Right-click the reload button
3. Select "Empty Cache and Hard Reload"

## If the fix didn't work

### Check for errors during script execution
```bash
# Run the fix script and capture output
psql -d your_database -f fix_all_column_mismatches.sql 2>&1 | tee fix_output.log

# Check for errors
grep -i error fix_output.log
grep -i "does not exist" fix_output.log
```

### Common issues and solutions

#### Issue 1: Permission denied
```sql
-- Grant necessary permissions to your user
GRANT ALL PRIVILEGES ON SCHEMA kastle_banking TO your_username;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA kastle_banking TO your_username;
```

#### Issue 2: Schema doesn't exist
```sql
-- Create the schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS kastle_banking;
```

#### Issue 3: Tables are locked
```sql
-- Check for locks
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    backend_start,
    state,
    query
FROM pg_stat_activity
WHERE datname = current_database()
    AND state != 'idle'
    AND query NOT LIKE '%pg_stat_activity%';

-- Terminate blocking connections (use with caution)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = current_database()
    AND pid != pg_backend_pid()
    AND state = 'idle in transaction';
```

## Alternative: Manual column addition

If the script fails, you can add columns manually one by one:

```sql
-- 1. Fix customers table
ALTER TABLE kastle_banking.customers 
ADD COLUMN IF NOT EXISTS customer_type VARCHAR(50);

ALTER TABLE kastle_banking.customers 
ADD COLUMN IF NOT EXISTS national_id VARCHAR(50);

-- 2. Fix loan_accounts table  
ALTER TABLE kastle_banking.loan_accounts 
ADD COLUMN IF NOT EXISTS loan_amount NUMERIC(18,2);

ALTER TABLE kastle_banking.loan_accounts 
ADD COLUMN IF NOT EXISTS outstanding_balance NUMERIC(18,2);

ALTER TABLE kastle_banking.loan_accounts 
ADD COLUMN IF NOT EXISTS loan_start_date DATE;

-- 3. Create promise_to_pay table
CREATE TABLE IF NOT EXISTS kastle_banking.promise_to_pay (
    ptp_id SERIAL PRIMARY KEY,
    case_id INTEGER,
    officer_id VARCHAR(20),
    ptp_date DATE NOT NULL,
    ptp_amount NUMERIC(18,2) NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING',
    actual_payment_date DATE,
    actual_payment_amount NUMERIC(18,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create collection_teams table
CREATE TABLE IF NOT EXISTS kastle_banking.collection_teams (
    team_id SERIAL PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    team_type VARCHAR(50),
    team_lead_id VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Verification checklist

- [ ] Connected to correct database
- [ ] Script executed without errors
- [ ] All missing columns added
- [ ] All missing tables created
- [ ] PostgREST restarted
- [ ] Browser cache cleared
- [ ] Page reloaded

## Still having issues?

1. **Check PostgREST logs**
   ```bash
   journalctl -u postgrest -f
   # or
   docker logs postgrest_container_name -f
   ```

2. **Verify PostgREST configuration**
   - Check that `db-schema` includes `kastle_banking`
   - Verify `db-anon-role` is set correctly

3. **Test direct database query**
   ```sql
   -- This should work if columns exist
   SELECT 
       c.customer_type,
       c.national_id,
       la.loan_amount,
       la.outstanding_balance
   FROM kastle_banking.customers c
   JOIN kastle_banking.collection_cases cc ON c.customer_id = cc.customer_id
   LEFT JOIN kastle_banking.loan_accounts la ON cc.loan_account_number = la.loan_account_number
   LIMIT 1;
   ```

## Browser Extension Errors (Ignore these)
The Ethereum wallet errors at the top of the console are NOT related to your database issue:
- `Cannot redefine property: ethereum`
- `ObjectMultiplex - orphaned data`

These are caused by multiple crypto wallet extensions and can be safely ignored.