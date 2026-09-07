const prisma = require("../config/db");

function serverError(res, err, tag) {
  console.error(`[${tag}]`, err);
  return res.status(500).json({ success: false, message: "Lỗi server" });
}

const authorSelect = {
  id: true,
  name: true,
  avatar: true,
  role: true,
};

// GET /news/posts — bảng tin công khai (chỉ những bài không ẩn, không xóa)
exports.getPublicPosts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 6));
    const skip = (page - 1) * limit;

    const where = { isDeleted: false, isHidden: false };

    const [posts, total] = await Promise.all([
      prisma.newsPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { author: { select: authorSelect } },
      }),
      prisma.newsPost.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        posts,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    return serverError(res, err, "getPublicPosts");
  }
};

// GET /news/files — file công khai (chỉ những file không ẩn, không xóa)
exports.getPublicFiles = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 8));
    const skip = (page - 1) * limit;

    const where = { isDeleted: false, isHidden: false };

    const [files, total] = await Promise.all([
      prisma.newsFile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { uploader: { select: authorSelect } },
      }),
      prisma.newsFile.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        files,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    return serverError(res, err, "getPublicFiles");
  }
};
