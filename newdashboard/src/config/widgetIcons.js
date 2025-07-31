// Icon mapping for metrics
//
// This module maps logical metric identifiers to lucide-react icons.  When
// adding new metrics to the dashboard update this map accordingly.  A
// fallback (BarChart3) is used if no mapping is found.

import {
  DollarSign,
  Users,
  CreditCard,
  Activity,
  TrendingUp,
  Shield,
  Building2,
  Package,
  Scale,
  PieChart,
  BarChart3,
  LineChart,
  Percent,
  Timer,
  Target,
  Brain,
  Zap,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Banknote,
  Wallet
} from '../lucide-react.js';

export const getIconForMetric = (metric) => {
  const iconMap = {
    totalAssets: DollarSign,
    totalDeposits: Wallet,
    totalLoans: Banknote,
    totalCustomers: Users,
    activeAccounts: CreditCard,
    transactionVolume: Activity,
    revenue: TrendingUp,
    riskScore: Shield,
    branchCount: Building2,
    productCount: Package,
    collectionRate: Scale,
    profitMargin: Percent,
    efficiency: Timer,
    performance: Target,
    compliance: CheckCircle,
    alerts: AlertCircle
    // Add more mappings as needed
  };
  return iconMap[metric] || BarChart3;
};