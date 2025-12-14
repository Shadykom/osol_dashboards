/**
 * Party Detail Page
 * EPIC 5 - View party golden record details with sources, contacts, DQ issues
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ArrowLeft, User, Building, RefreshCw, Phone, Mail, MapPin,
  AlertTriangle, Link, FileText, Check, X, History
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';
const TENANT_ID = import.meta.env.VITE_TENANT_ID || 'demo-tenant-id';

const PartyDetail = () => {
  const { id } = useParams();
  const { t: _t } = useTranslation();
  const navigate = useNavigate();
  const [party, setParty] = useState(null);
  const [sources, setSources] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPartyDetails = async () => {
    setLoading(true);
    try {
      const [partyRes, sourcesRes, contractsRes] = await Promise.all([
        fetch(`${API_BASE}/mdm/parties/${id}`, { headers: { 'x-tenant-id': TENANT_ID } }),
        fetch(`${API_BASE}/mdm/parties/${id}/sources`, { headers: { 'x-tenant-id': TENANT_ID } }),
        fetch(`${API_BASE}/mdm/parties/${id}/contracts`, { headers: { 'x-tenant-id': TENANT_ID } })
      ]);

      if (partyRes.ok) {
        const data = await partyRes.json();
        setParty(data.data);
      }

      if (sourcesRes.ok) {
        const data = await sourcesRes.json();
        setSources(data.data || []);
      }

      if (contractsRes.ok) {
        const data = await contractsRes.json();
        setContracts(data.data || []);
      }
    } catch (error) {
      console.error('Error loading party details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartyDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const getContactIcon = (type) => {
    switch (type) {
      case 'PHONE':
      case 'MOBILE':
        return <Phone className="w-4 h-4" />;
      case 'EMAIL':
        return <Mail className="w-4 h-4" />;
      case 'ADDRESS':
        return <MapPin className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!party) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate('/admin/mdm/parties')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Parties
        </Button>
        <div className="text-center mt-8">
          <h2 className="text-xl font-semibold">Party not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/mdm/parties')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${
              party.party_type === 'PERSON' ? 'bg-blue-100' : 'bg-purple-100'
            }`}>
              {party.party_type === 'PERSON' ? (
                <User className="w-6 h-6 text-blue-600" />
              ) : (
                <Building className="w-6 h-6 text-purple-600" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{party.primary_name}</h1>
              {party.primary_name_ar && (
                <p className="text-gray-500" dir="rtl">{party.primary_name_ar}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={party.status === 'active' ? 'default' : 'secondary'}>
            {party.status}
          </Badge>
          <Button onClick={loadPartyDetails} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Type</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{party.party_type}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{sources.length}</p>
          </CardContent>
        </Card>
        <Card className={party.dq_issues?.length > 0 ? 'border-yellow-200 bg-yellow-50' : ''}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {party.dq_issues?.length > 0 && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
              DQ Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{party.dq_issues?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sources">Sources ({sources.length})</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({party.contacts?.length || 0})</TabsTrigger>
          <TabsTrigger value="contracts">Contracts ({contracts.length})</TabsTrigger>
          <TabsTrigger value="dq">
            DQ Issues
            {party.dq_issues?.length > 0 && (
              <Badge variant="destructive" className="ml-2">{party.dq_issues.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Identifiers</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {party.identifiers_json?.map((id, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Badge variant="outline">{id.type}</Badge>
                        </TableCell>
                        <TableCell className="font-mono">{id.value}</TableCell>
                      </TableRow>
                    ))}
                    {(!party.identifiers_json || party.identifiers_json.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-gray-500 text-center">
                          No identifiers
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attributes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(party.attributes_json || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-1 border-b">
                      <span className="text-gray-500">{key}</span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                  {Object.keys(party.attributes_json || {}).length === 0 && (
                    <p className="text-gray-500 text-center">No attributes</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source System</TableHead>
                    <TableHead>External Ref</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>First Seen</TableHead>
                    <TableHead>Last Seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sources.map(source => (
                    <TableRow key={source.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{source.source_system_name}</p>
                          <p className="text-xs text-gray-500">{source.source_system_code}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{source.external_party_ref}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500" 
                              style={{ width: `${(source.confidence_score || 1) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm">{((source.confidence_score || 1) * 100).toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(source.effective_at)}</TableCell>
                      <TableCell className="text-sm">{formatDate(source.last_seen_at)}</TableCell>
                    </TableRow>
                  ))}
                  {sources.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No source mappings found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Primary</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {party.contacts?.map(contact => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getContactIcon(contact.contact_type)}
                          <span>{contact.contact_type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{contact.value}</TableCell>
                      <TableCell>
                        {contact.is_primary ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <X className="w-4 h-4 text-gray-300" />
                        )}
                      </TableCell>
                      <TableCell>
                        {contact.is_verified ? (
                          <Badge variant="default">Verified</Badge>
                        ) : (
                          <Badge variant="secondary">Unverified</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {contact.source_system_id ? 'External' : 'Manual'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!party.contacts || party.contacts.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No contacts found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract Number</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Secured</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map(contract => (
                    <TableRow key={contract.contract_id}>
                      <TableCell className="font-mono">{contract.contract_number || '-'}</TableCell>
                      <TableCell>{contract.product_code || '-'}</TableCell>
                      <TableCell>
                        {contract.secured_flag ? (
                          <Badge>Secured</Badge>
                        ) : (
                          <Badge variant="secondary">Unsecured</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          contract.status === 'active' ? 'default' :
                          contract.status === 'closed' ? 'secondary' :
                          'destructive'
                        }>
                          {contract.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{contract.start_date || '-'}</TableCell>
                      <TableCell>{contract.end_date || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {contracts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No contracts found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DQ Issues Tab */}
        <TabsContent value="dq">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severity</TableHead>
                    <TableHead>Rule</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {party.dq_issues?.map(issue => (
                    <TableRow key={issue.id}>
                      <TableCell>
                        <Badge variant={
                          issue.severity === 'critical' ? 'destructive' :
                          issue.severity === 'high' ? 'destructive' :
                          issue.severity === 'medium' ? 'secondary' :
                          'outline'
                        }>
                          {issue.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{issue.rule_code}</TableCell>
                      <TableCell>{issue.message}</TableCell>
                      <TableCell>
                        <Badge variant={issue.status === 'open' ? 'outline' : 'secondary'}>
                          {issue.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(issue.created_at)}</TableCell>
                    </TableRow>
                  ))}
                  {(!party.dq_issues || party.dq_issues.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No data quality issues
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PartyDetail;
