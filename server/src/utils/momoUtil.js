// momoUtil.js — Tạo yêu cầu thanh toán & xác thực chữ ký MoMo (môi trường test/sandbox).
//
// Bộ accessKey/secretKey mặc định bên dưới là bộ khóa TEST công khai chính thức của MoMo,
// dùng chung cho mọi developer thử nghiệm (công bố trong tài liệu tích hợp của MoMo) — không
// phải bí mật riêng của dự án này. Muốn dùng khóa riêng thì đăng ký Business tại business.momo.vn
// rồi điền vào .env (MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY).
const crypto = require("crypto");

const MOMO_ENDPOINT =
  process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/create";
const PARTNER_CODE = process.env.MOMO_PARTNER_CODE || "MOMO";
const ACCESS_KEY = process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85";
const SECRET_KEY = process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz";

function sign(rawSignature) {
  return crypto.createHmac("sha256", SECRET_KEY).update(rawSignature).digest("hex");
}

/**
 * Gọi API MoMo để lấy payUrl (redirect người dùng sang đó thanh toán).
 * @param {{ orderId: string, amount: number, orderInfo: string, redirectUrl: string, ipnUrl: string }} p
 */
async function createPaymentRequest({ orderId, amount, orderInfo, redirectUrl, ipnUrl }) {
  const requestId = `${orderId}-${Date.now()}`;
  const requestType = "captureWallet";
  const extraData = "";
  const amountInt = Math.round(amount);

  const rawSignature =
    `accessKey=${ACCESS_KEY}&amount=${amountInt}&extraData=${extraData}` +
    `&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}` +
    `&partnerCode=${PARTNER_CODE}&redirectUrl=${redirectUrl}` +
    `&requestId=${requestId}&requestType=${requestType}`;

  const body = {
    partnerCode: PARTNER_CODE,
    partnerName: "Earthoria",
    storeId: "EarthoriaStore",
    requestId,
    amount: amountInt,
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    lang: "vi",
    extraData,
    requestType,
    signature: sign(rawSignature),
  };

  const res = await fetch(MOMO_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  const data = await res.json();
  return data; // { payUrl, resultCode, message, ... }
}

/**
 * Xác thực chữ ký MoMo gửi về ở redirectUrl / ipnUrl.
 * @param {Record<string,string>} query các field MoMo trả về (đã bao gồm signature)
 */
function verifyReturn(query) {
  const {
    signature,
    amount,
    extraData = "",
    message,
    orderId,
    orderInfo,
    orderType,
    partnerCode,
    payType,
    requestId,
    responseTime,
    resultCode,
    transId,
  } = query;

  const rawSignature =
    `accessKey=${ACCESS_KEY}&amount=${amount}&extraData=${extraData}` +
    `&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}` +
    `&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}` +
    `&requestId=${requestId}&responseTime=${responseTime}` +
    `&resultCode=${resultCode}&transId=${transId}`;

  const expected = sign(rawSignature);
  const isValid =
    !!signature &&
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));

  return { isValid, isSuccess: isValid && String(resultCode) === "0" };
}

module.exports = { createPaymentRequest, verifyReturn, PARTNER_CODE };