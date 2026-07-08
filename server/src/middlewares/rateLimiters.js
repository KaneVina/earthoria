const rateLimit = require('express-rate-limit')
const { ipKeyGenerator } = require('express-rate-limit')
const { RedisStore } = require('rate-limit-redis')
const Redis = require('ioredis')

// ─── Redis client (chỉ khởi tạo nếu có REDIS_URL) ───
// Giúp local dev không cần cài Redis, production (multi-server) thì bật lên
// bằng cách set biến môi trường REDIS_URL trong file .env
let redisClient = null
if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL)
  redisClient.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message)
  })
  redisClient.on('connect', () => {
    console.log('[Redis] Connected — rate limit dùng RedisStore (multi-server safe)')
  })
} else {
  console.log('[RateLimit] Không có REDIS_URL — dùng MemoryStore (chỉ phù hợp single-server)')
}

// Tạo store riêng cho từng limiter, dùng prefix khác nhau để tránh đụng key trong Redis
const makeStore = (prefix) => {
  if (!redisClient) return undefined // undefined => express-rate-limit tự dùng MemoryStore mặc định
  return new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: `rl:${prefix}:`,
  })
}

// Key chung: theo cả IP lẫn email để tránh 1 IP spam nhiều email
const emailIpKeyGenerator = (req) =>
  `${ipKeyGenerator(req.ip)}-${req.body?.email?.toLowerCase() || 'unknown'}`

// ─── Limit OTP requests per email/IP — chống spam gửi mail ───
// Tối đa 3 yêu cầu gửi OTP trong 15 phút cho mỗi IP
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('forgot-password'),
  message: {
    success: false,
    message: 'Bạn đã yêu cầu mã xác thực quá nhiều lần. Vui lòng thử lại sau 15 phút.',
  },
  keyGenerator: emailIpKeyGenerator,
})

// ─── Limit OTP verification attempts — chống brute-force đoán mã ───
// Tối đa 10 lần thử trong 10 phút cho mỗi IP
const verifyOtpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 phút
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('verify-otp'),
  message: {
    success: false,
    message: 'Quá nhiều lần thử xác thực. Vui lòng thử lại sau ít phút.',
  },
  keyGenerator: emailIpKeyGenerator,
})

// ─── Limit reset-password calls — endpoint nhạy cảm nhất ───
const resetPasswordLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('reset-password'),
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.',
  },
  keyGenerator: emailIpKeyGenerator,
})

module.exports = {
  forgotPasswordLimiter,
  verifyOtpLimiter,
  resetPasswordLimiter,
}