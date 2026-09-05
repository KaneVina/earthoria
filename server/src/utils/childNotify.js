const prisma = require("../config/db");
const { vnDateStr } = require("./childPolicy");
const {
  sendChildLimitExceededEmail,
  sendChildSkippedRestEmail,
} = require("../services/emailService");

async function findParentContact(parentId) {
  return prisma.user.findUnique({
    where: { id: parentId },
    select: { email: true, name: true },
  });
}

/**
 * Gửi email cho phụ huynh khi bé vừa dùng vượt giới hạn thời gian/ngày.
 * Tối đa 1 email/ngày cho mỗi bé (theo dõi qua notifyLimitExceededSentDate).
 */
async function notifyLimitExceeded(child) {
  try {
    if (!child?.notifyEmail || !child?.notifyOnLimitExceeded) return;
    const today = vnDateStr();
    if (child.notifyLimitExceededSentDate === today) return;

    const parent = await findParentContact(child.parentId);
    if (!parent?.email) return;

    await sendChildLimitExceededEmail({
      to: parent.email,
      parentName: parent.name,
      childName: child.name,
      dailyLimitMinutes: child.dailyLimitMinutes,
    });

    await prisma.childProfile.update({
      where: { id: child.id },
      data: { notifyLimitExceededSentDate: today },
    });

    await prisma.childAuditLog
      .create({
        data: {
          parentId: child.parentId,
          childId: child.id,
          type: "DAILY_LIMIT_EXCEEDED",
          message: `${child.name} đã dùng vượt giới hạn ${child.dailyLimitMinutes} phút/ngày`,
        },
      })
      .catch((err) =>
        console.error("[childAuditLog] Failed to write:", err.message),
      );
  } catch (err) {
    console.error("[notifyLimitExceeded] failed:", err.message);
  }
}

/**
 * Gửi email cho phụ huynh khi bé bấm bỏ qua lời nhắc nghỉ mắt định kỳ (chưa
 * hết thời gian đếm ngược đã bấm "Đọc tiếp"). Tối đa 1 email/ngày cho mỗi bé.
 */
async function notifySkippedRest(child) {
  try {
    if (!child?.notifyEmail || !child?.notifyOnSkippedRest) return;
    const today = vnDateStr();
    if (child.notifySkippedRestSentDate === today) return;

    const parent = await findParentContact(child.parentId);
    if (!parent?.email) return;

    await sendChildSkippedRestEmail({
      to: parent.email,
      parentName: parent.name,
      childName: child.name,
    });

    await prisma.childProfile.update({
      where: { id: child.id },
      data: { notifySkippedRestSentDate: today },
    });

    await prisma.childAuditLog
      .create({
        data: {
          parentId: child.parentId,
          childId: child.id,
          type: "SKIPPED_REST",
          message: `${child.name} đã bỏ qua lời nhắc nghỉ mắt`,
        },
      })
      .catch((err) =>
        console.error("[childAuditLog] Failed to write:", err.message),
      );
  } catch (err) {
    console.error("[notifySkippedRest] failed:", err.message);
  }
}

module.exports = { notifyLimitExceeded, notifySkippedRest };
