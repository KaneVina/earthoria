const rateLimit = require('express-rate-limit')
const { ipKeyGenerator } = require('express-rate-limit')

const emailIpKeyGenerator = (req) =>
  `${ipKeyGenerator(req.ip)}-${req.body?.email?.toLowerCase() || 'unknown'}`

// Dùng cho các route đã đăng nhập (protect) — định danh theo user id thay vì email nhập tay
const userIdKeyGenerator = (req) =>
  req.user?.id ? `user-${req.user.id}` : ipKeyGenerator(req.ip)

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

const createPasswordOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Bạn đã yêu cầu mã xác thực quá nhiều lần. Vui lòng thử lại sau 15 phút.',
  },
  keyGenerator: userIdKeyGenerator,
})

// Tối đa 10 lần thử xác thực + tạo mật khẩu trong 10 phút cho mỗi user
const createPasswordLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Quá nhiều lần thử xác thực. Vui lòng thử lại sau ít phút.',
  },
  keyGenerator: userIdKeyGenerator,
})

const parentPinLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu liên quan đến mã PIN. Vui lòng thử lại sau ít phút.',
  },
  keyGenerator: userIdKeyGenerator,
})

// Tối đa 5 lần gửi form liên hệ trong 15 phút, tính theo IP + email
const ticketLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Bạn đã gửi yêu cầu liên hệ quá nhiều lần. Vui lòng thử lại sau 15 phút.',
  },
  keyGenerator: emailIpKeyGenerator,
})

module.exports = {
  forgotPasswordLimiter,
  verifyOtpLimiter,
  resetPasswordLimiter,
  loginLimiter,
  registerLimiter,
  createPasswordOtpLimiter,
  createPasswordLimiter,
  parentPinLimiter,
  ticketLimiter,
}