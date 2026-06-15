const express = require('express')
const router = express.Router()
const {
  createOrder, getMyOrders,
  getOrder, cancelOrder
} = require('../controllers/orderController')
const { protect } = require('../middlewares/authMiddleware')

router.use(protect)

router.get('/',           getMyOrders)
router.post('/',          createOrder)
router.get('/:id',        getOrder)
router.put('/:id/cancel', cancelOrder)

module.exports = router