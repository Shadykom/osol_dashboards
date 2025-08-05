# Branch Report Setup and Functionality

## Overview
The Branch Report page (`/collection/branch-report`) provides comprehensive analytics and performance metrics for branch-level collection operations.

## Features
- **Real-time Data Updates**: Live updates via WebSocket subscriptions
- **Performance Metrics**: Delinquency rates, collection rates, portfolio at risk
- **Officer Performance**: Individual officer metrics and rankings
- **Product Analysis**: Performance breakdown by product type
- **Communication Analytics**: Call, SMS, and email statistics
- **Branch Comparisons**: Compare branch performance against company averages
- **Export Capabilities**: Print and PDF export functionality

## Database Requirements

### Required Tables
1. **branches** - Branch information
2. **branch_collection_performance** - Performance metrics by branch and date
3. **collection_cases** - Collection case details
4. **customers** - Customer information
5. **loan_accounts** - Loan account details

### Setup Instructions

1. **Run the database setup script**:
   ```sql
   -- Execute in Supabase SQL Editor
   -- File: fix_branch_report_schema.sql
   ```

2. **Verify Supabase Configuration**:
   - Ensure `.env` file has correct Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://bzlenegoilnswsbanxgb.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```

3. **Enable Realtime**:
   - Tables must be added to the realtime publication
   - RLS policies must allow read access

## Component Structure

### Main Component
- **File**: `/src/components/dashboard/BranchLevelReport.jsx`
- **Features**:
  - Dynamic filtering (date range, product type, customer type)
  - Real-time data subscriptions
  - Responsive design with RTL support
  - Print-friendly layout

### Service Layer
- **File**: `/src/services/branchReportService.js`
- **Methods**:
  - `getBranches()` - Fetch all active branches
  - `getBranchReport()` - Get comprehensive branch metrics
  - `exportBranchReport()` - Export report data
- **Fallback**: Provides mock data when database is unavailable

### Real-time Hooks
- **File**: `/src/hooks/useRealtimeData.js`
- **Hooks**:
  - `useRealtimeBranchPerformance()` - Branch performance updates
  - `useRealtimeCollectionMetrics()` - Collection metrics updates

## Translations

### Required Translation Keys
All translation keys are now properly configured in:
- `/public/locales/en/translation.json`
- `/public/locales/ar/translation.json`

Key sections:
- `branchReport.*` - All branch report specific translations
- `common.realtime` - Real-time status indicator
- `common.notConnected` - Disconnected status
- `common.print` - Print functionality
- `common.exportPDF` - PDF export

## Troubleshooting

### Common Issues

1. **"Parse missing key" errors**:
   - Solution: All translation keys have been added. Refresh the page.

2. **No data displayed**:
   - Check if Supabase is configured correctly
   - Verify branches exist in the database
   - Component falls back to mock data if database is unavailable

3. **Real-time updates not working**:
   - Check WebSocket connection in browser console
   - Verify realtime is enabled for tables
   - Check RLS policies allow read access

4. **401 Unauthorized errors**:
   - Verify Supabase anon key is correct
   - Check RLS policies on tables

### Mock Data Mode
When database is not available, the service provides realistic mock data including:
- 5 sample branches
- Officer performance metrics
- Product distribution
- Communication statistics
- Trend data

## Performance Optimization

1. **Indexes**: All required indexes are created for optimal query performance
2. **Caching**: Component caches data and only refreshes when filters change
3. **Partial Updates**: Real-time updates modify specific metrics without full reload
4. **Lazy Loading**: Charts and heavy components load on-demand

## Security

1. **Row Level Security (RLS)**: Enabled on all tables
2. **Policies**: Read access granted to authenticated and anonymous users
3. **Data Filtering**: Server-side filtering based on user permissions

## Future Enhancements

1. **Advanced Filtering**: More granular filter options
2. **Custom Reports**: User-defined report templates
3. **Scheduled Reports**: Automated report generation and distribution
4. **AI Insights**: Machine learning-based performance predictions
5. **Mobile App**: Native mobile version for field officers