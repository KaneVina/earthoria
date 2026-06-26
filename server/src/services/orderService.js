import api from './api'

export const orderService = {
  createOrder: (data) => api.post('/orders', data),
  getMyOrders: ()     => api.get('/orders/me'),
}