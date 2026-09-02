const prisma = require("../config/db");
const { generateGameCode } = require("../utils/generateGameCode");
const {
  uploadGameImageBuffer,
  deleteImageByPublicId,
  extractPublicId,
} = require("../services/cloudinaryUploadService");

const isDev = process.env.NODE_ENV !== "production";
function serverError(res, err, tag) {
  console.error(`[${tag}]`, err);
  return res.status(500).json({
    success: false,
    message: "Lỗi server",
    ...(isDev ? { debug: err.message } : {}),
  });
}

const GAME_TYPES = [
  "MEMORY_MATCH",
  "MATCH_PAIRS",
  "WORD_SEARCH",
  "LETTER_HUNT",
];

function validateGameConfig(gameType, config) {
  if (!config || typeof config !== "object")
    return "Thiếu dữ liệu cấu hình trò chơi";

  switch (gameType) {
    case "MEMORY_MATCH": {
      const pairs = config.pairs;
      if (!Array.isArray(pairs) || pairs.length < 2)
        return "Cần ít nhất 2 cặp thẻ";
      for (const p of pairs) {
        if (!p?.id || !p?.cardA?.value || !p?.cardB?.value) {
          return "Mỗi cặp thẻ cần đủ nội dung mặt A và mặt B";
        }
      }
      return null;
    }
    case "MATCH_PAIRS": {
      const pairs = config.pairs;
      if (!Array.isArray(pairs) || pairs.length < 2)
        return "Cần ít nhất 2 cặp để nối";
      for (const p of pairs) {
        if (
          !p?.id ||
          !String(p?.left || "").trim() ||
          !String(p?.right || "").trim()
        ) {
          return "Mỗi cặp cần đủ nội dung cột trái và cột phải";
        }
      }
      return null;
    }
    case "WORD_SEARCH": {
      const words = config.words;
      if (!Array.isArray(words) || words.length < 1)
        return "Cần ít nhất 1 từ để giấu trong bảng";
      if (words.some((w) => !String(w || "").trim()))
        return "Có từ đang để trống";
      if (words.some((w) => String(w).trim().replace(/\s/g, "").length > 14)) {
        return "Mỗi từ tối đa 14 ký tự (không tính khoảng trắng)";
      }
      return null;
    }
    case "LETTER_HUNT": {
      const word = String(config.secretWord || "").trim();
      if (!word) return "Cần nhập từ khoá bí mật";
      if (word.replace(/\s/g, "").length > 12)
        return "Từ khoá tối đa 12 ký tự (không tính khoảng trắng)";
      return null;
    }
    default:
      return "Loại trò chơi không hợp lệ";
  }
}

/* ══════════════════════════════════════════════
   DANH SÁCH — GỘP THEO SÁCH (giống getArCodesGroupedAll)
══════════════════════════════════════════════ */
exports.getGamesGroupedAll = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 8);
    const search = req.query.search?.trim() ?? "";
    const gameType = req.query.gameType?.trim() ?? "";
    const status = req.query.status?.trim() ?? "";

    const gameWhere = {};
    if (GAME_TYPES.includes(gameType)) gameWhere.gameType = gameType;
    if (status === "active") gameWhere.isActive = true;
    if (status === "inactive") gameWhere.isActive = false;

    const bookWhere = { games: { some: gameWhere } };

    if (search) {
      bookWhere.AND = [
        {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            {
              games: {
                some: {
                  ...gameWhere,
                  OR: [
                    { title: { contains: search, mode: "insensitive" } },
                    { code: { contains: search, mode: "insensitive" } },
                  ],
                },
              },
            },
          ],
        },
      ];
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where: bookWhere,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { title: "asc" },
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
          games: {
            where: gameWhere,
            orderBy: { createdAt: "asc" },
            include: { _count: { select: { results: true } } },
          },
        },
      }),
      prisma.book.count({ where: bookWhere }),
    ]);

    const groups = books
      .filter((b) => b.games.length > 0)
      .map((b) => ({
        book: {
          id: b.id,
          title: b.title,
          slug: b.slug,
          coverImage: b.coverImage,
        },
        games: b.games,
      }));

    return res.json({
      success: true,
      data: {
        groups,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        page,
      },
    });
  } catch (err) {
    return serverError(res, err, "getGamesGroupedAll");
  }
};

exports.getGamesForBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const games = await prisma.game.findMany({
      where: { bookId },
      orderBy: { createdAt: "asc" },
    });
    return res.json({ success: true, data: games });
  } catch (err) {
    return serverError(res, err, "getGamesForBook");
  }
};

