import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Mail,
  Send,
  Eye,
  X,
  Plus,
  RefreshCw,
  Clock,
  Lock,
  Unlock,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { formatDate } from "../../utils/helpers";
import AdminLayout from "./AdminLayout";

/*  Status badge config  */
const STATUS_CLS = {
  delivered: "success",
  opened: "success",
  clicked: "success",
  sent: "info",
  scheduled: "info",
  delivery_delayed: "warning",
  bounced: "danger",
  complained: "danger",
  failed: "danger",
  canceled: "neutral",
};

function StatusBadge({ status, label }) {
  const cls = STATUS_CLS[status] || "neutral";
  return <span className={`a-badge ${cls}`}>{label}</span>;
}

/* ══════════════════════════════════════════════
   COMPOSE MODAL
   — "to" có autocomplete gợi ý khách hàng (role CUSTOMER) trong DB, gõ từ 1 ký tự là gợi ý
   — Chữ ký tự điền theo tài khoản admin/staff đang đăng nhập:
     field nào có sẵn dữ liệu -> khoá mặc định (readOnly), nhưng có nút mở khoá để sửa tay
   — Bên phải hiển thị xem trước email theo đúng template thật, cập nhật tự động khi gõ
══════════════════════════════════════════════ */
function ComposeModal({ onClose, onSent }) {
  const [form, setForm] = useState({
    to: "",
    cc: "",
    bcc: "",
    subject: "",
    content: "",
    senderName: "",
    senderDept: "",
    senderPhone: "",
    senderEmail: "",
  });
  // Field nào đang bị khoá (mặc định khoá nếu có sẵn dữ liệu từ tài khoản, có thể bấm mở)
  const [lockedFields, setLockedFields] = useState({});

  const [toSuggestions, setToSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestTimer = useRef(null);

  //  Xem trước email
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewTimer = useRef(null);

  //  Lấy thông tin tài khoản đang đăng nhập để tự điền chữ ký
  const { data: profile } = useQuery({
    queryKey: ["admin-email-sender-profile"],
    queryFn: () => api.get("/admin/emails/me").then((r) => r.data.data),
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!profile) return;
    setForm((f) => ({
      ...f,
      senderName: profile.name ?? "",
      senderPhone: profile.phone ?? "",
      senderEmail: profile.email ?? "",
      senderDept: profile.department ?? "",
    }));
    setLockedFields({
      senderName: !!profile.name,
      senderPhone: !!profile.phone,
      senderEmail: !!profile.email,
      senderDept: !!profile.department, // hiện tại luôn null -> luôn cho sửa
    });
  }, [profile]);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const toggleLock = (field) => {
    setLockedFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  /*  Autocomplete cho ô "to": gõ tới đâu gợi ý khách hàng tới đó (từ 1 ký tự)  */
  const handleToChange = (e) => {
    const value = e.target.value;
    setForm({ ...form, to: value });

    const lastSegment = value.split(",").pop().trim();
    clearTimeout(suggestTimer.current);

    if (lastSegment.length < 1) {
      setToSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    suggestTimer.current = setTimeout(async () => {
      try {
        const res = await api.get("/admin/emails/customers", {
          params: { search: lastSegment },
        });
        setToSuggestions(res.data.data ?? []);
        setShowSuggestions(true);
      } catch (err) {
        console.error("[ComposeModal] Lỗi tìm gợi ý khách hàng:", err);
        setToSuggestions([]);
      }
    }, 200);
  };

  const pickSuggestion = (email) => {
    const segments = form.to
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    segments.pop(); // bỏ đoạn đang gõ dở
    segments.push(email);
    setForm({ ...form, to: segments.join(", ") + ", " });
    setShowSuggestions(false);
    setToSuggestions([]);
  };

  /*  Xem trước email: debounce gọi API preview mỗi khi nội dung liên quan thay đổi  */
  useEffect(() => {
    clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const hasSender = form.senderName.trim() || form.senderEmail.trim();
        const res = await api.post("/admin/emails/preview", {
          to: form.to,
          subject: form.subject,
          content: form.content,
          sender: hasSender
            ? {
                name: form.senderName || undefined,
                department: form.senderDept || undefined,
                phone: form.senderPhone || undefined,
                email: form.senderEmail || undefined,
              }
            : null,
        });
        setPreviewHtml(res.data?.data?.html || "");
      } catch (err) {
        console.error("[ComposeModal] Lỗi tạo bản xem trước:", err);
      } finally {
        setPreviewLoading(false);
      }
    }, 400);

    return () => clearTimeout(previewTimer.current);
  }, [
    form.to,
    form.subject,
    form.content,
    form.senderName,
    form.senderDept,
    form.senderPhone,
    form.senderEmail,
  ]);

  const sendMutation = useMutation({
    mutationFn: (payload) =>
      api.post("/admin/emails/send", payload).then((r) => r.data),
    onSuccess: () => {
      toast.success("Đã gửi email thành công");
      onSent();
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Gửi email thất bại");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.to.trim() || !form.subject.trim() || !form.content.trim()) {
      toast.error("Vui lòng nhập đủ Người nhận, Tiêu đề và Nội dung");
      return;
    }

    const hasSender = form.senderName.trim() || form.senderEmail.trim();

    sendMutation.mutate({
      to: form.to,
      cc: form.cc || undefined,
      bcc: form.bcc || undefined,
      subject: form.subject,
      content: form.content,
      sender: hasSender
        ? {
            name: form.senderName || undefined,
            department: form.senderDept || undefined,
            phone: form.senderPhone || undefined,
            email: form.senderEmail || undefined,
          }
        : null,
    });
  };

  /* Ô input chữ ký: khoá theo mặc định nếu đã có sẵn dữ liệu, nhưng có nút bấm mở/khoá lại */
  const SignatureInput = ({ field, placeholder }) => {
    const locked = !!lockedFields[field];
    return (
      <div style={{ position: "relative" }}>
        <input
          className="a-input"
          placeholder={placeholder}
          value={form[field]}
          onChange={update(field)}
          readOnly={locked}
          style={{
            paddingRight: 32,
            ...(locked
              ? { background: "var(--a-ink-05)", color: "var(--a-ink-60)" }
              : undefined),
          }}
        />
        <button
          type="button"
          onClick={() => toggleLock(field)}
          title={locked ? "Bấm để sửa" : "Bấm để khoá lại"}
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 2,
            display: "flex",
            alignItems: "center",
            color: locked ? "var(--a-ink-40)" : "var(--a-brand, #0b2e2b)",
          }}
        >
          {locked ? <Lock size={12} /> : <Unlock size={12} />}
        </button>
      </div>
    );
  };

  return (
    <div className="a-modal-overlay" onClick={onClose}>
      <div
        className="a-modal wide"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 1220,
          width: "96vw",
          height: "88vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="a-modal-header">
          <h3 className="a-modal-title">Soạn email mới</h3>
          <button className="a-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
          }}
        >
          {/*  2 cột: trái = form, phải = xem trước email  */}
          <div
            style={{
              display: "flex",
              flex: 1,
              minHeight: 0,
              borderTop: "1px solid var(--a-ink-08)",
            }}
          >
            {/* CỘT TRÁI — FORM */}
            <div
              className="a-modal-body"
              style={{
                flex: "0 0 46%",
                maxWidth: "46%",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                borderRight: "1px solid var(--a-ink-08)",
              }}
            >
              {/*  Người nhận (có autocomplete)  */}
              <div className="a-form-group" style={{ position: "relative" }}>
                <label className="a-form-label">Người nhận (to) *</label>
                <input
                  className="a-input"
                  placeholder="Gõ email hoặc tên khách hàng..."
                  value={form.to}
                  onChange={handleToChange}
                  onFocus={() =>
                    toSuggestions.length && setShowSuggestions(true)
                  }
                  onBlur={() =>
                    setTimeout(() => setShowSuggestions(false), 150)
                  }
                  autoComplete="off"
                />
                {showSuggestions && toSuggestions.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      zIndex: 20,
                      background: "var(--a-white)",
                      border: "1px solid var(--a-ink-08)",
                      borderRadius: 8,
                      marginTop: 4,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                      maxHeight: 180,
                      overflowY: "auto",
                    }}
                  >
                    {toSuggestions.map((c) => (
                      <div
                        key={c.email}
                        onMouseDown={() => pickSuggestion(c.email)}
                        style={{
                          padding: "8px 12px",
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "var(--a-surface)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <div style={{ fontWeight: 500 }}>{c.name}</div>
                        <div style={{ color: "var(--a-ink-40)", fontSize: 11 }}>
                          {c.email}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="a-form-grid">
                <div className="a-form-group">
                  <label className="a-form-label">CC</label>
                  <input
                    className="a-input"
                    placeholder="tuỳ chọn"
                    value={form.cc}
                    onChange={update("cc")}
                  />
                </div>
                <div className="a-form-group">
                  <label className="a-form-label">BCC</label>
                  <input
                    className="a-input"
                    placeholder="tuỳ chọn"
                    value={form.bcc}
                    onChange={update("bcc")}
                  />
                </div>
              </div>

              {/*  Tiêu đề & Nội dung  */}
              <div className="a-form-group">
                <label className="a-form-label">Tiêu đề *</label>
                <input
                  className="a-input"
                  placeholder="vd: Thông báo bảo trì hệ thống"
                  value={form.subject}
                  onChange={update("subject")}
                />
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--a-ink-40)",
                    marginTop: 5,
                  }}
                >
                  Tiêu đề này sẽ vừa là dòng subject, vừa hiển thị làm tiêu đề
                  chính trong email.
                </p>
              </div>

              <div className="a-form-group">
                <label className="a-form-label">Nội dung *</label>
                <textarea
                  className="a-input a-textarea"
                  style={{ minHeight: 160 }}
                  placeholder={
                    'Gõ nội dung email ở đây...\n\nCách dòng trống để tạo đoạn văn mới.\nDán link http(s)://... vào đoạn văn sẽ tự thành nút "Xem ngay".'
                  }
                  value={form.content}
                  onChange={update("content")}
                />
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--a-ink-40)",
                    marginTop: 5,
                  }}
                >
                  Chỉ cần gõ chữ thường — hệ thống tự canh chỉnh theo mẫu email
                  của Earthoria. Dòng chào "Xin chào, ..." sẽ tự lấy tên từ
                  email người nhận đầu tiên.
                </p>
              </div>

              {/*  Chữ ký người gửi  */}
              <div
                style={{
                  borderTop: "1px solid var(--a-ink-08)",
                  paddingTop: 14,
                }}
              >
                <label
                  className="a-form-label"
                  style={{ marginBottom: 4, display: "block" }}
                >
                  Chữ ký người gửi
                </label>
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--a-ink-40)",
                    marginBottom: 10,
                  }}
                >
                  Tự lấy theo tài khoản đang đăng nhập. Bấm icon ổ khoá để
                  mở/khoá sửa từng field.
                </p>
                <div className="a-form-grid">
                  <div className="a-form-group">
                    <label className="a-form-label" style={{ fontSize: 9 }}>
                      Tên
                    </label>
                    <SignatureInput
                      field="senderName"
                      placeholder="vd: Phúc Khang"
                    />
                  </div>
                  <div className="a-form-group">
                    <label className="a-form-label" style={{ fontSize: 9 }}>
                      Phòng ban
                    </label>
                    <SignatureInput field="senderDept" placeholder="vd: IT" />
                  </div>
                  <div className="a-form-group">
                    <label className="a-form-label" style={{ fontSize: 9 }}>
                      Số điện thoại
                    </label>
                    <SignatureInput
                      field="senderPhone"
                      placeholder="tuỳ chọn"
                    />
                  </div>
                  <div className="a-form-group">
                    <label className="a-form-label" style={{ fontSize: 9 }}>
                      Email liên hệ
                    </label>
                    <SignatureInput
                      field="senderEmail"
                      placeholder="tuỳ chọn"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI — XEM TRƯỚC EMAIL */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                background: "var(--a-surface)",
              }}
            >
              <div
                style={{
                  padding: "10px 16px",
                  borderBottom: "1px solid var(--a-ink-08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 11,
                  color: "var(--a-ink-40)",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                <span>Xem trước email</span>
                {previewLoading && (
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <Loader2
                      size={12}
                      style={{ animation: "spin 1s linear infinite" }}
                    />{" "}
                    Đang cập nhật...
                  </span>
                )}
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <iframe
                  title="Xem trước email"
                  srcDoc={previewHtml}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    background: "#eceae3",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="a-modal-footer">
            <button type="button" className="a-btn-ghost" onClick={onClose}>
              Hủy
            </button>
            <button
              type="submit"
              className="a-btn-primary"
              disabled={sendMutation.isPending}
            >
              <Send size={13} />
              {sendMutation.isPending ? "Đang gửi..." : "Gửi email"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   DETAIL MODAL
══════════════════════════════════════════════ */
function DetailModal({ id, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-email-detail", id],
    queryFn: () => api.get(`/admin/emails/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

  return (
    <div className="a-modal-overlay" onClick={onClose}>
      <div className="a-modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="a-modal-header">
          <h3 className="a-modal-title">Chi tiết email</h3>
          <button className="a-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="a-modal-body">
          {isLoading ? (
            <div
              style={{
                padding: "30px 0",
                textAlign: "center",
                color: "var(--a-ink-40)",
              }}
            >
              Đang tải...
            </div>
          ) : !data ? (
            <div
              style={{
                padding: "30px 0",
                textAlign: "center",
                color: "var(--a-ink-40)",
              }}
            >
              Không tìm thấy email
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="a-form-grid">
                <div>
                  <div className="a-form-label">Từ</div>
                  <div style={{ fontSize: 12 }}>{data.from}</div>
                </div>
                <div>
                  <div className="a-form-label">Đến</div>
                  <div style={{ fontSize: 12 }}>{data.to?.join(", ")}</div>
                </div>
              </div>
              <div className="a-form-grid">
                <div>
                  <div className="a-form-label">Trạng thái</div>
                  <StatusBadge status={data.status} label={data.statusLabel} />
                </div>
                <div>
                  <div className="a-form-label">Thời gian gửi</div>
                  <div style={{ fontSize: 12 }}>
                    {formatDate(data.createdAt)}
                  </div>
                </div>
              </div>
              <div>
                <div className="a-form-label">Tiêu đề</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>
                  {data.subject}
                </div>
              </div>
              <div>
                <div className="a-form-label">Nội dung</div>
                <div
                  style={{
                    border: "1px solid var(--a-ink-08)",
                    borderRadius: 8,
                    padding: 14,
                    maxHeight: 340,
                    overflow: "auto",
                    background: "var(--a-surface)",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: data.html || "<em>Không có nội dung HTML</em>",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
export default function Emails() {
  const queryClient = useQueryClient();
  const [showCompose, setShowCompose] = useState(false);
  const [detailId, setDetailId] = useState(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin-emails"],
    queryFn: () =>
      api
        .get("/admin/emails", { params: { limit: 30 } })
        .then((r) => r.data.data),
    staleTime: 30_000,
  });

  const emails = data?.emails ?? [];

  return (
    <AdminLayout>
      <div className="a-page-header">
        <div>
          <p className="a-page-eyebrow">Hệ thống</p>
          <h1 className="a-page-title">
            Quản lý <em>Email</em>
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="a-btn-ghost"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              size={13}
              style={{
                animation: isFetching ? "spin 1s linear infinite" : "none",
              }}
            />
            Làm mới
          </button>
          <button
            className="a-btn-primary"
            onClick={() => setShowCompose(true)}
          >
            <Plus size={13} /> Soạn email mới
          </button>
        </div>
      </div>

      <div className="a-table-card">
        <div className="a-table-head">
          <h3 className="a-table-title">
            Lịch sử <em>gửi email</em>
          </h3>
          <span className="a-td-muted">{emails.length} email gần nhất</span>
        </div>
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>Người nhận</th>
                <th>Tiêu đề</th>
                <th>Trạng thái</th>
                <th>Thời gian</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: 40,
                      textAlign: "center",
                      color: "var(--a-ink-40)",
                    }}
                  >
                    Đang tải...
                  </td>
                </tr>
              ) : emails.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: 40,
                      textAlign: "center",
                      color: "var(--a-ink-40)",
                    }}
                  >
                    <Mail size={20} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <div>Chưa có email nào được gửi</div>
                  </td>
                </tr>
              ) : (
                emails.map((email) => (
                  <tr key={email.id}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 12 }}>
                        {email.to?.[0]}
                      </div>
                      {email.to?.length > 1 && (
                        <div className="a-td-muted">
                          +{email.to.length - 1} người khác
                        </div>
                      )}
                    </td>
                    <td
                      style={{
                        maxWidth: 280,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {email.subject}
                    </td>
                    <td>
                      <StatusBadge
                        status={email.status}
                        label={email.statusLabel}
                      />
                    </td>
                    <td className="a-td-muted">
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Clock size={11} /> {formatDate(email.createdAt)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="a-btn-icon edit"
                        onClick={() => setDetailId(email.id)}
                        title="Xem chi tiết"
                      >
                        <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCompose && (
        <ComposeModal
          onClose={() => setShowCompose(false)}
          onSent={() =>
            queryClient.invalidateQueries({ queryKey: ["admin-emails"] })
          }
        />
      )}
      {detailId && (
        <DetailModal id={detailId} onClose={() => setDetailId(null)} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </AdminLayout>
  );
}
