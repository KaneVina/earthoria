import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Trash2,
  ShoppingCart,
  Minus,
  Plus,
  ArrowLeft,
} from "lucide-react";
import { useCartStore } from "../store/cartStore";
import { formatPrice } from "../utils/helpers";
import { orderService } from "../services/orderService";
import toast from "react-hot-toast";
import { SkeletonCartItem, SkeletonCartSummary } from "../components/skeletons/SkeletonCart";

const SHIPPING_THRESHOLD = 300000;
const SHIPPING_FEE = 30000;
const VALID_COUPON = { code: "EARTH15", pct: 0.15 };

export default function Cart() {
  const { cart, fetchCart, updateItem, removeItem, clearCart, loading } = useCartStore();
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const items = cart?.items || [];

  const subtotal = items.reduce((sum, item) => {
    return sum + (item.book.salePrice || item.book.price) * item.quantity;
  }, 0);

  const couponDiscount = couponApplied
    ? Math.round(subtotal * VALID_COUPON.pct)
    : 0;
  const afterCoupon = subtotal - couponDiscount;
  const shippingFee = afterCoupon >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = afterCoupon + shippingFee;
  const shippingPct = Math.min((afterCoupon / SHIPPING_THRESHOLD) * 100, 100);

  const handleApplyCoupon = () => {
    if (coupon.trim().toUpperCase() === VALID_COUPON.code) {
      setCouponApplied(true);
      toast.success("Mã giảm giá đã được áp dụng!");
    } else {
      toast.error("Mã giảm giá không hợp lệ");
    }
  };

  const handleCheckout = async () => {
    toast("Tính năng thanh toán sẽ sớm ra mắt!", { icon: "🚀" });
  };

  if (loading && !cart) {
    return (
      <div style={{ minHeight: "100vh", paddingTop: "80px", background: "var(--ivory)" }}>
        <div className="breadcrumb">
          <span className="breadcrumb-item">Trang chủ</span>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-item">Cửa hàng</span>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-current">Giỏ hàng</span>
        </div>

        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "40px 100px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
            <div className="eyebrow-line" />
            <span className="eyebrow-text">Bước 1 / 3</span>
          </div>
          {/* Title skeleton */}
          <span className="skeleton" style={{ display: "block", width: 220, height: 60, marginBottom: 8 }} />
        </div>

        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "48px 100px 120px",
            display: "grid",
            gridTemplateColumns: "1fr 400px",
            gap: "60px",
            alignItems: "start",
          }}
        >
          {/* LEFT — skeleton items */}
          <div>
            {/* Promo banner skeleton */}
            <span className="skeleton" style={{ display: "block", height: 56, marginBottom: 32 }} />

            {/* Header row skeleton */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 140px 44px", gap: 20, paddingBottom: 14, borderBottom: "0.5px solid var(--border)", marginBottom: 8 }}>
              {["40%", "60px", "80px", "32px"].map((w, i) => (
                <span key={i} className="skeleton" style={{ height: 10, width: w }} />
              ))}
            </div>

            {/* 3 skeleton cart items */}
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCartItem key={i} />
            ))}
          </div>

          {/* RIGHT — skeleton summary */}
          <SkeletonCartSummary />
        </div>
      </div>
    );
  }

  // Giỏ trống
  if (!cart || items.length === 0) {
    return (
      <div style={{ minHeight: "100vh", paddingTop: "80px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "80px 100px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px 40px",
              textAlign: "center",
              border: "0.5px dashed var(--border)",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                border: "0.5px solid var(--border-gold)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--gold)",
                marginBottom: "28px",
              }}
            >
              <ShoppingCart size={32} strokeWidth={1} />
            </div>
            <h2
              style={{
                fontFamily: "Playfair Display,serif",
                fontSize: "28px",
                fontWeight: 300,
                color: "var(--forest)",
                marginBottom: "10px",
              }}
            >
              Giỏ hàng{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>trống</em>
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "32px" }}>
              Bạn chưa có sản phẩm nào trong giỏ.
            </p>
            <Link to="/shop">
              <button className="btn-primary" style={{ padding: "14px 32px" }}>
                Khám phá cửa hàng →
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", paddingTop: "80px", background: "var(--ivory)" }}>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/" className="breadcrumb-item">Trang chủ</Link>
        <span className="breadcrumb-sep">›</span>
        <Link to="/shop" className="breadcrumb-item">Cửa hàng</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">Giỏ hàng</span>
      </div>

      {/* Page header */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "40px 100px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
          <div className="eyebrow-line" />
          <span className="eyebrow-text">Bước 1 / 3</span>
        </div>
        <h1
          style={{
            fontFamily: "Playfair Display,serif",
            fontSize: "clamp(40px,5vw,72px)",
            fontWeight: 300,
            color: "var(--forest)",
          }}
        >
          Giỏ{" "}
          <em style={{ fontStyle: "italic", color: "var(--gold)" }}>Hàng</em>
        </h1>
      </div>

      {/* Main layout */}
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "48px 100px 120px",
          display: "grid",
          gridTemplateColumns: "1fr 400px",
          gap: "60px",
          alignItems: "start",
        }}
      >
        {/* LEFT */}
        <div>
          {/* Promo banner */}
          <div
            style={{
              background: "var(--forest)",
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              marginBottom: "32px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", flex: 1 }}>
              <strong style={{ color: "var(--ivory)" }}>Mã ưu đãi tháng 6:</strong>{" "}
              Nhập <strong style={{ color: "var(--ivory)" }}>EARTH15</strong> để giảm 15%
            </span>
            <div style={{ display: "flex" }}>
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="NHẬP MÃ"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "0.5px solid rgba(255,255,255,0.15)",
                  borderRight: "none",
                  padding: "8px 14px",
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.8)",
                  outline: "none",
                  width: "140px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
                onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
              />
              <button
                onClick={handleApplyCoupon}
                style={{
                  background: "var(--gold)",
                  border: "none",
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontSize: "10px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--ink)",
                }}
              >
                Áp dụng
              </button>
            </div>
          </div>

          {/* Coupon applied */}
          {couponApplied && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                background: "var(--gold-pale)",
                border: "0.5px solid var(--border-gold)",
                marginBottom: "16px",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span style={{ fontFamily: "Playfair Display,serif", fontSize: "15px", color: "var(--forest)" }}>
                EARTH15
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", flex: 1 }}>
                Giảm 15% — đã áp dụng
              </span>
              <button
                onClick={() => { setCouponApplied(null); setCoupon(""); }}
                style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)" }}
              >
                ×
              </button>
            </div>
          )}

          {/* Header row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 100px 140px 44px",
              gap: "20px",
              padding: "0 0 14px",
              borderBottom: "0.5px solid var(--border)",
              marginBottom: "8px",
            }}
          >
            {["Sản phẩm", "Số lượng", "Thành tiền", ""].map((col, i) => (
              <span
                key={i}
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  textAlign: i > 1 ? "right" : i === 1 ? "center" : "left",
                }}
              >
                {col}
              </span>
            ))}
          </div>

          {/* ✅ Cart items — skeleton khi đang refetch, items thật khi xong */}
          {loading
            ? Array.from({ length: items.length || 3 }).map((_, i) => (
                <SkeletonCartItem key={i} />
              ))
            : items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 100px 140px 44px",
                    gap: "20px",
                    alignItems: "center",
                    padding: "28px 0",
                    borderBottom: "0.5px solid var(--border)",
                  }}
                >
                  {/* Product info */}
                  <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <div
                      style={{
                        width: "88px",
                        height: "112px",
                        overflow: "hidden",
                        border: "0.5px solid var(--border)",
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={item.book.coverImage || "https://via.placeholder.com/88x112"}
                        alt={item.book.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "9px",
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                          color: "var(--gold)",
                          marginBottom: "6px",
                        }}
                      >
                        Sách AR
                      </div>
                      <div
                        style={{
                          fontFamily: "Playfair Display,serif",
                          fontSize: "18px",
                          color: "var(--forest)",
                          marginBottom: "12px",
                        }}
                      >
                        {item.book.title}
                      </div>
                      <div style={{ display: "flex", gap: "16px" }}>
                        <button
                          onClick={() => removeItem(item.id)}
                          style={{
                            fontSize: "11px",
                            color: "var(--text-muted)",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Trash2 size={11} /> Xoá
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Qty */}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", border: "0.5px solid var(--border)" }}>
                      <button
                        onClick={() =>
                          item.quantity > 1
                            ? updateItem(item.id, item.quantity - 1)
                            : removeItem(item.id)
                        }
                        style={{
                          width: "32px", height: "36px",
                          background: "transparent", border: "none", cursor: "pointer",
                          color: "var(--text-muted)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <Minus size={12} />
                      </button>
                      <span
                        style={{
                          width: "36px", textAlign: "center",
                          fontFamily: "Playfair Display,serif",
                          fontSize: "16px", color: "var(--forest)",
                        }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        style={{
                          width: "32px", height: "36px",
                          background: "transparent", border: "none", cursor: "pointer",
                          color: "var(--text-muted)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "Playfair Display,serif", fontSize: "20px", color: "var(--forest)" }}>
                      {formatPrice((item.book.salePrice || item.book.price) * item.quantity)}
                    </div>
                    {item.book.salePrice && (
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", textDecoration: "line-through", marginTop: "2px" }}>
                        {formatPrice(item.book.price * item.quantity)}
                      </div>
                    )}
                  </div>

                  {/* Delete */}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => removeItem(item.id)}
                      style={{
                        width: "32px", height: "32px",
                        border: "0.5px solid var(--border)",
                        background: "transparent", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "var(--text-muted)",
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
          }
        </div>

        {/* RIGHT — Order summary */}
        <div
          style={{
            position: "sticky",
            top: "100px",
            background: "var(--white)",
            border: "0.5px solid var(--border)",
          }}
        >
          {/* Shipping progress */}
          <div style={{ background: "var(--forest)", padding: "24px 28px" }}>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", marginBottom: "12px", fontWeight: 300 }}>
              {afterCoupon >= SHIPPING_THRESHOLD ? (
                <span style={{ color: "var(--gold)" }}>
                  🎉 Bạn được{" "}
                  <strong style={{ color: "var(--ivory)" }}>miễn phí giao hàng!</strong>
                </span>
              ) : (
                <>
                  <strong style={{ color: "var(--ivory)" }}>
                    Còn {formatPrice(SHIPPING_THRESHOLD - afterCoupon)}
                  </strong>{" "}
                  nữa để được{" "}
                  <span style={{ color: "var(--gold)" }}>miễn phí giao hàng!</span>
                </>
              )}
            </div>
            <div style={{ height: "3px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden", marginBottom: "8px" }}>
              <div
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg,var(--gold),var(--gold-light))",
                  width: `${shippingPct}%`,
                  transition: "width 0.6s ease",
                  borderRadius: "2px",
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>
              <span style={{ color: "var(--gold)" }}>{formatPrice(afterCoupon)}</span>
              <span>{formatPrice(SHIPPING_THRESHOLD)}</span>
            </div>
          </div>

          <div style={{ padding: "28px" }}>
            <div
              style={{
                fontSize: "11px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: "24px",
                paddingBottom: "14px",
                borderBottom: "0.5px solid var(--border)",
              }}
            >
              Tóm tắt đơn hàng
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
              {[
                {
                  label: `Tạm tính (${items.reduce((s, i) => s + i.quantity, 0)} sản phẩm)`,
                  val: formatPrice(subtotal),
                },
                {
                  label: "Tiết kiệm được",
                  val: `-${formatPrice(items.reduce((s, i) => s + (i.book.price - (i.book.salePrice || i.book.price)) * i.quantity, 0))}`,
                  green: true,
                },
                ...(couponApplied
                  ? [{ label: "Mã EARTH15 (−15%)", val: `-${formatPrice(couponDiscount)}`, red: true }]
                  : []),
                {
                  label: "Phí giao hàng",
                  val: shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee),
                  free: shippingFee === 0,
                },
              ].map((line, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "var(--text-muted)", fontWeight: 300 }}>{line.label}</span>
                  <span
                    style={{
                      color: line.green ? "var(--gold)" : line.red ? "#c05050" : line.free ? "var(--gold)" : "var(--forest)",
                      fontWeight: 400,
                    }}
                  >
                    {line.val}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ height: "0.5px", background: "var(--border)", margin: "20px 0" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "28px" }}>
              <span style={{ fontFamily: "Playfair Display,serif", fontSize: "17px", color: "var(--forest)" }}>
                Tổng cộng
              </span>
              <span style={{ fontFamily: "Playfair Display,serif", fontSize: "32px", fontWeight: 300, color: "var(--forest)" }}>
                {formatPrice(total)}
              </span>
            </div>

            <Link to="/checkout" style={{ textDecoration: "none" }}>
              <button
                onClick={handleCheckout}
                style={{
                  width: "100%", height: "56px",
                  background: "var(--forest)", color: "var(--ivory)",
                  border: "none",
                  fontFamily: "Be Vietnam Pro,sans-serif",
                  fontSize: "12px", letterSpacing: "0.18em", textTransform: "uppercase",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
                }}
              >
                Tiến hành thanh toán
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </Link>

            <Link to="/shop" style={{ textDecoration: "none" }}>
              <button
                style={{
                  width: "100%", marginTop: "10px", height: "44px",
                  background: "transparent", color: "var(--text-muted)",
                  border: "0.5px solid var(--border)", cursor: "pointer",
                  fontFamily: "Be Vietnam Pro,sans-serif",
                  fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                }}
              >
                <ArrowLeft size={12} /> Tiếp tục mua sắm
              </button>
            </Link>

            <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px", paddingTop: "20px", borderTop: "0.5px solid var(--border)" }}>
              {["VISA", "MC", "VNPAY", "MOMO", "COD"].map((p) => (
                <div key={p} style={{ padding: "3px 8px", border: "0.5px solid var(--border)", fontSize: "9px", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
                  {p}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: "16px 28px",
              background: "var(--cream)",
              borderTop: "0.5px solid var(--border)",
              display: "flex", flexDirection: "column", gap: "10px",
            }}
          >
            {[
              "Thanh toán bảo mật · SSL 256-bit",
              "Đổi trả miễn phí trong 30 ngày",
              "Giao hàng toàn quốc 2–4 ngày",
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11px", color: "var(--text-muted)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}