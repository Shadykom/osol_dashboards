# Disable Seeding Guide

## Problem
The application attempts to seed sample data on startup, which can cause duplicate key errors if the data already exists in the database.

## Solution Applied

### 1. Modified Seeding Logic
Updated `/src/utils/fixDashboardAuth.js` to:
- Check if branches already exist before attempting to insert
- Skip seeding if critical data (branches, customers, accounts) already exists
- Handle errors gracefully by fetching existing data instead of failing

### 2. Added Skip Seeding Option
The `fixDashboard()` function now accepts options:
```javascript
// Skip seeding programmatically
await fixDashboard({ skipSeeding: true });
```

### 3. Environment Variable Support
You can disable seeding globally by setting an environment variable:
```bash
VITE_DISABLE_SEEDING=true
```

Add this to your `.env` file:
```
VITE_DISABLE_SEEDING=true
```

### 4. Dashboard Component Updates
The Dashboard component now:
- Retries with `skipSeeding: true` if the initial attempt fails
- Uses `skipSeeding: true` when fixing authentication after API errors

## How to Disable Seeding

### Option 1: Environment Variable (Recommended)
1. Create a `.env` file in the project root if it doesn't exist
2. Add: `VITE_DISABLE_SEEDING=true`
3. Restart the development server

### Option 2: Remove Seeding Call
If you want to completely remove seeding, you can comment out the seeding logic in `/src/utils/fixDashboardAuth.js`:

```javascript
// Step 2: Seed sample data if needed (only if authenticated and not skipped)
// Comment out this block to disable seeding
/*
if (!skipSeeding) {
  const seedSuccess = await seedDashboardData();
  if (!seedSuccess) {
    console.error('Failed to seed data');
  }
} else {
  console.log('Skipping data seeding as requested');
}
*/
```

## Error Prevention
The updated code prevents the duplicate key error by:
1. Checking if branches exist before inserting
2. Using `insert` instead of `upsert` to avoid conflicts
3. Fetching existing data if insertion fails
4. Gracefully handling all errors without breaking the application

## Summary
The seeding error has been fixed by making the seeding process more intelligent and providing multiple ways to disable it when not needed.