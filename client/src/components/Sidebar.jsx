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

// Chọn logo sidebar theo trang hiện tại
function getSidebarLogo(currentPath) {
  const path = currentPath || "";
  if (path.startsWith("/dashboard/ar-codes")) {
    return "/logo/logo-mau/lg-m-im.png"; // Trang QR
  }
  if (path.startsWith("/dashboard/games")) {
    return "/logo/logo-mau/lg-m-game-studio.png"; // Trang Game
  }
  return "/logo/logo-mau/lg-m-chinh.png"; // Mặc định
}

export default function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  currentPath,
  onLogout,
}) {
  const user = useAuthStore((s) => s.user);
  const viewerRole = user?.role; // 'ADMIN' | 'STAFF'

  // Trạng thái thu gọn của từng NHÓM menu (khác với collapsed toàn bộ sidebar)
  // mặc định tất cả các nhóm đều mở
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const toggleGroup = (groupId) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const displayName = user?.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Chưa đăng nhập";
  const displayEmail = user?.email || "—";
  const initials = getInitials(user);
  const sidebarLogo = getSidebarLogo(currentPath);

  // Khi sidebar đang thu gọn: chỉ tự mở rộng khi bấm đúng vào NỀN TRỐNG của aside.
  // e.target === e.currentTarget nghĩa là sự kiện click xuất phát trực tiếp từ chính
  // thẻ <aside>, không phải "nổi bọt" lên từ một link/button con bên trong.
  // Nhờ vậy không còn phụ thuộc việc MỌI phần tử con phải tự gọi stopPropagation
  // (trước đây chỉ cần 1 item quên gọi là bug tự bật sidebar sẽ xảy ra lại).
  const handleSidebarClick = (e) => {
    if (collapsed && e.target === e.currentTarget) {
      onToggleCollapsed(false);
    }
  };

  // Chặn không cho click trên link/nút lan lên tới handleSidebarClick ở trên
  // (giữ lại như một lớp phòng vệ thêm, không bắt buộc nhưng vô hại)
  const stopBubble = (e) => e.stopPropagation();

  // Tooltip cho icon khi sidebar thu gọn — định vị bằng toạ độ thật của icon
  // (position: fixed) nên không bao giờ bị viền/scroll của sidebar cắt mất.
  const [tooltip, setTooltip] = useState(null); // { label, top, left } | null

  const showTooltip = (label) => (e) => {
    if (!collapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      label,
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
    });
  };

  const hideTooltip = () => setTooltip(null);

  return (
    <>
    <aside
      className={[
        "a-sidebar",
        collapsed ? "collapsed" : "",
        mobileOpen ? "mobile-open" : "",
      ].join(" ")}
      aria-label="Admin navigation"
      onClick={handleSidebarClick}
    >
      {/* Logo row */}
      <div className="a-logo">
        {!collapsed && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img
                src={sidebarLogo}
                alt="Earthoria"
                className="a-logo-img"
                style={{ height: 32, width: "auto" }}
              />
            </div>
            <button
              className="a-collapse-btn"
              onClick={(e) => { stopBubble(e); onToggleCollapsed(true); }}
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
              src="/logo-nho.png"
              alt="Earthoria"
              className="a-logo-img"
              style={{ height: 28, width: "auto" }}
            />
            <button
              className="a-collapse-btn"
              onClick={(e) => { stopBubble(e); onToggleCollapsed(false); }}
              aria-label="Mở rộng sidebar"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Nav groups — lọc item theo role trước khi render; nhóm không còn item nào thì ẩn cả nhóm */}
      <nav className="a-nav" aria-label="Admin menu">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.roles || item.roles.includes(viewerRole)
          );
          if (visibleItems.length === 0) return null;

          const isGroupCollapsed = !!collapsedGroups[group.id];
          return (
            <div key={group.id} className="a-nav-group">
              {/* Tiêu đề nhóm — ẩn khi sidebar đang ở dạng icon-only */}
              {!collapsed && (
                <button
                  type="button"
                  className="a-nav-section a-nav-group-header"
                  onClick={(e) => { stopBubble(e); toggleGroup(group.id); }}
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
                visibleItems.map((item) => {
                  const Icon = item.icon;
                  const active = currentPath === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`a-nav-item${active ? " active" : ""}`}
                      aria-current={active ? "page" : undefined}
                      onMouseEnter={showTooltip(item.label)}
                      onMouseLeave={hideTooltip}
                      onClick={stopBubble}
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
          onMouseEnter={showTooltip("Hồ sơ cá nhân")}
          onMouseLeave={hideTooltip}
          onClick={stopBubble}
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
              onClick={(e) => { stopBubble(e); onLogout(); }}
              aria-label="Đăng xuất"
            >
              <LogOut size={12} />
            </button>
          )}
        </div>
      </div>
    </aside>

    {tooltip && (
      <div
        className="a-sidebar-tooltip"
        style={{ top: tooltip.top, left: tooltip.left }}
      >
        {tooltip.label}
      </div>
    )}
    </>
  );
}