import { useState, useCallback, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, X, Check } from "lucide-react";
import api from "../../services/api";
import {
  formatPrice,
  formatDateShort,
  getOrderCode,
} from "../../utils/helpers";
import toast from "react-hot-toast";
import AdminLayout from "./AdminLayout";
import { TierBadge } from "./user/UserBadges";

/*  Constants  */
export const ORDER_STATUS = {
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Vận chuyển",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Hủy đơn",
  REFUNDED: "Hoàn tiền",
};

export const PAYMENT_STATUS = {
  PENDING: "Chưa TT",
  PAID: "Đã TT",
  FAILED: "Thất bại",
  REFUNDED: "Hoàn tiền",
  EXPIRED: "Hết hạn TT",
};
export const PAYMENT_METHOD_LABEL = {
  COD: "COD",
  VNPAY: "VNPay",
  MOMO: "MoMo",
  BANKQR: "Chuyển khoản QR",
  STRIPE: "Stripe",
};
const ORDER_BADGE = {
  PENDING: "warning",
  CONFIRMED: "info",
  SHIPPING: "info",
  DELIVERED: "success",
  COMPLETED: "success",
  CANCELLED: "danger",
  REFUNDED: "danger",
};

const PAY_BADGE = {
  PENDING: "neutral",
  PAID: "success",
  FAILED: "danger",
  REFUNDED: "warning",
  EXPIRED: "danger",
};

/* ─ Luồng trạng thái theo bước — sách giấy có vận chuyển, sách điện tử thì không ─
   Đơn sách giấy:    Chờ xử lý → Đã xác nhận → Vận chuyển → Đã giao → Hoàn thành
   Đơn sách điện tử: Chờ xử lý → Đã xác nhận → Hoàn thành (bỏ qua bước giao hàng) */
const PHYSICAL_STEPS = [
  "PENDING",
  "CONFIRMED",
  "SHIPPING",
  "DELIVERED",
  "COMPLETED",
];
const DIGITAL_STEPS = ["PENDING", "CONFIRMED", "COMPLETED"];
// Trạng thái "nhánh phụ" — không nằm trong luồng bước chính, xử lý riêng qua nút hủy/hoàn tiền
const TERMINAL_STATUSES = ["CANCELLED", "REFUNDED"];
/* ─ OrderStepper — cập nhật trạng thái theo từng bước, luồng khác nhau giữa sách giấy/điện tử ─
   Chỉ cho phép lùi 1 bước hoặc tiến 1 bước (không nhảy cóc). Hủy/hoàn tiền là nhánh riêng. */
