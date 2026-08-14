const express = require('express')
const router = express.Router()
const { createOrder, getMyOrders, calcShippingFee, getOrderById, cancelOrder, confirmOrderReceived } = require('../controllers/orderController')
const { protect } = require('../middlewares/authMiddleware')

router.use(protect)

router.post('/shipping-fee',       calcShippingFee)
router.post('/',                   createOrder)
router.get('/me',                  getMyOrders)
router.get('/:id',                 getOrderById)
router.put('/:id/cancel',          cancelOrder)
router.put('/:id/confirm-received', confirmOrderReceived)

module.exports = router