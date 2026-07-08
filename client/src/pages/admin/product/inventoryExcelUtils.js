// inventoryExcelUtils.js — Tải file mẫu (link cố định từ Google Sheets của
// admin) & đọc file Excel khi import lại.
//
// Cấu trúc file mẫu (cố định, không được đổi nếu không sửa lại code này):
//   - Hàng 1–7: tiêu đề / header gộp ô, KHÔNG chứa dữ liệu.
//   - Hàng 8 trở đi: dữ liệu, đúng theo cột:
//       A = STT
//       B = Tên sản phẩm
//       C = Mã số
//       D = Đơn vị tính
//       E = SL theo chứng từ
//       F = SL thực nhập
//       G = Đơn giá
//       H = Thành tiền (công thức, không cần đọc — FE tự tính lại)
import * as XLSX from "xlsx";

// Link tải file mẫu — file .xlsx thật đã được admin chuẩn bị sẵn trên
// Google Sheets, export thẳng về dạng .xlsx khi tải.
const TEMPLATE_URL =
  "https://docs.google.com/spreadsheets/d/1SZZqTk3nyRtuXUQxbWoqxo-qLJeiDJ2e/export?format=xlsx";

// Dữ liệu bắt đầu từ hàng 8 (1-based) => index 7 khi đọc dạng mảng 0-based
const DATA_START_ROW_INDEX = 7;

/** Tải file mẫu nhập kho — mở link Google Sheets export, trình duyệt tự tải .xlsx */
export function downloadImportTemplate() {
  const link = document.createElement("a");
  link.href = TEMPLATE_URL;
  link.setAttribute("download", "mau-nhap-kho.xlsx");
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Đọc file Excel do admin upload theo đúng layout mẫu cố định
 * (header hàng 1–7, dữ liệu từ hàng 8, cột A→H).
 * Trả về mảng row thô — việc khớp mã sách với hệ thống xử lý riêng ở component.
 */
export function parseImportFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];

        // Đọc dạng mảng 2 chiều theo vị trí cột (A,B,C...), KHÔNG dựa vào
        // tên header (vì header bị gộp ô nhiều hàng, không map thẳng theo key được)
        const rows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
          raw: true,
        });

        const dataRows = rows.slice(DATA_START_ROW_INDEX);

        const parsed = dataRows
          // Cột B (index 1) = Tên sản phẩm, dòng trống thì bỏ qua
          .filter((r) => String(r[1] ?? "").trim() !== "")
          .map((r) => ({
            title: String(r[1] ?? "").trim(),
            productCode: String(r[2] ?? "").trim(),
            unit: String(r[3] ?? "Cuốn").trim() || "Cuốn",
            qtyDocument: r[4] === "" || r[4] === undefined ? "" : Number(r[4]) || 0,
            qtyActual: r[5] === "" || r[5] === undefined ? "" : Number(r[5]) || 0,
            unitPrice: r[6] === "" || r[6] === undefined ? "" : Number(r[6]) || 0,
          }));

        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Không đọc được file"));
    reader.readAsArrayBuffer(file);
  });
}