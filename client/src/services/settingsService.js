import api from './api'

export const settingsService = {
  // Public — không cần đăng nhập, dùng để kiểm tra trạng thái bảo trì / banner
  getPublic: () => api.get('/settings/public'),

  // Admin — chỉ ADMIN mới gọi được (được chặn ở backend)
  getAdmin: () => api.get('/admin/settings'),
  updateAdmin: (data) => api.put('/admin/settings', data),
}