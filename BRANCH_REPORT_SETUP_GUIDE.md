# Branch Report Setup Guide

This guide explains how to set up and use the Branch Report functionality in the OSOL Dashboard.

## Overview

The Branch Report page (`/collection/branch-report`) provides comprehensive analytics and performance metrics for branch-level collection operations. It includes:

- Branch performance summary with key metrics
- Detailed branch views with collection trends
- Officer performance tracking
- Real-time updates
- Advanced filtering and comparison features

## Database Setup

### 1. Run the Setup Script

To set up the branch report functionality, run the following SQL scripts in order:

```bash
# From the Supabase SQL editor or psql:
\i create_branch_report_views.sql
\i insert_sample_branch_performance.sql
```

Or use the complete setup script:

```bash
\i setup_branch_report_complete.sql
```

### 2. Database Structure

The branch report uses the following main tables:
- `kastle_banking.branches` - Branch master data
- `kastle_banking.branch_collection_performance` - Daily performance metrics
- `kastle_banking.collection_officers` - Officer information
- `kastle_banking.officer_performance_summary` - Officer performance data

### 3. Views Created

The setup creates several views for optimized data access:
- `branch_summary_view` - Latest performance data with officer counts
- `branch_performance_history_view` - Historical performance data
- `branch_collection_trends` - Collection trends with rolling aggregates
- `branch_officer_performance` - Officer performance by branch
- `branch_comparison_data` - Materialized view for comparisons

## Features

### 1. Summary View
- Total branches, collection amounts, and performance scores
- Real-time connection status
- Export to PDF/Excel

### 2. Filters
- **Date Range**: Today, Yesterday, Last 7 days, Current month, Last month, Custom
- **Region**: Central, Eastern, Western, Northern, Southern
- **Branch Type**: HEAD_OFFICE, MAIN, SUB, RURAL, URBAN
- **Performance Level**: Excellent (90%+), Good (70-89%), Average (50-69%), Poor (<50%)
- **Product Type**: Personal, Auto, Mortgage, Credit Card
- **Delinquency Bucket**: Current, 1-30, 31-60, 61-90, 90+ days
- **Customer Segment**: Retail, SME, Corporate, VIP

### 3. View Modes
- **Summary**: Branch list with key metrics and performance indicators
- **Detailed**: Performance charts, distribution analysis, and trends
- **Comparison**: Compare up to 5 branches side-by-side

### 4. Branch Detail Page
Navigate to `/collection/branch-report/{branchId}` for detailed branch information:
- Overview with branch information and collection summary
- Performance trends and KPIs
- Officer list with individual performance metrics
- Analytics with product distribution and collection methods

## Real-time Updates

The branch report supports real-time updates through Supabase's real-time functionality:
- Automatic updates when branch performance data changes
- Visual indicator showing connection status
- Reconnection with exponential backoff

## Data Consistency

### Performance Score Calculation
Performance scores are calculated based on collection rate:
- 90%+ collection rate = 95 score (Excellent)
- 80-89% = 85 score (Good)
- 70-79% = 75 score (Good)
- 60-69% = 65 score (Average)
- 50-59% = 55 score (Average)
- Below 50% = 45 score (Poor)

### Data Aggregation
- Daily collection data is aggregated for week, month, and year views
- Officer counts include only active officers
- Trends use rolling window calculations

## Troubleshooting

### No Data Showing
1. Ensure the SQL scripts have been run successfully
2. Check that branches have proper region values (state field)
3. Verify branch_collection_performance table has recent data

### Filters Not Working
1. Region filter uses capitalized values (e.g., "Central" not "central")
2. Branch type uses uppercase enum values (e.g., "MAIN" not "main")
3. Date filters require performance_date entries in the specified range

### Real-time Not Working
1. Check that branch_collection_performance table is added to supabase_realtime publication
2. Verify WebSocket connection in browser developer tools
3. Check for any console errors related to Supabase channels

## API Endpoints Used

The branch report uses the following Supabase tables/views:
- `branch_summary_view` - Main summary data
- `branch_collection_trends` - Period collection data
- `branch_officer_performance` - Officer performance data
- `branch_performance_history_view` - Historical trends

## Performance Optimization

1. Uses database views to reduce query complexity
2. Materialized view for comparison data (refresh daily)
3. Indexes on key fields (branch_id, performance_date)
4. Pagination and limit queries to improve load times

## Future Enhancements

1. Add more granular product-level filtering
2. Implement predictive analytics
3. Add email scheduling for reports
4. Include geographical visualization
5. Add benchmarking against industry standards