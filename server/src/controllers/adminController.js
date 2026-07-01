// src/controllers/adminController.js
const prisma = require('../config/db')

/* ─── Helpers ─── */
const CHART_COLORS = {
  PENDING:   '#eda100',
  CONFIRMED: '#2a78d6',
  SHIPPING:  '#4a3aa7',
  DELIVERED: '#4a9e3f',
  CANCELLED: '#e34948',
  REFUNDED:  '#e34948',
}

const STATUS_LABEL = {
  PENDING:   'Chờ xử lý',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING:  'Vận chuyển',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Hủy đơn',
  REFUNDED:  'Hoàn tiền',
}

/* helper: tính thời gian tương đối */
function formatRelativeTime(date) {
  const diff = Date.now() - new Date(date).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  <  1)  return 'Vừa xong'
  if (mins  < 60)  return `${mins} phút trước`
  if (hours < 24)  return `${hours} giờ trước`
  return `${days} ngày trước`
}

/* Schema dùng UNPAID, frontend expect PENDING → map lại */
function mapPaymentStatus(status) {
  if (status === 'UNPAID') return 'PENDING'
  return status
}


/* ══════════════════════════════════════════════
   USER CODE GENERATION
   Format: ETR + RoleChar + MM + DD + YY + SEQ(3) + rand(2)
   Example: ETRC062926001ak
   RoleChar: C=CUSTOMER, A=ADMIN, S=STAFF
══════════════════════════════════════════════ */
const ROLE_CHAR = { CUSTOMER: 'C', ADMIN: 'A', STAFF: 'S' }
const RAND_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'

function randomStr(len) {
  let s = ''
  for (let i = 0; i < len; i++) {
    s += RAND_CHARS[Math.floor(Math.random() * RAND_CHARS.length)]
  }
  return s
}

/**
 * Sinh userCode theo format ETR{Role}{MM}{DD}{YY}{SEQ3}{rand2}
 * Dùng transaction để tăng sequence an toàn (atomic).
 * @param {string} role - 'CUSTOMER' | 'ADMIN' | 'STAFF'
 * @param {Date}   date - ngày đăng ký (default: now)
 */
async function generateUserCode(role, date = new Date()) {
  const mm  = String(date.getMonth() + 1).padStart(2, '0')
  const dd  = String(date.getDate()).padStart(2, '0')
  const yy  = String(date.getFullYear()).slice(-2)
  const key = `${date.getFullYear()}${mm}${dd}` // "YYYYMMDD"

  // Atomic increment của sequence theo ngày
  const record = await prisma.userCodeSeq.upsert({
    where:  { date: key },
    update: { seq: { increment: 1 } },
    create: { date: key, seq: 1 },
  })

  const seq  = String(record.seq).padStart(3, '0')
  const rand = randomStr(2)
  const rc   = ROLE_CHAR[role] ?? 'C'

  return `ETR${rc}${mm}${dd}${yy}${seq}${rand}`
}

/**
 * Backfill: gắn userCode cho tất cả user chưa có mã.
 * Chỉ cần chạy 1 lần sau migration.
 */
