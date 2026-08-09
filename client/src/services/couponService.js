import api from './api'

export const couponService = {
  validate: (code, subtotal) => api.post('/coupons/validate', { code, subtotal }),
}