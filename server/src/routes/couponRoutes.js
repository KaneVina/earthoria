const express = require('express')
const router = express.Router()
const { validateCoupon } = require('../controllers/couponController')
const { protect } = require('../middlewares/authMiddleware')

router.use(protect)

router.post('/validate', validateCoupon)

module.exports = router