async function backfillUserCodes() {
  const users = await prisma.user.findMany({
    where:   { userCode: null },
    select:  { id: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  for (const user of users) {
    const code = await generateUserCode(user.role, user.createdAt)
    await prisma.user.update({
      where: { id: user.id },
      data:  { userCode: code },
    })
  }

  return users.length
}


/* ══════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════ */
exports.getDashboard = async (req, res) => {
  try {
    const now = new Date()

    const [totalUsers, totalBooks, totalOrders, revenueAgg] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.book.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { paymentStatus: 'PAID' },
      }),
    ])

    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
      return { year: d.getFullYear(), month: d.getMonth() + 1 }
    })

    const revenueChart = await Promise.all(
      months.map(async ({ year, month }) => {
        const start = new Date(year, month - 1, 1)
        const end   = new Date(year, month, 1)
        const agg = await prisma.order.aggregate({
          _sum:   { total: true },
          _count: { _all: true },
          where: {
            createdAt:     { gte: start, lt: end },
            paymentStatus: 'PAID',
          },
        })
        return {
          month:   `T${month}`,
          revenue: Math.round(((agg._sum.total ?? 0) / 1_000_000) * 10) / 10,
          orders:  agg._count._all,
        }
      })
    )

    const statusGroups = await prisma.order.groupBy({
      by:     ['status'],
      _count: { _all: true },
    })
    const totalForPct      = statusGroups.reduce((s, g) => s + g._count._all, 0) || 1
    const orderStatusChart = statusGroups.map(g => ({
      name:  STATUS_LABEL[g.status] ?? g.status,
      value: Math.round((g._count._all / totalForPct) * 100),
      color: CHART_COLORS[g.status] ?? '#999',
    }))

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const topItems = await prisma.orderItem.groupBy({
      by:      ['bookId'],
      _sum:    { quantity: true },
      where:   { order: { createdAt: { gte: monthStart } } },
      orderBy: { _sum: { quantity: 'desc' } },
      take:    5,
    })
    const topBooksRaw = await prisma.book.findMany({
      where:  { id: { in: topItems.map(i => i.bookId) } },
      select: { id: true, title: true },
    })
    const topBooks = topItems.map(item => ({
      title: topBooksRaw.find(b => b.id === item.bookId)?.title ?? '—',
      sold:  item._sum.quantity ?? 0,
    }))

    const recentOrders = await prisma.order.findMany({
      take:    8,
      orderBy: { createdAt: 'desc' },
      include: {
        user:  { select: { name: true, email: true } },
        items: { select: { quantity: true, price: true } },
      },
    })

    const [latestOrders, latestUsers] = await Promise.all([
      prisma.order.findMany({
        take:    5,
        orderBy: { createdAt: 'desc' },
        select:  { id: true, status: true, total: true, createdAt: true },
      }),
      prisma.user.findMany({
        take:    3,
        orderBy: { createdAt: 'desc' },
        where:   { role: 'CUSTOMER' },
        select:  { email: true, createdAt: true },
      }),
    ])

    const activityRaw = [
      ...latestOrders.map(o => ({
        time: o.createdAt,
        type: o.status === 'DELIVERED' ? 'green' : o.status === 'CANCELLED' ? 'red' : 'blue',
        text: `Đơn hàng #${o.id.slice(0, 8)} — ${STATUS_LABEL[o.status] ?? o.status}`,
      })),
      ...latestUsers.map(u => ({
        time: u.createdAt,
        type: 'amber',
        text: `Người dùng mới đăng ký: ${u.email}`,
      })),
    ]
    const activity = activityRaw
      .sort((a, b) => b.time - a.time)
      .slice(0, 6)
      .map(item => ({
        type: item.type,
        text: item.text,
        time: formatRelativeTime(item.time),
      }))

    return res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalBooks,
          totalOrders,
          revenue: revenueAgg._sum.total ?? 0,
        },
        revenueChart,
        orderStatusChart,
        topBooks,
        recentOrders,
        activity,
      },
    })
  } catch (err) {
    console.error('[getDashboard]', err)
    return res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}


/* ══════════════════════════════════════════════
   PRODUCTS (books)
══════════════════════════════════════════════ */

/**
 * Nhận `authors` từ body (chuỗi "Nguyễn Nhật Ánh, Tô Hoài" hoặc mảng tên),
 * tìm-hoặc-tạo từng Author theo tên (unique), trả về mảng authorId
 * đúng theo thứ tự nhập (dùng để set field `order` trong BookAuthor).
 */
async function resolveAuthorIds(authorsInput) {
  if (!authorsInput) return []
  const names = Array.isArray(authorsInput)
    ? authorsInput
    : String(authorsInput).split(',')
  const cleanNames = [...new Set(names.map(n => n.trim()).filter(Boolean))]

  const authorIds = []
  for (const name of cleanNames) {
    const author = await prisma.author.upsert({
      where:  { name },
      update: {},
      create: { name },
    })
    authorIds.push(author.id)
  }
  return authorIds
}

/** Helper: gắn danh sách tên author vào 1 book (đã include authors.author) */
function withAuthorNames(book) {
  return {
    ...book,
    authors: (book.authors ?? []).map(ba => ba.author.name),
  }
}

