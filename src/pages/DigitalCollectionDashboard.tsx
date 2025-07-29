import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, RadialBarChart, RadialBar, Funnel, FunnelChart
} from 'recharts';
import { 
  Smartphone, MessageSquare, Mail, Phone, Globe, Zap,
  TrendingUp, DollarSign, Users, Clock, Target, Activity,
  Wifi, CreditCard, Bot, QrCode, Bell, ChevronRight
} from 'lucide-react';

const DigitalCollectionDashboard = () => {
  const { t } = useTranslation();
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [loading, setLoading] = useState(false);

  // Mock data for digital collection
  const digitalMetrics = {
    overview: {
      totalDigitalPayments: 12500000,
      digitalPaymentCount: 3456,
      digitalAdoptionRate: 28.5,
      selfServiceRate: 45.2,
      avgResponseTime: 2.3,
      costSavings: 450000,
      channelEfficiency: 87.5,
      automationRate: 62.8
    },
    channelPerformance: [
      { channel: 'IVR', attempts: 5670, successful: 1245, amount: 3200000, cost: 28350, roi: 112.8 },
      { channel: 'SMS', attempts: 12450, successful: 2890, amount: 2450000, cost: 24900, roi: 98.4 },
      { channel: 'Email', attempts: 8900, successful: 1560, amount: 1850000, cost: 8900, roi: 207.9 },
      { channel: 'WhatsApp', attempts: 6780, successful: 2150, amount: 2100000, cost: 13560, roi: 154.9 },
      { channel: 'Mobile App', attempts: 4320, successful: 1890, amount: 1900000, cost: 0, roi: 999 },
      { channel: 'Web Portal', attempts: 3250, successful: 1450, amount: 1000000, cost: 0, roi: 999 }
    ],
    automationMetrics: {
      autoDialer: { calls: 4500, connected: 2890, successRate: 64.2, amount: 1850000 },
      smsCampaigns: { sent: 12450, delivered: 11800, clicked: 3540, payments: 890, amount: 780000 },
      emailCampaigns: { sent: 8900, opened: 4450, clicked: 1780, payments: 445, amount: 620000 },
      chatbot: { interactions: 2340, resolved: 1872, escalated: 468, payments: 234, amount: 180000 },
      ivrPayments: { attempts: 1560, successful: 1248, failureRate: 20, amount: 980000 }
    },
    paymentMethods: [
      { method: 'Credit Card', count: 1234, amount: 4500000, percentage: 36 },
      { method: 'Debit Card', count: 987, amount: 3200000, percentage: 25.6 },
      { method: 'Bank Transfer', count: 678, amount: 2800000, percentage: 22.4 },
      { method: 'Digital Wallet', count: 456, amount: 1500000, percentage: 12 },
      { method: 'SADAD', count: 101, amount: 500000, percentage: 4 }
    ],
    timeAnalysis: {
      hourly: [
        { hour: '00:00', payments: 45, amount: 125000 },
        { hour: '06:00', payments: 78, amount: 234000 },
        { hour: '09:00', payments: 234, amount: 890000 },
        { hour: '12:00', payments: 189, amount: 567000 },
        { hour: '15:00', payments: 267, amount: 1234000 },
        { hour: '18:00', payments: 345, amount: 1890000 },
        { hour: '21:00', payments: 298, amount: 1450000 }
      ],
      peakHours: { start: '18:00', end: '22:00', percentage: 42.5 }
    },
    conversionFunnel: [
      { stage: 'Message Sent', value: 24000 },
      { stage: 'Message Opened', value: 18000 },
      { stage: 'Link Clicked', value: 8500 },
      { stage: 'Payment Started', value: 3200 },
      { stage: 'Payment Completed', value: 2100 }
    ],
    campaignPerformance: [
      { 
        name: 'Ramadan Special Reminder',
        channel: 'SMS',
        sent: 5000,
        responseRate: 28.5,
        collected: 1250000,
        roi: 156.2
      },
      {
        name: 'Early Payment Discount',
        channel: 'Email',
        sent: 3500,
        responseRate: 22.3,
        collected: 890000,
        roi: 189.5
      },
      {
        name: 'WhatsApp Payment Link',
        channel: 'WhatsApp',
        sent: 2800,
        responseRate: 35.2,
        collected: 780000,
        roi: 210.3
      }
    ]
  };

  const channelIcons = {
    'IVR': Phone,
    'SMS': MessageSquare,
    'Email': Mail,
    'WhatsApp': MessageSquare,
    'Mobile App': Smartphone,
    'Web Portal': Globe,
    'Chatbot': Bot
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getChannelColor = (channel) => {
    const colors = {
      'IVR': '#8b5cf6',
      'SMS': '#3b82f6',
      'Email': '#10b981',
      'WhatsApp': '#22c55e',
      'Mobile App': '#f59e0b',
      'Web Portal': '#ef4444',
      'Chatbot': '#6366f1'
    };
    return colors[channel] || '#6b7280';
  };

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Digital Collection Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor and optimize digital collection channels</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedChannel} onValueChange={setSelectedChannel}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="ivr">IVR</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="mobile">Mobile App</SelectItem>
              <SelectItem value="web">Web Portal</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Zap className="h-4 w-4 mr-2" />
            Launch Campaign
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Digital Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(digitalMetrics.overview.totalDigitalPayments)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(digitalMetrics.overview.digitalPaymentCount)} transactions
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Digital Adoption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{digitalMetrics.overview.digitalAdoptionRate}%</div>
            <Progress value={digitalMetrics.overview.digitalAdoptionRate} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Self-Service Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{digitalMetrics.overview.selfServiceRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg response: {digitalMetrics.overview.avgResponseTime} min
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(digitalMetrics.overview.costSavings)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              vs traditional channels
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-4">
          {/* Channel Performance Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {digitalMetrics.channelPerformance.map((channel, index) => {
              const Icon = channelIcons[channel.channel] || Globe;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" style={{ color: getChannelColor(channel.channel) }} />
                        <span>{channel.channel}</span>
                      </div>
                      <Badge variant="outline">ROI: {channel.roi}%</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Attempts</span>
                        <span className="font-medium">{formatNumber(channel.attempts)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Successful</span>
                        <span className="font-medium">{formatNumber(channel.successful)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Success Rate</span>
                        <span className="font-medium">
                          {((channel.successful / channel.attempts) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Collected</span>
                          <span className="font-bold text-green-600">{formatCurrency(channel.amount)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Channel Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance Comparison</CardTitle>
              <CardDescription>Success rate and amount collected by channel</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={digitalMetrics.channelPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="channel" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="amount" fill="#8b5cf6" name="Amount Collected (SAR)" />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="successful" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name="Successful Payments"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          {/* Automation Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Auto-Dialer Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Calls Made</span>
                    <span className="text-xl font-bold">{formatNumber(digitalMetrics.automationMetrics.autoDialer.calls)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Connected</span>
                    <span className="text-xl font-bold">{formatNumber(digitalMetrics.automationMetrics.autoDialer.connected)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <div className="flex items-center gap-2">
                      <Progress value={digitalMetrics.automationMetrics.autoDialer.successRate} className="w-24" />
                      <span className="text-xl font-bold">{digitalMetrics.automationMetrics.autoDialer.successRate}%</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Amount Collected</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(digitalMetrics.automationMetrics.autoDialer.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Chatbot Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Interactions</span>
                    <span className="text-xl font-bold">{formatNumber(digitalMetrics.automationMetrics.chatbot.interactions)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Self-Resolved</span>
                    <span className="text-xl font-bold">{formatNumber(digitalMetrics.automationMetrics.chatbot.resolved)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Resolution Rate</span>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(digitalMetrics.automationMetrics.chatbot.resolved / digitalMetrics.automationMetrics.chatbot.interactions) * 100} 
                        className="w-24" 
                      />
                      <span className="text-xl font-bold">
                        {((digitalMetrics.automationMetrics.chatbot.resolved / digitalMetrics.automationMetrics.chatbot.interactions) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Payments Processed</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(digitalMetrics.automationMetrics.chatbot.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SMS Campaign Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>SMS Campaign Performance</CardTitle>
              <CardDescription>Automated SMS campaign effectiveness</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="text-center">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-sm text-gray-600">Sent</p>
                  <p className="text-xl font-bold">{formatNumber(digitalMetrics.automationMetrics.smsCampaigns.sent)}</p>
                </div>
                <div className="text-center">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm text-gray-600">Delivered</p>
                  <p className="text-xl font-bold">{formatNumber(digitalMetrics.automationMetrics.smsCampaigns.delivered)}</p>
                </div>
                <div className="text-center">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <p className="text-sm text-gray-600">Clicked</p>
                  <p className="text-xl font-bold">{formatNumber(digitalMetrics.automationMetrics.smsCampaigns.clicked)}</p>
                </div>
                <div className="text-center">
                  <CreditCard className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-sm text-gray-600">Payments</p>
                  <p className="text-xl font-bold">{formatNumber(digitalMetrics.automationMetrics.smsCampaigns.payments)}</p>
                </div>
                <div className="text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm text-gray-600">Collected</p>
                  <p className="text-xl font-bold">{formatCurrency(digitalMetrics.automationMetrics.smsCampaigns.amount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          {/* Payment Methods Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods Distribution</CardTitle>
                <CardDescription>Breakdown by payment type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={digitalMetrics.paymentMethods}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ method, percentage }) => `${method}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {digitalMetrics.paymentMethods.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Volume by Method</CardTitle>
                <CardDescription>Transaction count and amount</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={digitalMetrics.paymentMethods}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="method" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" name="Transactions" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Payment Time Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Activity by Hour</CardTitle>
              <CardDescription>Identify peak payment times</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={digitalMetrics.timeAnalysis.hourly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Area 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="payments" 
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.6}
                    name="Payment Count"
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name="Amount (SAR)"
                  />
                </AreaChart>
              </ResponsiveContainer>
              <Alert className="mt-4">
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Peak hours: {digitalMetrics.timeAnalysis.peakHours.start} - {digitalMetrics.timeAnalysis.peakHours.end} 
                  ({digitalMetrics.timeAnalysis.peakHours.percentage}% of daily payments)
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          {/* Active Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle>Active Digital Campaigns</CardTitle>
              <CardDescription>Current campaign performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {digitalMetrics.campaignPerformance.map((campaign, index) => {
                  const Icon = channelIcons[campaign.channel] || Globe;
                  return (
                    <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Icon className="h-5 w-5 mt-1" style={{ color: getChannelColor(campaign.channel) }} />
                          <div>
                            <h4 className="font-semibold">{campaign.name}</h4>
                            <p className="text-sm text-gray-600">Channel: {campaign.channel}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span>Sent: {formatNumber(campaign.sent)}</span>
                              <span>•</span>
                              <span>Response: {campaign.responseRate}%</span>
                              <span>•</span>
                              <span>ROI: {campaign.roi}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">{formatCurrency(campaign.collected)}</p>
                          <p className="text-sm text-gray-600">collected</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button className="w-full mt-4" variant="outline">
                View All Campaigns
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Digital Collection Conversion Funnel</CardTitle>
              <CardDescription>Customer journey from message to payment</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart 
                  data={digitalMetrics.conversionFunnel} 
                  layout="horizontal"
                  margin={{ left: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="stage" type="category" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6">
                    {digitalMetrics.conversionFunnel.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">Open Rate</p>
                  <p className="text-xl font-bold">75%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Click Rate</p>
                  <p className="text-xl font-bold">47.2%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Start Rate</p>
                  <p className="text-xl font-bold">37.6%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completion Rate</p>
                  <p className="text-xl font-bold">65.6%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Channel ROI Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Channel ROI Analysis</CardTitle>
              <CardDescription>Cost efficiency by digital channel</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={digitalMetrics.channelPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="channel" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="roi" fill="#10b981" name="ROI %" />
                  <Bar dataKey="cost" fill="#ef4444" name="Cost (SAR)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cost Savings Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Digital vs Traditional Cost Comparison</CardTitle>
              <CardDescription>Cost per successful collection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-4">Traditional Methods</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Phone Call</span>
                      <span className="font-bold">SAR 45</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Field Visit</span>
                      <span className="font-bold">SAR 125</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Physical Letter</span>
                      <span className="font-bold">SAR 15</span>
                    </div>
                  </div>
                </div>
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <h3 className="font-semibold mb-4">Digital Methods</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>SMS</span>
                      <span className="font-bold text-green-600">SAR 2</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email</span>
                      <span className="font-bold text-green-600">SAR 1</span>
                    </div>
                    <div className="flex justify-between">
                      <span>WhatsApp</span>
                      <span className="font-bold text-green-600">SAR 2</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-sm text-gray-600">Average Cost Savings</p>
                <p className="text-3xl font-bold text-blue-600">87.5%</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          {/* Optimization Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Optimization Opportunities</CardTitle>
              <CardDescription>AI-powered recommendations to improve digital collection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    title: 'Increase WhatsApp Usage',
                    description: 'WhatsApp shows highest engagement rate (35.2%). Consider shifting 20% of SMS volume.',
                    impact: 'Potential 15% increase in response rate',
                    priority: 'HIGH'
                  },
                  {
                    title: 'Optimize Send Times',
                    description: 'Peak payment hours are 18:00-22:00. Schedule more campaigns during this window.',
                    impact: 'Expected 8% improvement in conversion',
                    priority: 'MEDIUM'
                  },
                  {
                    title: 'Personalize Email Content',
                    description: 'A/B testing shows personalized subject lines increase open rates by 23%.',
                    impact: 'Projected SAR 180,000 additional collections',
                    priority: 'HIGH'
                  },
                  {
                    title: 'Enhance Mobile App Features',
                    description: 'Add biometric authentication and one-click payment for better UX.',
                    impact: 'Reduce payment friction by 40%',
                    priority: 'MEDIUM'
                  }
                ].map((recommendation, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{recommendation.title}</h4>
                      <Badge variant={recommendation.priority === 'HIGH' ? 'destructive' : 'secondary'}>
                        {recommendation.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{recommendation.description}</p>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-green-600">{recommendation.impact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Channel Mix Optimization */}
          <Card>
            <CardHeader>
              <CardTitle>Optimal Channel Mix</CardTitle>
              <CardDescription>Recommended distribution based on performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Current Mix</h4>
                  <div className="space-y-2">
                    {[
                      { channel: 'SMS', current: 45, recommended: 30 },
                      { channel: 'Email', current: 25, recommended: 20 },
                      { channel: 'WhatsApp', current: 15, recommended: 35 },
                      { channel: 'Mobile App', current: 10, recommended: 15 },
                      { channel: 'IVR', current: 5, recommended: 0 }
                    ].map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">{item.channel}</span>
                          <div className="text-sm">
                            <span className="text-gray-600">Current: {item.current}%</span>
                            <span className="mx-2">→</span>
                            <span className="font-medium text-green-600">Recommended: {item.recommended}%</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Progress value={item.current} className="flex-1 h-2" />
                          <Progress value={item.recommended} className="flex-1 h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DigitalCollectionDashboard;