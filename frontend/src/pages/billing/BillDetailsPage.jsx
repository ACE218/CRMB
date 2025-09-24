import React from 'react'
import { Box, Typography, Paper } from '@mui/material'
import { useParams } from 'react-router-dom'

const BillDetailsPage = () => {
  const { id } = useParams()

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Bill Details
      </Typography>
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Bill ID: {id}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Detailed bill information, items, payment status, and actions will be displayed here.
        </Typography>
      </Paper>
    </Box>
  )
}

export default BillDetailsPage
