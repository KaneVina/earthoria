import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function GoogleAuthSuccess() {
  const navigate    = useNavigate()
  const [params]    = useSearchParams()
  const { setAuth } = useAuthStore()
  const handled     = useRef(false) // chặn StrictMode chạy 2 lần

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const token    = params.get('token')
    const id       = params.get('id')
    const name     = params.get('name')
    const email    = params.get('email')
    const avatar   = params.get('avatar')
    const role     = params.get('role')
    // Backend trả về isNew=true nếu vừa tạo tài khoản lần đầu
    const isNew    = params.get('isNew') === 'true'

    if (!token) {
      toast.error('Đăng nhập Google thất bại')
      navigate('/login')
      return
    }

    setAuth({ id, name, email, avatar, role }, token)

    if (isNew) {
      toast.success(`Chào mừng đến với Earthoria, ${name}! 🌿`, { duration: 4000 })
    } else {
      toast.success(`Chào mừng trở lại, ${name}!`)
    }

       if (role === 'ADMIN') {
      navigate('/dashboard', { replace: true })
    } else {
      navigate('/', { replace: true })
    }
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