const crypto = require("crypto");
const prisma = require("../config/db");
const { formatResponse } = require("../utils/helpers");
const { sendOtpEmail } = require("../services/emailService");
const {
  isValidPinFormat,
  hashPin,
  verifyParentPin,
} = require("../utils/parentPin");

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

function generateOtp() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(OTP_LENGTH, "0");
}
function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

// GET /api/v1/parent-pin/status
const getPinStatus = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { parentPinHash: true },
    });
    return formatResponse(res, 200, "OK", { hasPin: !!user.parentPinHash });
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// POST /api/v1/parent-pin/set — chỉ dùng khi CHƯA có PIN (lần đầu thiết lập)
const setPin = async (req, res) => {
  try {
    const { pin } = req.body;
    if (!isValidPinFormat(pin)) {
      return formatResponse(res, 400, "Mã PIN gồm đúng 4 chữ số.");
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user.parentPinHash) {
      return formatResponse(
        res,
        400,
        "Bạn đã có mã PIN. Dùng chức năng đổi PIN nếu muốn thay đổi.",
      );
    }

    const parentPinHash = await hashPin(pin);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { parentPinHash, parentPinAttempts: 0, parentPinLockedUntil: null },
    });

    await prisma.childAuditLog.create({
      data: {
        parentId: req.user.id,
        type: "PARENT_PIN_SET",
        message: "Đã thiết lập mã PIN phụ huynh",
      },
    });

    return formatResponse(res, 200, "Đã thiết lập mã PIN thành công");
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// POST /api/v1/parent-pin/verify — dùng để xác thực trước hành động nhạy cảm
const verifyPin = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const result = await verifyParentPin(user, req.body.pin);
    if (!result.ok) {
      return formatResponse(
        res,
        result.code === "LOCKED_OUT" ? 429 : 400,
        result.message,
        {
          code: result.code,
        },
      );
    }
    return formatResponse(res, 200, "Mã PIN chính xác");
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// POST /api/v1/parent-pin/change — { oldPin, newPin }
const changePin = async (req, res) => {
  try {
    const { oldPin, newPin } = req.body;
    if (!isValidPinFormat(newPin)) {
      return formatResponse(res, 400, "Mã PIN mới gồm đúng 4 chữ số.");
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const verify = await verifyParentPin(user, oldPin);
    if (!verify.ok) {
      return formatResponse(
        res,
        verify.code === "LOCKED_OUT" ? 429 : 400,
        verify.message,
        {
          code: verify.code,
        },
      );
    }

    const parentPinHash = await hashPin(newPin);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { parentPinHash },
    });

    await prisma.childAuditLog.create({
      data: {
        parentId: req.user.id,
        type: "PARENT_PIN_CHANGED",
        message: "Bạn đã đổi mã PIN",
      },
    });

    return formatResponse(res, 200, "Đã đổi mã PIN thành công");
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// POST /api/v1/parent-pin/forgot/send-otp — gửi OTP về email của chính tài
// khoản phụ huynh đang đăng nhập (không cần nhập lại email, tránh gửi OTP
// sang email người khác).
const sendForgotPinOtp = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const otpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        parentPinResetOtpHash: otpHash,
        parentPinResetOtpExpires: otpExpires,
        parentPinResetOtpAttempts: 0,
      },
    });

    try {
      await sendOtpEmail({ to: user.email, name: user.name, otp });
    } catch (mailErr) {
      console.error(
        "[sendForgotPinOtp] Failed to send OTP email:",
        mailErr.message,
      );
    }

    const [local, domain] = user.email.split("@");
    const masked = `${local.slice(0, 1)}•••••@${domain}`;

    return formatResponse(res, 200, "Đã gửi mã OTP tới email của bạn", {
      maskedEmail: masked,
    });
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// POST /api/v1/parent-pin/forgot/reset — { otp, newPin }
const resetPinWithOtp = async (req, res) => {
  try {
    const { otp, newPin } = req.body;
    if (!otp || !/^\d{6}$/.test(otp)) {
      return formatResponse(res, 400, "Mã OTP không hợp lệ.");
    }
    if (!isValidPinFormat(newPin)) {
      return formatResponse(res, 400, "Mã PIN mới gồm đúng 4 chữ số.");
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user.parentPinResetOtpHash || !user.parentPinResetOtpExpires) {
      return formatResponse(res, 400, "Vui lòng yêu cầu gửi mã OTP trước.");
    }
    if (new Date() > user.parentPinResetOtpExpires) {
      return formatResponse(res, 400, "Mã OTP đã hết hạn. Vui lòng gửi lại.");
    }
    if (user.parentPinResetOtpAttempts >= MAX_OTP_ATTEMPTS) {
      return formatResponse(
        res,
        429,
        "Bạn đã nhập sai quá nhiều lần. Vui lòng gửi lại mã OTP.",
      );
    }

    const inputHash = hashOtp(otp);
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(inputHash, "hex"),
      Buffer.from(user.parentPinResetOtpHash, "hex"),
    );

    if (!isMatch) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { parentPinResetOtpAttempts: { increment: 1 } },
      });
      const remaining = MAX_OTP_ATTEMPTS - (user.parentPinResetOtpAttempts + 1);
      return formatResponse(
        res,
        400,
        `Mã OTP không đúng. Còn ${Math.max(0, remaining)} lần thử.`,
      );
    }

    const parentPinHash = await hashPin(newPin);
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        parentPinHash,
        parentPinAttempts: 0,
        parentPinLockedUntil: null,
        parentPinResetOtpHash: null,
        parentPinResetOtpExpires: null,
        parentPinResetOtpAttempts: 0,
      },
    });

    await prisma.childAuditLog.create({
      data: {
        parentId: req.user.id,
        type: "PARENT_PIN_RESET",
        message: "Bạn đã đặt lại mã PIN mới qua email",
      },
    });

    return formatResponse(res, 200, "Đã đặt lại mã PIN mới thành công");
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

module.exports = {
  getPinStatus,
  setPin,
  verifyPin,
  changePin,
  sendForgotPinOtp,
  resetPinWithOtp,
};
