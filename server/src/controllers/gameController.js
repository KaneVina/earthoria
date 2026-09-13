const prisma = require("../config/db");
const { userOwnsBook } = require("../utils/bookOwnership");
const { encodeId } = require("../utils/hashids");
const {
  isWithinAllowedWindow,
  isDailyLimitReached,
} = require("../utils/childPolicy");
const { notifyLimitExceeded } = require("../utils/childNotify");

exports.getGame = async (req, res) => {
  try {
    const { code } = req.params;
    const { kidToken } = req.query;

    const game = await prisma.game.findUnique({
      where: { code },
      include: {
        book: {
          select: { id: true, title: true, slug: true, coverImage: true },
        },
      },
    });

    if (!game || !game.isActive) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy trò chơi này" });
    }

    if (game.accessType !== "PUBLIC") {
      // Phiên của bé (link/QR riêng, không đăng nhập tài khoản chính) - xác
      // thực bằng kidToken thay vì req.user, vẫn tôn trọng khoá thiết bị +
      // giới hạn giờ/khung giờ + ẩn sách mà phụ huynh đã đặt cho bé (giống
      // hệt getArCode - trước đây route này hoàn toàn không biết tới khái
      // niệm "bé", nên khoá thiết bị của phụ huynh không có tác dụng gì khi
      // bé đang chơi game nhúng trong sách).
      let child = null;
      if (!req.user && kidToken) {
        child = await prisma.childProfile.findFirst({
          where: { kidLinkToken: kidToken, isActive: true },
        });
      }

      if (child) {
        if (child.isLocked) {
          return res.status(403).json({
            success: false,
            code: "CHILD_LOCKED",
            message: "Trò chơi đã bị phụ huynh khoá. Nhờ ba mẹ mở khoá nhé!",
          });
        }

        if (!isWithinAllowedWindow(child)) {
          return res.status(403).json({
            success: false,
            code: "OUTSIDE_ALLOWED_WINDOW",
            message: "Ngoài khung giờ ba mẹ cho phép sử dụng.",
          });
        }

        if (await isDailyLimitReached(prisma, child)) {
          notifyLimitExceeded(child); // fire-and-forget, tự throttle 1 lần/ngày
          return res.status(403).json({
            success: false,
            code: "DAILY_LIMIT_REACHED",
            message:
              "Bé đã dùng hết thời gian hôm nay rồi, hẹn bé ngày mai nhé!",
          });
        }

        const access = await prisma.childBookAccess.findFirst({
          where: { childId: child.id, bookId: game.bookId },
          select: { visible: true },
        });
        if (access && access.visible === false) {
          return res.status(403).json({
            success: false,
            message: "Sách này đã bị ẩn khỏi tủ sách của bé",
          });
        }

        const owns = await userOwnsBook(prisma, child.parentId, game.bookId);
        if (!owns) {
          return res.status(403).json({
            success: false,
            message:
              "Gia đình bạn cần sở hữu cuốn sách này (đơn hàng đã giao) để chơi trò chơi",
          });
        }
      } else if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Vui lòng đăng nhập để chơi trò chơi này",
        });
      } else if (req.user.role !== "ADMIN" && req.user.role !== "STAFF") {
        const owns = await userOwnsBook(prisma, req.user.id, game.bookId);
        if (!owns) {
          return res.status(403).json({
            success: false,
            message:
              "Bạn cần sở hữu cuốn sách này (đơn hàng đã giao) để chơi trò chơi",
          });
        }
      }
    }

    return res.json({
      success: true,
      data: {
        id: game.id,
        code: game.code,
        title: game.title,
        description: game.description,
        instructions: game.instructions,
        gameType: game.gameType,
        difficulty: game.difficulty,
        config: game.config,
        thumbnailUrl: game.thumbnailUrl,
        accessType: game.accessType,
        playCount: game.playCount,
        book: game.book
          ? { ...game.book, hashId: encodeId(game.book.id) }
          : null,
      },
    });
  } catch (err) {
    console.error("[getGame]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

exports.completeGame = async (req, res) => {
  try {
    const { code } = req.params;
    const { score, durationSeconds, playerName, childId } = req.body;

    const game = await prisma.game.findUnique({ where: { code } });
    if (!game || !game.isActive) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy trò chơi này" });
    }

    let validChildId = null;
    if (childId) {
      // Trước đây chỉ kiểm tra child có tồn tại hay không, KHÔNG kiểm tra child đó
      // có thuộc về user đang đăng nhập không - bất kỳ ai biết UUID của 1 child
      // (của gia đình khác) đều có thể ghi GameResult vào hồ sơ đó (IDOR). Giờ bắt
      // buộc childId phải thuộc về chính req.user (nếu có đăng nhập) mới được nhận.
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Vui lòng đăng nhập để lưu kết quả cho hồ sơ trẻ em",
        });
      }
      const child = await prisma.childProfile.findFirst({
        where: { id: childId, parentId: req.user.id, isActive: true },
        select: { id: true },
      });
      if (!child) {
        return res.status(403).json({
          success: false,
          message: "Hồ sơ trẻ em không hợp lệ hoặc không thuộc về bạn",
        });
      }
      validChildId = child.id;
    }

    const safeScore = Number.isFinite(Number(score))
      ? Math.max(0, Math.round(Number(score)))
      : 0;
    const safeDuration = Number.isFinite(Number(durationSeconds))
      ? Math.max(0, Math.round(Number(durationSeconds)))
      : null;

    const [, result] = await prisma.$transaction([
      prisma.game.update({
        where: { id: game.id },
        data: { playCount: { increment: 1 } },
      }),
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
    ]);

    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    console.error("[completeGame]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const { code } = req.params;
    const game = await prisma.game.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!game) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy trò chơi này" });
    }

    const top = await prisma.gameResult.findMany({
      where: { gameId: game.id },
      orderBy: [{ score: "desc" }, { durationSeconds: "asc" }],
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
    });

    const data = top.map((r) => ({
      id: r.id,
      score: r.score,
      durationSeconds: r.durationSeconds,
      completedAt: r.completedAt,
      displayName:
        r.child?.name || r.user?.name || r.playerName || "Người chơi ẩn danh",
      avatarEmoji: r.child?.avatarEmoji || null,
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error("[getLeaderboard]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
