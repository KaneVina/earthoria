import api from './api'

export const orderService = {
  createOrder: (data) => api.post('/orders', data),
  getMyOrders: (params) => api.get('/orders/me', { params }),
  getOrders:   (params) => api.get('/orders/me', { params }),
  getOrder:    (id)     => api.get(`/orders/${id}`),
  cancelOrder: (id)     => api.put(`/orders/${id}/cancel`)
}