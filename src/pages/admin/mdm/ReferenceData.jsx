/**
 * Reference Data Management Page
 * EPIC 5 - CRUD for reference data (Countries, Nationalities, Fee Types, etc.)
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, Edit, Trash2, Search, RefreshCw, Check, X, Book
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';
const TENANT_ID = import.meta.env.VITE_TENANT_ID || 'demo-tenant-id';

const ReferenceData = () => {
  const { t: _t } = useTranslation();
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    domain: '',
    code: '',
    name_en: '',
    name_ar: '',
    extra_json: '{}',
    sort_order: 0
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const loadDomains = async () => {
    try {
      const res = await fetch(`${API_BASE}/mdm/reference-data/domains`, {
        headers: { 'x-tenant-id': TENANT_ID }
      });
      if (res.ok) {
        const data = await res.json();
        setDomains(data.data || []);
        if (data.data?.length > 0 && !selectedDomain) {
          setSelectedDomain(data.data[0].domain);
        }
      }
    } catch (error) {
      console.error('Error loading domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('domain', selectedDomain);
      if (search) params.append('search', search);

      const res = await fetch(`${API_BASE}/mdm/reference-data?${params}`, {
        headers: { 'x-tenant-id': TENANT_ID }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.data || []);
      }
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDomains();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedDomain) {
      loadItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDomain, search]);

  const openCreateDialog = () => {
    setEditingItem(null);
    setFormData({
      domain: selectedDomain,
      code: '',
      name_en: '',
      name_ar: '',
      extra_json: '{}',
      sort_order: items.length
    });
    setDialogOpen(true);
  };

  const openEditDialog = (item) => {
    setEditingItem(item);
    setFormData({
      domain: item.domain,
      code: item.code,
      name_en: item.name_en || '',
      name_ar: item.name_ar || '',
      extra_json: JSON.stringify(item.extra_json || {}, null, 2),
      sort_order: item.sort_order || 0
    });
    setDialogOpen(true);
  };

  const saveItem = async () => {
    setSaving(true);
    setMessage(null);

    try {
      let extraJson;
      try {
        extraJson = JSON.parse(formData.extra_json);
      } catch {
        setMessage({ type: 'error', text: 'Invalid JSON in extra data' });
        setSaving(false);
        return;
      }

      const payload = {
        ...formData,
        extra_json: extraJson
      };

      const url = editingItem 
        ? `${API_BASE}/mdm/reference-data/${editingItem.id}`
        : `${API_BASE}/mdm/reference-data`;
      
      const method = editingItem ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': TENANT_ID
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setDialogOpen(false);
        loadItems();
        setMessage({ type: 'success', text: `Item ${editingItem ? 'updated' : 'created'} successfully` });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error?.message || 'Failed to save' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const res = await fetch(`${API_BASE}/mdm/reference-data/${id}`, {
        method: 'DELETE',
        headers: { 'x-tenant-id': TENANT_ID }
      });

      if (res.ok) {
        loadItems();
        setMessage({ type: 'success', text: 'Item deleted' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const DOMAIN_LABELS = {
    COUNTRY: { label: 'Countries', icon: '🌍' },
    NATIONALITY: { label: 'Nationalities', icon: '🏳️' },
    FEE_TYPE: { label: 'Fee Types', icon: '💰' },
    CHARGE_TYPE: { label: 'Charge Types', icon: '📋' },
    PARTY_TYPE: { label: 'Party Types', icon: '👥' },
    CONTRACT_STATUS: { label: 'Contract Status', icon: '📄' },
    ID_TYPE: { label: 'ID Types', icon: '🪪' },
    DQ_RULE: { label: 'DQ Rules', icon: '✅' },
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reference Data</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage reference data for countries, nationalities, fee types, and more
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadItems} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Domain Selector and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Book className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">Domain:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {domains.map(d => {
                const config = DOMAIN_LABELS[d.domain] || { label: d.domain, icon: '📌' };
                return (
                  <Button
                    key={d.domain}
                    variant={selectedDomain === d.domain ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedDomain(d.domain)}
                  >
                    <span className="mr-1">{config.icon}</span>
                    {config.label}
                    <Badge variant="secondary" className="ml-2">{d.count}</Badge>
                  </Button>
                );
              })}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name (EN)</TableHead>
                  <TableHead>Name (AR)</TableHead>
                  <TableHead>Extra Data</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono font-medium">{item.code}</TableCell>
                    <TableCell>{item.name_en}</TableCell>
                    <TableCell dir="rtl">{item.name_ar}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {Object.keys(item.extra_json || {}).length > 0 && (
                        <Badge variant="outline" className="font-mono text-xs">
                          {Object.keys(item.extra_json).length} fields
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{item.sort_order}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No items found in this domain
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Reference Data' : 'Add Reference Data'}
            </DialogTitle>
            <DialogDescription>
              {editingItem 
                ? 'Update the reference data item'
                : `Add a new item to ${DOMAIN_LABELS[selectedDomain]?.label || selectedDomain}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Domain</Label>
                <Input value={formData.domain} disabled />
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  disabled={!!editingItem}
                  placeholder="e.g., SA, LATE_FEE"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Name (English)</Label>
              <Input
                value={formData.name_en}
                onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                placeholder="English name"
              />
            </div>
            <div className="space-y-2">
              <Label>Name (Arabic)</Label>
              <Input
                dir="rtl"
                value={formData.name_ar}
                onChange={(e) => setFormData(prev => ({ ...prev, name_ar: e.target.value }))}
                placeholder="الاسم بالعربي"
              />
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Extra Data (JSON)</Label>
              <Textarea
                value={formData.extra_json}
                onChange={(e) => setFormData(prev => ({ ...prev, extra_json: e.target.value }))}
                className="font-mono text-sm h-32"
                placeholder="{}"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveItem} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReferenceData;
