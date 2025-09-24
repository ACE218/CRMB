import React from 'react'
import {
  Container,
  Paper,
  Box,
  Typography,
  Link,
} from '@mui/material'
import { Store } from '@mui/icons-material'
import { Link as RouterLink } from 'react-router-dom'

const RegisterPage = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.100',
        py: 3,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Store
            sx={{
              fontSize: 48,
              color: 'primary.main',
              mb: 2,
            }}
          />
          <Typography variant="h4" component="h1" gutterBottom>
            Coming Soon
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Customer registration will be available soon.
            For now, please contact an administrator to create your account.
          </Typography>
          <Link component={RouterLink} to="/login">
            Back to Login
          </Link>
        </Paper>
      </Container>
    </Box>
  )
}

export default RegisterPage
