import api from './api'

export const kidAccessService = {
  getProfile: (token) => api.get(`/kid-access/${token}`),
  getBooks: (token) => api.get(`/kid-access/${token}/books`),

  startActivity: (token, { bookId } = {}) =>
    api.post(`/kid-access/${token}/activity/start`, { bookId }),
  pingActivity: (token, activityId) =>
    api.post(`/kid-access/${token}/activity/${activityId}/ping`),

  getGarden: (token) => api.get(`/kid-access/${token}/garden`),
}