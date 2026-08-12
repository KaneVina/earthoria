import api from './api'

export const bookService = {
  getBooks: (params) => api.get('/books', { params }),
  getFilterCounts: (params) => api.get('/books/filter-counts', { params }),
  getBook: (slug, hashId) => api.get(`/books/${slug}/${hashId}`),
  getFeatured: () => api.get('/books/featured'),
  addReview: (slug, hashId, data) => api.post(`/books/${slug}/${hashId}/reviews`, data),
  voteReview: (slug, hashId, reviewId, isHelpful) => api.post(`/books/${slug}/${hashId}/reviews/${reviewId}/vote`, { isHelpful }),
  toggleWishlist: (slug, hashId) => api.post(`/books/${slug}/${hashId}/wishlist`),
  getWishlist: () => api.get('/books/wishlist'),
  getCategories: () => api.get('/categories'),

  // Admin/Staff — quản lý đánh giá
  getAdminReviews: (params) => api.get('/admin/reviews', { params }),
  getAdminReviewById: (id) => api.get(`/admin/reviews/${id}`),
  replyToReview: (id, message) => api.post(`/admin/reviews/${id}/reply`, { message }),
  toggleReviewVisibility: (id) => api.patch(`/admin/reviews/${id}/visibility`)
}