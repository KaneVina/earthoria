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
  Search,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";
import { useWishlistStore } from "../../store/wishlistStore";
import { useTheme } from "../../hooks/useTheme";
import toast from "react-hot-toast";
import logoImg from "../assets/img/logoBT-ngangtext.png";
import SearchOverlay from "./SearchOverlay";
import { useQueryClient } from '@tanstack/react-query'

const logoCompactImg = "/logo-nho.png";
export default function Navbar() {
const queryClient = useQueryClient()
  const location = useLocation();
  const navigate = useNavigate();

  // ── Stores ──────────────────────────────────────────
  const { user, isAuthenticated, logout } = useAuthStore();
  const { itemCount, fetchCart } = useCartStore();
  const { wishlistCount, fetchWishlist } = useWishlistStore();
  const { isDark, toggleTheme } = useTheme();

  // ── State ────────────────────────────────────────────
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // ── Effects ──────────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
      fetchWishlist();
    }
  }, [isAuthenticated]);

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

  // ── Helpers ───────────────────────────────────────────
  const handleLogout = () => {
    logout();
     queryClient.clear()
    toast.success("Đã đăng xuất");
    navigate("/");
  };

  const isHome = location.pathname === "/" || location.pathname === "/home";

  const isActive = (to) => {
    if (to === "/home") return isHome;
    const [path, query] = to.split("?");
    if (query) {
      return location.pathname === path && location.search === `?${query}`;
    }
    return location.pathname === path && location.search === "";
  };

  const navLinks = [
    { to: "/home",    label: "Trang chủ" },
    { to: "/shop",    label: "Cửa hàng" },
    { to: "/blog",    label: "Tin tức" },
    { to: "/about",   label: "Về chúng tôi" },
    { to: "/contact", label: "Liên hệ" },
  ];

  const firstLetter = user?.name?.trim()?.charAt(0)?.toUpperCase() || "?";
  const isAdmin = user?.role === "ADMIN";
  const roleMeta = isAdmin
    ? { label: "Quản Trị Viên", color: "#b8862e", bg: "rgba(184,134,46,0.08)", border: "rgba(184,134,46,0.25)" }
    : { label: "Thành Viên",    color: "#4a9e3f", bg: "rgba(74,158,63,0.08)",  border: "rgba(74,158,63,0.22)"  };

  // ── Render ────────────────────────────────────────────
  return (
    <>
      {/* Progress bar */}
      <div id="progress" style={{ width: `${progress}%` }} />

      <nav
        id="navbar"
        className={scrolled ? "is-scrolled" : ""}
        style={{ boxShadow: scrolled ? "0 8px 32px rgba(13,43,30,0.06)" : "none" }}
      >
        <div className="nav-inner">
          {/* Logo */}
          <Link to="/" className="nav-logo">
            <span className="nav-logo-swap">
              <img src={logoImg}        alt="EARTHORIA" className="nav-logo-full" />
              <img src={logoCompactImg} alt="EARTHORIA" className="nav-logo-compact" />
            </span>
          </Link>

          {/* Nav links (desktop) */}
          <ul className="nav-links">
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className={isActive(link.to) ? "active" : ""}>
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
                {isDark ? <Sun size={16} strokeWidth={1.8} /> : <Moon size={16} strokeWidth={1.8} />}
              </button>

              {/* Wishlist */}
              <Link
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
              <Link
                to="/cart"
                className="nav-icon icon-cart"
                aria-label="Giỏ hàng"
                data-tooltip="Giỏ hàng"
              >
                <ShoppingCart size={16} strokeWidth={1.8} />
                {itemCount > 0 && (
                  <span key={itemCount} className="nav-badge nav-badge-pop">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </Link>
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

                <div className="user-dropdown" style={{ minWidth: "100%", width: "max-content" }}>
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
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          marginTop: "6px",
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
                    </div>
                  </div>

                  <Link to="/profile" className="user-dropdown-item">
                    <User size={16} /> Hồ sơ của tôi
                  </Link>
                  <Link to="/profile" className="user-dropdown-item">
                    <Package size={16} /> Đơn hàng
                  </Link>
                  {isAdmin && (
                    <Link to="/dashboard" className="user-dropdown-item">
                      <User size={16} /> Quản trị
                    </Link>
                  )}
                  <button
                    type="button"
                    className="user-dropdown-item logout"
                    onClick={handleLogout}
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
          {isAdmin && (
            <Link
              to="/dashboard"
              className={`nav-mobile-link ${isActive("/dashboard") ? "active" : ""}`}
            >
              Quản trị
            </Link>
          )}

          <div className="nav-mobile-divider" />

          {isAuthenticated ? (
            <>
              <Link to="/profile" className="nav-mobile-link">
                <User size={15} /> Hồ sơ của tôi
              </Link>
              <Link to="/profile" className="nav-mobile-link">
                <Package size={15} /> Đơn hàng
              </Link>
              <button
                type="button"
                className="nav-mobile-link logout"
                onClick={handleLogout}
              >
                <LogOut size={15} /> Đăng xuất
              </button>
            </>
          ) : (
            <div className="nav-mobile-auth">
              <Link to="/login" style={{ width: "100%" }}>
                <button className="btn-ghost" style={{ width: "100%" }}>Đăng nhập</button>
              </Link>
              <Link to="/register" style={{ width: "100%" }}>
                <button className="btn-primary" style={{ width: "100%" }}>Đăng ký</button>
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
        onLogout={handleLogout}
        getProductLink={(b) => `/books/${b.slug}/${b.hashId}`}
      />
    </>
  );
}