function OrderStepper({ order, onUpdate, isUpdating }) {
  const steps = order.isDigital ? DIGITAL_STEPS : PHYSICAL_STEPS;
  const isTerminal = TERMINAL_STATUSES.includes(order.status);
  const currentIndex = steps.indexOf(order.status);

  if (isTerminal) {
    return (
      <div
        style={{
          background: "var(--a-surface)",
          borderRadius: 8,
          padding: "13px 16px",
        }}
      >
        <span className={`a-badge ${ORDER_BADGE[order.status] ?? "neutral"}`}>
          {ORDER_STATUS[order.status]}
        </span>
        <div
          style={{
            fontSize: 11.5,
            color: "rgba(13,51,48,0.5)",
            marginTop: 8,
            lineHeight: 1.5,
          }}
        >
          Đơn đã {order.status === "CANCELLED" ? "bị hủy" : "được hoàn tiền"} —
          quy trình xử lý đã kết thúc.
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Track các bước */}
      <div style={{ display: "flex", alignItems: "center" }}>
        {steps.map((key, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          const clickable =
            !isUpdating && (i === currentIndex - 1 || i === currentIndex + 1);
          return (
            <Fragment key={key}>
              <button
                onClick={() => clickable && onUpdate(key)}
                disabled={!clickable}
                title={
                  clickable
                    ? `Chuyển sang: ${ORDER_STATUS[key]}`
                    : ORDER_STATUS[key]
                }
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  border: "none",
                  cursor: clickable ? "pointer" : "default",
                  background: done
                    ? "var(--a-green)"
                    : active
                      ? "var(--a-green)"
                      : "rgba(13,51,48,0.08)",
                  color: done || active ? "#fff" : "rgba(13,51,48,0.4)",
                  boxShadow: active ? "0 0 0 3px rgba(74,158,63,0.2)" : "none",
                  transition: "background 0.15s",
                }}
              >
                {done ? <Check size={13} /> : i + 1}
              </button>
              {i < steps.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    margin: "0 2px",
                    background:
                      i < currentIndex
                        ? "var(--a-green)"
                        : "rgba(13,51,48,0.1)",
                  }}
                />
              )}
            </Fragment>
          );
        })}
      </div>
      {/* Nhãn từng bước */}
      <div style={{ display: "flex", marginTop: 6 }}>
        {steps.map((key, i) => (
          <div
            key={key}
            style={{
              flex: i === steps.length - 1 ? "0 0 26px" : 1,
              fontSize: 9.5,
              textAlign:
                i === 0 ? "left" : i === steps.length - 1 ? "right" : "center",
              color: i <= currentIndex ? "var(--a-ink)" : "rgba(13,51,48,0.35)",
              fontWeight: i === currentIndex ? 600 : 400,
            }}
          >
            {ORDER_STATUS[key]}
          </div>
        ))}
      </div>

      {/* Nhánh phụ — hủy đơn / hoàn tiền, tách riêng khỏi luồng bước chính */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 18,
          paddingTop: 14,
          borderTop: "1px dashed rgba(13,51,48,0.1)",
        }}
      >
        <button
          className="a-btn-icon lock"
          disabled={isUpdating}
          onClick={() => onUpdate("CANCELLED")}
          style={{ fontSize: 11.5, padding: "6px 12px" }}
        >
          Hủy đơn
        </button>
        <button
          disabled={isUpdating}
          onClick={() => onUpdate("REFUNDED")}
          style={{
            fontSize: 11.5,
            padding: "6px 12px",
            borderRadius: 8,
            border: "1px solid rgba(13,51,48,0.12)",
            background: "none",
            color: "rgba(13,51,48,0.55)",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Đánh dấu hoàn tiền
        </button>
      </div>
    </div>
  );
}
/*  Order detail drawer — tự fetch chi tiết theo id (kèm Hạng khách), cập nhật trạng thái theo bước  */
function OrderDrawer({ orderId, onClose, onUpdateStatus, isUpdating }) {
  const { data: order, isLoading } = useQuery({
    queryKey: ["admin-order-detail", orderId],
    queryFn: () => api.get(`/admin/orders/${orderId}`).then((r) => r.data.data),
    enabled: !!orderId,
  });

  if (!orderId) return null;

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
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: 400,
          background: "#fff",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* Drawer header */}
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
              Chi tiết đơn hàng
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 13,
                color: "var(--a-ink)",
                fontWeight: 600,
              }}
            >
              {order ? getOrderCode(order) : "..."}
            </div>
          </div>
          <button className="a-modal-close" onClick={onClose} aria-label="Đóng">
            <X size={16} />
          </button>
        </div>

        {isLoading || !order ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: "rgba(13,51,48,0.3)",
              fontSize: 13,
            }}
          >
            Đang tải...
          </div>
        ) : (
          <div style={{ padding: 24, flex: 1 }}>
            {/* Customer — kèm Hạng thành viên hiện tại */}
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
                Khách hàng
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {order.user?.avatar ? (
                  <img
                    src={order.user.avatar}
                    alt={order.user.name}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      objectFit: "cover",
                      flexShrink: 0,
                      border: "1px solid rgba(13,51,48,0.08)",
                    }}
                  />
                ) : (
                  <div className="a-user-avatar">
                    {order.user?.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>
                    {order.user?.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(13,51,48,0.45)",
                      marginBottom: 4,
                    }}
                  >
                    {order.user?.email}
                  </div>
                  {order.user?.tier && (
                    <TierBadge tier={order.user.tier} size="sm" />
                  )}
                </div>
              </div>
            </div>

            {/* Status row */}
            <div
              style={{
                display: "flex",
                gap: 10,
                marginBottom: 20,
                flexWrap: "wrap",
              }}
            >
              <span
                className={`a-badge ${PAY_BADGE[order.paymentStatus] ?? "neutral"}`}
              >
                {PAYMENT_STATUS[order.paymentStatus]}
              </span>
              <span className="a-badge neutral">
                {PAYMENT_METHOD_LABEL[order.paymentMethod] ??
                  order.paymentMethod}
              </span>
              <span
                className={`a-badge ${order.isDigital ? "info" : "neutral"}`}
              >
                {order.isDigital
                  ? "Sách điện tử — không giao hàng"
                  : "Sách giấy — có giao hàng"}
              </span>
            </div>
            {order.paymentMismatch && (
              <div
                style={{
                  marginBottom: 20,
                  background: "#fdf2f0",
                  border: "0.5px solid #e8b4ab",
                  borderRadius: 8,
                  padding: "13px 16px",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#c0392b",
                    marginBottom: 4,
                  }}
                >
                  ⚠ Sai số tiền — cần đối soát thủ công
                </div>
                <div style={{ fontSize: 12, color: "rgba(13,51,48,0.6)" }}>
                  Khách đã chuyển{" "}
                  <strong>
                    {formatPrice(order.paymentMismatch.transferredAmount)}
                  </strong>
                  , đơn cần{" "}
                  <strong>
                    {formatPrice(order.paymentMismatch.expectedAmount)}
                  </strong>
                  . Kiểm tra thực tế rồi đổi trạng thái đơn để xác nhận thanh
                  toán, hoặc liên hệ khách để xử lý.
                </div>
              </div>
            )}

            {/* Cập nhật trạng thái — theo từng bước, luồng riêng cho sách giấy/điện tử */}
            <div
              style={{
                marginBottom: 20,
                background: "var(--a-surface)",
                borderRadius: 8,
                padding: "16px",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "rgba(13,51,48,0.38)",
                  marginBottom: 14,
                  fontWeight: 500,
                }}
              >
                Cập nhật trạng thái đơn
              </div>
              <OrderStepper
                order={order}
                onUpdate={onUpdateStatus}
                isUpdating={isUpdating}
              />
            </div>

            {/* Shipping address — chỉ đơn sách giấy mới có */}
            {order.shippingAddress && (
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
                    marginBottom: 7,
                    fontWeight: 500,
                  }}
                >
                  Địa chỉ giao hàng
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--a-ink)",
                    lineHeight: 1.6,
                  }}
                >
                  {order.shippingAddress.name}
                  <br />
                  {order.shippingAddress.phone}
                  <br />
                  {order.shippingAddress.address}
                </div>
              </div>
            )}

            {/* Items */}
            <div>
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
                Sản phẩm ({order.items?.length ?? 0})
              </div>
              {order.items?.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "1px solid rgba(13,51,48,0.05)",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 9 }}
                  >
                    <div
                      className="a-book-thumb"
                      style={{ width: 28, height: 38 }}
                    >
                      <span style={{ fontSize: 8 }}>📚</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>
                        {item.product?.title ?? item.title}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "rgba(13,51,48,0.4)" }}
                      >
                        × {item.quantity}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{ fontFamily: "var(--a-font-serif)", fontSize: 13 }}
                  >
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 16,
                paddingTop: 12,
                borderTop: "1px solid rgba(13,51,48,0.08)",
              }}
            >
              <span style={{ fontWeight: 500, fontSize: 13 }}>Tổng cộng</span>
              <span
                style={{
                  fontFamily: "var(--a-font-serif)",
                  fontSize: 18,
                  color: "var(--a-ink)",
                  fontWeight: 400,
                }}
              >
                {formatPrice(order.total)}
              </span>
            </div>

            {/* Coupon */}
            {order.couponCode && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: "rgba(13,51,48,0.5)",
                }}
              >
                Mã giảm giá:{" "}
                <span className="a-code-badge">{order.couponCode}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Mã đơn luôn có dạng ODE-mmddyy + 3 ký tự chữ/số (khớp getOrderCode ở backend)
