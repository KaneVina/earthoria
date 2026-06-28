const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const prisma = require('../config/db')
const { sendOtpEmail } = require('../services/emailService')
const { generateToken, formatResponse } = require('../utils/helpers')

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
// POST /api/v1/auth/send-register-otp
// Validate → hash password → lưu PendingUser → gửi OTP
// KHÔNG tạo User thật ở bước này
// ════════════════════════════════════════════
async function sendRegisterOtp(req, res) {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return formatResponse(res, 400, 'Vui lòng điền đầy đủ thông tin.')
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return formatResponse(res, 400, 'Email không hợp lệ.')
    }

    if (password.length < 6) {
      return formatResponse(res, 400, 'Mật khẩu phải ít nhất 6 ký tự.')
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Kiểm tra email đã tồn tại trong User thật chưa
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existingUser) {
      return formatResponse(res, 400, 'Email đã được sử dụng.')
    }

    // Hash password ngay từ đây để không lưu plain text
    const hashedPassword = await bcrypt.hash(password, 12)

    const otp = generateOtp()
    const otpHash = hashOtp(otp)
    const otpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    // Upsert PendingUser — nếu user gửi lại OTP thì cập nhật, không tạo trùng
    await prisma.pendingUser.upsert({
      where: { email: normalizedEmail },
      update: {
        name,
        password: hashedPassword,
        otpHash,
        otpExpires,
        otpAttempts: 0,
      },
      create: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        otpHash,
        otpExpires,
        otpAttempts: 0,
      },
    })

    // Gửi email OTP (lỗi mail không làm hỏng flow)
    try {
      await sendOtpEmail({ to: normalizedEmail, name, otp })
    } catch (mailErr) {
      console.error('[sendRegisterOtp] Failed to send OTP email:', mailErr.message)
    }

    return formatResponse(res, 200, 'Mã OTP đã được gửi đến email của bạn.')
  } catch (err) {
    console.error('[sendRegisterOtp] Error:', err)
    return formatResponse(res, 500, 'Đã xảy ra lỗi. Vui lòng thử lại sau.')
  }
}

// ════════════════════════════════════════════
// POST /api/v1/auth/verify-register-otp
// Xác thực OTP → tạo User thật → xóa PendingUser → trả token
// ════════════════════════════════════════════
async function verifyRegisterOtp(req, res) {
  try {
    const { email, otp } = req.body

    if (!email || !otp || !/^\d{6}$/.test(otp)) {
      return formatResponse(res, 400, 'Thông tin xác thực không hợp lệ.')
    }

    const normalizedEmail = email.trim().toLowerCase()

    const pending = await prisma.pendingUser.findUnique({ where: { email: normalizedEmail } })

    if (!pending) {
      return formatResponse(res, 400, 'Phiên đăng ký không tồn tại. Vui lòng thử lại từ đầu.')
    }

    // Kiểm tra hết hạn
    if (new Date() > pending.otpExpires) {
      await prisma.pendingUser.delete({ where: { email: normalizedEmail } })
      return formatResponse(res, 400, 'Mã OTP đã hết hạn. Vui lòng đăng ký lại.')
    }

    // Kiểm tra số lần thử
    if (pending.otpAttempts >= MAX_OTP_ATTEMPTS) {
      await prisma.pendingUser.delete({ where: { email: normalizedEmail } })
      return formatResponse(res, 429, 'Bạn đã nhập sai quá nhiều lần. Vui lòng đăng ký lại.')
    }

    const inputHash = hashOtp(otp)
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(inputHash, 'hex'),
      Buffer.from(pending.otpHash, 'hex')
    )

    if (!isMatch) {
      await prisma.pendingUser.update({
        where: { email: normalizedEmail },
        data: { otpAttempts: { increment: 1 } },
      })
      const remaining = MAX_OTP_ATTEMPTS - (pending.otpAttempts + 1)
      return formatResponse(res, 400, `Mã OTP không đúng. Còn ${Math.max(0, remaining)} lần thử.`)
    }

    // OTP đúng → kiểm tra lần cuối email chưa bị đăng ký trong lúc chờ
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existingUser) {
      await prisma.pendingUser.delete({ where: { email: normalizedEmail } })
      return formatResponse(res, 400, 'Email đã được sử dụng.')
    }

    // Tạo User thật trong một transaction
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: pending.name,
          email: pending.email,
          password: pending.password,
          phone: pending.phone ?? undefined,
        },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      })

      await tx.pendingUser.delete({ where: { email: normalizedEmail } })

      return created
    })

    const token = generateToken(user.id)
    return formatResponse(res, 201, 'Đăng ký thành công.', { user, token })
  } catch (err) {
    console.error('[verifyRegisterOtp] Error:', err)
    return formatResponse(res, 500, 'Đã xảy ra lỗi. Vui lòng thử lại sau.')
  }
}

module.exports = { sendRegisterOtp, verifyRegisterOtp }