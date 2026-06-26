const prisma = require('../config/db')
const { formatResponse } = require('../utils/helpers')
const { getShippingFee } = require('../utils/shipping')

const FREE_SHIP_THRESHOLD = 300_000
const { calcShippingFee: calcFee, WAREHOUSE } = require('../utils/shipping')

const createOrder = async (req, res) => {
  try {
    const userId = req.user.id
    const { shipping, paymentMethod, couponCode, note } = req.body
    // shipping: { fullName, phone, email, province, district, ward, street }
    // district là tên (ví dụ "Ninh Kiều") từ form frontend

    // 1. Lấy cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            book: { select: { id: true, price: true, salePrice: true, stock: true, title: true } }
          }
        }
      }
    })
    if (!cart || cart.items.length === 0) {
      return formatResponse(res, 400, 'Giỏ hàng trống')
    }

    // 2. Kiểm tra stock
    for (const item of cart.items) {
      if (item.book.stock < item.quantity) {
        return formatResponse(res, 400, `Sách "${item.book.title}" không đủ hàng`)
      }
    }

    // 3. Tính subtotal
    const subtotal = cart.items.reduce((sum, item) => {
      const price = item.book.salePrice || item.book.price
      return sum + price * item.quantity
    }, 0)

    // 4. Tính discount từ coupon (tra DB)
    let discount = 0
    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: { code: couponCode, isActive: true }
      })
      if (coupon && subtotal >= coupon.minOrder) {
        discount = coupon.type === 'PERCENTAGE'
          ? Math.round(subtotal * coupon.value / 100)
          : coupon.value
        if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount)
        // Tăng usedCount
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } }
        })
      }
    }

    const afterDiscount = subtotal - discount

    // 5. Tính phí ship theo km
    let shippingFee
    if (afterDiscount >= FREE_SHIP_THRESHOLD) {
      shippingFee = 0
      } else {
      const result = getShippingFee(shipping.ward)
      shippingFee = result.fee
    }

    const total = afterDiscount + shippingFee

    // 6. Map paymentMethod
    const methodMap = { cod: 'COD', vnpay: 'VNPAY', momo: 'VNPAY', card: 'STRIPE' }
    const prismaMethod = methodMap[paymentMethod] || 'COD'

    // 7. Tạo Address snapshot (lưu vào bảng Address)
    const address = await prisma.address.create({
      data: {
        userId,
        fullName: shipping.fullName,
        phone: shipping.phone,
        province: shipping.province,
        district: '',
        ward: shipping.ward,
        street: shipping.street,
      }
    })

    // 8. Tạo Order + OrderItems trong transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          addressId: address.id,
          paymentMethod: prismaMethod,
          subtotal,
          discount,
          shippingFee,
          total,
          couponCode: couponCode || null,
          note: note || null,
          items: {
            create: cart.items.map(item => ({
              bookId: item.book.id,
              quantity: item.quantity,
              price: item.book.salePrice || item.book.price,
            }))
          }
        },
        include: { items: true }
      })

      // Giảm stock
      for (const item of cart.items) {
        await tx.book.update({
          where: { id: item.book.id },
          data: {
            stock: { decrement: item.quantity },
            sold:  { increment: item.quantity },
          }
        })
      }

      // Xóa cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } })

      return newOrder
    })

    return formatResponse(res, 201, 'Đặt hàng thành công', { orderId: order.id, total })
  } catch (error) {
    console.error(error)
    return formatResponse(res, 500, 'Lỗi server')
  }
}

const getMyOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: {
        items: { include: { book: { select: { title: true, coverImage: true } } } },
        address: true,
      },
      orderBy: { createdAt: 'desc' }
    })
    return formatResponse(res, 200, 'OK', orders)
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

const calcShippingFee = async (req, res) => {
  try {
    const { lat, lng, subtotal = 0 } = req.body

    if (!lat || !lng) return formatResponse(res, 400, 'Thiếu tọa độ lat/lng')

    if (subtotal >= FREE_SHIP_THRESHOLD) {
      return formatResponse(res, 200, 'OK', { km: null, fee: 0, free: true, isNoiO: false })
    }

    // Gọi OSRM để lấy km đường thực tế
    let kmFromOSRM = null
    try {
      const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${WAREHOUSE.lng},${WAREHOUSE.lat};${lng},${lat}?overview=false`
      const osrmRes = await fetch(osrmUrl, { signal: AbortSignal.timeout(4000) })
      const osrmData = await osrmRes.json()
      if (osrmData.routes?.[0]?.distance) {
        kmFromOSRM = parseFloat((osrmData.routes[0].distance / 1000).toFixed(1))
      }
    } catch {
      // OSRM timeout → fallback haversine, không cần báo lỗi
    }

    const result = calcFee(lat, lng, kmFromOSRM)
    return formatResponse(res, 200, 'OK', { ...result })
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

module.exports = { createOrder, getMyOrders, calcShippingFee }