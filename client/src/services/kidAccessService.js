import api from './api'

export const kidAccessService = {
  getProfile: (token) => api.get(`/kid-access/${token}`),
  getBooks: (token) => api.get(`/kid-access/${token}/books`),
}