const ORDER_CODE_REGEX = /^ODE-\d{6}[A-Za-z0-9]{3}$/;

const filterInputStyle = {
  height: 36,
  padding: "0 12px",
  borderRadius: 8,
  border: "1px solid rgba(13,51,48,0.14)",
  fontSize: 12.5,
  fontFamily: "inherit",
  color: "var(--a-ink)",
  outline: "none",
  background: "#fff",
  boxSizing: "border-box",
};

function FilterField({ label, children, style }) {
  return (
    <div style={style}>
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "rgba(13,51,48,0.4)",
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

export default function Orders() {
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [searchError, setSearchError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [totalMin, setTotalMin] = useState("");
  const [totalMax, setTotalMax] = useState("");

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchInput.trim();

    // Chỉ khi có vẻ đang gõ mã đơn (bắt đầu bằng "ODE") mới bắt buộc đúng định dạng.
    // Còn lại (tên/email khách) không cần validate gì cả.
    const looksLikeOrderCode = /^ode/i.test(trimmed);

    if (looksLikeOrderCode && !ORDER_CODE_REGEX.test(trimmed.toUpperCase())) {
      setSearchError(
        "Mã đơn không hợp lệ — đúng định dạng: ODE-XXXXXXYYY (6 số + 3 ký tự)",
      );
      return;
    }

    setSearchError("");
    setSearch(trimmed);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setSearchError("");
    setPage(1);
  };

  /*  Data  */
  const { data, isLoading } = useQuery({
    queryKey: [
      "admin-orders",
      page,
      status,
      search,
      paymentMethod,
      paymentStatus,
      dateFrom,
      dateTo,
      totalMin,
      totalMax,
    ],
    queryFn: () =>
      api
        .get("/admin/orders", {
          params: {
            page,
            limit: 15,
            status,
            search,
            paymentMethod,
            paymentStatus,
            dateFrom,
            dateTo,
            totalMin,
            totalMax,
          },
        })
        .then((r) => r.data.data),
    keepPreviousData: true,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/admin/orders/${id}`, { status }),
    onSuccess: () => {
      toast.success("Cập nhật trạng thái thành công!");
      qc.invalidateQueries(["admin-orders"]);
    },
    onError: () => toast.error("Cập nhật thất bại!"),
  });

  const orders = data?.orders ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;
  const statusCounts = data?.statusCounts ?? {};
  const totalAllStatuses = Object.values(statusCounts).reduce(
    (s, n) => s + n,
    0,
  );

  return (
    <AdminLayout>
      {/*  Header  */}
      <div className="a-page-header">
        <div>
          <p className="a-page-eyebrow">Quản lý</p>
          <h1 className="a-page-title">
            Đơn <em>Hàng</em>
          </h1>
        </div>
        <div style={{ fontSize: 12, color: "rgba(13,51,48,0.4)" }}>
          Tổng <strong style={{ color: "var(--a-ink)" }}>{total}</strong> đơn
        </div>
      </div>

      {/*  Bộ lọc  */}
      <form
        onSubmit={handleSearchSubmit}
        style={{
          marginBottom: 18,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1fr 1fr",
            gap: 14,
            marginBottom: 14,
          }}
        >
          {/* Ô search — mã đơn / tên / email */}
          <FilterField label="Tìm kiếm">
            <div style={{ position: "relative" }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 11,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "rgba(13,51,48,0.35)",
                }}
              />
              <input
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  if (searchError) setSearchError("");
                }}
                placeholder="Mã đơn (ODE-...), tên hoặc email"
                style={{
                  ...filterInputStyle,
                  width: "100%",
                  padding: "9px 32px 9px 32px",
                  borderColor: searchError ? "#e34948" : "rgba(13,51,48,0.14)",
                }}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    color: "rgba(13,51,48,0.4)",
                    display: "flex",
                  }}
                  aria-label="Xóa tìm kiếm"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {searchError && (
              <div style={{ color: "#e34948", fontSize: 11, marginTop: 5 }}>
                {searchError}
              </div>
            )}
          </FilterField>

          {/* Phương thức thanh toán */}
          <FilterField label="Phương thức TT">
            <select
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                setPage(1);
              }}
              style={{ ...filterInputStyle, width: "100%" }}
            >
              <option value="">Tất cả</option>
              {Object.entries(PAYMENT_METHOD_LABEL).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </FilterField>

          {/* Trạng thái thanh toán */}
          <FilterField label="Trạng thái TT">
            <select
              value={paymentStatus}
              onChange={(e) => {
                setPaymentStatus(e.target.value);
                setPage(1);
              }}
              style={{ ...filterInputStyle, width: "100%" }}
            >
              <option value="">Tất cả</option>
              {Object.entries(PAYMENT_STATUS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </FilterField>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1fr",
            gap: 14,
            alignItems: "end",
          }}
        >
          {/* Khoảng ngày đặt */}
          <FilterField label="Ngày đặt">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                style={{ ...filterInputStyle, flex: 1 }}
              />
              <span style={{ fontSize: 12, color: "rgba(13,51,48,0.35)" }}>
                →
              </span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                style={{ ...filterInputStyle, flex: 1 }}
              />
            </div>
          </FilterField>

          {/* Khoảng tổng tiền + nút xóa lọc */}
          <div style={{ display: "flex", gap: 10, alignItems: "end" }}>
            <FilterField label="Tổng tiền (đ)" style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="number"
                  min="0"
                  value={totalMin}
                  onChange={(e) => {
                    setTotalMin(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Từ"
                  style={{ ...filterInputStyle, flex: 1, width: 0 }}
                />
                <span style={{ fontSize: 12, color: "rgba(13,51,48,0.35)" }}>
                  →
                </span>
                <input
                  type="number"
                  min="0"
                  value={totalMax}
                  onChange={(e) => {
                    setTotalMax(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Đến"
                  style={{ ...filterInputStyle, flex: 1, width: 0 }}
                />
              </div>
            </FilterField>

            {(paymentMethod ||
              paymentStatus ||
              dateFrom ||
              dateTo ||
              totalMin ||
              totalMax ||
              search) && (
              <button
                type="button"
                onClick={() => {
                  handleClearSearch();
                  setPaymentMethod("");
                  setPaymentStatus("");
                  setDateFrom("");
                  setDateTo("");
                  setTotalMin("");
                  setTotalMax("");
                }}
                style={{
                  height: 36,
                  padding: "0 14px",
                  borderRadius: 8,
                  border: "1px solid rgba(13,51,48,0.14)",
                  background: "var(--a-surface)",
                  color: "rgba(13,51,48,0.6)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "inherit",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                Xóa lọc
              </button>
            )}
          </div>
        </div>
      </form>

      {/*  Status filter pills  */}
      <div className="a-pills">
        <button
          className={`a-pill${!status ? " active" : ""}`}
          onClick={() => {
            setStatus("");
            setPage(1);
          }}
        >
          Tất cả ({totalAllStatuses})
        </button>
        {Object.entries(ORDER_STATUS).map(([key, label]) => (
          <button
            key={key}
            className={`a-pill${status === key ? " active" : ""}`}
            onClick={() => {
              setStatus(key);
              setPage(1);
            }}
          >
            {label} ({statusCounts[key] ?? 0})
          </button>
        ))}
      </div>

      {/*  Table  */}
      <div className="a-table-card">
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                {[
                  "Mã đơn",
                  "Khách hàng",
                  "Tổng tiền",
                  "Thanh toán",
                  "Trạng thái",
                  "Ngày đặt",
                  "Cập nhật",
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
              ) : !orders.length ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: 48,
                      textAlign: "center",
                      color: "rgba(13,51,48,0.3)",
                    }}
                  >
                    Không có đơn hàng nào
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelected(order)}
                  >
                    <td className="a-td-mono">{getOrderCode(order)}</td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 12 }}>
                        {order.user?.name}
                      </div>
                      <div className="a-td-muted">{order.user?.email}</div>
                    </td>
                    <td className="a-td-serif">{formatPrice(order.total)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <span
                        className={`a-badge ${PAY_BADGE[order.paymentStatus] ?? "neutral"}`}
                      >
                        {PAYMENT_STATUS[order.paymentStatus]}
                      </span>
                      <div className="a-td-muted" style={{ marginTop: 4 }}>
                        {PAYMENT_METHOD_LABEL[order.paymentMethod] ??
                          order.paymentMethod}
                      </div>
                      {order.paymentMismatch && (
                        <span
                          className="a-badge warning"
                          style={{ marginTop: 4, display: "inline-block" }}
                          title={`Khách đã chuyển ${formatPrice(order.paymentMismatch.transferredAmount)}, cần ${formatPrice(order.paymentMismatch.expectedAmount)}`}
                        >
                          ⚠ Sai số tiền — cần đối soát
                        </span>
                      )}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <span
                        className={`a-badge ${ORDER_BADGE[order.status] ?? "neutral"}`}
                      >
                        {ORDER_STATUS[order.status]}
                      </span>
                    </td>
                    <td className="a-td-muted">
                      {formatDateShort(order.createdAt)}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <select
                        className="a-inline-select"
                        value={order.status}
                        onChange={(e) =>
                          updateMutation.mutate({
                            id: order.id,
                            status: e.target.value,
                          })
                        }
                      >
                        {Object.entries(ORDER_STATUS)
                          // Đơn sách điện tử không có bước vận chuyển — thanh toán xong tự chuyển COMPLETED.
                          .filter(
                            ([key]) =>
                              !(
                                order.isDigital &&
                                ["SHIPPING", "DELIVERED"].includes(key)
                              ),
                          )
                          .map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="a-pagination">
          <span className="a-pagination-info">Tổng {total} đơn hàng</span>
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

      {/*  Order detail drawer  */}
      <OrderDrawer
        orderId={selected?.id}
        onClose={() => setSelected(null)}
        onUpdateStatus={(newStatus) =>
          updateMutation.mutate(
            { id: selected.id, status: newStatus },
            { onSuccess: () => setSelected(null) },
          )
        }
        isUpdating={updateMutation.isPending}
      />
    </AdminLayout>
  );
}
