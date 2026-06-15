import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ShoppingCart, Heart, Moon, Sun, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'
import { useTheme } from '../../hooks/useTheme'
import toast from 'react-hot-toast'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { itemCount, fetchCart } = useCartStore()
  const { isDark, toggleTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (isAuthenticated) fetchCart()
  }, [isAuthenticated])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const handleLogout = () => {
    logout()
    toast.success('Đã đăng xuất')
    navigate('/')
  }

  const navLinks = [
    { to: '/shop', label: 'Cửa hàng' },
    { to: '/shop?hasAR=true', label: 'Sách AR' },
    { to: '/about', label: 'Về chúng tôi' }
  ]

  return (
    <nav id="navbar" style={{ boxShadow: scrolled ? '0 8px 32px rgba(13,43,30,0.06)' : 'none' }}>
      <div className="nav-inner">
        <Link to="/" className="nav-logo">
          <div className="nav-logo-mark">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L14 8L8 14L2 8L8 2Z" stroke="#4a9e3f" strokeWidth="1" fill="none"/>
              <path d="M8 5L11 8L8 11L5 8L8 5Z" fill="#4a9e3f"/>
            </svg>
          </div>
          <span className="nav-wordmark">EARTHORIA</span>
        </Link>

        <ul className="nav-links">
          {navLinks.map(link => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={location.pathname === link.to ? 'active' : ''}
              >
                {link.label}
              </Link>
            </li>
          ))}
          {user?.role === 'ADMIN' && (
            <li><Link to="/admin">Admin</Link></li>
          )}
        </ul>

        <div className="nav-actions">
          <span style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text-muted)', cursor: 'pointer' }}>
            VI / EN
          </span>

          <button className="nav-icon" onClick={toggleTheme}>
            {isDark
              ? <Sun size={16} />
              : <Moon size={16} />
            }
          </button>

          <button className="nav-icon">
            <Heart size={16} />
          </button>

          <Link to="/cart" className="nav-icon" style={{ position: 'relative', textDecoration: 'none' }}>
            <ShoppingCart size={16} />
            {itemCount > 0 && (
              <span style={{
                position: 'absolute', top: '6px', right: '6px',
                width: '15px', height: '15px',
                background: 'var(--gold)', borderRadius: '50%',
                fontSize: '8px', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: 'var(--ivory)', fontWeight: 500
              }}>
                {itemCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {user?.name}
              </span>
              <button className="btn-ghost" onClick={handleLogout}>
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link to="/login"><button className="btn-ghost">Đăng nhập</button></Link>
              <Link to="/register"><button className="btn-primary">Đăng ký</button></Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}