import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  ArrowLeft, Download, Filter, Calendar, Clock, 
  DollarSign, TrendingUp, Users, Phone, Target,
  CheckCircle, AlertCircle, XCircle, RefreshCw
} from 'lucide-react';
import { collectionApi } from '@/api/collection';
import { supabase } from '@/lib/supabase';

const DailyCollectionDetail = () => {
  const { t, i18n } = useTranslation();
  const { cardType } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: new Date(), end: new Date() });

  useEffect(() => {
    loadDetailData();
  }, [cardType]);

  const loadDetailData = async () => {
    setLoading(true);
    try {
      switch (cardType) {
        case 'total-due':
          await loadTotalDueDetails();
          break;
        case 'ptp-due':
          await loadPTPDetails();
          break;
        case 'field-visits':
          await loadFieldVisitDetails();
          break;
        case 'legal-cases':
          await loadLegalCaseDetails();
          break;
        case 'yesterday-achievement':
          await loadYesterdayAchievementDetails();
          break;
        default:
          console.error('Unknown card type:', cardType);
      }
    } catch (error) {
      console.error('Error loading detail data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTotalDueDetails = async () => {
    const { data, error } = await supabase
      .from('collection_cases')
      .select(`
        case_id,
        customer_name,
        total_outstanding,
        days_past_due,
        status,
        priority,
        assigned_to,
        last_contact_date,
        next_action_date
      `)
      .eq('status', 'active')
      .order('total_outstanding', { ascending: false });

    if (!error) {
      setDetailData({
        type: 'total-due',
        title: t('dailyCollectionDetail.totalDue.title'),
        subtitle: t('dailyCollectionDetail.totalDue.subtitle'),
        data: data || []
      });
    }
  };

  const loadPTPDetails = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('collection_ptp')
      .select(`
        ptp_id,
        case_id,
        customer_name,
        ptp_amount,
        ptp_date,
        status,
        created_at,
        collection_cases!inner(
          total_outstanding,
          days_past_due,
          assigned_to
        )
      `)
      .eq('ptp_date', today)
      .order('ptp_amount', { ascending: false });

    if (!error) {
      setDetailData({
        type: 'ptp-due',
        title: t('dailyCollectionDetail.ptpDue.title'),
        subtitle: t('dailyCollectionDetail.ptpDue.subtitle'),
        data: data || []
      });
    }
  };

  const loadFieldVisitDetails = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('field_visits')
      .select(`
        visit_id,
        case_id,
        customer_name,
        visit_date,
        visit_time,
        status,
        officer_name,
        address,
        contact_number,
        priority
      `)
      .eq('visit_date', today)
      .order('visit_time', { ascending: true });

    if (!error) {
      setDetailData({
        type: 'field-visits',
        title: t('dailyCollectionDetail.fieldVisits.title'),
        subtitle: t('dailyCollectionDetail.fieldVisits.subtitle'),
        data: data || []
      });
    }
  };

  const loadLegalCaseDetails = async () => {
    const { data, error } = await supabase
      .from('legal_cases')
      .select(`
        legal_case_id,
        case_id,
        customer_name,
        case_status,
        court_date,
        lawyer_assigned,
        outstanding_amount,
        last_update,
        next_action
      `)
      .in('case_status', ['active', 'pending', 'hearing_scheduled'])
      .order('court_date', { ascending: true });

    if (!error) {
      setDetailData({
        type: 'legal-cases',
        title: t('dailyCollectionDetail.legalCases.title'),
        subtitle: t('dailyCollectionDetail.legalCases.subtitle'),
        data: data || []
      });
    }
  };

  const loadYesterdayAchievementDetails = async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('collection_payments')
      .select(`
        payment_id,
        case_id,
        customer_name,
        amount,
        payment_method,
        payment_date,
        collector_name,
        team_name
      `)
      .gte('payment_date', yesterdayStr + 'T00:00:00')
      .lte('payment_date', yesterdayStr + 'T23:59:59')
      .order('amount', { ascending: false });

    if (!error) {
      setDetailData({
        type: 'yesterday-achievement',
        title: t('dailyCollectionDetail.yesterdayAchievement.title'),
        subtitle: t('dailyCollectionDetail.yesterdayAchievement.subtitle'),
        data: data || []
      });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { variant: 'default', label: t('common.statuses.active') },
      pending: { variant: 'secondary', label: t('common.statuses.pending') },
      completed: { variant: 'success', label: t('common.statuses.completed') },
      failed: { variant: 'destructive', label: t('common.statuses.failed') },
      scheduled: { variant: 'outline', label: t('common.statuses.scheduled') }
    };

    const config = statusConfig[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const renderDetailContent = () => {
    if (!detailData) return null;

    switch (detailData.type) {
      case 'total-due':
        return renderTotalDueContent();
      case 'ptp-due':
        return renderPTPContent();
      case 'field-visits':
        return renderFieldVisitsContent();
      case 'legal-cases':
        return renderLegalCasesContent();
      case 'yesterday-achievement':
        return renderYesterdayAchievementContent();
      default:
        return null;
    }
  };

  const renderTotalDueContent = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('dailyCollectionDetail.totalDue.totalCases')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{detailData.data.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('dailyCollectionDetail.totalDue.totalAmount')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(detailData.data.reduce((sum, item) => sum + item.total_outstanding, 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('dailyCollectionDetail.totalDue.highPriority')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {detailData.data.filter(item => item.priority === 'high').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('dailyCollectionDetail.totalDue.avgDPD')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(detailData.data.reduce((sum, item) => sum + item.days_past_due, 0) / detailData.data.length)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dailyCollectionDetail.totalDue.casesList')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('dailyCollectionDetail.totalDue.caseId')}</TableHead>
                  <TableHead>{t('dailyCollectionDetail.totalDue.customerName')}</TableHead>
                  <TableHead>{t('dailyCollectionDetail.totalDue.outstanding')}</TableHead>
                  <TableHead>{t('dailyCollectionDetail.totalDue.dpd')}</TableHead>
                  <TableHead>{t('dailyCollectionDetail.totalDue.status')}</TableHead>
                  <TableHead>{t('dailyCollectionDetail.totalDue.priority')}</TableHead>
                  <TableHead>{t('dailyCollectionDetail.totalDue.assignedTo')}</TableHead>
                  <TableHead>{t('dailyCollectionDetail.totalDue.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailData.data.map((item) => (
                  <TableRow key={item.case_id}>
                    <TableCell className="font-medium">{item.case_id}</TableCell>
                    <TableCell>{item.customer_name}</TableCell>
                    <TableCell>{formatCurrency(item.total_outstanding)}</TableCell>
                    <TableCell>{item.days_past_due}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'}>
                        {item.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.assigned_to || '-'}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/collection/cases/${item.case_id}`)}
                      >
                        {t('common.view')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  const renderPTPContent = () => (
    <div className="space-y-6">
      {/* PTP Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('dailyCollectionDetail.ptpDue.totalPTPs')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{detailData.data.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('dailyCollectionDetail.ptpDue.totalAmount')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(detailData.data.reduce((sum, item) => sum + item.ptp_amount, 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('dailyCollectionDetail.ptpDue.pending')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {detailData.data.filter(item => item.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('dailyCollectionDetail.ptpDue.fulfilled')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {detailData.data.filter(item => item.status === 'fulfilled').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PTP Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dailyCollectionDetail.ptpDue.ptpList')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('dailyCollectionDetail.ptpDue.ptpId')}</TableHead>
                <TableHead>{t('dailyCollectionDetail.ptpDue.customerName')}</TableHead>
                <TableHead>{t('dailyCollectionDetail.ptpDue.amount')}</TableHead>
                <TableHead>{t('dailyCollectionDetail.ptpDue.status')}</TableHead>
                <TableHead>{t('dailyCollectionDetail.ptpDue.createdAt')}</TableHead>
                <TableHead>{t('dailyCollectionDetail.ptpDue.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detailData.data.map((item) => (
                <TableRow key={item.ptp_id}>
                  <TableCell className="font-medium">{item.ptp_id}</TableCell>
                  <TableCell>{item.customer_name}</TableCell>
                  <TableCell>{formatCurrency(item.ptp_amount)}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>{new Date(item.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate(`/collection/cases/${item.case_id}`)}
                    >
                      {t('common.view')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderFieldVisitsContent = () => (
    <div className="space-y-6">
      {/* Visit Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('dailyCollectionDetail.fieldVisits.totalVisits')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{detailData.data.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('dailyCollectionDetail.fieldVisits.scheduled')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {detailData.data.filter(item => item.status === 'scheduled').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('dailyCollectionDetail.fieldVisits.completed')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {detailData.data.filter(item => item.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('dailyCollectionDetail.fieldVisits.highPriority')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {detailData.data.filter(item => item.priority === 'high').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visits Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dailyCollectionDetail.fieldVisits.visitsList')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('dailyCollectionDetail.fieldVisits.visitId')}</TableHead>
                <TableHead>{t('dailyCollectionDetail.fieldVisits.customerName')}</TableHead>
                <TableHead>{t('dailyCollectionDetail.fieldVisits.time')}</TableHead>
                <TableHead>{t('dailyCollectionDetail.fieldVisits.officer')}</TableHead>
                <TableHead>{t('dailyCollectionDetail.fieldVisits.status')}</TableHead>
                <TableHead>{t('dailyCollectionDetail.fieldVisits.priority')}</TableHead>
                <TableHead>{t('dailyCollectionDetail.fieldVisits.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detailData.data.map((item) => (
                <TableRow key={item.visit_id}>
                  <TableCell className="font-medium">{item.visit_id}</TableCell>
                  <TableCell>{item.customer_name}</TableCell>
                  <TableCell>{item.visit_time}</TableCell>
                  <TableCell>{item.officer_name}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'}>
                      {item.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate(`/collection/cases/${item.case_id}`)}
                    >
                      {t('common.view')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderLegalCasesContent = () => (
    <div className="space-y-6">
      {/* Legal Cases Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('dailyCollectionDetail.legalCases.totalCases')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{detailData.data.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('dailyCollectionDetail.legalCases.totalAmount')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(detailData.data.reduce((sum, item) => sum + item.outstanding_amount, 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('dailyCollectionDetail.legalCases.hearingScheduled')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {detailData.data.filter(item => item.case_status === 'hearing_scheduled').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('dailyCollectionDetail.legalCases.active')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {detailData.data.filter(item => item.case_status === 'active').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legal Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dailyCollectionDetail.legalCases.casesList')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('dailyCollectionDetail.legalCases.caseId')}</TableHead>
                <TableHead>{t('dailyCollectionDetail.legalCases.customerName')}</TableHead>
                <TableHead>{t('dailyCollectionDetail.legalCases.amount')}</TableHead>
                <TableHead>{t('dailyCollectionDetail.legalCases.status')}</TableHead>
                <TableHead>{t('dailyCollectionDetail.legalCases.courtDate')}</TableHead>
                <TableHead>{t('dailyCollectionDetail.legalCases.lawyer')}</TableHead>
                <TableHead>{t('dailyCollectionDetail.legalCases.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detailData.data.map((item) => (
                <TableRow key={item.legal_case_id}>
                  <TableCell className="font-medium">{item.legal_case_id}</TableCell>
                  <TableCell>{item.customer_name}</TableCell>
                  <TableCell>{formatCurrency(item.outstanding_amount)}</TableCell>
                  <TableCell>{getStatusBadge(item.case_status)}</TableCell>
                  <TableCell>{item.court_date ? new Date(item.court_date).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{item.lawyer_assigned || '-'}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate(`/collection/cases/${item.case_id}`)}
                    >
                      {t('common.view')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderYesterdayAchievementContent = () => (
    <div className="space-y-6">
      {/* Achievement Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('dailyCollectionDetail.yesterdayAchievement.totalPayments')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{detailData.data.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('dailyCollectionDetail.yesterdayAchievement.totalCollected')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(detailData.data.reduce((sum, item) => sum + item.amount, 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('dailyCollectionDetail.yesterdayAchievement.avgPayment')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(detailData.data.reduce((sum, item) => sum + item.amount, 0) / detailData.data.length)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('dailyCollectionDetail.yesterdayAchievement.topMethod')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {detailData.data.reduce((acc, item) => {
                acc[item.payment_method] = (acc[item.payment_method] || 0) + 1;
                return acc;
              }, {})}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dailyCollectionDetail.yesterdayAchievement.paymentsList')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('dailyCollectionDetail.yesterdayAchievement.paymentId')}</TableHead>
                <TableHead>{t('dailyCollectionDetail.yesterdayAchievement.customerName')}</TableHead>
                <TableHead>{t('dailyCollectionDetail.yesterdayAchievement.amount')}</TableHead>
                <TableHead>{t('dailyCollectionDetail.yesterdayAchievement.method')}</TableHead>
                <TableHead>{t('dailyCollectionDetail.yesterdayAchievement.collector')}</TableHead>
                <TableHead>{t('dailyCollectionDetail.yesterdayAchievement.team')}</TableHead>
                <TableHead>{t('dailyCollectionDetail.yesterdayAchievement.time')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detailData.data.map((item) => (
                <TableRow key={item.payment_id}>
                  <TableCell className="font-medium">{item.payment_id}</TableCell>
                  <TableCell>{item.customer_name}</TableCell>
                  <TableCell>{formatCurrency(item.amount)}</TableCell>
                  <TableCell>{item.payment_method}</TableCell>
                  <TableCell>{item.collector_name || '-'}</TableCell>
                  <TableCell>{item.team_name || '-'}</TableCell>
                  <TableCell>{new Date(item.payment_date).toLocaleTimeString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/collection/daily')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{detailData?.title}</h1>
            <p className="text-gray-600">{detailData?.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            {t('common.filter')}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            {t('common.export')}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => loadDetailData()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      )}

      {/* Detail Content */}
      {!loading && detailData && renderDetailContent()}
    </div>
  );
};

export default DailyCollectionDetail;