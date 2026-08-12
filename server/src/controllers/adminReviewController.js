const prisma = require('../config/db')

function serverError(res, err, tag) {
  console.error(`[${tag}]`, err)
  return res.status(500).json({ success: false, message: 'Lỗi server' })
}

const bookSelect = { id: true, title: true, slug: true, coverImage: true }
const userSelect = { id: true, name: true, email: true, avatar: true }
const staffSelect = { id: true, name: true, avatar: true }

//    GET /admin/reviews — danh sách đánh giá, staff/admin đều xem được
exports.getReviews = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 15))
    const skip = (page - 1) * limit

    const rating = parseInt(req.query.rating)
    const hasReply = req.query.hasReply
    const isVisible = req.query.isVisible
    const search = req.query.search?.trim()

    const where = {
      ...(rating >= 1 && rating <= 5 ? { rating } : {}),
      ...(hasReply === 'true' ? { repliedAt: { not: null } } : {}),
      ...(hasReply === 'false' ? { repliedAt: null } : {}),
      ...(isVisible === 'true' ? { isVisible: true } : {}),
      ...(isVisible === 'false' ? { isVisible: false } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { content: { contains: search, mode: 'insensitive' } },
              { book: { title: { contains: search, mode: 'insensitive' } } },
              { user: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    }

    const [reviews, total, ratingGroups] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          book: { select: bookSelect },
          user: { select: userSelect },
          repliedBy: { select: staffSelect },
          _count: { select: { votes: true } },
        },
      }),
      prisma.review.count({ where }),
      prisma.review.groupBy({ by: ['rating'], _count: { _all: true } }),
    ])

    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    ratingGroups.forEach((g) => { ratingCounts[g.rating] = g._count._all })

    return res.json({
      success: true,
      data: {
        reviews,
        total,
        totalPages: Math.ceil(total / limit),
        ratingCounts,
      },
    })
  } catch (err) {
    return serverError(res, err, 'getReviews')
  }
}

//    GET /admin/reviews/:id — chi tiết 1 đánh giá
exports.getReviewById = async (req, res) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: req.params.id },
      include: {
        book: { select: bookSelect },
        user: { select: userSelect },
        repliedBy: { select: staffSelect },
        _count: { select: { votes: true } },
      },
    })
    if (!review) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' })
    }
    return res.json({ success: true, data: review })
  } catch (err) {
    return serverError(res, err, 'getReviewById')
  }
}

//    POST /admin/reviews/:id/reply
exports.replyToReview = async (req, res) => {
  try {
    const { message } = req.body
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung phản hồi không được để trống' })
    }

    const review = await prisma.review.findUnique({ where: { id: req.params.id } })
    if (!review) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' })
    }

    const updated = await prisma.review.update({
      where: { id: review.id },
      data: {
        reply: message.trim(),
        repliedAt: new Date(),
        repliedById: req.user.id,
      },
      include: {
        book: { select: bookSelect },
        user: { select: userSelect },
        repliedBy: { select: staffSelect },
      },
    })

    return res.json({ success: true, message: 'Đã gửi phản hồi', data: updated })
  } catch (err) {
    return serverError(res, err, 'replyToReview')
  }
}

//    PATCH /admin/reviews/:id/visibility — ẩn/hiện đánh giá vi phạm, spam
exports.toggleReviewVisibility = async (req, res) => {
  try {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } })
    if (!review) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' })
    }

    const updated = await prisma.review.update({
      where: { id: review.id },
      data: { isVisible: !review.isVisible },
    })

    return res.json({ success: true, data: updated })
  } catch (err) {
    return serverError(res, err, 'toggleReviewVisibility')
  }
}