exports.getProducts = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1)
    const limit  = Math.max(1, parseInt(req.query.limit) || 12)
    const search = req.query.search?.trim() ?? ''

    const id         = req.query.id?.trim()         ?? ''
    const categoryId = req.query.categoryId?.trim() ?? ''
    const language   = req.query.language?.trim()   ?? ''
    const status     = req.query.status?.trim()     ?? '' // 'active' | 'inactive'
    const ageMin     = req.query.ageMin !== undefined && req.query.ageMin !== '' ? parseInt(req.query.ageMin) : null
    const ageMax     = req.query.ageMax !== undefined && req.query.ageMax !== '' ? parseInt(req.query.ageMax) : null

    const skip = (page - 1) * limit

    // ── Build where clause ──
    const conditions = []

    // Tìm theo ID — cho phép nhập ID đầy đủ hoặc chỉ vài ký tự đầu
    // (bảng admin chỉ hiển thị 8 ký tự đầu của ID nên filter phải khớp kiểu "bắt đầu bằng")
    if (id) conditions.push({ id: { startsWith: id, mode: 'insensitive' } })

    // Tìm theo tên sách / nhà xuất bản
    if (search) {
      conditions.push({
        OR: [
          { title:     { contains: search, mode: 'insensitive' } },
          { publisher: { contains: search, mode: 'insensitive' } },
        ],
      })
    }

    if (categoryId) conditions.push({ categoryId })
    if (language)   conditions.push({ language })

    if (status === 'active')   conditions.push({ isActive: true })
    if (status === 'inactive') conditions.push({ isActive: false })

    // Lọc theo độ tuổi: sách "phù hợp" nếu khoảng tuổi sách giao với khoảng tuổi lọc
    // (sách không set ageMin/ageMax được coi là phù hợp mọi lứa tuổi -> không loại)
    if (ageMin !== null) conditions.push({ OR: [{ ageMax: null }, { ageMax: { gte: ageMin } }] })
    if (ageMax !== null) conditions.push({ OR: [{ ageMin: null }, { ageMin: { lte: ageMax } }] })

    const where = conditions.length ? { AND: conditions } : {}

    const [products, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
          _count:   { select: { orderItems: true } },
          authors:  { include: { author: true }, orderBy: { order: 'asc' } },
        },
      }),
      prisma.book.count({ where }),
    ])

    const mapped = products.map(p => ({ ...withAuthorNames(p), isVisible: p.isActive }))

    return res.json({
      success: true,
      data: {
        products:   mapped,
        total,
        totalPages: Math.ceil(total / limit),
        page,
      },
    })
  } catch (err) {
    console.error('[getProducts]', err)
    return res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}

