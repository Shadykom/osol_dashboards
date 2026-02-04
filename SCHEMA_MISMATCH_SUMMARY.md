# Schema Mismatch Summary - Specialist Report

## All Column Mismatches Found

### 1. **customers** table
- **Expected**: `customer_type` → **Actual**: `customer_type_id`
- **Expected**: `national_id` → **Actual**: `nationality`

### 2. **loan_accounts** table
- **Expected**: `loan_amount` → **Actual**: `principal_amount`
- **Expected**: `outstanding_balance` → **Actual**: `outstanding_principal + outstanding_interest`
- **Expected**: `loan_start_date` → **Actual**: `disbursement_date`

### 3. **collection_cases** table
- **Missing**: `assigned_to`
- **Missing**: `dpd` (exists as `days_past_due`)
- **Missing**: `total_overdue`
- **Missing**: `last_contact_date`
- **Missing**: `next_action_date`

### 4. **promise_to_pay** table
- **Missing**: `actual_payment_date`
- **Missing**: `actual_payment_amount`
- **Missing**: `officer_id`

### 5. **collection_teams** table
- **Missing**: `team_lead_id`

### 6. **Other missing tables**
- `collection_officers`
- `officer_performance_metrics`

## Quick Fix Instructions

### Step 1: Run the comprehensive fix
```bash
psql -d your_database -f fix_all_column_mismatches.sql
```

This script will:
1. Add all missing columns to existing tables
2. Create missing tables
3. Populate new columns with data from existing columns
4. Create necessary indexes
5. Set up test data (officer OFF007)
6. Grant permissions

### Step 2: Restart PostgREST
```bash
sudo systemctl restart postgrest
# OR
docker restart postgrest_container_name
```

### Step 3: Verify the fix
Check the browser console - all database errors should be gone.

## What the Fix Does

1. **Adds columns instead of renaming** - This preserves existing data and maintains backward compatibility
2. **Copies data to new columns** - For example, `principal_amount` → `loan_amount`
3. **Creates calculated columns** - For example, `outstanding_balance = outstanding_principal + outstanding_interest`
4. **Creates all missing tables** - With proper structure expected by the frontend
5. **Inserts test data** - Creates officer OFF007 to avoid reference errors

## Alternative: Update Frontend

Instead of changing the database, you could update the frontend to use the correct column names:

```javascript
// In specialistReportService.js
customerType: caseData.customers?.customer_type_id === 1 ? 'فرد' : 'شركة',
customerId: caseData.customers?.nationality || caseData.customer_id,
loanAmount: caseData.loan_accounts?.principal_amount || 0,
// etc.
```

But the database fix is simpler and maintains API compatibility.

## Browser Extension Errors

The Ethereum wallet errors are NOT database-related:
- Multiple wallet extensions competing for `window.ethereum`
- Solution: Disable all but one wallet extension
- These errors don't affect the application functionality