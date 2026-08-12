const jwt = require('jsonwebtoken')
const prisma = require('../config/db')

const protect = async (req, res, next) => {
  try {
    let token
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Không có quyền truy cập' })
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true, isActive: true }
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Token không hợp lệ' })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ' })
  }
}

// Không bắt buộc đăng nhập — có token hợp lệ thì gắn req.user để controller trả thêm dữ liệu cá nhân hoá
const optionalAuth = async (req, res, next) => {
  try {
    let token
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }
    if (!token) return next()

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true, isActive: true }
    })

    if (user && user.isActive) req.user = user
    next()
  } catch (error) {
    next()
  }
}

const adminOnly = (req, res, next) => {
if (req.user?.role !== 'ADMIN') {
return res.status(403).json({ success: false, message: 'Chỉ admin mới có quyền này' })
}
next()
}

// Dùng cho các route mà STAFF cũng được phép (vd: xem/tạo mã AR)
const staffOrAdmin = (req, res, next) => {
if (req.user?.role !== 'ADMIN' && req.user?.role !== 'STAFF') {
return res.status(403).json({ success: false, message: 'Chỉ admin hoặc staff mới có quyền này' })
}
next()
}

module.exports = { protect, optionalAuth, adminOnly, staffOrAdmin }