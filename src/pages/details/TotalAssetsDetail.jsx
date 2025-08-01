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
  CardContent,
  Divider
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
    ],
    recentTransactions: [
      { date: '2024-06-15', description: 'Investment Portfolio Update', amount: 250000, type: 'increase' },
      { date: '2024-06-10', description: 'Equipment Purchase', amount: -75000, type: 'decrease' },
      { date: '2024-06-05', description: 'Cash Deposit', amount: 150000, type: 'increase' },
      { date: '2024-06-01', description: 'Property Acquisition', amount: 500000, type: 'increase' }
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
        {/* Summary Cards */}
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

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Previous Period</Typography>
              <Typography variant="h4">
                SAR {assetData.previous.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Last month total
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Growth Amount</Typography>
              <Typography variant="h4" color="success.main">
                SAR {(assetData.current - assetData.previous).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Absolute increase
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Trend Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>6-Month Asset Trend</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={assetData.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                <Tooltip 
                  formatter={(value) => `SAR ${value.toLocaleString()}`}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Pie Chart */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Asset Distribution</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={assetData.breakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percentage }) => `${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {assetData.breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `SAR ${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Breakdown Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Asset Breakdown by Category</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Amount (SAR)</TableCell>
                    <TableCell align="right">Percentage</TableCell>
                    <TableCell align="right">Change from Last Period</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assetData.breakdown.map((row) => (
                    <TableRow key={row.category}>
                      <TableCell component="th" scope="row">
                        {row.category}
                      </TableCell>
                      <TableCell align="right">{row.amount.toLocaleString()}</TableCell>
                      <TableCell align="right">{row.percentage}%</TableCell>
                      <TableCell align="right">
                        <Typography color="success.main">+{(Math.random() * 10).toFixed(1)}%</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell component="th" scope="row">
                      <strong>Total</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>{assetData.current.toLocaleString()}</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>100%</strong>
                    </TableCell>
                    <TableCell align="right">
                      <Typography color="success.main">
                        <strong>+{assetData.change}%</strong>
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Recent Asset Transactions</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Amount (SAR)</TableCell>
                    <TableCell align="center">Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assetData.recentTransactions.map((transaction, index) => (
                    <TableRow key={index}>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell align="right">
                        <Typography color={transaction.type === 'increase' ? 'success.main' : 'error.main'}>
                          {transaction.type === 'increase' ? '+' : ''}{transaction.amount.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body2"
                          sx={{
                            color: transaction.type === 'increase' ? 'success.main' : 'error.main',
                            textTransform: 'capitalize'
                          }}
                        >
                          {transaction.type}
                        </Typography>
                      </TableCell>
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