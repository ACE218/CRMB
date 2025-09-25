import api from './api'

// Auth services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
}

// Customer services
export const customerService = {
  getCustomers: (params) => api.get('/customers', { params }),
  getCustomer: (id) => api.get(`/customers/${id}`),
  createCustomer: (data) => api.post('/customers', data),
  updateCustomer: (id, data) => api.put(`/customers/${id}`, data),
  deleteCustomer: (id) => api.delete(`/customers/${id}`),
  getCustomerPurchases: (id, params) => api.get(`/customers/${id}/purchases`, { params }),
  updateLoyaltyPoints: (id, data) => api.put(`/customers/${id}/loyalty-points`, data),
  getCustomerAnalytics: (id) => api.get(`/customers/${id}/analytics`),
}

// Employee services
export const employeeService = {
  getEmployees: (params) => api.get('/employees', { params }),
  getEmployee: (id) => api.get(`/employees/${id}`),
  createEmployee: (data) => api.post('/employees', data),
  updateEmployee: (id, data) => api.put(`/employees/${id}`, data),
  deleteEmployee: (id) => api.delete(`/employees/${id}`),
  getEmployeeStats: () => api.get('/employees/stats/overview'),
}

// Product/Inventory services
export const inventoryService = {
  getProducts: (params) => api.get('/inventory', { params }),
  getProduct: (id) => api.get(`/inventory/${id}`),
  createProduct: (data) => api.post('/inventory', data),
  updateProduct: (id, data) => api.put(`/inventory/${id}`, data),
  deleteProduct: (id) => api.delete(`/inventory/${id}`),
  updateStock: (id, data) => api.put(`/inventory/${id}/stock`, data),
  getReorderAlerts: () => api.get('/inventory/alerts/reorder'),
  getExpiringAlerts: (params) => api.get('/inventory/alerts/expiring', { params }),
  getTopSelling: (params) => api.get('/inventory/reports/top-selling', { params }),
  getCategories: () => api.get('/inventory/meta/categories'),
  getBrands: () => api.get('/inventory/meta/brands'),
  searchByBarcode: (barcode) => api.get(`/inventory/search/barcode/${barcode}`),
}

// Bill services
export const billService = {
  getBills: (params) => api.get('/bills', { params }),
  getBill: (id) => api.get(`/bills/${id}`),
  createBill: (data) => api.post('/bills', data),
  updateBill: (id, data) => api.put(`/bills/${id}`, data),
  addPayment: (id, data) => api.post(`/bills/${id}/payments`, data),
  cancelBill: (id, data) => api.put(`/bills/${id}/cancel`, data),
  getSalesSummary: (params) => api.get('/bills/reports/sales-summary', { params }),
  getTopCustomers: (params) => api.get('/bills/reports/top-customers', { params }),
}

// Offer services
export const offerService = {
  getOffers: () => api.get('/offers'),
  getCustomerOffers: (customerId) => api.get(`/offers/customer/${customerId}`),
  applyOffer: (data) => api.post('/offers/apply', data),
  getRecommendations: (customerId) => api.get(`/offers/recommendations/${customerId}`),
  validateCode: (data) => api.post('/offers/validate', data),
}

// Analytics services
export const analyticsService = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getSalesAnalytics: (params) => api.get('/analytics/sales', { params }),
  getCustomerAnalytics: (params) => api.get('/analytics/customers', { params }),
  getProductAnalytics: (params) => api.get('/analytics/products', { params }),
  getInventoryAnalytics: () => api.get('/analytics/inventory'),
}

// Export all services
export default {
  auth: authService,
  customers: customerService,
  employees: employeeService,
  inventory: inventoryService,
  bills: billService,
  offers: offerService,
  analytics: analyticsService,
}
