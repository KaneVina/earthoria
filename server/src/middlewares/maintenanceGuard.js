const jwt = require('jsonwebtoken')
const prisma = require('../config/db')
const { getOrCreateSettings, isMaintenanceActive } = require('../services/settingsService')

// Các đường dẫn luôn được phép, kể cả khi đang bảo trì:
// - /auth: để admin còn đăng nhập được
// - /settings/public: để frontend còn hỏi được trạng thái bảo trì
// - /health: theo dõi uptime
const ALWAYS_ALLOWED_PREFIXES = ['/api/v1/auth', '/api/v1/settings/public', '/api/health']

const maintenanceGuard = async (req, res, next) => {
  try {
    if (ALWAYS_ALLOWED_PREFIXES.some((prefix) => req.path.startsWith(prefix))) {
      return next()
    }

    const settings = await getOrCreateSettings()
    if (!isMaintenanceActive(settings)) return next()

    // Bảo trì đang bật — chỉ ADMIN đã đăng nhập mới được đi tiếp
    let isAdmin = false
    const token = req.headers.authorization?.startsWith('Bearer')
      ? req.headers.authorization.split(' ')[1]
      : null

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { role: true, isActive: true },
        })
        isAdmin = !!user?.isActive && user.role === 'ADMIN'
      } catch (_err) {
        // Token không hợp lệ/hết hạn — coi như khách, để route protect() tự trả 401 nếu cần
      }
    }

    if (isAdmin) return next()

    return res.status(503).json({
      success: false,
      maintenance: true,
      message: settings.maintenanceMessage || 'Website đang bảo trì, vui lòng quay lại sau.',
    })
  } catch (error) {
    // Nếu bước kiểm tra bị lỗi thì không chặn request, tránh sập cả site vì 1 lỗi phụ
    next()
  }
}

module.exports = maintenanceGuard