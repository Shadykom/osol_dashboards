import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const mockCustomers = [
  {
    id: 'CUST001',
    name: 'Ahmed Al-Rashid',
    email: 'ahmed.rashid@email.com',
    phone: '+966 50 123 4567',
    segment: 'PREMIUM',
    kyc_status: 'APPROVED',
    accounts: 3,
    total_balance: 'SAR 125,000'
  },
  {
    id: 'CUST002',
    name: 'Fatima Al-Zahra',
    email: 'fatima.zahra@email.com',
    phone: '+966 55 987 6543',
    segment: 'RETAIL',
    kyc_status: 'PENDING',
    accounts: 1,
    total_balance: 'SAR 15,500'
  },
  {
    id: 'CUST003',
    name: 'Mohammed Al-Saud',
    email: 'mohammed.saud@email.com',
    phone: '+966 50 555 1234',
    segment: 'HNI',
    kyc_status: 'APPROVED',
    accounts: 5,
    total_balance: 'SAR 850,000'
  }
];

function getSegmentBadge(segment) {
  const variants = {
    'RETAIL': 'default',
    'PREMIUM': 'secondary',
    'HNI': 'destructive',
    'CORPORATE': 'outline'
  };
  
  const { t } = useTranslation();
  
  return <Badge variant={variants[segment] || 'default'}>{t(`common.${segment.toLowerCase()}`)}</Badge>;
}

function getKYCBadge(status) {
  const variants = {
    'APPROVED': 'default',
    'PENDING': 'secondary',
    'REJECTED': 'destructive'
  };
  
  const { t } = useTranslation();
  
  return <Badge variant={variants[status] || 'default'}>{t(`common.${status.toLowerCase()}`)}</Badge>;
}

export function Customers() {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('customers.title')}</h1>
          <p className="text-muted-foreground">
            {t('customers.customerDetails')}
          </p>
        </div>
        <Button onClick={() => toast.info('Add customer functionality coming soon')}>
          <Plus className="mr-2 h-4 w-4" />
          {t('customers.addNewCustomer')}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('customers.searchCustomers')}</CardTitle>
          <CardDescription>
            {t('customers.searchCustomers')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('customers.searchCustomers')}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline" onClick={() => toast.info('Filter functionality coming soon')}>
              <Filter className="mr-2 h-4 w-4" />
              {t('common.filter')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('common.customerList')}</CardTitle>
          <CardDescription>
            {mockCustomers.length} {t('common.customersFound')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockCustomers.map((customer) => (
              <div key={customer.id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">{customer.name}</p>
                    {getSegmentBadge(customer.segment)}
                    {getKYCBadge(customer.kyc_status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {customer.id} • {customer.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {customer.phone}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-medium">{customer.total_balance}</p>
                  <p className="text-sm text-muted-foreground">
                    {customer.accounts} {t(customer.accounts !== 1 ? 'common.accounts' : 'common.account')}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => toast.info('Customer details coming soon')}>
                    {t('customers.viewDetails')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

