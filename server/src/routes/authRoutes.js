const express = require("express");
const router = express.Router();
const passport = require("../config/passport");
const {
  login,
  getMe,
  updateProfile,
  changePassword,
  googleAuth,
  googleCallback,
  refresh,
  logout,
} = require("../controllers/authController");
const {
  forgotPassword,
  verifyOtp,
  resetPassword,
} = require("../controllers/passwordResetController");
const {
  sendRegisterOtp,
  verifyRegisterOtp,
} = require("../controllers/registerOtpController");
const {
  sendCreatePasswordOtp,
  createPassword,
} = require("../controllers/passwordCreateController");
const {
  forgotPasswordLimiter,
  verifyOtpLimiter,
  resetPasswordLimiter,
  loginLimiter,
  registerLimiter,
  createPasswordOtpLimiter,
  createPasswordLimiter,
} = require("../middlewares/rateLimiters");
const { protect } = require("../middlewares/authMiddleware");

router.post("/send-register-otp", registerLimiter, sendRegisterOtp);
router.post("/verify-register-otp", verifyOtpLimiter, verifyRegisterOtp);
router.post("/login", loginLimiter, login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/verify-otp", verifyOtpLimiter, verifyOtp);
router.post("/reset-password", resetPasswordLimiter, resetPassword);
router.get("/me", protect, getMe);
router.put("/update-profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

// Tạo mật khẩu lần đầu cho tài khoản đăng nhập bằng Google (chưa có mật khẩu) — có xác thực OTP
router.post(
  "/send-create-password-otp",
  protect,
  createPasswordOtpLimiter,
  sendCreatePasswordOtp,
);
router.post("/create-password", protect, createPasswordLimiter, createPassword);

// Google OAuth
router.get("/google", googleAuth);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed`,
  }),
  googleCallback,
);

module.exports = router;
