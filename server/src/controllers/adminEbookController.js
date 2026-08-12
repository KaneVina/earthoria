const prisma = require('../config/db')
const {
  uploadEbookImageBuffer,
  deleteImageByPublicId,
  extractPublicId,
} = require('../services/cloudinaryUploadService')

const isDev = process.env.NODE_ENV !== 'production'
function serverError(res, err, tag) {
  console.error(`[${tag}]`, err)
  return res.status(500).json({
    success: false,
    message: 'Lỗi server',
    ...(isDev ? { debug: err.message } : {}),
  })
}

function emptyPage() {
  return { id: `pg_${Date.now().toString(36)}`, title: '', background: '#fffdf8', layers: [] }
}

function validatePages(pages) {
  if (!Array.isArray(pages) || pages.length === 0) return 'Sách cần có ít nhất 1 trang'
  if (pages.length > 200) return 'Sách vượt quá số trang tối đa (200)'
  for (const p of pages) {
    if (!p || typeof p !== 'object') return 'Dữ liệu trang không hợp lệ'
    if (!Array.isArray(p.layers)) return 'Dữ liệu lớp nội dung không hợp lệ'
  }
  return null
}

/* ══════════════════════════════════════════════
   DANH SÁCH — GỘP THEO SÁCH (giống getGamesGroupedAll)
══════════════════════════════════════════════ */
exports.getEbooksGroupedAll = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.max(1, parseInt(req.query.limit) || 8)
    const search = req.query.search?.trim() ?? ''
    const status = req.query.status?.trim() ?? ''

    const ebookWhere = {}
    if (status === 'active') ebookWhere.isActive = true
    if (status === 'inactive') ebookWhere.isActive = false

    const bookWhere = { ebooks: { some: ebookWhere } }

    if (search) {
      bookWhere.AND = [
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            {
              ebooks: {
                some: {
                  ...ebookWhere,
                  title: { contains: search, mode: 'insensitive' },
                },
              },
            },
          ],
        },
      ]
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where: bookWhere,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { title: 'asc' },
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
          ebooks: {
            where: ebookWhere,
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      prisma.book.count({ where: bookWhere }),
    ])

    const groups = books
      .filter((b) => b.ebooks.length > 0)
      .map((b) => ({
        book: { id: b.id, title: b.title, slug: b.slug, coverImage: b.coverImage },
        ebooks: b.ebooks.map((e) => ({ ...e, pageCount: Array.isArray(e.pages) ? e.pages.length : 0 })),
      }))

    return res.json({
      success: true,
      data: {
        groups,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        page,
      },
    })
  } catch (err) {
    return serverError(res, err, 'getEbooksGroupedAll')
  }
}

exports.getEbooksForBook = async (req, res) => {
  try {
    const { bookId } = req.params
    const ebooks = await prisma.ebook.findMany({
      where: { bookId },
      orderBy: { createdAt: 'asc' },
    })
    return res.json({ success: true, data: ebooks })
  } catch (err) {
    return serverError(res, err, 'getEbooksForBook')
  }
}

exports.getEbookById = async (req, res) => {
  try {
    const { id } = req.params
    const ebook = await prisma.ebook.findUnique({
      where: { id },
      include: {
        book: { select: { id: true, title: true, slug: true, coverImage: true } },
      },
    })
    if (!ebook) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sách điện tử' })
    }
    return res.json({ success: true, data: ebook })
  } catch (err) {
    return serverError(res, err, 'getEbookById')
  }
}

exports.createEbook = async (req, res) => {
  try {
    const { bookId } = req.params
    const { title, pages, thumbnailUrl } = req.body

    if (!title?.trim()) return res.status(400).json({ success: false, message: 'Thiếu tên sách điện tử' })

    const book = await prisma.book.findUnique({ where: { id: bookId } })
    if (!book) return res.status(404).json({ success: false, message: 'Không tìm thấy sách' })

    const finalPages = Array.isArray(pages) && pages.length ? pages : [emptyPage()]
    const pagesError = validatePages(finalPages)
    if (pagesError) return res.status(400).json({ success: false, message: pagesError })

    const ebook = await prisma.ebook.create({
      data: {
        title: title.trim(),
        pages: finalPages,
        thumbnailUrl: thumbnailUrl || null,
        bookId,
      },
    })

    return res.status(201).json({ success: true, data: ebook })
  } catch (err) {
    return serverError(res, err, 'createEbook')
  }
}

exports.updateEbook = async (req, res) => {
  try {
    const { id } = req.params
    const { title, pages, thumbnailUrl, isActive } = req.body

    const existing = await prisma.ebook.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy sách điện tử' })

    const data = {}
    if (title !== undefined) {
      if (!title?.trim()) return res.status(400).json({ success: false, message: 'Tên sách không được để trống' })
      data.title = title.trim()
    }
    if (thumbnailUrl !== undefined) data.thumbnailUrl = thumbnailUrl || null
    if (typeof isActive === 'boolean') data.isActive = isActive

    if (pages !== undefined) {
      const pagesError = validatePages(pages)
      if (pagesError) return res.status(400).json({ success: false, message: pagesError })
      data.pages = pages
    }

    const ebook = await prisma.ebook.update({ where: { id }, data })
    return res.json({ success: true, data: ebook })
  } catch (err) {
    return serverError(res, err, 'updateEbook')
  }
}

exports.toggleEbook = async (req, res) => {
  try {
    const { id } = req.params
    const existing = await prisma.ebook.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy sách điện tử' })

    const ebook = await prisma.ebook.update({
      where: { id },
      data: { isActive: !existing.isActive },
    })
    return res.json({ success: true, data: ebook })
  } catch (err) {
    return serverError(res, err, 'toggleEbook')
  }
}

exports.deleteEbook = async (req, res) => {
  try {
    const { id } = req.params
    const existing = await prisma.ebook.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy sách điện tử' })

    await prisma.ebook.delete({ where: { id } })
    return res.json({ success: true, message: 'Đã xóa sách điện tử' })
  } catch (err) {
    return serverError(res, err, 'deleteEbook')
  }
}

exports.uploadEbookImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Thiếu file ảnh' })
    const ebookId = req.query.ebookId || req.body.ebookId
    const result = await uploadEbookImageBuffer(req.file.buffer, ebookId)
    return res.status(201).json({ success: true, data: { url: result.secure_url } })
  } catch (err) {
    return serverError(res, err, 'uploadEbookImage')
  }
}

exports.deleteEbookImage = async (req, res) => {
  try {
    const { url } = req.body
    if (!url) return res.status(400).json({ success: false, message: 'Thiếu url ảnh' })
    const publicId = extractPublicId(url)
    if (publicId) await deleteImageByPublicId(publicId).catch(() => {})
    return res.json({ success: true })
  } catch (err) {
    return serverError(res, err, 'deleteEbookImage')
  }
}