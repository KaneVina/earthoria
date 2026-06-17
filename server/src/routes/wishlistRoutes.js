const express = require('express')
const router = express.Router()
const {
  getWishlist, toggleWishlist, removeFromWishlist
} = require('../controllers/wishlistController')
const { protect } = require('../middlewares/authMiddleware')

router.use(protect)

router.get('/',                 getWishlist)
router.post('/:hashId',         toggleWishlist)
router.delete('/:hashId',       removeFromWishlist)

module.exports = router