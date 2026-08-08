import api from './api'

export const parentPinService = {
  status: () => api.get('/parent-pin/status'),
  set: (pin) => api.post('/parent-pin/set', { pin }),
  verify: (pin) => api.post('/parent-pin/verify', { pin }),
  change: (oldPin, newPin) => api.post('/parent-pin/change', { oldPin, newPin }),
  sendForgotOtp: () => api.post('/parent-pin/forgot/send-otp'),
  resetWithOtp: (otp, newPin) => api.post('/parent-pin/forgot/reset', { otp, newPin }),
}