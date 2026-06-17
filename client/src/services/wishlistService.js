import api from './api'

export const wishlistService = {
  getWishlist: () => api.get('/wishlist'),
  toggleWishlist: (hashId) => api.post(`/wishlist/${hashId}`),
  removeFromWishlist: (hashId) => api.delete(`/wishlist/${hashId}`)
}
