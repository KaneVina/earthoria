const prisma = require('../config/db')
const { getOrCreateSettings, isMaintenanceActive, SETTINGS_ID } = require('../services/settingsService')

// Các field admin được phép cập nhật qua PUT /admin/settings
const ALLOWED_FIELDS = [
  'maintenanceEnabled',
  'maintenanceStart',
  'maintenanceEnd',
  'maintenanceMessage',
  'devtoolsProtectionEnabled',
  'siteName',
  'siteTagline',
  'contactEmail',
  'contactPhone',
  'contactAddress',
  'facebookUrl',
  'instagramUrl',
  'tiktokUrl',
  'youtubeUrl',
  'bannerEnabled',
  'bannerText',
  'bannerLink',
  'allowRegistration',
  'allowGuestCheckout',
  'codEnabled',
  'stripeEnabled',
  'freeShippingThreshold',
  'maxCartItems',
]

const DATE_FIELDS = ['maintenanceStart', 'maintenanceEnd']

// GET /api/v1/settings/public — public, không cần đăng nhập
// Dùng để frontend quyết định có hiển thị trang bảo trì / banner hay không
const getPublicSettings = async (req, res) => {
  try {
    const s = await getOrCreateSettings()
    res.json({
      success: true,
      data: {
        maintenanceActive: isMaintenanceActive(s),
        maintenanceEnd: s.maintenanceEnd,
        maintenanceMessage: s.maintenanceMessage || null,
        devtoolsProtectionEnabled: s.devtoolsProtectionEnabled,
        bannerEnabled: s.bannerEnabled,
        bannerText: s.bannerText,
        bannerLink: s.bannerLink,
        siteName: s.siteName,
        siteTagline: s.siteTagline,
        contactEmail: s.contactEmail,
        contactPhone: s.contactPhone,
        contactAddress: s.contactAddress,
        facebookUrl: s.facebookUrl,
        instagramUrl: s.instagramUrl,
        tiktokUrl: s.tiktokUrl,
        youtubeUrl: s.youtubeUrl,
        allowRegistration: s.allowRegistration,
        allowGuestCheckout: s.allowGuestCheckout,
        codEnabled: s.codEnabled,
        stripeEnabled: s.stripeEnabled,
        freeShippingThreshold: s.freeShippingThreshold,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Không tải được cấu hình trang web' })
  }
}

// GET /api/v1/admin/settings — chỉ ADMIN
const getAdminSettings = async (req, res) => {
  try {
    const s = await getOrCreateSettings()
    res.json({ success: true, data: s })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Không tải được cài đặt hệ thống' })
  }
}

// PUT /api/v1/admin/settings — chỉ ADMIN
const updateAdminSettings = async (req, res) => {
  try {
    const data = {}
    for (const key of ALLOWED_FIELDS) {
      if (req.body[key] === undefined) continue
      if (DATE_FIELDS.includes(key)) {
        data[key] = req.body[key] ? new Date(req.body[key]) : null
      } else {
        data[key] = req.body[key]
      }
    }

    if (
      data.maintenanceStart &&
      data.maintenanceEnd &&
      data.maintenanceStart >= data.maintenanceEnd
    ) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian bắt đầu bảo trì phải trước thời gian kết thúc',
      })
    }

    data.updatedById = req.user.id
    data.updatedByName = req.user.name

    await getOrCreateSettings() // đảm bảo dòng singleton đã tồn tại trước khi update

    const updated = await prisma.siteSetting.update({
      where: { id: SETTINGS_ID },
      data,
    })

    res.json({ success: true, data: updated, message: 'Đã cập nhật cài đặt hệ thống' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Cập nhật cài đặt thất bại' })
  }
}

module.exports = { getPublicSettings, getAdminSettings, updateAdminSettings }