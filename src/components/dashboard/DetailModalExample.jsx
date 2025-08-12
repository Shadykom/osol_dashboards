import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DetailModal } from './DetailModal';
import { useTranslation } from 'react-i18next';

// Sample data generators
const generateSalesData = () => ({
  tableData: [
    {
      transactionId: '1K',
      transactionDate: '2025-07-22T06:25:35.22+00:00',
      accountNumber: 'ACC0000000001',
      customerId: 'CUST000001',
      debitCredit: 'CREDIT',
      transactionAmount: 680,
      narration: 'Sample transaction 1',
      channel: 'BRANCH',
      status: 'COMPLETED',
      branchId: 'BR002'
    },
    {
      transactionId: '1K',
      transactionDate: '2025-07-23T06:25:35.22+00:00',
      accountNumber: 'ACC0000000001',
      customerId: 'CUST000001',
      debitCredit: 'DEBIT',
      transactionAmount: 5000,
      narration: 'Sample transaction 2',
      channel: 'ATM',
      status: 'COMPLETED',
      branchId: 'BR002'
    },
    {
      transactionId: '1K',
      transactionDate: '2025-07-24T06:25:35.22+00:00',
      accountNumber: 'ACC0000000001',
      customerId: 'CUST000001',
      debitCredit: 'CREDIT',
      transactionAmount: 5000,
      narration: 'Sample transaction 3',
      channel: 'INTERNET',
      status: 'COMPLETED',
      branchId: 'BR002'
    },
    {
      transactionId: '1K',
      transactionDate: '2025-07-25T06:25:35.22+00:00',
      accountNumber: 'ACC0000000001',
      customerId: 'CUST000001',
      debitCredit: 'DEBIT',
      transactionAmount: 5000,
      narration: 'Sample transaction 4',
      channel: 'MOBILE',
      status: 'COMPLETED',
      branchId: 'BR002'
    },
    {
      transactionId: '1K',
      transactionDate: '2025-07-26T06:25:35.22+00:00',
      accountNumber: 'ACC0000000001',
      customerId: 'CUST000001',
      debitCredit: 'CREDIT',
      transactionAmount: 3000,
      narration: 'Sample transaction 5',
      channel: 'BRANCH',
      status: 'COMPLETED',
      branchId: 'BR002'
    }
  ],
  chartData: {
    trend: [
      { date: '2025-07-22', value: 680 },
      { date: '2025-07-23', value: 5000 },
      { date: '2025-07-24', value: 5000 },
      { date: '2025-07-25', value: 5000 },
      { date: '2025-07-26', value: 3000 }
    ],
    distribution: [
      { name: 'BRANCH', value: 3680 },
      { name: 'ATM', value: 5000 },
      { name: 'INTERNET', value: 5000 },
      { name: 'MOBILE', value: 5000 }
    ],
    breakdown: [
      { name: 'Credit', value: 8680 },
      { name: 'Debit', value: 10000 }
    ],
    performance: [
      { metric: 'Volume', current: 85, target: 90 },
      { metric: 'Count', current: 75, target: 80 },
      { metric: 'Success Rate', current: 98, target: 99 },
      { metric: 'Digital', current: 60, target: 70 },
      { metric: 'Branch', current: 40, target: 30 }
    ]
  },
  insights: {
    metrics: [
      { icon: 'dollar', label: 'totalVolume', value: 18680, type: 'currency', trend: 'up', change: 12.5 },
      { icon: 'activity', label: 'transactionCount', value: 5, type: 'number', trend: 'up', change: 25 },
      { icon: 'chart', label: 'avgTransaction', value: 3736, type: 'currency', trend: 'down', change: -5.2 },
      { icon: 'users', label: 'uniqueCustomers', value: 1, type: 'number', trend: 'up', change: 0 }
    ],
    cards: [
      {
        type: 'success',
        title: 'Performance Highlights',
        description: 'Transaction volume has increased significantly',
        items: [
          'Digital channels now account for 60% of transactions',
          'Average transaction size remains stable',
          'All transactions completed successfully'
        ],
        progress: 85
      },
      {
        type: 'info',
        title: 'Channel Distribution',
        description: 'Balanced distribution across all channels',
        items: [
          'Mobile and Internet banking showing strong adoption',
          'ATM usage remains consistent',
          'Branch transactions decreasing as expected'
        ],
        progress: 60
      }
    ],
    recommendations: [
      'Consider promoting digital channels to reduce branch load',
      'Monitor large transactions for potential fraud',
      'Implement real-time notifications for all channels'
    ]
  },
  badge: 'Live Data'
});

