const prisma = require("../config/db");
const {
  getAllTasksOrdered,
  computeProgress,
} = require("../services/maintenanceService");

function serverError(res, err, tag) {
  console.error(`[${tag}]`, err);
  return res.status(500).json({ success: false, message: "Lỗi server" });
}

// GET /admin/maintenance/tasks - danh sách đầy đủ + % tiến độ hiện tại
exports.getTasks = async (req, res) => {
  try {
    const tasks = await getAllTasksOrdered();
    return res.json({
      success: true,
      data: { tasks, ...computeProgress(tasks) },
    });
  } catch (err) {
    return serverError(res, err, "admin:maintenance:getTasks");
  }
};

// POST /admin/maintenance/tasks - thêm hạng mục mới (luôn thêm vào cuối danh sách)
exports.createTask = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title?.trim() || !description?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng nhập tiêu đề và mô tả" });
    }

    const last = await prisma.maintenanceTask.findFirst({
      orderBy: { order: "desc" },
    });

    const task = await prisma.maintenanceTask.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        order: (last?.order ?? -1) + 1,
        createdById: req.user.id,
        createdByName: req.user.name,
      },
    });

    const tasks = await getAllTasksOrdered();
    return res.status(201).json({
      success: true,
      message: "Đã thêm hạng mục bảo trì",
      data: { task, ...computeProgress(tasks) },
    });
  } catch (err) {
    return serverError(res, err, "admin:maintenance:createTask");
  }
};

// PUT /admin/maintenance/tasks/:id - sửa tiêu đề / mô tả
exports.updateTask = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title?.trim() || !description?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng nhập tiêu đề và mô tả" });
    }

    const task = await prisma.maintenanceTask.update({
      where: { id: req.params.id },
      data: { title: title.trim(), description: description.trim() },
    });

    return res.json({
      success: true,
      message: "Đã cập nhật hạng mục",
      data: task,
    });
  } catch (err) {
    if (err.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy hạng mục" });
    }
    return serverError(res, err, "admin:maintenance:updateTask");
  }
};

// PATCH /admin/maintenance/tasks/:id/confirm - admin xác nhận hoàn thành (hoặc bỏ xác nhận)
// -> % tiến độ ở trang bảo trì công khai TỰ ĐỘNG đổi theo vì được tính lại
// ngay dưới đây, không phải sửa tay ở đâu khác.
exports.toggleTaskDone = async (req, res) => {
  try {
    const existing = await prisma.maintenanceTask.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy hạng mục" });
    }

    const nextDone = !existing.isDone;
    const task = await prisma.maintenanceTask.update({
      where: { id: req.params.id },
      data: { isDone: nextDone, completedAt: nextDone ? new Date() : null },
    });

    const tasks = await getAllTasksOrdered();
    return res.json({
      success: true,
      message: nextDone
        ? "Đã xác nhận hoàn thành hạng mục - tiến độ đã cập nhật"
        : "Đã bỏ xác nhận hạng mục - tiến độ đã cập nhật",
      data: { task, ...computeProgress(tasks) },
    });
  } catch (err) {
    return serverError(res, err, "admin:maintenance:toggleTaskDone");
  }
};

// PATCH /admin/maintenance/tasks/:id/move - { direction: "up" | "down" }
// Đổi chỗ order với hạng mục liền kề để sắp xếp lại thứ tự hiển thị.
exports.moveTask = async (req, res) => {
  try {
    const { direction } = req.body;
    if (!["up", "down"].includes(direction)) {
      return res
        .status(400)
        .json({ success: false, message: "direction không hợp lệ" });
    }

    const tasks = await getAllTasksOrdered();
    const idx = tasks.findIndex((t) => t.id === req.params.id);
    if (idx === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy hạng mục" });
    }

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= tasks.length) {
      // Đã ở đầu/cuối danh sách - không có gì để đổi chỗ, không phải lỗi.
      return res.json({
        success: true,
        message: "Đã ở vị trí giới hạn",
        data: { tasks },
      });
    }

    const a = tasks[idx];
    const b = tasks[swapIdx];
    await prisma.$transaction([
      prisma.maintenanceTask.update({
        where: { id: a.id },
        data: { order: b.order },
      }),
      prisma.maintenanceTask.update({
        where: { id: b.id },
        data: { order: a.order },
      }),
    ]);

    const updated = await getAllTasksOrdered();
    return res.json({
      success: true,
      message: "Đã đổi thứ tự",
      data: { tasks: updated },
    });
  } catch (err) {
    return serverError(res, err, "admin:maintenance:moveTask");
  }
};

// DELETE /admin/maintenance/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    await prisma.maintenanceTask.delete({ where: { id: req.params.id } });
    const tasks = await getAllTasksOrdered();
    return res.json({
      success: true,
      message: "Đã xóa hạng mục",
      data: computeProgress(tasks),
    });
  } catch (err) {
    if (err.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy hạng mục" });
    }
    return serverError(res, err, "admin:maintenance:deleteTask");
  }
};
