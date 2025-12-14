/**
 * Ingest Page
 * EPIC 5 - Data ingestion interface (FILE, MANUAL, API modes)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, FileText, Database, Globe, Server, 
  PlayCircle, Check, AlertTriangle, X, Copy, ExternalLink
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';
const TENANT_ID = import.meta.env.VITE_TENANT_ID || 'demo-tenant-id';

const Ingest = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [dataset, setDataset] = useState('PARTY');
  const [sourceSystem, setSourceSystem] = useState('LMS');
  const [sourceSystems, setSourceSystems] = useState([]);
  const [methods, setMethods] = useState({});
  const [currentMethod, setCurrentMethod] = useState('FILE');
  
  // File mode
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Manual mode
  const [manualData, setManualData] = useState('[\n  {\n    "customer_id": "",\n    "full_name": "",\n    "national_id": ""\n  }\n]');
  
  // API mode
  const [webhookInfo, setWebhookInfo] = useState(null);
  
  // State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (methods[dataset]) {
      setCurrentMethod(methods[dataset]);
    }
  }, [dataset, methods]);

  useEffect(() => {
    if (currentMethod === 'API') {
      loadWebhookInfo();
    }
  }, [currentMethod, dataset, sourceSystem]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sourcesRes, methodsRes] = await Promise.all([
        fetch(`${API_BASE}/mdm/sources`, { headers: { 'x-tenant-id': TENANT_ID } }),
        fetch(`${API_BASE}/integration/config/methods`, { headers: { 'x-tenant-id': TENANT_ID } })
      ]);

      if (sourcesRes.ok) {
        const data = await sourcesRes.json();
        setSourceSystems(data.data || []);
      }

      if (methodsRes.ok) {
        const data = await methodsRes.json();
        setMethods(data.data?.methods || {});
        if (data.data?.methods?.PARTY) {
          setCurrentMethod(data.data.methods.PARTY);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWebhookInfo = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/integration/ingest/webhook-info?dataset=${dataset}&source_system_code=${sourceSystem}`,
        { headers: { 'x-tenant-id': TENANT_ID } }
      );
      if (res.ok) {
        const data = await res.json();
        setWebhookInfo(data.data);
      }
    } catch (error) {
      console.error('Error loading webhook info:', error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setResult(null);
    }
  };

  const submitIngestion = async () => {
    setSubmitting(true);
    setError(null);
    setResult(null);
    setUploadProgress(0);

    try {
      let res;

      if (currentMethod === 'FILE' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('dataset', dataset);
        formData.append('source_system_code', sourceSystem);

        res = await fetch(`${API_BASE}/integration/ingest`, {
          method: 'POST',
          headers: { 'x-tenant-id': TENANT_ID },
          body: formData
        });
      } else if (currentMethod === 'MANUAL' || currentMethod === 'API') {
        let data;
        try {
          data = JSON.parse(manualData);
          if (!Array.isArray(data)) {
            data = [data];
          }
        } catch (e) {
          setError('Invalid JSON format');
          setSubmitting(false);
          return;
        }

        res = await fetch(`${API_BASE}/integration/ingest`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': TENANT_ID
          },
          body: JSON.stringify({
            dataset,
            source_system_code: sourceSystem,
            mode: currentMethod,
            data
          })
        });
      }

      if (res) {
        const data = await res.json();
        if (data.success || res.status === 207) {
          setResult(data);
        } else {
          setError(data.error?.message || 'Ingestion failed');
        }
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
      setUploadProgress(100);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Data Ingestion</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Import data from files, manual entry, or API
          </p>
        </div>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Select dataset and source system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Dataset</Label>
              <Select value={dataset} onValueChange={setDataset}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PARTY">Party (Customers)</SelectItem>
                  <SelectItem value="CONTRACT">Contract (Loans)</SelectItem>
                  <SelectItem value="CHARGE">Charge (Fees)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Source System</Label>
              <Select value={sourceSystem} onValueChange={setSourceSystem}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sourceSystems.map(ss => (
                    <SelectItem key={ss.code} value={ss.code}>
                      {ss.name} ({ss.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Integration Method</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-lg py-1 px-3">
                  {currentMethod}
                </Badge>
                <span className="text-sm text-gray-500">
                  (configured for {dataset})
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Method-specific UI */}
      <Tabs value={currentMethod} onValueChange={setCurrentMethod}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="FILE" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            File Upload
          </TabsTrigger>
          <TabsTrigger value="MANUAL" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            Manual Entry
          </TabsTrigger>
          <TabsTrigger value="API" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            API / Webhook
          </TabsTrigger>
          <TabsTrigger value="DB" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Database
          </TabsTrigger>
        </TabsList>

        {/* FILE Mode */}
        <TabsContent value="FILE">
          <Card>
            <CardContent className="pt-6">
              <div 
                className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                {selectedFile ? (
                  <div>
                    <p className="text-lg font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-medium">Drop file here or click to browse</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Supported formats: CSV, XLSX, XLS
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MANUAL Mode */}
        <TabsContent value="MANUAL">
          <Card>
            <CardHeader>
              <CardTitle>Enter Data</CardTitle>
              <CardDescription>
                Enter data as a JSON array. Each object represents one record.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={manualData}
                onChange={(e) => setManualData(e.target.value)}
                className="font-mono text-sm h-[300px]"
                placeholder="[\n  { ... }\n]"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Mode */}
        <TabsContent value="API">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Information</CardTitle>
              <CardDescription>
                Use this endpoint to send data via API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {webhookInfo && (
                <>
                  <div className="space-y-2">
                    <Label>Endpoint</Label>
                    <div className="flex items-center gap-2">
                      <Input value={webhookInfo.endpoint} readOnly className="font-mono" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(webhookInfo.endpoint)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Headers</Label>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm overflow-auto">
                      {JSON.stringify(webhookInfo.headers, null, 2)}
                    </pre>
                  </div>
                  <div className="space-y-2">
                    <Label>Sample Payload</Label>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm overflow-auto">
                      {JSON.stringify(webhookInfo.samplePayload, null, 2)}
                    </pre>
                  </div>
                  <div className="pt-4 border-t">
                    <Label>Test with JSON data</Label>
                    <Textarea
                      value={manualData}
                      onChange={(e) => setManualData(e.target.value)}
                      className="font-mono text-sm h-[200px] mt-2"
                      placeholder="[\n  { ... }\n]"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DB Mode */}
        <TabsContent value="DB">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Database className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium">Database Sync</h3>
                <p className="text-gray-500 mt-2">
                  Database synchronization is configured through scheduled jobs.
                </p>
                <Button variant="outline" className="mt-4">
                  Configure Scheduled Jobs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submit Button */}
      {currentMethod !== 'DB' && (
        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={submitIngestion}
            disabled={submitting || (currentMethod === 'FILE' && !selectedFile)}
          >
            <PlayCircle className="w-5 h-5 mr-2" />
            {submitting ? 'Processing...' : 'Start Ingestion'}
          </Button>
        </div>
      )}

      {/* Progress */}
      {submitting && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Result */}
      {result && (
        <Card className={result.data?.status === 'failed' ? 'border-red-200' : 'border-green-200'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.data?.status === 'success' ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : result.data?.status === 'partial' ? (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              ) : (
                <X className="w-5 h-5 text-red-500" />
              )}
              Ingestion {result.data?.status || 'Complete'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-xl font-bold">{result.data?.stats?.totalReceived || 0}</p>
              </div>
              <div>
                <p className="text-sm text-green-600">Inserted</p>
                <p className="text-xl font-bold text-green-700">{result.data?.stats?.totalInserted || 0}</p>
              </div>
              <div>
                <p className="text-sm text-blue-600">Updated</p>
                <p className="text-xl font-bold text-blue-700">{result.data?.stats?.totalUpdated || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Skipped</p>
                <p className="text-xl font-bold text-gray-600">{result.data?.stats?.totalSkipped || 0}</p>
              </div>
              <div>
                <p className="text-sm text-red-600">Failed</p>
                <p className="text-xl font-bold text-red-700">{result.data?.stats?.totalFailed || 0}</p>
              </div>
            </div>
            {result.data?.run_id && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/admin/integration/runs/${result.data.run_id}`)}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Run Details
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Ingest;
