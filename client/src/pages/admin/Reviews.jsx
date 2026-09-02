import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Search, Send, EyeOff, Eye, Star } from "lucide-react";
import { bookService } from "../../services/bookService";
import toast from "react-hot-toast";
import AdminLayout from "./AdminLayout";

function formatDateTime(date) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function Stars({ rating }) {
  return (
    <span
      style={{
        display: "inline-flex",
        gap: 1,
        color: "var(--a-gold, #b8934a)",
      }}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={12}
          fill={i < rating ? "currentColor" : "none"}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

/*  Review detail drawer  */
function ReviewDrawer({ review, onClose }) {
  const qc = useQueryClient();
  const [replyText, setReplyText] = useState("");

  const { data: detail, isLoading } = useQuery({
    queryKey: ["admin-review", review?.id],
    queryFn: () =>
      bookService.getAdminReviewById(review.id).then((r) => r.data.data),
    enabled: !!review,
  });

  const replyMutation = useMutation({
    mutationFn: () => bookService.replyToReview(review.id, replyText.trim()),
    onSuccess: () => {
      toast.success("Đã gửi phản hồi");
      setReplyText("");
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      qc.invalidateQueries({ queryKey: ["admin-review", review.id] });
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Gửi phản hồi thất bại"),
  });

  const visibilityMutation = useMutation({
    mutationFn: () => bookService.toggleReviewVisibility(review.id),
    onSuccess: (res) => {
      toast.success(
        res.data?.data?.isVisible ? "Đã hiện lại đánh giá" : "Đã ẩn đánh giá",
      );
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      qc.invalidateQueries({ queryKey: ["admin-review", review.id] });
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Thao tác thất bại"),
  });

  if (!review) return null;
  const r = detail || review;

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
              Đánh giá sách
            </div>
            <div
              style={{ fontSize: 14, color: "var(--a-ink)", fontWeight: 600 }}
            >
              {r.book?.title}
            </div>
          </div>
          <button className="a-modal-close" onClick={onClose} aria-label="Đóng">
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 24, flex: 1 }}>
          {/* Trạng thái hiển thị */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 20,
              flexWrap: "wrap",
            }}
          >
            <span className={`a-badge ${r.isVisible ? "success" : "neutral"}`}>
              {r.isVisible ? "Đang hiển thị" : "Đã ẩn"}
            </span>
            <span className={`a-badge ${r.repliedAt ? "info" : "warning"}`}>
              {r.repliedAt ? "Đã phản hồi" : "Chưa phản hồi"}
            </span>
          </div>

          {/* Người đánh giá */}
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
              Người đánh giá
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 8,
              }}
            >
              <div className="a-user-avatar">
                {r.user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>
                  {r.user?.name}
                </div>
                <div style={{ fontSize: 11, color: "rgba(13,51,48,0.45)" }}>
                  {r.user?.email}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "rgba(13,51,48,0.5)" }}>
              {formatDateTime(r.createdAt)}
            </div>
          </div>

          {/* Nội dung đánh giá */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(13,51,48,0.38)",
                marginBottom: 8,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Nội dung <Stars rating={r.rating} />
            </div>
            {r.title && (
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--a-ink)",
                  marginBottom: 6,
                }}
              >
                {r.title}
              </div>
            )}
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.7,
                color: "var(--a-ink)",
                whiteSpace: "pre-wrap",
              }}
            >
              {r.content}
            </div>
          </div>

          {/* Phản hồi hiện tại */}
          {r.reply && (
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
                  Phản hồi từ {r.repliedBy?.name || "shop"}
                </span>
                <span style={{ fontSize: 11, color: "rgba(13,51,48,0.4)" }}>
                  {r.repliedAt && formatDateTime(r.repliedAt)}
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
                {r.reply}
              </div>
            </div>
          )}

          {/* Form phản hồi */}
          <form onSubmit={handleReplySubmit} style={{ marginBottom: 20 }}>
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
              {r.reply ? "Sửa phản hồi" : "Phản hồi công khai"}
            </div>
            <textarea
              className="a-textarea"
              rows={4}
              placeholder="Nhập nội dung phản hồi... (hiển thị công khai dưới đánh giá)"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              style={{ width: "100%", marginBottom: 10, resize: "vertical" }}
            />
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
              {replyMutation.isPending
                ? "Đang gửi..."
                : r.reply
                  ? "Cập nhật phản hồi"
                  : "Gửi phản hồi"}
            </button>
          </form>

          {/* Ẩn / hiện đánh giá */}
          <div
            style={{
              paddingTop: 16,
              borderTop: "1px solid rgba(13,51,48,0.08)",
            }}
          >
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
              disabled={visibilityMutation.isPending}
              onClick={() => visibilityMutation.mutate()}
            >
              {r.isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
              {r.isVisible ? "Ẩn đánh giá này" : "Hiện lại đánh giá này"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Reviews() {
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState("");
  const [hasReply, setHasReply] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reviews", page, rating, hasReply, search],
    queryFn: () =>
      bookService
        .getAdminReviews({
          page,
          limit: 15,
          rating: rating || undefined,
          hasReply: hasReply || undefined,
          search: search || undefined,
        })
        .then((r) => r.data.data),
    keepPreviousData: true,
  });

  const reviews = data?.reviews ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;
  const ratingCounts = data?.ratingCounts ?? {};

  return (
    <AdminLayout>
      {/* Header */}
      <div className="a-page-header">
        <div>
          <p className="a-page-eyebrow">Quản lý</p>
          <h1 className="a-page-title">
            Đánh Giá <em>Sách</em>
          </h1>
        </div>
        <div style={{ fontSize: 12, color: "rgba(13,51,48,0.4)" }}>
          Tổng <strong style={{ color: "var(--a-ink)" }}>{total}</strong> đánh
          giá
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
          placeholder="Tìm theo sách, người đánh giá, nội dung..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Rating filter pills */}
      <div className="a-pills">
        <button
          className={`a-pill${!rating ? " active" : ""}`}
          onClick={() => {
            setRating("");
            setPage(1);
          }}
        >
          Tất cả sao ({total})
        </button>
        {[5, 4, 3, 2, 1].map((s) => (
          <button
            key={s}
            className={`a-pill${rating === String(s) ? " active" : ""}`}
            onClick={() => {
              setRating(String(s));
              setPage(1);
            }}
          >
            {s}★ ({ratingCounts[s] ?? 0})
          </button>
        ))}
      </div>

      {/* Reply filter pills */}
      <div className="a-pills">
        <button
          className={`a-pill${!hasReply ? " active" : ""}`}
          onClick={() => {
            setHasReply("");
            setPage(1);
          }}
        >
          Tất cả
        </button>
        <button
          className={`a-pill${hasReply === "false" ? " active" : ""}`}
          onClick={() => {
            setHasReply("false");
            setPage(1);
          }}
        >
          Chưa phản hồi
        </button>
        <button
          className={`a-pill${hasReply === "true" ? " active" : ""}`}
          onClick={() => {
            setHasReply("true");
            setPage(1);
          }}
        >
          Đã phản hồi
        </button>
      </div>

      {/* Table */}
      <div className="a-table-card">
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                {[
                  "Sách",
                  "Người đánh giá",
                  "Sao",
                  "Nội dung",
                  "Phản hồi",
                  "Hiển thị",
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
              ) : !reviews.length ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: 48,
                      textAlign: "center",
                      color: "rgba(13,51,48,0.3)",
                    }}
                  >
                    Không có đánh giá nào
                  </td>
                </tr>
              ) : (
                reviews.map((r) => (
                  <tr
                    key={r.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelected(r)}
                  >
                    <td>
                      <div
                        style={{ fontWeight: 500, fontSize: 12, maxWidth: 180 }}
                      >
                        {r.book?.title}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 12 }}>
                        {r.user?.name}
                      </div>
                      <div className="a-td-muted">{r.user?.email}</div>
                    </td>
                    <td>
                      <Stars rating={r.rating} />
                    </td>
                    <td>
                      <div
                        style={{
                          fontSize: 12,
                          maxWidth: 240,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.content}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`a-badge ${r.repliedAt ? "info" : "warning"}`}
                      >
                        {r.repliedAt ? "Đã phản hồi" : "Chưa phản hồi"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`a-badge ${r.isVisible ? "success" : "neutral"}`}
                      >
                        {r.isVisible ? "Hiện" : "Ẩn"}
                      </span>
                    </td>
                    <td className="a-td-muted">
                      {formatDateTime(r.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="a-pagination">
          <span className="a-pagination-info">Tổng {total} đánh giá</span>
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
      <ReviewDrawer review={selected} onClose={() => setSelected(null)} />
    </AdminLayout>
  );
}
