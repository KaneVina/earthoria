const crypto = require('crypto')
const prisma = require('../config/db')

// ─── Parse duration string kiểu "30d", "20m", "1h" thành mili giây ───
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

// Lỗi riêng để controller phân biệt được nguyên nhân
class RefreshTokenError extends Error {
  constructor(code) {
    super(code)
    this.code = code // 'NOT_FOUND' | 'REUSED' | 'EXPIRED'
  }
}

// ─── Tạo refresh token mới cho user (dùng khi login / OAuth) ───
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

// ─── Verify token gửi lên từ cookie (chưa rotate, chỉ kiểm tra hợp lệ) ───
async function verifyAndConsume(rawToken) {
  const tokenHash = hashToken(rawToken)
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash } })

  if (!record) {
    throw new RefreshTokenError('NOT_FOUND')
  }

  if (record.revokedAt) {
    // Token đã bị revoke (đã dùng rồi hoặc đã logout) mà vẫn được gửi lên
    // => dấu hiệu bị đánh cắp/replay. Revoke toàn bộ session của user này.
    await revokeAllForUser(record.userId)
    throw new RefreshTokenError('REUSED')
  }

  if (record.expiresAt < new Date()) {
    throw new RefreshTokenError('EXPIRED')
  }

  return record
}

// ─── Rotation: revoke token cũ, tạo token mới giữ nguyên chính sách remember ───
async function rotateRefreshToken(oldRecord, meta = {}) {
  const rawToken = generateRawToken()
  const tokenHash = hashToken(rawToken)
  const ttlMs = oldRecord.remember ? REMEMBER_MS : DEFAULT_MS
  const expiresAt = new Date(Date.now() + ttlMs)

  await prisma.$transaction(async (tx) => {
    const newRecord = await tx.refreshToken.create({
      data: {
        userId: oldRecord.userId,
        tokenHash,
        remember: oldRecord.remember,
        expiresAt,
        userAgent: meta.userAgent || null,
        ip: meta.ip || null,
      }
    })

    await tx.refreshToken.update({
      where: { id: oldRecord.id },
      data: { revokedAt: new Date(), replacedBy: newRecord.id }
    })
  })

  return { rawToken, expiresAt }
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
  verifyAndConsume,
  rotateRefreshToken,
  revokeAllForUser,
  revokeByRawToken,
  RefreshTokenError,
}