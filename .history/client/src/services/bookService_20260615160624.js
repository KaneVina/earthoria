import api from './api'

export const bookService = {
  getBooks: (params) => api.get('/books', { params }),
  getBook: (slug, hashId) => api.get(`/books/${slug}/${hashId}`),
  getFeatured: () => api.get('/books/featured'),
  addReview: (slug, hashId, data) => api.post(`/books/${slug}/${hashId}/reviews`, data),
  toggleWishlist: (slug, hashId) => api.post(`/books/${slug}/${hashId}/wishlist`),
  getWishlist: () => api.get('/books/wishlist'),
  getCategories: () => api.get('/categories')
}