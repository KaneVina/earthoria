import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Heart,
  Moon,
  Sun,
  Menu,
  X,
  User,
  Package,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Search,
  Gem,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";
import { useWishlistStore } from "../../store/wishlistStore";
import { useTheme } from "../../hooks/useTheme";
import { loyaltyService } from "../../services/loyaltyService";
import LoyaltyBadge from "../LoyaltyBadge";
import toast from "react-hot-toast";
// import logoImg from "../assets/img/logoBT-ngangtext.png";
import logoImg from "../assets/img/lgBT29.png";
import SearchOverlay from "./SearchOverlay";
import "../assets/css/navbar.css";
import { authService } from "../../services/authService";
import LogoutConfirmModal from "../LogoutConfirmModal";
import { formatPrice, computeTierDiscount } from "../../utils/helpers";
const logoCompactImg = "/logo-nho29.png";
export default function Navbar() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  //  Stores ────────────────────────────────────────
  const { user, isAuthenticated, logout } = useAuthStore();
  const itemCount = useCartStore((s) => s.itemCount);
  const cart = useCartStore((s) => s.cart);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const removeCartItem = useCartStore((s) => s.removeItem);
  const [removingItemId, setRemovingItemId] = useState(null);
  const { wishlistCount, fetchWishlist } = useWishlistStore();
  const { isDark, toggleTheme } = useTheme();
  const { data: loyaltyProfile } = useQuery({
    queryKey: ["loyalty-profile"],
    queryFn: () => loyaltyService.getMyProfile().then((r) => r.data.data),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  //  State ──────────────────────────────────────────
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [cartPeek, setCartPeek] = useState(false);
  const prevItemCountRef = useRef(itemCount);
  const cartPeekTimeoutRef = useRef(null);

  //  Effects
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
      fetchWishlist();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (itemCount > prevItemCountRef.current) {
      setCartPeek(true);
      if (cartPeekTimeoutRef.current) clearTimeout(cartPeekTimeoutRef.current);
      cartPeekTimeoutRef.current = setTimeout(() => setCartPeek(false), 2600);
    }
    prevItemCountRef.current = itemCount;
  }, [itemCount]);

  useEffect(() => {
    return () => {
      if (cartPeekTimeoutRef.current) clearTimeout(cartPeekTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const handler = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 60);
      const height =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      setProgress(height > 0 ? (scrollY / height) * 100 : 0);
    };
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Đóng menu mobile / search mỗi khi chuyển trang
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  //  Helpers
  const handleLogout = async () => {
    setShowLogoutModal(false);
    try {
      await authService.logout(); // gọi POST /auth/logout — clear cookie + revoke token ở DB
    } catch (err) {
      console.error("Logout API failed:", err);
      // vẫn tiếp tục clear local state dù API lỗi, tránh kẹt UI
    }
    logout(); // clear Zustand state
    queryClient.clear();
    toast.success("Đã đăng xuất");
    navigate("/");
  };

  const isHome = location.pathname === "/" || location.pathname === "/home";

  const handleQuickRemove = async (e, itemId) => {
    e.preventDefault();
    e.stopPropagation();
    setRemovingItemId(itemId);
    try {
      await removeCartItem(itemId);
    } catch {
      toast.error("Không thể xoá sản phẩm, vui lòng thử lại");
    } finally {
      setRemovingItemId(null);
    }
  };

  const isActive = (to) => {
    if (to === "/home") return isHome;
    const [path, query] = to.split("?");
    if (query) {
      return location.pathname === path && location.search === `?${query}`;
    }
    return location.pathname === path && location.search === "";
  };

  const navLinks = [
    { to: "/home", label: "Trang chủ" },
    { to: "/shop", label: "Cửa hàng" },
    { to: "/blog", label: "Tin tức" },
    { to: "/about", label: "Về chúng tôi" },
    { to: "/contact", label: "Liên hệ" },
  ];

  const firstLetter = user?.name?.trim()?.charAt(0)?.toUpperCase() || "?";
  const isAdmin = user?.role === "ADMIN";
  const isStaff = user?.role === "STAFF";
  const isDealer = user?.role === "DEALER";
  const canAccessDashboard = isAdmin || isStaff;
  const roleMeta = isAdmin
    ? {
        label: "Quản Trị Viên",
        color: "#b8862e",
        bg: "rgba(184,134,46,0.08)",
        border: "rgba(184,134,46,0.25)",
      }
    : isStaff
      ? {
          label: "Nhân Viên",
          color: "#2a78d6",
          bg: "rgba(42,120,214,0.08)",
          border: "rgba(42,120,214,0.25)",
        }
      : isDealer
        ? {
            label: "Đại Lý",
            color: "#7a4fb5",
            bg: "rgba(122,79,181,0.08)",
            border: "rgba(122,79,181,0.25)",
          }
        : {
            label: "Thành Viên",
            color: "#4a9e3f",
            bg: "rgba(74,158,63,0.08)",
            border: "rgba(74,158,63,0.22)",
          };

  //  Render
  return (
    <>
      {/* Progress bar */}
      <div id="progress" style={{ width: `${progress}%` }} />

      <nav
        id="navbar"
        className={scrolled ? "is-scrolled" : ""}
        style={{
          boxShadow: scrolled ? "0 8px 32px rgba(13,43,30,0.06)" : "none",
        }}
      >
        <div className="nav-inner">
          {/* Logo */}
          <Link to="/" className="nav-logo">
            <span className="nav-logo-swap">
              <img src={logoImg} alt="EARTHORIA" className="nav-logo-full" />
              <span
                className="nav-logo-shine nav-logo-shine-full"
                aria-hidden="true"
                style={{
                  WebkitMaskImage: `url(${logoImg})`,
                  maskImage: `url(${logoImg})`,
                }}
              />
              <img
                src={logoCompactImg}
                alt="EARTHORIA"
                className="nav-logo-compact"
              />
              <span
                className="nav-logo-shine nav-logo-shine-compact"
                aria-hidden="true"
                style={{
                  WebkitMaskImage: `url(${logoCompactImg})`,
                  maskImage: `url(${logoCompactImg})`,
                }}
              />
            </span>
          </Link>

          {/* Nav links (desktop) */}
          <ul className="nav-links">
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={isActive(link.to) ? "active" : ""}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="nav-actions">
            <div className="nav-icon-group">
              {/* Search */}
              <button
                className="nav-icon icon-search"
                onClick={() => setSearchOpen((v) => !v)}
                aria-label="Mở ô tìm kiếm"
                data-tooltip="Tìm kiếm"
              >
                <Search size={16} strokeWidth={1.8} />
              </button>

              {/* Theme toggle */}
              <button
                className="nav-icon icon-theme"
                onClick={toggleTheme}
                aria-label="Chuyển chế độ sáng/tối"
                data-tooltip={isDark ? "Chế độ sáng" : "Chế độ tối"}
              >
                {isDark ? (
                  <Sun size={16} strokeWidth={1.8} />
                ) : (
                  <Moon size={16} strokeWidth={1.8} />
                )}
              </button>

              {/* Wishlist */}
              <Link
                id="wishlist-nav-icon"
                to="/wishlist"
                className="nav-icon icon-wishlist"
                aria-label="Sản phẩm yêu thích"
                data-tooltip="Yêu thích"
              >
                <Heart
                  size={16}
                  strokeWidth={1.8}
                  fill={wishlistCount > 0 ? "var(--gold)" : "none"}
                  color={wishlistCount > 0 ? "var(--gold)" : "currentColor"}
                  style={{ transition: "fill 0.3s ease, color 0.3s ease" }}
                />
                {wishlistCount > 0 && (
                  <span key={wishlistCount} className="nav-badge nav-badge-pop">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <div
                className={`nav-cart-wrapper${cartPeek ? " cart-peek" : ""}`}
              >
                <Link
                  to="/cart"
                  className="nav-icon icon-cart"
                  aria-label="Giỏ hàng"
                >
                  <ShoppingCart size={16} strokeWidth={1.8} />
                  {itemCount > 0 && (
                    <span key={itemCount} className="nav-badge nav-badge-pop">
                      {itemCount > 99 ? "99+" : itemCount}
                    </span>
                  )}
                </Link>

                {/* Dropdown xem nhanh giỏ hàng khi rê chuột vào */}
                <div className="cart-dropdown">
                  <span className="cart-dropdown-arrow" />
                  {itemCount > 0 ? (
                    <>
                      <div className="cart-dropdown-header">
                        <span className="cart-dropdown-header-icon">
                          <ShoppingCart size={13} strokeWidth={2} />
                        </span>
                        <span>
                          Giỏ hàng của bạn có <strong>{itemCount}</strong>{" "}
                          {itemCount > 1 ? "sản phẩm" : "sản phẩm"}
                        </span>
                      </div>
                      <ul className="cart-dropdown-list">
                        {cart?.items?.slice(0, 4).map((item) => {
                          const price =
                            item.variant?.salePrice ?? item.variant?.price ?? 0;
                          return (
                            <li key={item.id} className="cart-dropdown-item">
                              <span className="cart-dropdown-thumb-wrap">
                                <img
                                  src={item.variant?.book?.coverImage}
                                  alt={item.variant?.book?.title}
                                  className="cart-dropdown-thumb"
                                />
                                <span className="cart-dropdown-qty">
                                  {item.quantity}
                                </span>
                              </span>
                              <div className="cart-dropdown-info">
                                <span className="cart-dropdown-title">
                                  {item.variant?.book?.title}
                                </span>
                                <span className="cart-dropdown-meta">
                                  {formatPrice(price)}
                                </span>
                              </div>
                              <button
                                type="button"
                                className="cart-dropdown-remove"
                                aria-label="Xoá sản phẩm khỏi giỏ"
                                disabled={removingItemId === item.id}
                                onClick={(e) => handleQuickRemove(e, item.id)}
                              >
                                <X size={13} strokeWidth={2} />
                              </button>
                            </li>
                          );
                        })}
                        {cart?.items?.length > 4 && (
                          <li className="cart-dropdown-more">
                            + {cart.items.length - 4} sản phẩm khác trong giỏ
                          </li>
                        )}
                      </ul>
                      {(() => {
                        const cartSubtotal = cart?.total ?? 0;
                        const cartTierDiscount = computeTierDiscount(
                          loyaltyProfile?.tier,
                          cartSubtotal,
                        );
                        return (
                          <>
                            {cartTierDiscount > 0 && (
                              <div className="cart-dropdown-tier-row">
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                  }}
                                >
                                  Ưu đãi hạng
                                  <LoyaltyBadge
                                    tier={loyaltyProfile.tier}
                                    progress={loyaltyProfile}
                                    variant="light"
                                    align="left"
                                    showDot={false}
                                  />
                                </span>
                                <strong style={{ color: loyaltyProfile?.tier?.color }}>
                                  −{formatPrice(cartTierDiscount)}
                                </strong>
                              </div>
                            )}
                            <div className="cart-dropdown-footer">
                              <span>{cartTierDiscount > 0 ? "Tạm tính sau ưu đãi" : "Tạm tính"}</span>
                              <strong>
                                {formatPrice(cartSubtotal - cartTierDiscount)}
                              </strong>
                            </div>
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    <div className="cart-dropdown-empty">
                      <span className="cart-dropdown-empty-icon">
                        <ShoppingCart size={22} strokeWidth={1.4} />
                      </span>
                      <span className="cart-dropdown-empty-title">
                        Giỏ hàng đang trống
                      </span>
                      <span className="cart-dropdown-empty-desc">
                        Khám phá thêm sách hay và thêm vào giỏ nhé
                      </span>
                      <Link to="/shop" className="cart-dropdown-btn">
                        Khám phá cửa hàng
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Auth */}
            {isAuthenticated ? (
              <div className="user-menu">
                <button className="user-menu-trigger" type="button">
                  <span className="user-avatar">{firstLetter}</span>
                  <span className="user-greet">
                    Xin chào, <strong>{user?.name}</strong>
                  </span>
                  <ChevronDown size={14} className="user-caret" />
                </button>

                <div
                  className="user-dropdown"
                  style={{ minWidth: "100%", width: "max-content" }}
                >
                  <div className="user-dropdown-header">
                    <span
                      className="user-dropdown-avatar"
                      style={{
                        background: isAdmin
                          ? "linear-gradient(135deg,#b8862e,#d4a843)"
                          : undefined,
                      }}
                    >
                      {firstLetter}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="user-dropdown-name">{user?.name}</div>
                      {user?.email && (
                        <div className="user-dropdown-email">{user.email}</div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          gap: "6px",
                          marginTop: "6px",
                        }}
                      >
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "3px 8px",
                            background: roleMeta.bg,
                            border: `0.5px solid ${roleMeta.border}`,
                            borderRadius: "2px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "9px",
                              letterSpacing: "0.16em",
                              textTransform: "uppercase",
                              color: roleMeta.color,
                              fontWeight: 500,
                              fontFamily: "'Be Vietnam Pro', sans-serif",
                            }}
                          >
                            {roleMeta.label}
                          </span>
                        </div>
                        {loyaltyProfile && (
                          <LoyaltyBadge
                            tier={loyaltyProfile.tier}
                            progress={loyaltyProfile}
                            variant="light"
                            align="right"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <Link to="/profile" className="user-dropdown-item">
                    <User size={16} /> Hồ sơ của tôi
                  </Link>
                  <Link
                    to="/profile"
                    state={{ tab: "orders" }}
                    className="user-dropdown-item"
                  >
                    <Package size={16} /> Đơn hàng
                  </Link>
                  <Link to="/parent-dashboard" className="user-dropdown-item">
                    <ShieldCheck size={16} /> Bảng điều khiển phụ huynh
                  </Link>
                  {canAccessDashboard && (
                    <Link to="/dashboard" className="user-dropdown-item">
                      <User size={16} /> Quản trị
                    </Link>
                  )}
                  <button
                    type="button"
                    className="user-dropdown-item logout"
                    onClick={() => setShowLogoutModal(true)}
                  >
                    <LogOut size={16} /> Đăng xuất
                  </button>
                </div>
              </div>
            ) : (
              <div className="nav-auth-buttons">
                <Link to="/login">
                  <button className="btn-ghost">Đăng nhập</button>
                </Link>
                <Link to="/register">
                  <button className="btn-primary">Đăng ký</button>
                </Link>
              </div>
            )}

            {/* Hamburger (mobile) */}
            <button
              className="nav-hamburger"
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              {!mobileOpen && itemCount > 0 && (
                <span key={itemCount} className="nav-badge nav-badge-pop">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile panel */}
        <div className={`nav-mobile-panel ${mobileOpen ? "open" : ""}`}>
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-mobile-link ${isActive(link.to) ? "active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
          {canAccessDashboard && (
            <Link
              to="/dashboard"
              className={`nav-mobile-link ${isActive("/dashboard") ? "active" : ""}`}
            >
              Quản trị
            </Link>
          )}

          <div className="nav-mobile-divider" />

          {/* Tìm kiếm / Yêu thích / Giỏ hàng — trước đây chỉ có trên desktop
              (icon-group bị ẩn ở mobile) nên trên mobile không có cách nào
              vào được các mục này. Thêm hẳn vào panel để luôn tìm thấy. */}
          <button
            type="button"
            className="nav-mobile-link"
            onClick={() => {
              setMobileOpen(false);
              setSearchOpen(true);
            }}
          >
            <Search size={15} /> Tìm kiếm
          </button>
          <Link to="/wishlist" className="nav-mobile-link">
            <Heart size={15} /> Yêu thích
            {wishlistCount > 0 && (
              <span className="nav-mobile-badge">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </Link>
          <Link to="/cart" className="nav-mobile-link">
            <ShoppingCart size={15} /> Giỏ hàng
            {itemCount > 0 && (
              <span className="nav-mobile-badge">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>

          <div className="nav-mobile-divider" />

          {isAuthenticated ? (
            <>
              <Link to="/profile" className="nav-mobile-link">
                <User size={15} /> Hồ sơ của tôi
              </Link>
              <Link
                to="/profile"
                state={{ tab: "orders" }}
                className="nav-mobile-link"
              >
                <Package size={15} /> Đơn hàng
              </Link>
              <Link to="/parent-dashboard" className="nav-mobile-link">
                <ShieldCheck size={15} /> Bảng điều khiển phụ huynh
              </Link>
              <button
                type="button"
                className="nav-mobile-link logout"
                onClick={() => setShowLogoutModal(true)}
              >
                <LogOut size={15} /> Đăng xuất
              </button>
            </>
          ) : (
            <div className="nav-mobile-auth">
              <Link to="/login" style={{ width: "100%" }}>
                <button className="btn-ghost" style={{ width: "100%" }}>
                  Đăng nhập
                </button>
              </Link>
              <Link to="/register" style={{ width: "100%" }}>
                <button className="btn-primary" style={{ width: "100%" }}>
                  Đăng ký
                </button>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Search Overlay */}
      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onOpen={() => setSearchOpen(true)}
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        onLogout={() => setShowLogoutModal(true)}
        getProductLink={(b) => `/books/${b.slug}/${b.hashId}`}
      />

      <LogoutConfirmModal
        open={showLogoutModal}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
        seconds={10}
      />
    </>
  );
}