# Collection Reports User Stories

## Overview
This document outlines three key user stories for enhancing the collection reporting capabilities in the OSOL system. These stories focus on providing comprehensive dashboards for different stakeholder levels while ensuring compliance with SAMA regulations.

---

## User Story 1: Branch Performance Overview

### User Story
**As a** Regional Manager,  
**I want** a "Branch Level Report" dashboard,  
**So that** I can quickly compare the collection performance across all branches, identify underperforming branches that need support, and acknowledge top-performing branches.

### Acceptance Criteria (شروط القبول)

1. **Data Refresh Frequency**
   - The dashboard must display data on a weekly or end-of-day basis
   - Users should be able to toggle between weekly and daily views
   - Data refresh timestamp must be clearly visible

2. **Key Performance Indicators (KPIs)**
   Each branch must display the following metrics:
   - Total overdue portfolio value (SAR)
   - Arrears-to-total portfolio ratio (%)
   - Number of overdue loans
   - Overall collection rate (%)
   - Branch ranking position

3. **Arrears Aging Analysis**
   - Chart showing distribution of arrears by aging buckets:
     - 1-30 days
     - 31-60 days
     - 61-90 days
     - 90+ days
   - Visual representation (bar chart or pie chart)
   - Drill-down capability to see loan details in each bucket

4. **Comparison Features**
   - Ranking view to compare branches against each other
   - Comparison against company average performance
   - Ability to filter by region or branch type
   - Export functionality for reports

5. **Collection Specialist Performance**
   - List of best-performing collection specialists within each branch
   - List of worst-performing collection specialists within each branch
   - Performance based on collection rates
   - Ability to drill down to individual specialist details

### Technical Implementation Notes
- Component: `/src/components/dashboard/BranchLevelReport.jsx`
- Route: `/collection/branch-report`
- Data Sources: 
  - `kastle_banking.branches`
  - `kastle_banking.branch_collection_performance`
  - `kastle_banking.collection_officers`
  - `kastle_banking.collection_cases`

---

## User Story 2: Product Risk Analysis

### User Story
**As a** Product Manager or Risk Analyst,  
**I want** a "Product Level Report" dashboard,  
**So that** I can evaluate the risk and collection performance associated with each financing product to make data-driven decisions on lending policies and collection strategies.

### Acceptance Criteria (شروط القبول)

1. **Product Filtering**
   - Filter to select and analyze specific financing products:
     - Auto finance
     - Personal loans
     - Credit cards
     - Home finance
     - SME loans
   - Multi-select capability for comparison
   - Save filter preferences

2. **Product-Level Metrics**
   For each selected product, display:
   - Total overdue portfolio value (SAR)
   - Arrears-to-total portfolio ratio (%)
   - Number of overdue loans
   - Collection rate (%)
   - Average days overdue
   - Total number of overdue customers
   - Risk score/rating

3. **Comparative Analysis**
   - Chart comparing arrears distribution by aging buckets across products
   - Side-by-side product comparison view
   - Trend analysis over time (3, 6, 12 months)
   - Benchmarking against industry standards

4. **Compliance Requirements**
   - All analytics must comply with SAMA regulations
   - Data privacy controls in place
   - Audit trail for all data access
   - Masked customer information where required

### Technical Implementation Notes
- Component: `/src/components/dashboard/ProductLevelReport.jsx`
- Route: `/collection/product-report`
- Data Sources:
  - `kastle_banking.products`
  - `kastle_banking.loan_accounts`
  - `kastle_banking.collection_cases`
  - `kastle_banking.collection_rates`

---

## User Story 3: Specialist-Level Communication Tracking

### User Story
**As a** Collection Team Lead,  
**I want** to see the detailed communication activities of each collection specialist in their performance report,  
**So that** I can ensure they are making sufficient contact efforts, verify the outcomes of these communications, and track promises to pay effectively.

### Acceptance Criteria (شروط القبول)

1. **Monthly Communication Log**
   - Dedicated section for "Monthly Communication Log" per customer
   - Filterable by date range (current month default)
   - Searchable by customer name/ID
   - Export functionality for reports

2. **Communication Metrics**
   For each customer, display:
   - Total calls made this month
   - Total SMS/messages sent this month
   - Email communications count
   - Field visit attempts
   - Digital collection attempts

3. **Call Outcome Tracking**
   For each communication attempt, specialists must log:
   - Communication type (Call/SMS/Email/Visit)
   - Date and time of attempt
   - Duration (for calls)
   - Outcome options:
     - "No Answer"
     - "Customer Disputed"
     - "Promise to Pay"
     - "Partial Payment Agreed"
     - "Requested Call Back"
     - "Wrong Number"
     - "Customer Unavailable"
     - "Payment Made"

4. **Promise to Pay Management**
   When outcome is "Promise to Pay":
   - Capture promised amount (SAR)
   - Capture promised date
   - Automatic reminder generation
   - Track fulfillment rate
   - Flag overdue promises
   - Historical promise tracking

5. **Compliance and Guidelines**
   - Adhere to SAMA guidelines for customer contact
   - Maximum contact attempts per day/week limits
   - Prohibited contact hours enforcement
   - Fair and transparent collection practices
   - Data handling compliance

### Technical Implementation Notes
- Component: `/src/pages/SpecialistReport.jsx`
- Route: `/collection/specialist-report`
- Data Sources:
  - `kastle_banking.collection_officers`
  - `kastle_banking.collection_interactions`
  - `kastle_banking.collection_contact_attempts`
  - `kastle_banking.promise_to_pay`
  - `kastle_banking.collection_call_records`

---

## Common Requirements Across All User Stories

### Performance Requirements
- Dashboard load time < 3 seconds
- Real-time data updates where applicable
- Responsive design for tablet and desktop
- Offline capability for viewing cached data

### Security Requirements
- Role-based access control (RBAC)
- Data encryption in transit and at rest
- Session timeout after 15 minutes of inactivity
- Audit logging for all data access

### User Experience Requirements
- Arabic and English language support
- RTL layout support for Arabic
- Intuitive navigation
- Contextual help/tooltips
- Print-friendly views

### Integration Requirements
- Integration with existing OSOL banking system
- API endpoints for data retrieval
- Webhook support for real-time updates
- Export to Excel/PDF formats

### SAMA Compliance Requirements
- Customer data privacy protection
- Collection practice guidelines adherence
- Reporting standards compliance
- Audit trail maintenance
- Data retention policies

---

## Development Priority
1. **Phase 1**: User Story 1 - Branch Performance Overview
2. **Phase 2**: User Story 2 - Product Risk Analysis  
3. **Phase 3**: User Story 3 - Specialist Communication Tracking

## Success Metrics
- Reduction in time to identify underperforming branches by 50%
- Improvement in collection rates by 15% within 6 months
- Increase in promise-to-pay fulfillment rate by 20%
- 100% compliance with SAMA regulations
- User satisfaction score > 4.5/5

---

## Notes
- All monetary values should be displayed in SAR with proper formatting
- Dates should follow the format: DD/MM/YYYY
- Percentages should be shown with 2 decimal places
- All charts should be interactive with hover details
- Mobile responsiveness is not required for Phase 1 but should be considered for future phases