const generateCollectionData = () => ({
  tableData: [
    {
      summaryDate: '2025-07-29',
      branchId: '',
      totalDueAmount: 0,
      totalCollected: 0,
      collectionRate: 0,
      accountsDue: 0,
      accountsCollected: 0,
      ptpsObtained: 0,
      ptpsKept: 0,
      digitalPayments: 0
    },
    {
      summaryDate: '2025-07-28',
      branchId: '',
      totalDueAmount: 0,
      totalCollected: 0,
      collectionRate: 0,
      accountsDue: 0,
      accountsCollected: 0,
      ptpsObtained: 0,
      ptpsKept: 0,
      digitalPayments: 0
    },
    {
      summaryDate: '2025-08-01',
      branchId: 'BR001',
      totalDueAmount: 217000,
      totalCollected: 143000,
      collectionRate: 48.4,
      accountsDue: 234,
      accountsCollected: 91,
      ptpsObtained: 42,
      ptpsKept: 32,
      digitalPayments: 64
    }
  ],
  chartData: {
    trend: [
      { date: '2025-07-25', value: 0 },
      { date: '2025-07-26', value: 0 },
      { date: '2025-07-27', value: 0 },
      { date: '2025-07-28', value: 0 },
      { date: '2025-07-29', value: 0 },
      { date: '2025-07-30', value: 0 },
      { date: '2025-08-01', value: 143000 }
    ],
    distribution: [
      { name: 'Collected', value: 143000 },
      { name: 'Outstanding', value: 74000 }
    ],
    breakdown: [
      { name: 'Digital', value: 64 },
      { name: 'Branch', value: 27 },
      { name: 'Phone', value: 9 }
    ]
  },
  insights: {
    metrics: [
      { icon: 'dollar', label: 'totalCollected', value: 143000, type: 'currency', trend: 'up', change: 48.4 },
      { icon: 'users', label: 'accountsCollected', value: 91, type: 'number', trend: 'up', change: 38.9 },
      { icon: 'chart', label: 'collectionRate', value: 48.4, type: 'percentage', trend: 'up', change: 5.2 },
      { icon: 'globe', label: 'digitalRate', value: 70.3, type: 'percentage', trend: 'up', change: 12.1 }
    ],
    cards: [
      {
        type: 'success',
        title: 'Collection Performance',
        description: 'Collection rate is above target',
        items: [
          'Digital payments increased by 12.1%',
          'PTP fulfillment rate at 76.2%',
          'Branch collections decreased by 8%'
        ],
        progress: 48.4
      }
    ],
    recommendations: [
      'Focus on accounts with high outstanding amounts',
      'Increase digital payment reminders',
      'Review PTP follow-up process'
    ]
  }
});

const generateCustomerData = () => ({
  tableData: [
    { customerId: 'CUST000001', fullName: 'Customer 1', onboardingDate: '2025-07-29', branchId: 'BR002', customerStatus: 'ACTIVE', riskCategory: 'MEDIUM' },
    { customerId: 'CUST000002', fullName: 'Customer 2', onboardingDate: '2025-07-29', branchId: 'BR003', customerStatus: 'ACTIVE', riskCategory: 'HIGH' },
    { customerId: 'CUST000003', fullName: 'Customer 3', onboardingDate: '2025-07-29', branchId: 'BR001', customerStatus: 'ACTIVE', riskCategory: 'LOW' },
    { customerId: 'CUST000004', fullName: 'Customer 4', onboardingDate: '2025-07-29', branchId: 'BR002', customerStatus: 'ACTIVE', riskCategory: 'MEDIUM' },
    { customerId: 'CUST000005', fullName: 'Customer 5', onboardingDate: '2025-07-29', branchId: 'BR003', customerStatus: 'ACTIVE', riskCategory: 'HIGH' },
    { customerId: 'CUST000006', fullName: 'Customer 6', onboardingDate: '2025-07-29', branchId: 'BR001', customerStatus: 'ACTIVE', riskCategory: 'LOW' },
    { customerId: 'CUST000007', fullName: 'Customer 7', onboardingDate: '2025-07-29', branchId: 'BR002', customerStatus: 'ACTIVE', riskCategory: 'MEDIUM' },
    { customerId: 'CUST000008', fullName: 'Customer 8', onboardingDate: '2025-07-29', branchId: 'BR003', customerStatus: 'ACTIVE', riskCategory: 'HIGH' },
    { customerId: 'CUST000009', fullName: 'Customer 9', onboardingDate: '2025-07-29', branchId: 'BR001', customerStatus: 'ACTIVE', riskCategory: 'LOW' }
  ],
  chartData: {
    distribution: [
      { name: 'LOW Risk', value: 3 },
      { name: 'MEDIUM Risk', value: 3 },
      { name: 'HIGH Risk', value: 3 }
    ],
    breakdown: [
      { name: 'BR001', value: 3 },
      { name: 'BR002', value: 3 },
      { name: 'BR003', value: 3 }
    ]
  },
  insights: {
    metrics: [
      { icon: 'users', label: 'totalCustomers', value: 9, type: 'number', trend: 'up', change: 12.5 },
      { icon: 'chart', label: 'activeRate', value: 100, type: 'percentage', trend: 'up', change: 0 },
      { icon: 'globe', label: 'branchCount', value: 3, type: 'number', trend: 'up', change: 0 },
      { icon: 'activity', label: 'avgRisk', value: 'MEDIUM', type: 'text', trend: 'up', change: 0 }
    ]
  }
});

