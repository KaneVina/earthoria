const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
const {
  createVnpayPaymentUrl,
  verifyVnpayReturn,
  vnpayIpn,
  createMomoPaymentUrl,
  verifyMomoReturn,
  momoIpn,
  createBankQrPayment,
  getBankQrStatus,
  bankqrWebhook,
} = require("../controllers/paymentController");
const { protect } = require("../middlewares/authMiddleware");
const idempotency = require("../middlewares/idempotency");

router.get("/vnpay/ipn", vnpayIpn);
router.post("/momo/ipn", momoIpn);
router.post("/bankqr/webhook", bankqrWebhook);

router.use(protect);

const createPaymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip),
  message: {
    success: false,
    message: "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút",
  },
});

router.post(
  "/vnpay/create-payment-url",
  createPaymentLimiter,
  idempotency("vnpay-create"),
  createVnpayPaymentUrl,
);
router.get("/vnpay/verify", verifyVnpayReturn);

router.post(
  "/momo/create-payment-url",
  createPaymentLimiter,
  idempotency("momo-create"),
  createMomoPaymentUrl,
);
router.get("/momo/verify", verifyMomoReturn);

router.post(
  "/bankqr/create",
  createPaymentLimiter,
  idempotency("bankqr-create"),
  createBankQrPayment,
);
router.get("/bankqr/status/:orderId", getBankQrStatus);

module.exports = router;
