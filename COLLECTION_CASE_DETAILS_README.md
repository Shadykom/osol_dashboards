# Collection Case Details Feature

## Overview

The Collection Case Details feature provides a comprehensive view of all information related to collection cases, including complete historical data, interactions, payments, promises to pay, field visits, legal actions, and status changes.

## Features

### 1. Comprehensive Case Overview
- **Customer Information**: Full customer details including contact information, addresses, and demographics
- **Loan Information**: Complete loan details including disbursement, maturity dates, and interest rates
- **Financial Summary**: Detailed breakdown of outstanding amounts (principal, interest, penalties)
- **Collection Summary**: Key metrics including total calls, visits, payments, and collected amounts

### 2. Historical Data Tabs

#### Overview Tab
- Customer information with all contact details and addresses
- Loan information with complete financial breakdown
- Collection performance summary

#### Interactions Tab
- Complete history of all customer interactions
- Call logs, emails, SMS, and visit records
- Interaction outcomes and notes
- Promise to pay details from interactions

#### Payments Tab
- Full payment history with amounts and dates
- Payment methods and reference numbers
- Payment status tracking
- Summary statistics (total payments, amount collected, last payment)

#### Promises Tab
- All promises to pay with amounts and due dates
- Promise status (kept, broken, pending)
- Amount received against promises
- Officer who recorded the promise

#### Field Visits Tab
- Complete field visit history
- Visit outcomes and amounts collected
- Visit addresses and notes
- Photo attachments (if available)

#### Legal Tab
- Legal case information
- Legal action history
- Court details and hearing dates
- Current legal status

#### History Tab
- Complete timeline of all events
- Status change history
- Assignment history
- Comprehensive activity timeline

### 3. Navigation Features
- Quick view modal in the cases list for basic information
- Full details button to navigate to comprehensive view
- Back navigation to cases list
- RTL support for Arabic interface

## Technical Implementation

### Components

1. **CollectionCaseDetails.jsx**
   - Main component for detailed case view
   - Located at: `/workspace/src/pages/CollectionCaseDetails.jsx`
   - Features:
     - Responsive design with mobile support
     - RTL support for Arabic
     - Tab-based interface for organized information
     - Real-time data loading

2. **CollectionService.js Updates**
   - New methods added:
     - `getCaseInteractions()` - Fetch interaction history
     - `getCasePayments()` - Fetch payment history
     - `getCaseFieldVisits()` - Fetch field visit records
     - `getCaseLegalActions()` - Fetch legal action history
     - `getCaseStatusHistory()` - Fetch status changes
     - `getCaseAssignmentHistory()` - Fetch assignment changes

### Database Schema

New tables created for historical data:

1. **collection_payments**
   - Stores all payment records for collection cases
   - Fields: payment_id, case_id, amount, payment_date, payment_method, etc.

2. **field_visits**
   - Records of all field visits
   - Fields: visit_id, case_id, officer_id, visit_date, visit_status, amount_collected, etc.

3. **legal_actions**
   - Legal action history
   - Fields: action_id, case_id, action_type, action_date, status, description, etc.

4. **case_status_history**
   - Tracks all status changes
   - Fields: history_id, case_id, from_status, to_status, changed_at, changed_by, reason

5. **case_assignment_history**
   - Records of case assignments
   - Fields: assignment_id, case_id, officer_id, assigned_at, assigned_by, reason

### Routes

- List view: `/collection/cases`
- Detail view: `/collection/cases/:caseId`

## Usage

### Accessing Case Details

1. Navigate to Collection Cases from the sidebar menu
2. In the cases list, you have two options:
   - Click the eye icon for a quick view modal
   - Click the document icon to open full case details

### Viewing Historical Data

1. Once in the detailed view, use the tabs to navigate between different data sections
2. Each tab shows complete historical information
3. The History tab provides a unified timeline of all activities

### Key Information Displayed

- **Header**: Case number, status, priority, and key metrics
- **Overview**: Customer and loan information
- **Interactions**: All communication history with outcomes
- **Payments**: Complete payment trail with amounts and methods
- **Promises**: Promise to pay tracking with fulfillment status
- **Visits**: Field visit records with collection amounts
- **Legal**: Legal proceedings and action history
- **History**: Complete chronological timeline

## Translations

The feature supports both English and Arabic with complete translations for:
- All labels and headers
- Status types and priorities
- Tab names and section titles
- Action buttons and messages
- Empty state messages

## Security

- Row Level Security (RLS) enabled on all historical tables
- Read access policies implemented
- Secure data fetching through Supabase client

## Performance Optimizations

- Indexed columns for faster queries
- Parallel data loading for historical information
- Pagination support in the main cases list
- Efficient data formatting in the service layer

## Future Enhancements

1. Export functionality for case details
2. Print-friendly view
3. Document attachments viewer
4. Advanced filtering in historical tabs
5. Case comparison feature
6. Automated case scoring based on history
7. Predictive analytics integration

## Database Setup

To set up the required tables, run the SQL script:

```bash
psql -U your_username -d your_database -f create_collection_history_tables.sql
```

This will create all necessary tables and indexes for storing historical collection case data.

## Testing

The SQL script includes commented sample data generation. Uncomment and run to create test data for development and testing purposes.