import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services/authService'
import toast from 'react-hot-toast'

// Backend (googleCallback) giờ KHÔNG còn nhét token/thông tin user vào query
// string nữa (tránh lộ qua URL/lịch sử trình duyệt/log). Nó chỉ set cookie
// refreshToken (HttpOnly) rồi redirect về đây. Trang này chỉ việc gọi
// /auth/refresh — cookie tự động gửi kèm — để lấy accessToken + user thật.
export default function GoogleAuthSuccess() {
  const navigate    = useNavigate()
  const { setAuth }  = useAuthStore()
  const handled      = useRef(false) // chặn StrictMode chạy 2 lần

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const run = async () => {
      try {
        const res = await authService.refresh()
        const { accessToken, user } = res.data.data
        setAuth(user, accessToken)
        toast.success(`Chào mừng trở lại, ${user.name}!`)

        if (user.role === 'ADMIN') {
          navigate('/dashboard', { replace: true })
        } else {
          navigate('/', { replace: true })
        }
      } catch (err) {
        toast.error('Đăng nhập Google thất bại')
        navigate('/login', { replace: true })
      }
    }

    run()
  }, [])

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', height: '100vh',
      flexDirection: 'column', gap: '16px'
    }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
        stroke="var(--forest)" strokeWidth="1.5"
        style={{ animation: 'spin .7s linear infinite' }}>
        <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
      </svg>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
        Đang xử lý đăng nhập...
      </p>
    </div>
  )
}