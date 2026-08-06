import { Fragment } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Menu, Search, Bell } from "lucide-react";

export default function Topbar({ breadcrumbItems, onOpenMobileMenu }) {
  return (
    <header className="a-topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button
          onClick={onOpenMobileMenu}
          className="a-topbar-btn a-menu-trigger"
          aria-label="Mở menu"
        >
          <Menu size={18} />
        </button>

        {/* Breadcrumb */}
        <nav className="a-breadcrumb" aria-label="Breadcrumb">
          <span>Admin</span>
          {breadcrumbItems.map((c, i) => {
            const isLast = i === breadcrumbItems.length - 1;
            return (
              <Fragment key={`${c.label}-${i}`}>
                <ChevronRight size={11} className="a-breadcrumb-sep" aria-hidden="true" />
                {!isLast && c.to ? (
                  <Link to={c.to} className="a-breadcrumb-link">
                    {c.label}
                  </Link>
                ) : (
                  <span className={isLast ? "a-breadcrumb-current" : ""}>{c.label}</span>
                )}
              </Fragment>
            );
          })}
        </nav>
      </div>

      <div className="a-topbar-actions">
        <button className="a-topbar-btn" aria-label="Tìm kiếm">
          <Search size={15} />
        </button>
        <button className="a-topbar-btn" aria-label="Thông báo">
          <Bell size={15} />
          <span className="a-topbar-badge" aria-hidden="true" />
        </button>
        <div className="a-topbar-avatar" aria-label="Tài khoản admin">
          A
        </div>
      </div>
    </header>
  );
}