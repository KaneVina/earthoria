import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, Heart, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";
import { useTheme } from "../../hooks/useTheme";
import toast from "react-hot-toast";
import logoImg from "../../assets/img/logo-ngang.png";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { itemCount, fetchCart } = useCartStore();
  const { isDark, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isAuthenticated) fetchCart();
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

  const handleLogout = () => {
    logout();
    toast.success("Đã đăng xuất");
    navigate("/");
  };

 const isActive = (to) => {
  const [path, query] = to.split('?')
  if (query) {
    return location.pathname === path && location.search === `?${query}`
  }
  return location.pathname === path && location.search === ''
}

  const navLinks = [
    { to: "/shop", label: "Cửa hàng" },
    { to: "/shop?hasAR=true", label: "Sách AR" },
    { to: "/technology", label: "Công nghệ" },
    { to: "/about", label: "Về chúng tôi" },
  ];

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
              style={{ height: "48px", width: "auto", display: "block" }}
            />
          </Link>

          {/* Nav links */}
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
            <span
              style={{
                fontSize: "10px",
                letterSpacing: "0.12em",
                color: "var(--text-muted)",
                cursor: "pointer",
              }}
            >
              VI / EN
            </span>

            {/* Theme toggle */}
            <button
              className="nav-icon"
              onClick={toggleTheme}
              title="Chế độ sáng/tối"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Wishlist */}
            <button className="nav-icon">
              <Heart size={16} />
            </button>

            {/* Cart */}
            <Link
              to="/cart"
              className="nav-icon"
              style={{
                position: "relative",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <ShoppingCart size={16} />
              {itemCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "6px",
                    right: "6px",
                    width: "15px",
                    height: "15px",
                    background: "var(--gold)",
                    borderRadius: "50%",
                    fontSize: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--ivory)",
                    fontWeight: 500,
                    lineHeight: 1,
                  }}
                >
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Auth */}
            {isAuthenticated ? (
              <>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {user?.name}
                </span>
                <button className="btn-ghost" onClick={handleLogout}>
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <button className="btn-ghost">Đăng nhập</button>
                </Link>
                <Link to="/register">
                  <button className="btn-primary">Đăng ký</button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
