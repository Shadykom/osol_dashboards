import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { CustomerService } from '@/services/customerService';

function getSegmentBadge(segment) {
  const variants = {
    'RETAIL': 'default',
    'PREMIUM': 'secondary',
    'HNI': 'destructive',
    'CORPORATE': 'outline'
  };
  
  const { t } = useTranslation();
  
  return <Badge variant={variants[segment] || 'default'}>{t(`common.${segment?.toLowerCase() || 'retail'}`)}</Badge>;
}

function getKYCBadge(status) {
  const variants = {
    'APPROVED': 'default',
    'PENDING': 'secondary',
    'REJECTED': 'destructive'
  };
  
  const { t } = useTranslation();
  
  return <Badge variant={variants[status] || 'default'}>{t(`common.${status?.toLowerCase() || 'pending'}`)}</Badge>;
}

export function Customers() {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    total_pages: 0
  });

  // Load customers from database
  useEffect(() => {
    loadCustomers();
  }, [searchTerm, pagination.page]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
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
        toast.error('Failed to load customers: ' + response.error);
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Error loading customers: ' + error.message);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('customers.title') || 'Customers'}</h1>
          <p className="text-muted-foreground">
            {t('customers.customerDetails') || 'Customer Details'}
          </p>
        </div>
        <Button onClick={() => toast.info('Add customer functionality coming soon')}>
          <Plus className="mr-2 h-4 w-4" />
          {t('customers.addNewCustomer') || 'Add New Customer'}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('customers.searchCustomers') || 'Search customers...'}</CardTitle>
          <CardDescription>
            {t('customers.searchCustomers') || 'Search customers...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('customers.searchCustomers') || 'Search customers...'}
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>
            <Button variant="outline" onClick={() => toast.info('Filter functionality coming soon')}>
              <Filter className="mr-2 h-4 w-4" />
              {t('common.filter') || 'Filter'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('common.customerList') || 'Customer List'}</CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : `${pagination.total} ${t('common.customersFound') || 'customers found'}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading customers...</div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No customers found
            </div>
          ) : (
            <div className="space-y-4">
              {customers.map((customer) => (
                <div key={customer.customer_id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{customer.full_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unnamed Customer'}</p>
                      {getSegmentBadge(customer.segment)}
                      {getKYCBadge(customer.kyc_status)}
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
                      {t('customers.viewDetails') || 'View Details'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Customers;

