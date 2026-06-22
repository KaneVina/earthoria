const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const prisma = require('../config/db')
const { sendOtpEmail, sendPasswordChangedEmail } = require('../services/emailService')
const { formatResponse } = require('../utils/helpers')

const OTP_LENGTH = 6
const OTP_EXPIRY_MINUTES = 10
const MAX_OTP_ATTEMPTS = 5

function generateOtp() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(OTP_LENGTH, '0')
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex')
}

// ════════════════════════════════════════════
// POST /api/v1/auth/forgot-password
// ════════════════════════════════════════════
async function forgotPassword(req, res) {
  try {
    const { email } = req.body

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return formatResponse(res, 400, 'Email không hợp lệ.')
    }

    const normalizedEmail = email.trim().toLowerCase()
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })

    if (user && user.isActive) {
      const otp = generateOtp()
      const otpHash = hashOtp(otp)
      const expires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetOtpHash: otpHash,
          resetOtpExpires: expires,
          resetOtpAttempts: 0,
        },
      })

      try {
        await sendOtpEmail({ to: user.email, name: user.name, otp })
      } catch (mailErr) {
        console.error('[forgotPassword] Failed to send OTP email:', mailErr.message)
      }
    }

    return formatResponse(res, 200, 'Nếu email tồn tại trong hệ thống, mã xác thực đã được gửi đến hộp thư của bạn.')
  } catch (err) {
    console.error('[forgotPassword] Error:', err)
    return formatResponse(res, 500, 'Đã xảy ra lỗi. Vui lòng thử lại sau.')
  }
}

// ════════════════════════════════════════════
// POST /api/v1/auth/verify-otp
// ════════════════════════════════════════════
async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body

    if (!email || !otp || !/^\d{6}$/.test(otp)) {
      return formatResponse(res, 400, 'Thông tin xác thực không hợp lệ.')
    }

    const normalizedEmail = email.trim().toLowerCase()
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })

    if (!user || !user.resetOtpHash || !user.resetOtpExpires) {
      return formatResponse(res, 400, 'Mã xác thực không đúng hoặc đã hết hạn.')
    }

    if (new Date() > user.resetOtpExpires) {
      await prisma.user.update({
        where: { id: user.id },
        data: { resetOtpHash: null, resetOtpExpires: null, resetOtpAttempts: 0 },
      })
      return formatResponse(res, 400, 'Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.')
    }

    if (user.resetOtpAttempts >= MAX_OTP_ATTEMPTS) {
      await prisma.user.update({
        where: { id: user.id },
        data: { resetOtpHash: null, resetOtpExpires: null, resetOtpAttempts: 0 },
      })
      return formatResponse(res, 429, 'Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã xác thực mới.')
    }

    const inputHash = hashOtp(otp)
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(inputHash, 'hex'),
      Buffer.from(user.resetOtpHash, 'hex')
    )

    if (!isMatch) {
      await prisma.user.update({
        where: { id: user.id },
        data: { resetOtpAttempts: { increment: 1 } },
      })
      const remaining = MAX_OTP_ATTEMPTS - (user.resetOtpAttempts + 1)
      return formatResponse(res, 400, `Mã xác thực không đúng. Còn ${Math.max(0, remaining)} lần thử.`)
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { resetOtpAttempts: 0 },
    })

    return formatResponse(res, 200, 'Xác thực thành công.')
  } catch (err) {
    console.error('[verifyOtp] Error:', err)
    return formatResponse(res, 500, 'Đã xảy ra lỗi. Vui lòng thử lại sau.')
  }
}

// ════════════════════════════════════════════
// POST /api/v1/auth/reset-password
// ════════════════════════════════════════════
async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body

    if (!email || !otp || !/^\d{6}$/.test(otp)) {
      return formatResponse(res, 400, 'Thông tin xác thực không hợp lệ.')
    }
    if (!newPassword || newPassword.length < 8) {
      return formatResponse(res, 400, 'Mật khẩu mới phải có tối thiểu 8 ký tự.')
    }

    const normalizedEmail = email.trim().toLowerCase()
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })

    if (!user || !user.resetOtpHash || !user.resetOtpExpires) {
      return formatResponse(res, 400, 'Phiên xác thực không hợp lệ. Vui lòng thử lại từ đầu.')
    }

    if (new Date() > user.resetOtpExpires) {
      await prisma.user.update({
        where: { id: user.id },
        data: { resetOtpHash: null, resetOtpExpires: null, resetOtpAttempts: 0 },
      })
      return formatResponse(res, 400, 'Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.')
    }

    if (user.resetOtpAttempts >= MAX_OTP_ATTEMPTS) {
      await prisma.user.update({
        where: { id: user.id },
        data: { resetOtpHash: null, resetOtpExpires: null, resetOtpAttempts: 0 },
      })
      return formatResponse(res, 429, 'Phiên xác thực đã bị khóa. Vui lòng yêu cầu mã mới.')
    }

    const inputHash = hashOtp(otp)
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(inputHash, 'hex'),
      Buffer.from(user.resetOtpHash, 'hex')
    )

    if (!isMatch) {
      await prisma.user.update({
        where: { id: user.id },
        data: { resetOtpAttempts: { increment: 1 } },
      })
      return formatResponse(res, 400, 'Mã xác thực không đúng.')
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetOtpHash: null,
        resetOtpExpires: null,
        resetOtpAttempts: 0,
      },
    })

    sendPasswordChangedEmail({ to: user.email, name: user.name }).catch(err =>
      console.error('[resetPassword] Failed to send confirmation email:', err.message)
    )

    return formatResponse(res, 200, 'Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập lại.')
  } catch (err) {
    console.error('[resetPassword] Error:', err)
    return formatResponse(res, 500, 'Đã xảy ra lỗi. Vui lòng thử lại sau.')
  }
}

module.exports = {
  forgotPassword,
  verifyOtp,
  resetPassword,
}