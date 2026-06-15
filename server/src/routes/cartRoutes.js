const express = require('express')
const router = express.Router()
const {
  getCart, addToCart, updateCartItem,
  removeCartItem, clearCart
} = require('../controllers/cartController')
const { protect } = require('../middlewares/authMiddleware')

router.use(protect)

router.get('/',                    getCart)
router.post('/',                   addToCart)
router.put('/items/:itemId',       updateCartItem)
router.delete('/items/:itemId',    removeCartItem)
router.delete('/',                 clearCart)

module.exports = router