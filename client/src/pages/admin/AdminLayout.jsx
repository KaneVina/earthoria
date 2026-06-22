// AdminLayout.jsx — Shared sidebar layout for all admin pages
import { useState } from 'react'
import {
  LayoutDashboard, Package, ShoppingBag, Users, Tag,
  ChevronRight, LogOut, Bell, Menu, X, Settings
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard',     href: '/admin',          icon: LayoutDashboard },
  { label: 'Sản phẩm',     href: '/admin/products', icon: Package },
  { label: 'Đơn hàng',     href: '/admin/orders',   icon: ShoppingBag },
  { label: 'Người dùng',   href: '/admin/users',    icon: Users },
  { label: 'Mã giảm giá',  href: '/admin/coupons',  icon: Tag },
]

export default function AdminLayout({ children, currentPath = '/admin' }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F6F2', fontFamily: 'Be Vietnam Pro, sans-serif' }}>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 40 }}
        />
      )}

      {/* ══════════════ SIDEBAR ══════════════ */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        width: collapsed ? 72 : 240,
        background: '#0D3330',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.22s cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden',
        boxShadow: '4px 0 24px rgba(0,0,0,0.12)'
      }}>

        {/* Logo row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '24px 0' : '24px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          minHeight: 72, flexShrink: 0
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, background: 'linear-gradient(135deg, #C9A84C 0%, #E8C97A 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontFamily: 'Playfair Display, serif', color: '#0D3330', fontWeight: 700,
                flexShrink: 0
              }}>E</div>
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, color: '#F0EDE6', letterSpacing: '0.04em', fontWeight: 400 }}>
                Earthoria
              </span>
            </div>
          )}
          {collapsed && (
            <div style={{
              width: 34, height: 34, background: 'linear-gradient(135deg, #C9A84C 0%, #E8C97A 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontFamily: 'Playfair Display, serif', color: '#0D3330', fontWeight: 700,
            }}>E</div>
          )}
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} style={iconBtnStyle}>
              <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <button onClick={() => setCollapsed(false)} style={{ ...iconBtnStyle, margin: '12px auto 0', display: 'flex' }}>
            <ChevronRight size={14} />
          </button>
        )}

        {/* Nav section label */}
        {!collapsed && (
          <div style={{ padding: '24px 20px 8px', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
            Điều hướng
          </div>
        )}

        {/* Nav items */}
        <nav style={{ flex: 1, padding: collapsed ? '16px 0' : '0 12px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const active = currentPath === item.href
            return (
              <a key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  gap: 12,
                  padding: collapsed ? '11px 0' : '10px 12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRadius: 6,
                  background: active ? 'rgba(201,168,76,0.15)' : 'transparent',
                  color: active ? '#C9A84C' : 'rgba(240,237,230,0.6)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  position: 'relative',
                  fontWeight: active ? 500 : 400,
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#F0EDE6' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; if (!active) e.currentTarget.style.color = 'rgba(240,237,230,0.6)' }}
                >
                  {/* Active indicator */}
                  {active && (
                    <div style={{ position: 'absolute', left: -12, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, background: '#C9A84C', borderRadius: '0 2px 2px 0' }} />
                  )}
                  <Icon size={16} strokeWidth={active ? 2 : 1.5} />
                  {!collapsed && (
                    <span style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{item.label}</span>
                  )}
                </div>
              </a>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: collapsed ? '16px 0' : '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <a href="/admin/settings" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: collapsed ? '10px 0' : '10px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: 6, color: 'rgba(240,237,230,0.45)',
              cursor: 'pointer', fontSize: 13,
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#F0EDE6' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(240,237,230,0.45)' }}
            >
              <Settings size={15} strokeWidth={1.5} />
              {!collapsed && <span>Cài đặt</span>}
            </div>
          </a>

          {/* Admin avatar row */}
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 12px 4px', marginTop: 4 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(201,168,76,0.2)', border: '1px solid rgba(201,168,76,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#C9A84C', fontFamily: 'Playfair Display,serif', flexShrink: 0 }}>A</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: 'rgba(240,237,230,0.8)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Admin</div>
                <div style={{ fontSize: 10, color: 'rgba(240,237,230,0.35)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>admin@earthoria.vn</div>
              </div>
              <button style={{ ...iconBtnStyle, flexShrink: 0 }}>
                <LogOut size={12} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ══════════════ MAIN AREA ══════════════ */}
      <div style={{ flex: 1, marginLeft: collapsed ? 72 : 240, transition: 'margin-left 0.22s cubic-bezier(.4,0,.2,1)', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Topbar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 30,
          height: 60, background: 'rgba(247,246,242,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(13,51,48,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Mobile menu */}
            <button onClick={() => setMobileOpen(true)} style={{ display: 'none', border: 'none', background: 'none', cursor: 'pointer', color: '#0D3330' }}>
              <Menu size={20} />
            </button>
            {/* Breadcrumb */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(13,51,48,0.45)' }}>
              <span>Admin</span>
              <ChevronRight size={12} />
              <span style={{ color: '#0D3330', fontWeight: 500 }}>
                {NAV_ITEMS.find(n => n.href === currentPath)?.label || 'Dashboard'}
              </span>
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={{ position: 'relative', ...iconBtnDark }}>
              <Bell size={16} />
              <span style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, background: '#C9A84C', borderRadius: '50%' }} />
            </button>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0D3330', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#C9A84C', fontFamily: 'Playfair Display,serif', cursor: 'pointer' }}>A</div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '36px 40px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

const iconBtnStyle = {
  width: 28, height: 28, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4,
  background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'rgba(240,237,230,0.5)', transition: 'all 0.15s',
}
const iconBtnDark = {
  width: 34, height: 34, border: '1px solid rgba(13,51,48,0.12)', borderRadius: 6,
  background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'rgba(13,51,48,0.5)', transition: 'all 0.15s', position: 'relative',
}