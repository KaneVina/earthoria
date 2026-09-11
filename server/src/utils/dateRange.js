const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RANGE_MS = 2 * 365 * DAY_MS; // chặn range quá lớn (2 năm) để tránh query nặng

function resolveDateRange(query = {}) {
  const { from, to } = query;
  const now = new Date();

  let end = to ? new Date(`${to}T23:59:59.999`) : new Date(now);
  if (Number.isNaN(end.getTime())) end = new Date(now);

  let start = from ? new Date(`${from}T00:00:00.000`) : null;
  if (!start || Number.isNaN(start.getTime())) {
    start = new Date(end);
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
  }

  if (start > end) {
    const tmp = start;
    start = end;
    end = tmp;
  }

  if (end.getTime() - start.getTime() > MAX_RANGE_MS) {
    start = new Date(end.getTime() - MAX_RANGE_MS);
  }

  return { start, end };
}

/** Chọn granularity biểu đồ theo độ dài khoảng: <=62 ngày -> ngày, <=400 ngày -> tuần, còn lại -> tháng */
function pickBucket(start, end) {
  const days = (end.getTime() - start.getTime()) / DAY_MS;
  if (days <= 62) return "day";
  if (days <= 400) return "week";
  return "month";
}

function startOfBucket(date, bucket) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  if (bucket === "week") {
    const dow = d.getDay(); // 0 = CN
    const diffToMonday = dow === 0 ? -6 : 1 - dow;
    d.setDate(d.getDate() + diffToMonday);
  } else if (bucket === "month") {
    d.setDate(1);
  }
  return d;
}

function nextBucket(date, bucket) {
  const d = new Date(date);
  if (bucket === "day") d.setDate(d.getDate() + 1);
  else if (bucket === "week") d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

/** Sinh danh sách mốc bắt đầu của từng bucket trong khoảng [start, end] */
function bucketKeys(start, end, bucket) {
  const keys = [];
  let cur = startOfBucket(start, bucket);
  const last = startOfBucket(end, bucket);
  // Chặn số lượng bucket quá lớn (phòng hờ dữ liệu đầu vào bất thường)
  let guard = 0;
  while (cur.getTime() <= last.getTime() && guard < 800) {
    keys.push(new Date(cur));
    cur = nextBucket(cur, bucket);
    guard += 1;
  }
  return keys;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

/** Nhãn hiển thị ngắn gọn cho 1 mốc bucket, tuỳ granularity */
function bucketLabel(date, bucket) {
  if (bucket === "day")
    return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;
  if (bucket === "week")
    return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;
  return `T${date.getMonth() + 1}/${date.getFullYear()}`;
}

/**
 * Ghép dữ liệu raw SQL (đã group theo date_trunc) với danh sách bucket đầy đủ,
 * điền 0 cho các bucket không có dữ liệu. Hỗ trợ nhiều field số liệu cùng lúc.
 *
 * @param rows      Kết quả từ $queryRaw, mỗi phần tử có field `bucket` (Date) + các field số liệu
 * @param keys      Danh sách bucket đầy đủ từ bucketKeys()
 * @param bucket    "day" | "week" | "month"
 * @param valueKeys Danh sách tên field số liệu cần lấy, ví dụ ["count"] hoặc ["count","revenue"]
 */
function fillBucketChart(rows, keys, bucket, valueKeys = ["count"]) {
  const map = new Map(
    rows.map((r) => [startOfBucket(new Date(r.bucket), bucket).getTime(), r]),
  );
  return keys.map((k) => {
    const row = map.get(k.getTime());
    const out = {
      label: bucketLabel(k, bucket),
      date: k.toISOString().slice(0, 10),
    };
    for (const vk of valueKeys) {
      out[vk] = row ? Number(row[vk]) || 0 : 0;
    }
    return out;
  });
}

module.exports = {
  resolveDateRange,
  pickBucket,
  bucketKeys,
  bucketLabel,
  fillBucketChart,
  startOfBucket,
};
