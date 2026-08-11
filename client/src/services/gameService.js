import api from "./api";

export const gameService = {
  // ── Public (khách quét QR / mở link chơi) ──
  getGame: (code) => api.get(`/games/${code}`),
  completeGame: (code, payload) => api.post(`/games/${code}/complete`, payload),
  getLeaderboard: (code) => api.get(`/games/${code}/leaderboard`),

  // ── Admin ──
  list: (params) => api.get("/admin/games", { params }),
  getById: (id) => api.get(`/admin/games/${id}`),
  getForBook: (bookId) => api.get(`/admin/games/book/${bookId}`),
  create: (bookId, payload) => api.post(`/admin/games/book/${bookId}`, payload),
  update: (id, payload) => api.put(`/admin/games/${id}`, payload),
  toggle: (id) => api.put(`/admin/games/${id}/toggle`),
  updateAccess: (id, accessType) => api.patch(`/admin/games/${id}/access`, { accessType }),
  remove: (id) => api.delete(`/admin/games/${id}`),
  getLeaderboardAdmin: (id) => api.get(`/admin/games/${id}/leaderboard`),
  uploadImage: (file, gameId) => {
    const fd = new FormData();
    fd.append("image", file);
    return api.post("/admin/games/upload-image", fd, {
      params: gameId ? { gameId } : undefined,
    });
  },
  deleteImage: (url) => api.post("/admin/games/delete-image", { url }),
};