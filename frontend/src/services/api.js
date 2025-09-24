import axios from 'axios'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth-storage')
    if (token) {
      try {
        const parsedData = JSON.parse(token)
        if (parsedData?.state?.token) {
          config.headers.Authorization = `Bearer ${parsedData.state.token}`
        }
      } catch (error) {
        console.error('Error parsing stored auth data:', error)
      }
    }

    // Log request in development
    if (import.meta.env.MODE === 'development') {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.data)
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.MODE === 'development') {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data)
    }

    return response
  },
  (error) => {
    // Log error in development
    if (import.meta.env.MODE === 'development') {
      console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response?.data)
    }

    // Handle common error cases
    if (error.response?.status === 401) {
      // Unauthorized - clear auth and redirect to login
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    }

    // Handle network errors
    if (!error.response) {
      error.message = 'Network error - please check your connection'
    }

    return Promise.reject(error)
  }
)

export default api
