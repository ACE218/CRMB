import React from 'react'
import { Box, Typography, Paper } from '@mui/material'
import { useParams } from 'react-router-dom'

const ProductDetailsPage = () => {
  const { id } = useParams()

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Product Details
      </Typography>
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Product ID: {id}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Detailed product information, stock levels, and management options will be displayed here.
        </Typography>
      </Paper>
    </Box>
  )
}

export default ProductDetailsPage
