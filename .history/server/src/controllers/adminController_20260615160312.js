const prisma = require('../config/db')
const { formatResponse } = require('../utils/helpers')
const { encodeId } = require('../utils/hashids')
const slugify = require('slugify')

// ─── DASHBOARD ───
const getDashboard = async (req, res) => {
  try {
    const [totalUsers, totalBooks, totalOrders, revenue] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.book.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { total: true }
      })
    ])

    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        items: true
      }
    })

    const monthlyRevenue = await prisma.order.groupBy({
      by: ['createdAt'],
      where: { paymentStatus: 'PAID' },
      _sum: { total: true }
    })

    return formatResponse(res, 200, 'OK', {
      stats: {
        totalUsers,
        totalBooks,
        totalOrders,
        revenue: revenue._sum.total || 0
      },
      recentOrders,
      monthlyRevenue
    })
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

// ─── BOOKS ───
const adminGetBooks = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where = {
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(category && { category: { slug: category } })
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { category: { select: { name: true, slug: true } } }
      }),
      prisma.book.count({ where })
    ])

    return formatResponse(res, 200, 'OK', {
      books: books.map(b => ({ ...b, hashId: encodeId(b.id) })),
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
    })
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

const adminCreateBook = async (req, res) => {
  try {
    const {
      title, description, price, salePrice, stock,
      ageMin, ageMax, language, pages, publisher,
      coverImage, images, arModelUrl, arPreviewUrls,
      hasAR, hasAI, has3DAudio, isFeatured, categoryId
    } = req.body

    if (!title || !price || !categoryId) {
      return formatResponse(res, 400, 'Thiếu thông tin bắt buộc')
    }

    const slug = slugify(title, { lower: true, strict: true, locale: 'vi' })
    const existing = await prisma.book.findUnique({ where: { slug } })
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug

    const book = await prisma.book.create({
      data: {
        title, description, slug: finalSlug,
        price: parseFloat(price),
        salePrice: salePrice ? parseFloat(salePrice) : null,
        stock: parseInt(stock) || 0,
        ageMin: ageMin ? parseInt(ageMin) : null,
        ageMax: ageMax ? parseInt(ageMax) : null,
        language: language || 'VI',
        pages: pages ? parseInt(pages) : null,
        publisher, coverImage,
        images: images || [],
        arModelUrl,
        arPreviewUrls: arPreviewUrls || [],
        hasAR: hasAR !== false,
        hasAI: hasAI !== false,
        has3DAudio: has3DAudio || false,
        isFeatured: isFeatured || false,
        categoryId
      }
    })

    return formatResponse(res, 201, 'Tạo sách thành công', {
      ...book, hashId: encodeId(book.id)
    })
  } catch (error) {
    console.error(error)
    return formatResponse(res, 500, 'Lỗi server')
  }
}

const adminUpdateBook = async (req, res) => {
  try {
    const book = await prisma.book.update({
      where: { id: req.params.id },
      data: req.body
    })
    return formatResponse(res, 200, 'Cập nhật thành công', { ...book, hashId: encodeId(book.id) })
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

const adminDeleteBook = async (req, res) => {
  try {
    await prisma.book.update({
      where: { id: req.params.id },
      data: { isActive: false }
    })
    return formatResponse(res, 200, 'Đã xóa sách')
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

// ─── CATEGORIES ───
const adminGetCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { books: true } } }
    })
    return formatResponse(res, 200, 'OK', categories)
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

const adminCreateCategory = async (req, res) => {
  try {
    const { name, description, image } = req.body
    if (!name) return formatResponse(res, 400, 'Thiếu tên danh mục')

    const slug = slugify(name, { lower: true, strict: true, locale: 'vi' })
    const category = await prisma.category.create({
      data: { name, slug, description, image }
    })
    return formatResponse(res, 201, 'Tạo danh mục thành công', category)
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

const adminUpdateCategory = async (req, res) => {
  try {
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: req.body
    })
    return formatResponse(res, 200, 'Cập nhật thành công', category)
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

// ─── ORDERS ───
const adminGetOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const where = { ...(status && { status }) }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true, phone: true } },
          address: true,
          items: { include: { book: { select: { title: true, coverImage: true } } } }
        }
      }),
      prisma.order.count({ where })
    ])

    return formatResponse(res, 200, 'OK', {
      orders,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
    })
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

const adminUpdateOrder = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus })
      }
    })
    return formatResponse(res, 200, 'Cập nhật đơn hàng thành công', order)
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

// ─── USERS ───
const adminGetUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      })
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, email: true,
          phone: true, role: true, isActive: true, createdAt: true,
          _count: { select: { orders: true } }
        }
      }),
      prisma.user.count({ where })
    ])

    return formatResponse(res, 200, 'OK', {
      users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
    })
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

const adminToggleUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!user) return formatResponse(res, 404, 'Không tìm thấy user')

    await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !user.isActive }
    })

    return formatResponse(res, 200, user.isActive ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản')
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

// ─── COUPONS ───
const adminGetCoupons = async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })
    return formatResponse(res, 200, 'OK', coupons)
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

const adminCreateCoupon = async (req, res) => {
  try {
    const { code, type, value, minOrder, maxDiscount, usageLimit, expiresAt } = req.body
    if (!code || !type || !value) return formatResponse(res, 400, 'Thiếu thông tin')

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(), type,
        value: parseFloat(value),
        minOrder: minOrder ? parseFloat(minOrder) : 0,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    })
    return formatResponse(res, 201, 'Tạo mã giảm giá thành công', coupon)
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

const adminToggleCoupon = async (req, res) => {
  try {
    const coupon = await prisma.coupon.findUnique({ where: { id: req.params.id } })
    if (!coupon) return formatResponse(res, 404, 'Không tìm thấy mã')

    await prisma.coupon.update({
      where: { id: req.params.id },
      data: { isActive: !coupon.isActive }
    })
    return formatResponse(res, 200, 'Đã cập nhật trạng thái mã giảm giá')
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

module.exports = {
  getDashboard,
  adminGetBooks, adminCreateBook, adminUpdateBook, adminDeleteBook,
  adminGetCategories, adminCreateCategory, adminUpdateCategory,
  adminGetOrders, adminUpdateOrder,
  adminGetUsers, adminToggleUser,
  adminGetCoupons, adminCreateCoupon, adminToggleCoupon
}