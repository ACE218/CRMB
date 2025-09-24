import React from 'react'
import { Box, Typography, Paper } from '@mui/material'

const ProfilePage = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          User Profile
        </Typography>
        <Typography variant="body2" color="text.secondary">
          User profile information, account settings, and personal preferences will be managed here.
        </Typography>
      </Paper>
    </Box>
  )
}

export default ProfilePage
