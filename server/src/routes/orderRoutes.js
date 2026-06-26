const express = require('express')
const router = express.Router()
const { createOrder, getMyOrders, calcShippingFee } = require('../controllers/orderController')
const { protect } = require('../middlewares/authMiddleware')

router.use(protect)

router.post('/shipping-fee', calcShippingFee)
router.post('/',             createOrder)
router.get('/me',            getMyOrders)

module.exports = router