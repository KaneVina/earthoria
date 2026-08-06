// InventoryImport.jsx — Trang "Nhập kho" (đường link riêng, không phải modal)
//
// Luồng:
//  1) Admin có thể tải file mẫu Excel, điền rồi import lại — HOẶC nhập tay từng dòng.
//  2) Mỗi dòng có thể "Chọn sách có sẵn" (autocomplete, khoá các field hệ thống,
//     tự lấy Số lượng cũ = tồn kho hiện tại) hoặc "Nhập mã mới" (gõ tay toàn bộ,
//     Số lượng cũ mặc định = 0 vì sách chưa có trong hệ thống).
//  3) Cột "Số lượng mới" tách 2 phần: Theo chứng từ / Thực nhập. Nếu 2 số này
//     lệch nhau, dòng đó được cảnh báo (viền/nền đỏ nhạt) — nhưng khi cộng vào
//     kho hệ thống CHỈ dùng số Thực nhập.
//  4) Tổng số lượng = Số lượng cũ + Thực nhập. Thành tiền = Đơn giá × Thực nhập.
//  5) Khi lưu, cả phiếu được gán 1 mã phiếu riêng (PN-...) + người tạo (lấy từ
//     tài khoản admin đang đăng nhập) để sau này tra lịch sử nhập kho.
//
// TODO (backend, làm sau):
//  - GET  /admin/products/search?code=EB-xxxxxx   → tìm chính xác 1 sách theo mã, dùng để auto-khớp khi import Excel.
//  - POST /admin/inventory/imports                 body: { code, items: [...] }
//        Server tự lấy người tạo từ token đăng nhập (không tin field FE gửi lên),
//        cộng qtyActual vào stock của từng sách, và lưu lại lịch sử theo mã phiếu.
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Download,
  Upload,
  Plus,
  Trash2,
  Search,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";
import api from "../../../services/api";
import { formatPrice } from "../../../utils/helpers";
import { useAuthStore } from "../../../store/authStore";
import toast from "react-hot-toast";
import AdminLayout from "../AdminLayout";
import { generateImportCode } from "../../../utils/generateImportCode";
import { downloadImportTemplate, parseImportFile } from "./inventoryExcelUtils";

const makeEmptyRow = () => ({
  rowId: crypto.randomUUID ? crypto.randomUUID() : String(Math.random()),
  mode: "manual", // 'existing' | 'manual'
  productId: null,
  title: "",
  productCode: "",
  unit: "Cuốn",
  oldQty: 0,
  qtyDocument: "",
  qtyActual: "",
  unitPrice: "",
  // ô tìm sách riêng cho từng dòng (không liên quan tới form)
  _bookQuery: "",
  _showSuggest: false,
});

