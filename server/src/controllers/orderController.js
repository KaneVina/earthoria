const prisma = require('../config/db')
const { formatResponse } = require('../utils/helpers')

// Create order
const createOrder = async (req, res) => {
  try {
    const { addressId, paymentMethod, note, couponCode } = req.body

    // Validate address
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: req.user.id }
    })
    if (!address) return formatResponse(res, 404, 'Không tìm thấy địa chỉ')

    // Get cart
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: {
        items: {
          include: { book: true }
        }
      }
    })

    if (!cart || cart.items.length === 0) {
      return formatResponse(res, 400, 'Giỏ hàng trống')
    }

    // Check stock
    for (const item of cart.items) {
      if (item.book.stock < item.quantity) {
        return formatResponse(res, 400, `Sách "${item.book.title}" không đủ hàng`)
      }
    }

    // Calculate
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + (item.book.salePrice || item.book.price) * item.quantity
    }, 0)

    const shippingFee = subtotal >= 300000 ? 0 : 30000
    let discount = 0

    // Apply coupon
    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: couponCode,
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
        }
      })

      if (coupon && subtotal >= coupon.minOrder) {
        if (coupon.type === 'PERCENTAGE') {
          discount = subtotal * (coupon.value / 100)
          if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount)
        } else {
          discount = coupon.value
        }

        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } }
        })
      }
    }

    const total = subtotal + shippingFee - discount

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        addressId,
        paymentMethod,
        note,
        couponCode,
        subtotal,
        shippingFee,
        discount,
        total,
        items: {
          create: cart.items.map(item => ({
            bookId: item.bookId,
            quantity: item.quantity,
            price: item.book.salePrice || item.book.price
          }))
        }
      },
      include: { items: true }
    })

    // Update stock + sold
    await Promise.all(cart.items.map(item =>
      prisma.book.update({
        where: { id: item.bookId },
        data: {
          stock: { decrement: item.quantity },
          sold: { increment: item.quantity }
        }
      })
    ))

    // Clear cart
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })

    return formatResponse(res, 201, 'Đặt hàng thành công', order)
  } catch (error) {
    console.error(error)
    return formatResponse(res, 500, 'Lỗi server')
  }
}

// Get my orders
const getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where = {
      userId: req.user.id,
      ...(status && { status })
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where, skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              book: {
                select: { title: true, coverImage: true, slug: true }
              }
            }
          },
          address: true
        }
      }),
      prisma.order.count({ where })
    ])

    return formatResponse(res, 200, 'OK', {
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

// Get single order
const getOrder = async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        items: {
          include: { book: true }
        },
        address: true
      }
    })

    if (!order) return formatResponse(res, 404, 'Không tìm thấy đơn hàng')
    return formatResponse(res, 200, 'OK', order)
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { items: true }
    })

    if (!order) return formatResponse(res, 404, 'Không tìm thấy đơn hàng')
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      return formatResponse(res, 400, 'Không thể hủy đơn hàng này')
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED' }
    })

    // Restore stock
    await Promise.all(order.items.map(item =>
      prisma.book.update({
        where: { id: item.bookId },
        data: {
          stock: { increment: item.quantity },
          sold: { decrement: item.quantity }
        }
      })
    ))

    return formatResponse(res, 200, 'Đã hủy đơn hàng')
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

module.exports = { createOrder, getMyOrders, getOrder, cancelOrder }