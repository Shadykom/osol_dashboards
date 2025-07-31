import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Typography, Box } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const DashboardCard = ({ 
  title, 
  value, 
  currency = 'SAR',
  trend, 
  trendValue, 
  icon, 
  detailPath,
  cardType 
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    // Navigate to specific detail page based on card type
    navigate(`/dashboard/detail-new/${cardType}`);
  };

  const formatValue = (val) => {
    if (typeof val === 'number') {
      return val.toLocaleString('en-US');
    }
    return val;
  };

  return (
    <Card 
      sx={{ 
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3
        }
      }}
      onClick={handleCardClick}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {title || 'Untitled Card'}
            </Typography>
            <Typography variant="h4" component="div">
              {currency} {formatValue(value)}
            </Typography>
            {trend && (
              <Box display="flex" alignItems="center" mt={1}>
                {trend === 'up' ? (
                  <TrendingUpIcon sx={{ color: 'success.main', mr: 0.5 }} />
                ) : (
                  <TrendingDownIcon sx={{ color: 'error.main', mr: 0.5 }} />
                )}
                <Typography 
                  variant="body2" 
                  color={trend === 'up' ? 'success.main' : 'error.main'}
                >
                  {trendValue}% vs last period
                </Typography>
              </Box>
            )}
          </Box>
          {icon && (
            <Box>
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default DashboardCard;