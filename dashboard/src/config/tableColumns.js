// Table column definitions
//
// Table column definitions for various widgets.  Each entry defines the
// columns that should be displayed, whether they are sortable, and optional
// rendering functions.  The keys here follow the pattern
// `${section}_${widgetId}` to allow easy lookup.

import { formatCurrency, formatDate } from '../utils/dataFormatters.js';

export const getTableColumns = (section, widgetId) => {
  const columnMap = {
    'overview_total_assets': {
      accounts: [
        { key: 'account_number', title: 'Account Number', sortable: true },
        {
          key: 'customers.customer_name',
          title: 'Customer Name',
          sortable: true
        },
        { key: 'account_type_id', title: 'Account Type', sortable: true },
        {
          key: 'current_balance',
          title: 'Balance',
          sortable: true,
          render: (value) => formatCurrency(value)
        },
        { key: 'branches.branch_name', title: 'Branch', sortable: true },
        { key: 'account_status', title: 'Status', sortable: true },
        {
          key: 'created_at',
          title: 'Created Date',
          sortable: true,
          render: (value) => formatDate(value)
        }
      ],
      loans: [
        { key: 'loan_account_number', title: 'Loan Number', sortable: true },
        { key: 'products.product_name', title: 'Product', sortable: true },
        {
          key: 'loan_amount',
          title: 'Loan Amount',
          sortable: true,
          render: (value) => formatCurrency(value)
        },
        {
          key: 'outstanding_balance',
          title: 'Outstanding',
          sortable: true,
          render: (value) => formatCurrency(value)
        },
        { key: 'loan_status', title: 'Status', sortable: true },
        {
          key: 'created_at',
          title: 'Created Date',
          sortable: true,
          render: (value) => formatDate(value)
        }
      ]
    },
    'banking_active_accounts': [
      { key: 'account_number', title: 'Account Number', sortable: true },
      { key: 'customer_name', title: 'Customer Name', sortable: true },
      { key: 'account_type', title: 'Type', sortable: true },
      {
        key: 'current_balance',
        title: 'Balance',
        sortable: true,
        render: (value) => formatCurrency(value)
      },
      {
        key: 'last_transaction_date',
        title: 'Last Transaction',
        sortable: true,
        render: (value) => formatDate(value)
      }
    ]
    // Add more column definitions for other widgets
  };

  return columnMap[`${section}_${widgetId}`] || [];
};