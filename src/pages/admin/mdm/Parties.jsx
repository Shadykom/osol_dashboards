/**
 * Parties (Golden Records) Page
 * EPIC 5 - View and search party golden records
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, RefreshCw, User, Building, ChevronRight, AlertTriangle,
  Eye, Filter, Users
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';
const TENANT_ID = import.meta.env.VITE_TENANT_ID || 'demo-tenant-id';

const Parties = () => {
  const { t: _t } = useTranslation();
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    party_type: '',
    status: ''
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0
  });

  const loadParties = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.party_type) params.append('party_type', filters.party_type);
      if (filters.status) params.append('status', filters.status);
      params.append('limit', pagination.limit);
      params.append('offset', pagination.offset);

      const res = await fetch(`${API_BASE}/mdm/parties?${params}`, {
        headers: { 'x-tenant-id': TENANT_ID }
      });

      if (res.ok) {
        const data = await res.json();
        setParties(data.data || []);
        setPagination(prev => ({ ...prev, total: data.meta?.total || 0 }));
      }
    } catch (error) {
      console.error('Error loading parties:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.offset]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, offset: 0 }));
    loadParties();
  };

  const formatIdentifiers = (identifiers) => {
    if (!identifiers || identifiers.length === 0) return '-';
    const first = identifiers[0];
    return (
      <div className="text-sm">
        <span className="text-gray-500">{first.type}:</span> {first.value}
        {identifiers.length > 1 && (
          <Badge variant="secondary" className="ml-2">+{identifiers.length - 1}</Badge>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Parties</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Browse and search party golden records
          </p>
        </div>
        <Button onClick={loadParties} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pagination.total}</p>
                <p className="text-sm text-gray-500">Total Parties</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {parties.filter(p => p.party_type === 'PERSON').length}
                </p>
                <p className="text-sm text-gray-500">Individuals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {parties.filter(p => p.party_type === 'ORGANIZATION').length}
                </p>
                <p className="text-sm text-gray-500">Organizations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {parties.filter(p => p.dq_issue_count > 0).length}
                </p>
                <p className="text-sm text-gray-500">With DQ Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-9"
                />
              </div>
            </div>
            <Select
              value={filters.party_type}
              onValueChange={(v) => setFilters(prev => ({ ...prev, party_type: v }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="PERSON">Person</SelectItem>
                <SelectItem value="ORGANIZATION">Organization</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.status}
              onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="merged">Merged</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            {(filters.search || filters.party_type || filters.status) && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setFilters({ search: '', party_type: '', status: '' })}
              >
                Clear
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Parties Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Identifiers</TableHead>
                    <TableHead>Sources</TableHead>
                    <TableHead>DQ Issues</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parties.map(party => (
                    <TableRow 
                      key={party.party_id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => navigate(`/admin/mdm/parties/${party.party_id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {party.party_type === 'PERSON' ? (
                            <User className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Building className="w-4 h-4 text-purple-500" />
                          )}
                          <span className="text-sm">{party.party_type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{party.primary_name}</p>
                          {party.primary_name_ar && (
                            <p className="text-sm text-gray-500" dir="rtl">{party.primary_name_ar}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatIdentifiers(party.identifiers_json)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{party.source_count || 0} sources</Badge>
                      </TableCell>
                      <TableCell>
                        {party.dq_issue_count > 0 ? (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            {party.dq_issue_count}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">0</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          party.status === 'active' ? 'default' :
                          party.status === 'merged' ? 'secondary' :
                          'outline'
                        }>
                          {party.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </TableCell>
                    </TableRow>
                  ))}
                  {parties.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No parties found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.total > pagination.limit && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.offset === 0}
                      onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset - prev.limit }))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.offset + pagination.limit >= pagination.total}
                      onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Parties;
