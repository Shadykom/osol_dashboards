# Osol Dashboard Routes Summary

## Main Routes

- `/` - Redirects to `/dashboard`
- `/dashboard` - Main dashboard page

## Dashboard Routes

- `/dashboards/custom` - Custom dashboard
- `/dashboards/executive` - Executive dashboard
- `/dashboards/operations` - Operations dashboard

## Customer Routes

- `/customers` - Customers list
- `/customers/new` - New customer form
- `/customers/kyc-pending` - KYC pending customers
- `/customers/risk` - Risk customers

## Account Routes

- `/accounts` - Accounts list
- `/accounts/new` - New account form

## Transaction Routes

- `/transactions` - Transactions list
- `/transactions/pending` - Pending transactions
- `/transactions/failed` - Failed transactions

## Loan Routes

- `/loans` - Loans list
- `/loans/applications` - Loan applications
- `/loans/disbursed` - Disbursed loans
- `/loans/overdue` - Overdue loans

## Other Main Routes

- `/reports` - Reports page
- `/analytics` - Analytics page
- `/compliance` - Compliance page

## Collection Routes

- `/collection` - Redirects to `/collection/overview`
- `/collection/overview` - Collection overview dashboard
- `/collection/cases` - Collection cases
- `/collection/reports` - Collection reports
- `/collection/daily` - Daily collection dashboard
- `/collection/digital` - Digital collection dashboard
- `/collection/early-warning` - Early warning dashboard
- `/collection/executive` - Executive collection dashboard
- `/collection/field` - Field collection dashboard
- `/collection/officer-performance` - Officer performance dashboard
- `/collection/sharia-compliance` - Sharia compliance dashboard
- `/collection/vintage-analysis` - Vintage analysis dashboard

## Technical Notes

All routes use client-side routing with React Router v6. The application is a Single Page Application (SPA) where all routes are handled by the client-side JavaScript. The Vercel configuration uses a rewrite rule to serve `index.html` for all routes, allowing React Router to handle the routing.

## Route Configuration

Routes are defined in `src/App.jsx` using React Router's `<Routes>` component. Each route maps to a specific component imported from the `pages` directory.