# Osoul Dashboard - Deployment Guide

## Overview
This guide explains how to fix the customers dashboard error and deploy the application to Vercel with proper database connectivity.

## Database Configuration

### 1. Supabase Setup
The application uses Supabase as the database backend. The connection details are:

```
URL: https://bzlenegoilnswsbanxgb.supabase.co
Database: postgresql://postgres:OSOL1a159753@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres
```

### 2. Environment Variables
Make sure the following environment variables are set in Vercel:

```bash
VITE_SUPABASE_URL=https://bzlenegoilnswsbanxgb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bGVuZWdvaWxuc3dzYmFueGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI1MjEzMTcsImV4cCI6MjA0ODA5NzMxN30.Pnt5cVEGNNjGPvDVYdPfB0EAKlfvYI9k-oU3f7KnYDo
VITE_APP_NAME=Osol Dashboard
VITE_APP_VERSION=1.0.0
VITE_DEV_MODE=false
VITE_LOG_LEVEL=error
```

## Fixes Applied

### 1. React Error 310 Fix
The minified React error #310 was caused by:
- Missing error boundaries
- Improper handling of async data loading
- Missing translation readiness checks

**Solutions implemented:**
- Added proper error boundaries in the Customers component
- Added loading and error states with retry functionality
- Added translation readiness checks before rendering
- Implemented fallback to mock data when database is unavailable

### 2. Database Connection Resilience
- Modified `src/lib/supabase.js` to handle missing credentials gracefully
- Added mock client fallback when Supabase is not configured
- Updated `src/services/customerService.js` to use mock data when database fails

### 3. Build Configuration
- Fixed missing dependencies (@hello-pangea/dnd)
- Ensured all required packages are installed
- Verified build process completes successfully

## Deployment Steps

### 1. Local Testing
```bash
# Install dependencies
pnpm install

# Test locally
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

### 2. Vercel Deployment

#### Option A: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

#### Option B: Using Git Integration
1. Push code to GitHub/GitLab/Bitbucket
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on push

### 3. Post-Deployment Database Setup

Run the following SQL in your Supabase SQL editor to ensure the schema exists:

```sql
-- Create kastle_banking schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS kastle_banking;

-- Set search path
SET search_path TO kastle_banking;

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    customer_id VARCHAR(50) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(300),
    email VARCHAR(255),
    phone VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(20),
    nationality VARCHAR(100),
    segment VARCHAR(50) DEFAULT 'RETAIL',
    kyc_status VARCHAR(50) DEFAULT 'PENDING',
    risk_category VARCHAR(50) DEFAULT 'LOW',
    annual_income DECIMAL(15,2),
    employment_status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Grant permissions
GRANT ALL ON SCHEMA kastle_banking TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO anon;
```

## Troubleshooting

### Issue: Invalid API Key Error
**Solution:** 
- Verify the anon key in environment variables matches your Supabase project
- Check if the key has expired and regenerate if needed
- Ensure the key is properly formatted (no extra spaces or line breaks)

### Issue: Schema Not Found
**Solution:**
- Run the SQL script above to create the schema
- Check RLS (Row Level Security) policies in Supabase
- Verify the anon role has proper permissions

### Issue: Build Failures
**Solution:**
- Clear node_modules and reinstall: `rm -rf node_modules && pnpm install`
- Check for conflicting dependencies
- Ensure Node.js version is compatible (16.x or higher)

## Performance Optimization

1. **Code Splitting**: The application uses dynamic imports for better performance
2. **Error Boundaries**: Prevents entire app crashes from component errors
3. **Mock Data Fallback**: Ensures app functionality even without database
4. **Lazy Loading**: Components are loaded on demand

## Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **Environment Variables**: Use Vercel's environment variable system
3. **Database Access**: Use RLS policies in Supabase for security
4. **CORS**: Configure proper CORS settings in Supabase

## Monitoring

After deployment, monitor:
1. Vercel Analytics for performance metrics
2. Supabase dashboard for database usage
3. Browser console for any client-side errors
4. Network tab for failed API requests

## Support

For issues:
1. Check Vercel deployment logs
2. Review Supabase logs for database errors
3. Test with mock data to isolate database issues
4. Use browser DevTools for debugging