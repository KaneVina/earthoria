import api from './api'

export const wishlistService = {
  // GET /api/v1/books/wishlist — trả về array book đã encode hashId
  getWishlist: () => api.get('/books/wishlist'),

  // POST /api/v1/books/:slug/:hashId/wishlist — toggle
  toggleWishlist: (slug, hashId) =>
    api.post(`/books/${slug}/${hashId}/wishlist`),
}