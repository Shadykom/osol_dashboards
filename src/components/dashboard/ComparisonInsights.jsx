import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Info,
  Brain,
  Sparkles,
  Target,
  Award,
  AlertTriangle,
  ArrowRight,
  Lightbulb,
  Zap,
  Users,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ComparisonInsights = ({ data, comparisonType, className }) => {
  // Mock AI-generated insights based on comparison data
  const insights = [
    {
      type: 'positive',
      icon: TrendingUp,
      title: 'Revenue Growth Accelerating',
      description: 'Revenue growth rate increased from 8.5% to 13.6% over the comparison period',
      impact: 'high',
      metric: '+5.1%',
      recommendation: 'Continue current growth strategies and explore expansion opportunities'
    },
    {
      type: 'warning',
      icon: AlertTriangle,
      title: 'NPL Ratio Trending Up',
      description: 'Non-performing loans increased by 0.3% in the last quarter',
      impact: 'medium',
      metric: '+0.3%',
      recommendation: 'Strengthen credit assessment procedures and monitor high-risk accounts'
    },
    {
      type: 'positive',
      icon: Users,
      title: 'Customer Acquisition Success',
      description: 'New customer acquisition exceeded targets by 12% this period',
      impact: 'high',
      metric: '+12%',
      recommendation: 'Invest in customer retention programs to maximize lifetime value'
    },
    {
      type: 'neutral',
      icon: Activity,
      title: 'Operational Efficiency Stable',
      description: 'Cost-to-income ratio remained consistent at 38.7%',
      impact: 'low',
      metric: '0%',
      recommendation: 'Explore automation opportunities to improve efficiency'
    }
  ];

  const keyMetrics = [
    {
      label: 'Overall Performance',
      value: 87,
      change: '+5',
      status: 'excellent'
    },
    {
      label: 'Growth Momentum',
      value: 92,
      change: '+8',
      status: 'excellent'
    },
    {
      label: 'Risk Score',
      value: 25,
      change: '-3',
      status: 'good'
    },
    {
      label: 'Efficiency Score',
      value: 78,
      change: '+2',
      status: 'moderate'
    }
  ];

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'medium': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/20';
      case 'low': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'moderate': return 'text-amber-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'positive': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'negative': return AlertCircle;
      default: return Info;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn("space-y-6", className)}
    >
      {/* AI Insights Header */}
      <Card className="overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-0">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <Brain className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-xl">AI-Powered Insights</CardTitle>
                <CardDescription>
                  Intelligent analysis of your {comparisonType} performance
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Updated 2 min ago
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {keyMetrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    {metric.label}
                  </span>
                  <Badge variant="outline" className={cn("text-xs", getStatusColor(metric.status))}>
                    {metric.change}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold">{metric.value}</span>
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>
                  <Progress value={metric.value} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Detailed Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {insights.map((insight, index) => {
          const InsightIcon = getInsightIcon(insight.type);
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          insight.type === 'positive' ? 'bg-green-100 dark:bg-green-900/20' :
                          insight.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/20' :
                          'bg-gray-100 dark:bg-gray-900/20'
                        )}>
                          <InsightIcon className={cn(
                            "h-5 w-5",
                            insight.type === 'positive' ? 'text-green-600' :
                            insight.type === 'warning' ? 'text-amber-600' :
                            'text-gray-600'
                          )} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{insight.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {insight.description}
                          </p>
                        </div>
                      </div>
                      <Badge className={cn("text-xs", getImpactColor(insight.impact))}>
                        {insight.impact} impact
                      </Badge>
                    </div>

                    {/* Metric */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <span className="text-sm font-medium">Change</span>
                      <span className={cn(
                        "text-lg font-bold",
                        insight.type === 'positive' ? 'text-green-600' :
                        insight.type === 'warning' ? 'text-amber-600' :
                        'text-gray-600'
                      )}>
                        {insight.metric}
                      </span>
                    </div>

                    {/* Recommendation */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm font-medium">
                        <Lightbulb className="h-4 w-4 text-indigo-600" />
                        <span>Recommendation</span>
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">
                        {insight.recommendation}
                      </p>
                    </div>

                    {/* Action Button */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    >
                      View Details
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold">Suggested Actions</h4>
                <p className="text-sm text-muted-foreground">
                  Based on your {comparisonType} analysis
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                <Target className="h-4 w-4 mr-2" />
                Set New Targets
              </Button>
              <Button variant="outline" size="sm">
                <Award className="h-4 w-4 mr-2" />
                View Achievements
              </Button>
              <Button size="sm">
                Generate Report
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ComparisonInsights;