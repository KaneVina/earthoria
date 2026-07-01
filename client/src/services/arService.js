import api from './api'

export const arService = {
  getArCode: (code) => api.get(`/ar/${code}`),
  getMyArBooks: () => api.get('/ar/my-books'),
}