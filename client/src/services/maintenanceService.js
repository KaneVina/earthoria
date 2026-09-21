import api from "./api";

export const maintenanceService = {
  // Public - trang /maintenance dùng để lấy danh sách hạng mục + % tiến độ (đã tính sẵn)
  getPublic: () => api.get("/maintenance/public"),

  // Admin - chỉ ADMIN mới gọi được (được chặn ở backend)
  getTasks: () => api.get("/admin/maintenance/tasks"),
  createTask: (data) => api.post("/admin/maintenance/tasks", data),
  updateTask: (id, data) => api.put(`/admin/maintenance/tasks/${id}`, data),
  confirmTask: (id) => api.patch(`/admin/maintenance/tasks/${id}/confirm`),
  moveTask: (id, direction) =>
    api.patch(`/admin/maintenance/tasks/${id}/move`, { direction }),
  deleteTask: (id) => api.delete(`/admin/maintenance/tasks/${id}`),
};
