# Fix for jsPDF autoTable Error

## Issue
The error `i.autoTable is not a function` was occurring when trying to generate PDF reports from the executive dashboard.

## Root Cause
The `jspdf-autotable` plugin was imported as a side effect:
```javascript
import 'jspdf-autotable';
```

This approach relies on the plugin automatically adding the `autoTable` method to jsPDF instances, but this wasn't working correctly in the production build.

## Solution
Changed to use the named import approach:

1. Updated the import statement in `/workspace/src/services/dashboardButtonService.js`:
```javascript
// Before:
import 'jspdf-autotable';

// After:
import autoTable from 'jspdf-autotable';
```

2. Updated all calls from `pdf.autoTable(...)` to `autoTable(pdf, ...)`:
```javascript
// Before:
pdf.autoTable({
  startY: yPosition,
  head: [kpiData[0]],
  body: kpiData.slice(1),
  theme: 'grid',
  styles: { fontSize: 10 },
  headStyles: { fillColor: [67, 56, 202] }
});

// After:
autoTable(pdf, {
  startY: yPosition,
  head: [kpiData[0]],
  body: kpiData.slice(1),
  theme: 'grid',
  styles: { fontSize: 10 },
  headStyles: { fillColor: [67, 56, 202] }
});
```

## Files Modified
- `/workspace/src/services/dashboardButtonService.js` - Fixed import and all autoTable calls

## Additional Notes
- The `reportGenerator.js` file was already using the correct import approach
- The build now completes successfully
- To deploy, run: `pnpm run build` followed by your deployment command