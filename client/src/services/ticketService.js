import api from './api'

export const ticketService = {
  // Public — form Liên hệ (/contact), không cần đăng nhập
  create: (data) => api.post('/tickets', data),

  // Admin/Staff — quản lý ticket
  getTickets: (params) => api.get('/admin/tickets', { params }),
  getTicketById: (id) => api.get(`/admin/tickets/${id}`),
  updateStatus: (id, status) => api.patch(`/admin/tickets/${id}/status`, { status }),
  assign: (id, assignedToId) => api.patch(`/admin/tickets/${id}/assign`, { assignedToId }),
  reply: (id, message, nextStatus) =>
    api.post(`/admin/tickets/${id}/reply`, { message, nextStatus }),
}