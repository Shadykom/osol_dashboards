import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, ComposedChart
} from 'recharts';
import { 
  Shield, AlertTriangle, CheckCircle, TrendingUp,
  Building2, BarChart3, PieChart as PieChartIcon, Info
} from 'lucide-react';
import { format } from 'date-fns';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

const CapitalAdequacyReport = ({ data, isRTL = false }) => {
  if (!data) return null;

  const {
    asOfDate,
    cet1Ratio,
    tier1Ratio,
    totalCapitalRatio,
    capitalComponents,
    riskWeightedAssetsByType,
    complianceStatus,
    riskWeightedAssets,
    cet1Capital,
    tier1Capital,
    tier2Capital,
    totalCapital
  } = data;

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${parseFloat(value).toFixed(2)}%`;
  };

  // Check compliance status for a ratio
  const getComplianceStatus = (actual, minimum) => {
    const actualValue = parseFloat(actual);
    const minimumValue = parseFloat(minimum);
    if (actualValue >= minimumValue) {
      return { status: 'compliant', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle };
    } else if (actualValue >= minimumValue * 0.9) {
      return { status: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: AlertTriangle };
    } else {
      return { status: 'non-compliant', color: 'text-red-600', bgColor: 'bg-red-50', icon: AlertTriangle };
    }
  };

  // Prepare data for charts
  const capitalRatiosData = [
    {
      name: 'CET1 Ratio',
      actual: parseFloat(cet1Ratio || 0),
      minimum: 4.5,
      buffer: 2.5,
      total: 7.0
    },
    {
      name: 'Tier 1 Ratio',
      actual: parseFloat(tier1Ratio || 0),
      minimum: 6.0,
      buffer: 2.5,
      total: 8.5
    },
    {
      name: 'Total Capital Ratio',
      actual: parseFloat(totalCapitalRatio || 0),
      minimum: 8.0,
      buffer: 2.5,
      total: 10.5
    }
  ];

  const capitalComponentsData = [
    { name: 'Common Equity', value: capitalComponents?.commonEquity || cet1Capital || 0 },
    { name: 'Additional Tier 1', value: capitalComponents?.additionalTier1 || 0 },
    { name: 'Tier 2 Instruments', value: capitalComponents?.tier2Instruments || tier2Capital || 0 }
  ];

  const rwaData = [
    { name: 'Credit Risk', value: riskWeightedAssetsByType?.creditRisk || 0 },
    { name: 'Market Risk', value: riskWeightedAssetsByType?.marketRisk || 0 },
    { name: 'Operational Risk', value: riskWeightedAssetsByType?.operationalRisk || 0 }
  ];

  // Calculate total RWA
  const totalRWA = riskWeightedAssetsByType?.total || riskWeightedAssets || 
    rwaData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-lg text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Capital Adequacy Report
            </h2>
            <p className="text-white/80 mt-1">
              As of {format(new Date(asOfDate), 'dd MMMM yyyy')}
            </p>
          </div>
          <Badge className="bg-white text-green-600 hover:bg-white/90">
            Quarterly Report
          </Badge>
        </div>
      </div>

      {/* Capital Ratios Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {capitalRatiosData.map((ratio) => {
          const status = getComplianceStatus(ratio.actual, ratio.total);
          const StatusIcon = status.icon;
          return (
            <Card key={ratio.name} className={status.bgColor}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  {ratio.name}
                  <StatusIcon className={`h-5 w-5 ${status.color}`} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${status.color}`}>
                  {formatPercentage(ratio.actual)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Min. requirement: {formatPercentage(ratio.total)}
                </p>
                <Progress 
                  value={(ratio.actual / ratio.total) * 100} 
                  className="h-2 mt-2"
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="ratios" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ratios">Capital Ratios</TabsTrigger>
          <TabsTrigger value="components">Capital Components</TabsTrigger>
          <TabsTrigger value="rwa">Risk-Weighted Assets</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="ratios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Capital Adequacy Ratios</CardTitle>
              <CardDescription>Actual vs Minimum Requirements (including buffers)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={capitalRatiosData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => formatPercentage(value)} />
                  <Legend />
                  <Bar dataKey="minimum" stackId="requirement" fill="#F59E0B" name="Minimum Requirement" />
                  <Bar dataKey="buffer" stackId="requirement" fill="#FCD34D" name="Conservation Buffer" />
                  <Bar dataKey="actual" fill="#10B981" name="Actual Ratio" />
                </ComposedChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {capitalRatiosData.map((ratio, index) => (
                  <div key={index} className="p-4 bg-muted rounded-lg">
                    <h4 className="text-sm font-medium mb-3">{ratio.name}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Actual Ratio</span>
                        <span className="font-bold">{formatPercentage(ratio.actual)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Minimum Requirement</span>
                        <span>{formatPercentage(ratio.minimum)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Conservation Buffer</span>
                        <span>{formatPercentage(ratio.buffer)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium">Total Requirement</span>
                        <span className="font-bold">{formatPercentage(ratio.total)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Capital Components</CardTitle>
                <CardDescription>Breakdown of regulatory capital</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={capitalComponentsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {capitalComponentsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Capital Structure</CardTitle>
                <CardDescription>Detailed breakdown of capital tiers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="text-sm font-medium text-green-900 mb-2">Common Equity Tier 1 (CET1)</h4>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(cet1Capital)}</p>
                    <p className="text-xs text-green-700 mt-1">Core capital base</p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Additional Tier 1</h4>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(capitalComponents?.additionalTier1 || 0)}</p>
                    <p className="text-xs text-blue-700 mt-1">Supplementary core capital</p>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="text-sm font-medium text-yellow-900 mb-2">Tier 2 Capital</h4>
                    <p className="text-2xl font-bold text-yellow-600">{formatCurrency(tier2Capital)}</p>
                    <p className="text-xs text-yellow-700 mt-1">Supplementary capital</p>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Capital</span>
                      <span className="text-2xl font-bold">{formatCurrency(totalCapital)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Capital Adequacy Formula</CardTitle>
              <CardDescription>How capital ratios are calculated</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-6 rounded-lg">
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-sm font-medium mb-2">CET1 Ratio</p>
                    <p className="font-mono">CET1 Capital / RWA × 100 = {formatPercentage(cet1Ratio)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium mb-2">Tier 1 Ratio</p>
                    <p className="font-mono">Tier 1 Capital / RWA × 100 = {formatPercentage(tier1Ratio)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium mb-2">Total Capital Ratio</p>
                    <p className="font-mono">Total Capital / RWA × 100 = {formatPercentage(totalCapitalRatio)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rwa" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Risk-Weighted Assets by Type</CardTitle>
                <CardDescription>Distribution of RWA across risk categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={rwaData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {rwaData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>RWA Summary</CardTitle>
                <CardDescription>Risk-weighted assets breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Total Risk-Weighted Assets</h4>
                    <p className="text-3xl font-bold">{formatCurrency(totalRWA)}</p>
                  </div>

                  <div className="space-y-3">
                    {rwaData.map((risk, index) => (
                      <div key={index}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{risk.name}</span>
                          <span className="text-sm">{formatCurrency(risk.value)}</span>
                        </div>
                        <Progress 
                          value={(risk.value / totalRWA) * 100} 
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {((risk.value / totalRWA) * 100).toFixed(1)}% of total RWA
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Capital Requirements by Risk Type</CardTitle>
              <CardDescription>Minimum capital needed for each risk category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {rwaData.map((risk, index) => {
                  const capitalRequired = risk.value * 0.105; // 10.5% minimum requirement
                  return (
                    <div key={index} className="p-4 bg-muted rounded-lg">
                      <h4 className="text-sm font-medium mb-2">{risk.name}</h4>
                      <p className="text-xs text-muted-foreground">RWA: {formatCurrency(risk.value)}</p>
                      <p className="text-lg font-bold mt-2">{formatCurrency(capitalRequired)}</p>
                      <p className="text-xs text-muted-foreground">Capital Required (10.5%)</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regulatory Compliance Status</CardTitle>
              <CardDescription>Assessment of capital adequacy compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Overall Status */}
                <Alert className={
                  complianceStatus?.cet1 === 'Compliant' && 
                  complianceStatus?.tier1 === 'Compliant' && 
                  complianceStatus?.total === 'Compliant' 
                    ? "border-green-200 bg-green-50" 
                    : "border-red-200 bg-red-50"
                }>
                  {complianceStatus?.cet1 === 'Compliant' && 
                   complianceStatus?.tier1 === 'Compliant' && 
                   complianceStatus?.total === 'Compliant' ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-900">Fully Compliant</AlertTitle>
                      <AlertDescription className="text-green-700">
                        All capital adequacy ratios meet or exceed the regulatory minimum requirements including conservation buffers.
                      </AlertDescription>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertTitle className="text-red-900">Non-Compliant</AlertTitle>
                      <AlertDescription className="text-red-700">
                        One or more capital ratios are below the regulatory requirements. Immediate action required.
                      </AlertDescription>
                    </>
                  )}
                </Alert>

                {/* Individual Compliance Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">CET1 Ratio</h4>
                      {complianceStatus?.cet1 === 'Compliant' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <p className="text-2xl font-bold">{formatPercentage(cet1Ratio)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Min: 7.0% (incl. buffer)</p>
                    <Badge className={complianceStatus?.cet1 === 'Compliant' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {complianceStatus?.cet1}
                    </Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">Tier 1 Ratio</h4>
                      {complianceStatus?.tier1 === 'Compliant' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <p className="text-2xl font-bold">{formatPercentage(tier1Ratio)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Min: 8.5% (incl. buffer)</p>
                    <Badge className={complianceStatus?.tier1 === 'Compliant' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {complianceStatus?.tier1}
                    </Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">Total Capital Ratio</h4>
                      {complianceStatus?.total === 'Compliant' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <p className="text-2xl font-bold">{formatPercentage(totalCapitalRatio)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Min: 10.5% (incl. buffer)</p>
                    <Badge className={complianceStatus?.total === 'Compliant' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {complianceStatus?.total}
                    </Badge>
                  </div>
                </div>

                {/* Regulatory Requirements Info */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-blue-900 flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      SAMA Capital Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-blue-800">
                    <div className="space-y-2 text-sm">
                      <p>• Common Equity Tier 1 (CET1): Minimum 4.5% + Conservation Buffer 2.5% = 7.0%</p>
                      <p>• Tier 1 Capital: Minimum 6.0% + Conservation Buffer 2.5% = 8.5%</p>
                      <p>• Total Capital: Minimum 8.0% + Conservation Buffer 2.5% = 10.5%</p>
                      <p className="mt-3 font-medium">
                        Additional buffers may apply for systemically important banks.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="mt-6 p-4 bg-muted rounded-lg">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Report Date: {format(new Date(asOfDate), 'dd MMM yyyy')}</span>
          <span>Generated on: {format(new Date(), 'dd MMM yyyy HH:mm')}</span>
        </div>
      </div>
    </div>
  );
};

export default CapitalAdequacyReport;