# Fix Frontend Date Issue in Collection Overview

The error shows the frontend is querying for date `2025-07-31` which is in the future. This needs to be fixed in the collection service.

## The Issue
The API call is:
```
GET https://bzlenegoilnswsbanxgb.supabase.co/rest/v1/officer_performance_summary?select=*%2Ccollection_officers%21officer_id%28officer_name%2Cofficer_type%2Cteam_id%2Ccollection_teams%28team_name%29%29&summary_date=eq.2025-07-31&order=total_collected.desc&limit=10
```

The date `2025-07-31` is in the future and likely doesn't exist in the database.

## Frontend Fix Required

In your collection service or API calls, update the date logic:

1. Instead of using a future date, use the current date or last day of current month:
```typescript
// Instead of: summary_date=eq.2025-07-31
// Use: 
const currentDate = new Date();
const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
const formattedDate = lastDayOfMonth.toISOString().split('T')[0];
// This gives you the last day of current month
```

2. Or use a date range query:
```typescript
// Query for data less than or equal to today
&summary_date=lte.${new Date().toISOString().split('T')[0]}
```

3. Handle empty responses properly:
```typescript
// In your getCollectionPerformance function
try {
  const response = await supabase
    .from('officer_performance_summary')
    .select(`
      *,
      collection_officers!officer_id(
        officer_name,
        officer_type,
        team_id,
        collection_teams(team_name)
      )
    `)
    .lte('summary_date', new Date().toISOString().split('T')[0])
    .order('total_collected', { ascending: false })
    .limit(10);

  // Check if response is valid
  if (response.error) {
    console.error('API Error:', response.error);
    return [];
  }

  // Ensure data is an array
  return Array.isArray(response.data) ? response.data : [];
} catch (error) {
  console.error('Collection performance error:', error);
  return [];
}
```

## Database Fix

Run the SQL script `fix_collection_api_error.sql` to ensure the tables exist and have sample data.
