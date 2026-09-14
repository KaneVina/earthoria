const prisma = require("../config/db");
const { formatResponse } = require("../utils/helpers");
const {
  FAMILY_GATE_COOKIE_NAME,
  verifyFamilyGateToken,
} = require("../utils/familyGate");

const requireFamilyGate = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { parentPinHash: true },
    });

    if (!user?.parentPinHash) return next();

    const token = req.cookies?.[FAMILY_GATE_COOKIE_NAME];
    if (!verifyFamilyGateToken(token, req.user.id)) {
      // Cố tình dùng 403 (không phải 401): người dùng ĐÃ đăng nhập hợp lệ,
      // chỉ là chưa qua thêm lớp xác thực PIN - tránh bị interceptor
      // refresh-token ở client hiểu nhầm là access token hết hạn rồi thử
      // refresh + gọi lại vô ích.
      return formatResponse(
        res,
        403,
        "Vui lòng nhập mã PIN phụ huynh để tiếp tục.",
        { code: "FAMILY_GATE_REQUIRED" },
      );
    }

    next();
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

module.exports = { requireFamilyGate };
