import api from './api'

export const newIdempotencyKey = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`

export const paymentService = {
  createVnpayUrl: (orderId, idempotencyKey = newIdempotencyKey()) =>
    api.post(
      '/payments/vnpay/create-payment-url',
      { orderId },
      { headers: { 'Idempotency-Key': idempotencyKey } }
    ),
  verifyVnpayReturn: (queryString) => api.get(`/payments/vnpay/verify?${queryString}`),

  createMomoUrl: (orderId, idempotencyKey = newIdempotencyKey()) =>
    api.post(
      '/payments/momo/create-payment-url',
      { orderId },
      { headers: { 'Idempotency-Key': idempotencyKey } }
    ),
  verifyMomoReturn: (queryString) => api.get(`/payments/momo/verify?${queryString}`),

  createBankQrPayment: (orderId, idempotencyKey = newIdempotencyKey()) =>
    api.post(
      '/payments/bankqr/create',
      { orderId },
      { headers: { 'Idempotency-Key': idempotencyKey } }
    ),
  getBankQrStatus: (orderId) => api.get(`/payments/bankqr/status/${orderId}`),

  newIdempotencyKey,
}