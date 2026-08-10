const prisma = require("../config/db");

// Đơn "mồ côi": tạo bằng VNPay/MoMo nhưng chưa từng gọi create-payment-url nên
// paymentSessionExpiresAt vẫn NULL — vẫn giữ chỗ kho/coupon vô thời hạn nếu không xử lý.
// Coi như hết hạn sau ORPHAN_SESSION_TTL_MS kể từ lúc tạo đơn.
const ORPHAN_SESSION_TTL_MS = 30 * 60 * 1000; // 30 phút

// Số đơn xử lý tối đa mỗi lượt quét, tránh 1 lượt ôm quá nhiều nếu job bị dừng lâu rồi chạy lại.
const BATCH_SIZE = 200;

/**
 * Hoàn kho + hoàn lượt dùng coupon + đánh dấu EXPIRED cho 1 đơn cụ thể — dùng chung logic với
 * cancelOrder (orderController.js) nhưng chạy nguyên tử theo kiểu "update có điều kiện" giống
 * markOrderPaidAtomic: chỉ đơn nào VẪN đang UNPAID mới bị chuyển, chống race với IPN đến gần như
 * cùng lúc (IPN thắng thì đơn đã PAID, updateMany dưới đây sẽ khớp 0 dòng và không hoàn kho nhầm).
 */
async function expireOneOrder(order, reason) {
  return prisma.$transaction(async (tx) => {
    const result = await tx.order.updateMany({
      where: { id: order.id, paymentStatus: "UNPAID", status: "PENDING" },
      data: { paymentStatus: "EXPIRED", status: "CANCELLED" },
    });

    // Thua race (IPN vừa set PAID, hoặc đơn đã bị xử lý bởi 1 lượt quét khác) — không hoàn gì cả.
    if (result.count === 0) {
      return { expired: false };
    }

    for (const item of order.items) {
      if (item.variant.isUnlimitedStock) continue;
      await tx.bookVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity }, sold: { decrement: item.quantity } },
      });
    }

    if (order.couponCode) {
      await tx.coupon.updateMany({
        where: { code: order.couponCode, usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      });
    }

    await tx.paymentTransaction.create({
      data: {
        orderId: order.id,
        gateway: order.paymentMethod, // 'VNPAY' | 'MOMO' — trùng giá trị PaymentGateway
        type: "EXPIRE",
        paymentRef: order.paymentRef || "",
        amount: order.total,
        currency: "VND",
        isValidSignature: true,
        rawPayload: { reason },
        message:
          reason === "orphan"
            ? `Đơn chưa từng tạo phiên gateway (paymentSessionExpiresAt null), tự huỷ sau ${
                ORPHAN_SESSION_TTL_MS / 60000
              } phút kể từ khi tạo — hoàn kho/coupon`
            : `Phiên thanh toán hết hạn lúc ${order.paymentSessionExpiresAt.toISOString()} — hoàn kho/coupon`,
      },
    });

    return { expired: true };
  });
}

/**
 * Quét & tự động hết hạn các đơn VNPay/MoMo còn UNPAID mà phiên thanh toán đã qua hạn, hoặc
 * chưa từng mở phiên (orphan) quá lâu. Hoàn kho + hoàn lượt coupon cho từng đơn. An toàn khi
 * gọi lặp lại/chồng lấn vì mỗi đơn chỉ bị hoàn đúng 1 lần (update có điều kiện paymentStatus=UNPAID).
 *
 * @returns {{ scanned: number, expired: number, failed: number }}
 */
async function expireStalePaymentSessions() {
  const now = new Date();
  const orphanCutoff = new Date(now.getTime() - ORPHAN_SESSION_TTL_MS);

  const candidates = await prisma.order.findMany({
    where: {
      paymentMethod: { in: ["VNPAY", "MOMO"] },
      paymentStatus: "UNPAID",
      status: "PENDING",
      OR: [
        { paymentSessionExpiresAt: { lt: now } },
        { paymentSessionExpiresAt: null, createdAt: { lt: orphanCutoff } },
      ],
    },
    include: { items: { include: { variant: true } } },
    take: BATCH_SIZE,
  });

  let expired = 0;
  let failed = 0;

  for (const order of candidates) {
    try {
      const reason = order.paymentSessionExpiresAt ? "session_expired" : "orphan";
      const { expired: didExpire } = await expireOneOrder(order, reason);
      if (didExpire) expired += 1;
    } catch (err) {
      failed += 1;
      console.error(`[paymentExpiryService] Lỗi khi huỷ đơn ${order.id}:`, err);
    }
  }

  return { scanned: candidates.length, expired, failed };
}

let intervalHandle = null;
let isRunning = false;

/**
 * Bắt đầu quét định kỳ. Tự bỏ qua nếu lượt trước còn đang chạy (tránh chồng lấn khi DB chậm).
 * LƯU Ý: dùng setInterval trong-process — đủ cho 1 instance server. Nếu scale nhiều instance,
 * cần chuyển sang cron có lock phân tán (vd: advisory lock của Postgres, hoặc lock qua Redis đã
 * có sẵn trong dự án) để tránh N instance cùng quét/hoàn kho trùng nhau tại 1 thời điểm.
 */
function startPaymentExpiryJob({ intervalMs = 60 * 1000 } = {}) {
  if (intervalHandle) return intervalHandle;

  const tick = async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      const { scanned, expired, failed } = await expireStalePaymentSessions();
      if (scanned > 0) {
        console.log(
          `[paymentExpiryService] Quét ${scanned} đơn — huỷ ${expired}, lỗi ${failed}`
        );
      }
    } catch (err) {
      console.error("[paymentExpiryService] Lỗi lượt quét:", err);
    } finally {
      isRunning = false;
    }
  };

  intervalHandle = setInterval(tick, intervalMs);
  tick(); // chạy ngay lúc khởi động, không đợi hết interval đầu tiên
  return intervalHandle;
}

function stopPaymentExpiryJob() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

module.exports = {
  expireStalePaymentSessions,
  startPaymentExpiryJob,
  stopPaymentExpiryJob,
};