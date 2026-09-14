const jwt = require("jsonwebtoken");

const FAMILY_GATE_COOKIE_NAME = "familyGateToken";
const FAMILY_GATE_TOKEN_TYPE = "family_gate";

const FAMILY_GATE_TTL_MINUTES =
  Number(process.env.FAMILY_GATE_TTL_MINUTES) > 0
    ? Number(process.env.FAMILY_GATE_TTL_MINUTES)
    : 20;

// Cho phép cấu hình secret riêng để không dùng chung khóa với access token
// đăng nhập (khuyến nghị đặt FAMILY_GATE_JWT_SECRET trong .env), nhưng vẫn
// chạy được ngay cả khi chưa kịp thêm biến môi trường mới.
const FAMILY_GATE_SECRET =
  process.env.FAMILY_GATE_JWT_SECRET || process.env.JWT_ACCESS_SECRET;

function signFamilyGateToken(userId) {
  return jwt.sign(
    { uid: userId, typ: FAMILY_GATE_TOKEN_TYPE },
    FAMILY_GATE_SECRET,
    {
      expiresIn: `${FAMILY_GATE_TTL_MINUTES}m`,
    },
  );
}

// Trả về true/false - không throw, để middleware/controller gọi thẳng
// trong một điều kiện if mà không cần try/catch riêng.
function verifyFamilyGateToken(token, userId) {
  if (!token || !userId) return false;
  try {
    const decoded = jwt.verify(token, FAMILY_GATE_SECRET);
    return decoded?.typ === FAMILY_GATE_TOKEN_TYPE && decoded.uid === userId;
  } catch {
    return false;
  }
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  };
}

// Gọi khi xác thực PIN thành công để "mở cổng" - phát cookie ngắn hạn.
function setFamilyGateCookie(res, userId) {
  const token = signFamilyGateToken(userId);
  res.cookie(FAMILY_GATE_COOKIE_NAME, token, {
    ...cookieOptions(),
    maxAge: FAMILY_GATE_TTL_MINUTES * 60 * 1000,
  });
}

// Gọi khi phụ huynh tự khoá lại (hoặc khi phiên bị nghi ngờ) - xoá cookie
// ngay, không cần đợi hết hạn tự nhiên.
function clearFamilyGateCookie(res) {
  res.clearCookie(FAMILY_GATE_COOKIE_NAME, cookieOptions());
}

module.exports = {
  FAMILY_GATE_COOKIE_NAME,
  FAMILY_GATE_TTL_MINUTES,
  signFamilyGateToken,
  verifyFamilyGateToken,
  setFamilyGateCookie,
  clearFamilyGateCookie,
};
