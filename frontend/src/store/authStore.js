import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.post('/auth/login', credentials)
          const { customer, token } = response.data.data

          set({
            user: customer,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })

          // Set default authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`

          return { success: true, user: customer }
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Login failed'
          set({
            isLoading: false,
            error: errorMessage
          })
          return { success: false, error: errorMessage }
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.post('/auth/register', userData)
          const { customer, token } = response.data.data

          set({
            user: customer,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })

          // Set default authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`

          return { success: true, user: customer }
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Registration failed'
          set({
            isLoading: false,
            error: errorMessage
          })
          return { success: false, error: errorMessage }
        }
      },

      logout: () => {
        // Clear authorization header
        delete api.defaults.headers.common['Authorization']
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        })
      },

      refreshToken: async () => {
        const { token } = get()
        if (!token) return false

        try {
          const response = await api.post('/auth/refresh')
          const newToken = response.data.data.token

          set({ token: newToken })
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
          
          return true
        } catch (error) {
          // If refresh fails, logout
          get().logout()
          return false
        }
      },

      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.put('/auth/profile', profileData)
          const updatedUser = response.data.data.customer

          set({
            user: { ...get().user, ...updatedUser },
            isLoading: false,
            error: null
          })

          return { success: true, user: updatedUser }
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Profile update failed'
          set({
            isLoading: false,
            error: errorMessage
          })
          return { success: false, error: errorMessage }
        }
      },

      changePassword: async (passwordData) => {
        set({ isLoading: true, error: null })
        
        try {
          await api.put('/auth/change-password', passwordData)
          
          set({
            isLoading: false,
            error: null
          })

          return { success: true }
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Password change failed'
          set({
            isLoading: false,
            error: errorMessage
          })
          return { success: false, error: errorMessage }
        }
      },

      clearError: () => {
        set({ error: null })
      },

      // Initialize auth from stored token
      initializeAuth: () => {
        const { token } = get()
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          set({ isAuthenticated: true })
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

// Initialize auth when the store is created
useAuthStore.getState().initializeAuth()
