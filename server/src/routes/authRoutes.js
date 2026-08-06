const express = require("express");
const router = express.Router();
const passport = require("../config/passport");
const {
  register,
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
  forgotPasswordLimiter,
  verifyOtpLimiter,
  resetPasswordLimiter,
  loginLimiter,
  registerLimiter,
} = require("../middlewares/rateLimiters");
const { protect } = require("../middlewares/authMiddleware");

router.post("/register", registerLimiter, register);
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
