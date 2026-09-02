function isCouponUsable(coupon) {
  if (!coupon) return { ok: false, reason: "Mã giảm giá không tồn tại" };
  if (!coupon.isActive)
    return { ok: false, reason: "Mã giảm giá đã bị vô hiệu hóa" };
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
    return { ok: false, reason: "Mã giảm giá đã hết hạn" };
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, reason: "Mã giảm giá đã hết lượt sử dụng" };
  }
  return { ok: true };
}

/**
 * Kiểm tra coupon hợp lệ theo giá trị đơn hàng (subtotal) và tính số tiền được giảm.
 * @returns {{ ok: boolean, reason?: string, discount: number }}
 */
function validateAndComputeDiscount(coupon, subtotal) {
  const usable = isCouponUsable(coupon);
  if (!usable.ok) return { ok: false, reason: usable.reason, discount: 0 };

  if (subtotal < coupon.minOrder) {
    return {
      ok: false,
      reason: `Đơn hàng tối thiểu ${coupon.minOrder.toLocaleString("vi-VN")}₫ để dùng mã này`,
      discount: 0,
    };
  }

  let discount =
    coupon.type === "PERCENTAGE"
      ? Math.round((subtotal * coupon.value) / 100)
      : coupon.value;

  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, subtotal); // không cho giảm âm tổng đơn

  return { ok: true, discount };
}

module.exports = { isCouponUsable, validateAndComputeDiscount };
