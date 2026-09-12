import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Search,
  Plus,
  Pencil,
  Trash2,
  EyeOff,
  Eye,
  RotateCcw,
  UploadCloud,
  FileText,
  Newspaper,
  Paperclip,
} from "lucide-react";
import { newsService } from "../../services/newsService";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import AdminLayout from "./AdminLayout";
import { AdminSkeletonRows } from "../../components/skeletons/SkeletonAdmin";

function formatDateTime(date) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ROLE_LABEL = {
  ADMIN: "Admin",
  STAFF: "Nhân viên",
  CUSTOMER: "Khách hàng",
  DEALER: "Đại lý",
};

/* TAB 1 - BẢNG TIN (NewsPost) */
function PostsTab() {
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [form, setForm] = useState({ title: "", description: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-news-posts", page, search],
    queryFn: () =>
      newsService
        .getPosts({ page, limit: 10, search: search || undefined })
        .then((r) => r.data.data),
    keepPreviousData: true,
  });

  const posts = data?.posts ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["admin-news-posts"] });

  const createMutation = useMutation({
    mutationFn: () => newsService.createPost(form),
    onSuccess: () => {
      toast.success("Đã đăng tin");
      closeForm();
      invalidate();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Đăng tin thất bại"),
  });

  const updateMutation = useMutation({
    mutationFn: () => newsService.updatePost(editingPost.id, form),
    onSuccess: () => {
      toast.success("Đã cập nhật tin");
      closeForm();
      invalidate();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Cập nhật thất bại"),
  });

  const hideMutation = useMutation({
    mutationFn: (id) => newsService.toggleHidePost(id),
    onSuccess: (res) => {
      toast.success(res.data.message);
      invalidate();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Thao tác thất bại"),
  });

  const softDeleteMutation = useMutation({
    mutationFn: (id) => newsService.softDeletePost(id),
    onSuccess: () => {
      toast.success("Đã xóa mềm tin - có thể khôi phục sau");
      invalidate();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Xóa thất bại"),
  });

  const restoreMutation = useMutation({
    mutationFn: (id) => newsService.restorePost(id),
    onSuccess: () => {
      toast.success("Đã khôi phục tin");
      invalidate();
    },
  });

  const hardDeleteMutation = useMutation({
    mutationFn: (id) => newsService.hardDeletePost(id),
    onSuccess: () => {
      toast.success("Đã xóa vĩnh viễn");
      invalidate();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Xóa cứng thất bại"),
  });

  const openCreate = () => {
    setEditingPost(null);
    setForm({ title: "", description: "" });
    setShowForm(true);
  };
  const openEdit = (post) => {
    setEditingPost(post);
    setForm({ title: post.title, description: post.description });
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setEditingPost(null);
    setForm({ title: "", description: "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Vui lòng nhập đầy đủ tiêu đề và mô tả");
      return;
    }
    editingPost ? updateMutation.mutate() : createMutation.mutate();
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", maxWidth: 320, flex: 1 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "rgba(13,51,48,0.35)",
            }}
          />
          <input
            className="a-input"
            style={{ paddingLeft: 34, width: "100%" }}
            placeholder="Tìm theo tiêu đề, mô tả..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <button className="a-btn-primary" onClick={openCreate}>
          <Plus size={14} /> Đăng tin mới
        </button>
      </div>

      <div className="a-table-card">
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                {[
                  "Tiêu đề",
                  "Người đăng",
                  "Vai trò",
                  "Ngày đăng",
                  "Trạng thái",
                  "Thao tác",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <AdminSkeletonRows columns={6} rows={6} />
              ) : !posts.length ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: 48,
                      textAlign: "center",
                      color: "rgba(13,51,48,0.3)",
                    }}
                  >
                    Chưa có tin nào
                  </td>
                </tr>
              ) : (
                posts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div
                        style={{ fontWeight: 500, fontSize: 12, maxWidth: 260 }}
                      >
                        {p.title}
                      </div>
                      <div
                        className="a-td-muted"
                        style={{
                          maxWidth: 260,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.description}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 12 }}>
                        {p.author?.name}
                      </div>
                    </td>
                    <td>
                      <span className="a-badge info">
                        {ROLE_LABEL[p.author?.role] || p.author?.role}
                      </span>
                    </td>
                    <td className="a-td-muted">
                      {formatDateTime(p.createdAt)}
                    </td>
                    <td>
                      {p.isDeleted ? (
                        <span className="a-badge neutral">Đã xóa mềm</span>
                      ) : p.isHidden ? (
                        <span className="a-badge warning">Đang ẩn</span>
                      ) : (
                        <span className="a-badge success">Đang hiện</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        {!p.isDeleted && (
                          <>
                            <button
                              className="a-btn-icon edit"
                              title="Sửa"
                              onClick={() => openEdit(p)}
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              className={`a-btn-icon ${p.isHidden ? "toggle-off" : "toggle-on"}`}
                              title={p.isHidden ? "Hiện lại" : "Ẩn tin"}
                              onClick={() => hideMutation.mutate(p.id)}
                            >
                              {p.isHidden ? (
                                <Eye size={12} />
                              ) : (
                                <EyeOff size={12} />
                              )}
                            </button>
                            <button
                              className="a-btn-icon delete"
                              title="Xóa mềm"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Xóa mềm tin này? Bạn có thể khôi phục sau.",
                                  )
                                ) {
                                  softDeleteMutation.mutate(p.id);
                                }
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                        {p.isDeleted && (
                          <>
                            <button
                              className="a-btn-icon toggle-off"
                              title="Khôi phục"
                              onClick={() => restoreMutation.mutate(p.id)}
                            >
                              <RotateCcw size={12} />
                            </button>
                            {currentUser?.role === "ADMIN" && (
                              <button
                                className="a-btn-icon delete"
                                title="Xóa vĩnh viễn"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Xóa VĨNH VIỄN tin này? Hành động không thể hoàn tác.",
                                    )
                                  ) {
                                    hardDeleteMutation.mutate(p.id);
                                  }
                                }}
                              >
                                <X size={12} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="a-pagination">
          <span className="a-pagination-info">Tổng {total} tin</span>
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

      {showForm && (
        <div
          className="a-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && closeForm()}
        >
          <div className="a-modal">
            <div className="a-modal-header">
              <h3 className="a-modal-title">
                {editingPost ? "Chỉnh sửa tin" : "Đăng tin mới"}
              </h3>
              <button
                className="a-modal-close"
                onClick={closeForm}
                aria-label="Đóng"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="a-modal-body">
                <div className="a-form-grid">
                  <div className="a-form-group span-2">
                    <label className="a-form-label">Tiêu đề *</label>
                    <input
                      className="a-input"
                      value={form.title}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, title: e.target.value }))
                      }
                      required
                      placeholder="VD: Thông báo bảo trì hệ thống"
                    />
                  </div>
                  <div className="a-form-group span-2">
                    <label className="a-form-label">Mô tả *</label>
                    <textarea
                      className="a-textarea"
                      rows={6}
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                      required
                      placeholder="Nội dung chi tiết của tin..."
                    />
                  </div>
                </div>
              </div>
              <div className="a-modal-footer">
                <button
                  type="submit"
                  className="a-btn-primary"
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Đang lưu..."
                    : editingPost
                      ? "Lưu thay đổi"
                      : "Đăng tin"}
                </button>
                <button
                  type="button"
                  className="a-btn-ghost"
                  onClick={closeForm}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/* TAB 2 - FILE CÔNG KHAI (NewsFile) */
function FilesTab() {
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [pickedFile, setPickedFile] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const fileInputRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-news-files", page, search],
    queryFn: () =>
      newsService
        .getFiles({ page, limit: 10, search: search || undefined })
        .then((r) => r.data.data),
    keepPreviousData: true,
  });

  const files = data?.files ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["admin-news-files"] });

  const uploadMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append("file", pickedFile);
      if (displayName.trim()) fd.append("fileName", displayName.trim());
      return newsService.createFile(fd);
    },
    onSuccess: () => {
      toast.success("Đã thêm file");
      closeUpload();
      invalidate();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Tải file thất bại"),
  });

  const hideMutation = useMutation({
    mutationFn: (id) => newsService.toggleHideFile(id),
    onSuccess: (res) => {
      toast.success(res.data.message);
      invalidate();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Thao tác thất bại"),
  });

  const softDeleteMutation = useMutation({
    mutationFn: (id) => newsService.softDeleteFile(id),
    onSuccess: () => {
      toast.success("Đã xóa mềm file");
      invalidate();
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id) => newsService.restoreFile(id),
    onSuccess: () => {
      toast.success("Đã khôi phục file");
      invalidate();
    },
  });

  const hardDeleteMutation = useMutation({
    mutationFn: (id) => newsService.hardDeleteFile(id),
    onSuccess: () => {
      toast.success("Đã xóa vĩnh viễn");
      invalidate();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Xóa cứng thất bại"),
  });

  const closeUpload = () => {
    setShowUpload(false);
    setPickedFile(null);
    setDisplayName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!pickedFile) {
      toast.error("Vui lòng chọn file");
      return;
    }
    uploadMutation.mutate();
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", maxWidth: 320, flex: 1 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "rgba(13,51,48,0.35)",
            }}
          />
          <input
            className="a-input"
            style={{ paddingLeft: 34, width: "100%" }}
            placeholder="Tìm theo tên file..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <button className="a-btn-primary" onClick={() => setShowUpload(true)}>
          <UploadCloud size={14} /> Thêm file
        </button>
      </div>

      <div className="a-table-card">
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                {[
                  "Tên file",
                  "Loại",
                  "Dung lượng",
                  "Người đăng",
                  "Ngày đăng",
                  "Trạng thái",
                  "Thao tác",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <AdminSkeletonRows columns={7} rows={5} />
              ) : !files.length ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: 48,
                      textAlign: "center",
                      color: "rgba(13,51,48,0.3)",
                    }}
                  >
                    Chưa có file nào
                  </td>
                </tr>
              ) : (
                files.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontWeight: 500,
                          fontSize: 12,
                        }}
                      >
                        <FileText
                          size={14}
                          style={{
                            color: "var(--a-gold, #b8934a)",
                            flexShrink: 0,
                          }}
                        />
                        <a
                          href={f.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: "inherit",
                            textDecoration: "none",
                            maxWidth: 220,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {f.fileName}
                        </a>
                      </div>
                    </td>
                    <td>
                      <span className="a-badge neutral">
                        {f.fileType?.toUpperCase()}
                      </span>
                    </td>
                    <td className="a-td-muted">{formatBytes(f.fileSize)}</td>
                    <td>{f.uploader?.name}</td>
                    <td className="a-td-muted">
                      {formatDateTime(f.createdAt)}
                    </td>
                    <td>
                      {f.isDeleted ? (
                        <span className="a-badge neutral">Đã xóa mềm</span>
                      ) : f.isHidden ? (
                        <span className="a-badge warning">Đang ẩn</span>
                      ) : (
                        <span className="a-badge success">Công khai</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        {!f.isDeleted && (
                          <>
                            <button
                              className={`a-btn-icon ${f.isHidden ? "toggle-off" : "toggle-on"}`}
                              title={f.isHidden ? "Hiện lại" : "Ẩn file"}
                              onClick={() => hideMutation.mutate(f.id)}
                            >
                              {f.isHidden ? (
                                <Eye size={12} />
                              ) : (
                                <EyeOff size={12} />
                              )}
                            </button>
                            <button
                              className="a-btn-icon delete"
                              title="Xóa mềm"
                              onClick={() => {
                                if (window.confirm("Xóa mềm file này?"))
                                  softDeleteMutation.mutate(f.id);
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                        {f.isDeleted && (
                          <>
                            <button
                              className="a-btn-icon toggle-off"
                              title="Khôi phục"
                              onClick={() => restoreMutation.mutate(f.id)}
                            >
                              <RotateCcw size={12} />
                            </button>
                            {currentUser?.role === "ADMIN" && (
                              <button
                                className="a-btn-icon delete"
                                title="Xóa vĩnh viễn (xóa cả trên CDN)"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Xóa VĨNH VIỄN file này? Hành động không thể hoàn tác.",
                                    )
                                  ) {
                                    hardDeleteMutation.mutate(f.id);
                                  }
                                }}
                              >
                                <X size={12} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="a-pagination">
          <span className="a-pagination-info">Tổng {total} file</span>
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

      {showUpload && (
        <div
          className="a-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && closeUpload()}
        >
          <div className="a-modal" style={{ maxWidth: 440 }}>
            <div className="a-modal-header">
              <h3 className="a-modal-title">Thêm file công khai</h3>
              <button
                className="a-modal-close"
                onClick={closeUpload}
                aria-label="Đóng"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleUploadSubmit}>
              <div className="a-modal-body">
                <div className="a-form-grid">
                  <div className="a-form-group span-2">
                    <label className="a-form-label">Chọn file *</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="a-input"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        setPickedFile(f || null);
                        if (f && !displayName) setDisplayName(f.name);
                      }}
                      required
                    />
                    {pickedFile && (
                      <div className="a-td-muted" style={{ marginTop: 6 }}>
                        {pickedFile.name} - {formatBytes(pickedFile.size)}
                      </div>
                    )}
                  </div>
                  <div className="a-form-group span-2">
                    <label className="a-form-label">Tên hiển thị</label>
                    <input
                      className="a-input"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Để trống sẽ dùng tên file gốc"
                    />
                  </div>
                </div>
              </div>
              <div className="a-modal-footer">
                <button
                  type="submit"
                  className="a-btn-primary"
                  disabled={uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? "Đang tải lên..." : "Thêm file"}
                </button>
                <button
                  type="button"
                  className="a-btn-ghost"
                  onClick={closeUpload}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/* ROOT - News.jsx (2 tab: Bảng tin / File công khai) */
export default function News() {
  const [tab, setTab] = useState("posts");

  return (
    <AdminLayout>
      <div className="a-page-header">
        <div>
          <p className="a-page-eyebrow">Quản lý</p>
          <h1 className="a-page-title">
            Bảng Tin <em>News</em>
          </h1>
        </div>
      </div>

      <div className="a-pills" style={{ marginBottom: 18 }}>
        <button
          className={`a-pill${tab === "posts" ? " active" : ""}`}
          onClick={() => setTab("posts")}
        >
          <Newspaper
            size={13}
            style={{ display: "inline", verticalAlign: -2, marginRight: 6 }}
          />
          Bảng tin
        </button>
        <button
          className={`a-pill${tab === "files" ? " active" : ""}`}
          onClick={() => setTab("files")}
        >
          <Paperclip
            size={13}
            style={{ display: "inline", verticalAlign: -2, marginRight: 6 }}
          />
          File công khai
        </button>
      </div>

      {tab === "posts" ? <PostsTab /> : <FilesTab />}
    </AdminLayout>
  );
}
