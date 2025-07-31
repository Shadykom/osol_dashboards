#!/bin/bash

# Create details directory
mkdir -p src/pages/details

# Create TotalAssetsDetail.jsx
cat > src/pages/details/TotalAssetsDetail.jsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Card,
  CardContent
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const TotalAssetsDetail = () => {
  const navigate = useNavigate();
  const [assetData, setAssetData] = useState({
    current: 7600904,
    previous: 6763607,
    change: 12.5,
    breakdown: [
      { category: 'Cash & Equivalents', amount: 2500000, percentage: 32.9 },
      { category: 'Investments', amount: 3100000, percentage: 40.8 },
      { category: 'Fixed Assets', amount: 1500000, percentage: 19.7 },
      { category: 'Other Assets', amount: 500904, percentage: 6.6 }
    ],
    monthlyTrend: [
      { month: 'Jan', value: 6500000 },
      { month: 'Feb', value: 6700000 },
      { month: 'Mar', value: 6900000 },
      { month: 'Apr', value: 7100000 },
      { month: 'May', value: 7400000 },
      { month: 'Jun', value: 7600904 }
    ]
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box mb={3}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/dashboard')}
          sx={{ mb: 2 }}
        >
          Back to Dashboard
        </Button>
        <Box display="flex" alignItems="center" mb={2}>
          <AccountBalanceIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Total Assets Detail
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Current Total Assets</Typography>
              <Typography variant="h3" color="primary">
                SAR {assetData.current.toLocaleString()}
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <TrendingUpIcon sx={{ color: 'success.main', mr: 0.5 }} />
                <Typography variant="body2" color="success.main">
                  +{assetData.change}% from last period
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>6-Month Asset Trend</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={assetData.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(value) => `SAR ${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Asset Breakdown</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Amount (SAR)</TableCell>
                    <TableCell align="right">Percentage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assetData.breakdown.map((row) => (
                    <TableRow key={row.category}>
                      <TableCell>{row.category}</TableCell>
                      <TableCell align="right">{row.amount.toLocaleString()}</TableCell>
                      <TableCell align="right">{row.percentage}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TotalAssetsDetail;
EOF

echo "TotalAssetsDetail.jsx created successfully!"
