# Specialist Report Implementation Guide

## Overview
This document describes the implementation of real database connectivity for the SpecialistLevelReport and SpecialistReport components.

## Changes Made

### 1. Service Layer Updates

#### `src/services/specialistReportService.js`
- Updated to use real database tables from `kastle_collection` and `kastle_banking` schemas
- Implemented methods to fetch data from actual tables:
  - `collection_officers` - for specialist information
  - `collection_cases` - for loan assignments
  - `collection_interactions` - for communication history
  - `promise_to_pay` - for payment promises
  - `officer_performance_metrics` - for performance data

Key methods updated:
- `getSpecialists()` - Fetches active collection officers
- `getSpecialistLoans()` - Retrieves cases assigned to a specialist
- `getCommunicationData()` - Aggregates interaction data by day
- `getPromisesToPay()` - Fetches payment promises with status
- `calculateKPIs()` - Computes key performance indicators
- `calculatePerformanceMetrics()` - Calculates performance scores

### 2. Component Updates

#### `src/pages/SpecialistLevelReport.jsx`
- Removed mock CollectionService
- Integrated real SpecialistReportService
- Updated to handle real data structures from the database

#### `src/pages/SpecialistReport.jsx`
- Updated to use SpecialistReportService instead of CollectionService
- Modified table structures to match the new data format

### 3. Database Schema

Created `create_specialist_report_views.sql` which includes:

#### New Tables:
- `kastle_collection.collection_cases` - Manages loan cases assigned to specialists
- `kastle_collection.collection_buckets` - Defines delinquency buckets
- `kastle_collection.promise_to_pay` - Tracks payment promises
- `kastle_collection.officer_performance_metrics` - Stores daily performance metrics

#### New View:
- `kastle_collection.specialist_performance_summary` - Aggregated performance view

#### Sample Data:
- 50 collection cases distributed among 3 specialists
- 200 interaction records
- 30 promise to pay records

## Database Structure

### Collection Cases
```sql
collection_cases
├── case_id (PK)
├── case_number (unique)
├── customer_id (FK)
├── loan_account_number (FK)
├── assigned_to (FK to officer_id)
├── priority
├── case_status
├── dpd (days past due)
└── financial details...
```

### Collection Officers
```sql
collection_officers
├── officer_id (PK)
├── officer_name
├── officer_type
├── team_id (FK)
├── contact details...
└── status
```

### Promise to Pay
```sql
promise_to_pay
├── ptp_id (PK)
├── case_id (FK)
├── officer_id (FK)
├── ptp_date
├── ptp_amount
└── status (PENDING/KEPT/BROKEN/PARTIAL)
```

## API Response Format

The service returns data in the following structure:

```javascript
{
  success: true,
  data: {
    specialist: { /* officer details */ },
    kpis: { /* key performance indicators */ },
    loans: [ /* array of loan/case details */ ],
    communicationData: [ /* daily communication stats */ ],
    promisesToPay: [ /* array of promises */ ],
    performance: { /* performance metrics */ },
    trends: [ /* 30-day trend data */ ],
    customerSegments: [ /* customer categorization */ ],
    riskAnalysis: { /* risk distribution and factors */ },
    timeline: [ /* recent activities */ ]
  },
  error: null
}
```

## Data Transformation

The service transforms database records to frontend-friendly format:

### Loan Data
```javascript
Database → Frontend
loan_account_number → loanNumber
kastle_banking.customers.full_name → customerName
kastle_banking.loan_accounts.overdue_amount → totalOverdueAmount
```

### Promise to Pay
```javascript
Database → Frontend
ptp_date → ptpDate
ptp_amount → ptpAmount
status mapping: PENDING → ACTIVE
```

## Error Handling

- Service methods include try-catch blocks
- Falls back to mock data if database queries fail
- Returns structured error responses
- Components display user-friendly error messages in Arabic

## Performance Optimizations

1. **Indexes Created:**
   - `assigned_to` on collection_cases
   - `officer_id` on interactions and promises
   - `status` fields for filtering

2. **Query Optimization:**
   - Limited results (500 loans max)
   - Joined queries to reduce round trips
   - Date range filtering to limit data

3. **Data Aggregation:**
   - Daily communication stats computed in service
   - Performance metrics cached when available

## Setup Instructions

1. **Run the SQL script:**
   ```bash
   psql -d your_database -f create_specialist_report_views.sql
   ```

2. **Verify tables exist:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'kastle_collection';
   ```

3. **Check sample data:**
   ```sql
   SELECT COUNT(*) FROM kastle_collection.collection_cases;
   SELECT COUNT(*) FROM kastle_collection.collection_officers;
   ```

## Testing

1. **Test data fetching:**
   - Navigate to Specialist Level Report page
   - Select a specialist from dropdown
   - Verify data loads without errors

2. **Test filtering:**
   - Change date range filter
   - Filter by loan status
   - Apply delinquency bucket filter

3. **Test interactions:**
   - Check communication charts
   - Verify promise to pay table
   - Review performance metrics

## Troubleshooting

### Common Issues:

1. **"No specialists found"**
   - Check if collection_officers table has data
   - Verify officers have status = 'ACTIVE'

2. **Empty loan list**
   - Check collection_cases table
   - Verify assigned_to matches officer_id

3. **Missing communication data**
   - Check collection_interactions table
   - Verify date ranges in queries

### Debug Queries:

```sql
-- Check active officers
SELECT * FROM kastle_collection.collection_officers WHERE status = 'ACTIVE';

-- Check case assignments
SELECT assigned_to, COUNT(*) 
FROM kastle_collection.collection_cases 
GROUP BY assigned_to;

-- Check recent interactions
SELECT officer_id, COUNT(*), MAX(interaction_datetime) 
FROM kastle_collection.collection_interactions 
GROUP BY officer_id;
```

## Future Enhancements

1. **Real-time Updates:**
   - Implement WebSocket connections for live data
   - Add real-time notifications for new assignments

2. **Advanced Analytics:**
   - Machine learning predictions for collection probability
   - Behavioral analysis for customer segments

3. **Integration Points:**
   - SMS/Email gateway integration
   - Auto-dialer system connection
   - Payment gateway webhooks

4. **Performance Improvements:**
   - Materialized views for complex aggregations
   - Redis caching for frequently accessed data
   - Pagination for large datasets