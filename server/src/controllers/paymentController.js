const prisma = require("../config/db");
const { formatResponse } = require("../utils/helpers");
const vnpay = require("../utils/vnpayUtil");
const momo = require("../utils/momoUtil");
const { genPaymentRef } = require("./orderController");

// CLIENT_URL trong .env của dự án này đôi khi được set thành danh sách nhiều domain
// phân tách bởi dấu phẩy (dùng cho CORS ở chỗ khác) — ở đây chỉ cần 1 origin để build redirect URL.
const clientOrigin = () => (process.env.CLIENT_URL || "").split(",")[0].trim();

// Đơn phải thuộc về user hiện tại, đúng phương thức thanh toán online, và CHƯA thanh toán.
async function findPayableOrder({ orderId, userId, method }) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: [404, "Không tìm thấy đơn hàng"] };
  if (order.userId !== userId) return { error: [403, "Không có quyền với đơn hàng này"] };
  if (order.paymentMethod !== method)
    return { error: [400, `Đơn hàng này không dùng phương thức ${method}`] };
  if (order.paymentStatus === "PAID") return { error: [400, "Đơn hàng đã được thanh toán"] };
  if (!["PENDING", "CONFIRMED"].includes(order.status))
    return { error: [400, "Đơn hàng không còn ở trạng thái có thể thanh toán"] };
  return { order };
}

// Đánh dấu đơn đã thanh toán thành công — dùng chung cho verify (FE gọi) và IPN (gateway gọi).
async function markOrderPaid(order, gatewayTxnId) {
  return prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: "PAID",
      status: order.status === "PENDING" ? "CONFIRMED" : order.status,
      paidAt: new Date(),
      gatewayTxnId: gatewayTxnId || null,
    },
  });
}

/* ══════════════════════════ VNPAY ══════════════════════════ */

