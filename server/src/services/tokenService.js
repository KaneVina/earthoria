const crypto = require('crypto')
const prisma = require('../config/db')

function parseDurationMs(str) {
  const match = /^(\d+)([smhd])$/.exec(str)
  if (!match) throw new Error(`Duration không hợp lệ: ${str}`)
  const num = Number(match[1])
  const unit = match[2]
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }
  return num * multipliers[unit]
}

const REMEMBER_MS = parseDurationMs(process.env.JWT_REFRESH_REMEMBER_EXPIRES_IN || '30d')
const DEFAULT_MS  = parseDurationMs(process.env.JWT_REFRESH_DEFAULT_EXPIRES_IN || '1d')

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex')
}

function generateRawToken() {
  return crypto.randomBytes(64).toString('hex')
}

class RefreshTokenError extends Error {
  constructor(code) {
    super(code)
    this.code = code // 'NOT_FOUND' | 'REUSED' | 'EXPIRED'
  }
}

// Cho phép nhiều tab/request dùng chung 1 token vừa bị rotate trong khoảng thời gian ngắn,
// tránh việc mở 2 tab cùng lúc bị coi là tấn công replay và bị logout oan.
// Token bị dùng lại sau khi hết grace period vẫn bị coi là REUSED như cũ (chống đánh cắp token).
const REUSE_GRACE_MS = 10_000
const MAX_CHAIN_HOPS = 5

async function createRefreshToken(userId, remember, meta = {}) {
  const rawToken = generateRawToken()
  const tokenHash = hashToken(rawToken)
  const ttlMs = remember ? REMEMBER_MS : DEFAULT_MS
  const expiresAt = new Date(Date.now() + ttlMs)

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      remember: !!remember,
      expiresAt,
      userAgent: meta.userAgent || null,
      ip: meta.ip || null,
    }
  })

  return { rawToken, expiresAt }
}

// Cố gắng "claim" (revoke) một record còn sống và tạo token mới thay thế nó, tất cả trong
// một transaction. Việc revoke dùng updateMany với điều kiện `revokedAt: null` — đây là bước
// atomic tại DB: nếu 2 request cùng cố claim 1 record, chỉ MỘT request khiến updateMany trả
// về count = 1 (do row lock của DB), request còn lại nhận count = 0 và biết mình đã thua cuộc
// đua, thay vì cả hai đều tưởng mình thành công như flow verify-rồi-rotate riêng lẻ trước đây.
async function claimAndRotate(record, meta) {
  const rawToken = generateRawToken()
  const tokenHash = hashToken(rawToken)
  const ttlMs = record.remember ? REMEMBER_MS : DEFAULT_MS
  const expiresAt = new Date(Date.now() + ttlMs)

  return prisma.$transaction(async (tx) => {
    const newRecord = await tx.refreshToken.create({
      data: {
        userId: record.userId,
        tokenHash,
        remember: record.remember,
        expiresAt,
        userAgent: meta.userAgent || null,
        ip: meta.ip || null,
      }
    })

    const claim = await tx.refreshToken.updateMany({
      where: { id: record.id, revokedAt: null },
      data: { revokedAt: new Date(), replacedBy: newRecord.id }
    })

    if (claim.count === 0) {
      // Request khác đã claim record này trước — huỷ token vừa tạo, coi như thua cuộc đua.
      await tx.refreshToken.delete({ where: { id: newRecord.id } })
      return null
    }

    return { rawToken, expiresAt, userId: record.userId }
  })
}

// Verify + rotate atomically. Thay thế cho cặp verifyAndConsume()/rotateRefreshToken() cũ —
// gộp lại để không còn khoảng hở giữa "đọc token" và "revoke token" mà 2 request đồng thời
// có thể cùng lọt qua.
async function verifyAndRotate(rawToken, meta = {}) {
  const tokenHash = hashToken(rawToken)
  let record = await prisma.refreshToken.findUnique({ where: { tokenHash } })

  if (!record) {
    throw new RefreshTokenError('NOT_FOUND')
  }

  if (record.expiresAt < new Date()) {
    throw new RefreshTokenError('EXPIRED')
  }

  if (!record.revokedAt) {
    const result = await claimAndRotate(record, meta)
    if (result) return result

    // Thua cuộc đua ngay tại claim đầu tiên — đọc lại record (giờ đã bị revoke bởi
    // request thắng) rồi rơi xuống nhánh xử lý "đã revoked" bên dưới.
    record = await prisma.refreshToken.findUnique({ where: { id: record.id } })
  }

  const withinGrace =
    record.revokedAt && Date.now() - record.revokedAt.getTime() < REUSE_GRACE_MS

  if (withinGrace) {
    // Đi theo chuỗi replacedBy để tìm bản ghi còn sống, thử claim tiếp — đảm bảo nhiều
    // tab/request đồng thời dùng chung 1 token cũ vẫn nhận được token mới hợp lệ của
    // riêng mình, thay vì bị coi là tấn công replay.
    let current = record
    let hops = 0
    while (current.replacedBy && hops < MAX_CHAIN_HOPS) {
      const next = await prisma.refreshToken.findUnique({ where: { id: current.replacedBy } })
      if (!next) break
      current = next
      hops++

      if (!current.revokedAt && current.expiresAt >= new Date()) {
        const result = await claimAndRotate(current, meta)
        if (result) return result
        current = await prisma.refreshToken.findUnique({ where: { id: current.id } })
      }
    }
  }

  // Ngoài grace window, hoặc không tìm được bản ghi sống hợp lệ nào trong chuỗi → coi là
  // reuse thật (token cũ bị đánh cắp/dùng lại), thu hồi toàn bộ session của user.
  await revokeAllForUser(record.userId)
  throw new RefreshTokenError('REUSED')
}

async function revokeAllForUser(userId) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() }
  })
}

async function revokeByRawToken(rawToken) {
  const tokenHash = hashToken(rawToken)
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() }
  })
}

module.exports = {
  hashToken,
  createRefreshToken,
  verifyAndRotate,
  revokeAllForUser,
  revokeByRawToken,
  RefreshTokenError,
}