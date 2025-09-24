import React from 'react'
import { Box, Typography, Paper } from '@mui/material'

const SettingsPage = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          System Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary">
          System settings, user preferences, and configuration options will be available here.
        </Typography>
      </Paper>
    </Box>
  )
}

export default SettingsPage
