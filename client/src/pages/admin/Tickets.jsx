import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Search,
  Send,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Building2,
  Clock,
  CheckCheck,
} from "lucide-react";
import { ticketService } from "../../services/ticketService";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import AdminLayout from "./AdminLayout";

/*  Constants  */
export const TICKET_STATUS = {
  NEW: "Mới",
  IN_PROGRESS: "Đang xử lý",
  RESOLVED: "Đã xử lý",
  CLOSED: "Đã đóng",
};

const TICKET_BADGE = {
  NEW: "warning",
  IN_PROGRESS: "info",
  RESOLVED: "success",
  CLOSED: "neutral",
};

export const TICKET_SUBJECT = {
  PRODUCT_ADVICE: "Tư vấn sản phẩm",
  BUSINESS: "Hợp tác kinh doanh",
  TECHNICAL_SUPPORT: "Hỗ trợ kỹ thuật",
  FEEDBACK: "Phản hồi / Góp ý",
  OTHER: "Khác",
};

const EXTRA_FIELD_LABEL = {
  product: "Sản phẩm quan tâm",
  quantity: "Số lượng dự kiến",
  bizType: "Loại hình hợp tác",
  website: "Website / Fanpage",
  orderId: "Mã đơn hàng",
  issue: "Mô tả sự cố",
  rating: "Mức độ hài lòng",
};

const CONTACT_METHOD_LABEL = {
  phone: "Điện thoại",
  zalo: "Zalo",
  email: "Email",
  facebook: "Facebook",
};

