import api from './api'

export const addressService = {
  getAll:     ()         => api.get('/addresses'),
  create:     (data)     => api.post('/addresses', data),
  update:     (id, data) => api.put(`/addresses/${id}`, data),
  remove:     (id)       => api.delete(`/addresses/${id}`),
  setDefault: (id)       => api.patch(`/addresses/${id}/default`),
}