const crypto = require("crypto");
const prisma = require("../config/db");

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function hashBody(body) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(body || {}))
    .digest("hex");
}

/**
 * @param {string} endpointName tên định danh endpoint (vd: "vnpay-create", "momo-create")
 *   — dùng để 1 Idempotency-Key không bị đụng giữa 2 endpoint khác nhau.
 */
const idempotency = (endpointName) => async (req, res, next) => {
  try {
    const key = req.headers["idempotency-key"];
    if (!key || typeof key !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu header Idempotency-Key" });
    }
    if (!req.user?.id) {
      // Middleware này luôn phải đứng sau `protect` — nếu chưa có user thì có gắn nhầm thứ tự route.
      return res
        .status(401)
        .json({ success: false, message: "Không có quyền truy cập" });
    }

    const requestHash = hashBody(req.body);
    const userId = req.user.id;

    const existing = await prisma.paymentIdempotency.findUnique({
      where: {
        userId_idempotencyKey_endpoint: {
          userId,
          idempotencyKey: key,
          endpoint: endpointName,
        },
      },
    });

    if (existing) {
      if (existing.expiresAt < new Date()) {
        // Hết hạn — dọn rồi coi như key mới, không chặn request hiện tại
        await prisma.paymentIdempotency
          .delete({ where: { id: existing.id } })
          .catch(() => {});
      } else if (existing.requestHash !== requestHash) {
        // Cùng key nhưng khác nội dung request — rất có thể là bug client hoặc key bị tái dùng nhầm
        return res.status(409).json({
          success: false,
          message: "Idempotency-Key đã được dùng cho một yêu cầu khác trước đó",
        });
      } else {
        return res.status(existing.statusCode).json(existing.responseBody);
      }
    }

    // Bọc res.json để lưu lại response NGAY SAU khi controller xử lý xong (thành công lẫn lỗi nghiệp vụ)
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      prisma.paymentIdempotency
        .create({
          data: {
            userId,
            idempotencyKey: key,
            endpoint: endpointName,
            requestHash,
            statusCode: res.statusCode,
            responseBody: body,
            expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
          },
        })
        .catch((err) => console.error("[idempotency] lưu response lỗi:", err));
      return originalJson(body);
    };

    next();
  } catch (error) {
    console.error("[idempotency]", error);
    // Lỗi ở lớp bảo vệ phụ này không nên chặn hẳn luồng thanh toán chính
    next();
  }
};

module.exports = idempotency;
