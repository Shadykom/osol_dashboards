import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { 
  Search, Filter, Download, Calendar as CalendarIcon, User, Phone, Mail, 
  MapPin, CreditCard, DollarSign, AlertCircle, CheckCircle, Clock,
  FileText, Users, Building2, TrendingUp, TrendingDown, Eye, 
  MessageSquare, PhoneCall, Globe, ChevronRight, ChevronDown,
  Loader2, RefreshCw, Share2, Printer, X, Info, Activity,
  Briefcase, Shield, Star, Target, Zap, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import { format, parseISO, differenceInDays, addDays, subMonths } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { CustomerService } from '@/services/customerService';

// Mock Service for Customer Data
const CustomerFootprintService = {
  searchCustomers: async (query) => {
    // First, attempt to fetch matching customers from the real database (Supabase)
    try {
      const resp = await CustomerService.getCustomers({ search: query, page: 1, limit: 20 });
      if (resp?.success && resp.data?.length) {
        // Map DB response to the shape expected by the dashboard
        const mapped = resp.data.map((c) => ({
          customer_id: c.customer_id,
          full_name: c.full_name || `${c.first_name || ''} ${c.middle_name || ''} ${c.last_name || ''}`.trim(),
          national_id: c.national_id || c.customer_id,
          email: c.email,
          phone: c.phone,
          customer_type: c.segment || 'Customer',
          risk_category: (c.risk_category || 'Low').charAt(0).toUpperCase() + (c.risk_category || 'Low').slice(1).toLowerCase(),
          created_at: c.created_at,
          branch: { id: c.branch_id || 'BR001', name: c.branch_name || 'Main Branch' }
        }));
        return { success: true, data: mapped };
      }
    } catch (err) {
      console.error('CustomerFootprintService.searchCustomers DB error, falling back to mock:', err);
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      data: [
        {
          customer_id: 'CUST001',
          full_name: 'أحمد محمد الراشد',
          national_id: '1234567890',
          email: 'ahmed.rashid@email.com',
          phone: '+966501234567',
          customer_type: 'Premium',
          risk_category: 'Low',
          created_at: '2020-03-15',
          branch: { id: 'BR001', name: 'الرياض - الفرع الرئيسي' }
        },
        {
          customer_id: 'CUST002',
          full_name: 'فاطمة عبدالله السالم',
          national_id: '0987654321',
          email: 'fatima.salem@email.com',
          phone: '+966502345678',
          customer_type: 'Gold',
          risk_category: 'Medium',
          created_at: '2019-06-20',
          branch: { id: 'BR002', name: 'جدة - فرع التحلية' }
        }
      ]
    };
  },

  getCustomerFootprint: async (customerId, filters) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      success: true,
      data: {
        profile: {
          customer_id: customerId,
          full_name: 'أحمد محمد الراشد',
          national_id: '1234567890',
          email: 'ahmed.rashid@email.com',
          phone: '+966501234567',
          customer_type: 'Premium',
          segment: 'High Value',
          risk_category: 'Low',
          created_at: '2020-03-15',
          kyc_status: 'Verified',
          preferred_language: 'Arabic',
          occupation: 'Business Owner',
          annual_income: 850000,
          total_relationship_value: 2450000,
          customer_since_days: 1380,
          loyalty_score: 92,
          churn_probability: 12,
          lifetime_value: 3200000,
          branch: {
            id: 'BR001',
            name: 'الرياض - الفرع الرئيسي',
            city: 'الرياض',
            region: 'الوسطى'
          },
          relationship_manager: {
            id: 'RM001',
            name: 'محمد عبدالله',
            phone: '+966503456789',
            email: 'mohammed.abdullah@bank.com'
          }
        },
        
        products: [
          {
            id: 'LOAN001',
            type: 'قرض تورق',
            product_name: 'تمويل شخصي',
            amount: 500000,
            outstanding: 320000,
            status: 'Active',
            start_date: '2022-01-15',
            maturity_date: '2027-01-15',
            interest_rate: 4.5,
            monthly_payment: 9250,
            dpd: 0,
            next_payment_date: '2024-08-01',
            branch: 'الرياض - الفرع الرئيسي'
          },
          {
            id: 'CC001',
            type: 'بطاقة ائتمان',
            product_name: 'بطاقة بلاتينيوم',
            credit_limit: 50000,
            outstanding: 12500,
            status: 'Active',
            start_date: '2021-06-10',
            expiry_date: '2025-06-10',
            utilization: 25,
            last_payment: 12500,
            last_payment_date: '2024-06-28'
          },
          {
            id: 'ACC001',
            type: 'حساب جاري',
            product_name: 'الحساب الذهبي',
            balance: 125000,
            status: 'Active',
            start_date: '2020-03-15',
            avg_monthly_balance: 180000,
            transactions_count: 1250
          }
        ],
        
        interactions: {
          summary: {
            total: 245,
            calls: 125,
            emails: 45,
            sms: 50,
            branch_visits: 15,
            digital_logins: 850,
            last_contact: '2024-07-28',
            preferred_channel: 'Phone'
          },
          recent: [
            {
              id: 'INT001',
              date: '2024-07-28',
              type: 'Call',
              channel: 'Phone',
              officer: 'محمد عبدالله',
              department: 'Customer Service',
              purpose: 'Account Inquiry',
              duration: '5:32',
              outcome: 'Resolved',
              satisfaction: 5
            },
            {
              id: 'INT002',
              date: '2024-07-25',
              type: 'Email',
              channel: 'Email',
              officer: 'فاطمة أحمد',
              department: 'Collections',
              purpose: 'Payment Reminder',
              outcome: 'Acknowledged'
            },
            {
              id: 'INT003',
              date: '2024-07-20',
              type: 'Visit',
              channel: 'Branch',
              officer: 'خالد سعود',
              department: 'Relationship Management',
              purpose: 'Product Consultation',
              duration: '45:00',
              outcome: 'New Product Interest'
            }
          ],
          timeline: this.generateInteractionTimeline()
        },
        
        payment_behavior: {
          on_time_payments: 45,
          late_payments: 3,
          missed_payments: 0,
          avg_days_late: 2.5,
          payment_score: 94,
          preferred_payment_method: 'Online Banking',
          payment_pattern: 'Consistent',
          risk_indicators: [],
          monthly_trend: this.generatePaymentTrend()
        },
        
        collection_history: {
          total_cases: 2,
          active_cases: 0,
          resolved_cases: 2,
          total_collected: 25000,
          promises_kept: 2,
          promises_broken: 0,
          avg_resolution_days: 5,
          last_collection_date: '2023-11-15'
        },
        
        transaction_patterns: {
          avg_monthly_transactions: 45,
          avg_transaction_amount: 2500,
          preferred_transaction_time: 'Evening',
          preferred_transaction_day: 'Thursday',
          top_categories: [
            { category: 'Groceries', percentage: 25, amount: 12500 },
            { category: 'Fuel', percentage: 20, amount: 10000 },
            { category: 'Restaurants', percentage: 15, amount: 7500 },
            { category: 'Shopping', percentage: 18, amount: 9000 },
            { category: 'Bills', percentage: 22, amount: 11000 }
          ],
          monthly_spending: this.generateSpendingTrend()
        },
        
        risk_profile: {
          current_score: 750,
          trend: 'Improving',
          factors: [
            { factor: 'Payment History', impact: 35, status: 'Positive' },
            { factor: 'Credit Utilization', impact: 30, status: 'Positive' },
            { factor: 'Account Age', impact: 15, status: 'Positive' },
            { factor: 'Credit Mix', impact: 10, status: 'Neutral' },
            { factor: 'New Credit', impact: 10, status: 'Positive' }
          ],
          predictions: {
            default_probability: 2.5,
            churn_probability: 12,
            upsell_probability: 78,
            risk_category_change: 'Stable'
          }
        },
        
        engagement_metrics: {
          digital_adoption: 85,
          mobile_app_usage: 'High',
          email_open_rate: 72,
          sms_response_rate: 45,
          campaign_responsiveness: 'Medium',
          nps_score: 8,
          last_survey_date: '2024-05-15',
          preferences: {
            contact_time: 'Evening',
            contact_method: 'Phone',
            language: 'Arabic',
            product_interests: ['Investment', 'Insurance']
          }
        }
      }
    };
  },

  generateInteractionTimeline() {
    const types = ['Call', 'Email', 'SMS', 'Visit', 'Digital'];
    const timeline = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      timeline.push({
        month: format(date, 'MMM yyyy'),
        interactions: Math.floor(Math.random() * 20) + 5,
        calls: Math.floor(Math.random() * 8) + 2,
        emails: Math.floor(Math.random() * 5) + 1,
        digital: Math.floor(Math.random() * 15) + 10
      });
    }
    return timeline.reverse();
  },

  generatePaymentTrend() {
    const trend = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      trend.push({
        month: format(date, 'MMM yy'),
        onTime: Math.floor(Math.random() * 5) + 3,
        late: Math.random() > 0.7 ? 1 : 0,
        amount: Math.floor(Math.random() * 5000) + 8000
      });
    }
    return trend.reverse();
  },

  generateSpendingTrend() {
    const trend = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      trend.push({
        month: format(date, 'MMM'),
        spending: Math.floor(Math.random() * 20000) + 30000,
        transactions: Math.floor(Math.random() * 30) + 40
      });
    }
    return trend.reverse();
  },

  exportReport: async (customerId, format) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Exporting customer ${customerId} report in ${format} format`);
    return { success: true, url: `report_${customerId}.${format}` };
  }
};

const CustomerFootprintDashboard = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({ from: subMonths(new Date(), 6), to: new Date() });
  const [filters, setFilters] = useState({
    branch: 'all',
    productType: 'all',
    interactionType: 'all',
    riskCategory: 'all'
  });
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Colors
  const COLORS = ['#E6B800', '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Search customers
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const result = await CustomerFootprintService.searchCustomers(searchQuery);
      if (result.success) {
        setSearchResults(result.data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  // Load customer footprint
  const loadCustomerFootprint = async (customerId) => {
    setLoading(true);
    try {
      const result = await CustomerFootprintService.getCustomerFootprint(customerId, {
        dateRange,
        ...filters
      });
      if (result.success) {
        setCustomerData(result.data);
      }
    } catch (error) {
      console.error('Load customer error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle customer selection
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setSearchResults([]);
    loadCustomerFootprint(customer.customer_id);
  };

  // Export report
  const handleExport = async (format) => {
    if (!selectedCustomer) return;
    
    try {
      const result = await CustomerFootprintService.exportReport(selectedCustomer.customer_id, format);
      if (result.success) {
        // Handle download
        console.log('Report exported:', result.url);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
    setExportDialogOpen(false);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format number
  const formatNumber = (num) => {
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US').format(num);
  };

  // Calculate days difference
  const daysSince = (date) => {
    return differenceInDays(new Date(), parseISO(date));
  };

  // Get risk color
  const getRiskColor = (risk) => {
    const colors = {
      'Low': 'text-green-600 bg-green-50',
      'Medium': 'text-yellow-600 bg-yellow-50',
      'High': 'text-red-600 bg-red-50'
    };
    return colors[risk] || 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isRTL ? 'لوحة البصمة الرقمية للعميل' : 'Customer Digital Footprint'}
                </h1>
                <p className="text-sm text-gray-600">
                  {isRTL ? 'تحليل شامل لسلوك وتفاعلات العملاء' : 'Comprehensive analysis of customer behavior and interactions'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {selectedCustomer && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadCustomerFootprint(selectedCustomer.customer_id)}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShareDialogOpen(true)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setExportDialogOpen(true)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isRTL ? 'تصدير' : 'Export'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={isRTL ? "البحث بالاسم، رقم الهوية، رقم الجوال..." : "Search by name, ID, mobile number..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 w-full"
                  />
                </div>
              </div>
              
              <Button onClick={handleSearch} disabled={searching}>
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-2">{isRTL ? 'بحث' : 'Search'}</span>
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select value={filters.branch} onValueChange={(v) => setFilters({...filters, branch: v})}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={isRTL ? "الفرع" : "Branch"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRTL ? "جميع الفروع" : "All Branches"}</SelectItem>
                  <SelectItem value="BR001">الرياض - الفرع الرئيسي</SelectItem>
                  <SelectItem value="BR002">جدة - فرع التحلية</SelectItem>
                  <SelectItem value="BR003">الدمام - فرع الملك فهد</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.productType} onValueChange={(v) => setFilters({...filters, productType: v})}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={isRTL ? "نوع المنتج" : "Product Type"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRTL ? "جميع المنتجات" : "All Products"}</SelectItem>
                  <SelectItem value="loan">{isRTL ? "قروض" : "Loans"}</SelectItem>
                  <SelectItem value="card">{isRTL ? "بطاقات" : "Cards"}</SelectItem>
                  <SelectItem value="account">{isRTL ? "حسابات" : "Accounts"}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.riskCategory} onValueChange={(v) => setFilters({...filters, riskCategory: v})}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={isRTL ? "فئة المخاطر" : "Risk Category"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRTL ? "جميع الفئات" : "All Categories"}</SelectItem>
                  <SelectItem value="low">{isRTL ? "منخفض" : "Low"}</SelectItem>
                  <SelectItem value="medium">{isRTL ? "متوسط" : "Medium"}</SelectItem>
                  <SelectItem value="high">{isRTL ? "عالي" : "High"}</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {isRTL ? "نطاق التاريخ" : "Date Range"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    locale={isRTL ? ar : enUS}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-medium text-gray-700">
                {isRTL ? 'نتائج البحث' : 'Search Results'}
              </h3>
              {searchResults.map((customer) => (
                <div
                  key={customer.customer_id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => handleCustomerSelect(customer)}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{customer.full_name}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{customer.national_id}</span>
                        <span>•</span>
                        <span>{customer.phone}</span>
                        <span>•</span>
                        <span>{customer.branch.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{customer.customer_type}</Badge>
                    <Badge className={cn(getRiskColor(customer.risk_category))}>
                      {customer.risk_category}
                    </Badge>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">{isRTL ? 'جاري تحميل البيانات...' : 'Loading data...'}</p>
          </div>
        </div>
      ) : customerData ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Customer Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{customerData.profile.full_name}</h2>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <CreditCard className="h-4 w-4" />
                      <span>{customerData.profile.national_id}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      <span>{customerData.profile.phone}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      <span>{customerData.profile.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      <span>{customerData.profile.branch.name}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Badge variant="outline">{customerData.profile.customer_type}</Badge>
                    <Badge variant="outline">{customerData.profile.segment}</Badge>
                    <Badge className={cn(getRiskColor(customerData.profile.risk_category))}>
                      {customerData.profile.risk_category} Risk
                    </Badge>
                    <Badge variant="secondary">
                      <Star className="h-3 w-3 mr-1" />
                      {isRTL ? `نقاط الولاء: ${customerData.profile.loyalty_score}` : `Loyalty: ${customerData.profile.loyalty_score}`}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{formatNumber(customerData.profile.customer_since_days)}</p>
                  <p className="text-xs text-gray-600">{isRTL ? 'يوم مع البنك' : 'Days with Bank'}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(customerData.profile.total_relationship_value)}</p>
                  <p className="text-xs text-gray-600">{isRTL ? 'إجمالي القيمة' : 'Total Value'}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{customerData.products.length}</p>
                  <p className="text-xs text-gray-600">{isRTL ? 'منتجات نشطة' : 'Active Products'}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{customerData.profile.churn_probability}%</p>
                  <p className="text-xs text-gray-600">{isRTL ? 'احتمال المغادرة' : 'Churn Risk'}</p>
                </div>
              </div>
            </div>

            {/* Relationship Manager */}
            {customerData.profile.relationship_manager && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{isRTL ? 'مدير العلاقة' : 'Relationship Manager'}</p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">{customerData.profile.relationship_manager.name}</p>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span>{customerData.profile.relationship_manager.phone}</span>
                          <span>•</span>
                          <span>{customerData.profile.relationship_manager.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {isRTL ? 'تواصل' : 'Contact'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-2 lg:grid-cols-6 w-full">
              <TabsTrigger value="overview">{isRTL ? 'نظرة عامة' : 'Overview'}</TabsTrigger>
              <TabsTrigger value="products">{isRTL ? 'المنتجات' : 'Products'}</TabsTrigger>
              <TabsTrigger value="interactions">{isRTL ? 'التفاعلات' : 'Interactions'}</TabsTrigger>
              <TabsTrigger value="payments">{isRTL ? 'المدفوعات' : 'Payments'}</TabsTrigger>
              <TabsTrigger value="behavior">{isRTL ? 'السلوك' : 'Behavior'}</TabsTrigger>
              <TabsTrigger value="risk">{isRTL ? 'المخاطر' : 'Risk'}</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {isRTL ? 'القيمة الدائمة' : 'Lifetime Value'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(customerData.profile.lifetime_value)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      {isRTL ? '+15% من العام الماضي' : '+15% from last year'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {isRTL ? 'نقاط المخاطر' : 'Risk Score'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{customerData.risk_profile.current_score}</p>
                    <Progress value={customerData.risk_profile.current_score / 10} className="mt-2" />
                    <p className="text-xs text-gray-500 mt-1">{customerData.risk_profile.trend}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {isRTL ? 'معدل التفاعل' : 'Engagement Rate'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-blue-600">{customerData.engagement_metrics.digital_adoption}%</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {isRTL ? 'استخدام رقمي عالي' : 'High digital usage'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {isRTL ? 'رضا العميل' : 'Customer Satisfaction'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{customerData.engagement_metrics.nps_score}/10</p>
                    <div className="flex items-center gap-1 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-4 w-4",
                            i < Math.floor(customerData.engagement_metrics.nps_score / 2)
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          )}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>{isRTL ? 'رؤى سريعة' : 'Quick Insights'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Alert>
                      <Zap className="h-4 w-4" />
                      <AlertDescription>
                        {isRTL 
                          ? `العميل لديه احتمالية عالية (${customerData.risk_profile.predictions.upsell_probability}%) لشراء منتجات استثمارية`
                          : `Customer has high probability (${customerData.risk_profile.predictions.upsell_probability}%) for investment products`}
                      </AlertDescription>
                    </Alert>
                    <Alert>
                      <Target className="h-4 w-4" />
                      <AlertDescription>
                        {isRTL 
                          ? `القناة المفضلة للتواصل: ${customerData.engagement_metrics.preferences.contact_method} في ${customerData.engagement_metrics.preferences.contact_time}`
                          : `Preferred contact: ${customerData.engagement_metrics.preferences.contact_method} in ${customerData.engagement_metrics.preferences.contact_time}`}
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {customerData.products.map((product) => (
                  <Card key={product.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{product.product_name}</CardTitle>
                          <CardDescription>{product.type}</CardDescription>
                        </div>
                        <Badge variant={product.status === 'Active' ? 'default' : 'secondary'}>
                          {product.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {product.type === 'قرض تورق' && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">{isRTL ? 'مبلغ القرض' : 'Loan Amount'}</span>
                              <span className="font-medium">{formatCurrency(product.amount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">{isRTL ? 'المبلغ المتبقي' : 'Outstanding'}</span>
                              <span className="font-medium text-orange-600">{formatCurrency(product.outstanding)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">{isRTL ? 'القسط الشهري' : 'Monthly Payment'}</span>
                              <span className="font-medium">{formatCurrency(product.monthly_payment)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">{isRTL ? 'الدفعة القادمة' : 'Next Payment'}</span>
                              <span className="font-medium">{format(parseISO(product.next_payment_date), 'dd MMM yyyy')}</span>
                            </div>
                            <Progress value={(1 - product.outstanding / product.amount) * 100} className="mt-2" />
                          </>
                        )}
                        
                        {product.type === 'بطاقة ائتمان' && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">{isRTL ? 'الحد الائتماني' : 'Credit Limit'}</span>
                              <span className="font-medium">{formatCurrency(product.credit_limit)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">{isRTL ? 'المستخدم' : 'Outstanding'}</span>
                              <span className="font-medium text-orange-600">{formatCurrency(product.outstanding)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">{isRTL ? 'نسبة الاستخدام' : 'Utilization'}</span>
                              <span className="font-medium">{product.utilization}%</span>
                            </div>
                            <Progress value={product.utilization} className="mt-2" />
                          </>
                        )}
                        
                        {product.type === 'حساب جاري' && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">{isRTL ? 'الرصيد الحالي' : 'Current Balance'}</span>
                              <span className="font-medium text-green-600">{formatCurrency(product.balance)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">{isRTL ? 'متوسط الرصيد' : 'Avg Balance'}</span>
                              <span className="font-medium">{formatCurrency(product.avg_monthly_balance)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">{isRTL ? 'عدد العمليات' : 'Transactions'}</span>
                              <span className="font-medium">{formatNumber(product.transactions_count)}</span>
                            </div>
                          </>
                        )}
                        
                        <Separator />
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">{isRTL ? 'تاريخ البداية' : 'Start Date'}</span>
                          <span>{format(parseISO(product.start_date), 'dd MMM yyyy')}</span>
                        </div>
                        {product.branch && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">{isRTL ? 'الفرع' : 'Branch'}</span>
                            <span>{product.branch}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Product Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>{isRTL ? 'توزيع المنتجات' : 'Product Distribution'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={customerData.products.map((p, i) => ({
                            name: p.product_name,
                            value: p.outstanding || p.balance || p.amount
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {customerData.products.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Interactions Tab */}
            <TabsContent value="interactions" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {isRTL ? 'إجمالي التفاعلات' : 'Total Interactions'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{formatNumber(customerData.interactions.summary.total)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {isRTL ? `آخر تواصل: ${customerData.interactions.summary.last_contact}` : `Last contact: ${customerData.interactions.summary.last_contact}`}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {isRTL ? 'المكالمات' : 'Calls'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-blue-600">{formatNumber(customerData.interactions.summary.calls)}</p>
                    <div className="flex gap-2 mt-2">
                      <PhoneCall className="h-4 w-4 text-gray-400" />
                      <Progress value={(customerData.interactions.summary.calls / customerData.interactions.summary.total) * 100} className="flex-1" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {isRTL ? 'الرسائل' : 'Messages'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">
                      {formatNumber(customerData.interactions.summary.emails + customerData.interactions.summary.sms)}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span><Mail className="h-3 w-3 inline" /> {customerData.interactions.summary.emails}</span>
                      <span><MessageSquare className="h-3 w-3 inline" /> {customerData.interactions.summary.sms}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {isRTL ? 'تسجيلات الدخول' : 'Digital Logins'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-purple-600">{formatNumber(customerData.interactions.summary.digital_logins)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      <Globe className="h-3 w-3 inline mr-1" />
                      {isRTL ? 'مستخدم نشط رقمياً' : 'Active digital user'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Interaction Timeline Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>{isRTL ? 'تطور التفاعلات' : 'Interaction Timeline'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={customerData.interactions.timeline}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="calls" stackId="1" stroke="#3b82f6" fill="#3b82f6" name={isRTL ? "مكالمات" : "Calls"} />
                        <Area type="monotone" dataKey="emails" stackId="1" stroke="#10b981" fill="#10b981" name={isRTL ? "بريد" : "Emails"} />
                        <Area type="monotone" dataKey="digital" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" name={isRTL ? "رقمي" : "Digital"} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Interactions */}
              <Card>
                <CardHeader>
                  <CardTitle>{isRTL ? 'التفاعلات الأخيرة' : 'Recent Interactions'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {customerData.interactions.recent.map((interaction) => (
                        <div key={interaction.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                          <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center",
                            interaction.type === 'Call' && "bg-blue-100",
                            interaction.type === 'Email' && "bg-green-100",
                            interaction.type === 'Visit' && "bg-purple-100"
                          )}>
                            {interaction.type === 'Call' && <PhoneCall className="h-5 w-5 text-blue-600" />}
                            {interaction.type === 'Email' && <Mail className="h-5 w-5 text-green-600" />}
                            {interaction.type === 'Visit' && <Building2 className="h-5 w-5 text-purple-600" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">{interaction.purpose}</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {interaction.officer} • {interaction.department}
                                </p>
                                {interaction.duration && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    <Clock className="h-3 w-3 inline mr-1" />
                                    {interaction.duration}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-600">{interaction.date}</p>
                                <Badge variant="outline" className="mt-1">
                                  {interaction.outcome}
                                </Badge>
                              </div>
                            </div>
                            {interaction.satisfaction && (
                              <div className="flex items-center gap-1 mt-2">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={cn(
                                      "h-3 w-3",
                                      i < interaction.satisfaction
                                        ? "text-yellow-400 fill-yellow-400"
                                        : "text-gray-300"
                                    )}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {isRTL ? 'نقاط الدفع' : 'Payment Score'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">{customerData.payment_behavior.payment_score}/100</p>
                    <Progress value={customerData.payment_behavior.payment_score} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {isRTL ? 'دفعات في الوقت' : 'On-Time Payments'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{customerData.payment_behavior.on_time_payments}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {isRTL ? `${customerData.payment_behavior.late_payments} متأخرة` : `${customerData.payment_behavior.late_payments} late`}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {isRTL ? 'متوسط التأخير' : 'Avg Days Late'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-orange-600">{customerData.payment_behavior.avg_days_late}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {isRTL ? 'أيام' : 'days'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {isRTL ? 'طريقة الدفع' : 'Payment Method'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-medium">{customerData.payment_behavior.preferred_payment_method}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {isRTL ? 'الطريقة المفضلة' : 'Preferred method'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>{isRTL ? 'سجل المدفوعات' : 'Payment History'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={customerData.payment_behavior.monthly_trend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="onTime" fill="#10b981" name={isRTL ? "في الوقت" : "On Time"} />
                        <Bar yAxisId="left" dataKey="late" fill="#ef4444" name={isRTL ? "متأخر" : "Late"} />
                        <Line yAxisId="right" type="monotone" dataKey="amount" stroke="#E6B800" strokeWidth={2} name={isRTL ? "المبلغ" : "Amount"} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Collection History */}
              {customerData.collection_history.total_cases > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{isRTL ? 'سجل التحصيل' : 'Collection History'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold">{customerData.collection_history.total_cases}</p>
                        <p className="text-sm text-gray-600">{isRTL ? 'إجمالي الحالات' : 'Total Cases'}</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{customerData.collection_history.resolved_cases}</p>
                        <p className="text-sm text-gray-600">{isRTL ? 'حالات محلولة' : 'Resolved'}</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(customerData.collection_history.total_collected)}</p>
                        <p className="text-sm text-gray-600">{isRTL ? 'مبلغ محصل' : 'Collected'}</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">{customerData.collection_history.avg_resolution_days}</p>
                        <p className="text-sm text-gray-600">{isRTL ? 'متوسط أيام الحل' : 'Avg Resolution Days'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Behavior Tab */}
            <TabsContent value="behavior" className="space-y-6">
              {/* Spending Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle>{isRTL ? 'أنماط الإنفاق' : 'Spending Patterns'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={customerData.transaction_patterns.top_categories}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ category, percentage }) => `${category} ${percentage}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="percentage"
                          >
                            {customerData.transaction_patterns.top_categories.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-3">
                      {customerData.transaction_patterns.top_categories.map((category, index) => (
                        <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className="font-medium">{category.category}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(category.amount)}</p>
                            <p className="text-sm text-gray-600">{category.percentage}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Spending Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>{isRTL ? 'اتجاه الإنفاق الشهري' : 'Monthly Spending Trend'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={customerData.transaction_patterns.monthly_spending}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="spending" stroke="#E6B800" strokeWidth={2} name={isRTL ? "الإنفاق" : "Spending"} />
                        <Bar yAxisId="right" dataKey="transactions" fill="#3b82f6" opacity={0.3} name={isRTL ? "عدد العمليات" : "Transactions"} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Engagement Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle>{isRTL ? 'تفضيلات التواصل' : 'Engagement Preferences'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-2">{isRTL ? 'التفضيلات' : 'Preferences'}</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <span className="text-sm">{isRTL ? 'وقت التواصل' : 'Contact Time'}</span>
                            <Badge>{customerData.engagement_metrics.preferences.contact_time}</Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <span className="text-sm">{isRTL ? 'طريقة التواصل' : 'Contact Method'}</span>
                            <Badge>{customerData.engagement_metrics.preferences.contact_method}</Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <span className="text-sm">{isRTL ? 'اللغة' : 'Language'}</span>
                            <Badge>{customerData.engagement_metrics.preferences.language}</Badge>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-2">{isRTL ? 'الاهتمامات' : 'Interests'}</h4>
                        <div className="flex flex-wrap gap-2">
                          {customerData.engagement_metrics.preferences.product_interests.map((interest) => (
                            <Badge key={interest} variant="secondary">{interest}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-2">{isRTL ? 'معدلات التفاعل' : 'Engagement Rates'}</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">{isRTL ? 'معدل فتح البريد' : 'Email Open Rate'}</span>
                              <span className="text-sm font-medium">{customerData.engagement_metrics.email_open_rate}%</span>
                            </div>
                            <Progress value={customerData.engagement_metrics.email_open_rate} />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">{isRTL ? 'معدل الرد على الرسائل' : 'SMS Response Rate'}</span>
                              <span className="text-sm font-medium">{customerData.engagement_metrics.sms_response_rate}%</span>
                            </div>
                            <Progress value={customerData.engagement_metrics.sms_response_rate} />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">{isRTL ? 'التبني الرقمي' : 'Digital Adoption'}</span>
                              <span className="text-sm font-medium">{customerData.engagement_metrics.digital_adoption}%</span>
                            </div>
                            <Progress value={customerData.engagement_metrics.digital_adoption} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Risk Tab */}
            <TabsContent value="risk" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {isRTL ? 'نقاط المخاطر' : 'Risk Score'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{customerData.risk_profile.current_score}</p>
                    <Progress value={customerData.risk_profile.current_score / 10} className="mt-2" />
                    <p className="text-xs text-gray-500 mt-1">
                      {customerData.risk_profile.trend === 'Improving' ? (
                        <TrendingDown className="h-3 w-3 inline mr-1 text-green-500" />
                      ) : (
                        <TrendingUp className="h-3 w-3 inline mr-1 text-red-500" />
                      )}
                      {customerData.risk_profile.trend}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {isRTL ? 'احتمال التعثر' : 'Default Probability'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">{customerData.risk_profile.predictions.default_probability}%</p>
                    <p className="text-xs text-gray-500 mt-1">{isRTL ? 'منخفض' : 'Low'}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {isRTL ? 'احتمال المغادرة' : 'Churn Probability'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-orange-600">{customerData.risk_profile.predictions.churn_probability}%</p>
                    <p className="text-xs text-gray-500 mt-1">{isRTL ? 'متوسط' : 'Medium'}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {isRTL ? 'تغيير الفئة' : 'Category Change'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-medium">{customerData.risk_profile.predictions.risk_category_change}</p>
                    <p className="text-xs text-gray-500 mt-1">{isRTL ? 'لا يوجد تغيير متوقع' : 'No change expected'}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Risk Factors */}
              <Card>
                <CardHeader>
                  <CardTitle>{isRTL ? 'عوامل المخاطر' : 'Risk Factors'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {customerData.risk_profile.factors.map((factor) => (
                      <div key={factor.factor}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{factor.factor}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant={factor.status === 'Positive' ? 'default' : factor.status === 'Negative' ? 'destructive' : 'secondary'}>
                              {factor.status}
                            </Badge>
                            <span className="text-sm font-medium">{factor.impact}%</span>
                          </div>
                        </div>
                        <Progress value={factor.impact} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Predictions */}
              <Card>
                <CardHeader>
                  <CardTitle>{isRTL ? 'التنبؤات والتوصيات' : 'Predictions & Recommendations'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        {isRTL 
                          ? `احتمالية عالية (${customerData.risk_profile.predictions.upsell_probability}%) للاستجابة لعروض المنتجات الاستثمارية`
                          : `High probability (${customerData.risk_profile.predictions.upsell_probability}%) of responding to investment product offers`}
                      </AlertDescription>
                    </Alert>
                    
                    {customerData.risk_profile.predictions.default_probability > 5 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {isRTL 
                            ? 'يُنصح بالمتابعة الاستباقية لتجنب التعثر المحتمل'
                            : 'Proactive follow-up recommended to prevent potential default'}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {customerData.risk_profile.predictions.churn_probability > 20 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {isRTL 
                            ? 'يُنصح ببرنامج الاحتفاظ بالعملاء لتقليل مخاطر المغادرة'
                            : 'Customer retention program recommended to reduce churn risk'}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isRTL ? 'ابحث عن عميل' : 'Search for a customer'}
            </h3>
            <p className="text-gray-600">
              {isRTL 
                ? 'ابدأ بالبحث عن عميل لعرض بصمته الرقمية الشاملة'
                : 'Start by searching for a customer to view their comprehensive digital footprint'}
            </p>
          </div>
        </div>
      )}

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRTL ? 'تصدير تقرير العميل' : 'Export Customer Report'}</DialogTitle>
            <DialogDescription>
              {isRTL ? 'اختر تنسيق التصدير المطلوب' : 'Choose your preferred export format'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Button variant="outline" onClick={() => handleExport('pdf')}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" onClick={() => handleExport('excel')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Excel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRTL ? 'مشاركة تقرير العميل' : 'Share Customer Report'}</DialogTitle>
            <DialogDescription>
              {isRTL ? 'شارك هذا التقرير مع أعضاء الفريق' : 'Share this report with team members'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input 
              placeholder={isRTL ? "أدخل البريد الإلكتروني..." : "Enter email addresses..."} 
            />
            <Button className="w-full">
              <Share2 className="h-4 w-4 mr-2" />
              {isRTL ? 'إرسال' : 'Send'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerFootprintDashboard;