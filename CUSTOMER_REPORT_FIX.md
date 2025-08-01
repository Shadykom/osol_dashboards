# Customer Report Database Error Fix

## Issue
The report generation was failing with the error: `column customers.phone does not exist`

## Root Cause
The `customers` table in the `kastle_banking` schema doesn't have `phone` or `email` columns. Instead, customer contact information is stored in a separate `customer_contacts` table with the following structure:

- `contact_type`: Can be 'MOBILE', 'HOME', 'WORK', 'EMAIL', or 'FAX'
- `contact_value`: The actual contact value (phone number or email address)
- `is_primary`: Boolean flag indicating if this is the primary contact

## Solution
Updated the customer report service (`/workspace/src/services/reports/customerReportService.js`) to:

1. **Modified the query** to include a left join with `customer_contacts`:
   ```javascript
   customer_contacts!left(
     contact_type,
     contact_value,
     is_primary
   )
   ```

2. **Updated the data mapping** to extract phone and email from the contacts array:
   ```javascript
   const emailContact = c.customer_contacts?.find(contact => 
     contact.contact_type === 'EMAIL' && contact.is_primary
   ) || c.customer_contacts?.find(contact => contact.contact_type === 'EMAIL');
   
   const phoneContact = c.customer_contacts?.find(contact => 
     (contact.contact_type === 'MOBILE' || contact.contact_type === 'WORK' || contact.contact_type === 'HOME') && contact.is_primary
   ) || c.customer_contacts?.find(contact => 
     contact.contact_type === 'MOBILE' || contact.contact_type === 'WORK' || contact.contact_type === 'HOME'
   );
   ```

3. **Added fallback values** to handle cases where no contact information is found:
   ```javascript
   email: emailContact?.contact_value || 'N/A',
   phone: phoneContact?.contact_value || 'N/A',
   ```

## Impact
- The report generation should now work correctly
- Customer phone and email information will be properly displayed in reports
- The solution prioritizes primary contacts but falls back to any available contact if no primary is set

## Related Tables
- `kastle_banking.customers` - Main customer information
- `kastle_banking.customer_contacts` - Customer contact details (phone, email, etc.)