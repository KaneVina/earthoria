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
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";
import { useWishlistStore } from "../../store/wishlistStore";
import { useTheme } from "../../hooks/useTheme";
import toast from "react-hot-toast";
import logoImg from "../../assets/img/logoBT-ngangtext.png";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { itemCount, fetchCart } = useCartStore();
  const { wishlistCount, fetchWishlist } = useWishlistStore();
  const { isDark, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

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

      // Progress bar
      const height =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      setProgress(height > 0 ? (scrollY / height) * 100 : 0);
    };
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Đóng menu mobile mỗi khi chuyển trang
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  const handleLogout = () => {
    logout();
    toast.success("Đã đăng xuất");
    navigate("/");
  };

  const isActive = (to) => {
    const [path, query] = to.split("?");
    if (query) {
      return location.pathname === path && location.search === `?${query}`;
    }
    return location.pathname === path && location.search === "";
  };

  const navLinks = [
    { to: "/shop", label: "Cửa hàng" },
    { to: "/shop?hasAR=true", label: "Sách AR" },
    { to: "/technology", label: "Công nghệ" },
    { to: "/about", label: "Về chúng tôi" },
  ];

  const firstLetter = user?.name?.trim()?.charAt(0)?.toUpperCase() || "?";

  return (
    <>
      {/* Progress bar */}
      <div id="progress" style={{ width: `${progress}%` }} />

      <nav
        id="navbar"
        style={{
          boxShadow: scrolled ? "0 8px 32px rgba(13,43,30,0.06)" : "none",
        }}
      >
        <div className="nav-inner">
          {/* Logo */}
          <Link to="/" className="nav-logo">
            <img
              src={logoImg}
              alt="EARTHORIA Logo"
              style={{ height: "32px", width: "auto", display: "block" }}
            />
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
            {user?.role === "ADMIN" && (
              <li>
                <Link
                  to="/admin"
                  className={isActive("/admin") ? "active" : ""}
                >
                  Admin
                </Link>
              </li>
            )}
          </ul>

          {/* Actions */}
          <div className="nav-actions">
            <button
              className="nav-icon"
              onClick={toggleTheme}
              title="Chế độ sáng/tối"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="nav-icon"
              style={{
                position: "relative",
                textDecoration: "none",
                color: "inherit",
              }}
              title="Sản phẩm yêu thích"
            >
              <Heart
                size={16}
                fill={wishlistCount > 0 ? "var(--gold)" : "none"}
                color={wishlistCount > 0 ? "var(--gold)" : "currentColor"}
              />
              {wishlistCount > 0 && (
                <span className="nav-badge">{wishlistCount}</span>
              )}
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="nav-icon"
              style={{
                position: "relative",
                textDecoration: "none",
                color: "inherit",
              }}
              title="Giỏ hàng"
            >
              <ShoppingCart size={16} />
              {itemCount > 0 && <span className="nav-badge">{itemCount}</span>}
            </Link>

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

                <div className="user-dropdown">
                  <div className="user-dropdown-header">
                    <span className="user-dropdown-avatar">{firstLetter}</span>
                    <div>
                      <div className="user-dropdown-name">{user?.name}</div>
                      {user?.email && (
                        <div className="user-dropdown-email">{user.email}</div>
                      )}
                    </div>
                  </div>
                  <Link to="/profile" className="user-dropdown-item">
                    <User size={16} /> Hồ sơ của tôi
                  </Link>
                  <Link to="/orders" className="user-dropdown-item">
                    <Package size={16} /> Đơn hàng
                  </Link>
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
          {user?.role === "ADMIN" && (
            <Link
              to="/admin"
              className={`nav-mobile-link ${isActive("/admin") ? "active" : ""}`}
            >
              Admin
            </Link>
          )}

          <div className="nav-mobile-divider" />

          {isAuthenticated ? (
            <>
              <Link to="/profile" className="nav-mobile-link">
                <User size={15} /> Hồ sơ của tôi
              </Link>
              <Link to="/orders" className="nav-mobile-link">
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
    </>
  );
}