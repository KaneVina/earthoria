import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, X, FolderTree } from "lucide-react";
import api from "../../../services/api";
import toast from "react-hot-toast";

const EMPTY_FORM = { name: "", slug: "", description: "" };

export default function ProductsCategories() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // null | "create" | category-object (edit)
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-categories-full"],
    queryFn: () => api.get("/categories").then((r) => r.data.data),
  });

  const filtered = categories.filter((c) =>
    c.name?.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModal("create");
  };
  const openEdit = (cat) => {
    setForm({
      name: cat.name ?? "",
      slug: cat.slug ?? "",
      description: cat.description ?? "",
    });
    setModal(cat);
  };
  const closeModal = () => setModal(null);

  const saveMutation = useMutation({
    mutationFn: () =>
      modal === "create"
        ? api.post("/admin/categories", form)
        : api.put(`/admin/categories/${modal.id}`, form),
    onSuccess: () => {
      toast.success(
        modal === "create" ? "Đã thêm danh mục!" : "Đã cập nhật danh mục!",
      );
      qc.invalidateQueries(["admin-categories-full"]);
      qc.invalidateQueries(["admin-categories"]);
      closeModal();
    },
    onError: () => toast.error("Lưu thất bại!"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/categories/${id}`),
    onSuccess: () => {
      toast.success("Đã xóa danh mục!");
      qc.invalidateQueries(["admin-categories-full"]);
      qc.invalidateQueries(["admin-categories"]);
      setConfirmDelete(null);
    },
    onError: () =>
      toast.error("Xóa thất bại! Danh mục có thể đang chứa sản phẩm."),
  });

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
            placeholder="Tìm theo tên danh mục..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button className="a-btn-primary" onClick={openCreate}>
          <Plus size={13} />
          Thêm danh mục mới
        </button>
      </div>

      {/*  Table  */}
      <div className="a-table-card" style={{ marginTop: 16 }}>
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                {["Danh mục", "Slug", "Số sách", ""].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: 48,
                      textAlign: "center",
                      color: "rgba(13,51,48,0.3)",
                    }}
                  >
                    Đang tải...
                  </td>
                </tr>
              ) : !filtered.length ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: 48,
                      textAlign: "center",
                      color: "rgba(13,51,48,0.3)",
                    }}
                  >
                    Không tìm thấy danh mục nào
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 7,
                            background: "var(--a-ink-08)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--a-forest)",
                            flexShrink: 0,
                          }}
                        >
                          <FolderTree size={14} />
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 500,
                              fontSize: 12,
                              color: "var(--a-ink)",
                            }}
                          >
                            {c.name}
                          </div>
                          {c.description ? (
                            <div
                              className="a-td-muted"
                              style={{ maxWidth: 320 }}
                            >
                              {c.description}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="a-code-badge">{c.slug ?? "—"}</span>
                    </td>
                    <td className="a-td-muted">{c._count?.products ?? 0}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="a-btn-icon edit"
                          onClick={() => openEdit(c)}
                          aria-label="Sửa"
                          title="Sửa danh mục"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          className="a-btn-icon delete"
                          onClick={() => setConfirmDelete(c)}
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
      </div>

      {/* ══ CREATE / EDIT MODAL ══ */}
      {modal && (
        <div
          className="a-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="a-modal" style={{ maxWidth: 460 }}>
            <div className="a-modal-header">
              <h3 className="a-modal-title">
                {modal === "create" ? "Thêm danh mục mới" : "Sửa danh mục"}
              </h3>
              <button className="a-modal-close" onClick={closeModal}>
                <X size={16} />
              </button>
            </div>
            <div
              className="a-modal-body"
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              <div className="a-form-group">
                <label className="a-form-label">Tên danh mục</label>
                <input
                  className="a-input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="VD: Sách thiếu nhi"
                />
              </div>
              <div className="a-form-group">
                <label className="a-form-label">Slug</label>
                <input
                  className="a-input"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, slug: e.target.value }))
                  }
                  placeholder="VD: sach-thieu-nhi"
                />
              </div>
              <div className="a-form-group">
                <label className="a-form-label">Mô tả</label>
                <textarea
                  className="a-input a-textarea"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Mô tả ngắn (tùy chọn)"
                />
              </div>
            </div>
            <div className="a-modal-footer">
              <button
                className="a-btn-primary"
                onClick={() => saveMutation.mutate()}
                disabled={!form.name.trim() || saveMutation.isPending}
              >
                {saveMutation.isPending ? "Đang lưu..." : "Lưu"}
              </button>
              <button className="a-btn-ghost" onClick={closeModal}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

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
                Bạn có chắc muốn xóa danh mục{" "}
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
                {deleteMutation.isPending ? "Đang xóa..." : "Xóa danh mục"}
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
