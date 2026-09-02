const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const prisma = require("../config/db");
const {
  sendOtpEmail,
  sendPasswordChangedEmail,
} = require("../services/emailService");
const { formatResponse } = require("../utils/helpers");
const { validatePasswordPolicy } = require("../utils/passwordPolicy");

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

function generateOtp() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(OTP_LENGTH, "0");
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

// POST /api/v1/auth/send-create-password-otp   (protected)
async function sendCreatePasswordOtp(req, res) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user) {
      return formatResponse(res, 404, "Không tìm thấy người dùng.");
    }

    if (user.password) {
      return formatResponse(
        res,
        400,
        "Tài khoản của bạn đã có mật khẩu. Vui lòng dùng chức năng đổi mật khẩu.",
      );
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetOtpHash: otpHash,
        resetOtpExpires: expires,
        resetOtpAttempts: 0,
      },
    });

    try {
      await sendOtpEmail({ to: user.email, name: user.name, otp });
    } catch (mailErr) {
      console.error(
        "[sendCreatePasswordOtp] Failed to send OTP email:",
        mailErr.message,
      );
      return formatResponse(
        res,
        500,
        "Không thể gửi email xác thực. Vui lòng thử lại sau.",
      );
    }

    return formatResponse(
      res,
      200,
      "Mã xác thực đã được gửi đến email của bạn.",
    );
  } catch (err) {
    console.error("[sendCreatePasswordOtp] Error:", err);
    return formatResponse(res, 500, "Đã xảy ra lỗi. Vui lòng thử lại sau.");
  }
}

// POST /api/v1/auth/create-password   (protected)
async function createPassword(req, res) {
  try {
    const { otp, newPassword } = req.body;

    if (!otp || !/^\d{6}$/.test(otp)) {
      return formatResponse(res, 400, "Mã xác thực không hợp lệ.");
    }

    const policyError = validatePasswordPolicy(newPassword);
    if (policyError) {
      return formatResponse(res, 400, policyError);
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user) {
      return formatResponse(res, 404, "Không tìm thấy người dùng.");
    }

    if (user.password) {
      return formatResponse(
        res,
        400,
        "Tài khoản của bạn đã có mật khẩu. Vui lòng dùng chức năng đổi mật khẩu.",
      );
    }

    if (!user.resetOtpHash || !user.resetOtpExpires) {
      return formatResponse(
        res,
        400,
        "Phiên xác thực không hợp lệ. Vui lòng yêu cầu mã mới.",
      );
    }

    if (new Date() > user.resetOtpExpires) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetOtpHash: null,
          resetOtpExpires: null,
          resetOtpAttempts: 0,
        },
      });
      return formatResponse(
        res,
        400,
        "Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.",
      );
    }

    if (user.resetOtpAttempts >= MAX_OTP_ATTEMPTS) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetOtpHash: null,
          resetOtpExpires: null,
          resetOtpAttempts: 0,
        },
      });
      return formatResponse(
        res,
        429,
        "Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã xác thực mới.",
      );
    }

    const inputHash = hashOtp(otp);
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(inputHash, "hex"),
      Buffer.from(user.resetOtpHash, "hex"),
    );

    if (!isMatch) {
      await prisma.user.update({
        where: { id: user.id },
        data: { resetOtpAttempts: { increment: 1 } },
      });
      const remaining = MAX_OTP_ATTEMPTS - (user.resetOtpAttempts + 1);
      return formatResponse(
        res,
        400,
        `Mã xác thực không đúng. Còn ${Math.max(0, remaining)} lần thử.`,
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetOtpHash: null,
        resetOtpExpires: null,
        resetOtpAttempts: 0,
      },
    });

    sendPasswordChangedEmail({ to: user.email, name: user.name }).catch((err) =>
      console.error(
        "[createPassword] Failed to send confirmation email:",
        err.message,
      ),
    );

    return formatResponse(
      res,
      200,
      "Tạo mật khẩu thành công! Từ giờ bạn có thể đăng nhập bằng email và mật khẩu này.",
    );
  } catch (err) {
    console.error("[createPassword] Error:", err);
    return formatResponse(res, 500, "Đã xảy ra lỗi. Vui lòng thử lại sau.");
  }
}

module.exports = {
  sendCreatePasswordOtp,
  createPassword,
};
