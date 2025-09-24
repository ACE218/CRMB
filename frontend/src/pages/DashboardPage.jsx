import React from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
  LinearProgress,
} from '@mui/material'
import {
  TrendingUp,
  People,
  Inventory2,
  AttachMoney,
  ShoppingCart,
  Warning,
} from '@mui/icons-material'

const DashboardPage = () => {
  // Mock data - in real app, this would come from API
  const stats = [
    {
      title: 'Today\'s Sales',
      value: '₹25,430',
      change: '+12%',
      icon: <AttachMoney />,
      color: '#4caf50',
    },
    {
      title: 'Total Customers',
      value: '1,245',
      change: '+8%',
      icon: <People />,
      color: '#2196f3',
    },
    {
      title: 'Products in Stock',
      value: '3,456',
      change: '-2%',
      icon: <Inventory2 />,
      color: '#ff9800',
    },
    {
      title: 'Orders Today',
      value: '89',
      change: '+15%',
      icon: <ShoppingCart />,
      color: '#9c27b0',
    },
  ]

  const alerts = [
    { type: 'Low Stock', count: 15, color: '#ff9800' },
    { type: 'Out of Stock', count: 3, color: '#f44336' },
    { type: 'Expiring Soon', count: 7, color: '#ff5722' },
  ]

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Welcome to your CRMB dashboard. Here's what's happening today.
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: stat.color,
                      mr: 2,
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" component="div">
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: stat.change.startsWith('+') ? 'success.main' : 'error.main',
                  }}
                >
                  {stat.change} from yesterday
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Alerts Section */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Inventory Alerts
            </Typography>
            {alerts.map((alert, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Warning sx={{ color: alert.color, mr: 1 }} />
                  <Typography variant="body2">{alert.type}</Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    bgcolor: alert.color,
                    color: 'white',
                    px: 1,
                    borderRadius: 1,
                  }}
                >
                  {alert.count}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Loading recent activities...
              </Typography>
              <LinearProgress sx={{ mt: 2 }} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default DashboardPage
