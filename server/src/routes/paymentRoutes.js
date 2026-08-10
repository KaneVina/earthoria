const express = require('express')
const router = express.Router()
const rateLimit = require('express-rate-limit')
const { ipKeyGenerator } = require('express-rate-limit')
const {
  createVnpayPaymentUrl,
  verifyVnpayReturn,
  vnpayIpn,
  createMomoPaymentUrl,
  verifyMomoReturn,
  momoIpn,
} = require('../controllers/paymentController')
const { protect } = require('../middlewares/authMiddleware')
const idempotency = require('../middlewares/idempotency')

router.get('/vnpay/ipn', vnpayIpn)
router.post('/momo/ipn', momoIpn)

router.use(protect)

const createPaymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 phút
  max: 5, // tối đa 5 phiên thanh toán mới / user / 10 phút (đủ cho các lần "thanh toán lại" hợp lệ)
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip),
  message: {
    success: false,
    message: 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút',
  },
})

router.post(
  '/vnpay/create-payment-url',
  createPaymentLimiter,
  idempotency('vnpay-create'),
  createVnpayPaymentUrl
)
router.get('/vnpay/verify', verifyVnpayReturn)

router.post(
  '/momo/create-payment-url',
  createPaymentLimiter,
  idempotency('momo-create'),
  createMomoPaymentUrl
)
router.get('/momo/verify', verifyMomoReturn)

module.exports = router