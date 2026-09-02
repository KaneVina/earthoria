import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Upload,
  Trash2,
  X,
  Copy,
  ImagePlus,
  Star,
  Loader2,
} from "lucide-react";
import api from "../../../services/api";
import { getGameDefinition } from "../../../games/gameRegistry";
import toast from "react-hot-toast";
import AdminLayout from "../AdminLayout";
import ProductFormFields from "./ProductFormFields";
import { EMPTY_FORM, bookToForm, formToPayload } from "./productFormUtils";

const ACCESS_LABEL = {
  PUBLIC: { label: "Công khai", cls: "info" },
  CUSTOMER_ONLY: { label: "Chỉ khách đã mua", cls: "warning" },
};

const MAX_IMAGES = 4;

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
    onError: (e) =>
      toast.error(e.response?.data?.message || "Cập nhật thất bại!"),
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
    mutationFn: (variantId) =>
      api.delete(`/admin/products/${id}/variants/${variantId}`),
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

  const handleDeleteVariant = (variant) =>
    deleteVariantMutation.mutateAsync(variant.id);

  // ── Ảnh sách — thao tác lưu ngay qua API, không phụ thuộc nút "Lưu thay đổi" ──
  const imageInputRef = useRef(null);
  const [pendingImageUrl, setPendingImageUrl] = useState(null);

  const invalidateBook = () => {
    qc.invalidateQueries(["admin-product-detail", id]);
    qc.invalidateQueries(["admin-products"]);
  };

  const uploadImagesMutation = useMutation({
    mutationFn: (files) => {
      const fd = new FormData();
      files.forEach((file) => fd.append("images", file));
      return api.post(`/admin/products/${id}/images`, fd);
    },
    onSuccess: () => {
      toast.success("Đã thêm ảnh");
      invalidateBook();
    },
    onError: (e) =>
      toast.error(e.response?.data?.message || "Tải ảnh thất bại"),
  });

  const deleteImageMutation = useMutation({
    mutationFn: (url) =>
      api.delete(`/admin/products/${id}/images`, { data: { url } }),
    onMutate: (url) => setPendingImageUrl(url),
    onSuccess: () => {
      toast.success("Đã xóa ảnh");
      invalidateBook();
    },
    onError: (e) =>
      toast.error(e.response?.data?.message || "Xóa ảnh thất bại"),
    onSettled: () => setPendingImageUrl(null),
  });

  const setCoverMutation = useMutation({
    mutationFn: (url) => api.patch(`/admin/products/${id}/cover`, { url }),
    onMutate: (url) => setPendingImageUrl(url),
    onSuccess: () => {
      toast.success("Đã đặt làm ảnh bìa");
      invalidateBook();
    },
    onError: (e) =>
      toast.error(e.response?.data?.message || "Đặt ảnh bìa thất bại"),
    onSettled: () => setPendingImageUrl(null),
  });

  const bookImages = book?.images ?? [];
  const roomForImages = MAX_IMAGES - bookImages.length;

  const handleImagesPicked = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    if (!picked.length) return;
    if (picked.length > roomForImages) {
      toast.error(
        `Chỉ còn ${roomForImages} chỗ trống — tối đa ${MAX_IMAGES} ảnh`,
      );
    }
    const accepted = picked.slice(0, roomForImages);
    if (!accepted.length) return;
    uploadImagesMutation.mutate(accepted);
  };

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
    0,
  );
  const hasUnlimited = (book?.variants ?? []).some((v) => v.isUnlimitedStock);
  const totalSold = (book?.variants ?? []).reduce(
    (sum, v) => sum + (v.sold ?? 0),
    0,
  );

  return (
    <AdminLayout
      crumbs={[
        { label: "Sản phẩm", to: "/dashboard/products" },
        { label: book?.title ?? "Chi tiết sách" },
      ]}
    >
      <button
        className="a-btn-ghost"
        onClick={() => navigate("/dashboard/products")}
        style={{ marginBottom: 18 }}
      >
        <ArrowLeft size={13} /> Quay lại danh sách sách
      </button>

      {isLoading || !book ? (
        <div
          style={{
            padding: 60,
            textAlign: "center",
            color: "rgba(13,51,48,0.3)",
          }}
        >
          {isLoading ? "Đang tải..." : "Không tìm thấy sách"}
        </div>
      ) : (
        <>
          <div className="a-page-header">
            <div style={{ display: "flex", gap: 16 }}>
              <div className="a-book-thumb" style={{ width: 64, height: 88 }}>
                {book.coverImage ? (
                  <img src={book.coverImage} alt={book.title} />
                ) : (
                  <Upload size={16} />
                )}
              </div>
              <div>
                <p className="a-page-eyebrow">Chi tiết sách</p>
                <h1 className="a-page-title">{book.title}</h1>
                <div
                  style={{
                    marginTop: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {(book.variants ?? []).map((v) => (
                    <span
                      key={v.id}
                      style={{
                        fontFamily: "monospace",
                        fontSize: 11,
                        background: "#f5f3ee",
                        padding: "2px 8px",
                        borderRadius: 5,
                        color: "#0D3330",
                      }}
                      title={
                        v.format === "DIGITAL" ? "Sách điện tử" : "Sách giấy"
                      }
                    >
                      {v.productCode ?? "—"}
                    </span>
                  ))}
                  <span style={{ fontSize: 12, color: "rgba(13,51,48,0.5)" }}>
                    {(book.authors ?? []).join(", ") || "—"}
                  </span>
                </div>
                <div
                  style={{
                    marginTop: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 11, color: "rgba(13,51,48,0.4)" }}>
                    ID:
                  </span>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 11,
                      color: "rgba(13,51,48,0.55)",
                    }}
                  >
                    {book.id}
                  </span>
                  <button
                    type="button"
                    onClick={copyId}
                    title="Sao chép ID"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "rgba(13,51,48,0.4)",
                      padding: 2,
                    }}
                  >
                    <Copy size={11} />
                  </button>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                className={`a-badge ${book.isVisible ? "success" : "neutral"}`}
              >
                {book.isVisible ? "Hiển thị" : "Đã ẩn"}
              </span>
              <button
                type="button"
                className="a-btn-icon delete"
                title="Xóa sách"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="a-mini-stats">
            <div className="a-mini-stat">
              <div className="a-mini-stat-label">Định dạng đang bán</div>
              <div className="a-mini-stat-value">
                {(book.variants ?? []).filter((v) => v.isActive).length}
              </div>
            </div>
            <div className="a-mini-stat">
              <div className="a-mini-stat-label">Tồn kho</div>
              <div className="a-mini-stat-value">
                {hasUnlimited ? `${totalStock}+` : totalStock}
              </div>
            </div>
            <div className="a-mini-stat">
              <div className="a-mini-stat-label">Đã bán</div>
              <div className="a-mini-stat-value">{totalSold}</div>
            </div>
            <div className="a-mini-stat">
              <div className="a-mini-stat-label">Mã AR</div>
              <div className="a-mini-stat-value">
                {book._count?.arCodes ?? 0}
              </div>
            </div>
            <div className="a-mini-stat">
              <div className="a-mini-stat-label">Trò chơi</div>
              <div className="a-mini-stat-value">{book._count?.games ?? 0}</div>
            </div>
          </div>

          {/* ẢNH SÁCH — mỗi thao tác gọi API ngay lập tức, tách khỏi nút "Lưu thay đổi" bên dưới */}
          <div className="a-chart-card" style={{ marginBottom: 20 }}>
            <div className="a-chart-card-header">
              <h3 className="a-chart-title">
                Ảnh <em>sách</em>
              </h3>
              <p className="a-chart-sub">
                Tối đa {MAX_IMAGES} ảnh · bấm ngôi sao để đặt làm ảnh bìa · thao
                tác lưu ngay lập tức
              </p>
            </div>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              onChange={handleImagesPicked}
              disabled={uploadImagesMutation.isPending || roomForImages <= 0}
            />

            <div className="a-pf-image-grid">
              {bookImages.map((url) => {
                const isCover = url === book.coverImage;
                const busyThis = pendingImageUrl === url;
                return (
                  <div className="a-pf-image-slot filled" key={url}>
                    <img src={url} alt="Ảnh sách" />
                    <div className="a-pf-image-overlay">
                      {!isCover && (
                        <button
                          type="button"
                          className="a-pf-image-trash"
                          onClick={() => setCoverMutation.mutate(url)}
                          disabled={busyThis}
                          title="Đặt làm ảnh bìa"
                          style={{ marginRight: 6 }}
                        >
                          {busyThis && setCoverMutation.isPending ? (
                            <Loader2 size={13} className="a-spin" />
                          ) : (
                            <Star size={13} />
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        className="a-pf-image-trash"
                        onClick={() => deleteImageMutation.mutate(url)}
                        disabled={busyThis}
                        title="Xóa ảnh"
                      >
                        {busyThis && deleteImageMutation.isPending ? (
                          <Loader2 size={13} className="a-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </button>
                    </div>
                    {isCover && (
                      <span className="a-pf-image-cover-badge">Bìa</span>
                    )}
                  </div>
                );
              })}

              {roomForImages > 0 && (
                <button
                  type="button"
                  className="a-pf-image-slot a-pf-image-add"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadImagesMutation.isPending}
                >
                  {uploadImagesMutation.isPending ? (
                    <Loader2 size={18} className="a-spin" />
                  ) : (
                    <ImagePlus size={18} />
                  )}
                  <span>
                    {uploadImagesMutation.isPending
                      ? "Đang tải..."
                      : "Thêm ảnh"}
                  </span>
                  <span className="a-pf-image-hint">
                    Còn {roomForImages} chỗ
                  </span>
                </button>
              )}
            </div>

            {bookImages.length === 0 && (
              <div
                style={{
                  padding: "16px 14px",
                  fontSize: 12,
                  color: "rgba(13,51,48,0.5)",
                  border: "1px dashed #e8e5de",
                  borderRadius: 10,
                  marginTop: 10,
                }}
              >
                Sách này chưa có ảnh nào.
              </div>
            )}
          </div>

          <div className="a-chart-card" style={{ marginBottom: 20 }}>
            <div className="a-chart-card-header">
              <h3 className="a-chart-title">
                Thông <em>tin sách</em>
              </h3>
              <p className="a-chart-sub">
                Chỉnh sửa trực tiếp bên dưới rồi bấm Lưu thay đổi
              </p>
            </div>
            <form onSubmit={handleSubmit}>
              <ProductFormFields
                form={form}
                setForm={handleFormChange}
                categories={categories}
                onDeleteVariant={handleDeleteVariant}
                productId={id}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                <button
                  type="submit"
                  className="a-btn-primary"
                  disabled={!dirty || updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
                {dirty && (
                  <button
                    type="button"
                    className="a-btn-ghost"
                    onClick={() => {
                      setForm(bookToForm(book));
                      setDirty(false);
                    }}
                  >
                    Hủy thay đổi
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="a-table-card">
            <div className="a-table-head">
              <h3 className="a-table-title">
                Mã <em>AR</em> đã tạo
              </h3>
              <a
                className="a-table-link"
                onClick={() =>
                  navigate(`/dashboard/ar-codes?bookId=${book.id}`)
                }
                style={{ cursor: "pointer" }}
              >
                Quản lý mã AR →
              </a>
            </div>
            <div className="a-table-wrap">
              <table className="a-table">
                <thead>
                  <tr>
                    {[
                      "Label",
                      "Mã (code)",
                      "Quyền xem",
                      "Lượt quét",
                      "Trạng thái",
                    ].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!book.arCodes?.length ? (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          padding: 32,
                          textAlign: "center",
                          color: "rgba(13,51,48,0.3)",
                        }}
                      >
                        Sách này chưa có mã AR nào
                      </td>
                    </tr>
                  ) : (
                    book.arCodes.map((ac) => {
                      const access =
                        ACCESS_LABEL[ac.accessType] ??
                        ACCESS_LABEL.CUSTOMER_ONLY;
                      return (
                        <tr key={ac.id}>
                          <td style={{ fontWeight: 500, fontSize: 12 }}>
                            {ac.label}
                          </td>
                          <td className="a-td-mono">{ac.code}</td>
                          <td>
                            <span className={`a-badge ${access.cls}`}>
                              {access.label}
                            </span>
                          </td>
                          <td className="a-td-muted">{ac.scanCount}</td>
                          <td>
                            <span
                              className={`a-badge ${ac.isActive ? "success" : "neutral"}`}
                            >
                              {ac.isActive ? "Hoạt động" : "Đã vô hiệu hoá"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="a-table-card" style={{ marginTop: 20 }}>
            <div className="a-table-head">
              <h3 className="a-table-title">
                Trò <em>chơi</em> đã tạo
              </h3>
              <a
                className="a-table-link"
                onClick={() => navigate(`/dashboard/games?bookId=${book.id}`)}
                style={{ cursor: "pointer" }}
              >
                Quản lý trò chơi →
              </a>
            </div>
            <div className="a-table-wrap">
              <table className="a-table">
                <thead>
                  <tr>
                    {[
                      "Tên trò chơi",
                      "Loại",
                      "Mã (code)",
                      "Quyền xem",
                      "Lượt chơi",
                      "Trạng thái",
                    ].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!book.games?.length ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          padding: 32,
                          textAlign: "center",
                          color: "rgba(13,51,48,0.3)",
                        }}
                      >
                        Sách này chưa có trò chơi nào
                      </td>
                    </tr>
                  ) : (
                    book.games.map((g) => {
                      const access =
                        ACCESS_LABEL[g.accessType] ??
                        ACCESS_LABEL.CUSTOMER_ONLY;
                      const def = getGameDefinition(g.gameType);
                      return (
                        <tr
                          key={g.id}
                          onClick={() => navigate(`/dashboard/games/${g.id}`)}
                          style={{ cursor: "pointer" }}
                        >
                          <td style={{ fontWeight: 500, fontSize: 12 }}>
                            {g.title}
                          </td>
                          <td>{def?.shortLabel ?? g.gameType}</td>
                          <td className="a-td-mono">{g.code}</td>
                          <td>
                            <span className={`a-badge ${access.cls}`}>
                              {access.label}
                            </span>
                          </td>
                          <td className="a-td-muted">{g.playCount}</td>
                          <td>
                            <span
                              className={`a-badge ${g.isActive ? "success" : "neutral"}`}
                            >
                              {g.isActive ? "Hoạt động" : "Đã vô hiệu hoá"}
                            </span>
                          </td>
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
        <div
          className="a-modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setConfirmDelete(false)
          }
        >
          <div className="a-modal" style={{ maxWidth: 420 }}>
            <div className="a-modal-header">
              <h3 className="a-modal-title">Xác nhận xóa</h3>
              <button
                className="a-modal-close"
                onClick={() => setConfirmDelete(false)}
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
                Bạn có chắc muốn xóa sách <strong>"{book?.title}"</strong>? Hành
                động này không thể hoàn tác.
              </p>
            </div>
            <div className="a-modal-footer">
              <button
                className="a-btn-primary"
                style={{ background: "#c05050" }}
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Đang xóa..." : "Xóa sách"}
              </button>
              <button
                className="a-btn-ghost"
                onClick={() => setConfirmDelete(false)}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
