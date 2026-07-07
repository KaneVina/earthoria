// utils/generateProductCode.js
// Sinh mã sách dạng: EB-XXXXXX-YYY
//   EB-       : tiền tố cố định
//   XXXXXX    : 6 chữ số ngẫu nhiên
//   YYY       : 3 chữ cái ngẫu nhiên (phân biệt hoa)
//
// LƯU Ý: Đây là bản sinh mã ở phía FE, chỉ dùng để PREVIEW ngay khi mở form
// tạo sách. Khi nối backend, mã thật sự nên được sinh và đảm bảo DUY NHẤT
// ở server (tránh trường hợp 2 client cùng sinh trùng mã trước khi lưu DB).
// FE chỉ cần hiển thị `book.productCode` mà server trả về sau khi tạo thành công.

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function generateProductCode() {
  const digits = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
  const letters = Array.from(
    { length: 3 },
    () => LETTERS[Math.floor(Math.random() * LETTERS.length)]
  ).join("");
  return `EB-${digits}${letters}`;
}