exports.getGameById = async (req, res) => {
  try {
    const { id } = req.params;
    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        book: {
          select: { id: true, title: true, slug: true, coverImage: true },
        },
        _count: { select: { results: true } },
      },
    });
    if (!game) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy trò chơi" });
    }
    return res.json({ success: true, data: game });
  } catch (err) {
    return serverError(res, err, "getGameById");
  }
};

exports.createGame = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { title, gameType, config, instructions, accessType, thumbnailUrl } =
      req.body;

    if (!title?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Thiếu tên trò chơi" });
    if (!GAME_TYPES.includes(gameType)) {
      return res
        .status(400)
        .json({ success: false, message: "Loại trò chơi không hợp lệ" });
    }

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sách" });

    const configError = validateGameConfig(gameType, config);
    if (configError)
      return res.status(400).json({ success: false, message: configError });

    const finalAccessType =
      accessType === "PUBLIC" ? "PUBLIC" : "CUSTOMER_ONLY";
    const code = generateGameCode();

    const game = await prisma.game.create({
      data: {
        code,
        title: title.trim(),
        gameType,
        config,
        instructions: instructions?.trim() || null,
        thumbnailUrl: thumbnailUrl || null,
        bookId,
        accessType: finalAccessType,
      },
    });

    return res.status(201).json({ success: true, data: game });
  } catch (err) {
    return serverError(res, err, "createGame");
  }
};

exports.updateGame = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, config, instructions, accessType, thumbnailUrl } = req.body;

    const existing = await prisma.game.findUnique({ where: { id } });
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy trò chơi" });

    const data = {};
    if (title !== undefined) {
      if (!title?.trim())
        return res
          .status(400)
          .json({
            success: false,
            message: "Tên trò chơi không được để trống",
          });
      data.title = title.trim();
    }
    if (instructions !== undefined)
      data.instructions = instructions?.trim() || null;
    if (thumbnailUrl !== undefined) data.thumbnailUrl = thumbnailUrl || null;
    if (accessType === "PUBLIC" || accessType === "CUSTOMER_ONLY")
      data.accessType = accessType;

    if (config !== undefined) {
      const configError = validateGameConfig(existing.gameType, config);
      if (configError)
        return res.status(400).json({ success: false, message: configError });
      data.config = config;
    }

    const game = await prisma.game.update({ where: { id }, data });
    return res.json({ success: true, data: game });
  } catch (err) {
    return serverError(res, err, "updateGame");
  }
};

exports.toggleGame = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.game.findUnique({ where: { id } });
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy trò chơi" });

    const game = await prisma.game.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });
    return res.json({ success: true, data: game });
  } catch (err) {
    return serverError(res, err, "toggleGame");
  }
};

exports.updateGameAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const { accessType } = req.body;
    if (accessType !== "PUBLIC" && accessType !== "CUSTOMER_ONLY") {
      return res
        .status(400)
        .json({ success: false, message: "accessType không hợp lệ" });
    }

    const game = await prisma.game.update({
      where: { id },
      data: { accessType },
    });
    return res.json({ success: true, data: game });
  } catch (err) {
    if (err.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy trò chơi" });
    }
    return serverError(res, err, "updateGameAccess");
  }
};

exports.deleteGame = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.game.findUnique({ where: { id } });
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy trò chơi" });

    await prisma.game.delete({ where: { id } });
    return res.json({ success: true, message: "Đã xóa trò chơi" });
  } catch (err) {
    return serverError(res, err, "deleteGame");
  }
};

exports.getGameLeaderboardAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const top = await prisma.gameResult.findMany({
      where: { gameId: id },
      orderBy: [{ score: "desc" }, { durationSeconds: "asc" }],
      take: 20,
      include: {
        user: { select: { name: true, email: true } },
        child: { select: { name: true } },
      },
    });
    return res.json({ success: true, data: top });
  } catch (err) {
    return serverError(res, err, "getGameLeaderboardAdmin");
  }
};

exports.uploadGameImage = async (req, res) => {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "Thiếu file ảnh" });
    const gameId = req.query.gameId || req.body.gameId;
    const result = await uploadGameImageBuffer(req.file.buffer, gameId);
    return res
      .status(201)
      .json({ success: true, data: { url: result.secure_url } });
  } catch (err) {
    return serverError(res, err, "uploadGameImage");
  }
};

exports.deleteGameImage = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url)
      return res.status(400).json({ success: false, message: "Thiếu url ảnh" });
    const publicId = extractPublicId(url);
    if (publicId) await deleteImageByPublicId(publicId).catch(() => {});
    return res.json({ success: true });
  } catch (err) {
    return serverError(res, err, "deleteGameImage");
  }
};
