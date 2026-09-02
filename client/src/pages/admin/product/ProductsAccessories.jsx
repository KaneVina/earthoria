import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Eye, Trash2, X, Package } from "lucide-react";
import api from "../../../services/api";
import { formatPrice } from "../../../utils/helpers";
import toast from "react-hot-toast";

export default function ProductsAccessories() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-accessories", page, search],
    queryFn: () =>
      api
        .get("/admin/accessories", { params: { page, limit: 12, search } })
        .then((r) => r.data.data),
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/accessories/${id}`),
    onSuccess: () => {
      toast.success("Đã xóa phụ kiện!");
      qc.invalidateQueries(["admin-accessories"]);
      setConfirmDelete(null);
    },
    onError: () => toast.error("Xóa thất bại!"),
  });

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.total ?? 0;

  return (
    <>
      {/*  Search + nút thêm mới  */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          className="a-search-wrap"
          style={{ marginBottom: 0, flex: "1 1 260px", maxWidth: 360 }}
        >
          <Search size={13} className="a-search-icon" />
          <input
            className="a-input"
            type="text"
            placeholder="Tìm theo tên phụ kiện / mã sản phẩm..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <button
          className="a-btn-primary"
          onClick={() => navigate("/dashboard/products/accessories/new")}
        >
          <Plus size={13} />
          Thêm phụ kiện mới
        </button>
      </div>

      {/*  Table  */}
      <div className="a-table-card" style={{ marginTop: 16 }}>
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                {[
                  "Phụ kiện",
                  "Loại",
                  "Giá",
                  "Tồn kho",
                  "Đã bán",
                  "Trạng thái",
                  "",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: 48,
                      textAlign: "center",
                      color: "rgba(13,51,48,0.3)",
                    }}
                  >
                    Đang tải...
                  </td>
                </tr>
              ) : !items.length ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: 48,
                      textAlign: "center",
                      color: "rgba(13,51,48,0.3)",
                    }}
                  >
                    Không tìm thấy phụ kiện nào
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr
                    key={it.id}
                    className="a-row-clickable"
                    onClick={() =>
                      navigate(`/dashboard/products/accessories/${it.id}`)
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 11,
                        }}
                      >
                        <div className="a-book-thumb" style={{ height: 34 }}>
                          {it.image ? (
                            <img src={it.image} alt={it.name} />
                          ) : (
                            <Package size={12} />
                          )}
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 500,
                              fontSize: 12,
                              color: "var(--a-ink)",
                            }}
                          >
                            {it.name}
                          </div>
                          <div
                            style={{
                              fontFamily: "monospace",
                              fontSize: 9,
                              color: "rgba(13,51,48,0.4)",
                              marginTop: 1,
                            }}
                          >
                            {it.productCode ?? "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="a-badge neutral">{it.type ?? "—"}</span>
                    </td>
                    <td className="a-td-serif">{formatPrice(it.price)}</td>
                    <td>
                      <span
                        className={it.stock <= 10 ? "a-td-danger" : ""}
                        style={{ fontWeight: 600 }}
                      >
                        {it.stock}
                      </span>
                    </td>
                    <td className="a-td-muted">{it._count?.orderItems ?? 0}</td>
                    <td>
                      <span
                        className={`a-badge ${it.isVisible ? "success" : "neutral"}`}
                      >
                        {it.isVisible ? "Hiển thị" : "Đã ẩn"}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="a-btn-icon edit"
                          onClick={() =>
                            navigate(`/dashboard/products/accessories/${it.id}`)
                          }
                          aria-label="Chi tiết"
                          title="Xem & sửa chi tiết"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          className="a-btn-icon delete"
                          onClick={() => setConfirmDelete(it)}
                          aria-label="Xóa"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="a-pagination">
          <span className="a-pagination-info">Tổng {totalCount} phụ kiện</span>
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

      {/* ══ DELETE CONFIRM MODAL ══ */}
      {confirmDelete && (
        <div
          className="a-modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setConfirmDelete(null)
          }
        >
          <div className="a-modal" style={{ maxWidth: 420 }}>
            <div className="a-modal-header">
              <h3 className="a-modal-title">Xác nhận xóa</h3>
              <button
                className="a-modal-close"
                onClick={() => setConfirmDelete(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="a-modal-body">
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(13,51,48,0.7)",
                  lineHeight: 1.6,
                }}
              >
                Bạn có chắc muốn xóa phụ kiện{" "}
                <strong>"{confirmDelete.name}"</strong>? Hành động này không thể
                hoàn tác.
              </p>
            </div>
            <div className="a-modal-footer">
              <button
                className="a-btn-primary"
                style={{ background: "#c05050" }}
                onClick={() => deleteMutation.mutate(confirmDelete.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Đang xóa..." : "Xóa phụ kiện"}
              </button>
              <button
                className="a-btn-ghost"
                onClick={() => setConfirmDelete(null)}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