exports.createProduct = async (req, res) => {
  try {
    const {
      title, description, price, salePrice, dealerPrice, stock,
      categoryId, isVisible, publisher, pages, language, authors,
      publishYear, dimensions, weightGrams, coverType, paperType,
      ageMin, ageMax,
    } = req.body

    if (!title || !price || !categoryId) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc (title, price, categoryId)' })
    }

    const slugify = require('slugify')
    const slug = slugify(title, { lower: true, locale: 'vi', strict: true })
    const existing = await prisma.book.findUnique({ where: { slug } })
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug

    const authorIds = await resolveAuthorIds(authors)

    const book = await prisma.book.create({
      data: {
        title,
        slug:        finalSlug,
        description: description ?? null,
        price:       Number(price),
        salePrice:   salePrice   ? Number(salePrice)   : null,
        dealerPrice: dealerPrice ? Number(dealerPrice) : null,
        stock:       Number(stock) || 0,
        categoryId,
        isActive:    isVisible !== false,
        publisher:   publisher ?? null,
        pages:       pages ? Number(pages) : null,
        language:    language ?? 'VI',
        publishYear: publishYear ? Number(publishYear) : null,
        dimensions:  dimensions ?? null,
        weightGrams: weightGrams ? Number(weightGrams) : null,
        coverType:   coverType ?? null,
        paperType:   paperType ?? null,
        ageMin:      ageMin !== undefined && ageMin !== '' ? Number(ageMin) : null,
        ageMax:      ageMax !== undefined && ageMax !== '' ? Number(ageMax) : null,
        authors: {
          create: authorIds.map((authorId, i) => ({ authorId, order: i })),
        },
      },
      include: {
        category: { select: { id: true, name: true } },
        authors:  { include: { author: true }, orderBy: { order: 'asc' } },
      },
    })

    return res.status(201).json({ success: true, data: withAuthorNames(book) })
  } catch (err) {
    console.error('[createProduct]', err)
    return res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params
    const {
      title, description, price, salePrice, dealerPrice, stock,
      categoryId, isVisible, publisher, pages, authors, language,
      publishYear, dimensions, weightGrams, coverType, paperType,
      ageMin, ageMax,
    } = req.body

    // Nếu có gửi authors -> resolve trước, rồi xóa hết liên kết cũ và tạo lại theo thứ tự mới
    let authorsUpdate
    if (authors !== undefined) {
      const authorIds = await resolveAuthorIds(authors)
      authorsUpdate = {
        deleteMany: {},
        create: authorIds.map((authorId, i) => ({ authorId, order: i })),
      }
    }

    const book = await prisma.book.update({
      where: { id },
      data: {
        ...(title       !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(price       !== undefined && { price: Number(price) }),
        ...(salePrice   !== undefined && { salePrice: salePrice ? Number(salePrice) : null }),
        ...(dealerPrice !== undefined && { dealerPrice: dealerPrice ? Number(dealerPrice) : null }),
        ...(stock       !== undefined && { stock: Number(stock) }),
        ...(categoryId  !== undefined && { categoryId }),
        ...(isVisible   !== undefined && { isActive: isVisible }),
        ...(publisher   !== undefined && { publisher }),
        ...(pages       !== undefined && { pages: pages ? Number(pages) : null }),
        ...(language    !== undefined && { language }),
        ...(publishYear !== undefined && { publishYear: publishYear ? Number(publishYear) : null }),
        ...(dimensions  !== undefined && { dimensions }),
        ...(weightGrams !== undefined && { weightGrams: weightGrams ? Number(weightGrams) : null }),
        ...(coverType   !== undefined && { coverType }),
        ...(paperType   !== undefined && { paperType }),
        ...(ageMin      !== undefined && { ageMin: ageMin !== '' ? Number(ageMin) : null }),
        ...(ageMax      !== undefined && { ageMax: ageMax !== '' ? Number(ageMax) : null }),
        ...(authorsUpdate && { authors: authorsUpdate }),
      },
      include: {
        category: { select: { id: true, name: true } },
        authors:  { include: { author: true }, orderBy: { order: 'asc' } },
      },
    })

    return res.json({ success: true, data: withAuthorNames(book) })
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sách' })
    }
    console.error('[updateProduct]', err)
    return res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params

    const orderCount = await prisma.orderItem.count({ where: { bookId: id } })
    if (orderCount > 0) {
      await prisma.book.update({ where: { id }, data: { isActive: false } })
      return res.json({ success: true, message: 'Sách đã được ẩn khỏi cửa hàng (có đơn hàng liên quan)' })
    }

    await prisma.book.delete({ where: { id } })
    return res.json({ success: true, message: 'Đã xóa sách thành công' })
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sách' })
    }
    console.error('[deleteProduct]', err)
    return res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}


/* ══════════════════════════════════════════════
   CATEGORIES
══════════════════════════════════════════════ */
exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { books: true } } },
    })
    return res.json({ success: true, data: categories })
  } catch (err) {
    console.error('[getCategories]', err)
    return res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}

exports.createCategory = async (req, res) => {
  try {
    const { name, description, image } = req.body

    if (!name) {
      return res.status(400).json({ success: false, message: 'Tên danh mục là bắt buộc' })
    }

    const slugify = require('slugify')
    const slug = slugify(name, { lower: true, locale: 'vi', strict: true })
    const existing = await prisma.category.findUnique({ where: { slug } })
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug

    const category = await prisma.category.create({
      data: {
        name,
        slug:        finalSlug,
        description: description ?? null,
        image:       image ?? null,
      },
    })

    return res.status(201).json({ success: true, data: category })
  } catch (err) {
    console.error('[createCategory]', err)
    return res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, image, isActive } = req.body

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name        !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(image       !== undefined && { image }),
        ...(isActive    !== undefined && { isActive }),
      },
    })

    return res.json({ success: true, data: category })
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' })
    }
    console.error('[updateCategory]', err)
    return res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}


