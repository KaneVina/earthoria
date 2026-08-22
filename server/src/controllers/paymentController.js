const prisma = require("../config/db");
const { formatResponse } = require("../utils/helpers");
const vnpay = require("../utils/vnpayUtil");
const momo = require("../utils/momoUtil");
const bankqr = require("../utils/bankqrUtil");
const { genPaymentRef, getOrderCode } = require("./orderController");

// Đơn vị tiền tệ duy nhất của hệ thống hiện tại — dùng để đối chiếu với field currency mà vnpayUtil/momoUtil trả về (2 cổng đều chỉ hỗ trợ VND, không có field currency thật trong callback).
const ORDER_CURRENCY = "VND";

// Thời hạn hiệu lực của 1 phiên thanh toán (paymentRef) kể từ lúc tạo payment URL. Sau mốc này, kể cả callback có chữ ký hợp lệ cũng KHÔNG được dùng để đánh dấu đơn đã thanh toán.
const PAYMENT_SESSION_TTL_MS = 15 * 60 * 1000; // 15 phút

// Khi FE gọi verify ngay sau khi được gateway redirect về mà gateway báo "thành công", IPN (nguồn xác nhận chính thức) có thể chưa kịp tới do độ trễ mạng — đợi ngắn, đọc lại DB vài lần trước khi trả "pending".
const WAIT_FOR_IPN_TRIES = 6;
const WAIT_FOR_IPN_INTERVAL_MS = 500;

const clientOrigin = (req) => {
  const allowed = (process.env.CLIENT_URL || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const reqOrigin = req?.headers?.origin;
  if (reqOrigin && allowed.includes(reqOrigin)) return reqOrigin;
  return allowed[0] || "";
};

const getIp = (req) =>
  req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;

// Đơn phải thuộc về user hiện tại, đúng phương thức thanh toán online, và CHƯA thanh toán.
async function findPayableOrder({ orderId, userId, method }) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: [404, "Không tìm thấy đơn hàng"] };
  if (order.userId !== userId)
    return { error: [403, "Không có quyền với đơn hàng này"] };
  if (order.paymentMethod !== method)
    return { error: [400, `Đơn hàng này không dùng phương thức ${method}`] };
  if (order.paymentStatus === "PAID")
    return { error: [400, "Đơn hàng đã được thanh toán"] };
  if (!["PENDING", "CONFIRMED"].includes(order.status))
    return {
      error: [400, "Đơn hàng không còn ở trạng thái có thể thanh toán"],
    };
  return { order };
}

// Ghi lại MỌI callback/lần tạo phiên thanh toán — kể cả những lần không hợp lệ (sai chữ ký, sai
// TmnCode/partnerCode, sai số tiền...) để phục vụ đối soát và điều tra khi có tranh chấp/nghi giả mạo.
// Lỗi ghi log KHÔNG được làm hỏng luồng thanh toán chính nên luôn tự bắt lỗi ở đây.
async function logTransaction(data) {
  try {
    await prisma.paymentTransaction.create({ data });
  } catch (err) {
    console.error("[logTransaction]", err);
  }
}

// Chuyển trạng thái đơn UNPAID -> PAID một cách NGUYÊN TỬ bằng update có điều kiện
// (UPDATE ... WHERE paymentStatus != 'PAID'), chống race condition khi IPN và request verify của FE
// (hoặc 2 lần gọi IPN trùng lặp từ gateway) đến gần như đồng thời — chỉ đúng 1 request thắng cuộc đua,
// các request còn lại tự nhận biết qua { alreadyPaid: true } mà không update chồng lên nhau.
async function markOrderPaidAtomic(orderId, gatewayTxnId) {
  return prisma.$transaction(async (tx) => {
    const result = await tx.order.updateMany({
      where: { id: orderId, paymentStatus: { not: "PAID" } },
      data: {
        paymentStatus: "PAID",
        paidAt: new Date(),
        gatewayTxnId: gatewayTxnId || null,
      },
    });

    if (result.count === 0) {
      return { alreadyPaid: true };
    }

    // Bước riêng vì updateMany ở trên không lọc theo status cũ (PENDING) để không bỏ sót đơn CONFIRMED.
    // Đơn toàn sách điện tử (isDigital) không có bước giao hàng — thanh toán xong là chuyển thẳng
    // COMPLETED; đơn sách giấy vẫn đi CONFIRMED -> ... -> DELIVERED như cũ.
    const current = await tx.order.findUnique({
      where: { id: orderId },
      select: { status: true, isDigital: true },
    });
    if (current?.status === "PENDING") {
      await tx.order.update({
        where: { id: orderId },
        data: { status: current.isDigital ? "COMPLETED" : "CONFIRMED" },
      });
    }

    return { alreadyPaid: false };
  });
}

