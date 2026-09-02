const crypto = require("crypto");

const VNP_URL =
  process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const VNP_TMN_CODE = process.env.VNPAY_TMN_CODE || "";
const VNP_HASH_SECRET = process.env.VNPAY_HASH_SECRET || "";

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

const VNP_CURRENCY = "VND";

function verifyReturn(query) {
  const { vnp_SecureHash, vnp_SecureHashType, ...rest } = query;
  const { secureHash } = buildSignedQuery(rest, VNP_HASH_SECRET);
  const signatureValid =
    !!vnp_SecureHash &&
    secureHash.length === vnp_SecureHash.length &&
    crypto.timingSafeEqual(
      Buffer.from(secureHash),
      Buffer.from(vnp_SecureHash),
    );

  const tmnCodeValid = !!VNP_TMN_CODE && query.vnp_TmnCode === VNP_TMN_CODE;

  const isValid = signatureValid && tmnCodeValid;

  return {
    isValid,
    signatureValid,
    tmnCodeValid,
    isSuccess:
      isValid &&
      query.vnp_ResponseCode === "00" &&
      query.vnp_TransactionStatus === "00",
    currency: VNP_CURRENCY,
  };
}

module.exports = {
  createPaymentUrl,
  verifyReturn,
  VNP_TMN_CODE,
  VNP_HASH_SECRET,
  VNP_CURRENCY,
};