const generateAccountData = () => ({
  tableData: [
    { accountId: 779, accountNumber: 'ACC0000000001', customerId: 'CUST000001', branchId: 'BR002', openingDate: '2025-07-30', accountStatus: 'ACTIVE', currentBalance: 19000 },
    { accountId: 780, accountNumber: 'ACC0000000011', customerId: 'CUST000002', branchId: 'BR003', openingDate: '2025-07-30', accountStatus: 'ACTIVE', currentBalance: 30000 },
    { accountId: 781, accountNumber: 'ACC0000000012', customerId: 'CUST000002', branchId: 'BR003', openingDate: '2025-07-30', accountStatus: 'ACTIVE', currentBalance: 21000 },
    { accountId: 782, accountNumber: 'ACC0000000021', customerId: 'CUST000003', branchId: 'BR004', openingDate: '2025-07-30', accountStatus: 'ACTIVE', currentBalance: 85000 },
    { accountId: 783, accountNumber: 'ACC0000000031', customerId: 'CUST000004', branchId: 'BR005', openingDate: '2025-07-30', accountStatus: 'ACTIVE', currentBalance: 63000 },
    { accountId: 784, accountNumber: 'ACC0000000032', customerId: 'CUST000004', branchId: 'BR005', openingDate: '2025-07-30', accountStatus: 'ACTIVE', currentBalance: 50000 },
    { accountId: 785, accountNumber: 'ACC0000000041', customerId: 'CUST000005', branchId: 'BR001', openingDate: '2025-07-30', accountStatus: 'ACTIVE', currentBalance: 41000 },
    { accountId: 786, accountNumber: 'ACC0000000051', customerId: 'CUST000006', branchId: 'BR002', openingDate: '2025-07-30', accountStatus: 'ACTIVE', currentBalance: 21000 },
    { accountId: 787, accountNumber: 'ACC0000000052', customerId: 'CUST000006', branchId: 'BR002', openingDate: '2025-07-30', accountStatus: 'ACTIVE', currentBalance: 40000 }
  ],
  chartData: {
    trend: [
      { date: '2025-07-24', value: 350000 },
      { date: '2025-07-25', value: 355000 },
      { date: '2025-07-26', value: 360000 },
      { date: '2025-07-27', value: 365000 },
      { date: '2025-07-28', value: 370000 },
      { date: '2025-07-29', value: 375000 },
      { date: '2025-07-30', value: 380000 }
    ],
    distribution: [
      { name: '0-25K', value: 3 },
      { name: '25K-50K', value: 3 },
      { name: '50K-100K', value: 3 },
      { name: '100K+', value: 0 }
    ]
  },
  insights: {
    metrics: [
      { icon: 'dollar', label: 'totalBalance', value: 380000, type: 'currency', trend: 'up', change: 8.6 },
      { icon: 'chart', label: 'avgBalance', value: 42222, type: 'currency', trend: 'up', change: 5.2 },
      { icon: 'users', label: 'totalAccounts', value: 9, type: 'number', trend: 'up', change: 12.5 },
      { icon: 'activity', label: 'activeRate', value: 100, type: 'percentage', trend: 'up', change: 0 }
    ]
  }
});

