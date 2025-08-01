# Risk Reports Fix Summary

## Issues Fixed

### 1. Column Name Mismatches
The main issue was that the code was using incorrect column names that don't exist in the `loan_accounts` table:

#### Fixed Column Names:
- `loan_id` → `loan_account_id` (primary key)
- `loan_amount` → `principal_amount`
- `days_past_due` → `overdue_days`
- Removed `risk_category` (doesn't exist in schema)

### 2. Loan Status Values
Updated loan status values to match the database CHECK constraint:

#### Valid Loan Statuses:
- `ACTIVE`
- `CLOSED`
- `NPA` (Non-Performing Asset)
- `WRITTEN_OFF`
- `RESTRUCTURED`
- `FORECLOSED`

#### Removed Invalid Statuses:
- `DEFAULT` → Use `NPA`
- `DELINQUENT` → Use `NPA`
- `WATCHLIST` → Not in schema
- `SUBSTANDARD` → Not in schema
- `DOUBTFUL` → Not in schema
- `DISBURSED` → Use `ACTIVE`

### 3. Loan Types Relationship
Made the `loan_types` join optional with graceful fallback:
- The code now tries to join with `loan_types` table
- If the table doesn't exist or join fails, it falls back to query without the join
- This prevents errors if the `loan_types` table hasn't been created yet

### 4. Division by Zero Protection
Added checks to prevent division by zero errors:
- `provisionCoverage`: Check if `nplAmount > 0`
- `percentage` calculations: Check if denominator > 0
- Recovery analysis percentages: Check if `totalRecovered > 0`

## Files Modified

1. **`src/services/reports/riskReportService.js`**
   - Fixed `getCreditRiskReport()` method
   - Fixed `getNPLAnalysis()` method
   - Fixed `getLiquidityRiskReport()` method
   - Updated portfolio quality categories

2. **`src/services/comprehensiveReportService.js`**
   - Removed `risk_category` from credit risk report query

## Database Requirements

To fully enable loan type reporting, run the following SQL:

```sql
-- Create loan_types table
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

-- Add loan_type_id to loan_accounts
ALTER TABLE kastle_banking.loan_accounts 
ADD COLUMN IF NOT EXISTS loan_type_id INTEGER 
REFERENCES kastle_banking.loan_types(loan_type_id);

-- Insert default loan types
INSERT INTO kastle_banking.loan_types (type_name, type_code, max_amount, min_amount, interest_rate, max_tenure_months) VALUES
('Personal Loan', 'PERSONAL', 1000000, 10000, 12.5, 60),
('Home Loan', 'HOME', 10000000, 100000, 8.5, 240),
('Auto Loan', 'AUTO', 2000000, 50000, 10.5, 84),
('Business Loan', 'BUSINESS', 5000000, 50000, 14.0, 120),
('Education Loan', 'EDUCATION', 1500000, 20000, 9.5, 180);
```

## Testing

The risk reports should now work without errors. The reports will:
1. Display loan portfolio data with correct column names
2. Calculate NPL ratios using valid loan statuses
3. Show loan type distribution if the `loan_types` table exists
4. Gracefully handle missing relationships

## Next Steps

1. Run the SQL script above in your Supabase database to enable loan type reporting
2. Update any existing loan records to have valid loan status values
3. Consider adding more detailed risk categorization if needed