import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Briefcase, Shield, Star, Target, Zap, BarChart3, PieChart as PieChartIcon,
  Menu, ChevronLeft
} from 'lucide-react';
import { format, parseISO, differenceInDays, addDays, subMonths } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import CustomerFootprintService from '@/services/customerFootprintService';
import '@/styles/customer-footprint.css';

const CustomerFootprintDashboard = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
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
  const [branches, setBranches] = useState([]);
  const [showCustomerList, setShowCustomerList] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scrollRef = useRef(null);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setShowCustomerList(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Colors
  const COLORS = ['#E6B800', '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Re-search when filters change
  useEffect(() => {
    if (searchQuery.trim() || filters.branch !== 'all') {
      handleSearch();
    }
  }, [filters]);

  // Fetch branches on mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const result = await CustomerFootprintService.getBranches();
        if (result.success) {
          setBranches(result.data);
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    };
    fetchBranches();
  }, []);

  // Load initial customers on mount
  useEffect(() => {
    loadAllCustomers();
  }, []);

  // Load all customers with pagination
  const loadAllCustomers = async (page = 1, append = false) => {
    if (loadingMore && append) return;
    
    setLoadingMore(append);
    try {
      const result = await CustomerFootprintService.searchCustomers('', {
        ...filters,
        page,
        limit: 20
      });
      
      if (result.success) {
        if (append) {
          setAllCustomers(prev => [...prev, ...result.data]);
        } else {
          setAllCustomers(result.data);
        }
        setHasMore(result.data.length === 20);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle scroll for infinite loading
  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMore && !loadingMore) {
      loadAllCustomers(currentPage + 1, true);
    }
  }, [currentPage, hasMore, loadingMore]);

  // Search customers
  const handleSearch = async () => {
    if (!searchQuery.trim() && filters.branch === 'all') {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const result = await CustomerFootprintService.searchCustomers(searchQuery, filters);
      if (result.success) {
        setSearchResults(result.data);
      } else {
        console.error('Search failed:', result.error);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
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

  // Refresh data when tab changes
  useEffect(() => {
    if (selectedCustomer && customerData) {
      // Refresh specific tab data when tab changes
      refreshTabData(activeTab);
    }
  }, [activeTab]);

  // Refresh specific tab data
  const refreshTabData = async (tab) => {
    if (!selectedCustomer) return;
    
    try {
      switch(tab) {
        case 'products':
          const products = await CustomerFootprintService.getCustomerProducts(selectedCustomer.customer_id);
          if (products.success) {
            setCustomerData(prev => ({ ...prev, products: products.data }));
          }
          break;
        case 'interactions':
          const interactions = await CustomerFootprintService.getCustomerInteractions(selectedCustomer.customer_id, filters);
          if (interactions.success) {
            setCustomerData(prev => ({ ...prev, interactions: interactions.data }));
          }
          break;
        case 'payments':
          const payments = await CustomerFootprintService.getPaymentBehavior(selectedCustomer.customer_id);
          if (payments.success) {
            setCustomerData(prev => ({ ...prev, payment_behavior: payments.data }));
          }
          break;
        case 'behavior':
          const behavior = await CustomerFootprintService.getTransactionPatterns(selectedCustomer.customer_id);
          if (behavior.success) {
            setCustomerData(prev => ({ ...prev, transaction_patterns: behavior.data }));
          }
          break;
        case 'risk':
          const risk = await CustomerFootprintService.getRiskProfile(selectedCustomer.customer_id);
          if (risk.success) {
            setCustomerData(prev => ({ ...prev, risk_profile: risk.data }));
          }
          break;
      }
    } catch (error) {
      console.error(`Error refreshing ${tab} data:`, error);
    }
  };

  // Export report
  const handleExport = async (format) => {
    if (!selectedCustomer || !customerData) return;
    
    try {
      // For now, we'll implement a client-side export
      if (format === 'pdf') {
        // Create CSV content
        const csvContent = generateCSVContent(customerData);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `customer_footprint_${selectedCustomer.customer_id}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (format === 'excel') {
        // For Excel, we'll print the page
        window.print();
      }
    } catch (error) {
      console.error('Export error:', error);
    }
    setExportDialogOpen(false);
  };

  // Generate CSV content
  const generateCSVContent = (data) => {
    const lines = [];
    
    // Header
    lines.push('Customer Digital Footprint Report');
    lines.push(`Generated on: ${new Date().toLocaleString()}`);
    lines.push('');
    
    // Customer Info
    lines.push('Customer Information');
    lines.push(`Name,${data.profile.full_name}`);
    lines.push(`ID,${data.profile.customer_id}`);
    lines.push(`Segment,${data.profile.customer_segment}`);
    lines.push(`Risk Level,${data.profile.risk_category}`);
    lines.push('');
    
    // Products
    lines.push('Products');
    lines.push('Product Name,Type,Balance,Status');
    data.products.forEach(product => {
      lines.push(`${product.product_name},${product.type},${product.balance || product.outstanding || 0},${product.status}`);
    });
    lines.push('');
    
    // Interactions
    lines.push('Interaction Summary');
    lines.push(`Total Interactions,${data.interactions.summary.total}`);
    lines.push(`Calls,${data.interactions.summary.calls}`);
    lines.push(`Emails,${data.interactions.summary.emails}`);
    lines.push(`Digital,${data.interactions.summary.digital}`);
    
    return lines.join('\n');
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
      'LOW': 'text-green-600 bg-green-50',
      'Medium': 'text-yellow-600 bg-yellow-50',
      'MEDIUM': 'text-yellow-600 bg-yellow-50',
      'High': 'text-red-600 bg-red-50',
      'HIGH': 'text-red-600 bg-red-50'
    };
    return colors[risk] || 'text-gray-600 bg-gray-50';
  };

  // Export customer list to CSV
  const handleExportCustomerList = async () => {
    try {
      const csvContent = generateCSVContentForList(allCustomers);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `all_customers_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting customer list:', error);
    }
  };

  // Generate CSV content for customer list
  const generateCSVContentForList = (customers) => {
    const lines = [];
    lines.push('Customer List');
    lines.push('Customer ID,Name,National ID,Phone,Email,Segment,Risk Level,Loyalty Score,Days with Bank,Total Value');
    customers.forEach(customer => {
      lines.push(`${customer.customer_id},${customer.full_name},${customer.national_id},${customer.phone_number},${customer.email},${customer.customer_segment},${customer.risk_category},${customer.loyalty_score},${customer.customer_since_days},${customer.total_relationship_value}`);
    });
    return lines.join('\n');
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="sm:hidden"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <User className="h-6 sm:h-8 w-6 sm:w-8 text-primary flex-shrink-0" />
              <div className="flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                  {isRTL ? 'لوحة البصمة الرقمية للعميل' : 'Customer Digital Footprint'}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                  {isRTL ? 'تحليل شامل لسلوك وتفاعلات العملاء' : 'Comprehensive analysis of customer behavior and interactions'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {!isMobile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomerList(!showCustomerList)}
                >
                  <Users className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">{isRTL ? 'قائمة العملاء' : 'Customer List'}</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCustomerList}
                className="hidden sm:flex"
              >
                <Download className="h-4 w-4" />
                <span className="ml-2 hidden lg:inline">{isRTL ? 'تصدير القائمة' : 'Export List'}</span>
              </Button>
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
                    className="hidden sm:flex"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                    className="hidden sm:flex"
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setExportDialogOpen(true)}
                  >
                    <Download className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{isRTL ? 'تصدير' : 'Export'}</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobile && mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
            {/* Mobile Customer List */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">{isRTL ? 'قائمة العملاء' : 'Customer List'}</h3>
              <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <CustomerListSidebar />
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-80px)]">
        {/* Customer List Sidebar - Desktop */}
        {!isMobile && showCustomerList && (
          <div className="w-80 bg-white border-r flex flex-col">
            <CustomerListSidebar />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">{isRTL ? 'جاري تحميل البيانات...' : 'Loading data...'}</p>
              </div>
            </div>
          ) : customerData ? (
            <div className="p-4 sm:p-6">
              {/* Customer Header */}
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
                  <div className="flex items-start gap-3 sm:gap-4 w-full lg:w-auto">
                    <div className="h-12 w-12 sm:h-16 sm:w-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{customerData.profile.full_name}</h2>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="truncate">{customerData.profile.national_id || customerData.profile.tax_id}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{customerData.profile.phone_number}</span>
                        </div>
                        <div className="flex items-center gap-1 hidden sm:flex">
                          <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="truncate">{customerData.profile.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{customerData.profile.branch?.branch_name}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <Badge variant="outline" className="text-xs">{customerData.profile.customer_type || customerData.profile.customer_segment}</Badge>
                        <Badge variant="outline" className="text-xs">{customerData.profile.customer_segment}</Badge>
                        <Badge className={cn("text-xs", getRiskColor(customerData.profile.risk_category))}>
                          {customerData.profile.risk_category} Risk
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          {isRTL ? `نقاط الولاء: ${customerData.profile.loyalty_score}` : `Loyalty: ${customerData.profile.loyalty_score}`}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center w-full lg:w-auto">
                    <div>
                      <p className="text-lg sm:text-2xl font-bold text-primary">{formatNumber(customerData.profile.customer_since_days)}</p>
                      <p className="text-xs text-gray-600">{isRTL ? 'يوم مع البنك' : 'Days with Bank'}</p>
                    </div>
                    <div>
                      <p className="text-lg sm:text-2xl font-bold text-green-600">{formatCurrency(customerData.profile.total_relationship_value)}</p>
                      <p className="text-xs text-gray-600">{isRTL ? 'إجمالي القيمة' : 'Total Value'}</p>
                    </div>
                    <div>
                      <p className="text-lg sm:text-2xl font-bold text-blue-600">{customerData.products.length}</p>
                      <p className="text-xs text-gray-600">{isRTL ? 'منتجات نشطة' : 'Active Products'}</p>
                    </div>
                    <div>
                      <p className="text-lg sm:text-2xl font-bold text-orange-600">{customerData.profile.churn_probability}%</p>
                      <p className="text-xs text-gray-600">{isRTL ? 'احتمال المغادرة' : 'Churn Risk'}</p>
                    </div>
                  </div>
                </div>

                {/* Relationship Manager */}
                {customerData.profile.relationship_manager && (
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{isRTL ? 'مدير العلاقة' : 'Relationship Manager'}</p>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm sm:text-base">{customerData.profile.relationship_manager?.full_name}</p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs sm:text-sm text-gray-600">
                              <span>{customerData.profile.relationship_manager?.phone_number}</span>
                              <span className="hidden sm:inline">•</span>
                              <span className="truncate">{customerData.profile.relationship_manager?.email}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">{isRTL ? 'تواصل' : 'Contact'}</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
                <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full">
                  <TabsTrigger value="overview" className="text-xs sm:text-sm">{isRTL ? 'نظرة عامة' : 'Overview'}</TabsTrigger>
                  <TabsTrigger value="products" className="text-xs sm:text-sm">{isRTL ? 'المنتجات' : 'Products'}</TabsTrigger>
                  <TabsTrigger value="interactions" className="text-xs sm:text-sm">{isRTL ? 'التفاعلات' : 'Interactions'}</TabsTrigger>
                  <TabsTrigger value="payments" className="text-xs sm:text-sm">{isRTL ? 'المدفوعات' : 'Payments'}</TabsTrigger>
                  <TabsTrigger value="behavior" className="text-xs sm:text-sm">{isRTL ? 'السلوك' : 'Behavior'}</TabsTrigger>
                  <TabsTrigger value="risk" className="text-xs sm:text-sm">{isRTL ? 'المخاطر' : 'Risk'}</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">
                          {isRTL ? 'القيمة الدائمة' : 'Lifetime Value'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(customerData.profile.lifetime_value)}</p>
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
                        <p className="text-xl sm:text-2xl font-bold">{customerData.risk_profile.current_score}</p>
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
                        <p className="text-xl sm:text-2xl font-bold text-blue-600">{customerData.engagement_metrics.digital_adoption}%</p>
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
                        <p className="text-xl sm:text-2xl font-bold">{customerData.engagement_metrics.nps_score}/10</p>
                        <div className="flex items-center gap-1 mt-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "h-3 w-3 sm:h-4 sm:w-4",
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
                      <CardTitle className="text-base sm:text-lg">{isRTL ? 'رؤى سريعة' : 'Quick Insights'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Alert>
                          <Zap className="h-4 w-4" />
                          <AlertDescription className="text-xs sm:text-sm">
                            {isRTL 
                              ? `العميل لديه احتمالية عالية (${customerData.risk_profile.predictions.upsell_probability}%) لشراء منتجات استثمارية`
                              : `Customer has high probability (${customerData.risk_profile.predictions.upsell_probability}%) for investment products`}
                          </AlertDescription>
                        </Alert>
                        <Alert>
                          <Target className="h-4 w-4" />
                          <AlertDescription className="text-xs sm:text-sm">
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
                <TabsContent value="products" className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                    {customerData.products.map((product) => (
                      <Card key={product.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base sm:text-lg">{product.product_name}</CardTitle>
                              <CardDescription className="text-xs sm:text-sm">{product.type}</CardDescription>
                            </div>
                            <Badge variant={product.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                              {product.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {product.type === 'قرض تورق' && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-xs sm:text-sm text-gray-600">{isRTL ? 'مبلغ القرض' : 'Loan Amount'}</span>
                                  <span className="font-medium text-sm">{formatCurrency(product.amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs sm:text-sm text-gray-600">{isRTL ? 'المبلغ المتبقي' : 'Outstanding'}</span>
                                  <span className="font-medium text-orange-600 text-sm">{formatCurrency(product.outstanding)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs sm:text-sm text-gray-600">{isRTL ? 'القسط الشهري' : 'Monthly Payment'}</span>
                                  <span className="font-medium text-sm">{formatCurrency(product.monthly_payment)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs sm:text-sm text-gray-600">{isRTL ? 'الدفعة القادمة' : 'Next Payment'}</span>
                                  <span className="font-medium text-sm">{product.next_payment_date ? format(parseISO(product.next_payment_date), 'dd MMM yyyy') : 'N/A'}</span>
                                </div>
                                <Progress value={(1 - product.outstanding / product.amount) * 100} className="mt-2" />
                              </>
                            )}
                            
                            {product.type === 'بطاقة ائتمان' && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-xs sm:text-sm text-gray-600">{isRTL ? 'الحد الائتماني' : 'Credit Limit'}</span>
                                  <span className="font-medium text-sm">{formatCurrency(product.credit_limit)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs sm:text-sm text-gray-600">{isRTL ? 'المستخدم' : 'Outstanding'}</span>
                                  <span className="font-medium text-orange-600 text-sm">{formatCurrency(product.outstanding)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs sm:text-sm text-gray-600">{isRTL ? 'نسبة الاستخدام' : 'Utilization'}</span>
                                  <span className="font-medium text-sm">{product.utilization}%</span>
                                </div>
                                <Progress value={product.utilization} className="mt-2" />
                              </>
                            )}
                            
                            {product.type === 'حساب جاري' && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-xs sm:text-sm text-gray-600">{isRTL ? 'الرصيد الحالي' : 'Current Balance'}</span>
                                  <span className="font-medium text-green-600 text-sm">{formatCurrency(product.balance)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs sm:text-sm text-gray-600">{isRTL ? 'متوسط الرصيد' : 'Avg Balance'}</span>
                                  <span className="font-medium text-sm">{formatCurrency(product.avg_monthly_balance)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs sm:text-sm text-gray-600">{isRTL ? 'عدد العمليات' : 'Transactions'}</span>
                                  <span className="font-medium text-sm">{formatNumber(product.transactions_count)}</span>
                                </div>
                              </>
                            )}
                            
                            <Separator />
                            <div className="flex justify-between text-xs sm:text-sm">
                              <span className="text-gray-600">{isRTL ? 'تاريخ البداية' : 'Start Date'}</span>
                              <span>{product.start_date ? format(parseISO(product.start_date), 'dd MMM yyyy') : 'N/A'}</span>
                            </div>
                            {product.branch && (
                              <div className="flex justify-between text-xs sm:text-sm">
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
                      <CardTitle className="text-base sm:text-lg">{isRTL ? 'توزيع المنتجات' : 'Product Distribution'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {customerData.products && customerData.products.length > 0 ? (
                        <div className="h-60 sm:h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={customerData.products.map((p, i) => ({
                                  name: p.product_name,
                                  value: p.outstanding || p.balance || p.amount || 1 // Use 1 as minimum to show chart
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
                      ) : (
                        <div className="h-60 sm:h-80 flex items-center justify-center">
                          <div className="text-center">
                            <PieChartIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">{isRTL ? 'لا توجد منتجات نشطة' : 'No active products'}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Interactions Tab */}
                <TabsContent value="interactions" className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                          {isRTL ? 'إجمالي التفاعلات' : 'Total Interactions'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl sm:text-2xl font-bold">{formatNumber(customerData.interactions.summary.total)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {isRTL ? `آخر تواصل: ${customerData.interactions.summary.last_contact ? format(parseISO(customerData.interactions.summary.last_contact), 'dd MMM yyyy') : 'N/A'}` : `Last contact: ${customerData.interactions.summary.last_contact ? format(parseISO(customerData.interactions.summary.last_contact), 'dd MMM yyyy') : 'N/A'}`}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                          {isRTL ? 'المكالمات' : 'Calls'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl sm:text-2xl font-bold text-blue-600">{formatNumber(customerData.interactions.summary.calls)}</p>
                        <div className="flex gap-2 mt-2">
                          <PhoneCall className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                          <Progress value={(customerData.interactions.summary.calls / customerData.interactions.summary.total) * 100} className="flex-1" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                          {isRTL ? 'الرسائل' : 'Messages'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl sm:text-2xl font-bold text-green-600">
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
                        <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                          {isRTL ? 'تسجيلات الدخول' : 'Digital Logins'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl sm:text-2xl font-bold text-purple-600">{formatNumber(customerData.interactions.summary.digital_logins)}</p>
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
                      <CardTitle className="text-base sm:text-lg">{isRTL ? 'تطور التفاعلات' : 'Interaction Timeline'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {customerData.interactions.timeline && customerData.interactions.timeline.length > 0 && 
                       customerData.interactions.summary.total > 0 ? (
                        <div className="h-60 sm:h-80">
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
                      ) : (
                        <div className="h-60 sm:h-80 flex items-center justify-center">
                          <div className="text-center">
                            <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">{isRTL ? 'لا توجد تفاعلات مسجلة' : 'No interactions recorded'}</p>
                            <p className="text-sm text-gray-400 mt-1">
                              {isRTL ? 'ستظهر التفاعلات هنا عند توفرها' : 'Interactions will appear here when available'}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Interactions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">{isRTL ? 'التفاعلات الأخيرة' : 'Recent Interactions'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-72 sm:h-96">
                        <div className="space-y-4">
                          {customerData.interactions.recent.map((interaction) => (
                            <div key={interaction.id} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                              <div className={cn(
                                "h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center flex-shrink-0",
                                interaction.type === 'Call' && "bg-blue-100",
                                interaction.type === 'Email' && "bg-green-100",
                                interaction.type === 'Visit' && "bg-purple-100"
                              )}>
                                {interaction.type === 'Call' && <PhoneCall className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />}
                                {interaction.type === 'Email' && <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />}
                                {interaction.type === 'Visit' && <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-medium text-sm">{interaction.purpose}</h4>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                      {interaction.officer} • {interaction.department}
                                    </p>
                                    {interaction.duration && (
                                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                        <Clock className="h-3 w-3 inline mr-1" />
                                        {interaction.duration}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs sm:text-sm text-gray-600">{interaction.date ? format(parseISO(interaction.date), 'dd MMM yyyy') : 'N/A'}</p>
                                    <Badge variant="outline" className="mt-1 text-xs">
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
                <TabsContent value="payments" className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                          {isRTL ? 'نقاط الدفع' : 'Payment Score'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl sm:text-2xl font-bold text-green-600">{customerData.payment_behavior.payment_score}/100</p>
                        <Progress value={customerData.payment_behavior.payment_score} className="mt-2" />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                          {isRTL ? 'دفعات في الوقت' : 'On-Time Payments'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl sm:text-2xl font-bold">{customerData.payment_behavior.on_time_payments}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {isRTL ? `${customerData.payment_behavior.late_payments} متأخرة` : `${customerData.payment_behavior.late_payments} late`}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                          {isRTL ? 'متوسط التأخير' : 'Avg Days Late'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl sm:text-2xl font-bold text-orange-600">{customerData.payment_behavior.avg_days_late}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {isRTL ? 'أيام' : 'days'}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                          {isRTL ? 'طريقة الدفع' : 'Payment Method'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm sm:text-lg font-medium">{customerData.payment_behavior.preferred_payment_method}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {isRTL ? 'الطريقة المفضلة' : 'Preferred method'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Payment Trend Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">{isRTL ? 'سجل المدفوعات' : 'Payment History'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-60 sm:h-80">
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
                        <CardTitle className="text-base sm:text-lg">{isRTL ? 'سجل التحصيل' : 'Collection History'}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                            <p className="text-xl sm:text-2xl font-bold">{customerData.collection_history.total_cases}</p>
                            <p className="text-xs sm:text-sm text-gray-600">{isRTL ? 'إجمالي الحالات' : 'Total Cases'}</p>
                          </div>
                          <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                            <p className="text-xl sm:text-2xl font-bold text-green-600">{customerData.collection_history.resolved_cases}</p>
                            <p className="text-xs sm:text-sm text-gray-600">{isRTL ? 'حالات محلولة' : 'Resolved'}</p>
                          </div>
                          <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                            <p className="text-xl sm:text-2xl font-bold text-blue-600">{formatCurrency(customerData.collection_history.total_collected)}</p>
                            <p className="text-xs sm:text-sm text-gray-600">{isRTL ? 'مبلغ محصل' : 'Collected'}</p>
                          </div>
                          <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
                            <p className="text-xl sm:text-2xl font-bold text-purple-600">{customerData.collection_history.avg_resolution_days}</p>
                            <p className="text-xs sm:text-sm text-gray-600">{isRTL ? 'متوسط أيام الحل' : 'Avg Resolution Days'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Behavior Tab */}
                <TabsContent value="behavior" className="space-y-4 sm:space-y-6">
                  {/* Spending Patterns */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">{isRTL ? 'أنماط الإنفاق' : 'Spending Patterns'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        <div className="h-60 sm:h-80">
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
                                <span className="font-medium text-sm">{category.category}</span>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-sm">{formatCurrency(category.amount)}</p>
                                <p className="text-xs sm:text-sm text-gray-600">{category.percentage}%</p>
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
                      <CardTitle className="text-base sm:text-lg">{isRTL ? 'اتجاه الإنفاق الشهري' : 'Monthly Spending Trend'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-60 sm:h-80">
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
                      <CardTitle className="text-base sm:text-lg">{isRTL ? 'تفضيلات التواصل' : 'Engagement Preferences'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-2">{isRTL ? 'التفضيلات' : 'Preferences'}</h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <span className="text-xs sm:text-sm">{isRTL ? 'وقت التواصل' : 'Contact Time'}</span>
                                <Badge className="text-xs">{customerData.engagement_metrics.preferences.contact_time}</Badge>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <span className="text-xs sm:text-sm">{isRTL ? 'طريقة التواصل' : 'Contact Method'}</span>
                                <Badge className="text-xs">{customerData.engagement_metrics.preferences.contact_method}</Badge>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <span className="text-xs sm:text-sm">{isRTL ? 'اللغة' : 'Language'}</span>
                                <Badge className="text-xs">{customerData.engagement_metrics.preferences.language}</Badge>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-2">{isRTL ? 'الاهتمامات' : 'Interests'}</h4>
                            <div className="flex flex-wrap gap-2">
                              {customerData.engagement_metrics.preferences.product_interests.map((interest) => (
                                <Badge key={interest} variant="secondary" className="text-xs">{interest}</Badge>
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
                                  <span className="text-xs sm:text-sm">{isRTL ? 'معدل فتح البريد' : 'Email Open Rate'}</span>
                                  <span className="text-xs sm:text-sm font-medium">{customerData.engagement_metrics.email_open_rate}%</span>
                                </div>
                                <Progress value={customerData.engagement_metrics.email_open_rate} />
                              </div>
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-xs sm:text-sm">{isRTL ? 'معدل الرد على الرسائل' : 'SMS Response Rate'}</span>
                                  <span className="text-xs sm:text-sm font-medium">{customerData.engagement_metrics.sms_response_rate}%</span>
                                </div>
                                <Progress value={customerData.engagement_metrics.sms_response_rate} />
                              </div>
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-xs sm:text-sm">{isRTL ? 'التبني الرقمي' : 'Digital Adoption'}</span>
                                  <span className="text-xs sm:text-sm font-medium">{customerData.engagement_metrics.digital_adoption}%</span>
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
                <TabsContent value="risk" className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                          {isRTL ? 'نقاط المخاطر' : 'Risk Score'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl sm:text-2xl font-bold">{customerData.risk_profile.current_score}</p>
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
                        <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                          {isRTL ? 'احتمال التعثر' : 'Default Probability'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl sm:text-2xl font-bold text-green-600">{customerData.risk_profile.predictions.default_probability}%</p>
                        <p className="text-xs text-gray-500 mt-1">{isRTL ? 'منخفض' : 'Low'}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                          {isRTL ? 'احتمال المغادرة' : 'Churn Probability'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl sm:text-2xl font-bold text-orange-600">{customerData.risk_profile.predictions.churn_probability}%</p>
                        <p className="text-xs text-gray-500 mt-1">{isRTL ? 'متوسط' : 'Medium'}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                          {isRTL ? 'تغيير الفئة' : 'Category Change'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm sm:text-lg font-medium">{customerData.risk_profile.predictions.risk_category_change}</p>
                        <p className="text-xs text-gray-500 mt-1">{isRTL ? 'لا يوجد تغيير متوقع' : 'No change expected'}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Risk Factors */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">{isRTL ? 'عوامل المخاطر' : 'Risk Factors'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {customerData.risk_profile.factors.map((factor) => (
                          <div key={factor.factor}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs sm:text-sm font-medium">{factor.factor}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant={factor.status === 'Positive' ? 'default' : factor.status === 'Negative' ? 'destructive' : 'secondary'} className="text-xs">
                                  {factor.status}
                                </Badge>
                                <span className="text-xs sm:text-sm font-medium">{factor.impact}%</span>
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
                      <CardTitle className="text-base sm:text-lg">{isRTL ? 'التنبؤات والتوصيات' : 'Predictions & Recommendations'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription className="text-xs sm:text-sm">
                            {isRTL 
                              ? `احتمالية عالية (${customerData.risk_profile.predictions.upsell_probability}%) للاستجابة لعروض المنتجات الاستثمارية`
                              : `High probability (${customerData.risk_profile.predictions.upsell_probability}%) of responding to investment product offers`}
                          </AlertDescription>
                        </Alert>
                        
                        {customerData.risk_profile.predictions.default_probability > 5 && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs sm:text-sm">
                              {isRTL 
                                ? 'يُنصح بالمتابعة الاستباقية لتجنب التعثر المحتمل'
                                : 'Proactive follow-up recommended to prevent potential default'}
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        {customerData.risk_profile.predictions.churn_probability > 20 && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs sm:text-sm">
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
            <div className="flex items-center justify-center h-full p-4">
              <div className="text-center">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {isRTL ? 'اختر عميلاً' : 'Select a customer'}
                </h3>
                <p className="text-gray-600">
                  {isRTL 
                    ? 'اختر عميلاً من القائمة لعرض بصمته الرقمية الشاملة'
                    : 'Select a customer from the list to view their comprehensive digital footprint'}
                </p>
                {isMobile && (
                  <Button 
                    className="mt-4" 
                    onClick={() => setMobileMenuOpen(true)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {isRTL ? 'عرض قائمة العملاء' : 'Show Customer List'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

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

  // Customer List Sidebar Component
  function CustomerListSidebar() {
    return (
      <>
        {/* Search Section */}
        <div className="p-4 border-b">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder={isRTL ? "البحث عن العملاء..." : "Search customers..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 w-full text-sm"
            />
          </div>
          
          {/* Filters */}
          <Select value={filters.branch} onValueChange={(v) => setFilters({...filters, branch: v})}>
            <SelectTrigger className="w-full mb-2 text-sm">
              <SelectValue placeholder={isRTL ? "الفرع" : "Branch"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? "جميع الفروع" : "All Branches"}</SelectItem>
              {branches.map(branch => (
                <SelectItem key={branch.branch_id} value={branch.branch_id}>
                  {branch.branch_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.riskCategory} onValueChange={(v) => setFilters({...filters, riskCategory: v})}>
            <SelectTrigger className="w-full text-sm">
              <SelectValue placeholder={isRTL ? "فئة المخاطر" : "Risk Category"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? "جميع الفئات" : "All Categories"}</SelectItem>
              <SelectItem value="low">{isRTL ? "منخفض" : "Low"}</SelectItem>
              <SelectItem value="medium">{isRTL ? "متوسط" : "Medium"}</SelectItem>
              <SelectItem value="high">{isRTL ? "عالي" : "High"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Customer List */}
        <ScrollArea 
          className="flex-1" 
          onScroll={handleScroll}
          ref={scrollRef}
        >
          <div className="p-2">
            {searching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                {/* Search Results */}
                {searchResults.length > 0 ? (
                  <>
                    <p className="text-sm text-gray-600 px-2 mb-2">
                      {isRTL ? 'نتائج البحث' : 'Search Results'} ({searchResults.length})
                    </p>
                    {searchResults.map((customer) => (
                      <CustomerListItem
                        key={customer.customer_id}
                        customer={customer}
                        isSelected={selectedCustomer?.customer_id === customer.customer_id}
                        onClick={() => {
                          handleCustomerSelect(customer);
                          if (isMobile) setMobileMenuOpen(false);
                        }}
                        getRiskColor={getRiskColor}
                      />
                    ))}
                  </>
                ) : (
                  <>
                    {/* All Customers with Pagination */}
                    <div className="flex items-center justify-between px-2 mb-2">
                      <p className="text-sm text-gray-600">
                        {isRTL ? 'جميع العملاء' : 'All Customers'}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => loadAllCustomers(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="h-7 w-7 p-0"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-gray-600 px-2">
                          {currentPage}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => loadAllCustomers(currentPage + 1)}
                          disabled={!hasMore}
                          className="h-7 w-7 p-0"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {allCustomers.map((customer) => (
                      <CustomerListItem
                        key={customer.customer_id}
                        customer={customer}
                        isSelected={selectedCustomer?.customer_id === customer.customer_id}
                        onClick={() => {
                          handleCustomerSelect(customer);
                          if (isMobile) setMobileMenuOpen(false);
                        }}
                        getRiskColor={getRiskColor}
                      />
                    ))}
                    {loadingMore && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    )}
                    {!hasMore && allCustomers.length > 0 && (
                      <p className="text-center text-sm text-gray-500 py-4">
                        {isRTL ? 'لا يوجد المزيد من العملاء' : 'No more customers'}
                      </p>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </>
    );
  }
};

// Customer List Item Component
const CustomerListItem = ({ customer, isSelected, onClick, getRiskColor }) => {
  return (
    <div
      className={cn(
        "p-3 rounded-lg cursor-pointer transition-colors mb-2",
        isSelected ? "bg-primary/10 border border-primary" : "hover:bg-gray-50"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-gray-900 truncate">{customer.full_name}</h4>
          <p className="text-xs text-gray-600 mt-1">{customer.national_id}</p>
          <p className="text-xs text-gray-500">{customer.phone_number}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">{customer.customer_type}</Badge>
            <Badge className={cn("text-xs", getRiskColor(customer.risk_category))}>
              {customer.risk_category}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerFootprintDashboard;