// Sidebar.jsx — Sidebar admin, menu chia nhóm, mỗi nhóm bấm vào tiêu đề để thu gọn/mở rộng
import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ChevronLeft, ChevronDown, LogOut, Settings } from "lucide-react";
import { NAV_GROUPS } from "../pages/admin/navConfig";

export default function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  currentPath,
  onLogout,
}) {
  // Trạng thái thu gọn của từng NHÓM menu (khác với collapsed toàn bộ sidebar)
  // mặc định tất cả các nhóm đều mở
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const toggleGroup = (groupId) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

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
          to="/dashboard/settings"
          className="a-nav-item"
          title={collapsed ? "Cài đặt" : undefined}
        >
          <Settings size={15} strokeWidth={1.6} className="a-nav-item-icon" />
          <span className="a-nav-item-label">Cài đặt</span>
        </Link>

        <div className="a-avatar-row">
          <div className="a-avatar-circle">A</div>
          {!collapsed && (
            <div className="a-avatar-info" style={{ flex: 1, minWidth: 0 }}>
              <div className="a-avatar-name">Admin</div>
              <div className="a-avatar-email">admin@earthoria.vn</div>
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