export default function InventoryImport() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const fileInputRef = useRef(null);

  const [importCode] = useState(() => generateImportCode());
  const [rows, setRows] = useState([makeEmptyRow()]);
  const [isMatching, setIsMatching] = useState(false);

  const updateRow = (rowId, patch) => {
    setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)));
  };
  const removeRow = (rowId) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.rowId !== rowId) : prev));
  };
  const addRow = () => setRows((prev) => [...prev, makeEmptyRow()]);

  /*  Gợi ý sách theo tên khi chọn "sách có sẵn" cho 1 dòng  */
  const bookSuggestQueryKey = (rowId, q) => ["admin-products-quick-search", rowId, q];

  const pickBookForRow = (rowId, book) => {
    updateRow(rowId, {
      mode: "existing",
      productId: book.id,
      title: book.title,
      productCode: book.productCode ?? "",
      unit: book.unit || "Cuốn",
      oldQty: book.stock ?? 0,
      _bookQuery: "",
      _showSuggest: false,
    });
  };

  const switchRowMode = (rowId, mode) => {
    if (mode === "manual") {
      updateRow(rowId, { mode: "manual", productId: null, oldQty: 0 });
    } else {
      updateRow(rowId, { mode: "existing", title: "", productCode: "", oldQty: 0 });
    }
  };

  /*  Tải file mẫu  */
  const handleDownloadTemplate = () => {
    downloadImportTemplate();
  };

  /*  Import file Excel  */
  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // cho phép chọn lại cùng 1 file lần sau
    if (!file) return;

    try {
      setIsMatching(true);
      const parsedRows = await parseImportFile(file);
      if (!parsedRows.length) {
        toast.error("File không có dòng dữ liệu hợp lệ");
        return;
      }

      // Cố khớp từng mã sách với hệ thống để tự lấy Số lượng cũ.
      // Chạy song song — với file lớn nên chuyển sang endpoint khớp hàng loạt ở backend.
      const matched = await Promise.all(
        parsedRows.map(async (r) => {
          if (!r.productCode) return { ...r, matchedProduct: null };
          try {
            const res = await api.get("/admin/products/search", {
              params: { code: r.productCode },
            });
            const product = res.data?.data?.[0] ?? null;
            return { ...r, matchedProduct: product };
          } catch {
            return { ...r, matchedProduct: null };
          }
        })
      );

      const newRows = matched.map((r) => {
        const base = makeEmptyRow();
        if (r.matchedProduct) {
          return {
            ...base,
            mode: "existing",
            productId: r.matchedProduct.id,
            title: r.matchedProduct.title,
            productCode: r.matchedProduct.productCode ?? r.productCode,
            unit: r.matchedProduct.unit || r.unit,
            oldQty: r.matchedProduct.stock ?? 0,
            qtyDocument: r.qtyDocument,
            qtyActual: r.qtyActual,
            unitPrice: r.unitPrice,
          };
        }
        return {
          ...base,
          mode: "manual",
          title: r.title,
          productCode: r.productCode,
          unit: r.unit,
          oldQty: 0,
          qtyDocument: r.qtyDocument,
          qtyActual: r.qtyActual,
          unitPrice: r.unitPrice,
        };
      });

      setRows(newRows);
      const matchedCount = matched.filter((r) => r.matchedProduct).length;
      toast.success(
        `Đã đọc ${newRows.length} dòng — khớp được ${matchedCount} sách có sẵn trong hệ thống`
      );
    } catch (err) {
      toast.error("Đọc file thất bại, kiểm tra lại định dạng file mẫu");
    } finally {
      setIsMatching(false);
    }
  };

  /*  Tính toán từng dòng + tổng  */
  const computedRows = useMemo(
    () =>
      rows.map((r) => {
        const qtyActualNum = r.qtyActual === "" ? 0 : Number(r.qtyActual) || 0;
        const qtyDocNum = r.qtyDocument === "" ? 0 : Number(r.qtyDocument) || 0;
        const priceNum = r.unitPrice === "" ? 0 : Number(r.unitPrice) || 0;
        const totalQty = (Number(r.oldQty) || 0) + qtyActualNum;
        const amount = priceNum * qtyActualNum;
        const mismatch =
          r.qtyDocument !== "" && r.qtyActual !== "" && qtyDocNum !== qtyActualNum;
        return { ...r, totalQty, amount, mismatch };
      }),
    [rows]
  );

  const grandTotalActual = computedRows.reduce((s, r) => s + (Number(r.qtyActual) || 0), 0);
  const grandTotalAmount = computedRows.reduce((s, r) => s + r.amount, 0);
  const mismatchCount = computedRows.filter((r) => r.mismatch).length;

  /*  Lưu phiếu  */
  const saveMutation = useMutation({
    mutationFn: () =>
      api.post("/admin/inventory/imports", {
        code: importCode,
        items: computedRows.map((r) => ({
          productId: r.mode === "existing" ? r.productId : null,
          title: r.title,
          productCode: r.productCode,
          unit: r.unit,
          oldQty: Number(r.oldQty) || 0,
          qtyDocument: r.qtyDocument === "" ? null : Number(r.qtyDocument),
          qtyActual: Number(r.qtyActual) || 0,
          unitPrice: Number(r.unitPrice) || 0,
        })),
      }),
    onSuccess: () => {
      toast.success(`Đã lưu phiếu nhập kho ${importCode}!`);
      qc.invalidateQueries(["admin-products"]);
      navigate("/dashboard/products");
    },
    onError: (e) => toast.error(e.response?.data?.message || "Lưu phiếu thất bại!"),
  });

  const handleSave = () => {
    const invalidRow = computedRows.find((r) => !r.title || r.qtyActual === "");
    if (invalidRow) {
      toast.error("Vui lòng nhập đủ Tên sản phẩm và Số lượng thực nhập cho tất cả các dòng");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <AdminLayout
      crumbs={[
        { label: "Sản phẩm", to: "/dashboard/products" },
        { label: "Nhập kho" },
      ]}
    >
      <button
        className="a-btn-ghost"
        onClick={() => navigate("/dashboard/products")}
        style={{ marginBottom: 18 }}
      >
        <ArrowLeft size={13} /> Quay lại danh sách sách
      </button>

      <div className="a-page-header">
        <div>
          <p className="a-page-eyebrow">Kho hàng</p>
          <h1 className="a-page-title">
            Nhập <em>kho</em>
          </h1>
        </div>
      </div>

      {/*  Thông tin phiếu  */}
      <div className="a-chart-card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
          <div>
            <div className="a-form-label">Mã phiếu</div>
            <span
              className="a-badge info"
              style={{ fontFamily: "monospace", fontSize: 13, padding: "6px 12px" }}
            >
              {importCode}
            </span>
          </div>
          <div>
            <div className="a-form-label">Người tạo</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{user?.name ?? "Admin"}</div>
          </div>
          <div>
            <div className="a-form-label">Ngày tạo</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>
              {new Date().toLocaleDateString("vi-VN")}
            </div>
          </div>
        </div>
      </div>

      {/*  2 nút: tải mẫu / import  */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <button type="button" className="a-btn-ghost" onClick={handleDownloadTemplate}>
          <Download size={13} /> Tải file mẫu Excel
        </button>
        <button
          type="button"
          className="a-btn-primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isMatching}
        >
          <FileSpreadsheet size={13} />
          {isMatching ? "Đang đọc file..." : "Nhập file Excel"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: "none" }}
          onChange={handleImportFile}
        />
      </div>

      {mismatchCount > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#fdecea",
            color: "#c05050",
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: 12,
            marginBottom: 14,
          }}
        >
          <AlertTriangle size={14} />
          Có {mismatchCount} dòng lệch số lượng giữa "chứng từ" và "thực nhập" — khi lưu, hệ
          thống chỉ cộng vào kho theo số <strong>thực nhập</strong>.
        </div>
      )}

      {/*  Bảng nhập liệu  */}
      <div className="a-table-card">
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>STT</th>
                <th style={{ minWidth: 220 }}>Tên sản phẩm</th>
                <th>Mã số</th>
                <th>Đơn vị tính</th>
                <th style={{ minWidth: 90 }}>SL cũ</th>
                <th style={{ minWidth: 110 }}>SL theo chứng từ</th>
                <th style={{ minWidth: 110 }}>SL thực nhập</th>
                <th style={{ minWidth: 90 }}>Tổng SL</th>
                <th style={{ minWidth: 110 }}>Đơn giá</th>
                <th style={{ minWidth: 120 }}>Thành tiền</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {computedRows.map((r, idx) => (
                <tr
                  key={r.rowId}
                  style={r.mismatch ? { background: "#fdecea" } : undefined}
                >
                  <td className="a-td-muted">{idx + 1}</td>

                  {/* Tên sản phẩm + chọn chế độ */}
                  <td>
                    <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                      <button
                        type="button"
                        onClick={() => switchRowMode(r.rowId, "existing")}
                        style={{
                          padding: "2px 8px",
                          fontSize: 10,
                          borderRadius: 5,
                          cursor: "pointer",
                          border: "1px solid #e8e5de",
                          background: r.mode === "existing" ? "#0D3330" : "#fff",
                          color: r.mode === "existing" ? "#fff" : "#0D3330",
                        }}
                      >
                        Sách có sẵn
                      </button>
                      <button
                        type="button"
                        onClick={() => switchRowMode(r.rowId, "manual")}
                        style={{
                          padding: "2px 8px",
                          fontSize: 10,
                          borderRadius: 5,
                          cursor: "pointer",
                          border: "1px solid #e8e5de",
                          background: r.mode === "manual" ? "#0D3330" : "#fff",
                          color: r.mode === "manual" ? "#fff" : "#0D3330",
                        }}
                      >
                        Mã mới
                      </button>
                    </div>

                    {r.mode === "existing" ? (
                      r.productId ? (
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{r.title}</div>
                      ) : (
                        <div style={{ position: "relative" }}>
                          <div className="a-search-wrap" style={{ marginBottom: 0 }}>
                            <Search size={12} className="a-search-icon" />
                            <input
                              className="a-input"
                              style={{ fontSize: 12, padding: "6px 8px 6px 26px" }}
                              placeholder="Tìm tên sách..."
                              value={r._bookQuery}
                              onChange={(e) =>
                                updateRow(r.rowId, { _bookQuery: e.target.value, _showSuggest: true })
                              }
                              onFocus={() => updateRow(r.rowId, { _showSuggest: true })}
                            />
                          </div>
                          {r._showSuggest && r._bookQuery.trim().length >= 1 && (
                            <BookSuggestList
                              query={r._bookQuery}
                              onPick={(book) => pickBookForRow(r.rowId, book)}
                            />
                          )}
                        </div>
                      )
                    ) : (
                      <input
                        className="a-input"
                        style={{ fontSize: 12 }}
                        value={r.title}
                        onChange={(e) => updateRow(r.rowId, { title: e.target.value })}
                        placeholder="Tên sách mới"
                      />
                    )}
                  </td>

                  {/* Mã số */}
                  <td>
                    <input
                      className="a-input"
                      style={{ fontSize: 12, fontFamily: "monospace", minWidth: 120 }}
                      value={r.productCode}
                      onChange={(e) => updateRow(r.rowId, { productCode: e.target.value })}
                      readOnly={r.mode === "existing" && !!r.productId}
                      placeholder="EB-..."
                    />
                  </td>

                  {/* Đơn vị tính */}
                  <td>
                    <input
                      className="a-input"
                      style={{ fontSize: 12, minWidth: 80 }}
                      value={r.unit}
                      onChange={(e) => updateRow(r.rowId, { unit: e.target.value })}
                      placeholder="Cuốn"
                    />
                  </td>

                  {/* SL cũ (read-only, tự lấy từ tồn kho hệ thống) */}
                  <td className="a-td-muted" style={{ textAlign: "right" }}>
                    {r.oldQty}
                  </td>

                  {/* SL theo chứng từ */}
                  <td>
                    <input
                      className="a-input"
                      type="number"
                      min={0}
                      style={{ fontSize: 12, textAlign: "right" }}
                      value={r.qtyDocument}
                      onChange={(e) => updateRow(r.rowId, { qtyDocument: e.target.value })}
                    />
                  </td>

                  {/* SL thực nhập */}
                  <td>
                    <input
                      className="a-input"
                      type="number"
                      min={0}
                      style={{ fontSize: 12, textAlign: "right" }}
                      value={r.qtyActual}
                      onChange={(e) => updateRow(r.rowId, { qtyActual: e.target.value })}
                      required
                    />
                    {r.mismatch && (
                      <div style={{ fontSize: 9, color: "#c05050", marginTop: 2 }}>
                        Lệch {Math.abs((Number(r.qtyDocument) || 0) - (Number(r.qtyActual) || 0))} so
                        với chứng từ
                      </div>
                    )}
                  </td>

                  {/* Tổng SL */}
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{r.totalQty}</td>

                  {/* Đơn giá */}
                  <td>
                    <input
                      className="a-input"
                      type="number"
                      min={0}
                      style={{ fontSize: 12, textAlign: "right" }}
                      value={r.unitPrice}
                      onChange={(e) => updateRow(r.rowId, { unitPrice: e.target.value })}
                    />
                  </td>

                  {/* Thành tiền */}
                  <td style={{ textAlign: "right", fontWeight: 600 }}>
                    {formatPrice(r.amount)}
                  </td>

                  <td>
                    <button
                      type="button"
                      className="a-btn-icon delete"
                      onClick={() => removeRow(r.rowId)}
                      title="Xóa dòng"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={6} style={{ textAlign: "right", fontWeight: 600, fontSize: 12 }}>
                  Tổng cộng
                </td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>{grandTotalActual}</td>
                <td></td>
                <td></td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>
                  {formatPrice(grandTotalAmount)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style={{ padding: 14 }}>
          <button type="button" className="a-btn-ghost" onClick={addRow}>
            <Plus size={13} /> Thêm dòng
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <button
          type="button"
          className="a-btn-primary"
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? "Đang lưu..." : "Lưu phiếu nhập kho"}
        </button>
        <button type="button" className="a-btn-ghost" onClick={() => navigate("/dashboard/products")}>
          Hủy
        </button>
      </div>
    </AdminLayout>
  );
}

/*  Danh sách gợi ý sách cho 1 dòng (autocomplete nhỏ)  */
function BookSuggestList({ query, onPick }) {
  const { data: suggestions = [] } = useQuery({
    queryKey: ["admin-products-quick-search-row", query],
    queryFn: () => api.get("/admin/products/search", { params: { q: query } }).then((r) => r.data.data),
    enabled: query.trim().length >= 1,
  });

  return (
    <div
      style={{
        position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
        background: "#fff", border: "1px solid #e8e5de", borderRadius: 8,
        marginTop: 4, maxHeight: 220, overflowY: "auto",
        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
      }}
    >
      {suggestions.length === 0 ? (
        <div style={{ padding: 12, fontSize: 11, color: "rgba(13,51,48,0.4)" }}>
          Không tìm thấy sách
        </div>
      ) : (
        suggestions.map((b) => (
          <div
            key={b.id}
            onClick={() => onPick(b)}
            onMouseDown={(e) => e.preventDefault()}
            style={{ padding: "8px 12px", cursor: "pointer", fontSize: 12 }}
          >
            <div style={{ fontWeight: 500 }}>{b.title}</div>
            <div style={{ fontSize: 10, color: "rgba(13,51,48,0.4)", fontFamily: "monospace" }}>
              {b.productCode ?? "—"}
            </div>
          </div>
        ))
      )}
    </div>
  );
}