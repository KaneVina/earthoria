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
import "../components/assets/css/cart.css";

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

  // Hồ sơ hạng thành viên - quyết định % giảm giá & ngưỡng freeship tự động,
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

    // Update UI ngay, không chờ API - cho phép bấm liên tục
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

  // Ưu đãi hạng thành viên - tự động áp dụng, KHÔNG cần nhập mã, cùng công thức
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
      <div className="cart-page">
        <div className="breadcrumb">
          <span className="breadcrumb-item">Trang chủ</span>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-item">Cửa hàng</span>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-current">Giỏ hàng</span>
        </div>

        <div className="cart-header">
          <div className="cart-eyebrow">
            <div className="eyebrow-line" />
            <span className="eyebrow-text">Bước 1 / 5</span>
          </div>
          {/* Title skeleton */}
          <span className="skeleton cart-title-skeleton" />
        </div>

        <div className="cart-layout">
          {/* LEFT - skeleton items */}
          <div className="cart-items-col">
            {/* Promo banner skeleton */}
            <span className="skeleton cart-promo-skeleton" />

            {/* Header row skeleton */}
            <div className="cart-table-header">
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

          {/* RIGHT - skeleton summary */}
          <SkeletonCartSummary />
        </div>
      </div>
    );
  }

  // Giỏ trống
  if (!cart || items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-empty-wrap">
          <div className="cart-empty-box">
            <div className="cart-empty-icon">
              <ShoppingCart size={32} strokeWidth={1} />
            </div>
            <h2 className="cart-empty-title">
              Giỏ hàng <em>trống</em>
            </h2>
            <p className="cart-empty-text">
              Bạn chưa có sản phẩm nào trong giỏ.
            </p>
            <Link to="/shop">
              <button className="btn-primary cart-empty-cta">
                Khám phá cửa hàng →
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
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
      <div className="cart-header">
        <div className="cart-eyebrow">
          <div className="eyebrow-line" />
          <span className="eyebrow-text">Bước 1 / 5</span>
        </div>
        <h1 className="cart-title">
          Giỏ <em>Hàng</em>
        </h1>
        <StepBar current={1} />
      </div>

      {/* Main layout */}
      <div className="cart-layout">
        {/* LEFT */}
        <div className="cart-items-col">
          {/* Thanh công cụ giỏ hàng - tổng số sản phẩm + nút dọn giỏ hàng */}
          <div className="cart-toolbar">
            {!confirmClear ? (
              <>
                <span className="cart-toolbar-count">
                  <strong>{items.reduce((s, i) => s + i.quantity, 0)}</strong>{" "}
                  sản phẩm trong giỏ hàng
                </span>
                <button
                  onClick={() => setConfirmClear(true)}
                  className="cart-toolbar-clear-btn"
                >
                  <Trash2 size={12} />
                  Dọn giỏ hàng
                </button>
              </>
            ) : (
              <>
                <span className="cart-toolbar-confirm-text">
                  Dọn toàn bộ sản phẩm khỏi giỏ hàng?
                </span>
                <div className="cart-toolbar-confirm-actions">
                  <button
                    onClick={() => setConfirmClear(false)}
                    disabled={clearingCart}
                    className="cart-toolbar-cancel-btn"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleClearCart}
                    disabled={clearingCart}
                    className="cart-toolbar-confirm-btn"
                  >
                    {clearingCart ? "Đang xóa..." : "Dọn ngay"}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Header row */}
          <div className="cart-table-header">
            {["Sản phẩm", "Số lượng", "Thành tiền", ""].map((col, i) => (
              <span
                key={i}
                className={
                  "cart-table-header-col" +
                  (i === 1 ? " align-center" : i > 1 ? " align-right" : "")
                }
              >
                {col}
              </span>
            ))}
          </div>

          {/* ✅ Cart items - skeleton khi đang refetch, items thật khi xong */}
          {loading
            ? Array.from({ length: items.length || 3 }).map((_, i) => (
                <SkeletonCartItem key={i} />
              ))
            : items.map((item) => (
                <div key={item.id} className="cart-item">
                  {/* Product info */}
                  <div className="cart-item-product">
                    <div className="cart-item-image">
                      <img
                        src={
                          item.variant.book.coverImage ||
                          "https://placehold.co/88x112/0d3330/faf8f3?text=E"
                        }
                        alt={item.variant.book.title}
                      />
                    </div>
                    <div>
                      <div className="cart-item-format">
                        {item.variant.format === "DIGITAL"
                          ? "Sách điện tử"
                          : "Sách giấy"}
                      </div>
                      <div className="cart-item-title">
                        {item.variant.book.title}
                      </div>
                    </div>
                  </div>

                  {/* Qty */}
                  <div className="cart-item-qty">
                    <div className="cart-qty-box">
                      <button
                        onClick={() => handleQtyChange(item, -1)}
                        className="cart-qty-btn"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="cart-qty-value">{item.quantity}</span>
                      <button
                        onClick={() => handleQtyChange(item, +1)}
                        className="cart-qty-btn"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="cart-item-price">
                    <div className="cart-item-price-value">
                      {formatPrice(
                        (item.variant.salePrice ?? item.variant.price) *
                          item.quantity,
                      )}
                    </div>
                    {item.variant.salePrice != null && (
                      <div className="cart-item-price-original">
                        {formatPrice(item.variant.price * item.quantity)}
                      </div>
                    )}
                  </div>

                  {/* Delete */}
                  <div className="cart-item-delete">
                    <button
                      disabled={pendingItemId === item.id}
                      onClick={() => handleRemove(item)}
                      className="cart-delete-btn"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
        </div>

        {/* RIGHT - Order summary */}
        <div className="cart-summary">
          {/* Shipping progress */}
          <div className="cart-summary-shipping">
            <div className="cart-summary-shipping-text">
              {afterDiscount >= freeShipThreshold ? (
                <span style={{ color: "var(--gold)" }}>
                  Bạn được <strong>miễn phí giao hàng!</strong>
                </span>
              ) : (
                <>
                  <strong>
                    Còn {formatPrice(freeShipThreshold - afterDiscount)}
                  </strong>{" "}
                  nữa để được{" "}
                  <span style={{ color: "var(--gold)" }}>
                    miễn phí giao hàng!
                  </span>
                </>
              )}
            </div>
            <div className="cart-progress-track">
              <div
                className="cart-progress-fill"
                style={{ width: `${shippingPct}%` }}
              />
            </div>
            <div className="cart-progress-labels">
              <span>{formatPrice(afterDiscount)}</span>
              <span>{formatPrice(freeShipThreshold)}</span>
            </div>
          </div>

          <div className="cart-summary-body">
            <div className="cart-summary-title">Tóm tắt đơn hàng</div>

            <div className="cart-summary-lines">
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
                <div key={i} className="cart-summary-line">
                  <span className="cart-summary-line-label">{line.label}</span>
                  <span
                    className="cart-summary-line-value"
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
                    }}
                  >
                    {line.val}
                  </span>
                </div>
              ))}
            </div>

            <div className="cart-summary-divider" />

            <div className="cart-summary-total">
              <span className="cart-summary-total-label">Tổng cộng</span>
              <span className="cart-summary-total-value">
                {formatPrice(total)}
              </span>
            </div>

            <Link to="/checkout" style={{ textDecoration: "none" }}>
              <button onClick={handleCheckout} className="cart-checkout-btn">
                Tiến hành thanh toán
                <ArrowRight size={14} />
              </button>
            </Link>

            <Link to="/shop" style={{ textDecoration: "none" }}>
              <button className="cart-continue-btn">
                <ArrowLeft size={12} /> Tiếp tục mua sắm
              </button>
            </Link>

            <div className="cart-payment-row">
              {["VISA", "MC", "VNPAY", "MOMO", "COD"].map((p) => (
                <div key={p} className="cart-payment-badge">
                  {p}
                </div>
              ))}
            </div>
          </div>

          <div className="cart-trust-badges">
            {[
              { text: "Thanh toán bảo mật · SSL 256-bit", Icon: Lock },
              { text: "Đổi trả miễn phí trong 30 ngày", Icon: RotateCcw },
              { text: "Giao hàng toàn quốc 2–4 ngày", Icon: Truck },
            ].map(({ text, Icon }, i) => (
              <div key={i} className="cart-trust-item">
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
