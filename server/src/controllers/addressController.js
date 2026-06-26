const prisma = require('../config/db')
const { formatResponse } = require('../utils/helpers')

// GET /addresses — lấy tất cả địa chỉ của user
const getAddresses = async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [{ isDefault: 'desc' }, { id: 'asc' }],
    })
    return formatResponse(res, 200, 'OK', addresses)
  } catch (error) {
    console.error(error)
    return formatResponse(res, 500, 'Lỗi server')
  }
}

// POST /addresses — thêm địa chỉ mới
const createAddress = async (req, res) => {
  try {
    const { fullName, phone, province, ward, street, isDefault, lat, lng } = req.body

    if (!fullName || !phone || !province || !ward || !street)
      return formatResponse(res, 400, 'Thiếu thông tin địa chỉ')

    // Nếu set default → bỏ default các địa chỉ cũ
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false },
      })
    }

    // Nếu chưa có địa chỉ nào → tự động set default
    const count = await prisma.address.count({ where: { userId: req.user.id } })

    const address = await prisma.address.create({
      data: {
        userId:   req.user.id,
        fullName,
        phone,
        province,
        district: '',       // bỏ district theo hành chính mới
        ward,
        street,
        isDefault: isDefault || count === 0,
        lat:      lat ? parseFloat(lat) : null,
        lng:      lng ? parseFloat(lng) : null,
      },
    })
    return formatResponse(res, 201, 'Thêm địa chỉ thành công', address)
  } catch (error) {
    console.error(error)
    return formatResponse(res, 500, 'Lỗi server')
  }
}

// PUT /addresses/:id — cập nhật địa chỉ
const updateAddress = async (req, res) => {
  try {
    const { id } = req.params
    const { fullName, phone, province, ward, street, isDefault, lat, lng } = req.body

    const existing = await prisma.address.findFirst({
      where: { id, userId: req.user.id },
    })
    if (!existing) return formatResponse(res, 404, 'Không tìm thấy địa chỉ')

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id, id: { not: id } },
        data: { isDefault: false },
      })
    }

    const address = await prisma.address.update({
      where: { id },
      data: {
        ...(fullName  && { fullName }),
        ...(phone     && { phone }),
        ...(province  && { province }),
        ...(ward      && { ward }),
        ...(street    && { street }),
        ...(isDefault !== undefined && { isDefault }),
        ...(lat !== undefined && { lat: lat ? parseFloat(lat) : null }),
        ...(lng !== undefined && { lng: lng ? parseFloat(lng) : null }),
      },
    })
    return formatResponse(res, 200, 'Cập nhật thành công', address)
  } catch (error) {
    console.error(error)
    return formatResponse(res, 500, 'Lỗi server')
  }
}

// DELETE /addresses/:id — xóa địa chỉ
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params

    const existing = await prisma.address.findFirst({
      where: { id, userId: req.user.id },
    })
    if (!existing) return formatResponse(res, 404, 'Không tìm thấy địa chỉ')

    // Không cho xóa nếu địa chỉ đang được dùng trong order
    const usedInOrder = await prisma.order.findFirst({ where: { addressId: id } })
    if (usedInOrder) return formatResponse(res, 400, 'Địa chỉ đang được dùng trong đơn hàng, không thể xóa')

    await prisma.address.delete({ where: { id } })

    // Nếu xóa địa chỉ default → set địa chỉ đầu tiên còn lại làm default
    if (existing.isDefault) {
      const first = await prisma.address.findFirst({
        where: { userId: req.user.id },
        orderBy: { id: 'asc' },
      })
      if (first) {
        await prisma.address.update({
          where: { id: first.id },
          data: { isDefault: true },
        })
      }
    }

    return formatResponse(res, 200, 'Xóa địa chỉ thành công')
  } catch (error) {
    console.error(error)
    return formatResponse(res, 500, 'Lỗi server')
  }
}

// PATCH /addresses/:id/default — set địa chỉ mặc định
const setDefault = async (req, res) => {
  try {
    const { id } = req.params

    const existing = await prisma.address.findFirst({
      where: { id, userId: req.user.id },
    })
    if (!existing) return formatResponse(res, 404, 'Không tìm thấy địa chỉ')

    await prisma.address.updateMany({
      where: { userId: req.user.id },
      data: { isDefault: false },
    })
    await prisma.address.update({
      where: { id },
      data: { isDefault: true },
    })

    return formatResponse(res, 200, 'Đã đặt làm địa chỉ mặc định')
  } catch (error) {
    console.error(error)
    return formatResponse(res, 500, 'Lỗi server')
  }
}

module.exports = { getAddresses, createAddress, updateAddress, deleteAddress, setDefault }