// vnpayUtil.js — Ký & xác thực chữ ký cho cổng thanh toán VNPay (môi trường sandbox demo).
//
// Muốn test thật cần đăng ký tài khoản sandbox miễn phí tại:
//   https://sandbox.vnpayment.vn/devreg/  → lấy vnp_TmnCode + vnp_HashSecret
// rồi điền vào .env (VNPAY_TMN_CODE, VNPAY_HASH_SECRET). Thẻ test do VNPay cấp
// sẵn trong tài khoản sandbox (ngân hàng NCB demo, OTP demo 123456...).
const crypto = require("crypto");

const VNP_URL =
  process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const VNP_TMN_CODE = process.env.VNPAY_TMN_CODE || "";
const VNP_HASH_SECRET = process.env.VNPAY_HASH_SECRET || "";

// VNPay yêu cầu sort key alphabet rồi build query string TRƯỚC khi ký —
// và encode y hệt lúc build URL thật (dùng encodeURIComponent, khoảng trắng thành '+').
function sortObject(obj) {
  const sorted = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = obj[key];
    });
  return sorted;
}

function buildSignedQuery(params, hashSecret) {
  const sorted = sortObject(params);
  const signData = Object.entries(sorted)
    .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, "+")}`)
    .join("&");
  const hmac = crypto.createHmac("sha512", hashSecret);
  const secureHash = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
  return { signData, secureHash };
}

function formatVnpDate(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

/**
 * Tạo URL redirect người dùng sang cổng VNPay.
 * @param {{ txnRef: string, amount: number, orderInfo: string, ipAddr: string, returnUrl: string }} p
 */
function createPaymentUrl({ txnRef, amount, orderInfo, ipAddr, returnUrl }) {
  const now = new Date();
  const params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: VNP_TMN_CODE,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: "other",
    // VNPay yêu cầu amount * 100 (không có phần thập phân)
    vnp_Amount: Math.round(amount * 100),
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr || "127.0.0.1",
    vnp_CreateDate: formatVnpDate(now),
  };

  const { signData, secureHash } = buildSignedQuery(params, VNP_HASH_SECRET);
  return `${VNP_URL}?${signData}&vnp_SecureHash=${secureHash}`;
}

/**
 * Xác thực chữ ký VNPay trả về (ở returnUrl hoặc IPN).
 * @param {Record<string,string>} query toàn bộ query params VNPay gửi về (đã bao gồm vnp_SecureHash)
 */
function verifyReturn(query) {
  const { vnp_SecureHash, vnp_SecureHashType, ...rest } = query;
  const { secureHash } = buildSignedQuery(rest, VNP_HASH_SECRET);
  const isValid =
    !!vnp_SecureHash &&
    secureHash.length === vnp_SecureHash.length &&
    crypto.timingSafeEqual(Buffer.from(secureHash), Buffer.from(vnp_SecureHash));
  return {
    isValid,
    isSuccess: isValid && query.vnp_ResponseCode === "00" && query.vnp_TransactionStatus === "00",
  };
}

module.exports = { createPaymentUrl, verifyReturn, VNP_TMN_CODE, VNP_HASH_SECRET };