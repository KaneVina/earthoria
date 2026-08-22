const prisma = require("../config/db");
const { formatResponse } = require("../utils/helpers");
const { validateAndComputeDiscount } = require("../utils/couponUtil");

const validateCoupon = async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    const cleanCode = (code || "").trim().toUpperCase();
    const sub = Number(subtotal) || 0;

    if (!cleanCode) return formatResponse(res, 400, "Vui lòng nhập mã giảm giá");

    const coupon = await prisma.coupon.findUnique({ where: { code: cleanCode } });
    const result = validateAndComputeDiscount(coupon, sub);

    if (!result.ok) {
      return formatResponse(res, 400, result.reason || "Mã giảm giá không hợp lệ");
    }

    return formatResponse(res, 200, "Mã giảm giá hợp lệ", {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      maxDiscount: coupon.maxDiscount,
      minOrder: coupon.minOrder,
      discount: result.discount,
    });
  } catch (error) {
    console.error("[validateCoupon]", error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

const getAvailableCoupons = async (req, res) => {
  try {
    const now = new Date();

    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: "desc" },
    });

    const available = coupons.filter(
      (c) => c.usageLimit == null || c.usedCount < c.usageLimit
    );

    return formatResponse(res, 200, "Lấy danh sách ưu đãi thành công", available);
  } catch (error) {
    console.error("[getAvailableCoupons]", error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

module.exports = { validateCoupon, getAvailableCoupons };