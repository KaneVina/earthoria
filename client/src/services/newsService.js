import api from "./api";

export const newsService = {
  // ── Public (trang /blog) ──
  getPublicPosts: (params) => api.get("/news/posts", { params }),
  getPublicFiles: (params) => api.get("/news/files", { params }),

  // ── Admin/Staff (dashboard) ──
  // Bảng tin
  getPosts: (params) => api.get("/admin/news/posts", { params }),
  createPost: (data) => api.post("/admin/news/posts", data),
  updatePost: (id, data) => api.put(`/admin/news/posts/${id}`, data),
  toggleHidePost: (id) => api.patch(`/admin/news/posts/${id}/hide`),
  restorePost: (id) => api.patch(`/admin/news/posts/${id}/restore`),
  softDeletePost: (id) => api.delete(`/admin/news/posts/${id}/soft`),
  hardDeletePost: (id) => api.delete(`/admin/news/posts/${id}/hard`),

  // File công khai
  getFiles: (params) => api.get("/admin/news/files", { params }),
  createFile: (formData) =>
    api.post("/admin/news/files", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  toggleHideFile: (id) => api.patch(`/admin/news/files/${id}/hide`),
  restoreFile: (id) => api.patch(`/admin/news/files/${id}/restore`),
  softDeleteFile: (id) => api.delete(`/admin/news/files/${id}/soft`),
  hardDeleteFile: (id) => api.delete(`/admin/news/files/${id}/hard`),
};