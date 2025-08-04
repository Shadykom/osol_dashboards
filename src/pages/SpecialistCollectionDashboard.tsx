import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Phone, MessageSquare, MapPin, Calendar as CalendarIcon, Clock, 
  DollarSign, FileText, AlertTriangle, CheckCircle, XCircle,
  User, Building, CreditCard, TrendingUp, Filter, Search,
  ChevronRight, Plus, Save, Send, History
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format, addDays, isAfter, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';

interface CollectionCase {
  case_id: number;
  case_number: string;
  loan_account_number: string;
  customer_id: string;
  customer_name?: string;
  product_type?: string;
  total_outstanding: number;
  days_past_due: number;
  collateral_value?: number;
  collateral_type?: string;
  last_payment_date?: string;
  last_payment_amount?: number;
  priority: string;
  next_action_date?: string;
  ptp_amount?: number;
  ptp_date?: string;
  last_contact_date?: string;
}

interface Interaction {
  interaction_id: number;
  interaction_type: string;
  interaction_date: string;
  channel: string;
  outcome: string;
  notes: string;
  officer_name?: string;
}

const SpecialistCollectionDashboard = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<CollectionCase | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  
  // State for dashboard data
  const [portfolioSummary, setPortfolioSummary] = useState({
    totalCases: 0,
    totalOverdueAmount: 0,
    collectedThisMonth: 0,
    ptpScheduled: 0,
    successRate: 0
  });
  
  const [assignedCases, setAssignedCases] = useState<CollectionCase[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [todaysTasks, setTodaysTasks] = useState<any[]>([]);
  
  // Dialog states
  const [showInteractionDialog, setShowInteractionDialog] = useState(false);
  const [showPTPDialog, setShowPTPDialog] = useState(false);
  const [showRemediationDialog, setShowRemediationDialog] = useState(false);
  
  // Form states
  const [interactionForm, setInteractionForm] = useState({
    type: 'CALL',
    channel: 'PHONE',
    outcome: '',
    notes: '',
    nextAction: '',
    nextActionDate: new Date()
  });
  
  const [ptpForm, setPtpForm] = useState({
    amount: '',
    date: new Date(),
    notes: ''
  });

  // US-006: Fetch portfolio summary
  const fetchPortfolioSummary = async () => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      // Fetch assigned cases summary
      const { data: cases, error } = await supabase
        .from('collection_cases')
        .select('total_outstanding, days_past_due, case_status')
        .eq('assigned_to', userId)
        .in('case_status', ['ACTIVE', 'LEGAL']);
        
      if (error) throw error;
      
      const totalCases = cases?.length || 0;
      const totalOverdueAmount = cases?.reduce((sum, c) => sum + (c.total_outstanding || 0), 0) || 0;
      
      // Fetch collections this month
      const startOfMonth = format(new Date(), 'yyyy-MM-01');
      const { data: collections } = await supabase
        .from('daily_collection_summary')
        .select('collection_amount')
        .eq('officer_id', userId)
        .gte('summary_date', startOfMonth);
        
      const collectedThisMonth = collections?.reduce((sum, c) => sum + (c.collection_amount || 0), 0) || 0;
      
      // Fetch active PTPs
      const { data: ptps } = await supabase
        .from('promise_to_pay')
        .select('promised_amount')
        .eq('created_by', userId)
        .eq('status', 'PENDING')
        .gte('promise_date', format(new Date(), 'yyyy-MM-dd'));
        
      const ptpScheduled = ptps?.reduce((sum, p) => sum + (p.promised_amount || 0), 0) || 0;
      
      setPortfolioSummary({
        totalCases,
        totalOverdueAmount,
        collectedThisMonth,
        ptpScheduled,
        successRate: totalOverdueAmount > 0 ? (collectedThisMonth / totalOverdueAmount) * 100 : 0
      });
    } catch (error) {
      console.error('Error fetching portfolio summary:', error);
    }
  };

  // US-007: Fetch assigned cases with details
  const fetchAssignedCases = async () => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      let query = supabase
        .from('collection_cases')
        .select(`
          *,
          customers!inner(customer_name),
          promise_to_pay(promised_amount, promise_date, status)
        `)
        .eq('assigned_to', userId)
        .in('case_status', ['ACTIVE', 'LEGAL'])
        .order('priority', { ascending: false })
        .order('days_past_due', { ascending: false });
        
      // Apply filters
      if (filterPriority !== 'all') {
        query = query.eq('priority', filterPriority);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Process cases with customer names and PTP info
      const processedCases = data?.map(c => ({
        ...c,
        customer_name: c.customers?.customer_name,
        ptp_amount: c.promise_to_pay?.[0]?.promised_amount,
        ptp_date: c.promise_to_pay?.[0]?.promise_date
      })) || [];
      
      setAssignedCases(processedCases);
    } catch (error) {
      console.error('Error fetching assigned cases:', error);
    }
  };

  // US-008: Fetch interaction history
  const fetchInteractions = async (caseId?: number) => {
    try {
      let query = supabase
        .from('collection_interactions')
        .select(`
          *,
          collection_officers(officer_name)
        `)
        .order('interaction_date', { ascending: false })
        .limit(50);
        
      if (caseId) {
        query = query.eq('case_id', caseId);
      } else {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        query = query.eq('officer_id', userId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setInteractions(data?.map(i => ({
        ...i,
        officer_name: i.collection_officers?.officer_name
      })) || []);
    } catch (error) {
      console.error('Error fetching interactions:', error);
    }
  };

  // US-009: Record Promise to Pay
  const recordPTP = async () => {
    if (!selectedCase || !ptpForm.amount || !ptpForm.date) return;
    
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      const { error } = await supabase
        .from('promise_to_pay')
        .insert({
          case_id: selectedCase.case_id,
          promised_amount: parseFloat(ptpForm.amount),
          promise_date: format(ptpForm.date, 'yyyy-MM-dd'),
          status: 'PENDING',
          created_by: userId
        });
        
      if (error) throw error;
      
      // Log interaction
      await logInteraction('PTP', 'PHONE', 'PTP_SCHEDULED', 
        `PTP scheduled for ${format(ptpForm.date, 'dd/MM/yyyy')} - Amount: ${ptpForm.amount}`);
      
      setShowPTPDialog(false);
      setPtpForm({ amount: '', date: new Date(), notes: '' });
      await fetchAssignedCases();
    } catch (error) {
      console.error('Error recording PTP:', error);
    }
  };

  // US-008 & US-010: Log interaction
  const logInteraction = async (
    type: string, 
    channel: string, 
    outcome: string, 
    notes: string,
    nextAction?: string,
    nextActionDate?: Date
  ) => {
    if (!selectedCase) return;
    
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      const { error } = await supabase
        .from('collection_interactions')
        .insert({
          case_id: selectedCase.case_id,
          officer_id: userId,
          interaction_type: type,
          channel: channel,
          outcome: outcome,
          notes: notes,
          next_action: nextAction,
          next_action_date: nextActionDate ? format(nextActionDate, 'yyyy-MM-dd') : null
        });
        
      if (error) throw error;
      
      // Update case next action
      if (nextAction && nextActionDate) {
        await supabase
          .from('collection_cases')
          .update({
            next_action_date: format(nextActionDate, 'yyyy-MM-dd')
          })
          .eq('case_id', selectedCase.case_id);
      }
      
      await fetchInteractions(selectedCase.case_id);
    } catch (error) {
      console.error('Error logging interaction:', error);
    }
  };

  // US-011: Get recommended actions
  const getRecommendedActions = (caseData: CollectionCase) => {
    const actions = [];
    
    // Based on DPD
    if (caseData.days_past_due < 30) {
      actions.push({ type: 'CALL', description: 'Courtesy reminder call', priority: 'LOW' });
    } else if (caseData.days_past_due < 60) {
      actions.push({ type: 'CALL', description: 'Follow-up call with payment options', priority: 'MEDIUM' });
      actions.push({ type: 'SMS', description: 'Send payment reminder SMS', priority: 'LOW' });
    } else if (caseData.days_past_due < 90) {
      actions.push({ type: 'VISIT', description: 'Schedule field visit', priority: 'HIGH' });
      actions.push({ type: 'RESTRUCTURE', description: 'Offer restructuring options', priority: 'MEDIUM' });
    } else {
      actions.push({ type: 'LEGAL', description: 'Prepare for legal action', priority: 'CRITICAL' });
      actions.push({ type: 'SETTLEMENT', description: 'Negotiate settlement', priority: 'HIGH' });
    }
    
    // Based on amount
    if (caseData.total_outstanding > 100000) {
      actions.push({ type: 'ESCALATE', description: 'Escalate to senior management', priority: 'HIGH' });
    }
    
    // Based on collateral
    if (caseData.collateral_value && caseData.collateral_value > caseData.total_outstanding) {
      actions.push({ type: 'COLLATERAL', description: 'Initiate collateral liquidation process', priority: 'MEDIUM' });
    }
    
    return actions;
  };

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPortfolioSummary(),
        fetchAssignedCases(),
        fetchInteractions()
      ]);
      setLoading(false);
    };
    
    loadData();
  }, [filterStatus, filterPriority]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      CRITICAL: 'destructive',
      HIGH: 'destructive',
      MEDIUM: 'default',
      LOW: 'secondary'
    };
    
    return (
      <Badge variant={variants[priority] || 'outline'}>
        {t(`collection.priority.${priority.toLowerCase()}`)}
      </Badge>
    );
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'PHONE': return <Phone className="h-4 w-4" />;
      case 'SMS': return <MessageSquare className="h-4 w-4" />;
      case 'VISIT': return <MapPin className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className={`p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {t('collection.specialistDashboard.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('collection.specialistDashboard.subtitle')}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <History className="h-4 w-4 mr-2" />
            {t('collection.specialistDashboard.activityLog')}
          </Button>
        </div>
      </div>

      {/* US-006: Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('collection.specialistDashboard.metrics.assignedCases')}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolioSummary.totalCases}</div>
            <p className="text-xs text-muted-foreground">
              {t('collection.specialistDashboard.metrics.activeCases')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('collection.specialistDashboard.metrics.totalOverdue')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(portfolioSummary.totalOverdueAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {t('collection.specialistDashboard.metrics.inCollection')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('collection.specialistDashboard.metrics.collectedThisMonth')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(portfolioSummary.collectedThisMonth)}
            </div>
            <p className="text-xs text-muted-foreground">
              {portfolioSummary.successRate.toFixed(1)}% {t('collection.specialistDashboard.metrics.ofTarget')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('collection.specialistDashboard.metrics.ptpScheduled')}
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(portfolioSummary.ptpScheduled)}</div>
            <p className="text-xs text-muted-foreground">
              {t('collection.specialistDashboard.metrics.expectedCollection')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('collection.specialistDashboard.metrics.successRate')}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolioSummary.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {t('collection.specialistDashboard.metrics.contactSuccess')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="cases" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cases">{t('collection.specialistDashboard.tabs.cases')}</TabsTrigger>
          <TabsTrigger value="today">{t('collection.specialistDashboard.tabs.todaysTasks')}</TabsTrigger>
          <TabsTrigger value="interactions">{t('collection.specialistDashboard.tabs.interactions')}</TabsTrigger>
          <TabsTrigger value="performance">{t('collection.specialistDashboard.tabs.performance')}</TabsTrigger>
        </TabsList>

        {/* US-007: Assigned Cases */}
        <TabsContent value="cases" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>{t('collection.specialistDashboard.filters.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder={t('collection.specialistDashboard.filters.searchPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t('collection.specialistDashboard.filters.priority')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.all')}</SelectItem>
                    <SelectItem value="CRITICAL">{t('collection.priority.critical')}</SelectItem>
                    <SelectItem value="HIGH">{t('collection.priority.high')}</SelectItem>
                    <SelectItem value="MEDIUM">{t('collection.priority.medium')}</SelectItem>
                    <SelectItem value="LOW">{t('collection.priority.low')}</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t('collection.specialistDashboard.filters.status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.all')}</SelectItem>
                    <SelectItem value="active">{t('collection.status.active')}</SelectItem>
                    <SelectItem value="ptp">{t('collection.status.ptp')}</SelectItem>
                    <SelectItem value="broken_ptp">{t('collection.status.brokenPtp')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Cases List */}
          <Card>
            <CardHeader>
              <CardTitle>{t('collection.specialistDashboard.cases.title')}</CardTitle>
              <CardDescription>{t('collection.specialistDashboard.cases.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('collection.specialistDashboard.cases.loanId')}</TableHead>
                      <TableHead>{t('collection.specialistDashboard.cases.customer')}</TableHead>
                      <TableHead>{t('collection.specialistDashboard.cases.product')}</TableHead>
                      <TableHead className="text-right">{t('collection.specialistDashboard.cases.overdue')}</TableHead>
                      <TableHead>{t('collection.specialistDashboard.cases.dpd')}</TableHead>
                      <TableHead>{t('collection.specialistDashboard.cases.priority')}</TableHead>
                      <TableHead>{t('collection.specialistDashboard.cases.nextAction')}</TableHead>
                      <TableHead>{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedCases
                      .filter(c => 
                        searchTerm === '' || 
                        c.loan_account_number.includes(searchTerm) ||
                        c.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((caseItem) => (
                      <TableRow key={caseItem.case_id} className="cursor-pointer hover:bg-gray-50">
                        <TableCell className="font-medium">{caseItem.loan_account_number}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{caseItem.customer_name || 'N/A'}</p>
                            <p className="text-sm text-gray-500">{caseItem.customer_id}</p>
                          </div>
                        </TableCell>
                        <TableCell>{caseItem.product_type || 'N/A'}</TableCell>
                        <TableCell className="text-right font-bold text-red-600">
                          {formatCurrency(caseItem.total_outstanding)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{caseItem.days_past_due}</span>
                            <span className="text-sm text-gray-500">{t('common.days')}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getPriorityBadge(caseItem.priority)}</TableCell>
                        <TableCell>
                          {caseItem.ptp_date && (
                            <div className="flex items-center gap-1 text-sm">
                              <CalendarIcon className="h-3 w-3" />
                              <span>PTP: {format(new Date(caseItem.ptp_date), 'dd/MM')}</span>
                            </div>
                          )}
                          {caseItem.next_action_date && (
                            <div className="text-sm text-gray-500">
                              {format(new Date(caseItem.next_action_date), 'dd/MM')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedCase(caseItem);
                                setShowInteractionDialog(true);
                              }}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedCase(caseItem);
                                setShowPTPDialog(true);
                              }}
                            >
                              <CalendarIcon className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => setSelectedCase(caseItem)}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Today's Tasks */}
        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('collection.specialistDashboard.todaysTasks.title')}</CardTitle>
              <CardDescription>{t('collection.specialistDashboard.todaysTasks.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* PTPs Due Today */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-3">{t('collection.specialistDashboard.todaysTasks.ptpDueToday')}</h3>
                  <div className="space-y-2">
                    {assignedCases
                      .filter(c => c.ptp_date && format(new Date(c.ptp_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'))
                      .map(c => (
                        <div key={c.case_id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                          <div>
                            <p className="font-medium">{c.customer_name}</p>
                            <p className="text-sm text-gray-600">
                              {t('collection.specialistDashboard.todaysTasks.ptpAmount')}: {formatCurrency(c.ptp_amount || 0)}
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            <Phone className="h-4 w-4 mr-2" />
                            {t('collection.specialistDashboard.todaysTasks.followUp')}
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Follow-up Actions */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-3">{t('collection.specialistDashboard.todaysTasks.scheduledActions')}</h3>
                  <div className="space-y-2">
                    {assignedCases
                      .filter(c => c.next_action_date && format(new Date(c.next_action_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'))
                      .map(c => (
                        <div key={c.case_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">{c.customer_name}</p>
                            <p className="text-sm text-gray-600">{c.loan_account_number}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getPriorityBadge(c.priority)}
                            <Button size="sm">
                              {t('common.view')}
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* US-008: Interaction History */}
        <TabsContent value="interactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('collection.specialistDashboard.interactions.title')}</CardTitle>
              <CardDescription>{t('collection.specialistDashboard.interactions.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {interactions.map((interaction) => (
                  <div key={interaction.interaction_id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getChannelIcon(interaction.channel)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{interaction.interaction_type}</span>
                            <Badge variant="outline" className="text-xs">
                              {interaction.outcome}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{interaction.notes}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{format(new Date(interaction.interaction_date), 'dd/MM/yyyy HH:mm')}</span>
                            <span>{interaction.officer_name}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('collection.specialistDashboard.performance.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium mb-4">{t('collection.specialistDashboard.performance.monthlyTrend')}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{t('collection.specialistDashboard.performance.callsMade')}</span>
                      <span className="font-medium">342</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{t('collection.specialistDashboard.performance.successfulContacts')}</span>
                      <span className="font-medium">218 (63.7%)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{t('collection.specialistDashboard.performance.ptpsSecured')}</span>
                      <span className="font-medium">87</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{t('collection.specialistDashboard.performance.ptpKeptRate')}</span>
                      <span className="font-medium text-green-600">78.2%</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-4">{t('collection.specialistDashboard.performance.collectionBreakdown')}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{t('collection.specialistDashboard.performance.regularPayments')}</span>
                      <span className="font-medium">{formatCurrency(850000)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{t('collection.specialistDashboard.performance.settlements')}</span>
                      <span className="font-medium">{formatCurrency(320000)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{t('collection.specialistDashboard.performance.restructured')}</span>
                      <span className="font-medium">{formatCurrency(180000)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* US-008: Log Interaction Dialog */}
      <Dialog open={showInteractionDialog} onOpenChange={setShowInteractionDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('collection.specialistDashboard.logInteraction.title')}</DialogTitle>
            <DialogDescription>
              {selectedCase?.customer_name} - {selectedCase?.loan_account_number}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('collection.specialistDashboard.logInteraction.type')}</Label>
                <Select 
                  value={interactionForm.type} 
                  onValueChange={(v) => setInteractionForm({...interactionForm, type: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CALL">{t('collection.interactionTypes.call')}</SelectItem>
                    <SelectItem value="SMS">{t('collection.interactionTypes.sms')}</SelectItem>
                    <SelectItem value="EMAIL">{t('collection.interactionTypes.email')}</SelectItem>
                    <SelectItem value="VISIT">{t('collection.interactionTypes.visit')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>{t('collection.specialistDashboard.logInteraction.outcome')}</Label>
                <Select 
                  value={interactionForm.outcome} 
                  onValueChange={(v) => setInteractionForm({...interactionForm, outcome: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONTACTED">{t('collection.outcomes.contacted')}</SelectItem>
                    <SelectItem value="NO_ANSWER">{t('collection.outcomes.noAnswer')}</SelectItem>
                    <SelectItem value="PROMISE_TO_PAY">{t('collection.outcomes.promiseToPay')}</SelectItem>
                    <SelectItem value="DISPUTE">{t('collection.outcomes.dispute')}</SelectItem>
                    <SelectItem value="WRONG_NUMBER">{t('collection.outcomes.wrongNumber')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>{t('collection.specialistDashboard.logInteraction.notes')}</Label>
              <Textarea 
                placeholder={t('collection.specialistDashboard.logInteraction.notesPlaceholder')}
                value={interactionForm.notes}
                onChange={(e) => setInteractionForm({...interactionForm, notes: e.target.value})}
                rows={4}
              />
            </div>
            
            <div>
              <Label>{t('collection.specialistDashboard.logInteraction.nextAction')}</Label>
              <Input 
                placeholder={t('collection.specialistDashboard.logInteraction.nextActionPlaceholder')}
                value={interactionForm.nextAction}
                onChange={(e) => setInteractionForm({...interactionForm, nextAction: e.target.value})}
              />
            </div>
            
            <div>
              <Label>{t('collection.specialistDashboard.logInteraction.nextActionDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(interactionForm.nextActionDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={interactionForm.nextActionDate}
                    onSelect={(date) => date && setInteractionForm({...interactionForm, nextActionDate: date})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowInteractionDialog(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={async () => {
                await logInteraction(
                  interactionForm.type,
                  interactionForm.channel,
                  interactionForm.outcome,
                  interactionForm.notes,
                  interactionForm.nextAction,
                  interactionForm.nextActionDate
                );
                setShowInteractionDialog(false);
              }}>
                <Save className="h-4 w-4 mr-2" />
                {t('common.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* US-009: PTP Dialog */}
      <Dialog open={showPTPDialog} onOpenChange={setShowPTPDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('collection.specialistDashboard.ptp.title')}</DialogTitle>
            <DialogDescription>
              {selectedCase?.customer_name} - {selectedCase?.loan_account_number}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>{t('collection.specialistDashboard.ptp.amount')}</Label>
              <Input 
                type="number"
                placeholder={t('collection.specialistDashboard.ptp.amountPlaceholder')}
                value={ptpForm.amount}
                onChange={(e) => setPtpForm({...ptpForm, amount: e.target.value})}
              />
              <p className="text-sm text-gray-500 mt-1">
                {t('collection.specialistDashboard.ptp.totalOutstanding')}: {formatCurrency(selectedCase?.total_outstanding || 0)}
              </p>
            </div>
            
            <div>
              <Label>{t('collection.specialistDashboard.ptp.promiseDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(ptpForm.date, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={ptpForm.date}
                    onSelect={(date) => date && setPtpForm({...ptpForm, date})}
                    disabled={(date) => isBefore(date, new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label>{t('collection.specialistDashboard.ptp.notes')}</Label>
              <Textarea 
                placeholder={t('collection.specialistDashboard.ptp.notesPlaceholder')}
                value={ptpForm.notes}
                onChange={(e) => setPtpForm({...ptpForm, notes: e.target.value})}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPTPDialog(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={recordPTP}>
                <CalendarIcon className="h-4 w-4 mr-2" />
                {t('collection.specialistDashboard.ptp.schedule')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* US-011: Case Details with Recommended Actions */}
      {selectedCase && (
        <Dialog open={!!selectedCase && !showInteractionDialog && !showPTPDialog} onOpenChange={() => setSelectedCase(null)}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('collection.specialistDashboard.caseDetails.title')}</DialogTitle>
              <DialogDescription>
                {selectedCase.customer_name} - {selectedCase.loan_account_number}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Case Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">{t('collection.specialistDashboard.caseDetails.totalOutstanding')}</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(selectedCase.total_outstanding)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('collection.specialistDashboard.caseDetails.daysPastDue')}</p>
                  <p className="text-lg font-bold">{selectedCase.days_past_due} {t('common.days')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('collection.specialistDashboard.caseDetails.productType')}</p>
                  <p className="font-medium">{selectedCase.product_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('collection.specialistDashboard.caseDetails.collateral')}</p>
                  <p className="font-medium">
                    {selectedCase.collateral_value ? formatCurrency(selectedCase.collateral_value) : 'N/A'}
                  </p>
                </div>
              </div>

              {/* US-011: Recommended Actions */}
              <div>
                <h3 className="font-medium mb-3">{t('collection.specialistDashboard.recommendedActions.title')}</h3>
                <div className="space-y-2">
                  {getRecommendedActions(selectedCase).map((action, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          action.priority === 'CRITICAL' ? 'bg-red-500' :
                          action.priority === 'HIGH' ? 'bg-orange-500' :
                          action.priority === 'MEDIUM' ? 'bg-yellow-500' :
                          'bg-green-500'
                        )} />
                        <div>
                          <p className="font-medium">{action.description}</p>
                          <p className="text-sm text-gray-500">{action.type}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        {t('collection.specialistDashboard.recommendedActions.execute')}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Interactions */}
              <div>
                <h3 className="font-medium mb-3">{t('collection.specialistDashboard.recentInteractions.title')}</h3>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {interactions
                    .filter(i => i.case_id === selectedCase.case_id)
                    .slice(0, 5)
                    .map((interaction) => (
                      <div key={interaction.interaction_id} className="border-l-2 border-gray-200 pl-3 py-2">
                        <div className="flex items-center gap-2 text-sm">
                          {getChannelIcon(interaction.channel)}
                          <span className="font-medium">{interaction.interaction_type}</span>
                          <Badge variant="outline" className="text-xs">{interaction.outcome}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{interaction.notes}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(interaction.interaction_date), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                    ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedCase(null)}>
                  {t('common.close')}
                </Button>
                <Button onClick={() => {
                  setShowRemediationDialog(true);
                }}>
                  {t('collection.specialistDashboard.actions.proposeRemediation')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SpecialistCollectionDashboard;