function formatDateTime(date) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/*  Ticket detail drawer  */
function TicketDrawer({ ticket, onClose, currentUser }) {
  const qc = useQueryClient();
  const [replyText, setReplyText] = useState("");
  const [nextStatus, setNextStatus] = useState("");

  const { data: detail, isLoading } = useQuery({
    queryKey: ["admin-ticket", ticket?.id],
    queryFn: () =>
      ticketService.getTicketById(ticket.id).then((r) => r.data.data),
    enabled: !!ticket,
  });

  const statusMutation = useMutation({
    mutationFn: (status) => ticketService.updateStatus(ticket.id, status),
    onSuccess: () => {
      toast.success("Đã cập nhật trạng thái");
      qc.invalidateQueries({ queryKey: ["admin-tickets"] });
      qc.invalidateQueries({ queryKey: ["admin-ticket", ticket.id] });
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Cập nhật thất bại"),
  });

  const assignMutation = useMutation({
    mutationFn: (assignedToId) => ticketService.assign(ticket.id, assignedToId),
    onSuccess: () => {
      toast.success("Đã cập nhật phân công");
      qc.invalidateQueries({ queryKey: ["admin-tickets"] });
      qc.invalidateQueries({ queryKey: ["admin-ticket", ticket.id] });
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Thao tác thất bại"),
  });

  const replyMutation = useMutation({
    mutationFn: () =>
      ticketService.reply(ticket.id, replyText.trim(), nextStatus || undefined),
    onSuccess: (res) => {
      const emailSent = res.data?.data?.reply?.emailSent;
      if (emailSent) {
        toast.success(
          "Đã gửi phản hồi — email thông báo đã được gửi tới khách hàng",
        );
      } else {
        toast.error(
          "Đã lưu phản hồi nhưng gửi email thất bại — kiểm tra lại cấu hình gửi mail",
        );
      }
      setReplyText("");
      setNextStatus("");
      qc.invalidateQueries({ queryKey: ["admin-tickets"] });
      qc.invalidateQueries({ queryKey: ["admin-ticket", ticket.id] });
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Gửi phản hồi thất bại"),
  });

  if (!ticket) return null;
  const t = detail || ticket;
  const isAssignedToMe = t.assignedToId === currentUser?.id;

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyText.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi");
      return;
    }
    replyMutation.mutate();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)" }}
        onClick={onClose}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: 460,
          maxWidth: "100%",
          background: "#fff",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(13,51,48,0.07)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            background: "#fff",
            zIndex: 1,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(13,51,48,0.4)",
                marginBottom: 3,
              }}
            >
              Yêu cầu liên hệ
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 14,
                color: "var(--a-ink)",
                fontWeight: 600,
              }}
            >
              {t.code}
            </div>
          </div>
          <button className="a-modal-close" onClick={onClose} aria-label="Đóng">
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 24, flex: 1 }}>
          {/* Trạng thái + chủ đề */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 20,
              flexWrap: "wrap",
            }}
          >
            <span className={`a-badge ${TICKET_BADGE[t.status] ?? "neutral"}`}>
              {TICKET_STATUS[t.status]}
            </span>
            <span className="a-badge neutral">
              {TICKET_SUBJECT[t.subject] || t.subject}
            </span>
          </div>

          {/* Người gửi */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(13,51,48,0.38)",
                marginBottom: 10,
                fontWeight: 500,
              }}
            >
              Người gửi
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 8,
              }}
            >
              <div className="a-user-avatar">{t.name?.[0]?.toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{t.name}</div>
                {t.user && (
                  <div style={{ fontSize: 11, color: "rgba(13,51,48,0.45)" }}>
                    Tài khoản: {t.user.email}
                  </div>
                )}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                fontSize: 12,
                color: "var(--a-ink)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Mail size={13} strokeWidth={1.5} color="rgba(13,51,48,0.4)" />
                <a href={`mailto:${t.email}`}>{t.email}</a>
              </div>
              {t.phone && (
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Phone
                    size={13}
                    strokeWidth={1.5}
                    color="rgba(13,51,48,0.4)"
                  />
                  <a href={`tel:${t.phone}`}>{t.phone}</a>
                </div>
              )}
              {t.company && (
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Building2
                    size={13}
                    strokeWidth={1.5}
                    color="rgba(13,51,48,0.4)"
                  />
                  {t.company}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Clock size={13} strokeWidth={1.5} color="rgba(13,51,48,0.4)" />
                {formatDateTime(t.createdAt)}
              </div>
            </div>
            {t.contactMethods?.length > 0 && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 11,
                  color: "rgba(13,51,48,0.5)",
                }}
              >
                Muốn được liên hệ qua:{" "}
                <strong style={{ color: "var(--a-ink)" }}>
                  {t.contactMethods
                    .map((m) => CONTACT_METHOD_LABEL[m] || m)
                    .join(", ")}
                </strong>
              </div>
            )}
          </div>

          {/* Extra fields theo chủ đề */}
          {t.extraFields && Object.keys(t.extraFields).length > 0 && (
            <div
              style={{
                marginBottom: 20,
                background: "var(--a-surface)",
                borderRadius: 8,
                padding: "13px 16px",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "rgba(13,51,48,0.38)",
                  marginBottom: 8,
                  fontWeight: 500,
                }}
              >
                Thông tin thêm
              </div>
              {Object.entries(t.extraFields)
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} style={{ fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: "rgba(13,51,48,0.5)" }}>
                      {EXTRA_FIELD_LABEL[k] || k}:{" "}
                    </span>
                    <strong style={{ color: "var(--a-ink)" }}>{v}</strong>
                  </div>
                ))}
            </div>
          )}

          {/* Nội dung */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(13,51,48,0.38)",
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              Tin nhắn
            </div>
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.7,
                color: "var(--a-ink)",
                whiteSpace: "pre-wrap",
              }}
            >
              {t.message}
            </div>
          </div>

          {/* Phân công */}
          <div
            style={{
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div style={{ fontSize: 12, color: "rgba(13,51,48,0.55)" }}>
              {t.assignedTo ? (
                <>
                  Phụ trách:{" "}
                  <strong style={{ color: "var(--a-ink)" }}>
                    {t.assignedTo.name}
                  </strong>
                </>
              ) : (
                "Chưa có ai phụ trách"
              )}
            </div>
            {isAssignedToMe ? (
              <button
                type="button"
                className="a-btn-ghost"
                style={{
                  fontSize: 11,
                  padding: "6px 12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
                disabled={assignMutation.isPending}
                onClick={() => assignMutation.mutate(null)}
              >
                <UserX size={13} /> Bỏ nhận
              </button>
            ) : (
              <button
                type="button"
                className="a-btn-ghost"
                style={{
                  fontSize: 11,
                  padding: "6px 12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
                disabled={assignMutation.isPending}
                onClick={() => assignMutation.mutate(currentUser.id)}
              >
                <UserCheck size={13} /> Nhận xử lý
              </button>
            )}
          </div>

          {/* Lịch sử phản hồi */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(13,51,48,0.38)",
                marginBottom: 10,
                fontWeight: 500,
              }}
            >
              Lịch sử phản hồi ({t.replies?.length ?? 0})
            </div>
            {isLoading ? (
              <div style={{ fontSize: 12, color: "rgba(13,51,48,0.4)" }}>
                Đang tải...
              </div>
            ) : !t.replies?.length ? (
              <div style={{ fontSize: 12, color: "rgba(13,51,48,0.4)" }}>
                Chưa có phản hồi nào
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {t.replies.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      background: "var(--a-surface)",
                      borderRadius: 8,
                      padding: "12px 14px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: "var(--a-ink)",
                        }}
                      >
                        {r.staff?.name}
                      </span>
                      <span
                        style={{ fontSize: 11, color: "rgba(13,51,48,0.4)" }}
                      >
                        {formatDateTime(r.createdAt)}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12.5,
                        lineHeight: 1.6,
                        color: "var(--a-ink)",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {r.message}
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 10.5,
                        color: r.emailSent ? "#2e8b57" : "#b23a30",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <CheckCheck size={11} />
                      {r.emailSent
                        ? "Đã gửi email cho khách"
                        : "Gửi email thất bại"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form phản hồi */}
          <form onSubmit={handleReplySubmit}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(13,51,48,0.38)",
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              Phản hồi khách hàng
            </div>
            <textarea
              className="a-textarea"
              rows={4}
              placeholder="Nhập nội dung phản hồi... (sẽ tự động gửi email cho khách)"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              style={{ width: "100%", marginBottom: 10, resize: "vertical" }}
            />
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <select
                className="a-inline-select"
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="">Giữ nguyên trạng thái</option>
                {Object.entries(TICKET_STATUS).map(([key, label]) => (
                  <option key={key} value={key}>
                    Chuyển sang: {label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="a-btn-primary"
                disabled={replyMutation.isPending}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  whiteSpace: "nowrap",
                }}
              >
                <Send size={13} />
                {replyMutation.isPending ? "Đang gửi..." : "Gửi phản hồi"}
              </button>
            </div>
          </form>

          {/* Đổi trạng thái nhanh */}
          <div
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: "1px solid rgba(13,51,48,0.08)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(13,51,48,0.38)",
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              Đổi trạng thái (không gửi email)
            </div>
            <select
              className="a-inline-select"
              value={t.status}
              onChange={(e) => statusMutation.mutate(e.target.value)}
              style={{ width: "100%" }}
            >
              {Object.entries(TICKET_STATUS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Tickets() {
  const { user } = useAuthStore();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tickets", page, status, search],
    queryFn: () =>
      ticketService
        .getTickets({ page, limit: 15, status, search: search || undefined })
        .then((r) => r.data.data),
    keepPreviousData: true,
  });

  const tickets = data?.tickets ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;
  const counts = data?.counts ?? {};

  return (
    <AdminLayout>
      {/* Header */}
      <div className="a-page-header">
        <div>
          <p className="a-page-eyebrow">Quản lý</p>
          <h1 className="a-page-title">
            Yêu Cầu <em>Liên Hệ</em>
          </h1>
        </div>
        <div style={{ fontSize: 12, color: "rgba(13,51,48,0.4)" }}>
          Tổng <strong style={{ color: "var(--a-ink)" }}>{total}</strong> yêu
          cầu
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 14, position: "relative", maxWidth: 320 }}>
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
          placeholder="Tìm theo mã, tên, email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Status filter pills */}
      <div className="a-pills">
        <button
          className={`a-pill${!status ? " active" : ""}`}
          onClick={() => {
            setStatus("");
            setPage(1);
          }}
        >
          Tất cả ({total})
        </button>
        {Object.entries(TICKET_STATUS).map(([key, label]) => (
          <button
            key={key}
            className={`a-pill${status === key ? " active" : ""}`}
            onClick={() => {
              setStatus(key);
              setPage(1);
            }}
          >
            {label} ({counts[key] ?? 0})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="a-table-card">
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                {[
                  "Mã yêu cầu",
                  "Người gửi",
                  "Chủ đề",
                  "Trạng thái",
                  "Phụ trách",
                  "Ngày gửi",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: 48,
                      textAlign: "center",
                      color: "rgba(13,51,48,0.3)",
                    }}
                  >
                    Đang tải...
                  </td>
                </tr>
              ) : !tickets.length ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: 48,
                      textAlign: "center",
                      color: "rgba(13,51,48,0.3)",
                    }}
                  >
                    Không có yêu cầu liên hệ nào
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr
                    key={t.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelected(t)}
                  >
                    <td className="a-td-mono">{t.code}</td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 12 }}>
                        {t.name}
                      </div>
                      <div className="a-td-muted">{t.email}</div>
                    </td>
                    <td>{TICKET_SUBJECT[t.subject] || t.subject}</td>
                    <td>
                      <span
                        className={`a-badge ${TICKET_BADGE[t.status] ?? "neutral"}`}
                      >
                        {TICKET_STATUS[t.status]}
                      </span>
                    </td>
                    <td className="a-td-muted">{t.assignedTo?.name || "—"}</td>
                    <td className="a-td-muted">
                      {formatDateTime(t.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="a-pagination">
          <span className="a-pagination-info">Tổng {total} yêu cầu</span>
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

      {/* Detail drawer */}
      <TicketDrawer
        ticket={selected}
        onClose={() => setSelected(null)}
        currentUser={user}
      />
    </AdminLayout>
  );
}
