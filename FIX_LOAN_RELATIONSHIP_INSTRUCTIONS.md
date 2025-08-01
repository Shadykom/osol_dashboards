# Fix for Loan Relationship Error

## Error
```
Failed to generate report: Could not find a relationship between 'loan_accounts' and 'loan_types' in the schema cache
```

## Solution Steps

### Step 1: Apply Database Fix via Supabase Dashboard

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/bzlenegoilnswsbanxgb/sql/new
   - Sign in if needed

2. **Copy and Run the SQL Script**
   - Copy the entire contents of `fix_loan_relationship_complete.sql`
   - Paste it into the SQL editor
   - Click "Run" button

   This script will:
   - Create the `loan_types` table if it doesn't exist
   - Add sample loan types (Personal, Home, Auto, Business, Education)
   - Add `loan_type_id` column to `loan_accounts` if missing
   - Create foreign key constraint
   - Create a view `loan_accounts_with_types` for easier querying
   - Set up proper permissions

### Step 2: Verify the Fix

After running the SQL script, you can verify it worked by running this query in the SQL editor:

```sql
-- Check if loan_types table exists and has data
SELECT COUNT(*) as loan_types_count FROM kastle_banking.loan_types;

-- Check if loan_accounts has loan_type_id column
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'kastle_banking' 
  AND table_name = 'loan_accounts' 
  AND column_name = 'loan_type_id';

-- Check if the view was created
SELECT * FROM kastle_banking.loan_accounts_with_types LIMIT 1;
```

### Step 3: Frontend Code Updates (Already Applied)

The frontend code has already been updated to handle the relationship properly:

1. **comprehensiveReportService.js** - Now uses the `loan_accounts_with_types` view
2. **riskReportService.js** - Fetches loan types separately after getting loans
3. **regulatoryReportService.js** - Fetches loan types separately
4. **financialReportService.js** - Fetches loan types separately

### Alternative: Manual SQL Commands

If you prefer to run the commands step by step:

```sql
-- 1. Create schema if not exists
CREATE SCHEMA IF NOT EXISTS kastle_banking;

-- 2. Create loan_types table
CREATE TABLE IF NOT EXISTS kastle_banking.loan_types (
    loan_type_id SERIAL PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL,
    type_code VARCHAR(20) UNIQUE NOT NULL,
    max_amount DECIMAL(15,2),
    min_amount DECIMAL(15,2) DEFAULT 0,
    interest_rate DECIMAL(5,2),
    max_tenure_months INTEGER,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Insert sample loan types
INSERT INTO kastle_banking.loan_types (type_name, type_code, max_amount, min_amount, interest_rate, max_tenure_months) 
VALUES 
    ('Personal Loan', 'PERSONAL', 500000.00, 10000.00, 12.5, 60),
    ('Home Loan', 'HOME', 10000000.00, 100000.00, 8.5, 240),
    ('Auto Loan', 'AUTO', 2000000.00, 50000.00, 10.5, 84),
    ('Business Loan', 'BUSINESS', 5000000.00, 50000.00, 11.0, 120),
    ('Education Loan', 'EDUCATION', 1000000.00, 20000.00, 9.0, 120)
ON CONFLICT (type_code) DO NOTHING;

-- 4. Add loan_type_id column to loan_accounts
ALTER TABLE kastle_banking.loan_accounts 
ADD COLUMN IF NOT EXISTS loan_type_id INTEGER;

-- 5. Create foreign key
ALTER TABLE kastle_banking.loan_accounts 
ADD CONSTRAINT fk_loan_accounts_loan_type 
FOREIGN KEY (loan_type_id) 
REFERENCES kastle_banking.loan_types(loan_type_id);

-- 6. Create view
CREATE OR REPLACE VIEW kastle_banking.loan_accounts_with_types AS
SELECT 
    la.*,
    lt.type_name,
    lt.type_code,
    lt.max_amount as loan_type_max_amount,
    lt.interest_rate as loan_type_interest_rate,
    lt.description as loan_type_description
FROM kastle_banking.loan_accounts la
LEFT JOIN kastle_banking.loan_types lt ON la.loan_type_id = lt.loan_type_id;

-- 7. Grant permissions
GRANT SELECT ON kastle_banking.loan_types TO authenticated;
GRANT SELECT ON kastle_banking.loan_types TO anon;
GRANT SELECT ON kastle_banking.loan_accounts_with_types TO authenticated;
GRANT SELECT ON kastle_banking.loan_accounts_with_types TO anon;
```

## Testing

After applying the fix, test report generation again. The error should be resolved and reports should generate successfully.