import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, RadarAxis, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  Shield, AlertTriangle, CheckCircle, Info,
  TrendingUp, TrendingDown, Activity, BarChart3
} from 'lucide-react';
import { format } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const BaselIIIComplianceReport = ({ data, isRTL = false }) => {
  if (!data) return null;

  const {
    asOfDate,
    capitalAdequacy,
    leverageRatio,
    liquidityMetrics,
    riskExposures
  } = data;

  // Format percentage
  const formatPercentage = (value) => {
    return `${parseFloat(value).toFixed(2)}%`;
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Check compliance status
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
      name: 'CET1',
      actual: parseFloat(capitalAdequacy?.cet1Ratio || 0),
      minimum: parseFloat(capitalAdequacy?.minimumRequirements?.cet1 || 4.5),
      buffer: parseFloat(capitalAdequacy?.buffers?.conservationBuffer || 2.5)
    },
    {
      name: 'Tier 1',
      actual: parseFloat(capitalAdequacy?.tier1Ratio || 0),
      minimum: parseFloat(capitalAdequacy?.minimumRequirements?.tier1 || 6.0),
      buffer: parseFloat(capitalAdequacy?.buffers?.conservationBuffer || 2.5)
    },
    {
      name: 'Total Capital',
      actual: parseFloat(capitalAdequacy?.totalCapitalRatio || 0),
      minimum: parseFloat(capitalAdequacy?.minimumRequirements?.total || 8.0),
      buffer: parseFloat(capitalAdequacy?.buffers?.conservationBuffer || 2.5)
    }
  ];

  const riskExposureData = [
    { name: 'Credit Risk', value: riskExposures?.creditRisk || 0 },
    { name: 'Market Risk', value: riskExposures?.marketRisk || 0 },
    { name: 'Operational Risk', value: riskExposures?.operationalRisk || 0 }
  ];

  const liquidityRadarData = [
    {
      metric: 'LCR',
      value: Math.min(parseFloat(liquidityMetrics?.lcr?.ratio || 0), 200),
      fullMark: 200
    },
    {
      metric: 'NSFR',
      value: Math.min(parseFloat(liquidityMetrics?.nsfr?.ratio || 0), 200),
      fullMark: 200
    },
    {
      metric: 'Leverage',
      value: parseFloat(leverageRatio?.ratio || 0) * 10,
      fullMark: 100
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-lg text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Basel III Compliance Report
            </h2>
            <p className="text-white/80 mt-1">
              As of {format(new Date(asOfDate), 'dd MMMM yyyy')}
            </p>
          </div>
          <Badge className="bg-white text-blue-800 hover:bg-white/90">
            Regulatory Report
          </Badge>
        </div>
      </div>

      {/* Overall Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Compliance Status</CardTitle>
          <CardDescription>Summary of Basel III compliance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {capitalRatiosData.map((ratio) => {
              const status = getComplianceStatus(ratio.actual, ratio.minimum);
              const StatusIcon = status.icon;
              return (
                <div key={ratio.name} className={`p-4 rounded-lg ${status.bgColor}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{ratio.name} Ratio</h4>
                    <StatusIcon className={`h-5 w-5 ${status.color}`} />
                  </div>
                  <p className={`text-2xl font-bold ${status.color}`}>
                    {formatPercentage(ratio.actual)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Minimum: {formatPercentage(ratio.minimum)}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <Tabs defaultValue="capital" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="capital">Capital Adequacy</TabsTrigger>
          <TabsTrigger value="leverage">Leverage Ratio</TabsTrigger>
          <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
          <TabsTrigger value="risk">Risk Exposures</TabsTrigger>
        </TabsList>

        <TabsContent value="capital" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Capital Ratios</CardTitle>
                <CardDescription>Actual vs Minimum Requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={capitalRatiosData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatPercentage(value)} />
                    <Legend />
                    <Bar dataKey="actual" fill="#0088FE" name="Actual" />
                    <Bar dataKey="minimum" fill="#FF8042" name="Minimum" />
                    <Bar dataKey="buffer" fill="#00C49F" name="Buffer" stackId="requirement" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Capital Components</CardTitle>
                <CardDescription>Breakdown of regulatory capital</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">CET1 Capital</span>
                    <span className="text-sm font-bold">{formatCurrency(capitalAdequacy?.cet1Capital)}</span>
                  </div>
                  <Progress value={70} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Additional Tier 1</span>
                    <span className="text-sm font-bold">{formatCurrency(0)}</span>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Tier 2 Capital</span>
                    <span className="text-sm font-bold">{formatCurrency(capitalAdequacy?.tier2Capital)}</span>
                  </div>
                  <Progress value={30} className="h-2" />
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="font-medium">Total Capital</span>
                    <span className="font-bold">{formatCurrency(capitalAdequacy?.totalCapital)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Capital Buffers */}
          <Card>
            <CardHeader>
              <CardTitle>Capital Buffers</CardTitle>
              <CardDescription>Additional capital requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Conservation Buffer</h4>
                  <p className="text-xl font-bold">{capitalAdequacy?.buffers?.conservationBuffer}</p>
                  <Progress value={100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Countercyclical Buffer</h4>
                  <p className="text-xl font-bold">{capitalAdequacy?.buffers?.countercyclicalBuffer}</p>
                  <Progress value={0} className="h-2" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Systemic Buffer</h4>
                  <p className="text-xl font-bold">{capitalAdequacy?.buffers?.systemicBuffer}</p>
                  <Progress value={0} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leverage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leverage Ratio</CardTitle>
              <CardDescription>Non-risk based capital measure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Leverage Ratio</h4>
                      <p className="text-3xl font-bold">{formatPercentage(leverageRatio?.ratio)}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Minimum requirement: {leverageRatio?.minimumRequirement}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Tier 1 Capital</span>
                        <span className="text-sm font-medium">{formatCurrency(leverageRatio?.tier1Capital)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Total Exposure</span>
                        <span className="text-sm font-medium">{formatCurrency(leverageRatio?.totalExposure)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-4">Compliance Assessment</h4>
                  {parseFloat(leverageRatio?.ratio) >= 3 ? (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-900">Compliant</AlertTitle>
                      <AlertDescription className="text-green-700">
                        The leverage ratio exceeds the minimum requirement of 3%.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertTitle className="text-red-900">Non-Compliant</AlertTitle>
                      <AlertDescription className="text-red-700">
                        The leverage ratio is below the minimum requirement of 3%.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="liquidity" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* LCR Card */}
            <Card>
              <CardHeader>
                <CardTitle>Liquidity Coverage Ratio (LCR)</CardTitle>
                <CardDescription>Short-term liquidity resilience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">LCR</h4>
                    {parseFloat(liquidityMetrics?.lcr?.ratio) >= 100 ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <p className="text-2xl font-bold">{formatPercentage(liquidityMetrics?.lcr?.ratio)}</p>
                  <Progress 
                    value={Math.min(parseFloat(liquidityMetrics?.lcr?.ratio || 0), 100)} 
                    className="h-2 mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum: {liquidityMetrics?.lcr?.minimumRequirement}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">HQLA</span>
                    <span className="text-sm font-medium">{formatCurrency(liquidityMetrics?.lcr?.hqla)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Net Cash Outflows</span>
                    <span className="text-sm font-medium">{formatCurrency(liquidityMetrics?.lcr?.netCashOutflows)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* NSFR Card */}
            <Card>
              <CardHeader>
                <CardTitle>Net Stable Funding Ratio (NSFR)</CardTitle>
                <CardDescription>Long-term liquidity resilience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">NSFR</h4>
                    {parseFloat(liquidityMetrics?.nsfr?.ratio) >= 100 ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <p className="text-2xl font-bold">{formatPercentage(liquidityMetrics?.nsfr?.ratio)}</p>
                  <Progress 
                    value={Math.min(parseFloat(liquidityMetrics?.nsfr?.ratio || 0), 100)} 
                    className="h-2 mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum: {liquidityMetrics?.nsfr?.minimumRequirement}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Available Stable Funding</span>
                    <span className="text-sm font-medium">{formatCurrency(liquidityMetrics?.nsfr?.availableStableFunding)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Required Stable Funding</span>
                    <span className="text-sm font-medium">{formatCurrency(liquidityMetrics?.nsfr?.requiredStableFunding)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Liquidity Overview Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Liquidity Metrics Overview</CardTitle>
              <CardDescription>Comprehensive view of liquidity positions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={liquidityRadarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[0, 200]} />
                  <Radar name="Value" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Risk-Weighted Assets</CardTitle>
                <CardDescription>Distribution by risk type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={riskExposureData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {riskExposureData.map((entry, index) => (
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
                <CardTitle>Risk Exposure Summary</CardTitle>
                <CardDescription>Total RWA and breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Total Risk-Weighted Assets</h4>
                  <p className="text-2xl font-bold">{formatCurrency(riskExposures?.totalRWA)}</p>
                </div>
                <div className="space-y-3">
                  {riskExposureData.map((risk, index) => (
                    <div key={index}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{risk.name}</span>
                        <span className="text-sm">{formatCurrency(risk.value)}</span>
                      </div>
                      <Progress 
                        value={(risk.value / riskExposures?.totalRWA) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
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

export default BaselIIIComplianceReport;