/* ══════════════════════════════════════════════
   ORDERS
══════════════════════════════════════════════ */
exports.getOrders = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1)
    const limit  = Math.max(1, parseInt(req.query.limit) || 15)
    const status = req.query.status?.trim()
    const skip   = (page - 1) * limit

    const where = status ? { status } : {}

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          items: {
            include: {
              book: { select: { title: true, coverImage: true } },
            },
          },
          address: {
            select: {
              fullName: true,
              phone:    true,
              street:   true,
              ward:     true,
              district: true,
              province: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ])

    const mapped = orders.map(o => ({
      ...o,
      paymentStatus: mapPaymentStatus(o.paymentStatus),
      shippingAddress: o.address
        ? {
            name:    o.address.fullName,
            phone:   o.address.phone,
            address: `${o.address.street}, ${o.address.ward}, ${o.address.district}, ${o.address.province}`,
          }
        : null,
      items: o.items.map(item => ({
        ...item,
        product: item.book,
        title:   item.book?.title,
      })),
    }))

    return res.json({
      success: true,
      data: {
        orders:     mapped,
        total,
        totalPages: Math.ceil(total / limit),
        page,
      },
    })
  } catch (err) {
    console.error('[getOrders]', err)
    return res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id }     = req.params
    const { status } = req.body

    const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'REFUNDED']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' })
    }

    const extraData = status === 'DELIVERED' ? { paymentStatus: 'PAID' } : {}

    const order = await prisma.order.update({
      where: { id },
      data:  { status, ...extraData },
    })

    return res.json({ success: true, data: order })
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' })
    }
    console.error('[updateOrderStatus]', err)
    return res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}


/* ══════════════════════════════════════════════
   USERS
══════════════════════════════════════════════ */

/**
 * GET /admin/users
 * Query params:
 *   page     - số trang (default 1)
 *   limit    - số bản ghi / trang (default 15)
 *   search   - tìm theo tên, email, hoặc userCode
 *   role     - lọc theo role: CUSTOMER | STAFF | ADMIN
 *   status   - lọc theo trạng thái: active | locked
 */
exports.getUsers = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1)
    const limit  = Math.max(1, parseInt(req.query.limit) || 15)
    const search = req.query.search?.trim() ?? ''
    const role   = req.query.role?.trim()   ?? ''
    const status = req.query.status?.trim() ?? ''
    const skip   = (page - 1) * limit

    // ── Build where clause ──
    const conditions = []

    // Full-text search: tên, email, hoặc userCode
    if (search) {
      conditions.push({
        OR: [
          { name:     { contains: search, mode: 'insensitive' } },
          { email:    { contains: search, mode: 'insensitive' } },
          { userCode: { contains: search, mode: 'insensitive' } },
        ],
      })
    }

    // Lọc theo role
    if (role && ['CUSTOMER', 'STAFF', 'ADMIN'].includes(role)) {
      conditions.push({ role })
    }

    // Lọc theo trạng thái
    if (status === 'active') {
      conditions.push({ isActive: true })
    } else if (status === 'locked') {
      conditions.push({ isActive: false })
    }

    const where = conditions.length ? { AND: conditions } : {}

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id:        true,
          name:      true,
          email:     true,
          role:      true,
          isActive:  true,
          userCode:  true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      prisma.user.count({ where }),
    ])

    return res.json({
      success: true,
      data: {
        users,
        total,
        totalPages: Math.ceil(total / limit),
        page,
      },
    })
  } catch (err) {
    console.error('[getUsers]', err)
    return res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}

exports.toggleUser = async (req, res) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' })
    }
    if (user.role === 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Không thể khóa tài khoản Admin' })
    }

    const updated = await prisma.user.update({
      where: { id },
      data:  { isActive: !user.isActive },
    })

    return res.json({ success: true, data: updated })
  } catch (err) {
    console.error('[toggleUser]', err)
    return res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}

/**
 * POST /admin/users/backfill-codes
 * Backfill userCode cho tất cả user cũ chưa có mã.
 * Chỉ chạy 1 lần sau khi migrate schema.
 */
exports.backfillUserCodes = async (req, res) => {
  try {
    const count = await backfillUserCodes()
    return res.json({ success: true, message: `Đã cập nhật mã cho ${count} người dùng` })
  } catch (err) {
    console.error('[backfillUserCodes]', err)
    return res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}

// Export helper để dùng trong auth flow (đăng ký user mới)
exports.generateUserCode = generateUserCode


/* ══════════════════════════════════════════════
   COUPONS
══════════════════════════════════════════════ */
exports.getCoupons = async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return res.json({ success: true, data: coupons })
  } catch (err) {
    console.error('[getCoupons]', err)
    return res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}

