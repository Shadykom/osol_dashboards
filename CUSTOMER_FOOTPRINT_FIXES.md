# Customer Footprint Dashboard Fixes

## Overview
Fixed the customer footprint page (`/customer-footprint`) to properly fetch data from the database and implement working filters and search functionality.

## Changes Made

### 1. Database Connection Setup
- Created `.env` file with the provided Supabase credentials:
  - `VITE_SUPABASE_URL=https://bzlenegoilnswsbanxgb.supabase.co`
  - `VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - `VITE_PUBLISHABLE_KEY=sb_publishable_w-hMrq27oCaHRTodfQnd2Q_QE_GnmFZ`

### 2. Customer Search Functionality
Updated `customerFootprintService.js` to:
- Search customers by multiple criteria:
  - Customer ID (exact match)
  - Customer name (first, middle, last, or full name)
  - National ID/Tax ID
  - Email
  - Mobile number (searches in customer_contacts table)
- Handle the kastle_banking schema properly
- Fixed foreign key relationships for customer_contacts table

### 3. Filter Implementation
- **Branch Filter**: Now fetches branches dynamically from the database
- **Risk Category Filter**: Maps filter values to database values (LOW, MEDIUM, HIGH)
- **Product Type Filter**: Ready for implementation when product data is available
- **Date Range Filter**: UI is ready, implementation pending based on requirements

### 4. Customer Data Display
- Properly displays customer information including:
  - Full name (constructed from first, middle, last names)
  - Customer ID
  - Contact information from customer_contacts table
  - Branch information
  - Risk category
  - Customer segment

### 5. Database Schema Handling
- All queries now use the `kastle_banking` schema
- Fixed relationship specifications for joined tables
- Properly handles the customer_contacts foreign key relationship

## How to Use

1. **Search for Customers**:
   - Enter customer name, customer ID, national ID, or mobile number in the search box
   - Press Enter or click the Search button
   - Results will show matching customers

2. **Apply Filters**:
   - Select a branch from the dropdown (dynamically loaded from database)
   - Choose risk category (Low, Medium, High)
   - Filters are applied automatically when searching

3. **View Customer Details**:
   - Click on any customer from the search results
   - Full customer footprint will be displayed including:
     - Profile information
     - Products and accounts
     - Interaction history
     - Payment behavior
     - Risk assessment
     - Engagement metrics

## Technical Details

### Database Tables Used
- `kastle_banking.customers` - Main customer information
- `kastle_banking.customer_contacts` - Phone numbers and other contact details
- `kastle_banking.branches` - Branch information
- `kastle_banking.accounts` - Customer accounts
- `kastle_banking.loan_accounts` - Customer loans
- `kastle_banking.collection_officers` - Relationship managers

### Key Files Modified
1. `/workspace/src/services/customerFootprintService.js` - Service layer for data fetching
2. `/workspace/src/components/dashboard/CustomerFootprintDashboard.jsx` - UI component
3. `/workspace/.env` - Environment configuration

## Notes
- The search is case-insensitive for text fields
- Mobile number search supports partial matching
- Customer ID search requires exact match
- All data is fetched from the live Supabase database
- Mock data is still used for some metrics (will be replaced as more data becomes available)