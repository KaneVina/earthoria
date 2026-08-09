// Sidebar.jsx — Sidebar admin, menu chia nhóm, mỗi nhóm bấm vào tiêu đề để thu gọn/mở rộng
import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ChevronLeft, ChevronDown, LogOut, User } from "lucide-react";
import { NAV_GROUPS } from "../pages/admin/navConfig";
import { useAuthStore } from "../store/authStore";

// Lấy chữ cái đầu của tên để hiển thị trong avatar tròn khi không có ảnh
function getInitials(user) {
  if (!user) return "A";
  if (user.firstName || user.lastName) {
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "A";
  }
  if (user.name) {
    const parts = user.name.trim().split(/\s+/);
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }
  return "A";
}

export default function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  currentPath,
  onLogout,
}) {
  const user = useAuthStore((s) => s.user);

  // Trạng thái thu gọn của từng NHÓM menu (khác với collapsed toàn bộ sidebar)
  // mặc định tất cả các nhóm đều mở
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const toggleGroup = (groupId) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const displayName = user?.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Chưa đăng nhập";
  const displayEmail = user?.email || "—";
  const initials = getInitials(user);

  return (
    <aside
      className={[
        "a-sidebar",
        collapsed ? "collapsed" : "",
        mobileOpen ? "mobile-open" : "",
      ].join(" ")}
      aria-label="Admin navigation"
    >
      {/* Logo row */}
      <div className="a-logo">
        {!collapsed && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img
                src="/logo-dai-trang.png"
                alt="Earthoria"
                className="a-logo-img"
                style={{ height: 32, width: "auto" }}
              />
            </div>
            <button
              className="a-collapse-btn"
              onClick={() => onToggleCollapsed(true)}
              aria-label="Thu gọn sidebar"
            >
              <ChevronLeft size={14} />
            </button>
          </>
        )}
        {collapsed && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <img
              src="/logo-ngan-trang.png"
              alt="Earthoria"
              className="a-logo-img"
              style={{ height: 28, width: "auto" }}
            />
            <button
              className="a-collapse-btn"
              onClick={() => onToggleCollapsed(false)}
              aria-label="Mở rộng sidebar"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Nav groups */}
      <nav className="a-nav" aria-label="Admin menu">
        {NAV_GROUPS.map((group) => {
          const isGroupCollapsed = !!collapsedGroups[group.id];
          return (
            <div key={group.id} className="a-nav-group">
              {/* Tiêu đề nhóm — ẩn khi sidebar đang ở dạng icon-only */}
              {!collapsed && (
                <button
                  type="button"
                  className="a-nav-section a-nav-group-header"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={!isGroupCollapsed}
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    size={13}
                    className={`a-nav-group-chevron${isGroupCollapsed ? " rotated" : ""}`}
                  />
                </button>
              )}

              {/* Danh sách item trong nhóm — luôn hiện nếu sidebar collapsed (icon-only),
                  ngược lại chỉ hiện khi nhóm đang mở */}
              {(collapsed || !isGroupCollapsed) &&
                group.items.map((item) => {
                  const Icon = item.icon;
                  const active = currentPath === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`a-nav-item${active ? " active" : ""}`}
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon
                        className="a-nav-item-icon"
                        size={16}
                        strokeWidth={active ? 2 : 1.6}
                      />
                      <span className="a-nav-item-label">{item.label}</span>
                    </Link>
                  );
                })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="a-sidebar-footer">
        <Link
          to="/dashboard/profile"
          className="a-nav-item"
          title={collapsed ? "Hồ sơ cá nhân" : undefined}
        >
          <User size={15} strokeWidth={1.6} className="a-nav-item-icon" />
          <span className="a-nav-item-label">Hồ sơ cá nhân</span>
        </Link>

        <div className="a-avatar-row">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={displayName}
              className="a-avatar-circle"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div className="a-avatar-circle">{initials}</div>
          )}
          {!collapsed && (
            <div className="a-avatar-info" style={{ flex: 1, minWidth: 0 }}>
              <div className="a-avatar-name" title={displayName}>{displayName}</div>
              <div className="a-avatar-email" title={displayEmail}>{displayEmail}</div>
            </div>
          )}
          {!collapsed && (
            <button
              className="a-collapse-btn"
              onClick={onLogout}
              aria-label="Đăng xuất"
            >
              <LogOut size={12} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}