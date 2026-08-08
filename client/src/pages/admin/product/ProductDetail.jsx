import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Upload, Trash2, X, Copy } from "lucide-react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import AdminLayout from "../AdminLayout";
import ProductFormFields from "./ProductFormFields";
import { EMPTY_FORM, bookToForm, formToPayload } from "./productFormUtils";

const ACCESS_LABEL = {
  PUBLIC: { label: "Công khai", cls: "info" },
  CUSTOMER_ONLY: { label: "Chỉ khách đã mua", cls: "warning" },
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dirty, setDirty] = useState(false);

  const { data: book, isLoading } = useQuery({
    queryKey: ["admin-product-detail", id],
    queryFn: () => api.get(`/admin/products/${id}`).then((r) => r.data.data),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api.get("/categories").then((r) => r.data.data),
  });

  useEffect(() => {
    if (book) {
      setForm(bookToForm(book));
      setDirty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book?.id]);

  const handleFormChange = (updater) => {
    setDirty(true);
    setForm(updater);
  };

  const updateMutation = useMutation({
    mutationFn: (payload) => api.put(`/admin/products/${id}`, payload),
    onSuccess: () => {
      toast.success("Đã lưu thay đổi!");
      qc.invalidateQueries(["admin-product-detail", id]);
      qc.invalidateQueries(["admin-products"]);
      setDirty(false);
    },
    onError: (e) => toast.error(e.response?.data?.message || "Cập nhật thất bại!"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/admin/products/${id}`),
    onSuccess: () => {
      toast.success("Đã xóa sách!");
      qc.invalidateQueries(["admin-products"]);
      navigate("/dashboard/products");
    },
    onError: (e) => {
      if (e.response?.status === 409 && e.response?.data?.softDeleted) {
        toast(e.response.data.message, { icon: "⚠️" });
        qc.invalidateQueries(["admin-products"]);
        qc.invalidateQueries(["admin-product-detail", id]);
        setConfirmDelete(false);
      } else {
        toast.error(e.response?.data?.message || "Xóa thất bại!");
      }
    },
  });

  const deleteVariantMutation = useMutation({
    mutationFn: (variantId) => api.delete(`/admin/products/${id}/variants/${variantId}`),
    onSuccess: () => {
      toast.success("Đã xóa định dạng bán!");
      qc.invalidateQueries(["admin-product-detail", id]);
      qc.invalidateQueries(["admin-products"]);
    },
    onError: (e) => {
      if (e.response?.status === 409 && e.response?.data?.softDeleted) {
        toast(e.response.data.message, { icon: "⚠️" });
        qc.invalidateQueries(["admin-product-detail", id]);
      } else {
        toast.error(e.response?.data?.message || "Xóa thất bại!");
      }
    },
  });

  const handleDeleteVariant = (variant) => deleteVariantMutation.mutateAsync(variant.id);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.variants.length) {
      toast.error("Sách cần ít nhất 1 định dạng bán");
      return;
    }
    updateMutation.mutate(formToPayload(form));
  };

  const copyId = () => {
    if (!book?.id) return;
    navigator.clipboard.writeText(book.id);
    toast.success("Đã sao chép ID sách");
  };

  const totalStock = (book?.variants ?? []).reduce(
    (sum, v) => (v.isUnlimitedStock ? sum : sum + (v.stock ?? 0)),
    0
  );
  const hasUnlimited = (book?.variants ?? []).some((v) => v.isUnlimitedStock);
  const totalSold = (book?.variants ?? []).reduce((sum, v) => sum + (v.sold ?? 0), 0);

  return (
    <AdminLayout crumbs={[{ label: "Sản phẩm", to: "/dashboard/products" }, { label: book?.title ?? "Chi tiết sách" }]}>
      <button className="a-btn-ghost" onClick={() => navigate("/dashboard/products")} style={{ marginBottom: 18 }}>
        <ArrowLeft size={13} /> Quay lại danh sách sách
      </button>

      {isLoading || !book ? (
        <div style={{ padding: 60, textAlign: "center", color: "rgba(13,51,48,0.3)" }}>
          {isLoading ? "Đang tải..." : "Không tìm thấy sách"}
        </div>
      ) : (
        <>
          <div className="a-page-header">
            <div style={{ display: "flex", gap: 16 }}>
              <div className="a-book-thumb" style={{ width: 64, height: 88 }}>
                {book.coverImage ? <img src={book.coverImage} alt={book.title} /> : <Upload size={16} />}
              </div>
              <div>
                <p className="a-page-eyebrow">Chi tiết sách</p>
                <h1 className="a-page-title">{book.title}</h1>
                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {(book.variants ?? []).map((v) => (
                    <span
                      key={v.id}
                      style={{ fontFamily: "monospace", fontSize: 11, background: "#f5f3ee", padding: "2px 8px", borderRadius: 5, color: "#0D3330" }}
                      title={v.format === "DIGITAL" ? "Sách điện tử" : "Sách giấy"}
                    >
                      {v.productCode ?? "—"}
                    </span>
                  ))}
                  <span style={{ fontSize: 12, color: "rgba(13,51,48,0.5)" }}>{(book.authors ?? []).join(", ") || "—"}</span>
                </div>
                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: "rgba(13,51,48,0.4)" }}>ID:</span>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(13,51,48,0.55)" }}>{book.id}</span>
                  <button type="button" onClick={copyId} title="Sao chép ID" style={{ display: "inline-flex", alignItems: "center", background: "none", border: "none", cursor: "pointer", color: "rgba(13,51,48,0.4)", padding: 2 }}>
                    <Copy size={11} />
                  </button>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className={`a-badge ${book.isVisible ? "success" : "neutral"}`}>{book.isVisible ? "Hiển thị" : "Đã ẩn"}</span>
              <button type="button" className="a-btn-icon delete" title="Xóa sách" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="a-mini-stats">
            <div className="a-mini-stat">
              <div className="a-mini-stat-label">Định dạng đang bán</div>
              <div className="a-mini-stat-value">{(book.variants ?? []).filter((v) => v.isActive).length}</div>
            </div>
            <div className="a-mini-stat">
              <div className="a-mini-stat-label">Tồn kho</div>
              <div className="a-mini-stat-value">{hasUnlimited ? `${totalStock}+` : totalStock}</div>
            </div>
            <div className="a-mini-stat">
              <div className="a-mini-stat-label">Đã bán</div>
              <div className="a-mini-stat-value">{totalSold}</div>
            </div>
            <div className="a-mini-stat">
              <div className="a-mini-stat-label">Mã AR</div>
              <div className="a-mini-stat-value">{book._count?.arCodes ?? 0}</div>
            </div>
          </div>

          <div className="a-chart-card" style={{ marginBottom: 20 }}>
            <div className="a-chart-card-header">
              <h3 className="a-chart-title">Thông <em>tin sách</em></h3>
              <p className="a-chart-sub">Chỉnh sửa trực tiếp bên dưới rồi bấm Lưu thay đổi</p>
            </div>
            <form onSubmit={handleSubmit}>
              <ProductFormFields form={form} setForm={handleFormChange} categories={categories} onDeleteVariant={handleDeleteVariant} />
              <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                <button type="submit" className="a-btn-primary" disabled={!dirty || updateMutation.isPending}>
                  {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
                {dirty && (
                  <button type="button" className="a-btn-ghost" onClick={() => { setForm(bookToForm(book)); setDirty(false); }}>
                    Hủy thay đổi
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="a-table-card">
            <div className="a-table-head">
              <h3 className="a-table-title">Mã <em>AR</em> đã tạo</h3>
              <a className="a-table-link" onClick={() => navigate(`/dashboard/ar-codes?bookId=${book.id}`)} style={{ cursor: "pointer" }}>
                Quản lý mã AR →
              </a>
            </div>
            <div className="a-table-wrap">
              <table className="a-table">
                <thead>
                  <tr>
                    {["Label", "Mã (code)", "Quyền xem", "Lượt quét", "Trạng thái"].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!book.arCodes?.length ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 32, textAlign: "center", color: "rgba(13,51,48,0.3)" }}>
                        Sách này chưa có mã AR nào
                      </td>
                    </tr>
                  ) : (
                    book.arCodes.map((ac) => {
                      const access = ACCESS_LABEL[ac.accessType] ?? ACCESS_LABEL.CUSTOMER_ONLY;
                      return (
                        <tr key={ac.id}>
                          <td style={{ fontWeight: 500, fontSize: 12 }}>{ac.label}</td>
                          <td className="a-td-mono">{ac.code}</td>
                          <td><span className={`a-badge ${access.cls}`}>{access.label}</span></td>
                          <td className="a-td-muted">{ac.scanCount}</td>
                          <td><span className={`a-badge ${ac.isActive ? "success" : "neutral"}`}>{ac.isActive ? "Hoạt động" : "Đã vô hiệu hoá"}</span></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {confirmDelete && (
        <div className="a-modal-overlay" onClick={(e) => e.target === e.currentTarget && setConfirmDelete(false)}>
          <div className="a-modal" style={{ maxWidth: 420 }}>
            <div className="a-modal-header">
              <h3 className="a-modal-title">Xác nhận xóa</h3>
              <button className="a-modal-close" onClick={() => setConfirmDelete(false)}><X size={16} /></button>
            </div>
            <div className="a-modal-body">
              <p style={{ fontSize: 13, color: "rgba(13,51,48,0.7)", lineHeight: 1.6 }}>
                Bạn có chắc muốn xóa sách <strong>"{book?.title}"</strong>? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="a-modal-footer">
              <button className="a-btn-primary" style={{ background: "#c05050" }} onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? "Đang xóa..." : "Xóa sách"}
              </button>
              <button className="a-btn-ghost" onClick={() => setConfirmDelete(false)}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}