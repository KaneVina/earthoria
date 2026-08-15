const prisma = require('../config/db')
const { userOwnsDigitalBook } = require('../utils/bookOwnership')
const { encodeId } = require('../utils/hashids')

exports.getEbookForReading = async (req, res) => {
  try {
    const { slug } = req.params

    const book = await prisma.book.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        description: true,
        ageMin: true,
        ageMax: true,
        language: true,
        pages: true,
        publisher: true,
        publishYear: true,
        category: { select: { name: true } },
        authors: { include: { author: true }, orderBy: { order: 'asc' } },
      },
    })
    if (!book) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sách này' })
    }

    const ebook = await prisma.ebook.findFirst({
      where: { bookId: book.id, isActive: true },
    })
    if (!ebook) {
      return res.status(404).json({ success: false, message: 'Sách này chưa có bản điện tử' })
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để đọc sách điện tử' })
    }

    if (req.user.role !== 'ADMIN' && req.user.role !== 'STAFF') {
      const owns = await userOwnsDigitalBook(prisma, req.user.id, book.id)
      if (!owns) {
        return res.status(403).json({
          success: false,
          message: 'Bạn cần mua bản sách điện tử này (đơn hàng đã hoàn tất) để đọc',
        })
      }
    }

    return res.json({
      success: true,
      data: {
        id: ebook.id,
        title: ebook.title,
        pages: ebook.pages,
        orientation: ebook.orientation,
        thumbnailUrl: ebook.thumbnailUrl,
        book: {
          id: book.id,
          title: book.title,
          slug: book.slug,
          coverImage: book.coverImage,
          description: book.description,
          ageMin: book.ageMin,
          ageMax: book.ageMax,
          language: book.language,
          pages: book.pages,
          publisher: book.publisher,
          publishYear: book.publishYear,
          categoryName: book.category?.name || null,
          authors: (book.authors ?? []).map((ba) => ba.author.name),
          hashId: encodeId(book.id),
        },
      },
    })
  } catch (err) {
    console.error('[getEbookForReading]', err)
    return res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}