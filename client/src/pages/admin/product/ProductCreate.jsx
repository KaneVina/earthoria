// ProductCreate.jsx — Trang riêng để thêm sách
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Save,
  X,
  Loader2,
  BookPlus,
  ImagePlus,
  Trash2,
} from "lucide-react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import AdminLayout from "../AdminLayout";
import ProductFormFields from "./ProductFormFields";
import {
  EMPTY_FORM,
  emptyVariant,
  formToPayload,
  FORMAT_LABEL,
} from "./productFormUtils";
import { formatPrice } from "../../../utils/helpers";

const FORMAT_BADGE = { PHYSICAL: "info", DIGITAL: "dark" };
const MAX_IMAGES = 4;

export default function ProductCreate() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    variants: [emptyVariant("PHYSICAL")],
  }));

  // Ảnh chỉ tồn tại dưới dạng File cục bộ cho tới khi sách được tạo xong —
  // backend yêu cầu book.id đã tồn tại mới nhận upload (POST /admin/products/:id/images).
  const [imageFiles, setImageFiles] = useState([]); // [{ file, previewUrl }]

  useEffect(() => {
    // Dọn bộ nhớ object URL khi rời trang
    return () => imageFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api.get("/categories").then((r) => r.data.data),
  });

  const handleFilesPicked = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    const room = MAX_IMAGES - imageFiles.length;
    if (picked.length > room) {
      toast.error(`Chỉ còn ${room} chỗ trống — tối đa ${MAX_IMAGES} ảnh`);
    }
    const accepted = picked.slice(0, room);
    if (!accepted.length) return;
    setImageFiles((prev) => [
      ...prev,
      ...accepted.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  };

  const removeImage = (index) => {
    setImageFiles((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  // 1 mutation duy nhất: tạo sách -> nếu có ảnh, upload luôn bằng id vừa tạo.
  // Nếu upload ảnh lỗi, sách vẫn coi là tạo thành công (không rollback), chỉ báo riêng.
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/admin/products", payload);
      const newId = res?.data?.data?.id;

      if (newId && imageFiles.length) {
        const fd = new FormData();
        imageFiles.forEach(({ file }) => fd.append("images", file));
        try {
          await api.post(`/admin/products/${newId}/images`, fd);
        } catch (err) {
          toast.error(
            err.response?.data?.message ||
              "Sách đã tạo nhưng tải ảnh thất bại — vào trang chi tiết để thử lại",
          );
        }
      }
      return res;
    },
    onSuccess: (res) => {
      toast.success("Tạo sách thành công!");
      qc.invalidateQueries(["admin-products"]);
      const newId = res?.data?.data?.id;
      navigate(newId ? `/dashboard/products/${newId}` : "/dashboard/products");
    },
    onError: (e) => toast.error(e.response?.data?.message || "Tạo thất bại!"),
  });

  const isSaving = createMutation.isPending;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.variants.length) {
      toast.error("Cần ít nhất 1 định dạng bán (Sách giấy hoặc Sách điện tử)");
      return;
    }
    createMutation.mutate(formToPayload(form));
  };

  const selectedCategory = categories.find((c) => c.id === form.categoryId);
  const title = form.title?.trim();
  const authorList = form.authors
    ?.split(",")
    .map((a) => a.trim())
    .filter(Boolean);
  const description = form.description?.trim();
  const coverPreview = imageFiles[0]?.previewUrl;

  return (
    <AdminLayout
      crumbs={[
        { label: "Sản phẩm", to: "/dashboard/products" },
        { label: "Thêm sách mới" },
      ]}
    >
      <button
        className="a-btn-ghost"
        onClick={() => navigate("/dashboard/products")}
        style={{ marginBottom: 18 }}
        disabled={isSaving}
      >
        <ArrowLeft size={13} /> Quay lại danh sách sách
      </button>

      <div className="a-page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="a-kpi-icon green">
            <BookPlus size={15} />
          </span>
          <div>
            <p className="a-page-eyebrow">Thêm mới</p>
            <h1 className="a-page-title">
              Thêm <em>sách mới</em>
            </h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="a-pf-grid">
          {/* CỘT TRÁI */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* ẢNH SÁCH */}
            <div className="a-chart-card">
              <div className="a-chart-card-header">
                <h3 className="a-chart-title">
                  Ảnh <em>sách</em>
                </h3>
                <p className="a-chart-sub">
                  Tối đa {MAX_IMAGES} ảnh · ảnh đầu tiên sẽ dùng làm ảnh bìa ·
                  lưu cùng lúc bấm "Tạo sách"
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={handleFilesPicked}
                disabled={isSaving}
              />

              <div className="a-pf-image-grid">
                {imageFiles.map((f, i) => (
                  <div className="a-pf-image-slot filled" key={f.previewUrl}>
                    <img src={f.previewUrl} alt={`Ảnh ${i + 1}`} />
                    <div className="a-pf-image-overlay">
                      <button
                        type="button"
                        className="a-pf-image-trash"
                        onClick={() => removeImage(i)}
                        disabled={isSaving}
                        title="Xóa ảnh"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    {i === 0 && (
                      <span className="a-pf-image-cover-badge">Bìa</span>
                    )}
                  </div>
                ))}

                {imageFiles.length < MAX_IMAGES && (
                  <button
                    type="button"
                    className="a-pf-image-slot a-pf-image-add"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSaving}
                  >
                    <ImagePlus size={18} />
                    <span>Thêm ảnh</span>
                    <span className="a-pf-image-hint">
                      Còn {MAX_IMAGES - imageFiles.length} chỗ
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* CÁC FIELD CÒN LẠI — không đổi gì bên trong */}
            <div className="a-chart-card">
              <ProductFormFields
                form={form}
                setForm={setForm}
                categories={categories}
              />
            </div>
          </div>

          {/* CỘT PHẢI — xem trước + hành động */}
          <aside className="a-pf-side">
            <div className="a-chart-card">
              <p className="a-chart-title" style={{ marginBottom: 14 }}>
                Xem trước
              </p>

              <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
                <div className="a-pf-cover">
                  {coverPreview ? (
                    <img src={coverPreview} alt="Ảnh bìa" />
                  ) : title ? (
                    title.charAt(0).toUpperCase()
                  ) : (
                    <BookPlus size={18} />
                  )}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p className="a-pf-preview-title">
                    {title || "Chưa đặt tên sách"}
                  </p>
                  <p className="a-pf-preview-author">
                    {authorList?.length
                      ? authorList.join(", ")
                      : "Chưa có tác giả"}
                  </p>
                  <span
                    className={`a-badge ${form.isVisible ? "success" : "neutral"}`}
                  >
                    {form.isVisible ? "Đang hiển thị" : "Đang ẩn"}
                  </span>
                </div>
              </div>

              <div className="a-pf-preview-row">
                <span className="a-pf-preview-label">Danh mục</span>
                <span className="a-pf-preview-value">
                  {selectedCategory?.name || "Chưa chọn"}
                </span>
              </div>

              {description && (
                <p className="a-pf-preview-desc">{description}</p>
              )}

              {form.variants?.length > 0 ? (
                <div className="a-pf-variant-list">
                  {form.variants.map((v) => {
                    const price = Number(v.price);
                    return (
                      <div className="a-pf-variant-row" key={v._key}>
                        <span
                          className={`a-badge ${FORMAT_BADGE[v.format] || "neutral"}`}
                        >
                          {FORMAT_LABEL[v.format] || v.format}
                        </span>
                        <span className="a-pf-variant-price">
                          {price ? formatPrice(price) : "Chưa nhập giá"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="a-pf-preview-empty">Chưa có định dạng bán nào</p>
              )}
            </div>

            <div className="a-chart-card">
              <button
                type="submit"
                className="a-btn-primary"
                disabled={isSaving}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="a-spin" /> Đang lưu...
                  </>
                ) : (
                  <>
                    <Save size={14} /> Tạo sách
                  </>
                )}
              </button>
              <button
                type="button"
                className="a-btn-ghost"
                onClick={() => navigate("/dashboard/products")}
                disabled={isSaving}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  marginTop: 8,
                }}
              >
                <X size={14} /> Hủy
              </button>
            </div>
          </aside>
        </div>
      </form>
    </AdminLayout>
  );
}
