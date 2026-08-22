const express = require('express')
const router = express.Router()
const { validateCoupon, getAvailableCoupons } = require('../controllers/couponController')
const { protect } = require('../middlewares/authMiddleware')

router.use(protect)

router.get('/available', getAvailableCoupons)
router.post('/validate', validateCoupon)

module.exports = router