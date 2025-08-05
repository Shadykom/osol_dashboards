import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, Phone, Mail, MapPin, Calendar, Clock, DollarSign, User,
  FileText, MessageSquare, Gavel, Home, AlertTriangle, CheckCircle,
  Activity, TrendingUp, History, CreditCard, Receipt, UserCheck,
  Briefcase, Building, Hash, CalendarDays, Percent, Target
} from 'lucide-react';
import { CollectionService } from '../services/collectionService';
import { format } from 'date-fns';

const CollectionCaseDetails = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { caseId } = useParams();
  const navigate = useNavigate();
  
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [historicalData, setHistoricalData] = useState({
    interactions: [],
    promisesToPay: [],
    payments: [],
    fieldVisits: [],
    legalActions: [],
    statusChanges: [],
    assignments: []
  });

  useEffect(() => {
    loadCaseDetails();
    loadHistoricalData();
  }, [caseId]);

  const loadCaseDetails = async () => {
    setLoading(true);
    try {
      const response = await CollectionService.getCaseDetails(caseId);
      if (response.success) {
        setCaseData(response.data);
      }
    } catch (error) {
      console.error('Error loading case details:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistoricalData = async () => {
    try {
      // Load all historical data
      const [interactions, payments, visits, legal, statusHistory, assignments] = await Promise.all([
        CollectionService.getCaseInteractions(caseId),
        CollectionService.getCasePayments(caseId),
        CollectionService.getCaseFieldVisits(caseId),
        CollectionService.getCaseLegalActions(caseId),
        CollectionService.getCaseStatusHistory(caseId),
        CollectionService.getCaseAssignmentHistory(caseId)
      ]);

      setHistoricalData({
        interactions: interactions.data || [],
        payments: payments.data || [],
        fieldVisits: visits.data || [],
        legalActions: legal.data || [],
        statusChanges: statusHistory.data || [],
        assignments: assignments.data || []
      });
    } catch (error) {
      console.error('Error loading historical data:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd/MM/yyyy HH:mm');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'ACTIVE': { color: 'bg-blue-500', text: t('collectionCases.statusTypes.active') },
      'RESOLVED': { color: 'bg-green-500', text: t('collectionCases.statusTypes.resolved') },
      'LEGAL': { color: 'bg-purple-500', text: t('collectionCases.statusTypes.legal') },
      'WRITTEN_OFF': { color: 'bg-gray-500', text: t('collectionCases.statusTypes.writtenOff') },
      'SETTLED': { color: 'bg-teal-500', text: t('collectionCases.statusTypes.settled') },
      'CLOSED': { color: 'bg-gray-700', text: t('collectionCases.statusTypes.closed') }
    };
    const config = statusConfig[status] || { color: 'bg-gray-400', text: status };
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      'CRITICAL': { color: 'bg-red-600', text: t('collectionCases.priorityTypes.critical') },
      'HIGH': { color: 'bg-orange-500', text: t('collectionCases.priorityTypes.high') },
      'MEDIUM': { color: 'bg-yellow-500', text: t('collectionCases.priorityTypes.medium') },
      'LOW': { color: 'bg-green-500', text: t('collectionCases.priorityTypes.low') }
    };
    const config = priorityConfig[priority] || { color: 'bg-gray-400', text: priority };
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('collectionCases.caseNotFound')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/collection/cases')}
            className="p-2"
          >
            <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('collectionCases.caseDetails')} - {caseData.case?.case_number}
            </h1>
            <p className="text-gray-600 mt-1">
              {t('collectionCases.completeHistory')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(caseData.case?.case_status)}
          {getPriorityBadge(caseData.case?.priority)}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('collectionCases.totalOutstanding')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(caseData.case?.total_outstanding)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t('collectionCases.principal')}: {formatCurrency(caseData.case?.principal_outstanding)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('collectionCases.daysPastDue')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {caseData.case?.days_past_due || 0} {t('collectionCases.days')}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t('collectionCases.bucket')}: {caseData.case?.bucketName}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('collectionCases.totalInteractions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {caseData.statistics?.totalInteractions || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t('collectionCases.lastContact')}: {formatDate(caseData.case?.last_contact_date)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('collectionCases.assignedOfficer')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {caseData.case?.officerName}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t('collectionCases.since')}: {formatDate(caseData.case?.assigned_date)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0">
              <TabsTrigger value="overview" className="data-[state=active]:border-b-2 rounded-none px-6 py-3">
                <User className="h-4 w-4 mr-2" />
                {t('collectionCases.tabs.overview')}
              </TabsTrigger>
              <TabsTrigger value="interactions" className="data-[state=active]:border-b-2 rounded-none px-6 py-3">
                <MessageSquare className="h-4 w-4 mr-2" />
                {t('collectionCases.tabs.interactions')} ({historicalData.interactions.length})
              </TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:border-b-2 rounded-none px-6 py-3">
                <CreditCard className="h-4 w-4 mr-2" />
                {t('collectionCases.tabs.payments')} ({historicalData.payments.length})
              </TabsTrigger>
              <TabsTrigger value="promises" className="data-[state=active]:border-b-2 rounded-none px-6 py-3">
                <Receipt className="h-4 w-4 mr-2" />
                {t('collectionCases.tabs.promises')} ({caseData.promisesToPay?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="visits" className="data-[state=active]:border-b-2 rounded-none px-6 py-3">
                <Home className="h-4 w-4 mr-2" />
                {t('collectionCases.tabs.visits')} ({historicalData.fieldVisits.length})
              </TabsTrigger>
              <TabsTrigger value="legal" className="data-[state=active]:border-b-2 rounded-none px-6 py-3">
                <Gavel className="h-4 w-4 mr-2" />
                {t('collectionCases.tabs.legal')} ({historicalData.legalActions.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:border-b-2 rounded-none px-6 py-3">
                <History className="h-4 w-4 mr-2" />
                {t('collectionCases.tabs.history')}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {t('collectionCases.customerInformation')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">{t('collectionCases.name')}</p>
                        <p className="font-medium">{caseData.case?.customerName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{t('collectionCases.nationalId')}</p>
                        <p className="font-medium">{caseData.case?.customers?.national_id || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{t('collectionCases.customerType')}</p>
                        <p className="font-medium">{caseData.case?.customers?.customer_type || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{t('collectionCases.dateOfBirth')}</p>
                        <p className="font-medium">{formatDate(caseData.case?.customers?.date_of_birth)}</p>
                      </div>
                    </div>
                    
                    <div className="border-t pt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">{t('collectionCases.contactDetails')}</p>
                      {caseData.case?.customerContacts?.map((contact, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-2">
                            {contact.contact_type === 'PHONE' && <Phone className="h-4 w-4 text-gray-500" />}
                            {contact.contact_type === 'EMAIL' && <Mail className="h-4 w-4 text-gray-500" />}
                            <span className="text-sm">{contact.contact_value}</span>
                          </div>
                          {contact.is_primary && (
                            <Badge variant="outline" className="text-xs">
                              {t('collectionCases.primary')}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">{t('collectionCases.addresses')}</p>
                      {caseData.case?.customerAddresses?.map((address, idx) => (
                        <div key={idx} className="text-sm space-y-1 mb-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{address.address_type}</span>
                          </div>
                          <p className="ml-6 text-gray-600">
                            {address.street}, {address.city}, {address.state} {address.postal_code}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Loan Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      {t('collectionCases.loanInformation')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">{t('collectionCases.loanAccount')}</p>
                        <p className="font-medium">{caseData.case?.loan_account_number}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{t('collectionCases.originalAmount')}</p>
                        <p className="font-medium">{formatCurrency(caseData.case?.original_loan_amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{t('collectionCases.disbursementDate')}</p>
                        <p className="font-medium">{formatDate(caseData.case?.loan_disbursement_date)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{t('collectionCases.maturityDate')}</p>
                        <p className="font-medium">{formatDate(caseData.case?.loan_maturity_date)}</p>
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">{t('collectionCases.outstandingBreakdown')}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">{t('collectionCases.principal')}</span>
                          <span className="font-medium">{formatCurrency(caseData.case?.principal_outstanding)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">{t('collectionCases.interest')}</span>
                          <span className="font-medium">{formatCurrency(caseData.case?.interest_outstanding)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">{t('collectionCases.penalty')}</span>
                          <span className="font-medium">{formatCurrency(caseData.case?.penalty_outstanding)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-sm font-medium">{t('collectionCases.total')}</span>
                          <span className="font-bold text-red-600">{formatCurrency(caseData.case?.total_outstanding)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">{t('collectionCases.interestRate')}</p>
                          <p className="font-medium">{caseData.case?.interest_rate || 0}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">{t('collectionCases.penaltyRate')}</p>
                          <p className="font-medium">{caseData.case?.penalty_rate || 0}%</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Collection Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    {t('collectionCases.collectionSummary')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">{t('collectionCases.totalCalls')}</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {historicalData.interactions.filter(i => i.interaction_type === 'CALL').length}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">{t('collectionCases.totalVisits')}</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {historicalData.fieldVisits.length}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">{t('collectionCases.totalPayments')}</p>
                      <p className="text-2xl font-bold text-green-600">
                        {historicalData.payments.length}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">{t('collectionCases.totalCollected')}</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(historicalData.payments.reduce((sum, p) => sum + (p.amount || 0), 0))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Interactions Tab */}
            <TabsContent value="interactions" className="p-6">
              <div className="space-y-4">
                {historicalData.interactions.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      {t('collectionCases.noInteractions')}
                    </AlertDescription>
                  </Alert>
                ) : (
                  historicalData.interactions.map((interaction) => (
                    <Card key={interaction.interaction_id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {interaction.interaction_type === 'CALL' && <Phone className="h-5 w-5 text-blue-500 mt-1" />}
                            {interaction.interaction_type === 'EMAIL' && <Mail className="h-5 w-5 text-green-500 mt-1" />}
                            {interaction.interaction_type === 'VISIT' && <Home className="h-5 w-5 text-purple-500 mt-1" />}
                            {interaction.interaction_type === 'SMS' && <MessageSquare className="h-5 w-5 text-yellow-500 mt-1" />}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">
                                  {t(`collectionCases.interactionType.${interaction.interaction_type.toLowerCase()}`)}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {interaction.outcome}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                {t('collectionCases.by')} {interaction.officer_name || 'Unknown'} • {formatDate(interaction.interaction_datetime)}
                              </p>
                              {interaction.notes && (
                                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-sm text-gray-700">{interaction.notes}</p>
                                </div>
                              )}
                              {interaction.promise_to_pay_amount && (
                                <div className="mt-2 flex items-center gap-2">
                                  <Badge className="bg-green-100 text-green-800">
                                    {t('collectionCases.ptpAmount')}: {formatCurrency(interaction.promise_to_pay_amount)}
                                  </Badge>
                                  <span className="text-sm text-gray-600">
                                    {t('collectionCases.dueDate')}: {formatDate(interaction.promise_to_pay_date)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              {t('collectionCases.duration')}: {interaction.duration || 0} {t('collectionCases.minutes')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="p-6">
              <div className="space-y-4">
                {historicalData.payments.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      {t('collectionCases.noPayments')}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-gray-600">
                            {t('collectionCases.totalPayments')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">{historicalData.payments.length}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-gray-600">
                            {t('collectionCases.totalAmountCollected')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(historicalData.payments.reduce((sum, p) => sum + (p.amount || 0), 0))}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-gray-600">
                            {t('collectionCases.lastPayment')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-lg font-semibold">
                            {historicalData.payments[0] ? formatDate(historicalData.payments[0].payment_date) : 'N/A'}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {historicalData.payments.map((payment) => (
                      <Card key={payment.payment_id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <CreditCard className="h-5 w-5 text-green-500 mt-1" />
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-green-600">
                                    {formatCurrency(payment.amount)}
                                  </p>
                                  <Badge variant="outline" className="text-xs">
                                    {payment.payment_method}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">
                                  {formatDate(payment.payment_date)} • {t('collectionCases.reference')}: {payment.reference_number || 'N/A'}
                                </p>
                                {payment.notes && (
                                  <p className="text-sm text-gray-700 mt-1">{payment.notes}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={payment.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                {payment.status}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}
              </div>
            </TabsContent>

            {/* Promises Tab */}
            <TabsContent value="promises" className="p-6">
              <div className="space-y-4">
                {(!caseData.promisesToPay || caseData.promisesToPay.length === 0) ? (
                  <Alert>
                    <AlertDescription>
                      {t('collectionCases.noPromises')}
                    </AlertDescription>
                  </Alert>
                ) : (
                  caseData.promisesToPay.map((ptp) => (
                    <Card key={ptp.ptp_id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <Receipt className="h-5 w-5 text-blue-500 mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">
                                  {formatCurrency(ptp.ptp_amount)} - {ptp.ptp_type}
                                </p>
                                <Badge variant={ptp.status === 'KEPT' ? 'success' : ptp.status === 'BROKEN' ? 'destructive' : 'default'}>
                                  {ptp.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                {t('collectionCases.promiseDate')}: {formatDate(ptp.ptp_date)}
                              </p>
                              <p className="text-sm text-gray-600">
                                {t('collectionCases.createdBy')}: {ptp.officer_name || 'Unknown'} • {formatDate(ptp.created_at)}
                              </p>
                              {ptp.amount_received > 0 && (
                                <p className="text-sm text-green-600 mt-1">
                                  {t('collectionCases.amountReceived')}: {formatCurrency(ptp.amount_received)}
                                </p>
                              )}
                              {ptp.notes && (
                                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-sm text-gray-700">{ptp.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Field Visits Tab */}
            <TabsContent value="visits" className="p-6">
              <div className="space-y-4">
                {historicalData.fieldVisits.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      {t('collectionCases.noVisits')}
                    </AlertDescription>
                  </Alert>
                ) : (
                  historicalData.fieldVisits.map((visit) => (
                    <Card key={visit.visit_id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-purple-500 mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">{visit.visit_status}</p>
                                {visit.amount_collected > 0 && (
                                  <Badge className="bg-green-100 text-green-800">
                                    {t('collectionCases.collected')}: {formatCurrency(visit.amount_collected)}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                {formatDate(visit.visit_date)} • {t('collectionCases.officer')}: {visit.officer_name || 'Unknown'}
                              </p>
                              {visit.address && (
                                <p className="text-sm text-gray-600 mt-1">
                                  <MapPin className="h-3 w-3 inline mr-1" />
                                  {visit.address}
                                </p>
                              )}
                              {visit.notes && (
                                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-sm text-gray-700">{visit.notes}</p>
                                </div>
                              )}
                              {visit.photos && visit.photos.length > 0 && (
                                <div className="mt-2 flex gap-2">
                                  {visit.photos.map((photo, idx) => (
                                    <img 
                                      key={idx}
                                      src={photo} 
                                      alt={`Visit photo ${idx + 1}`}
                                      className="h-16 w-16 object-cover rounded"
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Legal Tab */}
            <TabsContent value="legal" className="p-6">
              <div className="space-y-4">
                {historicalData.legalActions.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      {t('collectionCases.noLegalActions')}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    {caseData.case?.legal_case_id && (
                      <Card className="mb-6">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Gavel className="h-5 w-5" />
                            {t('collectionCases.legalCaseInformation')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">{t('collectionCases.caseNumber')}</p>
                              <p className="font-medium">{caseData.case?.legal_case_number || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">{t('collectionCases.court')}</p>
                              <p className="font-medium">{caseData.case?.court_name || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">{t('collectionCases.filingDate')}</p>
                              <p className="font-medium">{formatDate(caseData.case?.legal_filing_date)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">{t('collectionCases.status')}</p>
                              <p className="font-medium">{caseData.case?.legal_status || 'N/A'}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {historicalData.legalActions.map((action) => (
                      <Card key={action.action_id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <Gavel className="h-5 w-5 text-purple-500 mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">{action.action_type}</p>
                                <Badge variant="outline" className="text-xs">
                                  {action.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                {formatDate(action.action_date)} • {t('collectionCases.by')}: {action.initiated_by || 'System'}
                              </p>
                              {action.description && (
                                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-sm text-gray-700">{action.description}</p>
                                </div>
                              )}
                              {action.next_hearing_date && (
                                <p className="text-sm text-blue-600 mt-2">
                                  {t('collectionCases.nextHearing')}: {formatDate(action.next_hearing_date)}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="p-6">
              <div className="space-y-6">
                {/* Status Changes */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    {t('collectionCases.statusHistory')}
                  </h3>
                  <div className="space-y-3">
                    {historicalData.statusChanges.length === 0 ? (
                      <Alert>
                        <AlertDescription>
                          {t('collectionCases.noStatusChanges')}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      historicalData.statusChanges.map((change, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <Activity className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {t('collectionCases.statusChangedFrom')} {getStatusBadge(change.from_status)} {t('to')} {getStatusBadge(change.to_status)}
                            </p>
                            <p className="text-xs text-gray-600">
                              {formatDate(change.changed_at)} • {t('collectionCases.by')}: {change.changed_by || 'System'}
                            </p>
                            {change.reason && (
                              <p className="text-sm text-gray-700 mt-1">{change.reason}</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Assignment History */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    {t('collectionCases.assignmentHistory')}
                  </h3>
                  <div className="space-y-3">
                    {historicalData.assignments.length === 0 ? (
                      <Alert>
                        <AlertDescription>
                          {t('collectionCases.noAssignmentChanges')}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      historicalData.assignments.map((assignment, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                              <UserCheck className="h-4 w-4 text-purple-600" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {t('collectionCases.assignedTo')} {assignment.officer_name}
                            </p>
                            <p className="text-xs text-gray-600">
                              {formatDate(assignment.assigned_at)} • {t('collectionCases.by')}: {assignment.assigned_by || 'System'}
                            </p>
                            {assignment.reason && (
                              <p className="text-sm text-gray-700 mt-1">{assignment.reason}</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Complete Timeline */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {t('collectionCases.completeTimeline')}
                  </h3>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    <div className="space-y-4">
                      {/* Combine all events and sort by date */}
                      {[
                        ...historicalData.interactions.map(i => ({ ...i, type: 'interaction', date: i.interaction_datetime })),
                        ...historicalData.payments.map(p => ({ ...p, type: 'payment', date: p.payment_date })),
                        ...historicalData.fieldVisits.map(v => ({ ...v, type: 'visit', date: v.visit_date })),
                        ...historicalData.statusChanges.map(s => ({ ...s, type: 'status', date: s.changed_at })),
                        ...historicalData.assignments.map(a => ({ ...a, type: 'assignment', date: a.assigned_at }))
                      ]
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .slice(0, 50) // Show latest 50 events
                        .map((event, idx) => (
                          <div key={`${event.type}-${idx}`} className="relative flex items-start gap-4 ml-8">
                            <div className="absolute -left-8 h-8 w-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                              {event.type === 'interaction' && <MessageSquare className="h-4 w-4 text-blue-500" />}
                              {event.type === 'payment' && <CreditCard className="h-4 w-4 text-green-500" />}
                              {event.type === 'visit' && <MapPin className="h-4 w-4 text-purple-500" />}
                              {event.type === 'status' && <Activity className="h-4 w-4 text-orange-500" />}
                              {event.type === 'assignment' && <UserCheck className="h-4 w-4 text-indigo-500" />}
                            </div>
                            <div className="flex-1 bg-white p-3 rounded-lg border">
                              <p className="text-sm font-medium">
                                {event.type === 'interaction' && t(`collectionCases.interactionType.${event.interaction_type.toLowerCase()}`)}
                                {event.type === 'payment' && `${t('collectionCases.paymentReceived')}: ${formatCurrency(event.amount)}`}
                                {event.type === 'visit' && t('collectionCases.fieldVisit')}
                                {event.type === 'status' && `${t('collectionCases.statusChanged')} ${event.to_status}`}
                                {event.type === 'assignment' && `${t('collectionCases.assignedTo')} ${event.officer_name}`}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {formatDate(event.date)}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CollectionCaseDetails;