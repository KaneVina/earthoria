import api from './api'

export const paymentService = {
  createVnpayUrl: (orderId) => api.post('/payments/vnpay/create-payment-url', { orderId }),
  verifyVnpayReturn: (queryString) => api.get(`/payments/vnpay/verify?${queryString}`),

  createMomoUrl: (orderId) => api.post('/payments/momo/create-payment-url', { orderId }),
  verifyMomoReturn: (queryString) => api.get(`/payments/momo/verify?${queryString}`),
}