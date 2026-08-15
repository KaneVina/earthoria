import api from "./api";

export const ebookService = {
  // ── Admin ──
  list: (params) => api.get("/admin/ebooks", { params }),
  getById: (id) => api.get(`/admin/ebooks/${id}`),
  getForBook: (bookId) => api.get(`/admin/ebooks/book/${bookId}`),
  create: (bookId, payload) => api.post(`/admin/ebooks/book/${bookId}`, payload),
  update: (id, payload) => api.put(`/admin/ebooks/${id}`, payload),
  toggle: (id) => api.put(`/admin/ebooks/${id}/toggle`),
  remove: (id) => api.delete(`/admin/ebooks/${id}`),
  uploadImage: (file, ebookId) => {
    const fd = new FormData();
    fd.append("image", file);
    return api.post("/admin/ebooks/upload-image", fd, {
      params: ebookId ? { ebookId } : undefined,
    });
  },
  deleteImage: (url) => api.post("/admin/ebooks/delete-image", { url }),

  // ── Public (đọc sách, yêu cầu đã mua bản điện tử) ──
  readBySlug: (slug) => api.get(`/ebook-reader/${slug}`),
};