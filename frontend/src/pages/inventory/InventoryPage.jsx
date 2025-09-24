import React from 'react'
import { Box, Typography, Paper } from '@mui/material'

const InventoryPage = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Inventory Management
      </Typography>
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Product Inventory
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Product catalog, stock management, and inventory features will be implemented here.
        </Typography>
      </Paper>
    </Box>
  )
}

export default InventoryPage
