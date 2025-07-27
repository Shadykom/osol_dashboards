# Reports Implementation Documentation

## Overview
I've implemented a comprehensive reports system that fetches data from the database and displays it in the UI. The implementation includes:

1. **Report Service** (`/src/services/reportService.js`)
2. **Updated SpecialistLevelReport Component**
3. **Reusable Report Creation Form Component**

## Key Features

### 1. Report Types
The system supports three main report types:
- **Monthly Performance Report** (تقرير الأداء الشهري)
- **Detailed Portfolio Report** (تقرير المحفظة التفصيلي)
- **Trends Report** (تقرير الاتجاهات)

### 2. Database Integration
The reports fetch data from the following Supabase tables:
- `officer_performance_metrics` - Performance data
- `daily_collection_summary` - Collection data
- `loan_accounts` - Loan information
- `collection_cases` - Collection case details
- `officer_performance_summary` - Historical performance data

### 3. Custom Report Builder
Users can create custom reports by:
- Selecting report type (Performance, Portfolio, Collection, Risk)
- Choosing time period (Daily, Weekly, Monthly, Quarterly, Yearly)
- Selecting content sections to include

## Implementation Details

### Report Service Methods

```javascript
// Fetch monthly performance report
getMonthlyPerformanceReport(filters)

// Fetch detailed portfolio report
getDetailedPortfolioReport(filters)

// Fetch trends report
getTrendsReport(filters)

// Generate custom report
generateCustomReport(config)

// Export report
exportReport(reportData, format)
```

### Component Updates

1. **State Management**
   - Added `reports` state to store fetched report data
   - Added `loadingReports` state for loading indicators
   - Added `customReportConfig` state for custom report configuration

2. **Data Fetching**
   - Reports are fetched when the "reports" view is activated
   - All three report types are fetched in parallel for better performance
   - Real-time data is displayed with proper formatting

3. **User Interface**
   - Loading states with spinner animations
   - Report cards display summary data from the database
   - Download and refresh functionality for each report
   - Custom report builder with form validation

## Database Schema Requirements

Ensure the following tables exist in your Supabase database:

### kastle_collection schema:
- `officer_performance_metrics`
- `daily_collection_summary`
- `officer_performance_summary`
- `collection_officers`
- `collection_teams`

### kastle_banking schema:
- `loan_accounts`
- `customers`
- `collection_cases`

## Environment Setup

Make sure your `.env` file contains:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Usage

1. Navigate to the Specialist Level Report page
2. Select a specialist from the dropdown
3. Click on the "Reports" tab
4. View the three pre-configured reports with real-time data
5. Use the custom report builder to create specialized reports

## Future Enhancements

1. **Export Functionality**: Implement actual PDF/Excel export
2. **Scheduling**: Add report scheduling capabilities
3. **Templates**: Save and reuse custom report configurations
4. **Charts**: Add visual charts to reports
5. **Email Integration**: Send reports via email

## Error Handling

The system includes comprehensive error handling:
- Graceful fallback for missing data
- User-friendly error messages in Arabic
- Console logging for debugging
- Loading states to prevent UI freezing

## Performance Optimizations

- Parallel data fetching for multiple reports
- Conditional data loading (only when view is active)
- Efficient data aggregation methods
- Minimal re-renders through proper state management