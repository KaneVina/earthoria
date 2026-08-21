const crypto = require("crypto");

// ─── Thông tin tài khoản ngân hàng nhận tiền (của chủ dự án) ───
// BANKQR_BANK_CODE dùng mã ngân hàng theo chuẩn VietQR (napas), ví dụ MB Bank là "MB".
// Danh sách đầy đủ: https://api.vietqr.io/v2/banks
const BANK_CODE = process.env.BANKQR_BANK_CODE || "MB";
const ACCOUNT_NO = process.env.BANKQR_ACCOUNT_NO || "";
const ACCOUNT_NAME = process.env.BANKQR_ACCOUNT_NAME || "";

// SePay gửi kèm header Authorization: Apikey <key> trong mỗi lần gọi webhook — dùng để xác thực
// webhook thực sự đến từ SePay (cấu hình cùng giá trị này trong dashboard SePay khi tạo webhook).
const SEPAY_WEBHOOK_API_KEY = process.env.SEPAY_WEBHOOK_API_KEY || "";

// Ảnh QR động của VietQR.io — không cần gọi API/đăng ký gì thêm để TẠO ảnh, chỉ cần đúng
// số tài khoản + mã ngân hàng. Nội dung chuyển khoản (addInfo) được nhúng thẳng vào QR để
// người dùng chỉ cần quét, không phải gõ tay — hạn chế sai nội dung khiến đối soát tự động thất bại.
const VIETQR_IMG_TEMPLATE = "compact2";

function isConfigured() {
  return !!(ACCOUNT_NO && ACCOUNT_NAME);
}

/**
 * @param {{ amount: number, addInfo: string }} params
 * @returns URL ảnh QR (img.vietqr.io) người dùng quét bằng app ngân hàng bất kỳ để chuyển khoản.
 */
function buildQrImageUrl({ amount, addInfo }) {
  const params = new URLSearchParams({
    amount: String(Math.round(amount)),
    addInfo,
    accountName: ACCOUNT_NAME,
  });
  return `https://img.vietqr.io/image/${BANK_CODE}-${ACCOUNT_NO}-${VIETQR_IMG_TEMPLATE}.png?${params.toString()}`;
}

// So khớp không phân biệt hoa/thường và khoảng trắng thừa — app ngân hàng của người chuyển có thể
// tự thêm khoảng trắng hoặc đổi hoa/thường nội dung chuyển khoản.
function normalizeContent(str) {
  return String(str || "")
    .toUpperCase()
    .replace(/\s+/g, "");
}

/**
 * Trích đúng paymentRef từ nội dung chuyển khoản do SePay trả về (field `content` hoặc
 * `description` tuỳ payload). paymentRef có dạng cố định EARTH<digits><hex> (xem genPaymentRef
 * ở orderController.js) nên tìm theo pattern thay vì so khớp toàn chuỗi — nội dung CK thực tế
 * trên sao kê thường có thêm tiền tố ngân hàng tự chèn (vd "MBVCB.123.CT tu...EARTH...").
 */
function extractPaymentRef(content) {
  const normalized = normalizeContent(content);
  const match = normalized.match(/EARTH[0-9A-F]+/);
  return match ? match[0] : null;
}

/**
 * Xác thực webhook đến từ SePay bằng API Key cấu hình trong header Authorization.
 * SePay gửi dạng: Authorization: Apikey <SEPAY_WEBHOOK_API_KEY>
 */
function verifyWebhookAuth(authorizationHeader) {
  if (!SEPAY_WEBHOOK_API_KEY) return false;
  if (!authorizationHeader) return false;

  const expected = `Apikey ${SEPAY_WEBHOOK_API_KEY}`;
  const provided = String(authorizationHeader);

  // So sánh thời gian hằng số để tránh timing attack, giống cách vnpayUtil/momoUtil so chữ ký.
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Chuẩn hoá payload webhook SePay về 1 dạng chung cho paymentController dùng.
 * Cấu trúc payload SePay (giao dịch tiền vào): xem https://docs.sepay.vn
 * transferType "in" = tiền vào tài khoản (cái duy nhất mình quan tâm để xác nhận thanh toán).
 */
function parseWebhookPayload(body) {
  const content = body?.content || body?.description || "";
  return {
    gatewayTxnId: body?.id != null ? String(body.id) : body?.referenceCode || null,
    amount: body?.transferAmount != null ? Number(body.transferAmount) : null,
    isIncoming: body?.transferType ? body.transferType === "in" : true,
    paymentRef: extractPaymentRef(content),
    rawContent: content,
    accountNo: body?.accountNumber || null,
  };
}

module.exports = {
  isConfigured,
  buildQrImageUrl,
  extractPaymentRef,
  verifyWebhookAuth,
  parseWebhookPayload,
  BANK_CODE,
  ACCOUNT_NO,
  ACCOUNT_NAME,
};