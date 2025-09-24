import React from 'react'
import { Box, Typography, Paper } from '@mui/material'

const CustomersPage = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Customers
      </Typography>
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Customer Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Customer list, profiles, and management features will be implemented here.
        </Typography>
      </Paper>
    </Box>
  )
}

export default CustomersPage