// Đợi ngắn cho IPN (nguồn xác nhận chính) kịp xử lý, dùng ở endpoint verify (FE gọi) khi gateway báo
// thành công nhưng DB tại thời điểm gọi vẫn chưa PAID.
async function waitForOrderPaid(orderId) {
  for (let i = 0; i < WAIT_FOR_IPN_TRIES; i++) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (order?.paymentStatus === "PAID") return order;
    await new Promise((r) => setTimeout(r, WAIT_FOR_IPN_INTERVAL_MS));
  }
  return prisma.order.findUnique({ where: { id: orderId } });
}

function isSessionExpired(expiresAt) {
  return !!expiresAt && expiresAt < new Date();
}

// Order.paymentRef là 1 cột DUY NHẤT, bị GHI ĐÈ mỗi lần user bấm "thanh toán lại" (tạo phiên mới).
// Nếu user hoàn tất thanh toán ở 1 tab/phiên CŨ sau khi đã tạo phiên mới hơn, callback (return hoặc
// IPN) mang paymentRef CŨ sẽ không còn khớp Order.paymentRef hiện tại nữa → tra thẳng theo cột sẽ ra
// null, đơn không bao giờ được xác nhận dù tiền đã bị trừ thật.
// PaymentTransaction thì KHÔNG bị ghi đè (mỗi lần tạo phiên là 1 dòng CREATE riêng, lưu orderId) nên
// fallback qua đây để tìm lại đúng đơn. Đồng thời trả về đúng hạn (TTL) của PHIÊN đó — không dùng
// order.paymentSessionExpiresAt hiện tại vì cột đó lúc này đang phản ánh phiên MỚI hơn, không phải
// phiên mà callback này thuộc về.
async function findOrderByPaymentRef(paymentRef, gateway) {
  if (!paymentRef) return { order: null, sessionExpiresAt: null };

  const direct = await prisma.order.findFirst({ where: { paymentRef } });
  if (direct)
    return { order: direct, sessionExpiresAt: direct.paymentSessionExpiresAt };

  const txn = await prisma.paymentTransaction.findFirst({
    where: { paymentRef, gateway, type: "CREATE" },
    orderBy: { createdAt: "desc" },
  });
  if (!txn?.orderId) return { order: null, sessionExpiresAt: null };

  const order = await prisma.order.findUnique({ where: { id: txn.orderId } });
  const sessionExpiresAt = new Date(
    txn.createdAt.getTime() + PAYMENT_SESSION_TTL_MS,
  );
  return { order, sessionExpiresAt };
}

function vnpayAmountMatches(order, vnpAmount) {
  const expected = Math.round(order.total * 100);
  return Number(vnpAmount) === expected;
}

function momoAmountMatches(order, amount) {
  return Math.round(Number(amount)) === Math.round(order.total);
}

