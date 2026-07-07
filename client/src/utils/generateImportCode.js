// utils/generateImportCode.js
// Sinh mã PHIẾU NHẬP KHO dạng: PN-YYYYMMDD-XXXX
//   PN-        : tiền tố cố định (Phiếu Nhập)
//   YYYYMMDD   : ngày tạo phiếu
//   XXXX       : 4 ký tự ngẫu nhiên (chữ hoa + số) để tránh trùng trong cùng 1 ngày
//
// LƯU Ý: đây là mã sinh ở FE để hiển thị ngay khi mở trang. Khi có backend,
// nên để server xác nhận / cấp lại mã này khi lưu phiếu (đảm bảo duy nhất
// tuyệt đối kể cả khi nhiều admin cùng thao tác 1 lúc).
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateImportCode() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Array.from(
    { length: 4 },
    () => CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join("");
  return `PN-${y}${m}${d}-${rand}`;
}