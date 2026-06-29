// AdminLayout.jsx — Shared sidebar layout for all admin pages
import '../../components/assets/css/admin.css'
import { useState, useEffect } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingBag, Users, Tag,
  ChevronRight, ChevronLeft, LogOut, Bell, Menu, X,
  Settings, Search, BarChart2,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { label: 'Dashboard',    href: '/dashboard',             icon: LayoutDashboard },
  { label: 'Sản phẩm',    href: '/dashboard/products',    icon: Package          },
  { label: 'Đơn hàng',    href: '/dashboard/orders',      icon: ShoppingBag      },
  { label: 'Người dùng',  href: '/dashboard/users',       icon: Users            },
  { label: 'Mã giảm giá', href: '/dashboard/coupons',     icon: Tag              },
  { label: 'Analytics',   href: '/dashboard/analytics',   icon: BarChart2        },
]

export default function AdminLayout({ children }) {
  const location    = useLocation()
  const navigate    = useNavigate()
  const currentPath = location.pathname

  const { logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    toast.success('Đã đăng xuất')
    navigate('/')
  }

  const [collapsed, setCollapsed]     = useState(false)
  const [mobileOpen, setMobileOpen]   = useState(false)

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [currentPath])

  // Close mobile sidebar on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setMobileOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const currentLabel = NAV_ITEMS.find(n => n.href === currentPath)?.label ?? 'Dashboard'

  return (
    <div className="admin-root">

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="a-mobile-overlay open"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ══════════════ SIDEBAR ══════════════ */}
      <aside
        className={[
          'a-sidebar',
          collapsed  ? 'collapsed'    : '',
          mobileOpen ? 'mobile-open'  : '',
        ].join(' ')}
        aria-label="Admin navigation"
      >

        {/* Logo row */}
        <div className="a-logo">
          {!collapsed && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="a-logo-mark">E</div>
                <span className="a-logo-name">Earthoria</span>
              </div>
              <button
                className="a-collapse-btn"
                onClick={() => setCollapsed(true)}
                aria-label="Thu gọn sidebar"
              >
                <ChevronLeft size={14} />
              </button>
            </>
          )}
          {collapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div className="a-logo-mark">E</div>
              <button
                className="a-collapse-btn"
                onClick={() => setCollapsed(false)}
                aria-label="Mở rộng sidebar"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Nav section label */}
        <div className="a-nav-section">Điều hướng</div>

        {/* Nav items */}
        <nav className="a-nav" aria-label="Admin menu">
          {NAV_ITEMS.map(item => {
            const Icon   = item.icon
            const active = currentPath === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`a-nav-item${active ? ' active' : ''}`}
                aria-current={active ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className="a-nav-item-icon"
                  size={16}
                  strokeWidth={active ? 2 : 1.6}
                />
                <span className="a-nav-item-label">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="a-sidebar-footer">
          <Link
            to="/dashboard/settings"
            className="a-nav-item"
            title={collapsed ? 'Cài đặt' : undefined}
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
                onClick={handleLogout}
                aria-label="Đăng xuất"
              >
                <LogOut size={12} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ══════════════ MAIN AREA ══════════════ */}
      <div className={`a-main${collapsed ? ' collapsed' : ''}`}>

        {/* Topbar */}
        <header className="a-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="a-topbar-btn"
              aria-label="Mở menu"
              style={{ display: 'none' }} // shown via @media in CSS
            >
              <Menu size={18} />
            </button>

            {/* Breadcrumb */}
            <nav className="a-breadcrumb" aria-label="Breadcrumb">
              <span>Admin</span>
              <ChevronRight size={11} className="a-breadcrumb-sep" aria-hidden="true" />
              <span className="a-breadcrumb-current">{currentLabel}</span>
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
            <div className="a-topbar-avatar" aria-label="Tài khoản admin">A</div>
          </div>
        </header>

        {/* Page content */}
        <main className="a-page">
          {children}
        </main>
      </div>
    </div>
  )
}