function bankqrAmountMatches(order, amount) {
  return Math.round(Number(amount)) === Math.round(order.total);
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
    const paymentSessionExpiresAt = new Date(
      Date.now() + PAYMENT_SESSION_TTL_MS,
    );
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentRef, paymentSessionExpiresAt },
    });

    const returnUrl = `${clientOrigin(req)}/payment/vnpay/return`;
    const ip = getIp(req);
    const paymentUrl = vnpay.createPaymentUrl({
      txnRef: paymentRef,
      amount: order.total,
      orderInfo: `Thanh toan don hang Earthoria ${getOrderCode(order)}`,
      ipAddr: ip,
      returnUrl,
    });

    await logTransaction({
      orderId: order.id,
      gateway: "VNPAY",
      type: "CREATE",
      paymentRef,
      amount: order.total,
      currency: ORDER_CURRENCY,
      isValidSignature: true,
      rawPayload: { orderId: order.id, amount: order.total, returnUrl },
      ip,
      message: `Tạo phiên thanh toán mới, hết hạn lúc ${paymentSessionExpiresAt.toISOString()}`,
    });

    return formatResponse(res, 200, "OK", {
      paymentUrl,
      expiresAt: paymentSessionExpiresAt,
    });
  } catch (error) {
    console.error("[createVnpayPaymentUrl]", error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// GET /payments/vnpay/verify?<toàn bộ query VNPay trả về>
// Frontend gọi endpoint này (có kèm Bearer token) ngay khi người dùng được VNPay redirect về trang
// /payment/vnpay/return. Endpoint này CHỈ ĐỌC & HIỂN THỊ kết quả — trạng thái PAID của đơn chỉ được
// ghi nhận chính thức bởi `vnpayIpn` (server-to-server). Lý do: callback qua trình duyệt người dùng
// kém tin cậy hơn IPN (có thể bị đóng tab giữa chừng, replay, hoặc — dù ký đúng — không đảm bảo gateway
// đã thực sự đối soát xong ở phía họ), nên không dùng nó để tự ý set PAID.
const verifyVnpayReturn = async (req, res) => {
  const query = req.query;
  try {
    const { isValid, isSuccess, signatureValid, tmnCodeValid, currency } =
      vnpay.verifyReturn(query);

    let { order, sessionExpiresAt } = await findOrderByPaymentRef(
      query.vnp_TxnRef,
      "VNPAY",
    );
    // Chặn user A xem/verify được đơn của user B qua paymentRef — coi như không tìm thấy.
    if (order && order.userId !== req.user.id) {
      order = null;
      sessionExpiresAt = null;
    }

    await logTransaction({
      orderId: order?.id || null,
      gateway: "VNPAY",
      type: "RETURN",
      paymentRef: query.vnp_TxnRef || "",
      amount: query.vnp_Amount ? Number(query.vnp_Amount) / 100 : null,
      currency,
      gatewayTxnId: query.vnp_TransactionNo || null,
      resultCode: query.vnp_ResponseCode || null,
      isValidSignature: !!signatureValid,
      rawPayload: query,
      ip: getIp(req),
      message: !signatureValid
        ? "Chữ ký không hợp lệ"
        : !tmnCodeValid
          ? "TmnCode không khớp — nghi callback giả mạo"
          : "FE gọi verify sau khi được redirect về",
    });

    if (!isValid) return formatResponse(res, 400, "Chữ ký không hợp lệ");
    if (!order)
      return formatResponse(res, 404, "Không tìm thấy đơn hàng tương ứng");

    if (
      !vnpayAmountMatches(order, query.vnp_Amount) ||
      currency !== ORDER_CURRENCY
    ) {
      return formatResponse(
        res,
        200,
        "Thông tin giao dịch không khớp với đơn hàng",
        {
          orderId: order.id,
          success: false,
          pending: false,
        },
      );
    }

    if (order.paymentStatus === "PAID") {
      return formatResponse(res, 200, "Đơn hàng đã được thanh toán", {
        orderId: order.id,
        success: true,
        pending: false,
      });
    }

    if (isSessionExpired(sessionExpiresAt)) {
      return formatResponse(res, 200, "Phiên thanh toán đã hết hạn", {
        orderId: order.id,
        success: false,
        pending: false,
      });
    }

    if (isSuccess) {
      // Gateway báo thành công nhưng IPN có thể chưa kịp tới — đợi ngắn rồi đọc lại trạng thái thật.
      const finalOrder = await waitForOrderPaid(order.id);
      if (finalOrder?.paymentStatus === "PAID") {
        return formatResponse(res, 200, "Thanh toán thành công", {
          orderId: order.id,
          success: true,
          pending: false,
        });
      }
      return formatResponse(res, 200, "Đang chờ xác nhận từ cổng thanh toán", {
        orderId: order.id,
        success: false,
        pending: true,
      });
    }

    return formatResponse(res, 200, "Thanh toán không thành công", {
      orderId: order.id,
      success: false,
      pending: false,
      responseCode: query.vnp_ResponseCode,
    });
  } catch (error) {
    console.error("[verifyVnpayReturn]", error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// GET /payments/vnpay/ipn — VNPay gọi server-to-server (không qua trình duyệt người dùng).
// Đây là NGUỒN XÁC NHẬN CHÍNH THỨC DUY NHẤT để chuyển đơn sang PAID.
// Không dùng middleware `protect` vì đây là gateway gọi thẳng, không có access token của user.
// Phải trả JSON đúng format VNPay yêu cầu ({RspCode, Message}), không dùng formatResponse ở đây.
const vnpayIpn = async (req, res) => {
  const query = req.query;
  const ip = getIp(req);
  try {
    const { isValid, isSuccess, signatureValid, tmnCodeValid, currency } =
      vnpay.verifyReturn(query);
    const { order, sessionExpiresAt } = await findOrderByPaymentRef(
      query.vnp_TxnRef,
      "VNPAY",
    );

    const baseLog = {
      orderId: order?.id || null,
      gateway: "VNPAY",
      type: "IPN",
      paymentRef: query.vnp_TxnRef || "",
      amount: query.vnp_Amount ? Number(query.vnp_Amount) / 100 : null,
      currency,
      gatewayTxnId: query.vnp_TransactionNo || null,
      resultCode: query.vnp_ResponseCode || null,
      isValidSignature: !!signatureValid,
      rawPayload: query,
      ip,
    };

    if (!signatureValid) {
      await logTransaction({ ...baseLog, message: "Chữ ký không hợp lệ" });
      return res.json({ RspCode: "97", Message: "Invalid signature" });
    }
    if (!tmnCodeValid) {
      await logTransaction({
        ...baseLog,
        message: "TmnCode không khớp — nghi callback giả mạo",
      });
      return res.json({ RspCode: "97", Message: "Invalid signature" });
    }
    if (!order) {
      await logTransaction({
        ...baseLog,
        message: "Không tìm thấy đơn hàng tương ứng paymentRef",
      });
      return res.json({ RspCode: "01", Message: "Order not found" });
    }

    if (isSessionExpired(sessionExpiresAt)) {
      await logTransaction({
        ...baseLog,
        message: "Phiên thanh toán đã hết hạn, từ chối xác nhận",
      });
      return res.json({
        RspCode: "01",
        Message: "Order not found or session expired",
      });
    }

    if (!vnpayAmountMatches(order, query.vnp_Amount)) {
      await logTransaction({
        ...baseLog,
        message: `Sai số tiền: gateway=${query.vnp_Amount}, expected=${Math.round(order.total * 100)}`,
      });
      return res.json({ RspCode: "04", Message: "Invalid amount" });
    }
    if (currency !== ORDER_CURRENCY) {
      await logTransaction({
        ...baseLog,
        message: `Sai đơn vị tiền tệ: ${currency}`,
      });
      return res.json({ RspCode: "04", Message: "Invalid amount" });
    }

    if (order.paymentStatus === "PAID") {
      await logTransaction({
        ...baseLog,
        message: "Đơn đã được xác nhận trước đó (IPN gọi lặp lại)",
      });
      return res.json({ RspCode: "02", Message: "Order already confirmed" });
    }

    if (isSuccess) {
      const { alreadyPaid } = await markOrderPaidAtomic(
        order.id,
        query.vnp_TransactionNo,
      );
      await logTransaction({
        ...baseLog,
        message: alreadyPaid
          ? "Đơn đã được đánh dấu PAID bởi 1 request khác cùng lúc (race condition đã được chặn)"
          : "Xác nhận thanh toán thành công",
      });
      return res.json({ RspCode: "00", Message: "Confirm Success" });
    }

    await logTransaction({
      ...baseLog,
      message: "Gateway báo giao dịch không thành công",
    });
    // RspCode 00 = đã NHẬN và xử lý callback hợp lệ (dù kết quả giao dịch là fail) — đúng theo tài liệu VNPay.
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
    const paymentSessionExpiresAt = new Date(
      Date.now() + PAYMENT_SESSION_TTL_MS,
    );
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentRef, paymentSessionExpiresAt },
    });

    const serverBaseUrl =
      process.env.SERVER_URL || `${req.protocol}://${req.get("host")}`;
    const ip = getIp(req);

    const momoRes = await momo.createPaymentRequest({
      orderId: paymentRef,
      amount: order.total,
      orderInfo: `Thanh toan don hang Earthoria ${getOrderCode(order)}`,
      redirectUrl: `${clientOrigin(req)}/payment/momo/return`,
      ipnUrl: `${serverBaseUrl}/api/v1/payments/momo/ipn`,
    });

    if (!momoRes.payUrl) {
      console.error("[createMomoPaymentUrl] MoMo error response:", momoRes);
      await logTransaction({
        orderId: order.id,
        gateway: "MOMO",
        type: "CREATE",
        paymentRef,
        amount: order.total,
        currency: ORDER_CURRENCY,
        isValidSignature: true,
        rawPayload: momoRes,
        ip,
        message: `Tạo phiên thanh toán MoMo thất bại: ${momoRes.message || "không rõ lý do"}`,
      });
      return formatResponse(
        res,
        502,
        momoRes.message || "Không tạo được giao dịch MoMo",
      );
    }

    await logTransaction({
      orderId: order.id,
      gateway: "MOMO",
      type: "CREATE",
      paymentRef,
      amount: order.total,
      currency: ORDER_CURRENCY,
      isValidSignature: true,
      rawPayload: { orderId: order.id, amount: order.total },
      ip,
      message: `Tạo phiên thanh toán mới, hết hạn lúc ${paymentSessionExpiresAt.toISOString()}`,
    });

    return formatResponse(res, 200, "OK", {
      paymentUrl: momoRes.payUrl,
      expiresAt: paymentSessionExpiresAt,
    });
  } catch (error) {
    console.error("[createMomoPaymentUrl]", error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// GET /payments/momo/verify?<toàn bộ query MoMo trả về> — frontend gọi khi user được redirect về
// /payment/momo/return. CHỈ ĐỌC & HIỂN THỊ, không tự set PAID — xem giải thích ở verifyVnpayReturn.
const verifyMomoReturn = async (req, res) => {
  const query = req.query;
  try {
    const { isValid, isSuccess, signatureValid, partnerCodeValid, currency } =
      momo.verifyReturn(query);

    let { order, sessionExpiresAt } = await findOrderByPaymentRef(
      query.orderId,
      "MOMO",
    );
    if (order && order.userId !== req.user.id) {
      order = null;
      sessionExpiresAt = null;
    }

    await logTransaction({
      orderId: order?.id || null,
      gateway: "MOMO",
      type: "RETURN",
      paymentRef: query.orderId || "",
      amount: query.amount ? Number(query.amount) : null,
      currency,
      gatewayTxnId: query.transId || null,
      resultCode: query.resultCode != null ? String(query.resultCode) : null,
      isValidSignature: !!signatureValid,
      rawPayload: query,
      ip: getIp(req),
      message: !signatureValid
        ? "Chữ ký không hợp lệ"
        : !partnerCodeValid
          ? "partnerCode không khớp — nghi callback giả mạo"
          : "FE gọi verify sau khi được redirect về",
    });

    if (!isValid) return formatResponse(res, 400, "Chữ ký không hợp lệ");
    if (!order)
      return formatResponse(res, 404, "Không tìm thấy đơn hàng tương ứng");

    if (
      !momoAmountMatches(order, query.amount) ||
      currency !== ORDER_CURRENCY
    ) {
      return formatResponse(
        res,
        200,
        "Thông tin giao dịch không khớp với đơn hàng",
        {
          orderId: order.id,
          success: false,
          pending: false,
        },
      );
    }

    if (order.paymentStatus === "PAID") {
      return formatResponse(res, 200, "Đơn hàng đã được thanh toán", {
        orderId: order.id,
        success: true,
        pending: false,
      });
    }

    if (isSessionExpired(sessionExpiresAt)) {
      return formatResponse(res, 200, "Phiên thanh toán đã hết hạn", {
        orderId: order.id,
        success: false,
        pending: false,
      });
    }

    if (isSuccess) {
      const finalOrder = await waitForOrderPaid(order.id);
      if (finalOrder?.paymentStatus === "PAID") {
        return formatResponse(res, 200, "Thanh toán thành công", {
          orderId: order.id,
          success: true,
          pending: false,
        });
      }
      return formatResponse(res, 200, "Đang chờ xác nhận từ cổng thanh toán", {
        orderId: order.id,
        success: false,
        pending: true,
      });
    }

    return formatResponse(res, 200, "Thanh toán không thành công", {
      orderId: order.id,
      success: false,
      pending: false,
      message: query.message,
    });
  } catch (error) {
    console.error("[verifyMomoReturn]", error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// POST /payments/momo/ipn — MoMo gọi server-to-server. Không dùng `protect`.
// NGUỒN XÁC NHẬN CHÍNH THỨC DUY NHẤT để chuyển đơn sang PAID.
// MoMo yêu cầu HTTP 204 hoặc 200 khi nhận thành công, không cần trả body đặc biệt như VNPay.
const momoIpn = async (req, res) => {
  const query = req.body;
  const ip = getIp(req);
  try {
    const { isValid, isSuccess, signatureValid, partnerCodeValid, currency } =
      momo.verifyReturn(query);
    const { order, sessionExpiresAt } = await findOrderByPaymentRef(
      query.orderId,
      "MOMO",
    );

    const baseLog = {
      orderId: order?.id || null,
      gateway: "MOMO",
      type: "IPN",
      paymentRef: query.orderId || "",
      amount: query.amount ? Number(query.amount) : null,
      currency,
      gatewayTxnId: query.transId || null,
      resultCode: query.resultCode != null ? String(query.resultCode) : null,
      isValidSignature: !!signatureValid,
      rawPayload: query,
      ip,
    };

    if (!signatureValid) {
      await logTransaction({ ...baseLog, message: "Chữ ký không hợp lệ" });
      return res.status(400).json({ message: "Invalid signature" });
    }
    if (!partnerCodeValid) {
      await logTransaction({
        ...baseLog,
        message: "partnerCode không khớp — nghi callback giả mạo",
      });
      return res.status(400).json({ message: "Invalid signature" });
    }
    if (!order) {
      await logTransaction({
        ...baseLog,
        message: "Không tìm thấy đơn hàng tương ứng paymentRef",
      });
      return res.status(404).json({ message: "Order not found" });
    }

    if (isSessionExpired(sessionExpiresAt)) {
      await logTransaction({
        ...baseLog,
        message: "Phiên thanh toán đã hết hạn, từ chối xác nhận",
      });
      return res
        .status(200)
        .json({ message: "Session expired, not confirmed" });
    }

    if (!momoAmountMatches(order, query.amount)) {
      await logTransaction({
        ...baseLog,
        message: `Sai số tiền: gateway=${query.amount}, expected=${order.total}`,
      });
      return res.status(400).json({ message: "Invalid amount" });
    }
    if (currency !== ORDER_CURRENCY) {
      await logTransaction({
        ...baseLog,
        message: `Sai đơn vị tiền tệ: ${currency}`,
      });
      return res.status(400).json({ message: "Invalid currency" });
    }

    if (order.paymentStatus === "PAID") {
      await logTransaction({
        ...baseLog,
        message: "Đơn đã được xác nhận trước đó (IPN gọi lặp lại)",
      });
      return res.status(200).json({ message: "Already confirmed" });
    }

    if (isSuccess) {
      const { alreadyPaid } = await markOrderPaidAtomic(
        order.id,
        query.transId,
      );
      await logTransaction({
        ...baseLog,
        message: alreadyPaid
          ? "Đơn đã được đánh dấu PAID bởi 1 request khác cùng lúc (race condition đã được chặn)"
          : "Xác nhận thanh toán thành công",
      });
      return res.status(200).json({ message: "Received" });
    }

    await logTransaction({
      ...baseLog,
      message: "Gateway báo giao dịch không thành công",
    });
    return res.status(200).json({ message: "Received" });
  } catch (error) {
    console.error("[momoIpn]", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ══════════════════════════ BANKQR (chuyển khoản ngân hàng qua SePay) ══════════════════════════ */

// POST /payments/bankqr/create  { orderId }
// Khác VNPay/MoMo: không có "payment URL" để redirect — trả về ảnh QR + thông tin chuyển khoản để
// FE hiển thị ngay tại trang Checkout, người dùng quét bằng app ngân hàng bất kỳ (không cần app cụ thể).
const createBankQrPayment = async (req, res) => {
  try {
    if (!bankqr.isConfigured()) {
      console.error(
        "[createBankQrPayment] Thiếu BANKQR_ACCOUNT_NO / BANKQR_ACCOUNT_NAME trong .env",
      );
      return formatResponse(
        res,
        503,
        "Phương thức chuyển khoản QR hiện chưa khả dụng, vui lòng chọn phương thức khác",
      );
    }

    const { orderId } = req.body;
    if (!orderId) return formatResponse(res, 400, "Thiếu orderId");

    const { order, error } = await findPayableOrder({
      orderId,
      userId: req.user.id,
      method: "BANKQR",
    });
    if (error) return formatResponse(res, ...error);

    const paymentRef = genPaymentRef();
    const paymentSessionExpiresAt = new Date(
      Date.now() + PAYMENT_SESSION_TTL_MS,
    );
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentRef, paymentSessionExpiresAt },
    });

    const addInfo = paymentRef;
    const qrImageUrl = bankqr.buildQrImageUrl({ amount: order.total, addInfo });

    await logTransaction({
      orderId: order.id,
      gateway: "BANKQR",
      type: "CREATE",
      paymentRef,
      amount: order.total,
      currency: ORDER_CURRENCY,
      isValidSignature: true,
      rawPayload: { orderId: order.id, amount: order.total, addInfo },
      ip: getIp(req),
      message: `Tạo phiên chuyển khoản QR, hết hạn lúc ${paymentSessionExpiresAt.toISOString()}`,
    });

    return formatResponse(res, 200, "OK", {
      qrImageUrl,
      bankCode: bankqr.BANK_CODE,
      accountNo: bankqr.ACCOUNT_NO,
      accountName: bankqr.ACCOUNT_NAME,
      amount: order.total,
      addInfo,
      expiresAt: paymentSessionExpiresAt,
    });
  } catch (error) {
    console.error("[createBankQrPayment]", error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// GET /payments/bankqr/status/:orderId — FE polling định kỳ trong lúc hiển thị QR chờ chuyển khoản.
// CHỈ ĐỌC — nguồn xác nhận chính thức duy nhất vẫn là bankqrWebhook.
const getBankQrStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order || order.userId !== req.user.id) {
      return formatResponse(res, 404, "Không tìm thấy đơn hàng");
    }

    if (order.paymentStatus === "PAID") {
      return formatResponse(res, 200, "Đơn hàng đã được thanh toán", {
        orderId: order.id,
        success: true,
        pending: false,
      });
    }

    if (isSessionExpired(order.paymentSessionExpiresAt)) {
      return formatResponse(res, 200, "Phiên chuyển khoản đã hết hạn", {
        orderId: order.id,
        success: false,
        pending: false,
        expired: true,
      });
    }

    if (order.paymentRef) {
      const mismatchTxn = await prisma.paymentTransaction.findFirst({
        where: {
          orderId: order.id,
          gateway: "BANKQR",
          type: "IPN",
          paymentRef: order.paymentRef,
          message: { startsWith: "Sai số tiền" },
        },
        orderBy: { createdAt: "desc" },
      });
      if (mismatchTxn) {
        return formatResponse(res, 200, "Số tiền chuyển khoản không khớp đơn hàng", {
          orderId: order.id,
          success: false,
          pending: false,
          mismatch: true,
          transferredAmount: mismatchTxn.amount,
          expectedAmount: order.total,
        });
      }
    }

    return formatResponse(res, 200, "Đang chờ chuyển khoản", {
      orderId: order.id,
      success: false,
      pending: true,
    });
  } catch (error) {
    console.error("[getBankQrStatus]", error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// POST /payments/bankqr/webhook — SePay gọi server-to-server khi tài khoản ngân hàng nhận tiền.
// Không dùng `protect`, xác thực bằng API Key trong header Authorization.
// NGUỒN XÁC NHẬN CHÍNH THỨC DUY NHẤT để chuyển đơn BANKQR sang PAID.
const bankqrWebhook = async (req, res) => {
  const body = req.body;
  const ip = getIp(req);
  try {
    const authHeader = req.headers["authorization"];
    const authValid = bankqr.verifyWebhookAuth(authHeader);

    const parsed = bankqr.parseWebhookPayload(body);
    const { order, sessionExpiresAt } = await findOrderByPaymentRef(
      parsed.paymentRef,
      "BANKQR",
    );

    const baseLog = {
      orderId: order?.id || null,
      gateway: "BANKQR",
      type: "IPN",
      paymentRef: parsed.paymentRef || "",
      amount: parsed.amount,
      currency: ORDER_CURRENCY,
      gatewayTxnId: parsed.gatewayTxnId,
      resultCode: null,
      isValidSignature: authValid,
      rawPayload: body,
      ip,
    };

    if (!authValid) {
      await logTransaction({
        ...baseLog,
        message: "Sai/thiếu API Key xác thực webhook — nghi giả mạo",
      });
      return res
        .status(401)
        .json({ success: false, message: "Invalid webhook auth" });
    }

    if (!parsed.isIncoming) {
      await logTransaction({
        ...baseLog,
        message: "Bỏ qua giao dịch tiền ra (transferType != in)",
      });
      return res
        .status(200)
        .json({ success: true, message: "Ignored (outgoing transaction)" });
    }

    if (!parsed.paymentRef) {
      await logTransaction({
        ...baseLog,
        message: `Không tìm thấy mã đơn hàng (paymentRef) trong nội dung chuyển khoản: "${parsed.rawContent}"`,
      });
      return res
        .status(200)
        .json({ success: true, message: "No matching paymentRef, ignored" });
    }

    if (!order) {
      await logTransaction({
        ...baseLog,
        message: "Không tìm thấy đơn hàng tương ứng paymentRef",
      });
      return res
        .status(200)
        .json({ success: true, message: "Order not found, ignored" });
    }

    if (order.paymentStatus === "PAID") {
      await logTransaction({
        ...baseLog,
        message: "Đơn đã được xác nhận trước đó (webhook gọi lặp lại)",
      });
      return res
        .status(200)
        .json({ success: true, message: "Already confirmed" });
    }

    if (isSessionExpired(sessionExpiresAt)) {
      await logTransaction({
        ...baseLog,
        message:
          "Phiên chuyển khoản đã hết hạn khi tiền về — cần admin đối soát thủ công",
      });
      return res
        .status(200)
        .json({
          success: true,
          message: "Session expired, needs manual review",
        });
    }

    if (!bankqrAmountMatches(order, parsed.amount)) {
      await logTransaction({
        ...baseLog,
        message: `Sai số tiền: chuyển khoản=${parsed.amount}, cần=${order.total} — cần admin đối soát thủ công`,
      });
      return res
        .status(200)
        .json({
          success: true,
          message: "Amount mismatch, needs manual review",
        });
    }

    const { alreadyPaid } = await markOrderPaidAtomic(
      order.id,
      parsed.gatewayTxnId,
    );
    await logTransaction({
      ...baseLog,
      message: alreadyPaid
        ? "Đơn đã được đánh dấu PAID bởi 1 request khác cùng lúc (race condition đã được chặn)"
        : "Xác nhận thanh toán thành công qua chuyển khoản QR",
    });
    return res.status(200).json({ success: true, message: "Confirmed" });
  } catch (error) {
    console.error("[bankqrWebhook]", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createVnpayPaymentUrl,
  verifyVnpayReturn,
  vnpayIpn,
  createMomoPaymentUrl,
  verifyMomoReturn,
  momoIpn,
  createBankQrPayment,
  getBankQrStatus,
  bankqrWebhook,
};
