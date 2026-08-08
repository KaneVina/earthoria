const express = require("express");
const router = express.Router();
const {
  getPinStatus,
  setPin,
  verifyPin,
  changePin,
  sendForgotPinOtp,
  resetPinWithOtp,
} = require("../controllers/parentPinController");
const { protect } = require("../middlewares/authMiddleware");
const { parentPinLimiter, verifyOtpLimiter } = require("../middlewares/rateLimiters");

router.use(protect);

router.get("/status", getPinStatus);
router.post("/set", parentPinLimiter, setPin);
router.post("/verify", parentPinLimiter, verifyPin);
router.post("/change", parentPinLimiter, changePin);
router.post("/forgot/send-otp", parentPinLimiter, sendForgotPinOtp);
router.post("/forgot/reset", verifyOtpLimiter, resetPinWithOtp);

module.exports = router;