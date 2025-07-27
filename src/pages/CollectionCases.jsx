import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '../components/ui/table';
import { 
  Search, Filter, Eye, Phone, Mail, MapPin, Calendar,
  AlertTriangle, CheckCircle, Clock, DollarSign, User,
  FileText, MessageSquare, Gavel, Home
} from 'lucide-react';
import { CollectionService } from '../services/collectionService';

const CollectionCases = () => {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseDetails, setCaseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
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
  }, []);

  useEffect(() => {
    // Reload data when filters change
    const debounceTimer = setTimeout(() => {
      loadCollectionCases();
    }, 500); // Debounce to avoid too many API calls
    
    return () => clearTimeout(debounceTimer);
  }, [filters]);

  const loadCollectionCases = async () => {
    setLoading(true);
    try {
      const response = await CollectionService.getCollectionCases({ 
        limit: 200,
        search: filters.search || null,
        status: filters.status === 'all' ? null : filters.status || null,
        priority: filters.priority === 'all' ? null : filters.priority || null,
        bucket: filters.bucket === 'all' ? null : filters.bucket || null,
        assignedTo: filters.assignedTo === 'all' ? null : filters.assignedTo || null,
        minAmount: filters.minAmount || null,
        maxAmount: filters.maxAmount || null,
        minDpd: filters.minDpd || null,
        maxDpd: filters.maxDpd || null
      });
      if (response.success) {
        setCases(response.data);
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'ACTIVE': { color: 'bg-blue-500', text: 'Active' },
      'RESOLVED': { color: 'bg-green-500', text: 'Resolved' },
      'LEGAL': { color: 'bg-purple-500', text: 'Legal' },
      'WRITTEN_OFF': { color: 'bg-gray-500', text: 'Written Off' },
      'SETTLED': { color: 'bg-yellow-500', text: 'Settled' },
      'CLOSED': { color: 'bg-gray-400', text: 'Closed' }
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
      'CRITICAL': { color: 'bg-red-500', text: 'Critical' },
      'HIGH': { color: 'bg-orange-500', text: 'High' },
      'MEDIUM': { color: 'bg-yellow-500', text: 'Medium' },
      'LOW': { color: 'bg-green-500', text: 'Low' }
    };
    const config = priorityConfig[priority] || { color: 'bg-gray-500', text: priority };
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const handleViewCase = (caseItem) => {
    setSelectedCase(caseItem);
    loadCaseDetails(caseItem.caseId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Collection Cases</h1>
          <p className="text-gray-600 mt-1">Manage and track collection cases</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <User className="h-4 w-4 mr-2" />
            Assign Cases
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search cases..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="LEGAL">Legal</SelectItem>
                <SelectItem value="WRITTEN_OFF">Written Off</SelectItem>
                <SelectItem value="SETTLED">Settled</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <Input
              placeholder="Min Amount"
              type="number"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
            />
            <Input
              placeholder="Max Amount"
              type="number"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
            />
            <Input
              placeholder="Min DPD"
              type="number"
              value={filters.minDpd}
              onChange={(e) => handleFilterChange('minDpd', e.target.value)}
            />
            <Input
              placeholder="Max DPD"
              type="number"
              value={filters.maxDpd}
              onChange={(e) => handleFilterChange('maxDpd', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Collection Cases ({cases.length})</CardTitle>
          <CardDescription>
            Showing {cases.length} of {cases.length} total cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>DPD</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Actions</TableHead>
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
                        {caseItem.daysPastDue} days
                      </Badge>
                    </TableCell>
                    <TableCell>{getPriorityBadge(caseItem.priority)}</TableCell>
                    <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                    <TableCell>{caseItem.assignedTo || 'Unassigned'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
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
                              <DialogTitle>Case Details - {selectedCase?.caseNumber}</DialogTitle>
                              <DialogDescription>
                                Complete case information and interaction history
                              </DialogDescription>
                            </DialogHeader>
                            
                            {detailsLoading ? (
                              <div className="flex items-center justify-center h-32">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                              </div>
                            ) : caseDetails ? (
                              <Tabs defaultValue="overview" className="w-full">
                                <TabsList className="grid w-full grid-cols-5">
                                  <TabsTrigger value="overview">Overview</TabsTrigger>
                                  <TabsTrigger value="interactions">Interactions</TabsTrigger>
                                  <TabsTrigger value="promises">Promises</TabsTrigger>
                                  <TabsTrigger value="visits">Field Visits</TabsTrigger>
                                  <TabsTrigger value="legal">Legal</TabsTrigger>
                                </TabsList>

                                <TabsContent value="overview" className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                          <User className="h-5 w-5" />
                                          Customer Information
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-2">
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Name:</span>
                                          <span className="font-medium">{caseDetails.caseInfo?.kastle_banking?.full_name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Phone:</span>
                                          <span className="font-medium">{caseDetails.caseInfo?.kastle_banking?.phone_number}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Email:</span>
                                          <span className="font-medium">{caseDetails.caseInfo?.kastle_banking?.email}</span>
                                        </div>
                                      </CardContent>
                                    </Card>

                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                          <DollarSign className="h-5 w-5" />
                                          Financial Details
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-2">
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Total Outstanding:</span>
                                          <span className="font-bold text-red-600">
                                            {formatCurrency(caseDetails.caseInfo?.total_outstanding)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Principal:</span>
                                          <span className="font-medium">
                                            {formatCurrency(caseDetails.caseInfo?.principal_outstanding)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Interest:</span>
                                          <span className="font-medium">
                                            {formatCurrency(caseDetails.caseInfo?.interest_outstanding)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Penalty:</span>
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
                                                <p className="font-medium">{interaction.interaction_type}</p>
                                                <p className="text-sm text-gray-600">
                                                  by {interaction.kastle_collection?.officer_name}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="text-right">
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
                                                Promise Date: {formatDate(ptp.ptp_date)}
                                              </p>
                                              <p className="text-sm text-gray-600">
                                                Officer: {ptp.kastle_collection?.officer_name}
                                              </p>
                                            </div>
                                            <div className="text-right">
                                              {getStatusBadge(ptp.status)}
                                              <p className="text-sm text-gray-600 mt-1">
                                                Received: {formatCurrency(ptp.amount_received)}
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
                                            <div className="text-right">
                                              <p className="font-medium text-green-600">
                                                {formatCurrency(visit.amount_collected)}
                                              </p>
                                              <p className="text-sm text-gray-600">Collected</p>
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
                                          Legal Case Information
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-3">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <span className="text-gray-600">Case Number:</span>
                                            <p className="font-medium">{caseDetails.legalCase.case_number}</p>
                                          </div>
                                          <div>
                                            <span className="text-gray-600">Court:</span>
                                            <p className="font-medium">{caseDetails.legalCase.court_name}</p>
                                          </div>
                                          <div>
                                            <span className="text-gray-600">Filing Date:</span>
                                            <p className="font-medium">{formatDate(caseDetails.legalCase.filing_date)}</p>
                                          </div>
                                          <div>
                                            <span className="text-gray-600">Current Stage:</span>
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
                                          <p>No legal case associated with this collection case</p>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default CollectionCases;

