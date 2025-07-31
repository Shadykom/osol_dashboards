# Total Assets Detail Page Fix

## Issue
The total assets widget was showing data on the main dashboard, but when clicking on it to view the detail page (`/dashboard/detail/overview/total_assets`), it displayed "No overview data available".

## Root Cause
The `enhancedDashboardDetailsService` was using the widget's simple query function from the WIDGET_CATALOG, which only returns `{value, change, trend}` for the dashboard view. However, the detail page component (`DashboardDetailNew`) expects more detailed data including `totalAssets`, `totalDeposits`, `totalLoans`, etc.

## Solution
Updated the `enhancedDashboardDetailsService.getWidgetDetails()` method to:

1. **Special handling for total_assets**: When the widget is `overview/total_assets`, it now calls the dedicated `getTotalAssetsOverview()` method instead of using the simple widget query function.

2. **Proper breakdown data**: Added special handling in `getGenericBreakdown()` to call `getTotalAssetsBreakdown()` for the total_assets widget.

## Code Changes

### src/services/enhancedDashboardDetailsService.js
```javascript
// Added special case for total_assets widget
if (section === 'overview' && widgetId === 'total_assets') {
  // For total_assets detail view, we need more detailed data
  overviewData = await this.getTotalAssetsOverview(filters);
  overviewData.widgetType = widgetDef.type;
  overviewData.widgetName = widgetDef.nameEn || widgetDef.name || widgetId;
}

// Added in getGenericBreakdown method
if (section === 'overview' && widgetId === 'total_assets') {
  return await this.getTotalAssetsBreakdown(filters);
}
```

## Result
The total assets detail page now displays:
- Overview tab: Total assets, deposits, loans with proper values and ratios
- Breakdown tab: Asset composition by category, type, and branch
- Trends tab: Historical trends for assets, deposits, and loans
- Raw Data tab: Detailed account and loan records

## Testing
Navigate to the dashboard and click on the "Total Assets" widget. The detail page should now display all data correctly across all tabs.