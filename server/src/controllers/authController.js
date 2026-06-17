const bcrypt = require('bcryptjs')
const prisma = require('../config/db')
const { generateToken, formatResponse } = require('../utils/helpers')
const passport = require('passport')

const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body

    if (!name || !email || !password) {
      return formatResponse(res, 400, 'Vui lòng điền đầy đủ thông tin')
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return formatResponse(res, 400, 'Email đã được sử dụng')
    }

    if (password.length < 6) {
      return formatResponse(res, 400, 'Mật khẩu phải ít nhất 6 ký tự')
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, phone },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    })

    const token = generateToken(user.id)
    return formatResponse(res, 201, 'Đăng ký thành công', { user, token })
  } catch (error) {
    console.error(error)
    return formatResponse(res, 500, 'Lỗi server')
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return formatResponse(res, 400, 'Vui lòng nhập email và mật khẩu')
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return formatResponse(res, 401, 'Email hoặc mật khẩu không đúng')
    }

    if (!user.isActive) {
      return formatResponse(res, 401, 'Tài khoản đã bị khóa')
    }

    if (!user.password) {
      return formatResponse(res, 401, 'Tài khoản này đăng nhập bằng Google, vui lòng dùng Google')
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return formatResponse(res, 401, 'Email hoặc mật khẩu không đúng')
    }

    const token = generateToken(user.id)
    return formatResponse(res, 200, 'Đăng nhập thành công', {
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
      token
    })
  } catch (error) {
    console.error(error)
    return formatResponse(res, 500, 'Lỗi server')
  }
}

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, phone: true, avatar: true, role: true, createdAt: true }
    })
    return formatResponse(res, 200, 'OK', user)
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, phone },
      select: { id: true, name: true, email: true, phone: true, avatar: true }
    })
    return formatResponse(res, 200, 'Cập nhật thành công', user)
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    const user = await prisma.user.findUnique({ where: { id: req.user.id } })

    if (!user.password) {
      return formatResponse(res, 400, 'Tài khoản đăng nhập bằng Google không thể đổi mật khẩu')
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return formatResponse(res, 400, 'Mật khẩu hiện tại không đúng')
    }

    if (newPassword.length < 6) {
      return formatResponse(res, 400, 'Mật khẩu mới phải ít nhất 6 ký tự')
    }

    const hashed = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashed }
    })

    return formatResponse(res, 200, 'Đổi mật khẩu thành công')
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
})

const googleCallback = (req, res) => {
  try {
    const user = req.user
    const token = generateToken(user.id)
    const redirectUrl = `${process.env.CLIENT_URL}/auth/google/success?token=${token}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&avatar=${encodeURIComponent(user.avatar || '')}&role=${user.role}`
    res.redirect(redirectUrl)
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL}/login?error=google_failed`)
  }
}

module.exports = { register, login, getMe, updateProfile, changePassword, googleAuth, googleCallback }