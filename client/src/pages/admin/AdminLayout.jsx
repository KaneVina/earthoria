// AdminLayout.jsx — Shared layout cho toàn bộ trang admin
import "../../components/assets/css/admin.css";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { authService } from "../../services/authService";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { ALL_NAV_ITEMS } from "./navConfig";

export default function AdminLayout({ children, crumbs }) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

 const handleLogout = async () => {
  try {
    await authService.logout(); // gọi POST /auth/logout — clear cookie + revoke token ở DB
  } catch (err) {
    console.error("Logout API failed:", err);
  }
  logout();
  queryClient.clear();
  toast.success("Đã đăng xuất");
  navigate("/");
};

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [currentPath]);

  // Close mobile sidebar on Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const currentLabel =
    ALL_NAV_ITEMS.find((n) => n.href === currentPath)?.label ?? "Dashboard";

  const breadcrumbItems = crumbs && crumbs.length ? crumbs : [{ label: currentLabel }];

  return (
    <div className="admin-root">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="a-mobile-overlay open"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        currentPath={currentPath}
        onLogout={handleLogout}
      />

      <div className={`a-main${collapsed ? " collapsed" : ""}`}>
        <Topbar
          breadcrumbItems={breadcrumbItems}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />
        <main className="a-page">{children}</main>
      </div>
    </div>
  );
}