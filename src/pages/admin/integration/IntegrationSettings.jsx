/**
 * Integration Settings Page
 * EPIC 5 - Configure integration methods and mapping templates
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Settings, Database, FileUp, Globe, Server, 
  Save, RefreshCw, Check, AlertTriangle, Code
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';
const TENANT_ID = import.meta.env.VITE_TENANT_ID || 'demo-tenant-id';

const IntegrationSettings = () => {
  const { t } = useTranslation();
  const [methods, setMethods] = useState({});
  const [mappings, setMappings] = useState([]);
  const [selectedMapping, setSelectedMapping] = useState(null);
  const [mappingJson, setMappingJson] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const DATASETS = ['PARTY', 'CONTRACT', 'CHARGE'];
  const METHODS = [
    { value: 'FILE', label: 'File Upload (CSV/XLSX)', icon: FileUp },
    { value: 'MANUAL', label: 'Manual Entry', icon: Server },
    { value: 'API', label: 'API / Webhook', icon: Globe },
    { value: 'DB', label: 'Database Sync', icon: Database },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const [methodsRes, mappingsRes] = await Promise.all([
        fetch(`${API_BASE}/integration/config/methods`, {
          headers: { 'x-tenant-id': TENANT_ID }
        }),
        fetch(`${API_BASE}/integration/mappings`, {
          headers: { 'x-tenant-id': TENANT_ID }
        })
      ]);

      if (methodsRes.ok) {
        const data = await methodsRes.json();
        setMethods(data.data?.methods || {});
      }

      if (mappingsRes.ok) {
        const data = await mappingsRes.json();
        setMappings(data.data || []);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const saveMethod = async (dataset, method) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/integration/config/methods`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': TENANT_ID
        },
        body: JSON.stringify({ methods: { [dataset]: method } })
      });

      if (res.ok) {
        setMethods(prev => ({ ...prev, [dataset]: method }));
        setMessage({ type: 'success', text: `Integration method for ${dataset} updated` });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save method' });
    } finally {
      setSaving(false);
    }
  };

  const selectMapping = (mapping) => {
    setSelectedMapping(mapping);
    setMappingJson(JSON.stringify(mapping.mapping_json, null, 2));
  };

  const saveMapping = async () => {
    if (!selectedMapping) return;
    
    setSaving(true);
    try {
      let parsedJson;
      try {
        parsedJson = JSON.parse(mappingJson);
      } catch (e) {
        setMessage({ type: 'error', text: 'Invalid JSON format' });
        setSaving(false);
        return;
      }

      const res = await fetch(`${API_BASE}/integration/mappings/${selectedMapping.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': TENANT_ID
        },
        body: JSON.stringify({ mapping_json: parsedJson })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Mapping template saved' });
        loadSettings();
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save mapping' });
    } finally {
      setSaving(false);
    }
  };

  const getMethodIcon = (method) => {
    const found = METHODS.find(m => m.value === method);
    return found ? found.icon : Settings;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Integration Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure data integration methods and mapping templates
          </p>
        </div>
        <Button onClick={loadSettings} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Message Alert */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="methods" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="methods">Integration Methods</TabsTrigger>
          <TabsTrigger value="mappings">Mapping Templates</TabsTrigger>
        </TabsList>

        {/* Integration Methods Tab */}
        <TabsContent value="methods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Dataset Integration Methods
              </CardTitle>
              <CardDescription>
                Select how data will be ingested for each dataset type
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {DATASETS.map(dataset => {
                const currentMethod = methods[dataset] || 'FILE';
                const Icon = getMethodIcon(currentMethod);
                
                return (
                  <div key={dataset} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{dataset}</h3>
                        <p className="text-sm text-gray-500">
                          Current: <Badge variant="outline">{currentMethod}</Badge>
                        </p>
                      </div>
                    </div>
                    <Select
                      value={currentMethod}
                      onValueChange={(value) => saveMethod(dataset, value)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        {METHODS.map(method => (
                          <SelectItem key={method.value} value={method.value}>
                            <div className="flex items-center gap-2">
                              <method.icon className="w-4 h-4" />
                              {method.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Method Descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {METHODS.map(method => (
              <Card key={method.value} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <method.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <h4 className="font-medium">{method.label}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {method.value === 'FILE' && 'Upload CSV or Excel files through the admin interface'}
                        {method.value === 'MANUAL' && 'Enter data manually through a form interface'}
                        {method.value === 'API' && 'Receive data via webhook or REST API calls'}
                        {method.value === 'DB' && 'Sync data from staging tables or external databases'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Mapping Templates Tab */}
        <TabsContent value="mappings" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Mapping List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Templates</CardTitle>
                <CardDescription>Select a template to edit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {mappings.map(mapping => (
                  <div
                    key={mapping.id}
                    onClick={() => selectMapping(mapping)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedMapping?.id === mapping.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{mapping.name}</p>
                        <p className="text-xs text-gray-500">
                          {mapping.source_system_code} • {mapping.dataset}
                        </p>
                      </div>
                      {mapping.is_default && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </div>
                  </div>
                ))}
                {mappings.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No mapping templates found
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Mapping Editor */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Mapping JSON Editor
                </CardTitle>
                <CardDescription>
                  {selectedMapping 
                    ? `Editing: ${selectedMapping.name}` 
                    : 'Select a template to edit'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedMapping ? (
                  <div className="space-y-4">
                    <Textarea
                      value={mappingJson}
                      onChange={(e) => setMappingJson(e.target.value)}
                      className="font-mono text-sm h-[400px]"
                      placeholder="Mapping JSON..."
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setSelectedMapping(null)}>
                        Cancel
                      </Button>
                      <Button onClick={saveMapping} disabled={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Mapping'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
                    <Code className="w-12 h-12 mb-4 opacity-50" />
                    <p>Select a mapping template from the list to edit</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationSettings;
