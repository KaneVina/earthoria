const prisma = require('../config/db')
const { formatResponse } = require('../utils/helpers')
const { encodeId, decodeId } = require('../utils/hashids')

// Helper encode book
const encodeBook = (book) => ({
  ...book,
  hashId: encodeId(book.id),
  url: `/${book.slug}/${encodeId(book.id)}`
})

const FEATURE_FIELD = { ar: 'hasAR', ai: 'hasAI', '3d': 'has3DAudio' }

// Chọn variant đại diện để lấy price/salePrice hiển thị ở list (ưu tiên PHYSICAL, fallback DIGITAL)
const pickDisplayVariant = (variants = []) =>
  variants.find((v) => v.format === 'PHYSICAL') || variants[0] || null

const withDisplayPrice = (book) => {
  const variant = pickDisplayVariant(book.variants)
  return {
    ...book,
    price: variant?.price ?? null,
    salePrice: variant?.salePrice ?? null,
    variants: undefined
  }
}

// Sách đạt ngưỡng đánh giá trung bình >= threshold
const getBookIdsWithMinRating = async (threshold) => {
  const grouped = await prisma.review.groupBy({
    by: ['bookId'],
    _avg: { rating: true }
  })
  return grouped
    .filter((g) => (g._avg.rating || 0) >= parseFloat(threshold))
    .map((g) => g.bookId)
}

// Dựng where dùng chung cho getBooks + getFilterCounts.
// `exclude` cho phép bỏ qua 1 chiều lọc để đếm "nếu không áp chiều đó thì còn bao nhiêu sách"
// (kiểu facet count chuẩn của e-commerce: đếm category thì bỏ qua category đang chọn, v.v.)
const buildWhere = async (query, exclude = {}) => {
  const {
    category, search, minPrice, maxPrice,
    minAge, maxAge, minRating, features, featured
  } = query

  let ratingBookIds = null
  if (minRating && !exclude.rating) {
    ratingBookIds = await getBookIdsWithMinRating(minRating)
  }

  const featureList = (!exclude.features && features) ? String(features).split(',').filter(Boolean) : []
  const featureConditions = featureList
    .map((f) => (f === 'featured' ? { isFeatured: true } : FEATURE_FIELD[f] ? { [FEATURE_FIELD[f]]: true } : null))
    .filter(Boolean)

  const andConditions = []
  if (search) {
    andConditions.push({
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    })
  }
  // Độ tuổi: lấy sách có khoảng tuổi giao với khoảng lọc [minAge, maxAge]
  if (minAge) {
    andConditions.push({ OR: [{ ageMax: null }, { ageMax: { gte: parseInt(minAge) } }] })
  }
  if (maxAge) {
    andConditions.push({ OR: [{ ageMin: null }, { ageMin: { lte: parseInt(maxAge) } }] })
  }
  andConditions.push(...featureConditions)

  return {
    isActive: true,
    ...(!exclude.category && category && { category: { slug: category } }),
    ...(featured === 'true' && { isFeatured: true }),
    ...((minPrice || maxPrice) && {
      variants: {
        some: {
          isActive: true,
          price: {
            ...(minPrice && { gte: parseFloat(minPrice) }),
            ...(maxPrice && { lte: parseFloat(maxPrice) })
          }
        }
      }
    }),
    ...(ratingBookIds && { id: { in: ratingBookIds } }),
    ...(andConditions.length > 0 && { AND: andConditions })
  }
}

// Get all books
const getBooks = async (req, res) => {
  try {
    const { page = 1, limit = 12, sort = 'createdAt', order = 'desc' } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where = await buildWhere(req.query)

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where, skip,
        take: parseInt(limit),
        orderBy: { [sort]: order },
        include: {
          category: { select: { name: true, slug: true } },
          reviews: { select: { rating: true } },
          variants: { where: { isActive: true } }
        }
      }),
      prisma.book.count({ where })
    ])

    const result = books.map(book => ({
      ...withDisplayPrice(encodeBook(book)),
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

// Đếm số sách thật cho từng lựa chọn filter ở sidebar (Danh Mục / Tính Năng / Đánh Giá),
// tôn trọng các filter khác đang được áp dụng — không hardcode số nữa.
const getFilterCounts = async (req, res) => {
  try {
    const [categories, whereNoCategory, whereNoFeatures, whereNoRating] = await Promise.all([
      prisma.category.findMany({ where: { isActive: true }, select: { id: true, slug: true, name: true } }),
      buildWhere(req.query, { category: true }),
      buildWhere(req.query, { features: true }),
      buildWhere(req.query, { rating: true })
    ])

    const [categoryGroups, allCount, arCount, aiCount, audioCount, featuredCount, ratingIds5, ratingIds4, ratingIds3] =
      await Promise.all([
        prisma.book.groupBy({ by: ['categoryId'], where: whereNoCategory, _count: { _all: true } }),
        prisma.book.count({ where: whereNoCategory }),
        prisma.book.count({ where: { ...whereNoFeatures, hasAR: true } }),
        prisma.book.count({ where: { ...whereNoFeatures, hasAI: true } }),
        prisma.book.count({ where: { ...whereNoFeatures, has3DAudio: true } }),
        prisma.book.count({ where: { ...whereNoFeatures, isFeatured: true } }),
        getBookIdsWithMinRating(5),
        getBookIdsWithMinRating(4),
        getBookIdsWithMinRating(3)
      ])

    const categoryCountMap = Object.fromEntries(
      categoryGroups.map((g) => [g.categoryId, g._count._all])
    )
    const categoryCounts = {
      all: allCount,
      ...Object.fromEntries(
        categories.map((c) => [c.slug, categoryCountMap[c.id] || 0])
      )
    }

    const countWithRating = async (ids) =>
      prisma.book.count({ where: { ...whereNoRating, id: { in: ids } } })

    const [rating5, rating4, rating3] = await Promise.all([
      countWithRating(ratingIds5),
      countWithRating(ratingIds4),
      countWithRating(ratingIds3)
    ])

    return formatResponse(res, 200, 'OK', {
      categories: categoryCounts,
      features: { ar: arCount, ai: aiCount, '3d': audioCount, featured: featuredCount },
      ratings: { 5: rating5, 4: rating4, 3: rating3 }
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
        },
        variants: { where: { isActive: true } }
      }
    })

    if (!book) return formatResponse(res, 404, 'Không tìm thấy sách')

    const avgRating = book.reviews.length
      ? (book.reviews.reduce((a, b) => a + b.rating, 0) / book.reviews.length).toFixed(1)
      : 0

    return formatResponse(res, 200, 'OK', {
      ...withDisplayPrice(encodeBook(book)),
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
        reviews: { select: { rating: true } },
        variants: { where: { isActive: true } }
      }
    })

    const result = books.map(book => ({
      ...withDisplayPrice(encodeBook(book)),
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
  getBooks, getBook, getFeaturedBooks, getFilterCounts,
  addReview, toggleWishlist, getWishlist
}