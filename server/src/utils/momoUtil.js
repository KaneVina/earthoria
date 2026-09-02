const crypto = require("crypto");

const MOMO_ENDPOINT =
  process.env.MOMO_ENDPOINT ||
  "https://test-payment.momo.vn/v2/gateway/api/create";
const PARTNER_CODE = process.env.MOMO_PARTNER_CODE || "MOMO";
const ACCESS_KEY = process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85";
const SECRET_KEY =
  process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz";

function sign(rawSignature) {
  return crypto
    .createHmac("sha256", SECRET_KEY)
    .update(rawSignature)
    .digest("hex");
}

async function createPaymentRequest({
  orderId,
  amount,
  orderInfo,
  redirectUrl,
  ipnUrl,
}) {
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

const MOMO_CURRENCY = "VND";
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
  const signatureValid =
    !!signature &&
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));

  const partnerCodeValid = !!PARTNER_CODE && partnerCode === PARTNER_CODE;

  const isValid = signatureValid && partnerCodeValid;

  return {
    isValid,
    signatureValid,
    partnerCodeValid,
    isSuccess: isValid && String(resultCode) === "0",
    currency: MOMO_CURRENCY,
  };
}

module.exports = {
  createPaymentRequest,
  verifyReturn,
  PARTNER_CODE,
  MOMO_CURRENCY,
};