const generateCaseData = () => ({
  tableData: [
    { caseId: 10, caseNumber: 'COLL20250726_8f8d1128', customerId: 'CUST001', accountNumber: 'ACC1000000001', branchId: 'BR001', totalOutstanding: 135000, totalOverdue: 0, dpd: 60, caseStatus: 'ACTIVE', assignedTo: 'OFF001' },
    { caseId: 11, caseNumber: 'COLL20250726_550e80ce', customerId: 'CUST005', accountNumber: 'ACC1000000007', branchId: 'BR003', totalOutstanding: 130000, totalOverdue: 0, dpd: 30, caseStatus: 'ACTIVE', assignedTo: '' },
    { caseId: 12, caseNumber: 'COLL20250726_d12d9499', customerId: 'CUST004', accountNumber: 'ACC1000000006', branchId: 'BR002', totalOutstanding: 56000, totalOverdue: 0, dpd: 45, caseStatus: 'ACTIVE', assignedTo: '' },
    { caseId: 13, caseNumber: 'COLL20250726_7f2b0237', customerId: 'CUST006', accountNumber: 'ACC1000000008', branchId: 'BR003', totalOutstanding: 100000, totalOverdue: 0, dpd: 90, caseStatus: 'ACTIVE', assignedTo: '' },
    { caseId: 30, caseNumber: 'COLL20250727_efde899f', customerId: 'CUST001', accountNumber: '', branchId: '', totalOutstanding: 177000, totalOverdue: 0, dpd: 177, caseStatus: 'ACTIVE', assignedTo: 'OFF001' }
  ],
  chartData: {
    distribution: [
      { name: '0-30 DPD', value: 1 },
      { name: '31-60 DPD', value: 2 },
      { name: '61-90 DPD', value: 1 },
      { name: '90+ DPD', value: 1 }
    ],
    breakdown: [
      { name: 'BR001', value: 312000 },
      { name: 'BR002', value: 56000 },
      { name: 'BR003', value: 230000 }
    ]
  },
  insights: {
    metrics: [
      { icon: 'dollar', label: 'totalOutstanding', value: 598000, type: 'currency', trend: 'down', change: -12.3 },
      { icon: 'chart', label: 'avgDPD', value: 72.4, type: 'number', trend: 'down', change: -8.5 },
      { icon: 'users', label: 'activeCases', value: 5, type: 'number', trend: 'down', change: -16.7 },
      { icon: 'activity', label: 'assignmentRate', value: 40, type: 'percentage', trend: 'up', change: 10 }
    ]
  }
});

export const DetailModalExample = () => {
  const { t, i18n } = useTranslation();
  const [modalState, setModalState] = useState({
    sales: false,
    collection: false,
    customer: false,
    account: false,
    case: false
  });

  const openModal = (type) => {
    setModalState(prev => ({ ...prev, [type]: true }));
  };

  const closeModal = (type) => {
    setModalState(prev => ({ ...prev, [type]: false }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Detail Modal Examples</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Click on any button below to see the DetailModal with different types of data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Button
          onClick={() => openModal('sales')}
          variant="outline"
          className="h-24 text-lg"
        >
          {t('detailModal.salesDetails')}
        </Button>
        
        <Button
          onClick={() => openModal('collection')}
          variant="outline"
          className="h-24 text-lg"
        >
          {t('detailModal.collectionDetails')}
        </Button>
        
        <Button
          onClick={() => openModal('customer')}
          variant="outline"
          className="h-24 text-lg"
        >
          {t('detailModal.customerDetails')}
        </Button>
        
        <Button
          onClick={() => openModal('account')}
          variant="outline"
          className="h-24 text-lg"
        >
          {t('detailModal.accountDetails')}
        </Button>
        
        <Button
          onClick={() => openModal('case')}
          variant="outline"
          className="h-24 text-lg"
        >
          {t('detailModal.caseDetails')}
        </Button>
      </div>

      {/* Language Switcher */}
      <div className="flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <span className="font-medium">Current Language:</span>
        <Button
          variant={i18n.language === 'en' ? 'default' : 'outline'}
          onClick={() => i18n.changeLanguage('en')}
        >
          English
        </Button>
        <Button
          variant={i18n.language === 'ar' ? 'default' : 'outline'}
          onClick={() => i18n.changeLanguage('ar')}
        >
          العربية
        </Button>
      </div>

      {/* Modals */}
      <DetailModal
        isOpen={modalState.sales}
        onClose={() => closeModal('sales')}
        title={t('detailModal.salesDetails')}
        description="Detailed breakdown and analysis"
        data={generateSalesData()}
        type="sales"
      />

      <DetailModal
        isOpen={modalState.collection}
        onClose={() => closeModal('collection')}
        title={t('detailModal.collectionDetails')}
        description="Detailed breakdown and analysis"
        data={generateCollectionData()}
        type="collection"
      />

      <DetailModal
        isOpen={modalState.customer}
        onClose={() => closeModal('customer')}
        title={t('detailModal.customerDetails')}
        description="Detailed breakdown and analysis"
        data={generateCustomerData()}
        type="customer"
      />

      <DetailModal
        isOpen={modalState.account}
        onClose={() => closeModal('account')}
        title={t('detailModal.accountDetails')}
        description="Detailed breakdown and analysis"
        data={generateAccountData()}
        type="account"
      />

      <DetailModal
        isOpen={modalState.case}
        onClose={() => closeModal('case')}
        title={t('detailModal.caseDetails')}
        description="Detailed breakdown and analysis"
        data={generateCaseData()}
        type="case"
      />
    </div>
  );
};

export default DetailModalExample;