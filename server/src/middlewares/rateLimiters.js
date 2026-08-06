const rateLimit = require('express-rate-limit')
const { ipKeyGenerator } = require('express-rate-limit')

const emailIpKeyGenerator = (req) =>
  `${ipKeyGenerator(req.ip)}-${req.body?.email?.toLowerCase() || 'unknown'}`

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
  keyGenerator: emailIpKeyGenerator,
})

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
  keyGenerator: emailIpKeyGenerator,
})

const resetPasswordLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.',
  },
  keyGenerator: emailIpKeyGenerator,
})

// Tối đa 8 lần thử trong 15 phút, tính theo IP + email
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.',
  },
  keyGenerator: emailIpKeyGenerator,
})

// Tối đa 5 lần trong 15 phút, tính theo IP + email
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Bạn đã yêu cầu đăng ký quá nhiều lần. Vui lòng thử lại sau 15 phút.',
  },
  keyGenerator: emailIpKeyGenerator,
})

module.exports = {
  forgotPasswordLimiter,
  verifyOtpLimiter,
  resetPasswordLimiter,
  loginLimiter,
  registerLimiter,
}