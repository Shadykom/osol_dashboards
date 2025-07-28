import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useState, useEffect, Suspense } from 'react';
import { CustomerService } from '@/services/customerService';

function getSegmentBadge(segment, t) {
  const variants = {
    'RETAIL': 'default',
    'PREMIUM': 'secondary',
    'HNI': 'destructive',
    'CORPORATE': 'outline'
  };
  
  return <Badge variant={variants[segment] || 'default'}>{t(`common.${segment?.toLowerCase() || 'retail'}`)}</Badge>;
}

function getKYCBadge(status, t) {
  const variants = {
    'APPROVED': 'default',
    'PENDING': 'secondary',
    'REJECTED': 'destructive'
  };
  
  return <Badge variant={variants[status] || 'default'}>{t(`common.${status?.toLowerCase() || 'pending'}`)}</Badge>;
}

// Loading component
function LoadingState() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading customers...</p>
      </div>
    </div>
  );
}

// Error component
function ErrorState({ error, onRetry }) {
  return (
    <div className="text-center py-8">
      <div className="text-red-500 mb-4">
        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-2">Failed to load customers</h3>
      <p className="text-muted-foreground mb-4">{error || 'An unexpected error occurred'}</p>
      <Button onClick={onRetry} variant="outline">
        Try Again
      </Button>
    </div>
  );
}

export function Customers() {
  const { t, ready } = useTranslation();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    total_pages: 0
  });

  // Load customers from database
  useEffect(() => {
    if (ready) {
      loadCustomers();
    }
  }, [searchTerm, pagination.page, ready]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading customers with params:', {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm
      });

      const response = await CustomerService.getCustomers({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm
      });

      console.log('Customer service response:', response);

      if (response.success) {
        setCustomers(response.data || []);
        setPagination(response.pagination || pagination);
        console.log('Loaded customers:', response.data?.length || 0);
      } else {
        setError(response.error || 'Failed to load customers');
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      setError(error.message || 'An unexpected error occurred');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleRetry = () => {
    loadCustomers();
  };

  // Wait for translations to be ready
  if (!ready) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('customers.title', 'Customers')}</h1>
          <p className="text-muted-foreground">
            {t('customers.customerDetails', 'Customer Details')}
          </p>
        </div>
        <Button onClick={() => toast.info('Add customer functionality coming soon')}>
          <Plus className="mr-2 h-4 w-4" />
          {t('customers.addNewCustomer', 'Add New Customer')}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('customers.searchCustomers', 'Search customers...')}</CardTitle>
          <CardDescription>
            {t('customers.searchDescription', 'Find customers by name, ID, or email')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('customers.searchPlaceholder', 'Search customers...')}
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>
            <Button variant="outline" onClick={() => toast.info('Filter functionality coming soon')}>
              <Filter className="mr-2 h-4 w-4" />
              {t('common.filter', 'Filter')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('common.customerList', 'Customer List')}</CardTitle>
          <CardDescription>
            {loading ? t('common.loading', 'Loading...') : 
             error ? t('common.error', 'Error loading data') :
             `${pagination.total} ${t('common.customersFound', 'customers found')}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<LoadingState />}>
            {loading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState error={error} onRetry={handleRetry} />
            ) : customers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('customers.noCustomersFound', 'No customers found')}
              </div>
            ) : (
              <div className="space-y-4">
                {customers.map((customer) => (
                  <div key={customer.customer_id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{customer.full_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unnamed Customer'}</p>
                        {getSegmentBadge(customer.segment, t)}
                        {getKYCBadge(customer.kyc_status, t)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {customer.customer_id} • {customer.email || 'No email'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {customer.phone || 'No phone'}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-medium">SAR {customer.annual_income?.toLocaleString() || '0'}</p>
                      <p className="text-sm text-muted-foreground">
                        {customer.segment || 'RETAIL'}
                      </p>
                      <Button variant="outline" size="sm" onClick={() => toast.info('Customer details coming soon')}>
                        {t('customers.viewDetails', 'View Details')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

export default Customers;

