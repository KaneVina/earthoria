const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

const emailIpKeyGenerator = (req) =>
  `${ipKeyGenerator(req.ip)}-${req.body?.email?.toLowerCase() || "unknown"}`;

// Dùng cho các route đã đăng nhập (protect) - định danh theo user id thay vì email nhập tay
const userIdKeyGenerator = (req) =>
  req.user?.id ? `user-${req.user.id}` : ipKeyGenerator(req.ip);

// Tối đa 3 yêu cầu gửi OTP trong 15 phút cho mỗi IP
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Bạn đã yêu cầu mã xác thực quá nhiều lần. Vui lòng thử lại sau 15 phút.",
  },
  keyGenerator: emailIpKeyGenerator,
});

// Tối đa 10 lần thử trong 10 phút cho mỗi IP
const verifyOtpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 phút
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Quá nhiều lần thử xác thực. Vui lòng thử lại sau ít phút.",
  },
  keyGenerator: emailIpKeyGenerator,
});

const resetPasswordLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.",
  },
  keyGenerator: emailIpKeyGenerator,
});

// Tối đa 8 lần thử trong 15 phút, tính theo IP + email
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.",
  },
  keyGenerator: emailIpKeyGenerator,
});

// Cổng Quản trị (admin/staff) - hạn mức chặt hơn login thường vì đây là mục
// tiêu dò mật khẩu có giá trị cao hơn tài khoản khách hàng thông thường.
const staffLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.",
  },
  keyGenerator: emailIpKeyGenerator,
});

// Tối đa 5 lần trong 15 phút, tính theo IP + email
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Bạn đã yêu cầu đăng ký quá nhiều lần. Vui lòng thử lại sau 15 phút.",
  },
  keyGenerator: emailIpKeyGenerator,
});

const createPasswordOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Bạn đã yêu cầu mã xác thực quá nhiều lần. Vui lòng thử lại sau 15 phút.",
  },
  keyGenerator: userIdKeyGenerator,
});

// Tối đa 10 lần thử xác thực + tạo mật khẩu trong 10 phút cho mỗi user
const createPasswordLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Quá nhiều lần thử xác thực. Vui lòng thử lại sau ít phút.",
  },
  keyGenerator: userIdKeyGenerator,
});

const parentPinLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Quá nhiều yêu cầu liên quan đến mã PIN. Vui lòng thử lại sau ít phút.",
  },
  keyGenerator: userIdKeyGenerator,
});

// Tối đa 5 lần gửi form liên hệ trong 15 phút, tính theo IP + email
const ticketLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Bạn đã gửi yêu cầu liên hệ quá nhiều lần. Vui lòng thử lại sau 15 phút.",
  },
  keyGenerator: emailIpKeyGenerator,
});

// Định danh theo token trong URL (vd /kid-access/:token/...) thay vì IP -
// vì cả nhà dùng chung 1 mạng wifi, tính theo IP sẽ khiến các bé (mỗi bé 1
// token riêng) tranh nhau chung 1 hạn mức, và ảnh hưởng luôn tới việc mua
// sắm bình thường của phụ huynh trên cùng mạng.
const kidAccessTokenKeyGenerator = (req) => {
  const token = req.path.split("/")[1]; // req.path ở đây là phần sau "/kid-access"
  return token ? `kid-${token}` : ipKeyGenerator(req.ip);
};

// Các trang bé dùng (tủ sách, đọc sách, AR, Vườn Tri Thức) đều poll ngắn
// (~5s) để phát hiện phụ huynh khóa thiết bị gần như ngay lập tức, nên cần
// hạn mức riêng cao hơn nhiều so với rate limit chung của cả site - đồng
// thời được loại khỏi rate limit chung đó (xem app.js) để không đụng vào
// hạn mức mua sắm bình thường của phụ huynh.
const kidAccessLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 60, // dư dả cho vài trang cùng poll 5s + thao tác thường của bé
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Quá nhiều request, thử lại sau ít phút.",
  },
  keyGenerator: kidAccessTokenKeyGenerator,
});

module.exports = {
  forgotPasswordLimiter,
  verifyOtpLimiter,
  resetPasswordLimiter,
  loginLimiter,
  staffLoginLimiter,
  registerLimiter,
  createPasswordOtpLimiter,
  createPasswordLimiter,
  parentPinLimiter,
  ticketLimiter,
  kidAccessLimiter,
};
