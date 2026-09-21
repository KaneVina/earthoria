const prisma = require("../config/db");

// % tiến độ bảo trì luôn được TÍNH LẠI từ dữ liệu thật (không lưu cứng số %
// ở đâu cả) - admin chỉ cần xác nhận xong 1 hạng mục là số này tự đổi theo.
function computeProgress(tasks) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.isDone).length;
  const progress = total ? Math.round((done / total) * 100) : 0;
  return { total, done, progress };
}

async function getAllTasksOrdered() {
  return prisma.maintenanceTask.findMany({ orderBy: { order: "asc" } });
}

module.exports = { computeProgress, getAllTasksOrdered };