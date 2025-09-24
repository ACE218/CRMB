import React from 'react'
import { Box, Typography, Paper } from '@mui/material'
import { useParams } from 'react-router-dom'

const CustomerDetailsPage = () => {
  const { id } = useParams()

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Customer Details
      </Typography>
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Customer ID: {id}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Detailed customer information and history will be displayed here.
        </Typography>
      </Paper>
    </Box>
  )
}

export default CustomerDetailsPage
