import React from 'react'
import { Box, Typography, Paper } from '@mui/material'

const OffersPage = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Offers & Promotions
      </Typography>
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Marketing & Offers
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Offer management, customer discounts, and promotional campaigns will be managed here.
        </Typography>
      </Paper>
    </Box>
  )
}

export default OffersPage
