import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Trash2,
  ShoppingCart,
  Minus,
  Plus,
  ArrowLeft,
  ArrowRight,
  X,
  Lock,
  RotateCcw,
  Truck,
} from "lucide-react";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { formatPrice, computeTierDiscount } from "../utils/helpers";
import { orderService } from "../services/orderService";
import { loyaltyService } from "../services/loyaltyService";
import LoyaltyBadge from "../components/LoyaltyBadge";
import toast from "react-hot-toast";
import StepBar from "../components/StepBar";
import {
  SkeletonCartItem,
  SkeletonCartSummary,
} from "../components/skeletons/SkeletonCart";

const SHIPPING_THRESHOLD = 300000;
const SHIPPING_FEE = 30000;

export default function Cart() {
  const { cart, fetchCart, updateItem, removeItem, clearCart, loading } =
    useCartStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [pendingItemId, setPendingItemId] = useState(null);
  const [loyaltyProfile, setLoyaltyProfile] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearingCart, setClearingCart] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  // Hồ sơ hạng thành viên — quyết định % giảm giá & ngưỡng freeship tự động,
  // dùng chung công thức computeTierDiscount với Checkout để 2 trang luôn khớp số.
  useEffect(() => {
    if (!isAuthenticated) {
      setLoyaltyProfile(null);
      return;
    }
    loyaltyService
      .getMyProfile()
      .then((res) => setLoyaltyProfile(res.data.data))
      .catch(() => {});
  }, [isAuthenticated]);

  const qtyDebounceRef = useRef({});

  useEffect(() => {
    return () => {
      Object.values(qtyDebounceRef.current).forEach(clearTimeout);
    };
  }, []);

  const handleQtyChange = (item, delta) => {
    if (pendingItemId === item.id) return; // đang xóa item này, chặn thao tác

    // Luôn lấy quantity mới nhất từ store, không dùng item.quantity của lần render cũ (stale closure)
    const currentCart = useCartStore.getState().cart;
    const currentItem = currentCart?.items.find((i) => i.id === item.id);
    const currentQty = currentItem?.quantity ?? item.quantity;

    const newQty = currentQty + delta;

    if (newQty < 1) {
      handleRemove(item);
      return;
    }

    // Update UI ngay, không chờ API — cho phép bấm liên tục
    useCartStore.getState().setLocalQuantity(item.id, newQty);

    clearTimeout(qtyDebounceRef.current[item.id]);
    qtyDebounceRef.current[item.id] = setTimeout(async () => {
      try {
        await useCartStore.getState().updateItem(item.id, newQty);
      } catch (err) {
        toast.error(
          err?.response?.data?.message || "Không thể cập nhật giỏ hàng",
        );
      }
    }, 400);
  };

  const handleRemove = async (item) => {
    if (pendingItemId === item.id) return;
    setPendingItemId(item.id);
    try {
      await removeItem(item.id);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể xóa sản phẩm");
    } finally {
      setPendingItemId(null);
    }
  };

  const items = cart?.items || [];

  const subtotal = items.reduce((sum, item) => {
    return sum + (item.variant.salePrice ?? item.variant.price) * item.quantity;
  }, 0);

  // Ưu đãi hạng thành viên — tự động áp dụng, KHÔNG cần nhập mã, cùng công thức
  // computeTierDiscount() dùng ở Checkout.jsx và server (loyaltyTier.js) để số tiền
  // hiển thị ở giỏ hàng luôn khớp với số tiền thực tế lúc đặt hàng.
  const tierDiscount = computeTierDiscount(loyaltyProfile?.tier, subtotal);
  const afterDiscount = Math.max(subtotal - tierDiscount, 0);
  const freeShipThreshold =
    loyaltyProfile?.tier?.freeShipThreshold ?? SHIPPING_THRESHOLD;
  const shippingFee = afterDiscount >= freeShipThreshold ? 0 : SHIPPING_FEE;
  const total = afterDiscount + shippingFee;
  const shippingPct =
    freeShipThreshold <= 0
      ? 100
      : Math.min((afterDiscount / freeShipThreshold) * 100, 100);

  const handleClearCart = async () => {
    if (clearingCart) return;
    setClearingCart(true);
    try {
      await clearCart();
      toast.success("Đã dọn sạch giỏ hàng");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể dọn giỏ hàng");
    } finally {
      setClearingCart(false);
      setConfirmClear(false);
    }
  };

  const handleCheckout = async () => {
    toast("Tính năng thanh toán sẽ sớm ra mắt!", { icon: "🚀" });
  };

  if (loading && !cart) {
    return (
      <div
        style={{
          minHeight: "100vh",
          paddingTop: "80px",
          background: "var(--ivory)",
        }}
      >
        <div className="breadcrumb">
          <span className="breadcrumb-item">Trang chủ</span>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-item">Cửa hàng</span>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-current">Giỏ hàng</span>
        </div>

        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "40px 100px 0",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              marginBottom: "20px",
            }}
          >
            <div className="eyebrow-line" />
            <span className="eyebrow-text">Bước 1 / 5</span>
          </div>
          {/* Title skeleton */}
          <span
            className="skeleton"
            style={{
              display: "block",
              width: 220,
              height: 60,
              marginBottom: 8,
            }}
          />
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
            <span
              className="skeleton"
              style={{ display: "block", height: 56, marginBottom: 32 }}
            />

            {/* Header row skeleton */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 100px 140px 44px",
                gap: 20,
                paddingBottom: 14,
                borderBottom: "0.5px solid var(--border)",
                marginBottom: 8,
              }}
            >
              {["40%", "60px", "80px", "32px"].map((w, i) => (
                <span
                  key={i}
                  className="skeleton"
                  style={{ height: 10, width: w }}
                />
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
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "80px 100px",
          }}
        >
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
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>
                trống
              </em>
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                marginBottom: "32px",
              }}
            >
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
    <div
      style={{
        minHeight: "100vh",
        paddingTop: "80px",
        background: "var(--ivory)",
      }}
    >
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/" className="breadcrumb-item">
          Trang chủ
        </Link>
        <span className="breadcrumb-sep">›</span>
        <Link to="/shop" className="breadcrumb-item">
          Cửa hàng
        </Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">Giỏ hàng</span>
      </div>

      {/* Page header */}
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "40px 100px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            marginBottom: "20px",
          }}
        >
          <div className="eyebrow-line" />
          <span className="eyebrow-text">Bước 1 / 5</span>
        </div>
        <h1
          style={{
            fontFamily: "Playfair Display,serif",
            fontSize: "clamp(40px,5vw,72px)",
            fontWeight: 300,
            color: "var(--forest)",
            marginBottom: 40,
          }}
        >
          Giỏ{" "}
          <em style={{ fontStyle: "italic", color: "var(--gold)" }}>Hàng</em>
        </h1>
        <StepBar current={1} />
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
          {/* Thanh công cụ giỏ hàng — tổng số sản phẩm + nút dọn giỏ hàng */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "14px",
              padding: "14px 20px",
              marginBottom: "32px",
              background: "var(--cream)",
              border: "0.5px solid var(--border)",
              minHeight: "48px",
            }}
          >
            {!confirmClear ? (
              <>
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    fontWeight: 300,
                  }}
                >
                  <strong style={{ color: "var(--forest)", fontWeight: 500 }}>
                    {items.reduce((s, i) => s + i.quantity, 0)}
                  </strong>{" "}
                  sản phẩm trong giỏ hàng
                </span>
                <button
                  onClick={() => setConfirmClear(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "transparent",
                    border: "0.5px solid var(--border)",
                    padding: "8px 14px",
                    cursor: "pointer",
                    fontSize: "10px",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    flexShrink: 0,
                  }}
                >
                  <Trash2 size={12} />
                  Dọn giỏ hàng
                </button>
              </>
            ) : (
              <>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#c05050",
                    fontWeight: 300,
                  }}
                >
                  Dọn toàn bộ sản phẩm khỏi giỏ hàng?
                </span>
                <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
                  <button
                    onClick={() => setConfirmClear(false)}
                    disabled={clearingCart}
                    style={{
                      background: "transparent",
                      border: "0.5px solid var(--border)",
                      padding: "8px 14px",
                      cursor: clearingCart ? "not-allowed" : "pointer",
                      fontSize: "10px",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleClearCart}
                    disabled={clearingCart}
                    style={{
                      background: "#c05050",
                      border: "none",
                      padding: "8px 14px",
                      cursor: clearingCart ? "not-allowed" : "pointer",
                      opacity: clearingCart ? 0.6 : 1,
                      fontSize: "10px",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "var(--ivory)",
                    }}
                  >
                    {clearingCart ? "Đang xóa..." : "Dọn ngay"}
                  </button>
                </div>
              </>
            )}
          </div>

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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "20px",
                    }}
                  >
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
                        src={
                          item.variant.book.coverImage ||
                          "https://placehold.co/88x112/0d3330/faf8f3?text=E"
                        }
                        alt={item.variant.book.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
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
                        {item.variant.format === "DIGITAL"
                          ? "Sách điện tử"
                          : "Sách giấy"}
                      </div>
                      <div
                        style={{
                          fontFamily: "Playfair Display,serif",
                          fontSize: "18px",
                          color: "var(--forest)",
                          marginBottom: "12px",
                        }}
                      >
                        {item.variant.book.title}
                      </div>
                    </div>
                  </div>

                  {/* Qty */}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        border: "0.5px solid var(--border)",
                      }}
                    >
                      <button
                        onClick={() => handleQtyChange(item, -1)}
                        style={{
                          width: "32px",
                          height: "36px",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Minus size={12} />
                      </button>
                      <span
                        style={{
                          width: "36px",
                          textAlign: "center",
                          fontFamily: "Playfair Display,serif",
                          fontSize: "16px",
                          color: "var(--forest)",
                        }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQtyChange(item, +1)}
                        style={{
                          width: "32px",
                          height: "36px",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontFamily: "Playfair Display,serif",
                        fontSize: "20px",
                        color: "var(--forest)",
                      }}
                    >
                      {formatPrice(
                        (item.variant.salePrice ?? item.variant.price) *
                          item.quantity,
                      )}
                    </div>
                    {item.variant.salePrice != null && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--text-muted)",
                          textDecoration: "line-through",
                          marginTop: "2px",
                        }}
                      >
                        {formatPrice(item.variant.price * item.quantity)}
                      </div>
                    )}
                  </div>

                  {/* Delete */}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      disabled={pendingItemId === item.id}
                      onClick={() => handleRemove(item)}
                      style={{
                        width: "32px",
                        height: "32px",
                        border: "0.5px solid var(--border)",
                        background: "transparent",
                        cursor:
                          pendingItemId === item.id ? "not-allowed" : "pointer",
                        opacity: pendingItemId === item.id ? 0.4 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-muted)",
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
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
            <div
              style={{
                fontSize: "12px",
                color: "rgba(255,255,255,0.7)",
                marginBottom: "12px",
                fontWeight: 300,
              }}
            >
              {afterDiscount >= freeShipThreshold ? (
                <span style={{ color: "var(--gold)" }}>
                  Bạn được{" "}
                  <strong style={{ color: "var(--ivory)" }}>
                    miễn phí giao hàng!
                  </strong>
                </span>
              ) : (
                <>
                  <strong style={{ color: "var(--ivory)" }}>
                    Còn {formatPrice(freeShipThreshold - afterDiscount)}
                  </strong>{" "}
                  nữa để được{" "}
                  <span style={{ color: "var(--gold)" }}>
                    miễn phí giao hàng!
                  </span>
                </>
              )}
            </div>
            <div
              style={{
                height: "3px",
                background: "rgba(255,255,255,0.1)",
                borderRadius: "2px",
                overflow: "hidden",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background:
                    "linear-gradient(90deg,var(--gold),var(--gold-light))",
                  width: `${shippingPct}%`,
                  transition: "width 0.6s ease",
                  borderRadius: "2px",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "10px",
                color: "rgba(255,255,255,0.35)",
              }}
            >
              <span style={{ color: "var(--gold)" }}>
                {formatPrice(afterDiscount)}
              </span>
              <span>{formatPrice(freeShipThreshold)}</span>
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

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                marginBottom: "24px",
              }}
            >
              {[
                {
                  label: `Tạm tính (${items.reduce((s, i) => s + i.quantity, 0)} sản phẩm)`,
                  val: formatPrice(subtotal),
                },
                {
                  label: "Tiết kiệm được",
                  val: `-${formatPrice(items.reduce((s, i) => s + (i.variant.price - (i.variant.salePrice ?? i.variant.price)) * i.quantity, 0))}`,
                  green: true,
                },
                ...(tierDiscount > 0
                  ? [
                      {
                        label: (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            Ưu đãi hạng{" "}
                            <LoyaltyBadge
                              tier={loyaltyProfile.tier}
                              progress={loyaltyProfile}
                              variant="light"
                              align="left"
                              showDot={false}
                            />
                          </span>
                        ),
                        val: `-${formatPrice(tierDiscount)}`,
                        tierColor: loyaltyProfile?.tier?.color,
                      },
                    ]
                  : []),
              ].map((line, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "13px",
                  }}
                >
                  <span style={{ color: "var(--text-muted)", fontWeight: 300 }}>
                    {line.label}
                  </span>
                  <span
                    style={{
                      color:
                        line.tierColor ||
                        (line.green
                          ? "var(--gold)"
                          : line.red
                            ? "#c05050"
                            : line.free
                              ? "var(--gold)"
                              : "var(--forest)"),
                      fontWeight: 400,
                    }}
                  >
                    {line.val}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                height: "0.5px",
                background: "var(--border)",
                margin: "20px 0",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: "28px",
              }}
            >
              <span
                style={{
                  fontFamily: "Playfair Display,serif",
                  fontSize: "17px",
                  color: "var(--forest)",
                }}
              >
                Tổng cộng
              </span>
              <span
                style={{
                  fontFamily: "Playfair Display,serif",
                  fontSize: "32px",
                  fontWeight: 300,
                  color: "var(--forest)",
                }}
              >
                {formatPrice(total)}
              </span>
            </div>

            <Link to="/checkout" style={{ textDecoration: "none" }}>
              <button
                onClick={handleCheckout}
                style={{
                  width: "100%",
                  height: "56px",
                  background: "var(--forest)",
                  color: "var(--ivory)",
                  border: "none",
                  fontFamily: "Be Vietnam Pro,sans-serif",
                  fontSize: "12px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                }}
              >
                Tiến hành thanh toán
                <ArrowRight size={14} />
              </button>
            </Link>

            <Link to="/shop" style={{ textDecoration: "none" }}>
              <button
                style={{
                  width: "100%",
                  marginTop: "10px",
                  height: "44px",
                  background: "transparent",
                  color: "var(--text-muted)",
                  border: "0.5px solid var(--border)",
                  cursor: "pointer",
                  fontFamily: "Be Vietnam Pro,sans-serif",
                  fontSize: "11px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <ArrowLeft size={12} /> Tiếp tục mua sắm
              </button>
            </Link>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "10px",
                marginTop: "20px",
                paddingTop: "20px",
                borderTop: "0.5px solid var(--border)",
              }}
            >
              {["VISA", "MC", "VNPAY", "MOMO", "COD"].map((p) => (
                <div
                  key={p}
                  style={{
                    padding: "3px 8px",
                    border: "0.5px solid var(--border)",
                    fontSize: "9px",
                    letterSpacing: "0.1em",
                    color: "var(--text-muted)",
                  }}
                >
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
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {[
              { text: "Thanh toán bảo mật · SSL 256-bit", Icon: Lock },
              { text: "Đổi trả miễn phí trong 30 ngày", Icon: RotateCcw },
              { text: "Giao hàng toàn quốc 2–4 ngày", Icon: Truck },
            ].map(({ text, Icon }, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                }}
              >
                <Icon size={13} color="var(--gold)" strokeWidth={1.5} />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
