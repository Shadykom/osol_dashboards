import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search, Filter, Eye, Phone, Mail, MapPin, Calendar,
  AlertTriangle, CheckCircle, Clock, DollarSign, User,
  FileText, MessageSquare, Gavel, Home
} from 'lucide-react';
import { CollectionService } from '../services/collectionService';

// Table components with RTL support
const Table = ({ children, className = "" }) => (
  <table className={`w-full caption-bottom text-sm ${className}`}>
    {children}
  </table>
);

const TableHeader = ({ children, className = "" }) => (
  <thead className={`[&_tr]:border-b ${className}`}>
    {children}
  </thead>
);

const TableBody = ({ children, className = "" }) => (
  <tbody className={`[&_tr:last-child]:border-0 ${className}`}>
    {children}
  </tbody>
);

const TableRow = ({ children, className = "" }) => (
  <tr className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className}`}>
    {children}
  </tr>
);

const TableHead = ({ children, className = "" }) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  return (
    <th className={`h-12 px-4 ${isRTL ? 'text-right' : 'text-left'} align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className}`}>
      {children}
    </th>
  );
};

const TableCell = ({ children, className = "" }) => (
  <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`}>
    {children}
  </td>
);

const CollectionCases = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseDetails, setCaseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    bucket: 'all',
    assignedTo: 'all',
    minAmount: '',
    maxAmount: '',
    minDpd: '',
    maxDpd: ''
  });

  useEffect(() => {
    loadCollectionCases();
  }, [pagination.page]);

  useEffect(() => {
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
    const debounceTimer = setTimeout(() => {
      loadCollectionCases();
    }, 500);
    
    return () => clearTimeout(debounceTimer);
  }, [filters]);

  const loadCollectionCases = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search || null,
        status: filters.status === 'all' ? null : filters.status,
        priority: filters.priority === 'all' ? null : filters.priority,
        bucket: filters.bucket === 'all' ? null : filters.bucket,
        assignedTo: filters.assignedTo === 'all' ? null : filters.assignedTo,
        minAmount: filters.minAmount || null,
        maxAmount: filters.maxAmount || null,
        minDpd: filters.minDpd || null,
        maxDpd: filters.maxDpd || null
      };

      const response = await CollectionService.getCollectionCases(params);
      if (response.success) {
        setCases(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
    } catch (error) {
      console.error('Error loading collection cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCaseDetails = async (caseId) => {
    setDetailsLoading(true);
    try {
      const response = await CollectionService.getCaseDetails(caseId);
      if (response.success) {
        setCaseDetails(response.data);
      }
    } catch (error) {
      console.error('Error loading case details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      priority: 'all',
      bucket: 'all',
      assignedTo: 'all',
      minAmount: '',
      maxAmount: '',
      minDpd: '',
      maxDpd: ''
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('common.na', 'N/A');
    return new Date(dateString).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'ACTIVE': { color: 'bg-blue-500', text: t('collectionCases.statusTypes.active') },
      'RESOLVED': { color: 'bg-green-500', text: t('collectionCases.statusTypes.resolved') },
      'LEGAL': { color: 'bg-purple-500', text: t('collectionCases.statusTypes.legal') },
      'WRITTEN_OFF': { color: 'bg-gray-500', text: t('collectionCases.statusTypes.writtenOff') },
      'SETTLED': { color: 'bg-yellow-500', text: t('collectionCases.statusTypes.settled') },
      'CLOSED': { color: 'bg-gray-400', text: t('collectionCases.statusTypes.closed') }
    };
    const config = statusConfig[status] || { color: 'bg-gray-500', text: status };
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      'CRITICAL': { color: 'bg-red-500', text: t('collectionCases.priorityTypes.critical') },
      'HIGH': { color: 'bg-orange-500', text: t('collectionCases.priorityTypes.high') },
      'MEDIUM': { color: 'bg-yellow-500', text: t('collectionCases.priorityTypes.medium') },
      'LOW': { color: 'bg-green-500', text: t('collectionCases.priorityTypes.low') }
    };
    const config = priorityConfig[priority] || { color: 'bg-gray-500', text: priority };
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const getDelinquencyBadge = (bucket) => {
    const bucketConfig = {
      'Current': { color: 'bg-green-100 text-green-800' },
      '1-30 Days': { color: 'bg-yellow-100 text-yellow-800' },
      '31-60 Days': { color: 'bg-orange-100 text-orange-800' },
      '61-90 Days': { color: 'bg-red-100 text-red-800' },
      '90+ Days': { color: 'bg-red-200 text-red-900' }
    };
    const config = bucketConfig[bucket] || { color: 'bg-gray-100 text-gray-800' };
    
    // Translate bucket names
    const bucketTranslations = {
      'Current': t('collectionCases.bucketTypes.current'),
      '1-30 Days': t('collectionCases.bucketTypes.1-30Days'),
      '31-60 Days': t('collectionCases.bucketTypes.31-60Days'),
      '61-90 Days': t('collectionCases.bucketTypes.61-90Days'),
      '90+ Days': t('collectionCases.bucketTypes.90+Days')
    };
    
    return (
      <Badge className={config.color}>
        {bucketTranslations[bucket] || bucket}
      </Badge>
    );
  };

  const handleViewCase = (caseItem) => {
    setSelectedCase(caseItem);
    loadCaseDetails(caseItem.caseId);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('collectionCases.title')}</h1>
          <p className="text-gray-600 mt-1">{t('collectionCases.subtitle')}</p>
        </div>
        <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button variant="outline">
            <FileText className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('collectionCases.export')}
          </Button>
          <Button>
            <User className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('collectionCases.assignCases')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('collectionCases.filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-gray-400`} />
              <Input
                placeholder={t('collectionCases.searchCases')}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className={isRTL ? 'pr-10' : 'pl-10'}
              />
            </div>
            
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('collectionCases.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('collectionCases.allStatuses')}</SelectItem>
                <SelectItem value="ACTIVE">{t('collectionCases.statusTypes.active')}</SelectItem>
                <SelectItem value="RESOLVED">{t('collectionCases.statusTypes.resolved')}</SelectItem>
                <SelectItem value="LEGAL">{t('collectionCases.statusTypes.legal')}</SelectItem>
                <SelectItem value="WRITTEN_OFF">{t('collectionCases.statusTypes.writtenOff')}</SelectItem>
                <SelectItem value="SETTLED">{t('collectionCases.statusTypes.settled')}</SelectItem>
                <SelectItem value="CLOSED">{t('collectionCases.statusTypes.closed')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('collectionCases.priority')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('collectionCases.allPriorities')}</SelectItem>
                <SelectItem value="CRITICAL">{t('collectionCases.priorityTypes.critical')}</SelectItem>
                <SelectItem value="HIGH">{t('collectionCases.priorityTypes.high')}</SelectItem>
                <SelectItem value="MEDIUM">{t('collectionCases.priorityTypes.medium')}</SelectItem>
                <SelectItem value="LOW">{t('collectionCases.priorityTypes.low')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.bucket} onValueChange={(value) => handleFilterChange('bucket', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('collectionCases.delinquencyBucket')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('collectionCases.allBuckets')}</SelectItem>
                <SelectItem value="Current">{t('collectionCases.bucketTypes.current')}</SelectItem>
                <SelectItem value="1-30 Days">{t('collectionCases.bucketTypes.1-30Days')}</SelectItem>
                <SelectItem value="31-60 Days">{t('collectionCases.bucketTypes.31-60Days')}</SelectItem>
                <SelectItem value="61-90 Days">{t('collectionCases.bucketTypes.61-90Days')}</SelectItem>
                <SelectItem value="90+ Days">{t('collectionCases.bucketTypes.90+Days')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
            <Input
              placeholder={t('collectionCases.minAmount')}
              type="number"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
            />
            <Input
              placeholder={t('collectionCases.maxAmount')}
              type="number"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
            />
            <Input
              placeholder={t('collectionCases.minDpd')}
              type="number"
              value={filters.minDpd}
              onChange={(e) => handleFilterChange('minDpd', e.target.value)}
            />
            <Input
              placeholder={t('collectionCases.maxDpd')}
              type="number"
              value={filters.maxDpd}
              onChange={(e) => handleFilterChange('maxDpd', e.target.value)}
            />
            <Button variant="outline" onClick={clearFilters}>
              {t('collectionCases.clearFilters')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('collectionCases.title')} ({pagination.total})</CardTitle>
          <CardDescription>
            {t('collectionCases.showing')} {cases.length} {t('collectionCases.of')} {pagination.total} {t('collectionCases.totalCases')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('collectionCases.caseNumber')}</TableHead>
                  <TableHead>{t('collectionCases.customer')}</TableHead>
                  <TableHead>{t('collectionCases.account')}</TableHead>
                  <TableHead>{t('collectionCases.outstanding')}</TableHead>
                  <TableHead>{t('collectionCases.dpd')}</TableHead>
                  <TableHead>{t('collectionCases.bucket')}</TableHead>
                  <TableHead>{t('collectionCases.priority')}</TableHead>
                  <TableHead>{t('collectionCases.status')}</TableHead>
                  <TableHead>{t('collectionCases.assignedTo')}</TableHead>
                  <TableHead>{t('collectionCases.lastContact')}</TableHead>
                  <TableHead>{t('collectionCases.communication')}</TableHead>
                  <TableHead>{t('collectionCases.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map((caseItem) => (
                  <TableRow key={caseItem.caseId}>
                    <TableCell className="font-medium">{caseItem.caseNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{caseItem.customerName}</p>
                        <p className="text-sm text-gray-600">{caseItem.customerPhone}</p>
                      </div>
                    </TableCell>
                    <TableCell>{caseItem.accountNumber}</TableCell>
                    <TableCell className="font-bold text-red-600">
                      {formatCurrency(caseItem.totalOutstanding)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={caseItem.daysPastDue > 90 ? 'destructive' : 'secondary'}>
                        {caseItem.daysPastDue} {t('collectionCases.days', 'days')}
                      </Badge>
                    </TableCell>
                    <TableCell>{getDelinquencyBadge(caseItem.delinquencyBucket)}</TableCell>
                    <TableCell>{getPriorityBadge(caseItem.priority)}</TableCell>
                    <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                    <TableCell>{caseItem.assignedTo || t('collectionCases.unassigned')}</TableCell>
                    <TableCell>{formatDate(caseItem.lastContactDate)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{caseItem.callsThisMonth}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{caseItem.messagesThisMonth}</span>
                        </div>
                        {caseItem.hasPromiseToPay && (
                          <Badge variant="outline" className="text-xs">{t('collectionCases.ptp')}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewCase(caseItem)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{t('collectionCases.caseDetails')} - {selectedCase?.caseNumber}</DialogTitle>
                              <DialogDescription>
                                {t('collectionCases.completeInformation')}
                              </DialogDescription>
                            </DialogHeader>
                            
                            {detailsLoading ? (
                              <div className="flex items-center justify-center h-32">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                              </div>
                            ) : caseDetails ? (
                              <Tabs defaultValue="overview" className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
                                <TabsList className="grid w-full grid-cols-5">
                                  <TabsTrigger value="overview">{t('collectionCases.tabs.overview')}</TabsTrigger>
                                  <TabsTrigger value="interactions">{t('collectionCases.tabs.interactions')}</TabsTrigger>
                                  <TabsTrigger value="promises">{t('collectionCases.tabs.promises')}</TabsTrigger>
                                  <TabsTrigger value="visits">{t('collectionCases.tabs.visits')}</TabsTrigger>
                                  <TabsTrigger value="legal">{t('collectionCases.tabs.legal')}</TabsTrigger>
                                </TabsList>

                                <TabsContent value="overview" className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                          <User className="h-5 w-5" />
                                          {t('collectionCases.customerInformation')}
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-2">
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">{t('collectionCases.name')}:</span>
                                          <span className="font-medium">{caseDetails.caseInfo?.kastle_banking?.full_name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">{t('collectionCases.phone')}:</span>
                                          <span className="font-medium">{caseDetails.caseInfo?.kastle_banking?.phone_number}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">{t('collectionCases.email')}:</span>
                                          <span className="font-medium">{caseDetails.caseInfo?.kastle_banking?.email}</span>
                                        </div>
                                      </CardContent>
                                    </Card>

                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                          <DollarSign className="h-5 w-5" />
                                          {t('collectionCases.financialDetails')}
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-2">
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">{t('collectionCases.totalOutstanding')}:</span>
                                          <span className="font-bold text-red-600">
                                            {formatCurrency(caseDetails.caseInfo?.total_outstanding)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">{t('collectionCases.principal')}:</span>
                                          <span className="font-medium">
                                            {formatCurrency(caseDetails.caseInfo?.principal_outstanding)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">{t('collectionCases.interest')}:</span>
                                          <span className="font-medium">
                                            {formatCurrency(caseDetails.caseInfo?.interest_outstanding)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">{t('collectionCases.penalty')}:</span>
                                          <span className="font-medium">
                                            {formatCurrency(caseDetails.caseInfo?.penalty_outstanding)}
                                          </span>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>
                                </TabsContent>

                                <TabsContent value="interactions" className="space-y-4">
                                  <div className="space-y-3">
                                    {caseDetails.interactions?.map((interaction) => (
                                      <Card key={interaction.interaction_id}>
                                        <CardContent className="pt-4">
                                          <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                              {interaction.interaction_type === 'CALL' && <Phone className="h-5 w-5 text-blue-500" />}
                                              {interaction.interaction_type === 'EMAIL' && <Mail className="h-5 w-5 text-green-500" />}
                                              {interaction.interaction_type === 'VISIT' && <Home className="h-5 w-5 text-purple-500" />}
                                              {interaction.interaction_type === 'SMS' && <MessageSquare className="h-5 w-5 text-yellow-500" />}
                                              <div>
                                                <p className="font-medium">{t(`collectionCases.interactionType.${interaction.interaction_type.toLowerCase()}`)}</p>
                                                <p className="text-sm text-gray-600">
                                                  {t('collectionCases.by')} {interaction.kastle_collection?.officer_name}
                                                </p>
                                              </div>
                                            </div>
                                            <div className={isRTL ? 'text-left' : 'text-right'}>
                                              <p className="text-sm font-medium">{interaction.outcome}</p>
                                              <p className="text-xs text-gray-600">
                                                {formatDate(interaction.interaction_datetime)}
                                              </p>
                                            </div>
                                          </div>
                                          {interaction.notes && (
                                            <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                              {interaction.notes}
                                            </p>
                                          )}
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                </TabsContent>

                                <TabsContent value="promises" className="space-y-4">
                                  <div className="space-y-3">
                                    {caseDetails.promisesToPay?.map((ptp) => (
                                      <Card key={ptp.ptp_id}>
                                        <CardContent className="pt-4">
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <p className="font-medium">
                                                {formatCurrency(ptp.ptp_amount)} - {ptp.ptp_type}
                                              </p>
                                              <p className="text-sm text-gray-600">
                                                {t('collectionCases.promiseDate')}: {formatDate(ptp.ptp_date)}
                                              </p>
                                              <p className="text-sm text-gray-600">
                                                {t('collectionCases.officer')}: {ptp.kastle_collection?.officer_name}
                                              </p>
                                            </div>
                                            <div className={isRTL ? 'text-left' : 'text-right'}>
                                              {getStatusBadge(ptp.status)}
                                              <p className="text-sm text-gray-600 mt-1">
                                                {t('collectionCases.received')}: {formatCurrency(ptp.amount_received)}
                                              </p>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                </TabsContent>

                                <TabsContent value="visits" className="space-y-4">
                                  <div className="space-y-3">
                                    {caseDetails.fieldVisits?.map((visit) => (
                                      <Card key={visit.visit_id}>
                                        <CardContent className="pt-4">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                              <MapPin className="h-5 w-5 text-blue-500" />
                                              <div>
                                                <p className="font-medium">{visit.visit_status}</p>
                                                <p className="text-sm text-gray-600">
                                                  {formatDate(visit.visit_date)} - {visit.kastle_collection?.officer_name}
                                                </p>
                                              </div>
                                            </div>
                                            <div className={isRTL ? 'text-left' : 'text-right'}>
                                              <p className="font-medium text-green-600">
                                                {formatCurrency(visit.amount_collected)}
                                              </p>
                                              <p className="text-sm text-gray-600">{t('collectionCases.collected')}</p>
                                            </div>
                                          </div>
                                          {visit.notes && (
                                            <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                              {visit.notes}
                                            </p>
                                          )}
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                </TabsContent>

                                <TabsContent value="legal" className="space-y-4">
                                  {caseDetails.legalCase ? (
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                          <Gavel className="h-5 w-5" />
                                          {t('collectionCases.legalCaseInformation')}
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-3">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <span className="text-gray-600">{t('collectionCases.caseNumber')}:</span>
                                            <p className="font-medium">{caseDetails.legalCase.case_number}</p>
                                          </div>
                                          <div>
                                            <span className="text-gray-600">{t('collectionCases.court')}:</span>
                                            <p className="font-medium">{caseDetails.legalCase.court_name}</p>
                                          </div>
                                          <div>
                                            <span className="text-gray-600">{t('collectionCases.filingDate')}:</span>
                                            <p className="font-medium">{formatDate(caseDetails.legalCase.filing_date)}</p>
                                          </div>
                                          <div>
                                            <span className="text-gray-600">{t('collectionCases.currentStage')}:</span>
                                            <p className="font-medium">{caseDetails.legalCase.current_stage}</p>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ) : (
                                    <Card>
                                      <CardContent className="pt-6">
                                        <div className="text-center text-gray-500">
                                          <Gavel className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                          <p>{t('collectionCases.noLegalCase')}</p>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  )}
                                </TabsContent>
                              </Tabs>
                            ) : null}
                          </DialogContent>
                        </Dialog>
                        
                        <Button variant="outline" size="sm">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-700">
                {t('collectionCases.showing')} {((pagination.page - 1) * pagination.limit) + 1} {t('collectionCases.of')} {Math.min(pagination.page * pagination.limit, pagination.total)} {t('collectionCases.of')} {pagination.total} {t('collectionCases.totalCases')}
              </div>
              <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  {t('collectionCases.previous')}
                </Button>
                {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                {pagination.totalPages > 5 && <span className="px-2">...</span>}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  {t('collectionCases.next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CollectionCases;