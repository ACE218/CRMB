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
          const { employee, token } = response.data.data

          set({
            user: { ...employee, userType: 'employee' },
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })

          // Set default authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`

          return { success: true, user: employee }
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Login failed'
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
