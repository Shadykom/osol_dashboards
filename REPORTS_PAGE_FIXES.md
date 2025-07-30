# Reports Page Error Fixes

## Issues Fixed

### 1. SQL Query Error - "column transactions.transaction_amountasamount does not exist"

**Issue**: The Supabase query was incorrectly formatting the column alias, causing `transaction_amount as amount` to be concatenated as `transaction_amountasamount`.

**Fix**: Removed the column alias from the select statement in `/workspace/src/services/comprehensiveReportService.js`:
```javascript
// Before:
.select('transaction_amount as amount, transaction_type_id, transaction_date')

// After:
.select('transaction_amount, transaction_type_id, transaction_date')
```

Also updated the code that references the field:
```javascript
// Before:
const totalRevenue = revenueData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

// After:
const totalRevenue = revenueData?.reduce((sum, t) => sum + (t.transaction_amount || 0), 0) || 0;
```

### 2. PDF Generation Error - "t.autoTable is not a function"

**Issue**: The `jspdf-autotable` library was not being imported correctly, causing the `autoTable` function to be undefined.

**Fix**: Updated the import and usage in `/workspace/src/utils/reportGenerator.js`:
```javascript
// Before:
import jsPDF from 'jspdf';
import 'jspdf-autotable';
// Usage: pdf.autoTable({...})

// After:
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
// Usage: autoTable(pdf, {...})
```

All occurrences of `pdf.autoTable(` were replaced with `autoTable(pdf, ` throughout the file.

## Testing

After applying these fixes:
1. The SQL query error should be resolved and data should load correctly
2. PDF generation should work without errors
3. The reports page should function properly

## Note

The repeated "Port disconnected, reconnecting..." messages in the console appear to be related to browser extensions (likely wallet extensions like Phantom, Keplr, etc.) and are not related to the application code.