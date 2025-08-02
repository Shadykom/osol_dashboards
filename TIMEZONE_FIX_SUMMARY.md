# Timezone Fix for Reports Module

## Problem
The error "time zone 'gmt+0300' not recognized" was occurring when generating reports. PostgreSQL doesn't recognize the timezone format "gmt+0300".

## Root Cause
The browser or some part of the application was sending dates with timezone format "gmt+0300" which PostgreSQL doesn't understand. PostgreSQL expects formats like:
- `UTC+3` or `UTC-3`
- `+03:00` or `-03:00`
- Named timezones like `Asia/Riyadh`
- ISO 8601 format with timezone

## Solution Implemented

### 1. Created Date Formatting Utilities (`src/utils/dateHelpers.js`)
- `formatDateForDB()`: Converts any date to ISO 8601 format that PostgreSQL accepts
- `formatDateRangeForDB()`: Formats date ranges for database queries
- Automatically detects and fixes invalid timezone formats like "gmt+0300"

### 2. Updated Comprehensive Report Service
- Modified all report data methods to use the date formatting utilities
- Ensures all dates are properly formatted before being sent to the database

### 3. Added Supabase Request Interceptor
- Updated `customFetch` in `src/lib/supabase.js` to intercept all requests
- Automatically fixes timezone formats in:
  - URL parameters
  - Request body (recursively fixes all date fields)
- Converts invalid formats to ISO 8601 format

## How It Works

1. When a date with format "gmt+0300" is detected:
   - Extract the sign and offset (e.g., "+0300")
   - Convert to proper format (e.g., "+03:00")
   - Parse the date and convert to ISO 8601 format

2. The fix is applied at multiple levels:
   - Service layer: Before sending queries to the database
   - HTTP layer: In the Supabase client's custom fetch function
   - Ensures no invalid timezone format reaches PostgreSQL

## Testing
Run the test script to verify the fix:
```bash
node test_timezone_fix.js
```

## Impact
- All report generation should now work without timezone errors
- The fix is transparent to the rest of the application
- No changes needed in UI components or other services

## Future Considerations
- Consider standardizing all date handling to use UTC internally
- Add validation on the frontend to ensure dates are in proper format
- Consider using a date library like date-fns consistently throughout the application