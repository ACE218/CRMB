import React from 'react'
import { Box, Typography, Paper } from '@mui/material'

const AnalyticsPage = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Analytics & Reports
      </Typography>
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Business Intelligence
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sales reports, customer analytics, inventory insights, and performance metrics will be displayed here.
        </Typography>
      </Paper>
    </Box>
  )
}

export default AnalyticsPage
