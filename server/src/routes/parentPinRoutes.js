const express = require("express");
const router = express.Router();
const {
  getPinStatus,
  setPin,
  verifyPin,
  changePin,
  sendForgotPinOtp,
  resetPinWithOtp,
  unlockGate,
  lockGate,
} = require("../controllers/parentPinController");
const { protect } = require("../middlewares/authMiddleware");
const {
  parentPinLimiter,
  verifyOtpLimiter,
} = require("../middlewares/rateLimiters");

router.use(protect);

router.get("/status", getPinStatus);
router.post("/set", parentPinLimiter, setPin);
router.post("/verify", parentPinLimiter, verifyPin);
router.post("/change", parentPinLimiter, changePin);
router.post("/forgot/send-otp", parentPinLimiter, sendForgotPinOtp);
router.post("/forgot/reset", verifyOtpLimiter, resetPinWithOtp);

// Cổng PIN bảo vệ toàn bộ /family - xem middlewares/familyGate.js
router.post("/gate/unlock", parentPinLimiter, unlockGate);
router.post("/gate/lock", lockGate); // khoá lại không cần PIN (thắt chặt an toàn)

module.exports = router;
