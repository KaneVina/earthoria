const prisma = require('../config/db')

const STOPWORDS = new Set([
  'la', 'va', 'cho', 'toi', 'ban', 'co', 'the', 'nao', 'sach', 'be',
  'nha', 'minh', 'mot', 'muon', 'gia', 'nhu', 'khong', 'nhung', 've', 'voi',
  'a', 'nhe', 'nay', 'do', 'oi', 'con', 'day', 'day',
])

function stripAccents(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
}

function extractKeywords(message) {
  const words = stripAccents(message)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
  return [...new Set(words)].slice(0, 8)
}

const BOOK_INCLUDE = {
  variants: { where: { isActive: true } },
  category: { select: { name: true } },
}

async function fuzzyQuery(text, limit) {
  if (!text.trim()) return []
  const rows = await prisma.$queryRaw`
    SELECT b.id,
           GREATEST(
             earthoria_similarity(earthoria_unaccent(lower(b.title)), earthoria_unaccent(lower(${text}))),
             earthoria_similarity(earthoria_unaccent(lower(COALESCE(b.description, ''))), earthoria_unaccent(lower(${text}))) * 0.6
           ) AS score
    FROM "Book" b
    WHERE b."isActive" = true
      AND (
        earthoria_is_similar(earthoria_unaccent(lower(b.title)), earthoria_unaccent(lower(${text})))
        OR earthoria_is_similar(earthoria_unaccent(lower(COALESCE(b.description, ''))), earthoria_unaccent(lower(${text})))
        OR earthoria_unaccent(lower(b.title)) ILIKE '%' || earthoria_unaccent(lower(${text})) || '%'
      )
    ORDER BY score DESC
    LIMIT ${limit}
  `
  return rows
}

/**
 * Trả về tối đa `limit` cuốn sách liên quan nhất tới câu hỏi của khách,
 * kèm điểm khớp (để debug/log nếu cần).
 */
async function fuzzySearchBooks(userMessage, limit = 5) {
  const raw = String(userMessage || '').trim()
  if (!raw) return []

  try {
    const keywords = extractKeywords(raw)
    const keywordQuery = keywords.join(' ')

    // Chạy song song 2 chiến lược: câu gốc (bắt cụm từ nguyên văn) và
    // các từ khoá đã lọc bỏ từ dừng (bắt trường hợp câu dài, nhiều ý).
    const [byRaw, byKeywords] = await Promise.all([
      fuzzyQuery(raw, limit),
      keywordQuery ? fuzzyQuery(keywordQuery, limit) : Promise.resolve([]),
    ])

    const scoreById = new Map()
    for (const r of [...byRaw, ...byKeywords]) {
      const prev = scoreById.get(r.id) || 0
      if (Number(r.score) > prev) scoreById.set(r.id, Number(r.score))
    }

    if (scoreById.size === 0) return []

    const ids = [...scoreById.keys()]
    const books = await prisma.book.findMany({
      where: { id: { in: ids } },
      include: BOOK_INCLUDE,
    })

    return books
      .map((b) => ({ ...b, _score: scoreById.get(b.id) || 0 }))
      .sort((a, b) => b._score - a._score)
      .slice(0, limit)
  } catch (err) {
    // Extension chưa bật hoặc lỗi SQL khác -> fallback an toàn, không để
    // toàn bộ chatbot sập chỉ vì migration chưa chạy trên môi trường đó.
    console.warn('[bookSearch] fuzzy search unavailable, falling back to contains():', err.message)
    const keywords = extractKeywords(raw)
    if (keywords.length === 0) return []
    return prisma.book.findMany({
      where: {
        isActive: true,
        OR: keywords.flatMap((kw) => [
          { title: { contains: kw, mode: 'insensitive' } },
          { description: { contains: kw, mode: 'insensitive' } },
        ]),
      },
      include: BOOK_INCLUDE,
      take: limit,
    })
  }
}

/**
 * Tìm 1 cuốn sách khớp nhất với một tên/nhắc tới cụ thể — dùng cho tool
 * check_stock khi model cần tra 1 cuốn xác định (không phải gợi ý danh sách).
 */
async function fuzzyFindOneBook(query) {
  const results = await fuzzySearchBooks(query, 1)
  return results[0] || null
}

module.exports = { fuzzySearchBooks, fuzzyFindOneBook, extractKeywords }