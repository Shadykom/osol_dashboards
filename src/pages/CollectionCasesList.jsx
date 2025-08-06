import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  ArrowLeft, Search, Filter, Download, RefreshCw,
  User, Phone, DollarSign, Calendar, AlertTriangle,
  ChevronLeft, ChevronRight, Eye
} from 'lucide-react';
import { CollectionService } from '../services/collectionService';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

const CollectionCasesList = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCases, setTotalCases] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: location.state?.filters?.status || 'all',
    priority: 'all',
    bucket: 'all',
    assignedTo: 'all',
    branch: location.state?.filters?.branch || 'all',
    team: location.state?.filters?.team || 'all'
  });

  const itemsPerPage = 20;

  useEffect(() => {
    loadCases();
  }, [currentPage, filters, searchTerm]);

  const loadCases = async () => {
    setLoading(true);
    try {
      // Build filters object
      const queryFilters = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== 'all') {
          queryFilters[key] = value;
        }
      });

      const response = await CollectionService.getCollectionCases({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        ...queryFilters
      });

      if (response.success) {
        setCases(response.data || []);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages || 1);
          setTotalCases(response.pagination.totalItems || 0);
        }
      } else {
        console.error('Error loading cases:', response.error);
        setCases([]);
      }
    } catch (error) {
      console.error('Error loading cases:', error);
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all',
      bucket: 'all',
      assignedTo: 'all',
      branch: 'all',
      team: 'all'
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const viewCaseDetails = (caseItem) => {
    navigate(`/collection/case/${caseItem.caseId}`, { 
      state: { caseData: caseItem } 
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'ACTIVE': { variant: 'default', className: 'bg-blue-500' },
      'RESOLVED': { variant: 'success', className: 'bg-green-500' },
      'LEGAL': { variant: 'destructive', className: 'bg-purple-500' },
      'WRITTEN_OFF': { variant: 'secondary', className: 'bg-gray-500' },
      'SETTLED': { variant: 'warning', className: 'bg-yellow-500' },
      'CLOSED': { variant: 'outline', className: 'bg-gray-400' }
    };
    
    const config = statusConfig[status] || { variant: 'outline', className: '' };
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      'CRITICAL': { variant: 'destructive', className: 'bg-red-600' },
      'HIGH': { variant: 'destructive', className: 'bg-red-500' },
      'MEDIUM': { variant: 'warning', className: 'bg-yellow-500' },
      'LOW': { variant: 'secondary', className: 'bg-gray-400' }
    };
    
    const config = priorityConfig[priority] || { variant: 'outline', className: '' };
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {priority}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t('collectionCases.title', 'Collection Cases')}</h1>
            <p className="text-muted-foreground">
              {t('collectionCases.subtitle', 'Manage and track all collection cases')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={loadCases}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t('common.export', 'Export')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('common.filters', 'Filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t('collectionCases.searchPlaceholder', 'Search by case number, customer name, or account...')}
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('collectionCases.status', 'Status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all', 'All')}</SelectItem>
                  <SelectItem value="ACTIVE">{t('collectionCases.active', 'Active')}</SelectItem>
                  <SelectItem value="RESOLVED">{t('collectionCases.resolved', 'Resolved')}</SelectItem>
                  <SelectItem value="LEGAL">{t('collectionCases.legal', 'Legal')}</SelectItem>
                  <SelectItem value="WRITTEN_OFF">{t('collectionCases.writtenOff', 'Written Off')}</SelectItem>
                  <SelectItem value="SETTLED">{t('collectionCases.settled', 'Settled')}</SelectItem>
                  <SelectItem value="CLOSED">{t('collectionCases.closed', 'Closed')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('collectionCases.priority', 'Priority')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all', 'All')}</SelectItem>
                  <SelectItem value="CRITICAL">{t('collectionCases.critical', 'Critical')}</SelectItem>
                  <SelectItem value="HIGH">{t('collectionCases.high', 'High')}</SelectItem>
                  <SelectItem value="MEDIUM">{t('collectionCases.medium', 'Medium')}</SelectItem>
                  <SelectItem value="LOW">{t('collectionCases.low', 'Low')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.bucket} onValueChange={(value) => handleFilterChange('bucket', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('collectionCases.bucket', 'Bucket')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all', 'All')}</SelectItem>
                  <SelectItem value="1">{t('collectionCases.bucket1', '0-30 Days')}</SelectItem>
                  <SelectItem value="2">{t('collectionCases.bucket2', '31-60 Days')}</SelectItem>
                  <SelectItem value="3">{t('collectionCases.bucket3', '61-90 Days')}</SelectItem>
                  <SelectItem value="4">{t('collectionCases.bucket4', '91-120 Days')}</SelectItem>
                  <SelectItem value="5">{t('collectionCases.bucket5', '120+ Days')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.branch} onValueChange={(value) => handleFilterChange('branch', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('collectionCases.branch', 'Branch')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all', 'All')}</SelectItem>
                  <SelectItem value="RYD_MAIN">Riyadh Main</SelectItem>
                  <SelectItem value="JEDDAH">Jeddah</SelectItem>
                  <SelectItem value="DAMMAM">Dammam</SelectItem>
                  <SelectItem value="KHOBAR">Khobar</SelectItem>
                  <SelectItem value="MAKKAH">Makkah</SelectItem>
                  <SelectItem value="MADINAH">Madinah</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.team} onValueChange={(value) => handleFilterChange('team', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('collectionCases.team', 'Team')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all', 'All')}</SelectItem>
                  <SelectItem value="TEAM_A">Team A</SelectItem>
                  <SelectItem value="TEAM_B">Team B</SelectItem>
                  <SelectItem value="TEAM_C">Team C</SelectItem>
                  <SelectItem value="TEAM_D">Team D</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters}>
                {t('common.clearFilters', 'Clear Filters')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('collectionCases.casesTable', 'Cases')} ({totalCases})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-muted-foreground">{t('common.loading', 'Loading...')}</p>
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('collectionCases.noCases', 'No cases found')}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('collectionCases.caseNumber', 'Case Number')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('collectionCases.customer', 'Customer')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('collectionCases.outstanding', 'Outstanding')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('collectionCases.dpd', 'DPD')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('collectionCases.status', 'Status')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('collectionCases.priority', 'Priority')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('collectionCases.assignedTo', 'Assigned To')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('collectionCases.actions', 'Actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cases.map((caseItem) => (
                      <tr key={caseItem.caseId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {caseItem.caseNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {caseItem.accountNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {caseItem.customerName}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {caseItem.customerPhone}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(caseItem.totalOutstanding)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {caseItem.productType}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {caseItem.daysPastDue} days
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {caseItem.delinquencyBucket}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(caseItem.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPriorityBadge(caseItem.priority)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {caseItem.assignedTo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewCaseDetails(caseItem)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {t('common.view', 'View')}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  {t('common.showing', 'Showing')} {((currentPage - 1) * itemsPerPage) + 1} {t('common.to', 'to')} {Math.min(currentPage * itemsPerPage, totalCases)} {t('common.of', 'of')} {totalCases} {t('common.results', 'results')}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t('common.previous', 'Previous')}
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNumber = currentPage - 2 + i;
                      if (pageNumber > 0 && pageNumber <= totalPages) {
                        return (
                          <Button
                            key={pageNumber}
                            variant={pageNumber === currentPage ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(pageNumber)}
                          >
                            {pageNumber}
                          </Button>
                        );
                      }
                      return null;
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    {t('common.next', 'Next')}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CollectionCasesList;