// AdminLayout.jsx — Shared layout cho toàn bộ trang admin
import "../../components/assets/css/admin.css";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { ALL_NAV_ITEMS } from "./navConfig";

/**
 * AdminLayout
 *
 * `crumbs` (optional): mảng breadcrumb tùy biến cho từng trang, vd trang
 * chi tiết sách muốn hiện "Sản phẩm / Doraemon tập 1" thay vì chỉ "Dashboard".
 * Format: [{ label: "Sản phẩm", to: "/dashboard/products" }, { label: "Doraemon tập 1" }]
 * Mục cuối cùng (không có `to`) là trang hiện tại, hiển thị đậm.
 * Nếu không truyền, tự suy ra 1 mục duy nhất từ danh sách nav như cũ.
 */
export default function AdminLayout({ children, crumbs }) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  const handleLogout = () => {
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