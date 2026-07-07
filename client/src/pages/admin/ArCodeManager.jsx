// ArCodeManager.jsx — Trang quản lý TOÀN BỘ mã AR/QR, gộp theo sách.
//
// Thay đổi so với bản cũ:
//  - Không bắt buộc chọn 1 sách trước mới thấy danh sách — trang này hiện
//    TẤT CẢ mã AR của TẤT CẢ sách, nhóm theo sách (tên sách gộp ô/rowSpan).
//  - 1 ô tìm kiếm DUY NHẤT: khớp theo tên sách, label mã QR, hoặc số mã QR.
//  - Lọc riêng theo "Quyền xem" và "Trạng thái".
//  - Quyền xem (accessType) sửa được NGAY TRÊN TỪNG MÃ (dropdown inline),
//    không còn là thuộc tính chung cho cả cuốn sách.
//  - Có phân trang (phân trang theo SỐ SÁCH mỗi trang, mỗi sách hiện đủ mã của nó).
//
// TODO (backend, làm sau):
//  - GET  /admin/ar-codes?search=&accessType=&status=&page=&limit=
//        trả về { data: { groups: [{ book, arCodes: [...] }], total, totalPages } }
//        search khớp cả product.title, arCode.label, arCode.code.
//  - PATCH /admin/ar-codes/:id/access  body: { accessType }  → đổi quyền xem 1 mã, nhanh, không cần gửi lại file/label.
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QRCodeCanvas } from "qrcode.react";
import {
  Search,
  Plus,
  Edit2,
  Ban,
  CheckCircle2,
  X,
  Download,
  Copy,
  Upload,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import AdminLayout from "./AdminLayout";

const EMPTY_CREATE_FORM = { label: "", file: null, accessType: "CUSTOMER_ONLY" };
const ACCESS_OPTIONS = [
  { value: "CUSTOMER_ONLY", label: "Chỉ khách đã mua" },
  { value: "PUBLIC", label: "Công khai" },
];

export default function ArCodeManager() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  /* ── Danh sách gộp theo sách: search / filter / phân trang ── */
  const [search, setSearch] = useState("");
  const [filterAccess, setFilterAccess] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const BOOKS_PER_PAGE = 8;

  /* ── Panel tạo mã mới (không phải modal — mở rộng ngay trong trang) ── */
  const [createOpen, setCreateOpen] = useState(false);
  const [bookQuery, setBookQuery] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [editTarget, setEditTarget] = useState(null); // id mã đang sửa (form đầy đủ), null = tạo mới
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);

  /* ── Panel xem QR ── */
  const [qrTarget, setQrTarget] = useState(null); // { arCode, book }
  const qrWrapRef = useRef(null);

  /* ── Nếu vào trang kèm ?bookId=... (từ trang Chi tiết sách) thì mở sẵn panel tạo mã cho sách đó ── */
  const preselectId = searchParams.get("bookId");
  const { data: preselectBook } = useQuery({
    queryKey: ["admin-product-preselect", preselectId],
    queryFn: () => api.get(`/admin/products/${preselectId}`).then((r) => r.data.data),
    enabled: !!preselectId && !selectedBook,
  });
  useEffect(() => {
    if (preselectBook) {
      setSelectedBook(preselectBook);
      setCreateOpen(true);
    }
  }, [preselectBook]);

  /* ── Gợi ý sách theo tên khi tạo mã mới ── */
  const { data: bookSuggestions = [] } = useQuery({
    queryKey: ["admin-products-quick-search", bookQuery],
    queryFn: () =>
      api.get("/admin/products/search", { params: { q: bookQuery } }).then((r) => r.data.data),
    enabled: bookQuery.trim().length >= 1,
  });

  /* ── Danh sách TẤT CẢ mã AR, gộp theo sách, có search/filter/phân trang ── */
  const { data, isLoading } = useQuery({
    queryKey: ["admin-ar-codes-all", search, filterAccess, filterStatus, page],
    queryFn: () =>
      api
        .get("/admin/ar-codes", {
          params: {
            search,
            accessType: filterAccess,
            status: filterStatus,
            page,
            limit: BOOKS_PER_PAGE,
          },
        })
        .then((r) => r.data.data),
    keepPreviousData: true,
  });

  const groups = data?.groups ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.total ?? 0;

  const hasActiveFilters = search || filterAccess || filterStatus;
  const resetFilters = () => {
    setSearch("");
    setFilterAccess("");
    setFilterStatus("");
    setPage(1);
  };

  /* ── Mutations ── */
  const buildFormData = () => {
    const fd = new FormData();
    fd.append("label", createForm.label);
    fd.append("accessType", createForm.accessType);
    if (createForm.file) fd.append("model", createForm.file);
    return fd;
  };

  const invalidateAll = () => {
    qc.invalidateQueries(["admin-ar-codes-all"]);
  };

  const createMutation = useMutation({
    mutationFn: () => api.post(`/admin/products/${selectedBook.id}/ar-codes`, buildFormData()),
    onSuccess: () => {
      toast.success("Đã tạo mã AR mới!");
      invalidateAll();
      resetCreateForm();
    },
    onError: (e) => toast.error(e.response?.data?.message || "Tạo mã AR thất bại!"),
  });

  const updateMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/ar-codes/${id}`, buildFormData()),
    onSuccess: () => {
      toast.success("Đã cập nhật mã AR!");
      invalidateAll();
      resetCreateForm();
    },
    onError: (e) => toast.error(e.response?.data?.message || "Cập nhật thất bại!"),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/ar-codes/${id}/toggle`),
    onSuccess: () => {
      toast.success("Đã cập nhật trạng thái");
      invalidateAll();
    },
    onError: () => toast.error("Thao tác thất bại!"),
  });

  // Đổi quyền xem NGAY trên từng mã (yêu cầu #8) — không cần mở form sửa đầy đủ.
  const accessMutation = useMutation({
    mutationFn: ({ id, accessType }) => api.patch(`/admin/ar-codes/${id}/access`, { accessType }),
    onSuccess: () => {
      toast.success("Đã đổi quyền xem");
      invalidateAll();
    },
    onError: () => toast.error("Đổi quyền xem thất bại!"),
  });

  /* ── Helpers panel tạo/sửa ── */
  const pickBook = (book) => {
    setSelectedBook(book);
    setBookQuery("");
    setShowSuggest(false);
    resetCreateForm();
  };

  const resetCreateForm = () => {
    setEditTarget(null);
    setCreateForm(EMPTY_CREATE_FORM);
  };

  const closeCreatePanel = () => {
    setCreateOpen(false);
    setSelectedBook(null);
    resetCreateForm();
    if (preselectId) setSearchParams({});
  };

  const openEditForm = (ac, book) => {
    setSelectedBook(book);
    setCreateOpen(true);
    setEditTarget(ac.id);
    setCreateForm({ label: ac.label, file: null, accessType: ac.accessType });
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!createForm.label) {
      toast.error("Vui lòng nhập label");
      return;
    }
    if (!editTarget && !createForm.file) {
      toast.error("Vui lòng chọn file .glb");
      return;
    }
    if (editTarget) updateMutation.mutate(editTarget);
    else createMutation.mutate();
  };

  const isSavingCreate = createMutation.isPending || updateMutation.isPending;

  /* ── Panel xem QR ── */
  const qrUrl = qrTarget
    ? `${window.location.origin}/ar/${qrTarget.book.slug}/${qrTarget.arCode.code}`
    : "";

  const handleDownloadQr = () => {
    const canvas = qrWrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const safeName = (qrTarget.arCode.label || "ar-code")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const link = document.createElement("a");
    link.download = `qr-${safeName}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      toast.success("Đã sao chép link");
    } catch {
      toast.error("Không sao chép được, vui lòng bôi đen và copy thủ công");
    }
  };

  return (
    <AdminLayout crumbs={[{ label: "Tạo mã QR" }]}>
      <div className="a-page-header">
        <div>
          <p className="a-page-eyebrow">AR / QR</p>
          <h1 className="a-page-title">
            Quản lý mã <em>QR</em>
          </h1>
        </div>
        <button
          className="a-btn-primary"
          onClick={() => (createOpen ? closeCreatePanel() : setCreateOpen(true))}
        >
          <Plus size={13} />
          {createOpen ? "Đóng" : "Tạo mã QR mới"}
        </button>
      </div>

      {/* ══ Panel tạo / sửa mã (mở rộng trong trang, không phải modal) ══ */}
      {createOpen && (
        <div className="a-chart-card" style={{ marginBottom: 20 }}>
          <div className="a-chart-card-header">
            <h3 className="a-chart-title">
              {editTarget ? "Chỉnh sửa mã AR" : (
                <>
                  1. Chọn <em>sách</em> → 2. Tạo mã <em>AR mới</em>
                </>
              )}
            </h3>
          </div>

          {/* Bước 1: chọn sách (bỏ qua nếu đang sửa mã có sẵn) */}
          {!editTarget && (
            <div style={{ marginBottom: 16 }}>
              {selectedBook ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                    <div className="a-book-thumb">
                      {selectedBook.coverImage ? (
                        <img src={selectedBook.coverImage} alt={selectedBook.title} />
                      ) : (
                        <Upload size={12} />
                      )}
                    </div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{selectedBook.title}</div>
                  </div>
                  <button className="a-btn-ghost" onClick={() => { setSelectedBook(null); resetCreateForm(); }}>
                    Đổi sách khác
                  </button>
                </div>
              ) : (
                <div style={{ position: "relative", maxWidth: 420 }}>
                  <div className="a-search-wrap" style={{ marginBottom: 0, maxWidth: "100%" }}>
                    <Search size={13} className="a-search-icon" />
                    <input
                      className="a-input"
                      placeholder="Tìm theo tên sách..."
                      value={bookQuery}
                      onChange={(e) => { setBookQuery(e.target.value); setShowSuggest(true); }}
                      onFocus={() => setShowSuggest(true)}
                    />
                  </div>
                  {showSuggest && bookQuery.trim().length >= 1 && (
                    <div
                      style={{
                        position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
                        background: "#fff", border: "1px solid #e8e5de", borderRadius: 8,
                        marginTop: 4, maxHeight: 260, overflowY: "auto",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                      }}
                    >
                      {bookSuggestions.length === 0 ? (
                        <div style={{ padding: 14, fontSize: 12, color: "rgba(13,51,48,0.4)" }}>
                          Không tìm thấy sách
                        </div>
                      ) : (
                        bookSuggestions.map((b) => (
                          <div
                            key={b.id}
                            onClick={() => pickBook(b)}
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", cursor: "pointer" }}
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            <div className="a-book-thumb" style={{ width: 26, height: 34 }}>
                              {b.coverImage ? <img src={b.coverImage} alt={b.title} /> : <Upload size={10} />}
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 500 }}>{b.title}</div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bước 2: form tạo / sửa (chỉ hiện khi đã có sách) */}
          {(selectedBook || editTarget) && (
            <form onSubmit={handleCreateSubmit}>
              <div className="a-form-grid" style={{ marginBottom: 14 }}>
                <div className="a-form-group">
                  <label className="a-form-label">Label (tên gợi nhớ nội bộ)</label>
                  <input
                    className="a-input"
                    value={createForm.label}
                    onChange={(e) => setCreateForm((f) => ({ ...f, label: e.target.value }))}
                    placeholder="vd: Con voi"
                    required
                  />
                </div>
                <div className="a-form-group">
                  <label className="a-form-label">
                    File mô hình .glb {editTarget && "(để trống nếu không đổi)"}
                  </label>
                  <input
                    type="file"
                    accept=".glb,model/gltf-binary"
                    onChange={(e) => setCreateForm((f) => ({ ...f, file: e.target.files?.[0] || null }))}
                  />
                </div>
                <div className="a-form-group span-2">
                  <label className="a-form-label">Quyền xem (áp dụng cho riêng mã này)</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {ACCESS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={createForm.accessType === opt.value ? "a-btn-primary" : "a-btn-ghost"}
                        onClick={() => setCreateForm((f) => ({ ...f, accessType: opt.value }))}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <span style={{ fontSize: 10, color: "rgba(13,51,48,0.4)", marginTop: 6 }}>
                    Staff và Admin luôn xem được bất kể lựa chọn ở đây.
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" className="a-btn-primary" disabled={isSavingCreate}>
                  {isSavingCreate ? "Đang lưu..." : editTarget ? "Lưu thay đổi" : "Tạo mã AR"}
                </button>
                <button type="button" className="a-btn-ghost" onClick={closeCreatePanel}>
                  Hủy
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── Search + Filters (1 hàng, wrap khi hẹp) ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 16 }}>
        <div className="a-search-wrap" style={{ marginBottom: 0, flex: "1 1 280px", maxWidth: 380 }}>
          <Search size={13} className="a-search-icon" />
          <input
            className="a-input"
            placeholder="Tìm theo tên sách / tên mã QR / số mã QR..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <select
          className="a-input a-select"
          style={{ maxWidth: 190 }}
          value={filterAccess}
          onChange={(e) => { setFilterAccess(e.target.value); setPage(1); }}
        >
          <option value="">Mọi quyền xem</option>
          {ACCESS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          className="a-input a-select"
          style={{ maxWidth: 160 }}
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
        >
          <option value="">Mọi trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Vô hiệu hoá</option>
        </select>

        {hasActiveFilters && (
          <button type="button" className="a-btn-ghost" onClick={resetFilters}>
            Xóa lọc
          </button>
        )}
      </div>

      <div className="a-chart-grid-2">
        {/* ── Danh sách gộp theo sách ── */}
        <div className="a-table-card">
          <div className="a-table-head">
            <h3 className="a-table-title">
              Tất cả mã <em>AR</em>
            </h3>
          </div>
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  {["Sách", "Label", "Quyền xem", "Lượt quét", "Trạng thái", ""].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 32, textAlign: "center", color: "rgba(13,51,48,0.3)" }}>
                      Đang tải...
                    </td>
                  </tr>
                ) : !groups.length ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 32, textAlign: "center", color: "rgba(13,51,48,0.3)" }}>
                      Không tìm thấy mã AR nào
                    </td>
                  </tr>
                ) : (
                  groups.map((group) =>
                    group.arCodes.map((ac, idx) => (
                      <tr
                        key={ac.id}
                        onClick={() => setQrTarget({ arCode: ac, book: group.book })}
                        style={{
                          cursor: "pointer",
                          background: qrTarget?.arCode.id === ac.id ? "var(--a-surface)" : undefined,
                        }}
                      >
                        {/* Cột "Sách" gộp ô cho tất cả mã của cùng 1 sách */}
                        {idx === 0 && (
                          <td
                            rowSpan={group.arCodes.length}
                            style={{ verticalAlign: "top", borderRight: "1px solid #e8e5de" }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                              <div className="a-book-thumb" style={{ width: 26, height: 34 }}>
                                {group.book.coverImage ? (
                                  <img src={group.book.coverImage} alt={group.book.title} />
                                ) : (
                                  <Upload size={10} />
                                )}
                              </div>
                              <div>
                                <div style={{ fontWeight: 500, fontSize: 12 }}>{group.book.title}</div>
                                <div className="a-td-muted">{group.arCodes.length} mã AR</div>
                              </div>
                            </div>
                          </td>
                        )}

                        <td style={{ fontWeight: 500, fontSize: 12 }}>
                          {ac.label}
                          <div className="a-td-mono" style={{ fontSize: 10, marginTop: 2 }}>{ac.code}</div>
                        </td>

                        {/* Quyền xem: dropdown sửa NGAY tại chỗ, riêng cho từng mã */}
                        <td onClick={(e) => e.stopPropagation()}>
                          <select
                            className="a-input a-select"
                            style={{ fontSize: 11, padding: "4px 8px", maxWidth: 170 }}
                            value={ac.accessType}
                            onChange={(e) =>
                              accessMutation.mutate({ id: ac.id, accessType: e.target.value })
                            }
                          >
                            {ACCESS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </td>

                        <td className="a-td-muted">{ac.scanCount}</td>

                        <td>
                          <span className={`a-badge ${ac.isActive ? "success" : "neutral"}`}>
                            {ac.isActive ? "Hoạt động" : "Vô hiệu hoá"}
                          </span>
                        </td>

                        <td>
                          <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                            <button
                              className="a-btn-icon edit"
                              onClick={() => openEditForm(ac, group.book)}
                              title="Sửa"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              className="a-btn-icon"
                              onClick={() => toggleMutation.mutate(ac.id)}
                              title={ac.isActive ? "Vô hiệu hoá" : "Kích hoạt lại"}
                            >
                              {ac.isActive ? <Ban size={12} /> : <CheckCircle2 size={12} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination (theo số sách mỗi trang) */}
          <div className="a-pagination">
            <span className="a-pagination-info">Tổng {totalCount} sách có mã AR</span>
            <div className="a-pagination-btns">
              <button
                className="a-page-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ‹
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    className={`a-page-btn${p === page ? " active" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                className="a-page-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {/* ── Panel xem QR ── */}
        <div className="a-chart-card">
          <div className="a-chart-card-header">
            <h3 className="a-chart-title">
              Mã <em>QR</em>
            </h3>
            <p className="a-chart-sub">Bấm 1 dòng bên trái để xem QR</p>
          </div>
          {!qrTarget ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "rgba(13,51,48,0.3)", fontSize: 12 }}>
              Chưa chọn mã AR nào
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 10 }}>
                {qrTarget.book.title} — {qrTarget.arCode.label}
              </div>
              <div ref={qrWrapRef} style={{ display: "flex", justifyContent: "center", padding: "4px 0 16px" }}>
                <QRCodeCanvas value={qrUrl} size={180} level="M" includeMargin bgColor="#ffffff" fgColor="#0D3330" />
              </div>
              <div
                style={{
                  fontFamily: "monospace", fontSize: 10, wordBreak: "break-all", textAlign: "left",
                  background: "#f5f3ee", padding: "8px 10px", borderRadius: 6, marginBottom: 14, color: "#0D3330",
                }}
              >
                {qrUrl}
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <button className="a-btn-primary" onClick={handleDownloadQr}>
                  <Download size={12} /> Tải PNG
                </button>
                <button className="a-btn-ghost" onClick={handleCopyLink}>
                  <Copy size={12} /> Sao chép link
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}