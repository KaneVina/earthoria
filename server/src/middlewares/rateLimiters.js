const rateLimit = require('express-rate-limit')

// ─── Limit OTP requests per email/IP — chống spam gửi mail ───
// Tối đa 3 yêu cầu gửi OTP trong 15 phút cho mỗi IP
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Bạn đã yêu cầu mã xác thực quá nhiều lần. Vui lòng thử lại sau 15 phút.',
  },
  // Key theo cả IP lẫn email để tránh 1 IP spam nhiều email
  keyGenerator: (req) => `${req.ip}-${req.body?.email?.toLowerCase() || 'unknown'}`,
})

// ─── Limit OTP verification attempts — chống brute-force đoán mã ───
// Tối đa 10 lần thử trong 10 phút cho mỗi IP
const verifyOtpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 phút
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Quá nhiều lần thử xác thực. Vui lòng thử lại sau ít phút.',
  },
  keyGenerator: (req) => `${req.ip}-${req.body?.email?.toLowerCase() || 'unknown'}`,
})

// ─── Limit reset-password calls — endpoint nhạy cảm nhất ───
const resetPasswordLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.',
  },
  keyGenerator: (req) => `${req.ip}-${req.body?.email?.toLowerCase() || 'unknown'}`,
})

module.exports = {
  forgotPasswordLimiter,
  verifyOtpLimiter,
  resetPasswordLimiter,
}