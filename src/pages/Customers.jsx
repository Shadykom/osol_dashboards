import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Filter } from 'lucide-react';

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
  
  return <Badge variant={variants[segment] || 'default'}>{segment}</Badge>;
}

function getKYCBadge(status) {
  const variants = {
    'APPROVED': 'default',
    'PENDING': 'secondary',
    'REJECTED': 'destructive'
  };
  
  return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
}

export function Customers() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage customer information and relationships
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Customers</CardTitle>
          <CardDescription>
            Find customers by name, ID, email, or phone number
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>
            {mockCustomers.length} customers found
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
                    {customer.accounts} account{customer.accounts !== 1 ? 's' : ''}
                  </p>
                  <Button variant="outline" size="sm">
                    View Details
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