exports.createCoupon = async (req, res) => {
  try {
    const {
      code, type, value,
      minOrder, maxDiscount, usageLimit, expiresAt,
    } = req.body

    if (!code || !type || !value) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc (code, type, value)' })
    }

    const validTypes = ['PERCENTAGE', 'FIXED']
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: 'Loại mã không hợp lệ' })
    }
    if (type === 'PERCENTAGE' && (value < 1 || value > 100)) {
      return res.status(400).json({ success: false, message: 'Giá trị phần trăm phải từ 1–100' })
    }

    const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })
    if (existing) {
      return res.status(409).json({ success: false, message: 'Mã code đã tồn tại' })
    }

    const coupon = await prisma.coupon.create({
      data: {
        code:        code.toUpperCase(),
        type,
        value:       Number(value),
        minOrder:    minOrder    ? Number(minOrder)    : 0,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        usageLimit:  usageLimit  ? Number(usageLimit)  : null,
        expiresAt:   expiresAt   ? new Date(expiresAt) : null,
        isActive:    true,
      },
    })

    return res.status(201).json({ success: true, data: coupon })
  } catch (err) {
    console.error('[createCoupon]', err)
    return res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}

exports.toggleCoupon = async (req, res) => {
  try {
    const { id } = req.params

    const coupon = await prisma.coupon.findUnique({ where: { id } })
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá' })
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data:  { isActive: !coupon.isActive },
    })

    return res.json({ success: true, data: updated })
  } catch (err) {
    console.error('[toggleCoupon]', err)
    return res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}

/* ══════════════════════════════════════════════
   AR CODE MANAGEMENT (staff)
══════════════════════════════════════════════ */
const crypto = require('crypto')
const { uploadGlbBuffer } = require('../services/cloudinaryUploadService')

// Chỉ trả chi tiết lỗi thật ra response khi đang chạy dev, tránh lộ
// thông tin nội bộ (đường dẫn, config, stack) khi đã lên production.
const isDev = process.env.NODE_ENV !== 'production'
function serverError(res, err, tag) {
  console.error(`[${tag}]`, err)
  return res.status(500).json({
    success: false,
    message: 'Lỗi server',
    // Field này CHỈ xuất hiện ở môi trường dev — dùng để debug nhanh
    // ngay trên Network tab thay vì phải mở terminal backend.
    ...(isDev ? { debug: err.message } : {}),
  })
}

function generateArCode() {
  return crypto.randomBytes(24).toString('base64url')
}

exports.getArCodes = async (req, res) => {
  try {
    const { bookId } = req.params
    const arCodes = await prisma.arCode.findMany({
      where: { bookId },
      orderBy: { createdAt: 'asc' },
    })
    return res.json({ success: true, data: arCodes })
  } catch (err) {
    return serverError(res, err, 'getArCodes')
  }
}

exports.createArCode = async (req, res) => {
  try {
    const { bookId } = req.params
    const { label } = req.body

    if (!label) {
      return res.status(400).json({ success: false, message: 'Thiếu label' })
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Thiếu file .glb' })
    }

    const book = await prisma.book.findUnique({ where: { id: bookId } })
    if (!book) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sách' })
    }

    const code = generateArCode()
    const uploadResult = await uploadGlbBuffer(req.file.buffer, code)

    const arCode = await prisma.arCode.create({
      data: {
        code,
        label,
        modelUrl: uploadResult.secure_url,
        bookId,
      },
    })

    return res.status(201).json({ success: true, data: arCode })
  } catch (err) {
    return serverError(res, err, 'createArCode')
  }
}

exports.updateArCode = async (req, res) => {
  try {
    const { id } = req.params
    const { label } = req.body

    const existing = await prisma.arCode.findUnique({ where: { id } })
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mã AR' })
    }

    const data = {}
    if (label) data.label = label

    if (req.file) {
      const uploadResult = await uploadGlbBuffer(req.file.buffer, existing.code)
      data.modelUrl = uploadResult.secure_url
    }

    const arCode = await prisma.arCode.update({ where: { id }, data })
    return res.json({ success: true, data: arCode })
  } catch (err) {
    return serverError(res, err, 'updateArCode')
  }
}

exports.toggleArCode = async (req, res) => {
  try {
    const { id } = req.params
    const existing = await prisma.arCode.findUnique({ where: { id } })
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mã AR' })
    }

    const arCode = await prisma.arCode.update({
      where: { id },
      data: { isActive: !existing.isActive },
    })
    return res.json({ success: true, data: arCode })
  } catch (err) {
    return serverError(res, err, 'toggleArCode')
  }
}