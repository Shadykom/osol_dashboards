# Customer Query Fixes Summary

## Issue
The application was querying for columns that don't exist in the customers table:
- Querying for `customer_status` but the table uses `is_active` (boolean)
- Querying for `segment` but the table uses `customer_segment`

## Fixes Applied

### 1. Dashboard.jsx
- Changed `.eq('customer_status', 'ACTIVE')` to `.eq('is_active', true)` in 3 locations
- Changed `.select('customer_type, segment')` to `.select('customer_type, customer_segment')`
- Updated data processing to use `customer.customer_segment` instead of `customer.segment`

### 2. customerService.js
- Updated filter to use `customer.customer_segment` instead of `customer.segment`
- Updated analytics aggregation to use `customer.customer_segment`

### 3. Customers.jsx
- Updated display to use `customer.customer_segment` instead of `customer.segment` in 2 locations

## Database Schema Reference
The actual customers table has these columns for status and segmentation:
- `is_active` (boolean) - Whether the customer is active
- `kyc_status` (varchar) - KYC verification status ('PENDING', etc.)
- `customer_segment` (varchar) - Customer segment ('RETAIL', 'PREMIUM', 'HNI', 'CORPORATE', 'SME')

## Result
All 400 Bad Request errors related to customer queries should now be resolved. The application will correctly query:
- Active customers using `is_active = true`
- Customer segments using the `customer_segment` column