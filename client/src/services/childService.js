import api from './api'

export const childService = {
  list: () => api.get('/children'),
  create: (data) => api.post('/children', data),
  archive: (childId) => api.delete(`/children/${childId}`),
  getDashboard: (childId) => api.get(`/children/${childId}/dashboard`),
  updateSettings: (childId, patch) => api.patch(`/children/${childId}/settings`, patch),
  lock: (childId) => api.post(`/children/${childId}/lock`),
  unlock: (childId, pin) => api.post(`/children/${childId}/unlock`, { pin }),
  getBooks: (childId) => api.get(`/children/${childId}/books`),
  setBookVisibility: (childId, bookId, visible) =>
    api.patch(`/children/${childId}/books/${bookId}`, { visible }),

  // Link/QR riêng cho bé (chế độ Kiosk)
  getKidLink: (childId) => api.get(`/children/${childId}/kid-link`),
  regenerateKidLink: (childId) => api.post(`/children/${childId}/kid-link/regenerate`),

  // Xoá vĩnh viễn
  deletePermanently: (childId, confirmName) =>
    api.delete(`/children/${childId}/permanent`, { data: { confirmName } }),
}