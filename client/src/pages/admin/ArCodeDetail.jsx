import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QRCodeCanvas } from "qrcode.react";
import {
  ArrowLeft,
  Search,
  Ban,
  CheckCircle2,
  X,
  Download,
  Copy,
  Upload,
  Box,
  FileUp,
  User,
  Users,
  Building2,
  Shield,
  Award,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import AdminLayout from "./AdminLayout";

const ACCESS_OPTIONS = [
  { value: "CUSTOMER_ONLY", label: "Khách đã mua" },
  { value: "PUBLIC", label: "Công khai" },
];

const ROLE_MATRIX = [
  { key: "GUEST", label: "Guest", icon: User },
  { key: "CUSTOMER", label: "Customer", icon: Users },
  { key: "DEALER", label: "Dealer", icon: Building2 },
  { key: "STAFF", label: "Staff", icon: Shield },
  { key: "ADMIN", label: "Admin", icon: Award },
];

// CUSTOMER_ONLY -> chỉ Customer/Staff/Admin xem được; PUBLIC -> tất cả
function getLitRoles(accessType) {
  if (accessType === "PUBLIC") {
    return ["GUEST", "CUSTOMER", "DEALER", "STAFF", "ADMIN"];
  }
  return ["CUSTOMER", "STAFF", "ADMIN"];
}
function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function GlbDropzone({ file, onChange, optionalHint }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const acceptFile = useCallback(
    (f) => {
      if (!f) return;
      const okExt = f.name.toLowerCase().endsWith(".glb");
      if (!okExt) {
        toast.error("Chỉ chấp nhận file .glb");
        return;
      }
      onChange(f);
    },
    [onChange],
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  if (file) {
    return (
      <div className="a-drop-file">
        <div className="a-drop-file-icon">
          <Box size={16} />
        </div>
        <div className="a-drop-file-info">
          <div className="a-drop-file-name">{file.name}</div>
          <div className="a-drop-file-size">{formatBytes(file.size)}</div>
        </div>
        <button
          type="button"
          className="a-drop-file-remove"
          onClick={() => onChange(null)}
          title="Xóa file"
        >
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`a-dropzone${dragOver ? " dragover" : ""}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".glb,model/gltf-binary"
        hidden
        onChange={(e) => acceptFile(e.target.files?.[0])}
      />
      <div className="a-dropzone-icon">
        <FileUp size={18} />
      </div>
      <div className="a-dropzone-text">
        <span className="a-dropzone-strong">Bấm để chọn file</span> hoặc kéo thả
        vào đây
      </div>
      <div className="a-dropzone-hint">
        Định dạng .glb{optionalHint ? ` · ${optionalHint}` : ""}
      </div>
    </div>
  );
}

export default function ArCodeDetail() {
  const { id } = useParams();
  const isEditMode = !!id;
  const [searchParams] = useSearchParams();
  const preselectBookId = searchParams.get("bookId");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const qrWrapRef = useRef(null);

  const [bookQuery, setBookQuery] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [form, setForm] = useState({
    label: "",
    file: null,
    accessType: "CUSTOMER_ONLY",
  });

  /* ── Chế độ sửa: tải chi tiết mã AR + sách ── */
  const { data: arCode, isLoading: loadingAr } = useQuery({
    queryKey: ["admin-ar-code-detail", id],
    queryFn: () => api.get(`/admin/ar-codes/${id}`).then((r) => r.data.data),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (arCode) {
      setForm({
        label: arCode.label,
        file: null,
        accessType: arCode.accessType,
      });
      setSelectedBook(arCode.book);
    }
  }, [arCode]);

  /* ── Chế độ tạo mới, kèm ?bookId= từ trang Chi tiết sách ── */
  const { data: preselectBook } = useQuery({
    queryKey: ["admin-product-preselect", preselectBookId],
    queryFn: () =>
      api.get(`/admin/products/${preselectBookId}`).then((r) => r.data.data),
    enabled: !isEditMode && !!preselectBookId && !selectedBook,
  });
  useEffect(() => {
    if (preselectBook) setSelectedBook(preselectBook);
  }, [preselectBook]);

  const { data: bookSuggestions = [] } = useQuery({
    queryKey: ["admin-products-quick-search", bookQuery],
    queryFn: () =>
      api
        .get("/admin/products/search", { params: { q: bookQuery } })
        .then((r) => r.data.data),
    enabled: !isEditMode && bookQuery.trim().length >= 1,
  });

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("label", form.label);
    fd.append("accessType", form.accessType);
    if (form.file) fd.append("model", form.file);
    return fd;
  };

  const createMutation = useMutation({
    mutationFn: () =>
      api.post(`/admin/products/${selectedBook.id}/ar-codes`, buildFormData()),
    onSuccess: (res) => {
      toast.success("Đã tạo mã AR mới!");
      qc.invalidateQueries(["admin-ar-codes-all"]);
      const newId = res.data?.data?.id;
      if (newId) navigate(`/dashboard/ar-codes/${newId}`, { replace: true });
    },
    onError: (e) =>
      toast.error(e.response?.data?.message || "Tạo mã AR thất bại!"),
  });

  const updateMutation = useMutation({
    mutationFn: () => api.put(`/admin/ar-codes/${id}`, buildFormData()),
    onSuccess: () => {
      toast.success("Đã cập nhật mã AR!");
      qc.invalidateQueries(["admin-ar-codes-all"]);
      qc.invalidateQueries(["admin-ar-code-detail", id]);
      setForm((f) => ({ ...f, file: null }));
    },
    onError: (e) =>
      toast.error(e.response?.data?.message || "Cập nhật thất bại!"),
  });

  const toggleMutation = useMutation({
    mutationFn: () => api.put(`/admin/ar-codes/${id}/toggle`),
    onSuccess: () => {
      toast.success("Đã cập nhật trạng thái");
      qc.invalidateQueries(["admin-ar-codes-all"]);
      qc.invalidateQueries(["admin-ar-code-detail", id]);
    },
    onError: () => toast.error("Thao tác thất bại!"),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.label) {
      toast.error("Vui lòng nhập tên mã");
      return;
    }
    if (!isEditMode && !form.file) {
      toast.error("Vui lòng chọn file .glb");
      return;
    }
    if (isEditMode) updateMutation.mutate();
    else createMutation.mutate();
  };

  const pickBook = (book) => {
    setSelectedBook(book);
    setBookQuery("");
    setShowSuggest(false);
  };

  const qrUrl =
    isEditMode && selectedBook && arCode
      ? `${window.location.origin}/ar/${selectedBook.slug}/${arCode.code}`
      : "";

  const handleDownloadQr = () => {
    const canvas = qrWrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const safeName = (arCode?.label || "ar-code")
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

  if (isEditMode && loadingAr) {
    return (
      <AdminLayout crumbs={[{ label: "Tạo mã QR" }, { label: "Chi tiết" }]}>
        <div
          style={{
            padding: 60,
            textAlign: "center",
            color: "rgba(13,51,48,0.3)",
          }}
        >
          Đang tải...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      crumbs={[
        { label: "Tạo mã QR" },
        { label: isEditMode ? "Chỉnh sửa" : "Tạo mới" },
      ]}
    >
      <div className="a-page-header" style={{ marginBottom: 20 }}>
        <div>
          <button
            type="button"
            className="a-btn-ghost"
            style={{ marginBottom: 12 }}
            onClick={() => navigate("/dashboard/ar-codes")}
          >
            <ArrowLeft size={13} /> Quay lại danh sách
          </button>
          <p className="a-page-eyebrow">AR / QR</p>
          <h1 className="a-page-title">
            {isEditMode ? "Chỉnh sửa mã " : "Tạo mã "}
            <em>QR</em>
          </h1>
        </div>
      </div>

      <div className="a-chart-grid-2 a-ar-layout">
        {/* ── Cột trái: chọn sách + form ── */}
        <div className="a-chart-card">
          {!isEditMode && !selectedBook && (
            <div style={{ position: "relative" }}>
              <div className="a-form-label" style={{ marginBottom: 8 }}>
                Bước 1 · Chọn sách
              </div>
              <div
                className="a-search-wrap"
                style={{ marginBottom: 0, maxWidth: "100%" }}
              >
                <Search size={13} className="a-search-icon" />
                <input
                  className="a-input"
                  placeholder="Tìm theo tên sách..."
                  value={bookQuery}
                  onChange={(e) => {
                    setBookQuery(e.target.value);
                    setShowSuggest(true);
                  }}
                  onFocus={() => setShowSuggest(true)}
                />
              </div>
              {showSuggest && bookQuery.trim().length >= 1 && (
                <div
                  style={{
                    position: "relative",
                    zIndex: 10,
                    background: "#fff",
                    border: "1px solid #e8e5de",
                    borderRadius: 8,
                    marginTop: 4,
                    maxHeight: 280,
                    overflowY: "auto",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                  }}
                >
                  {bookSuggestions.length === 0 ? (
                    <div
                      style={{
                        padding: 14,
                        fontSize: 12,
                        color: "rgba(13,51,48,0.4)",
                      }}
                    >
                      Không tìm thấy sách
                    </div>
                  ) : (
                    bookSuggestions.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => pickBook(b)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "9px 14px",
                          cursor: "pointer",
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <div
                          className="a-book-thumb"
                          style={{ width: 24, height: 32 }}
                        >
                          {b.coverImage ? (
                            <img src={b.coverImage} alt={b.title} />
                          ) : (
                            <Upload size={10} />
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {b.title}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {selectedBook && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  justifyContent: "space-between",
                  marginBottom: 18,
                  paddingBottom: 16,
                  borderBottom: "1px solid var(--a-ink-05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    minWidth: 0,
                  }}
                >
                  <div
                    className="a-book-thumb"
                    style={{ width: 34, height: 46 }}
                  >
                    {selectedBook.coverImage ? (
                      <img
                        src={selectedBook.coverImage}
                        alt={selectedBook.title}
                      />
                    ) : (
                      <Upload size={14} />
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {selectedBook.title}
                    </div>
                    {isEditMode && arCode && (
                      <span
                        className={`a-badge ${arCode.isActive ? "success" : "neutral"}`}
                        style={{ marginTop: 4 }}
                      >
                        {arCode.isActive ? "Hoạt động" : "Vô hiệu hoá"}
                      </span>
                    )}
                  </div>
                </div>
                {!isEditMode && (
                  <button
                    type="button"
                    className="a-btn-ghost"
                    style={{ fontSize: 11, padding: "6px 10px", flexShrink: 0 }}
                    onClick={() => setSelectedBook(null)}
                  >
                    Đổi sách
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="a-form-group" style={{ marginBottom: 12 }}>
                  <label className="a-form-label">Tên mã</label>
                  <input
                    className="a-input"
                    value={form.label}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, label: e.target.value }))
                    }
                    placeholder="vd: Con voi"
                    required
                  />
                </div>

                <div className="a-form-group" style={{ marginBottom: 12 }}>
                  <label className="a-form-label">File mô hình .glb</label>
                  <GlbDropzone
                    file={form.file}
                    onChange={(f) => setForm((v) => ({ ...v, file: f }))}
                    optionalHint={isEditMode ? "để trống nếu không đổi" : null}
                  />
                </div>

                <div className="a-form-group" style={{ marginBottom: 16 }}>
                  <label className="a-form-label">Quyền xem</label>

                  <div className="a-access-row">
                    <div className="a-access-toggle">
                      {ACCESS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          className={`a-access-toggle-btn${form.accessType === opt.value ? " active" : ""}`}
                          onClick={() =>
                            setForm((f) => ({ ...f, accessType: opt.value }))
                          }
                        >
                          <span className="a-access-toggle-dot" />
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    <div className="a-role-matrix">
                      {ROLE_MATRIX.map((role) => {
                        const litRoles = getLitRoles(form.accessType);
                        const isLit = litRoles.includes(role.key);
                        const Icon = role.icon;
                        return (
                          <div
                            key={role.key}
                            className={`a-role-chip ${isLit ? "lit" : "dim"}`}
                          >
                            <div className="a-role-chip-icon">
                              <Icon size={13} />
                            </div>
                            <div className="a-role-chip-label">
                              {role.label}
                            </div>
                          </div>
                        );
                      })}
                      <div className="a-role-matrix-hint">
                        Staff và Admin luôn xem được bất kể lựa chọn ở đây
                      </div>
                    </div>
                  </div>
                </div>

                {isEditMode && arCode && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(13,51,48,0.5)",
                      marginBottom: 16,
                    }}
                  >
                    {arCode.scanCount} lượt quét
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="submit"
                    className="a-btn-primary"
                    style={{ flex: 1, justifyContent: "center" }}
                    disabled={isSaving}
                  >
                    {isSaving
                      ? "Đang lưu..."
                      : isEditMode
                        ? "Lưu thay đổi"
                        : "Tạo mã AR"}
                  </button>

                  {isEditMode && arCode && (
                    <button
                      type="button"
                      className="a-btn-ghost"
                      onClick={() => toggleMutation.mutate()}
                      disabled={toggleMutation.isPending}
                    >
                      {arCode.isActive ? (
                        <>
                          <Ban size={12} /> Vô hiệu hoá
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={12} /> Kích hoạt lại
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>

        {/* ── Cột phải: QR ── */}
        <div className="a-ar-side">
          <div className="a-chart-card">
            <div className="a-chart-card-header">
              <h3 className="a-chart-title" style={{ fontSize: 13 }}>
                Mã <em>QR</em>
              </h3>
            </div>
            {!isEditMode || !arCode ? (
              <div
                style={{
                  padding: "32px 0",
                  textAlign: "center",
                  color: "rgba(13,51,48,0.3)",
                  fontSize: 12,
                }}
              >
                QR sẽ hiện ra sau khi tạo mã
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <div
                  ref={qrWrapRef}
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "4px 0 16px",
                  }}
                >
                  <QRCodeCanvas
                    value={qrUrl}
                    size={160}
                    level="M"
                    includeMargin
                    bgColor="#ffffff"
                    fgColor="#0D3330"
                  />
                </div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 10,
                    wordBreak: "break-all",
                    textAlign: "left",
                    background: "#f5f3ee",
                    padding: "8px 10px",
                    borderRadius: 6,
                    marginBottom: 14,
                    color: "#0D3330",
                  }}
                >
                  {qrUrl}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
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
      </div>
    </AdminLayout>
  );
}
