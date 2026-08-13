import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Edit2, Plus, Upload, BookOpen, Trash2, Eye, EyeOff, X } from "lucide-react";
import { ebookService } from "../../services/ebookService";
import api from "../../services/api";
import toast from "react-hot-toast";
import AdminLayout from "./AdminLayout";
import "../../components/assets/css/gamestudio.css";

/* Modal chọn sách để gắn nội dung sách điện tử */
function PickBookModal({ onPick, onClose }) {
  const [q, setQ] = useState("");
  const { data: results = [], isFetching } = useQuery({
    queryKey: ["admin-products-search-for-ebook", q],
    queryFn: () => api.get("/admin/products/search", { params: { q } }).then((r) => r.data.data),
    enabled: q.trim().length >= 1,
  });

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(20,51,42,0.35)", zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 14, width: 420, maxWidth: "100%", padding: 18, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 15 }}>Chọn sách để tạo bản điện tử</h3>
          <button onClick={onClose} className="a-btn-icon" style={{ border: "none", background: "transparent", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>
        <div className="a-search-wrap" style={{ marginBottom: 10 }}>
          <Search size={13} className="a-search-icon" />
          <input
            autoFocus
            className="a-input"
            placeholder="Gõ tên sách..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div style={{ maxHeight: 320, overflowY: "auto" }}>
          {q.trim().length < 1 ? (
            <div style={{ padding: 16, fontSize: 12, color: "rgba(13,51,48,0.4)", textAlign: "center" }}>
              Nhập tên sách để tìm
            </div>
          ) : isFetching ? (
            <div style={{ padding: 16, fontSize: 12, textAlign: "center", color: "rgba(13,51,48,0.4)" }}>Đang tìm...</div>
          ) : results.length === 0 ? (
            <div style={{ padding: 16, fontSize: 12, textAlign: "center", color: "rgba(13,51,48,0.4)" }}>Không tìm thấy sách</div>
          ) : (
            results.map((b) => (
              <div
                key={b.id}
                onClick={() => onPick(b)}
                style={{ padding: "10px 8px", cursor: "pointer", fontSize: 13, borderBottom: "1px solid #f1efe9", display: "flex", justifyContent: "space-between" }}
              >
                <span>{b.title}</span>
                {b.productCode && <span style={{ fontSize: 10, color: "rgba(13,51,48,0.4)", fontFamily: "monospace" }}>{b.productCode}</span>}
              </div>
            ))
          )}
        </div>
        <p style={{ fontSize: 11, color: "rgba(13,51,48,0.45)", marginTop: 10, marginBottom: 0 }}>
          Sau khi tạo nội dung, nhớ vào trang sửa sản phẩm của sách này để thêm biến thể <strong>Sách điện tử</strong> và đặt giá bán.
        </p>
      </div>
    </div>
  );
}

export default function EbookManager() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pickerOpen, setPickerOpen] = useState(false);
  const BOOKS_PER_PAGE = 8;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-ebooks-all", search, filterStatus, page],
    queryFn: () =>
      ebookService
        .list({ search, status: filterStatus, page, limit: BOOKS_PER_PAGE })
        .then((r) => r.data.data),
    keepPreviousData: true,
  });

  const groups = data?.groups ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.total ?? 0;

  const hasActiveFilters = search || filterStatus;
  const resetFilters = () => {
    setSearch("");
    setFilterStatus("");
    setPage(1);
  };

  const toggleMutation = useMutation({
    mutationFn: (id) => ebookService.toggle(id),
    onSuccess: () => {
      toast.success("Đã cập nhật trạng thái");
      qc.invalidateQueries(["admin-ebooks-all"]);
    },
    onError: () => toast.error("Thao tác thất bại!"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => ebookService.remove(id),
    onSuccess: () => {
      toast.success("Đã xóa sách điện tử");
      qc.invalidateQueries(["admin-ebooks-all"]);
    },
    onError: (e) => toast.error(e.response?.data?.message || "Xóa thất bại!"),
  });

  const handleDelete = (e, ebook) => {
    e.stopPropagation();
    if (window.confirm(`Xóa sách điện tử "${ebook.title}"? Không thể hoàn tác.`)) {
      deleteMutation.mutate(ebook.id);
    }
  };

  return (
    <AdminLayout crumbs={[{ label: "Sách điện tử" }]}>
      <div className="a-page-header" style={{ marginBottom: 0 }}>
        <div>
          <p className="a-page-eyebrow">Tương tác</p>
          <h1 className="a-page-title">
            Quản lý <em>Sách điện tử</em>
          </h1>
        </div>
      </div>

      <div className="a-ar-filter-bar" style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <button className="a-btn-primary" style={{ flexShrink: 0 }} onClick={() => setPickerOpen(true)}>
          <Plus size={13} />
          Tạo sách điện tử mới
        </button>
        <div className="a-search-wrap" style={{ marginBottom: 0, flex: "1 1 280px", maxWidth: 380 }}>
          <Search size={13} className="a-search-icon" />
          <input
            className="a-input"
            placeholder="Tìm theo tên sách / tên sách điện tử..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="a-input a-select"
          style={{ maxWidth: 160 }}
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Mọi trạng thái</option>
          <option value="active">Đã bật</option>
          <option value="inactive">Đang soạn</option>
        </select>

        {hasActiveFilters && (
          <button type="button" className="a-btn-ghost" onClick={resetFilters}>
            Xóa lọc
          </button>
        )}
      </div>

      <div className="a-table-card">
        <div className="a-table-head">
          <h3 className="a-table-title">
            Tất cả <em>sách điện tử</em>
          </h3>
        </div>

        <div className="a-ar-scroll-body">
          <table className="a-table">
            <thead>
              <tr>
                {["Sách", "Sách điện tử", "Số trang", "Trạng thái", ""].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ padding: 32, textAlign: "center", color: "rgba(13,51,48,0.3)" }}>
                    Đang tải...
                  </td>
                </tr>
              ) : !groups.length ? (
                <tr>
                  <td colSpan={5} style={{ padding: 32, textAlign: "center", color: "rgba(13,51,48,0.3)" }}>
                    <BookOpen size={22} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <div>Chưa có sách điện tử nào khớp bộ lọc</div>
                  </td>
                </tr>
              ) : (
                groups.map((group) =>
                  group.ebooks.map((eb, idx) => (
                    <tr
                      key={eb.id}
                      onClick={() => navigate(`/dashboard/ebooks/${eb.id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      {idx === 0 && (
                        <td rowSpan={group.ebooks.length} className="a-ar-book-cell">
                          <div className="a-ar-book-cell-inner">
                            <div className="a-book-thumb" style={{ width: 26, height: 34, flexShrink: 0 }}>
                              {group.book.coverImage ? (
                                <img src={group.book.coverImage} alt={group.book.title} />
                              ) : (
                                <Upload size={10} />
                              )}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontWeight: 600,
                                  fontSize: 12,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {group.book.title}
                              </div>
                              <div className="a-td-muted">{group.ebooks.length} sách điện tử</div>
                            </div>
                          </div>
                        </td>
                      )}

                      <td style={{ fontWeight: 500, fontSize: 12 }}>{eb.title}</td>

                      <td className="a-td-muted">{eb.pageCount} trang</td>

                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          className={`a-badge ${eb.isActive ? "success" : "neutral"}`}
                          style={{ border: "none", cursor: "pointer", display: "inline-flex", gap: 4, alignItems: "center" }}
                          onClick={() => toggleMutation.mutate(eb.id)}
                          title="Bấm để đổi trạng thái"
                        >
                          {eb.isActive ? <Eye size={11} /> : <EyeOff size={11} />}
                          {eb.isActive ? "Đã bật" : "Đang soạn"}
                        </button>
                      </td>

                      <td>
                        <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                          <button
                            className="a-btn-icon edit"
                            onClick={() => navigate(`/dashboard/ebooks/${eb.id}`)}
                            title="Soạn nội dung"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button className="a-btn-icon delete" onClick={(e) => handleDelete(e, eb)} title="Xóa">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )),
                )
              )}
            </tbody>
          </table>
        </div>

        <div className="a-pagination">
          <span className="a-pagination-info">Tổng {totalCount} sách có nội dung điện tử</span>
          <div className="a-pagination-btns">
            <button className="a-page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              ‹
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <button key={p} className={`a-page-btn${p === page ? " active" : ""}`} onClick={() => setPage(p)}>
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

      {pickerOpen && (
        <PickBookModal
          onClose={() => setPickerOpen(false)}
          onPick={(book) => {
            setPickerOpen(false);
            navigate(`/dashboard/ebooks/new?bookId=${book.id}`);
          }}
        />
      )}
    </AdminLayout>
  );
}