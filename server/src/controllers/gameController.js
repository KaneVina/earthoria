const prisma = require('../config/db')
const { userOwnsBook } = require('../utils/bookOwnership')
const { encodeId } = require('../utils/hashids')

exports.getGame = async (req, res) => {
  try {
    const { code } = req.params

    const game = await prisma.game.findUnique({
      where: { code },
      include: {
        book: { select: { id: true, title: true, slug: true, coverImage: true } },
      },
    })

    if (!game || !game.isActive) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy trò chơi này' })
    }

    if (game.accessType !== 'PUBLIC') {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để chơi trò chơi này' })
      }

      if (req.user.role !== 'ADMIN' && req.user.role !== 'STAFF') {
        const owns = await userOwnsBook(prisma, req.user.id, game.bookId)
        if (!owns) {
          return res.status(403).json({
            success: false,
            message: 'Bạn cần sở hữu cuốn sách này (đơn hàng đã giao) để chơi trò chơi',
          })
        }
      }
    }

    return res.json({
      success: true,
      data: {
        id: game.id,
        code: game.code,
        title: game.title,
        instructions: game.instructions,
        gameType: game.gameType,
        config: game.config,
        thumbnailUrl: game.thumbnailUrl,
        accessType: game.accessType,
        playCount: game.playCount,
        book: game.book ? { ...game.book, hashId: encodeId(game.book.id) } : null,
      },
    })
  } catch (err) {
    console.error('[getGame]', err)
    return res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}

exports.completeGame = async (req, res) => {
  try {
    const { code } = req.params
    const { score, durationSeconds, playerName, childId } = req.body

    const game = await prisma.game.findUnique({ where: { code } })
    if (!game || !game.isActive) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy trò chơi này' })
    }

    let validChildId = null
    if (childId) {
      const child = await prisma.childProfile.findUnique({
        where: { id: childId },
        select: { id: true },
      })
      if (child) validChildId = child.id
    }

    const safeScore = Number.isFinite(Number(score)) ? Math.max(0, Math.round(Number(score))) : 0
    const safeDuration = Number.isFinite(Number(durationSeconds))
      ? Math.max(0, Math.round(Number(durationSeconds)))
      : null

    const [, result] = await prisma.$transaction([
      prisma.game.update({ where: { id: game.id }, data: { playCount: { increment: 1 } } }),
      prisma.gameResult.create({
        data: {
          gameId: game.id,
          userId: req.user?.id ?? null,
          childId: validChildId,
          playerName: playerName ? String(playerName).slice(0, 60) : null,
          score: safeScore,
          durationSeconds: safeDuration,
        },
      }),
    ])

    return res.status(201).json({ success: true, data: result })
  } catch (err) {
    console.error('[completeGame]', err)
    return res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}

exports.getLeaderboard = async (req, res) => {
  try {
    const { code } = req.params
    const game = await prisma.game.findUnique({ where: { code }, select: { id: true } })
    if (!game) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy trò chơi này' })
    }

    const top = await prisma.gameResult.findMany({
      where: { gameId: game.id },
      orderBy: [{ score: 'desc' }, { durationSeconds: 'asc' }],
      take: 10,
      select: {
        id: true,
        score: true,
        durationSeconds: true,
        playerName: true,
        completedAt: true,
        user: { select: { name: true } },
        child: { select: { name: true, avatarEmoji: true } },
      },
    })

    const data = top.map((r) => ({
      id: r.id,
      score: r.score,
      durationSeconds: r.durationSeconds,
      completedAt: r.completedAt,
      displayName: r.child?.name || r.user?.name || r.playerName || 'Người chơi ẩn danh',
      avatarEmoji: r.child?.avatarEmoji || null,
    }))

    return res.json({ success: true, data })
  } catch (err) {
    console.error('[getLeaderboard]', err)
    return res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}