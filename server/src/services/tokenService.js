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

async function verifyAndConsume(rawToken) {
  const tokenHash = hashToken(rawToken)
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash } })

  if (!record) {
    throw new RefreshTokenError('NOT_FOUND')
  }

  if (record.revokedAt) {
    const withinGrace = Date.now() - record.revokedAt.getTime() < REUSE_GRACE_MS

    if (withinGrace && record.replacedBy) {
      // Đi theo chuỗi replacedBy để tìm bản ghi còn sống mới nhất (tab khác đã rotate trước đó)
      let current = record
      while (current.replacedBy) {
        const next = await prisma.refreshToken.findUnique({ where: { id: current.replacedBy } })
        if (!next) break
        current = next
        if (!current.revokedAt) break
      }
      if (!current.revokedAt && current.expiresAt >= new Date()) {
        return current
      }
    }

    await revokeAllForUser(record.userId)
    throw new RefreshTokenError('REUSED')
  }

  if (record.expiresAt < new Date()) {
    throw new RefreshTokenError('EXPIRED')
  }

  return record
}

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