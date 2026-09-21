const {
  getAllTasksOrdered,
  computeProgress,
} = require("../services/maintenanceService");

// GET /api/v1/maintenance/public - public, không cần đăng nhập
// Trả về danh sách hạng mục nâng cấp (tiêu đề + mô tả + trạng thái) và % tiến
// độ đã tính sẵn, dùng để render trang bảo trì công khai (Maintenance.jsx).
const getPublicMaintenance = async (req, res) => {
  try {
    const tasks = await getAllTasksOrdered();
    const { total, done, progress } = computeProgress(tasks);

    res.json({
      success: true,
      data: {
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          isDone: t.isDone,
        })),
        total,
        done,
        progress,
      },
    });
  } catch (error) {
    console.error("[maintenance:getPublicMaintenance]", error);
    res
      .status(500)
      .json({ success: false, message: "Không tải được tiến độ bảo trì" });
  }
};

module.exports = { getPublicMaintenance };
