const TIMEZONE = "Asia/Ho_Chi_Minh";
const TIMEZONE_OFFSET_HOURS = 7; // VN không có DST, luôn là UTC+7

function getVnParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    // Intl có thể trả "24" cho nửa đêm tuỳ runtime — chuẩn hoá về 0.
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
  };
}

// 00:00 "hôm nay" theo giờ VN, quy đổi sang UTC Date để query DB (Postgres lưu UTC).
function startOfTodayVn(date = new Date()) {
  const { year, month, day } = getVnParts(date);
  return new Date(Date.UTC(year, month - 1, day, -TIMEZONE_OFFSET_HOURS, 0, 0, 0));
}

function currentMinuteOfDayVn(date = new Date()) {
  const { hour, minute } = getVnParts(date);
  return hour * 60 + minute;
}

// Kiểm tra thời điểm hiện tại (theo giờ VN) có nằm trong khung giờ cho phép không.
// Hỗ trợ cả khung "qua đêm" (vd 20:00 -> 06:00).
function isWithinAllowedWindow(child, date = new Date()) {
  if (!child.allowWindowEnabled) return true;
  if (!child.allowStart || !child.allowEnd) return true;

  const [sh, sm] = String(child.allowStart).split(":").map(Number);
  const [eh, em] = String(child.allowEnd).split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return true; // dữ liệu hỏng -> không chặn nhầm

  const s = sh * 60 + sm;
  const e = eh * 60 + em;
  const cur = currentMinuteOfDayVn(date);
  return s <= e ? cur >= s && cur <= e : cur >= s || cur <= e;
}

async function getTodayMinutes(prisma, childId, date = new Date()) {
  const start = startOfTodayVn(date);
  const agg = await prisma.childActivityLog.aggregate({
    where: { childId, occurredOn: { gte: start } },
    _sum: { minutes: true },
  });
  return agg._sum.minutes || 0;
}

async function isDailyLimitReached(prisma, child, date = new Date()) {
  if (!child.dailyLimitMinutes) return false;
  const minutes = await getTodayMinutes(prisma, child.id, date);
  return minutes >= child.dailyLimitMinutes;
}

module.exports = {
  TIMEZONE,
  getVnParts,
  startOfTodayVn,
  currentMinuteOfDayVn,
  isWithinAllowedWindow,
  getTodayMinutes,
  isDailyLimitReached,
};