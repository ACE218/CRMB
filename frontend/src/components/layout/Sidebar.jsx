import React from 'react'
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
} from '@mui/material'
import {
  Dashboard,
  People,
  Badge,
  Inventory2,
  Receipt,
  LocalOffer,
  Analytics,
  Settings,
  Store,
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'

const drawerWidth = 240

const menuItems = [
  {
    text: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
  },
  {
    text: 'Customers',
    icon: <People />,
    path: '/customers',
  },
  {
    text: 'Employees',
    icon: <Badge />,
    path: '/employees',
  },
  {
    text: 'Inventory',
    icon: <Inventory2 />,
    path: '/inventory',
  },
  {
    text: 'Billing',
    icon: <Receipt />,
    path: '/billing',
  },
  {
    text: 'Offers',
    icon: <LocalOffer />,
    path: '/offers',
  },
  {
    text: 'Analytics',
    icon: <Analytics />,
    path: '/analytics',
  },
  {
    text: 'Settings',
    icon: <Settings />,
    path: '/settings',
  },
]

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const handleNavigation = (path) => {
    navigate(path)
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: 'primary.main',
          color: 'white',
        },
      }}
    >
      {/* Logo/Brand */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Store sx={{ fontSize: 32, color: 'white' }} />
        <Typography
          variant="h5"
          component="div"
          sx={{
            fontWeight: 600,
            color: 'white',
          }}
        >
          CRMB
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />

      {/* Navigation Menu */}
      <List sx={{ pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: 1,
                '&.Mui-selected': {
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                  },
                },
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: 'white',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  '& .MuiTypography-root': {
                    fontWeight: location.pathname === item.path ? 600 : 400,
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Footer */}
      <Box
        sx={{
          mt: 'auto',
          p: 2,
          textAlign: 'center',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
          }}
        >
          © 2025 CRMB System
        </Typography>
      </Box>
    </Drawer>
  )
}

export default Sidebar
