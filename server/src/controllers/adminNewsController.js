const prisma = require("../config/db");
const {
  uploadNewsFileBuffer,
  deleteRawByPublicId,
} = require("../services/cloudinaryUploadService");

function serverError(res, err, tag) {
  console.error(`[${tag}]`, err);
  return res.status(500).json({ success: false, message: "Lỗi server" });
}

const authorSelect = { id: true, name: true, avatar: true, role: true };

/* ═══════════════════════════ BẢNG TIN (NewsPost) ═══════════════════════════ */

// GET /admin/news/posts - danh sách đầy đủ cho dashboard (kể cả ẩn, trừ đã xóa mềm - có filter riêng)
exports.getPosts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim();
    const includeDeleted = req.query.includeDeleted === "true";

    const where = {
      ...(includeDeleted ? {} : { isDeleted: false }),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

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
      data: { posts, total, page, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    return serverError(res, err, "admin:getPosts");
  }
};

// POST /admin/news/posts - đăng tin mới (admin hoặc staff)
exports.createPost = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title?.trim() || !description?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng nhập tiêu đề và mô tả" });
    }

    const post = await prisma.newsPost.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        authorId: req.user.id,
      },
      include: { author: { select: authorSelect } },
    });

    return res
      .status(201)
      .json({ success: true, message: "Đã đăng tin", data: post });
  } catch (err) {
    return serverError(res, err, "admin:createPost");
  }
};

// PUT /admin/news/posts/:id - sửa tiêu đề/mô tả
exports.updatePost = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title?.trim() || !description?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng nhập tiêu đề và mô tả" });
    }

    const post = await prisma.newsPost.update({
      where: { id: req.params.id },
      data: { title: title.trim(), description: description.trim() },
      include: { author: { select: authorSelect } },
    });

    return res.json({ success: true, message: "Đã cập nhật tin", data: post });
  } catch (err) {
    if (err.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy tin" });
    }
    return serverError(res, err, "admin:updatePost");
  }
};

// PATCH /admin/news/posts/:id/hide - ẩn / hiện lại tin
exports.toggleHidePost = async (req, res) => {
  try {
    const existing = await prisma.newsPost.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy tin" });
    }
    const post = await prisma.newsPost.update({
      where: { id: req.params.id },
      data: { isHidden: !existing.isHidden },
      include: { author: { select: authorSelect } },
    });
    return res.json({
      success: true,
      message: post.isHidden ? "Đã ẩn tin" : "Đã hiện lại tin",
      data: post,
    });
  } catch (err) {
    return serverError(res, err, "admin:toggleHidePost");
  }
};

// DELETE /admin/news/posts/:id/soft - xóa mềm (giữ trong DB, ẩn khỏi mọi nơi)
exports.softDeletePost = async (req, res) => {
  try {
    const post = await prisma.newsPost.update({
      where: { id: req.params.id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    return res.json({ success: true, message: "Đã xóa mềm tin", data: post });
  } catch (err) {
    if (err.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy tin" });
    }
    return serverError(res, err, "admin:softDeletePost");
  }
};

// PATCH /admin/news/posts/:id/restore - khôi phục tin đã xóa mềm
exports.restorePost = async (req, res) => {
  try {
    const post = await prisma.newsPost.update({
      where: { id: req.params.id },
      data: { isDeleted: false, deletedAt: null },
      include: { author: { select: authorSelect } },
    });
    return res.json({ success: true, message: "Đã khôi phục tin", data: post });
  } catch (err) {
    if (err.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy tin" });
    }
    return serverError(res, err, "admin:restorePost");
  }
};

// DELETE /admin/news/posts/:id/hard - xóa cứng (xóa hẳn khỏi DB, chỉ ADMIN)
exports.hardDeletePost = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ success: false, message: "Chỉ admin mới có quyền xóa cứng" });
    }
    await prisma.newsPost.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: "Đã xóa vĩnh viễn tin" });
  } catch (err) {
    if (err.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy tin" });
    }
    return serverError(res, err, "admin:hardDeletePost");
  }
};

/* ═══════════════════════════ FILE CÔNG KHAI (NewsFile) ═══════════════════════════ */

// GET /admin/news/files - danh sách file cho dashboard
exports.getFiles = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim();
    const includeDeleted = req.query.includeDeleted === "true";

    const where = {
      ...(includeDeleted ? {} : { isDeleted: false }),
      ...(search
        ? { fileName: { contains: search, mode: "insensitive" } }
        : {}),
    };

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
      data: { files, total, page, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    return serverError(res, err, "admin:getFiles");
  }
};

// POST /admin/news/files - thêm file mới (multipart/form-data, field "file")
exports.createFile = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng chọn file" });
    }

    const result = await uploadNewsFileBuffer(
      req.file.buffer,
      req.file.originalname,
    );
    const ext = (req.file.originalname.split(".").pop() || "").toLowerCase();

    const file = await prisma.newsFile.create({
      data: {
        fileName: req.body.fileName?.trim() || req.file.originalname,
        fileUrl: result.secure_url,
        fileType: ext || req.file.mimetype,
        fileSize: req.file.size,
        publicId: result.public_id,
        uploaderId: req.user.id,
      },
      include: { uploader: { select: authorSelect } },
    });

    return res
      .status(201)
      .json({ success: true, message: "Đã thêm file", data: file });
  } catch (err) {
    return serverError(res, err, "admin:createFile");
  }
};

// PATCH /admin/news/files/:id/hide - ẩn / hiện lại file
exports.toggleHideFile = async (req, res) => {
  try {
    const existing = await prisma.newsFile.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy file" });
    }
    const file = await prisma.newsFile.update({
      where: { id: req.params.id },
      data: { isHidden: !existing.isHidden },
      include: { uploader: { select: authorSelect } },
    });
    return res.json({
      success: true,
      message: file.isHidden ? "Đã ẩn file" : "Đã hiện lại file",
      data: file,
    });
  } catch (err) {
    return serverError(res, err, "admin:toggleHideFile");
  }
};

// DELETE /admin/news/files/:id/soft - xóa mềm
exports.softDeleteFile = async (req, res) => {
  try {
    const file = await prisma.newsFile.update({
      where: { id: req.params.id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    return res.json({ success: true, message: "Đã xóa mềm file", data: file });
  } catch (err) {
    if (err.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy file" });
    }
    return serverError(res, err, "admin:softDeleteFile");
  }
};

// PATCH /admin/news/files/:id/restore
exports.restoreFile = async (req, res) => {
  try {
    const file = await prisma.newsFile.update({
      where: { id: req.params.id },
      data: { isDeleted: false, deletedAt: null },
      include: { uploader: { select: authorSelect } },
    });
    return res.json({
      success: true,
      message: "Đã khôi phục file",
      data: file,
    });
  } catch (err) {
    if (err.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy file" });
    }
    return serverError(res, err, "admin:restoreFile");
  }
};

// DELETE /admin/news/files/:id/hard - xóa cứng, xóa cả trên Cloudinary (chỉ ADMIN)
exports.hardDeleteFile = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ success: false, message: "Chỉ admin mới có quyền xóa cứng" });
    }
    const file = await prisma.newsFile.findUnique({
      where: { id: req.params.id },
    });
    if (!file) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy file" });
    }
    if (file.publicId) {
      try {
        await deleteRawByPublicId(file.publicId);
      } catch (e) {
        console.error("[admin:hardDeleteFile] Cloudinary delete lỗi:", e);
      }
    }
    await prisma.newsFile.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: "Đã xóa vĩnh viễn file" });
  } catch (err) {
    return serverError(res, err, "admin:hardDeleteFile");
  }
};
