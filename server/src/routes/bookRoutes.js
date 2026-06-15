const express = require('express')
const router = express.Router()
const {
  getBooks, getBook, getFeaturedBooks,
  addReview, toggleWishlist, getWishlist
} = require('../controllers/bookController')
const { protect } = require('../middlewares/authMiddleware')

// URL: /api/v1/books
router.get('/',                           getBooks)
router.get('/featured',                   getFeaturedBooks)
router.get('/wishlist',        protect,   getWishlist)

// URL: /api/v1/books/:slug/:hashId
router.get('/:slug/:hashId',              getBook)
router.post('/:slug/:hashId/reviews',  protect, addReview)
router.post('/:slug/:hashId/wishlist', protect, toggleWishlist)

module.exports = router