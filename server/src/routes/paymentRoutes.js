const express = require('express')
const router = express.Router()
const {
  createVnpayPaymentUrl,
  verifyVnpayReturn,
  vnpayIpn,
  createMomoPaymentUrl,
  verifyMomoReturn,
  momoIpn,
} = require('../controllers/paymentController')
const { protect } = require('../middlewares/authMiddleware')

// IPN — gateway gọi server-to-server, KHÔNG có access token của user nên không qua `protect`.
// Đặt trước router.use(protect) để không bị chặn.
router.get('/vnpay/ipn', vnpayIpn)
router.post('/momo/ipn', momoIpn)

router.use(protect)

router.post('/vnpay/create-payment-url', createVnpayPaymentUrl)
router.get('/vnpay/verify', verifyVnpayReturn)

router.post('/momo/create-payment-url', createMomoPaymentUrl)
router.get('/momo/verify', verifyMomoReturn)

module.exports = router