// POST /payments/vnpay/create-payment-url  { orderId }
const createVnpayPaymentUrl = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return formatResponse(res, 400, "Thiếu orderId");

    const { order, error } = await findPayableOrder({
      orderId,
      userId: req.user.id,
      method: "VNPAY",
    });
    if (error) return formatResponse(res, ...error);

    // Sinh paymentRef MỚI mỗi lần bấm thanh toán (kể cả thanh toán lại) vì VNPay không cho trùng TxnRef
    const paymentRef = genPaymentRef();
    await prisma.order.update({ where: { id: order.id }, data: { paymentRef } });

    const returnUrl = `${clientOrigin()}/payment/vnpay/return`;
    const paymentUrl = vnpay.createPaymentUrl({
      txnRef: paymentRef,
      amount: order.total,
      orderInfo: `Thanh toan don hang Earthoria ${order.id.slice(0, 8)}`,
      ipAddr: req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip,
      returnUrl,
    });

    return formatResponse(res, 200, "OK", { paymentUrl });
  } catch (error) {
    console.error("[createVnpayPaymentUrl]", error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// GET /payments/vnpay/verify?<toàn bộ query VNPay trả về>
// Frontend gọi endpoint này (có kèm Bearer token) ngay khi người dùng được VNPay redirect về trang /payment/vnpay/return
const verifyVnpayReturn = async (req, res) => {
  try {
    const query = req.query;
    const { isValid, isSuccess } = vnpay.verifyReturn(query);
    if (!isValid) return formatResponse(res, 400, "Chữ ký không hợp lệ");

    const order = await prisma.order.findFirst({
      where: { paymentRef: query.vnp_TxnRef, userId: req.user.id },
    });
    if (!order) return formatResponse(res, 404, "Không tìm thấy đơn hàng tương ứng");

    if (order.paymentStatus === "PAID") {
      return formatResponse(res, 200, "Đơn hàng đã được thanh toán trước đó", {
        orderId: order.id,
        success: true,
      });
    }

    if (isSuccess) {
      await markOrderPaid(order, query.vnp_TransactionNo);
      return formatResponse(res, 200, "Thanh toán thành công", {
        orderId: order.id,
        success: true,
      });
    }

    return formatResponse(res, 200, "Thanh toán không thành công", {
      orderId: order.id,
      success: false,
      responseCode: query.vnp_ResponseCode,
    });
  } catch (error) {
    console.error("[verifyVnpayReturn]", error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// GET /payments/vnpay/ipn — VNPay gọi server-to-server (không qua trình duyệt người dùng).
// Không dùng middleware `protect` vì đây là gateway gọi thẳng, không có access token của user.
// Phải trả JSON đúng format VNPay yêu cầu ({RspCode, Message}), không dùng formatResponse ở đây.
const vnpayIpn = async (req, res) => {
  try {
    const query = req.query;
    const { isValid, isSuccess } = vnpay.verifyReturn(query);
    if (!isValid) return res.json({ RspCode: "97", Message: "Invalid signature" });

    const order = await prisma.order.findFirst({ where: { paymentRef: query.vnp_TxnRef } });
    if (!order) return res.json({ RspCode: "01", Message: "Order not found" });

    const expectedAmount = Math.round(order.total * 100);
    if (Number(query.vnp_Amount) !== expectedAmount) {
      return res.json({ RspCode: "04", Message: "Invalid amount" });
    }
    if (order.paymentStatus === "PAID") {
      return res.json({ RspCode: "02", Message: "Order already confirmed" });
    }

    if (isSuccess) {
      await markOrderPaid(order, query.vnp_TransactionNo);
    }
    return res.json({ RspCode: "00", Message: "Confirm Success" });
  } catch (error) {
    console.error("[vnpayIpn]", error);
    return res.json({ RspCode: "99", Message: "Unknown error" });
  }
};

/* ══════════════════════════ MOMO ══════════════════════════ */

// POST /payments/momo/create-payment-url  { orderId }
const createMomoPaymentUrl = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return formatResponse(res, 400, "Thiếu orderId");

    const { order, error } = await findPayableOrder({
      orderId,
      userId: req.user.id,
      method: "MOMO",
    });
    if (error) return formatResponse(res, ...error);

    const paymentRef = genPaymentRef();
    await prisma.order.update({ where: { id: order.id }, data: { paymentRef } });

    const serverBaseUrl = process.env.SERVER_URL || `${req.protocol}://${req.get("host")}`;

    const momoRes = await momo.createPaymentRequest({
      orderId: paymentRef,
      amount: order.total,
      orderInfo: `Thanh toan don hang Earthoria ${order.id.slice(0, 8)}`,
      redirectUrl: `${clientOrigin()}/payment/momo/return`,
      ipnUrl: `${serverBaseUrl}/api/v1/payments/momo/ipn`,
    });

    if (!momoRes.payUrl) {
      console.error("[createMomoPaymentUrl] MoMo error response:", momoRes);
      return formatResponse(res, 502, momoRes.message || "Không tạo được giao dịch MoMo");
    }

    return formatResponse(res, 200, "OK", { paymentUrl: momoRes.payUrl });
  } catch (error) {
    console.error("[createMomoPaymentUrl]", error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// GET /payments/momo/verify?<toàn bộ query MoMo trả về> — frontend gọi khi user được redirect về /payment/momo/return
const verifyMomoReturn = async (req, res) => {
  try {
    const query = req.query;
    const { isValid, isSuccess } = momo.verifyReturn(query);
    if (!isValid) return formatResponse(res, 400, "Chữ ký không hợp lệ");

    const order = await prisma.order.findFirst({
      where: { paymentRef: query.orderId, userId: req.user.id },
    });
    if (!order) return formatResponse(res, 404, "Không tìm thấy đơn hàng tương ứng");

    if (order.paymentStatus === "PAID") {
      return formatResponse(res, 200, "Đơn hàng đã được thanh toán trước đó", {
        orderId: order.id,
        success: true,
      });
    }

    if (isSuccess) {
      await markOrderPaid(order, query.transId);
      return formatResponse(res, 200, "Thanh toán thành công", {
        orderId: order.id,
        success: true,
      });
    }

    return formatResponse(res, 200, "Thanh toán không thành công", {
      orderId: order.id,
      success: false,
      message: query.message,
    });
  } catch (error) {
    console.error("[verifyMomoReturn]", error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// POST /payments/momo/ipn — MoMo gọi server-to-server. Không dùng `protect`.
// MoMo yêu cầu HTTP 204 hoặc 200 khi nhận thành công, không cần trả body đặc biệt như VNPay.
const momoIpn = async (req, res) => {
  try {
    const query = req.body;
    const { isValid, isSuccess } = momo.verifyReturn(query);
    if (!isValid) return res.status(400).json({ message: "Invalid signature" });

    const order = await prisma.order.findFirst({ where: { paymentRef: query.orderId } });
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (isSuccess && order.paymentStatus !== "PAID") {
      await markOrderPaid(order, query.transId);
    }
    return res.status(200).json({ message: "Received" });
  } catch (error) {
    console.error("[momoIpn]", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createVnpayPaymentUrl,
  verifyVnpayReturn,
  vnpayIpn,
  createMomoPaymentUrl,
  verifyMomoReturn,
  momoIpn,
};