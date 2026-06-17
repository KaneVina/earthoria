const prisma = require('../config/db')
const { formatResponse } = require('../utils/helpers')
const { decodeId } = require('../utils/hashids')

const BOOK_SELECT = {
  id: true, title: true, slug: true,
  price: true, salePrice: true,
  coverImage: true, stock: true
}

// Lấy danh sách wishlist của user hiện tại
const getWishlist = async (req, res) => {
  try {
    const wishlist = await prisma.wishlist.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: { book: { select: BOOK_SELECT } }
    })

    return formatResponse(res, 200, 'OK', {
      items: wishlist,
      count: wishlist.length
    })
  } catch (error) {
    console.error(error)
    return formatResponse(res, 500, 'Lỗi server')
  }
}

// Bấm tim: chưa có -> thêm, đã có -> xoá
const toggleWishlist = async (req, res) => {
  try {
    const { hashId } = req.params
    const realId = decodeId(hashId)
    if (!realId) return formatResponse(res, 404, 'Không tìm thấy sách')

    const book = await prisma.book.findFirst({
      where: { id: realId, isActive: true }
    })
    if (!book) return formatResponse(res, 404, 'Không tìm thấy sách')

    const existing = await prisma.wishlist.findUnique({
      where: { userId_bookId: { userId: req.user.id, bookId: book.id } }
    })

    let added
    if (existing) {
      await prisma.wishlist.delete({ where: { id: existing.id } })
      added = false
    } else {
      await prisma.wishlist.create({
        data: { userId: req.user.id, bookId: book.id }
      })
      added = true
    }

    return formatResponse(
      res, 200,
      added ? 'Đã thêm vào yêu thích' : 'Đã xoá khỏi yêu thích',
      { added }
    )
  } catch (error) {
    console.error(error)
    return formatResponse(res, 500, 'Lỗi server')
  }
}

// Xoá tường minh (dùng cho trang Wishlist, không toggle ngược lại)
const removeFromWishlist = async (req, res) => {
  try {
    const { hashId } = req.params
    const realId = decodeId(hashId)
    if (!realId) return formatResponse(res, 404, 'Không tìm thấy sách')

    await prisma.wishlist.deleteMany({
      where: { userId: req.user.id, bookId: realId }
    })

    return formatResponse(res, 200, 'Đã xoá khỏi yêu thích')
  } catch (error) {
    console.error(error)
    return formatResponse(res, 500, 'Lỗi server')
  }
}

module.exports = { getWishlist, toggleWishlist, removeFromWishlist }