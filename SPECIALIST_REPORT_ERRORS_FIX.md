# Specialist Report Errors - Troubleshooting Guide

## Overview
The browser console shows multiple errors related to:
1. Ethereum wallet conflicts (browser extension issues)
2. Database schema mismatches (missing columns)
3. PostgREST API errors

## Error Summary

### Database Errors:
- `column collection_teams_1.team_lead_id does not exist`
- `column loan_accounts_1.loan_amount does not exist`
- `column promise_to_pay.actual_payment_date does not exist`
- `column promise_to_pay.actual_payment_amount does not exist`

### Browser Extension Conflicts:
- Multiple Ethereum wallet extensions trying to inject providers
- MetaMask, Penumbra, and other Web3 wallets conflicting

## Solutions

### 1. Fix Database Schema Issues

Run the following SQL scripts in order:

```bash
# First, fix the missing loan relationships
psql -d your_database -f quick_fix_missing_loans.sql

# Then fix the specialist report schema
psql -d your_database -f fix_specialist_report_schema.sql

# Or use the API compatibility fix (recommended)
psql -d your_database -f fix_specialist_report_api.sql
```

### 2. Schema Mismatch Details

The application expects certain column names that differ from the actual database schema:

| Expected Column | Actual Column | Table |
|----------------|---------------|-------|
| loan_amount | principal_amount | loan_accounts |
| outstanding_balance | outstanding_principal | loan_accounts |
| loan_start_date | disbursement_date | loan_accounts |

### 3. Quick Fixes

#### Option A: Use Computed Columns (PostgREST 9.0+)
The `fix_specialist_report_api.sql` script creates computed columns that PostgREST will expose as regular columns:

```sql
-- These functions create virtual columns
loan_accounts.loan_amount() -> returns principal_amount
loan_accounts.outstanding_balance() -> returns outstanding_principal + outstanding_interest
```

#### Option B: Modify the Frontend
Update the frontend code to use the correct column names:

```javascript
// In specialistReportService.js, update the field mappings:
loanAmount: caseData.loan_accounts?.principal_amount || 0,
paidAmount: (caseData.loan_accounts?.principal_amount || 0) - 
           ((caseData.loan_accounts?.outstanding_principal || 0) + 
            (caseData.loan_accounts?.outstanding_interest || 0)),
```

### 4. Browser Extension Issues

For the Ethereum wallet conflicts:

1. **Disable conflicting extensions**: Keep only one Web3 wallet active
2. **Use a dedicated browser profile**: Create a profile specifically for this application
3. **Ignore the errors**: These don't affect the core application functionality

### 5. Verification Steps

After applying the fixes:

```sql
-- Check if computed columns are working
SELECT 
    loan_account_number,
    principal_amount,
    loan_accounts_loan_amount(loan_accounts.*) as loan_amount
FROM kastle_banking.loan_accounts
LIMIT 5;

-- Verify promise_to_pay structure
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
  AND table_name = 'promise_to_pay';

-- Test the API endpoint
curl "http://your-postgrest-server/loan_accounts?select=loan_account_number,loan_amount,outstanding_balance&limit=1"
```

### 6. PostgREST Configuration

Ensure PostgREST is configured to:
1. Use the correct schema (`kastle_banking`)
2. Has the latest schema loaded (restart after changes)
3. Has appropriate role permissions

```bash
# Restart PostgREST after schema changes
sudo systemctl restart postgrest

# Or with Docker
docker restart postgrest_container
```

## Prevention

1. **Use consistent naming conventions** across database and application
2. **Document schema expectations** in the codebase
3. **Use database migrations** to track schema changes
4. **Test API endpoints** after schema modifications

## Alternative Solutions

If you cannot modify the database schema:

1. **Create a middleware layer** that transforms the API responses
2. **Use database views** with the expected column names
3. **Modify the PostgREST queries** to use column aliases

Example view approach:
```sql
CREATE VIEW api_loan_accounts AS
SELECT 
    *,
    principal_amount as loan_amount,
    outstanding_principal + outstanding_interest as outstanding_balance
FROM kastle_banking.loan_accounts;
```

Then update your API calls to use `api_loan_accounts` instead of `loan_accounts`.