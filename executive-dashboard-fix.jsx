import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Paper,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  People,
  Business,
  Assessment,
  AccountBalance,
  Receipt,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';

// KPI Card Component
const KPICard = ({ title, value, icon: Icon, trend, trendValue, onClick, color = 'primary' }) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        cursor: 'pointer',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        }
      }}
      onClick={handleClick}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Icon sx={{ fontSize: 40, color: `${color}.main` }} />
          {trend && (
            <Box display="flex" alignItems="center">
              {trend === 'up' ? (
                <TrendingUp sx={{ color: 'success.main', mr: 0.5 }} />
              ) : (
                <TrendingDown sx={{ color: 'error.main', mr: 0.5 }} />
              )}
              <Typography variant="body2" color={trend === 'up' ? 'success.main' : 'error.main'}>
                {trendValue}%
              </Typography>
            </Box>
          )}
        </Box>
        <Typography variant="h4" component="div" gutterBottom>
          {value}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {title}
        </Typography>
      </CardContent>
    </Card>
  );
};

const ExecutiveDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Initialize executiveKPIs state with default values
  const [executiveKPIs, setExecutiveKPIs] = useState({
    totalRevenue: 0,
    totalCustomers: 0,
    activeLoans: 0,
    totalDisbursed: 0,
    totalCollected: 0,
    overdueAmount: 0,
    portfolioAtRisk: 0,
    averageLoanSize: 0,
  });
  
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch executive KPIs from the API
  const fetchExecutiveKPIs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Replace with your actual API endpoint
      const response = await axios.get('/api/executive/kpis');
      
      if (response.data) {
        setExecutiveKPIs(response.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error fetching executive KPIs:', err);
      setError('Failed to load dashboard data. Please try again later.');
      
      // Set mock data for development/testing
      setExecutiveKPIs({
        totalRevenue: 1250000,
        totalCustomers: 3500,
        activeLoans: 2800,
        totalDisbursed: 5000000,
        totalCollected: 4200000,
        overdueAmount: 180000,
        portfolioAtRisk: 3.6,
        averageLoanSize: 1785,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutiveKPIs();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(2)}%`;
  };

  // Navigation handlers for detail pages
  const handleNavigateToDetail = (detailType, params = {}) => {
    navigate(`/dashboards/executive/${detailType}`, { state: params });
  };

  const kpiCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(executiveKPIs.totalRevenue),
      icon: AttachMoney,
      trend: 'up',
      trendValue: 12.5,
      onClick: () => handleNavigateToDetail('revenue'),
      color: 'success',
    },
    {
      title: 'Total Customers',
      value: formatNumber(executiveKPIs.totalCustomers),
      icon: People,
      trend: 'up',
      trendValue: 8.3,
      onClick: () => handleNavigateToDetail('customers'),
      color: 'primary',
    },
    {
      title: 'Active Loans',
      value: formatNumber(executiveKPIs.activeLoans),
      icon: Receipt,
      trend: 'up',
      trendValue: 5.7,
      onClick: () => handleNavigateToDetail('loans'),
      color: 'info',
    },
    {
      title: 'Total Disbursed',
      value: formatCurrency(executiveKPIs.totalDisbursed),
      icon: AccountBalance,
      trend: 'up',
      trendValue: 15.2,
      onClick: () => handleNavigateToDetail('disbursements'),
      color: 'secondary',
    },
    {
      title: 'Total Collected',
      value: formatCurrency(executiveKPIs.totalCollected),
      icon: Business,
      trend: 'up',
      trendValue: 10.8,
      onClick: () => handleNavigateToDetail('collections'),
      color: 'success',
    },
    {
      title: 'Overdue Amount',
      value: formatCurrency(executiveKPIs.overdueAmount),
      icon: Assessment,
      trend: 'down',
      trendValue: 3.2,
      onClick: () => handleNavigateToDetail('overdue'),
      color: 'warning',
    },
    {
      title: 'Portfolio at Risk',
      value: formatPercentage(executiveKPIs.portfolioAtRisk),
      icon: Assessment,
      trend: 'down',
      trendValue: 1.5,
      onClick: () => handleNavigateToDetail('portfolio-risk'),
      color: 'error',
    },
    {
      title: 'Average Loan Size',
      value: formatCurrency(executiveKPIs.averageLoanSize),
      icon: AttachMoney,
      trend: 'up',
      trendValue: 6.4,
      onClick: () => handleNavigateToDetail('loan-analysis'),
      color: 'info',
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Executive Dashboard
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="body2" color="text.secondary">
            Last updated: {format(lastUpdated, 'PPp')}
          </Typography>
          <Tooltip title="Refresh data">
            <IconButton onClick={fetchExecutiveKPIs} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* KPI Cards Grid */}
      <Grid container spacing={3}>
        {kpiCards.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <KPICard {...kpi} />
          </Grid>
        ))}
      </Grid>

      {/* Summary Section */}
      <Paper sx={{ mt: 4, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Portfolio Summary
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Collection Rate
              </Typography>
              <Typography variant="h6">
                {executiveKPIs.totalDisbursed > 0 
                  ? formatPercentage((executiveKPIs.totalCollected / executiveKPIs.totalDisbursed) * 100)
                  : '0.00%'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Default Rate
              </Typography>
              <Typography variant="h6">
                {executiveKPIs.totalDisbursed > 0
                  ? formatPercentage((executiveKPIs.overdueAmount / executiveKPIs.totalDisbursed) * 100)
                  : '0.00%'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Loans per Customer
              </Typography>
              <Typography variant="h6">
                {executiveKPIs.totalCustomers > 0
                  ? (executiveKPIs.activeLoans / executiveKPIs.totalCustomers).toFixed(2)
                  : '0.00'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ExecutiveDashboard;