export function fmtDurationVi(totalMinutes) {
  const m = Math.max(0, Math.round(totalMinutes || 0));
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h <= 0) return `${rest} phút`;
  if (rest === 0) return `${h} giờ`;
  return `${h} giờ ${rest} phút`;
}

export function fmtNumberVi(n) {
  return Math.max(0, Math.round(n || 0)).toLocaleString("vi-VN");
}

export function fmtDateVi(dateLike) {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
