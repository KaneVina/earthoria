const prisma = require('../config/db')
const { formatResponse } = require('../utils/helpers')
const { encodeId, decodeId } = require('../utils/hashids')

// Helper encode book
const encodeBook = (book) => ({
  ...book,
  hashId: encodeId(book.id),
  url: `/${book.slug}/${encodeId(book.id)}`
})

// Get all books
const getBooks = async (req, res) => {
  try {
    const {
      page = 1, limit = 12, category,
      search, minPrice, maxPrice,
      sort = 'createdAt', order = 'desc',
      featured
    } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where = {
      isActive: true,
      ...(category && { category: { slug: category } }),
      ...(featured === 'true' && { isFeatured: true }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...((minPrice || maxPrice) && {
        price: {
          ...(minPrice && { gte: parseFloat(minPrice) }),
          ...(maxPrice && { lte: parseFloat(maxPrice) })
        }
      })
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where, skip,
        take: parseInt(limit),
        orderBy: { [sort]: order },
        include: {
          category: { select: { name: true, slug: true } },
          reviews: { select: { rating: true } }
        }
      }),
      prisma.book.count({ where })
    ])

    const result = books.map(book => ({
      ...encodeBook(book),
      avgRating: book.reviews.length
        ? (book.reviews.reduce((a, b) => a + b.rating, 0) / book.reviews.length).toFixed(1)
        : 0,
      reviewCount: book.reviews.length,
      reviews: undefined
    }))

    return formatResponse(res, 200, 'OK', {
      books: result,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error(error)
    return formatResponse(res, 500, 'Lỗi server')
  }
}

// Get single book by slug + hashId
const getBook = async (req, res) => {
  try {
    const { slug, hashId } = req.params

    // Decode hashId -> UUID
    const realId = decodeId(hashId)
    if (!realId) return formatResponse(res, 404, 'Không tìm thấy sách')

    const book = await prisma.book.findFirst({
      where: { slug, id: realId, isActive: true },
      include: {
        category: true,
        reviews: {
          where: { isVisible: true },
          include: { user: { select: { name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    })

    if (!book) return formatResponse(res, 404, 'Không tìm thấy sách')

    const avgRating = book.reviews.length
      ? (book.reviews.reduce((a, b) => a + b.rating, 0) / book.reviews.length).toFixed(1)
      : 0

    return formatResponse(res, 200, 'OK', {
      ...encodeBook(book),
      avgRating,
      reviewCount: book.reviews.length
    })
  } catch (error) {
    console.error(error)
    return formatResponse(res, 500, 'Lỗi server')
  }
}

// Get featured books
const getFeaturedBooks = async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      where: { isActive: true, isFeatured: true },
      take: 8,
      include: {
        category: { select: { name: true, slug: true } },
        reviews: { select: { rating: true } }
      }
    })

    const result = books.map(book => ({
      ...encodeBook(book),
      avgRating: book.reviews.length
        ? (book.reviews.reduce((a, b) => a + b.rating, 0) / book.reviews.length).toFixed(1)
        : 0,
      reviewCount: book.reviews.length,
      reviews: undefined
    }))

    return formatResponse(res, 200, 'OK', result)
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

// Add review
const addReview = async (req, res) => {
  try {
    const { rating, title, content } = req.body
    const { slug, hashId } = req.params

    const realId = decodeId(hashId)
    if (!realId) return formatResponse(res, 404, 'Không tìm thấy sách')

    const book = await prisma.book.findFirst({ where: { slug, id: realId } })
    if (!book) return formatResponse(res, 404, 'Không tìm thấy sách')

    const existing = await prisma.review.findFirst({
      where: { userId: req.user.id, bookId: book.id }
    })
    if (existing) return formatResponse(res, 400, 'Bạn đã đánh giá sách này rồi')

    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        bookId: book.id,
        rating: parseInt(rating),
        title,
        content
      },
      include: { user: { select: { name: true, avatar: true } } }
    })

    return formatResponse(res, 201, 'Đánh giá thành công', review)
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

// Toggle wishlist
const toggleWishlist = async (req, res) => {
  try {
    const { slug, hashId } = req.params
    const realId = decodeId(hashId)
    if (!realId) return formatResponse(res, 404, 'Không tìm thấy sách')

    const book = await prisma.book.findFirst({ where: { slug, id: realId } })
    if (!book) return formatResponse(res, 404, 'Không tìm thấy sách')

    const existing = await prisma.wishlist.findUnique({
      where: { userId_bookId: { userId: req.user.id, bookId: book.id } }
    })

    if (existing) {
      await prisma.wishlist.delete({
        where: { userId_bookId: { userId: req.user.id, bookId: book.id } }
      })
      return formatResponse(res, 200, 'Đã xóa khỏi yêu thích')
    }

    await prisma.wishlist.create({
      data: { userId: req.user.id, bookId: book.id }
    })
    return formatResponse(res, 200, 'Đã thêm vào yêu thích')
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

// Get wishlist
const getWishlist = async (req, res) => {
  try {
    const wishlist = await prisma.wishlist.findMany({
      where: { userId: req.user.id },
      include: {
        book: {
          include: { category: { select: { name: true, slug: true } } }
        }
      }
    })

    const result = wishlist.map(w => encodeBook(w.book))
    return formatResponse(res, 200, 'OK', result)
  } catch (error) {
    return formatResponse(res, 500, 'Lỗi server')
  }
}

module.exports = {
  getBooks, getBook, getFeaturedBooks,
  addReview, toggleWishlist, getWishlist
}