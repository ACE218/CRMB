import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@mui/material'

// Store
import { useAuthStore } from './store/authStore'

// Components
import Navbar from './components/layout/Navbar'
import Sidebar from './components/layout/Sidebar'
import ProtectedRoute from './components/auth/ProtectedRoute'

// Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import CustomersPage from './pages/customers/CustomersPage'
import CustomerDetailsPage from './pages/customers/CustomerDetailsPage'
import InventoryPage from './pages/inventory/InventoryPage'
import ProductDetailsPage from './pages/inventory/ProductDetailsPage'
import BillingPage from './pages/billing/BillingPage'
import BillDetailsPage from './pages/billing/BillDetailsPage'
import OffersPage from './pages/offers/OffersPage'
import AnalyticsPage from './pages/analytics/AnalyticsPage'
import SettingsPage from './pages/SettingsPage'
import ProfilePage from './pages/ProfilePage'

function App() {
  const { isAuthenticated } = useAuthStore()

  // If not authenticated, show auth routes
  if (!isAuthenticated) {
    return (
      <Box sx={{ minHeight: '100vh' }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Box>
    )
  }

  // If authenticated, show main app
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <Box 
          component="main" 
          sx={{ 
            flex: 1, 
            p: 3, 
            bgcolor: 'background.default',
            overflow: 'auto'
          }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Dashboard */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Customers */}
            <Route 
              path="/customers" 
              element={
                <ProtectedRoute>
                  <CustomersPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customers/:id" 
              element={
                <ProtectedRoute>
                  <CustomerDetailsPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Inventory */}
            <Route 
              path="/inventory" 
              element={
                <ProtectedRoute>
                  <InventoryPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/inventory/:id" 
              element={
                <ProtectedRoute>
                  <ProductDetailsPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Billing */}
            <Route 
              path="/billing" 
              element={
                <ProtectedRoute>
                  <BillingPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bills/:id" 
              element={
                <ProtectedRoute>
                  <BillDetailsPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Offers */}
            <Route 
              path="/offers" 
              element={
                <ProtectedRoute>
                  <OffersPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Analytics */}
            <Route 
              path="/analytics" 
              element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Settings & Profile */}
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  )
}

export default App
