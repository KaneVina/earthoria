// Để xác nhận quyền truy cập mã QR
const jwt = require('jsonwebtoken')
const prisma = require('../config/db')

exports.optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      req.user = null
      return next()
    }

    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({ where: { id: decoded.id } })

    req.user = user && user.isActive ? user : null
    return next()
  } catch {
    req.user = null
    return next()
  }
}